import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { showToast } from '../../../../../services/toast';
import { evaluateEnableWhen } from '../../../../ayu-library/logic/enable-when.logic';
import { validateQuestion } from '../../../../ayu-library/logic/validation.logic';
import type {
  AyuAnswerValue,
  AyuQuestion,
  FhirQuestionnaire,
} from '../../../../ayu-library/types/ayu.types';
import {
  EXT_URL_PE_OPTION_KIND,
  FHIR_TYPE_CHOICE,
  FHIR_TYPE_DATE,
  FHIR_TYPE_GROUP,
  FHIR_TYPE_INTEGER,
  FHIR_TYPE_QUANTITY,
  FHIR_TYPE_STRING,
  PE_OPTION_KIND_CAMERA,
  getBPRangeFromText,
} from '../../../../ayu-library/utils/constants';
import {
  collectDescendantLinkIds,
  getRowLabel,
} from '../../../../ayu-library/utils/question.utils';
import iconYes from '../../../assets/yes.svg';
import { useFHIRStepper } from '../../../hooks/useFHIRStepper.hook';
import {
  ASSOCIATED_SYMPTOMS_COMPONENT,
  PHYSICAL_EXAM_OPTIONS_COMPONENT,
  resolveAyuComponent,
} from '../../../pages/decision-matrix';
import {
  BUTTON_SKIP,
  BUTTON_SUBMIT,
  SUMMARY_ITEM_TYPE_LABEL_VALUE,
  validationMessageForReason,
} from '../../../utils/ayu.constants';
import { buildVisitSummary } from '../../../utils/visit-summary.util';
import AyuButton from '../../common/ayu-button.component';
import { QuestionLoader } from '../../loaders/question-loader.component';
import { AyuNestedRenderer } from './ayu-nested-renderer.component';
import { AyuRenderer } from './ayu-renderer.component';

const getOptionDisplay = (item: AyuQuestion, code: string): string | null => {
  const opt = item.answerOption?.find(
    o => o.valueCoding?.code === code || o.valueString === code
  );
  return opt?.valueCoding?.display || opt?.valueString || code;
};

const formatAnswerValue = (
  item: AyuQuestion,
  answer: AyuAnswerValue | undefined
): string | null => {
  if (answer === undefined || answer === null || answer === '') return null;

  if (Array.isArray(answer)) {
    if (!item.answerOption) return null;
    const values = answer
      .map(c => (typeof c === 'string' ? getOptionDisplay(item, c) : null))
      .filter((v): v is string => !!v);
    return values.length ? values.join(', ') : null;
  }

  if (typeof answer === 'object') {
    if ('dropdownValues' in answer) {
      const { number, days } =
        (answer as { dropdownValues?: { number?: string; days?: string } })
          .dropdownValues ?? {};
      if (number) return days ? `${number} ${days}` : String(number);
      return null;
    }
    if ('low' in answer || 'high' in answer) {
      const { low, high } = answer as { low?: number; high?: number };
      if (low != null && high != null) return `${low} - ${high}`;
      if (low != null) return String(low);
      if (high != null) return String(high);
      return null;
    }
    if ('value' in answer) {
      const { value, unit } = answer as { value?: unknown; unit?: string };
      if (value != null && value !== '') {
        return unit ? `${value} ${unit}` : String(value);
      }
    }
    return null;
  }

  if (typeof answer === 'string') {
    if (item.type === FHIR_TYPE_CHOICE && item.answerOption) {
      return getOptionDisplay(item, answer);
    }
    return answer;
  }

  if (typeof answer === 'number') return String(answer);

  return null;
};

const isPlaceholderText = (text: string): boolean =>
  /^\s*\[.*\]\s*$/.test(text);

const hasNestedBPInputs = (question: AyuQuestion): boolean => {
  if (!question.item?.length) return false;
  return question.item.some(
    child =>
      (child.type === FHIR_TYPE_INTEGER || child.type === FHIR_TYPE_STRING) &&
      getBPRangeFromText(child.text) !== undefined
  );
};

/** True when a PE question has only one non-camera regular option (auto-selected). */
const isSingleOptionPE = (question: AyuQuestion): boolean => {
  if (resolveAyuComponent(question) !== PHYSICAL_EXAM_OPTIONS_COMPONENT)
    return false;
  const allOpts = question.answerOption ?? [];
  const regularCount = allOpts.filter(
    o =>
      !o.extension?.some(
        ext =>
          ext.url === EXT_URL_PE_OPTION_KIND &&
          ext.valueString === PE_OPTION_KIND_CAMERA
      )
  ).length;
  return regularCount === 1;
};

const isChildVisible = (
  enableWhen: AyuQuestion['enableWhen'],
  answers: Record<string, AyuAnswerValue>,
  bypassedContainers: ReadonlySet<string>
): boolean => {
  if (!enableWhen) return true;
  const effectiveRules = enableWhen.filter(
    ew => !bypassedContainers.has(ew.question)
  );
  return effectiveRules.length > 0
    ? evaluateEnableWhen(effectiveRules, answers)
    : true;
};

const getBranchQualifier = (
  child: AyuQuestion,
  parent: AyuQuestion | undefined,
  answers: Record<string, AyuAnswerValue>
): string | undefined => {
  if (!parent?.answerOption?.length) return undefined;

  const parentAnswer = answers[parent.linkId];
  if (!Array.isArray(parentAnswer) || parentAnswer.length < 2) return undefined;

  const code = child.enableWhen?.find(
    rule => rule.question === parent.linkId && rule.answerCoding?.code
  )?.answerCoding?.code;
  if (!code || !parentAnswer.includes(code)) return undefined;

  const option = parent.answerOption.find(
    opt => opt.valueCoding?.code === code || opt.valueString === code
  );
  return option?.valueCoding?.display || option?.valueString || undefined;
};

const collectAnsweredRows = (
  items: AyuQuestion[] | undefined,
  answers: Record<string, AyuAnswerValue>,
  parent?: AyuQuestion,
  branchOptionDisplay?: string,
  bypassedContainers: ReadonlySet<string> = new Set(),
  branchQualifier?: string
): { label: string; value: string }[] => {
  if (!items) return [];
  const rows: { label: string; value: string }[] = [];
  const SEPARATORS = [' - ', ' – ', ' — ', ': ', ' : '] as const;
  for (const child of items) {
    if (!isChildVisible(child.enableWhen, answers, bypassedContainers))
      continue;

    /*
     * Determine the branch display to carry into this child's descendants.
     * When a GROUP container (no answerOption / no stored value) sits between
     * the originating choice question and composite sub-items ("Yes - When"),
     * we propagate the option display ("Yes") so the prefix can still be
     * stripped at a deeper level even when the enableWhen reference skips the
     * intermediate GROUP.
     */
    let nextBranchDisplay: string | undefined;
    if (parent && child.enableWhen?.length) {
      const rule = child.enableWhen![0];
      if (rule.question === parent.linkId) {
        const expected =
          rule.answerBoolean ??
          rule.answerString ??
          rule.answerInteger ??
          rule.answerCoding?.code;
        const opt = parent.answerOption?.find(
          o => o.valueCoding?.code === expected || o.valueString === expected
        );
        const optDisplay = opt?.valueCoding?.display || opt?.valueString;
        if (optDisplay) {
          const lbl = getRowLabel(child);
          if (
            lbl === optDisplay ||
            SEPARATORS.some(sep => lbl.startsWith(optDisplay + sep))
          ) {
            nextBranchDisplay = optDisplay;
          }
        }
      }
    }
    if (!nextBranchDisplay && branchOptionDisplay != null) {
      nextBranchDisplay = branchOptionDisplay;
    }

    const childQualifier =
      branchQualifier ?? getBranchQualifier(child, parent, answers);

    const value = formatAnswerValue(child, answers[child.linkId]);
    if (value && !isPlaceholderText(value)) {
      const label = getRowLabel(child);

      /*
       * Detect whether this child's label is either:
       *   (a) an exact match of the parent answer option display ("Yes"), or
       *   (b) a path-composite label that prefixes the option display with a
       *       separator ("Yes - When", "Yes – When", "Yes: When").
       *
       * In both cases the option name is already shown as the primary value,
       * so it is redundant in the nested row.
       *
       * – With nested items (branching container): suppress the row entirely;
       *   the children produce the actual detail rows.
       * – Without nested items (leaf that directly holds the answer) and a
       *   composite label: strip the redundant prefix so "Yes - When" renders
       *   as just "When".
       *
       * Check 1 – direct parent has the matching answerOption entry.
       * Check 2 – fallback to `branchOptionDisplay` when the immediate parent
       *           is a GROUP (no answerOption) or enableWhen skips an ancestor.
       */
      let effectiveLabel = label;
      let hasOptionPrefix = false;

      if (parent && child.enableWhen?.length) {
        const rule = child.enableWhen![0];
        if (rule.question === parent.linkId) {
          const expected =
            rule.answerBoolean ??
            rule.answerString ??
            rule.answerInteger ??
            rule.answerCoding?.code;
          const opt = parent.answerOption?.find(
            o => o.valueCoding?.code === expected || o.valueString === expected
          );
          const optDisplay =
            opt?.valueCoding?.display || opt?.valueString || null;

          if (optDisplay != null) {
            if (optDisplay === label) {
              hasOptionPrefix = true;
              /* effectiveLabel stays as-is for exact matches (handled below) */
            } else {
              for (const sep of SEPARATORS) {
                if (label.startsWith(optDisplay + sep)) {
                  hasOptionPrefix = true;
                  effectiveLabel =
                    label.slice(optDisplay.length + sep.length).trim() || label;
                  break;
                }
              }
            }
          }
        }
      }

      /*
       * Check 2: parent is a GROUP without answerOption, or enableWhen
       * references a non-immediate ancestor — use propagated branch display.
       */
      if (!hasOptionPrefix && branchOptionDisplay != null) {
        if (branchOptionDisplay === label) {
          hasOptionPrefix = true;
        } else {
          for (const sep of SEPARATORS) {
            if (label.startsWith(branchOptionDisplay + sep)) {
              hasOptionPrefix = true;
              effectiveLabel =
                label.slice(branchOptionDisplay.length + sep.length).trim() ||
                label;
              break;
            }
          }
        }
      }

      /*
       * Check 3: strip branchOptionDisplay prefix from effectiveLabel even when
       * Check 1 matched exactly (optDisplay === label), leaving effectiveLabel
       * as the full composite label (e.g. "Yes - When"). The branch option ("Yes")
       * is already shown as the primary value; reduce the label to just "When".
       */
      if (branchOptionDisplay) {
        for (const sep of SEPARATORS) {
          if (effectiveLabel.startsWith(branchOptionDisplay + sep)) {
            effectiveLabel =
              effectiveLabel
                .slice(branchOptionDisplay.length + sep.length)
                .trim() || effectiveLabel;
            break;
          }
        }
      }

      /*
       * Suppress the row when it is a branching container (has nested items).
       * For leaf containers with a composite prefix, the prefix is already
       * stripped from effectiveLabel above so the row renders as "When: …".
       */
      const isRedundantContainer = hasOptionPrefix && !!child.item?.length;

      const qualifiedLabel =
        childQualifier &&
        effectiveLabel &&
        !effectiveLabel.startsWith(childQualifier)
          ? `${childQualifier} - ${effectiveLabel}`
          : effectiveLabel;

      if (!isRedundantContainer) {
        if (qualifiedLabel && qualifiedLabel !== value) {
          rows.push({ label: qualifiedLabel, value });
        } else if (!qualifiedLabel) {
          rows.push({ label: '', value });
        }
      }
    }
    const childBypassedContainers: ReadonlySet<string> =
      child.type === FHIR_TYPE_CHOICE &&
      !!child.answerOption?.length &&
      !!child.item?.length &&
      answers[child.linkId] === undefined
        ? new Set([...bypassedContainers, child.linkId])
        : bypassedContainers;
    rows.push(
      ...collectAnsweredRows(
        child.item,
        answers,
        child,
        nextBranchDisplay,
        childBypassedContainers,
        childQualifier
      )
    );
  }
  return rows;
};

const ChevronBullet = () => (
  <span className="inline-flex w-5 h-5 rounded-full bg-[#E5FFF3] items-center justify-center shrink-0 mt-0.5">
    <svg width="8" height="8" viewBox="0 0 16 16" fill="#0FD197">
      <path d="M5 3 L11 8 L5 13 Z" />
    </svg>
  </span>
);

const AyuAnsweredDisplay = ({
  question,
  answers,
  isSkipped = false,
}: {
  question: AyuQuestion;
  answers: Record<string, AyuAnswerValue>;
  isSkipped?: boolean;
}) => {
  /*
   * Associated symptoms have their own nuanced "Patient reports / Patient denies"
   * formatting — defer to the shared visit-summary builder for those.
   */
  const isAssociatedSymptoms =
    resolveAyuComponent(question) === ASSOCIATED_SYMPTOMS_COMPONENT;

  const summaryItems = useMemo(() => {
    if (!isAssociatedSymptoms || isSkipped) return [];
    const map = new Map(Object.entries(answers));
    const sections = buildVisitSummary([question], map, '');
    return sections.flatMap(s => s.items);
  }, [question, answers, isAssociatedSymptoms, isSkipped]);

  /*
   * Hide the auto-selected option label (e.g. "Take the patient's BP lying
   * down") for single-option PE questions — only show the nested child values.
   */
  const hidePrimaryValue = isSingleOptionPE(question);

  const primaryValue = useMemo(
    () =>
      isSkipped || isAssociatedSymptoms || hidePrimaryValue
        ? null
        : formatAnswerValue(question, answers[question.linkId]),
    [question, answers, isSkipped, isAssociatedSymptoms, hidePrimaryValue]
  );

  const nestedRows = useMemo(
    () =>
      isSkipped || isAssociatedSymptoms
        ? []
        : collectAnsweredRows(question.item, answers, question),
    [question, answers, isSkipped, isAssociatedSymptoms]
  );

  if (isSkipped) {
    return (
      <div className="pr-8">
        <p className="text-lg font-semibold text-[#1B163A]">
          {getRowLabel(question)}
        </p>
        <p className="text-sm font-semibold text-[#7F7B92]">Skipped</p>
      </div>
    );
  }

  if (isAssociatedSymptoms) {
    return (
      <div className="pr-8 space-y-1">
        <p className="text-lg font-semibold text-[#1B163A]">
          {getRowLabel(question)}
        </p>
        {summaryItems.map((item, idx) =>
          item.type === SUMMARY_ITEM_TYPE_LABEL_VALUE ? (
            <p key={idx} className="text-sm font-semibold text-[#2e1e91]">
              {item.label
                ? item.value != null && String(item.value).trim() !== ''
                  ? `${item.label}: ${item.value}`
                  : item.label
                : item.value}
            </p>
          ) : (
            <div key={idx}>
              <p className="text-sm text-[#7F7B92]">{item.heading}</p>
              {item.values.map((v, j) => (
                <p key={j} className="text-sm font-semibold text-[#2e1e91]">
                  {v}
                </p>
              ))}
            </div>
          )
        )}
      </div>
    );
  }

  if (!primaryValue && nestedRows.length === 0) {
    return (
      <div className="pr-8">
        <p className="text-lg font-semibold text-[#1B163A]">
          {getRowLabel(question)}
        </p>
      </div>
    );
  }

  return (
    <div className="pr-8">
      <p className="text-lg font-semibold text-[#1B163A]">
        {getRowLabel(question)}
      </p>
      {primaryValue && (
        <p className="text-sm font-semibold text-[#2e1e91] mt-1">
          {primaryValue}
        </p>
      )}
      {nestedRows.length > 0 && (
        <div className="space-y-2 mt-3">
          {nestedRows.map((row, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <ChevronBullet />
              <div>
                {row.label && (
                  <p className="text-sm text-[#7F7B92]">{row.label}</p>
                )}
                <p className="text-sm font-semibold text-[#2e1e91]">
                  {row.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export interface AyuStepperContainerHandle {
  /** Directly call onComplete with current answers (skips summary modal). */
  confirm: () => void;
  /** Trigger the normal completion flow which shows the summary modal (when skipSummary is false). */
  showSummary: () => void;
  getAnswers: () => Record<string, AyuAnswerValue>;
}

export interface AyuStepperContainerProps {
  questionnaire: FhirQuestionnaire;
  summaryTitle?: string;
  skipSummary?: boolean;
  initialAnswers?: Record<string, AyuAnswerValue>;
  questionIndexOffset?: number;
  totalQuestionsOverride?: number;
  onComplete?: (answers: Record<string, AyuAnswerValue>) => void;
  onProgressUpdate?: (total: number, completed: number) => void;
  onSummaryShown?: () => void;
  /** When the parent section toggles visibility (e.g. back from Physical Exam),
   *  a false→true transition opens the last question in edit mode. */
  isActive?: boolean;
  resetLinkIds?: string[];
  onResetAnswers?: () => void;
}

export const AyuStepperContainer = forwardRef<
  AyuStepperContainerHandle,
  AyuStepperContainerProps
>(
  (
    {
      questionnaire,
      summaryTitle,
      skipSummary,
      initialAnswers,
      questionIndexOffset = 0,
      totalQuestionsOverride,
      onComplete,
      onProgressUpdate,
      onSummaryShown,
      isActive = true,
      resetLinkIds,
      onResetAnswers,
    },
    ref
  ) => {
    const handleStepperComplete = useCallback(
      (finalAnswers: Record<string, AyuAnswerValue>) => {
        const allTopLevel = (questionnaire?.item || []).filter(
          item => item.type !== FHIR_TYPE_GROUP
        );
        const completeTotal = allTopLevel.length;
        if (completeTotal > 0) {
          onProgressUpdate?.(completeTotal, completeTotal);
        }
        const lastItem = allTopLevel[allTopLevel.length - 1];
        if (lastItem && finalAnswers[lastItem.linkId] !== undefined) {
          setSubmittedQuestions(prev => {
            if (prev.has(lastItem.linkId)) return prev;
            return new Set(prev).add(lastItem.linkId);
          });
        }
        onComplete?.(finalAnswers);
      },
      [questionnaire, onComplete, onProgressUpdate]
    );

    const resetAnswersRef = useRef<() => void>(() => {});

    const {
      currentQuestion,
      currentIndex,
      total,
      answers,
      setAnswer,
      clearAnswers,
      goNext,
      topLevelItems,
      isLast,
      showAll,
      validateAllQuestions,
      isCameraAnswerMissingImages,
      isCameraNotUploaded,
    } = useFHIRStepper({
      questionnaire,
      summaryTitle,
      skipSummary,
      initialAnswers,
      questionIndexOffset,
      onComplete: handleStepperComplete,
      onSummaryShown,
      resetLinkIds,
      onResetAnswers: () => resetAnswersRef.current(),
    });

    useImperativeHandle(
      ref,
      () => ({
        confirm: () => {
          if (!validateAllQuestions()) return;
          handleStepperComplete(answers);
        },
        showSummary: () => {
          goNext();
        },
        getAnswers: () => answers,
      }),
      [answers, handleStepperComplete, goNext, validateAllQuestions]
    );

    const totalSteps = topLevelItems.length;
    const lastQuestionRef = useRef<HTMLDivElement | null>(null);
    const [submittedQuestions, setSubmittedQuestions] = useState<Set<string>>(
      () => {
        if (!initialAnswers || Object.keys(initialAnswers).length === 0)
          return new Set();
        const submitted = new Set<string>();
        for (const item of topLevelItems) {
          if (initialAnswers[item.linkId] !== undefined) {
            submitted.add(item.linkId);
          }
        }
        return submitted;
      }
    );
    const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(
      () => {
        if (!initialAnswers || Object.keys(initialAnswers).length === 0)
          return new Set();
        const skipped = new Set<string>();
        for (const item of topLevelItems) {
          if (initialAnswers[item.linkId] === undefined && !item.required) {
            skipped.add(item.linkId);
          }
        }
        return skipped;
      }
    );
    const [editingQuestions, setEditingQuestions] = useState<Set<string>>(
      () => new Set()
    );

    resetAnswersRef.current = () => {
      setSubmittedQuestions(new Set());
      setSkippedQuestions(new Set());
      setEditingQuestions(new Set());
      onResetAnswers?.();
    };

    const prevCompletedRef = useRef<number>(-1);
    const prevIndexRef = useRef<number>(currentIndex);
    const prevIsActiveRef = useRef<boolean>(isActive);
    const onProgressUpdateRef = useRef(onProgressUpdate);
    const prevShowAllRef = useRef<boolean>(showAll);
    const latestAnswersRef = useRef(answers);
    latestAnswersRef.current = answers;

    useEffect(() => {
      if (showAll && totalSteps > 0) {
        onProgressUpdateRef.current?.(totalSteps, totalSteps);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
      if (showAll) return; // Don't reset progress while in review mode
      const completedSteps = currentIndex;

      if (prevCompletedRef.current === completedSteps) return;

      prevCompletedRef.current = completedSteps;
      onProgressUpdateRef.current?.(totalSteps, completedSteps);
    }, [currentIndex, totalSteps, showAll]);

    /*
     * When the stepper auto-advances past a question (single-choice with autoNext,
     * for example), there's no Submit click to add it to submittedQuestions. Backfill
     * here so those questions transition to the white answered card.
     */
    useEffect(() => {
      const prev = prevIndexRef.current;
      if (currentIndex <= prev) {
        prevIndexRef.current = currentIndex;
        return;
      }
      for (let i = prev; i < currentIndex; i++) {
        const q = topLevelItems[i];
        if (!q) continue;
        if (
          answers[q.linkId] !== undefined &&
          !skippedQuestions.has(q.linkId)
        ) {
          setSubmittedQuestions(prevSet => {
            if (prevSet.has(q.linkId)) return prevSet;
            const next = new Set(prevSet);
            next.add(q.linkId);
            return next;
          });
        }
      }
      prevIndexRef.current = currentIndex;
    }, [currentIndex, topLevelItems, answers, skippedQuestions]);

    useEffect(() => {
      const wasShowAll = prevShowAllRef.current;
      prevShowAllRef.current = showAll;
      if (!showAll || wasShowAll) return;
      const lastQ = topLevelItems[topLevelItems.length - 1];
      if (
        lastQ &&
        answers[lastQ.linkId] !== undefined &&
        !skippedQuestions.has(lastQ.linkId)
      ) {
        setSubmittedQuestions(prev => {
          if (prev.has(lastQ.linkId)) return prev;
          return new Set(prev).add(lastQ.linkId);
        });
      }
    }, [showAll, topLevelItems, answers, skippedQuestions]);

    useEffect(() => {
      lastQuestionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, [currentIndex]);

    /* Keep onProgressUpdateRef current so the progress effects never need the
     * callback in their dependency arrays — prevents spurious re-runs when the
     * parent re-renders with a new function reference (FE-001). */
    useLayoutEffect(() => {
      onProgressUpdateRef.current = onProgressUpdate;
    });

    useLayoutEffect(() => {
      if (!prevIsActiveRef.current && isActive && showAll) {
        setEditingQuestions(new Set());
        setSubmittedQuestions(prev => {
          const latestAnswers = latestAnswersRef.current;
          const next = new Set(prev);
          for (const item of topLevelItems) {
            if (latestAnswers[item.linkId] !== undefined) {
              next.add(item.linkId);
            }
          }
          return next.size === prev.size ? prev : next;
        });
      }
      prevIsActiveRef.current = isActive;
    }, [isActive, showAll, topLevelItems]);

    if (!currentQuestion) return null;

    const visibleCount = showAll ? topLevelItems.length : currentIndex + 1;

    return (
      <div className="flex flex-col gap-6 mb-2">
        {topLevelItems
          .slice(0, visibleCount)
          .map((question: AyuQuestion, index: number) => {
            /* Renamed from isActive to avoid shadowing the same-named section-visibility prop. */
            const isCurrentQuestion = index === currentIndex;
            const isSkipped = skippedQuestions.has(question.linkId);
            const showAsAnswered =
              (submittedQuestions.has(question.linkId) || isSkipped) &&
              !editingQuestions.has(question.linkId);
            const isLastRendered = index === visibleCount - 1;

            /* Wrapper that clears submitted/skipped icons when the user changes an answer */
            const handleSetAnswer = (q: AyuQuestion, val: AyuAnswerValue) => {
              setAnswer(q, val);
              setSubmittedQuestions(prev => {
                if (!prev.has(question.linkId)) return prev;
                const next = new Set(prev);
                next.delete(question.linkId);
                return next;
              });
              setSkippedQuestions(prev => {
                if (!prev.has(question.linkId)) return prev;
                const next = new Set(prev);
                next.delete(question.linkId);
                return next;
              });
            };

            return (
              <div
                key={question.linkId}
                ref={isCurrentQuestion ? lastQuestionRef : null}
                className="relative"
              >
                {!isLastRendered && (
                  <span
                    aria-hidden="true"
                    className="absolute left-5 top-12 -translate-x-1/2 -bottom-6 w-px bg-[#D1D5DB] pointer-events-none"
                  />
                )}
                <QuestionLoader
                  question={getRowLabel(question)}
                  questionIndex={index + questionIndexOffset}
                  totalQuestions={totalQuestionsOverride ?? total}
                  isShowQuestionNumber={true}
                  isAnswered={showAsAnswered}
                  onEdit={
                    showAsAnswered
                      ? () =>
                          setEditingQuestions(prev =>
                            new Set(prev).add(question.linkId)
                          )
                      : undefined
                  }
                >
                  {showAsAnswered ? (
                    <AyuAnsweredDisplay
                      question={question}
                      answers={answers}
                      isSkipped={isSkipped}
                    />
                  ) : (
                    <>
                      <AyuRenderer
                        question={question}
                        value={answers[question.linkId]}
                        onChange={val => handleSetAnswer(question, val)}
                        answers={answers}
                        setAnswer={handleSetAnswer}
                      />
                      {question.item &&
                        resolveAyuComponent(question) !==
                          ASSOCIATED_SYMPTOMS_COMPONENT && (
                          <AyuNestedRenderer
                            items={question.item}
                            parentQuestion={question}
                            answers={answers}
                            setAnswer={handleSetAnswer}
                            clearAnswers={clearAnswers}
                            showAllTriangles
                            selectable={
                              resolveAyuComponent(question) ===
                                PHYSICAL_EXAM_OPTIONS_COMPONENT &&
                              !hasNestedBPInputs(question)
                            }
                          />
                        )}
                      {/* ACTION BUTTONS */}
                      {(isCurrentQuestion ||
                        showAll ||
                        index < currentIndex) && (
                        <div className="mt-3 flex gap-3 md:justify-end">
                          {/* SUBMIT for required string and quantity types */}
                          {(() => {
                            /*
                             * Always show Submit while a question is being edited so the
                             * user has an explicit way to confirm and return to the white card.
                             */
                            if (editingQuestions.has(question.linkId))
                              return true;

                            const answer = answers[question.linkId];

                            /* Check if top-level has dropdownValues */
                            const isDurationChoice =
                              question.type === FHIR_TYPE_CHOICE &&
                              answer &&
                              typeof answer === 'object' &&
                              'dropdownValues' in answer;

                            /* Recursive check for nested duration, repeats, and input fields */
                            const checkNestedDeep = (
                              items: AyuQuestion[] | undefined
                            ): {
                              hasDuration: boolean;
                              hasRepeats: boolean;
                              hasInput: boolean;
                            } => {
                              if (!items)
                                return {
                                  hasDuration: false,
                                  hasRepeats: false,
                                  hasInput: false,
                                };
                              for (const child of items) {
                                if (
                                  !evaluateEnableWhen(child.enableWhen, answers)
                                )
                                  continue;
                                const childAnswer = answers[child.linkId];
                                if (
                                  childAnswer &&
                                  typeof childAnswer === 'object' &&
                                  'dropdownValues' in childAnswer
                                ) {
                                  return {
                                    hasDuration: true,
                                    hasRepeats: false,
                                    hasInput: false,
                                  };
                                }
                                if (child.repeats) {
                                  return {
                                    hasDuration: false,
                                    hasRepeats: true,
                                    hasInput: false,
                                  };
                                }
                                if (
                                  child.type === FHIR_TYPE_STRING ||
                                  child.type === FHIR_TYPE_INTEGER ||
                                  child.type === FHIR_TYPE_DATE ||
                                  child.type === FHIR_TYPE_QUANTITY
                                ) {
                                  return {
                                    hasDuration: false,
                                    hasRepeats: false,
                                    hasInput: true,
                                  };
                                }
                                /*
                                 * Intermediate choice (answerOption + item[]): in non-PE
                                 * mode the sub-items are rendered directly as labeled
                                 * inputs, bypassing pill selection. Check them without
                                 * option-gating so the Submit button appears correctly.
                                 */
                                if (
                                  child.answerOption?.length &&
                                  child.item?.length
                                ) {
                                  const hasDirectInput = child.item.some(
                                    sub =>
                                      sub.type === FHIR_TYPE_STRING ||
                                      sub.type === FHIR_TYPE_INTEGER ||
                                      sub.type === FHIR_TYPE_DATE ||
                                      sub.type === FHIR_TYPE_QUANTITY
                                  );
                                  if (hasDirectInput)
                                    return {
                                      hasDuration: false,
                                      hasRepeats: false,
                                      hasInput: true,
                                    };
                                }
                                const deep = checkNestedDeep(child.item);
                                if (
                                  deep.hasDuration ||
                                  deep.hasRepeats ||
                                  deep.hasInput
                                )
                                  return deep;
                              }
                              return {
                                hasDuration: false,
                                hasRepeats: false,
                                hasInput: false,
                              };
                            };

                            const nestedFlags =
                              question.type === FHIR_TYPE_CHOICE
                                ? checkNestedDeep(question.item)
                                : {
                                    hasDuration: false,
                                    hasRepeats: false,
                                    hasInput: false,
                                  };
                            const hasNestedDuration = nestedFlags.hasDuration;
                            const hasNestedRepeats = nestedFlags.hasRepeats;
                            const hasVisibleNestedInput = nestedFlags.hasInput;

                            /* In review mode, always show Submit — autoNext is blocked when showAll=true */
                            if (
                              showAll &&
                              answers[question.linkId] !== undefined
                            ) {
                              return true;
                            }

                            return (
                              (question.type === FHIR_TYPE_STRING &&
                                answers[question.linkId] !== undefined) ||
                              (question.type === FHIR_TYPE_QUANTITY &&
                                answers[question.linkId] !== undefined) ||
                              question.type === FHIR_TYPE_DATE ||
                              question.type === FHIR_TYPE_INTEGER ||
                              (question.type === FHIR_TYPE_CHOICE &&
                                question.repeats) ||
                              resolveAyuComponent(question) ===
                                ASSOCIATED_SYMPTOMS_COMPONENT ||
                              isDurationChoice ||
                              hasNestedDuration ||
                              hasNestedRepeats ||
                              hasVisibleNestedInput
                            );
                          })() && (
                            <AyuButton
                              variant="primary"
                              className="w-full md:w-[11%]"
                              size="sm"
                              disabled={skippedQuestions.has(question.linkId)}
                              rightIcon={
                                submittedQuestions.has(question.linkId) ? (
                                  <img src={iconYes} alt="yes" />
                                ) : undefined
                              }
                              onClick={() => {
                                const result = validateQuestion(
                                  question,
                                  answers,
                                  isCameraAnswerMissingImages,
                                  isCameraNotUploaded
                                );
                                if (!result.valid) {
                                  showToast(
                                    validationMessageForReason(
                                      result.reason,
                                      showAll
                                        ? index + questionIndexOffset + 1
                                        : undefined,
                                      result.outOfRangeText
                                    ),
                                    undefined,
                                    'warning'
                                  );
                                  return;
                                }

                                const wasEditing = editingQuestions.has(
                                  question.linkId
                                );

                                setSubmittedQuestions(prev =>
                                  new Set(prev).add(question.linkId)
                                );
                                setEditingQuestions(prev => {
                                  if (!prev.has(question.linkId)) return prev;
                                  const next = new Set(prev);
                                  next.delete(question.linkId);
                                  return next;
                                });

                                /*
                                 * Editing an already-answered past question must not
                                 * advance the stepper. The last question is an exception —
                                 * re-submitting it must always invoke goNext so a previously
                                 * cancelled summary modal can be re-opened.
                                 */
                                if (
                                  isCurrentQuestion &&
                                  (isLast || !wasEditing)
                                ) {
                                  if (isLast) {
                                    onProgressUpdate?.(totalSteps, totalSteps);
                                  }
                                  goNext();
                                }
                              }}
                            >
                              {BUTTON_SUBMIT}
                            </AyuButton>
                          )}

                          {/* SKIP for non-required */}
                          {!question.required &&
                            (isCurrentQuestion ||
                              index < currentIndex ||
                              skippedQuestions.has(question.linkId) ||
                              editingQuestions.has(question.linkId)) && (
                              <AyuButton
                                variant="primary"
                                className="w-full md:w-[10%]"
                                size="sm"
                                disabled={submittedQuestions.has(
                                  question.linkId
                                )}
                                rightIcon={
                                  skippedQuestions.has(question.linkId) ? (
                                    <img src={iconYes} alt="yes" />
                                  ) : undefined
                                }
                                onClick={() => {
                                  const wasEditing = editingQuestions.has(
                                    question.linkId
                                  );

                                  /* Clear answer data for this question and all its descendants */
                                  const descendantIds =
                                    collectDescendantLinkIds(question);
                                  clearAnswers([
                                    question.linkId,
                                    ...descendantIds,
                                  ]);

                                  setSkippedQuestions(prev =>
                                    new Set(prev).add(question.linkId)
                                  );
                                  setSubmittedQuestions(prev => {
                                    const next = new Set(prev);
                                    next.delete(question.linkId);
                                    return next;
                                  });
                                  setEditingQuestions(prev => {
                                    if (!prev.has(question.linkId)) return prev;
                                    const next = new Set(prev);
                                    next.delete(question.linkId);
                                    return next;
                                  });
                                  if (
                                    isCurrentQuestion &&
                                    (isLast || !wasEditing)
                                  ) {
                                    if (isLast) {
                                      onProgressUpdate?.(
                                        totalSteps,
                                        totalSteps
                                      );
                                    }
                                    goNext();
                                  }
                                }}
                              >
                                {BUTTON_SKIP}
                              </AyuButton>
                            )}
                        </div>
                      )}
                    </>
                  )}
                </QuestionLoader>
              </div>
            );
          })}
      </div>
    );
  }
);
