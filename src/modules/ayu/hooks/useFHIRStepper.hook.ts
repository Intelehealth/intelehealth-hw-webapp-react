import { useMemo, useRef, useState } from 'react';
import iconVisitReasonSummary from '../../../assets/icons/visit-reason.svg';
import { useGlobalModal } from '../../../components/modal/global-modal-context';
import { showToast } from '../../../services/toast';
import { evaluateEnableWhen } from '../../ayu-library/logic/enable-when.logic';
import {
  ALL_OVER_COMBINATION_CONFLICT_MESSAGE,
  clearInvalidPainLocationAnswers,
  hasInvalidAllOverCombinationInTree,
} from '../../ayu-library/logic/option-dependency.logic';
import {
  computeMultiSelectToggle,
  isTopLevelComplete,
} from '../../ayu-library/logic/stepper.logic';
import {
  isEmpty,
  UPLOAD_ISSUE_REASON,
  validateQuestion,
} from '../../ayu-library/logic/validation.logic';
import type { CameraUploadIssue } from '../../ayu-library/logic/validation.logic';
import type {
  AyuAnswerValue,
  AyuQuestion,
  FhirQuestionnaire,
} from '../../ayu-library/types/ayu.types';
import {
  EXT_URL_PE_OPTION_KIND,
  FHIR_TYPE_CHOICE,
  FHIR_TYPE_DATE,
  FHIR_TYPE_GROUP,
  FHIR_TYPE_INTEGER,
  FHIR_TYPE_QUANTITY,
  FHIR_TYPE_STRING,
  PE_OPTION_KIND_CAMERA,
} from '../../ayu-library/utils/constants';
import {
  clearHiddenDescendantAnswers,
  isDescendantLinkId,
} from '../../ayu-library/utils/question.utils';
import { usePhysicalExamCamera } from '../components/start-visit/physical-examination/physical-exam-camera-context';
import {
  ASSOCIATED_SYMPTOMS_LABEL,
  DEFAULT_VISIT_REASON_TEXT,
  SUMMARY_CANCEL_TEXT,
  SUMMARY_CONFIRM_TEXT,
  validationMessageForReason,
} from '../utils/ayu.constants';
import { buildVisitSummary } from '../utils/visit-summary.util';

interface UseFHIRStepperProps {
  questionnaire: FhirQuestionnaire;
  autoNext?: boolean;
  summaryTitle?: string;
  skipSummary?: boolean;
  initialAnswers?: Record<string, AyuAnswerValue>;
  questionIndexOffset?: number;
  onComplete?: (answers: Record<string, AyuAnswerValue>) => void;
  onSummaryShown?: () => void;
  resetLinkIds?: string[];
  onResetAnswers?: () => void;
}

interface UseFHIRStepperReturn {
  currentQuestion: AyuQuestion | undefined;
  currentIndex: number;
  total: number;
  answers: Record<string, AyuAnswerValue>;
  setAnswer: (question: AyuQuestion, value: AyuAnswerValue) => void;
  /** linkId(s) whose answer was modified as a side effect of setAnswer
   *  (currently: clearInvalidPainLocationAnswers clearing a now-invalid
   *  "Pain radiates to"/Question 1 answer) — not the linkId the caller
   *  explicitly passed to setAnswer, which is already handled by the caller
   *  itself. Deliberately narrow rather than a generic whole-answers diff,
   *  which would also flag unrelated incidental value shifts (e.g.
   *  positionally-indexed Physical Exam image references renumbering).
   *  Exposed as state (not a ref read synchronously after calling setAnswer)
   *  because setAnswers is a functional update: React is not guaranteed to
   *  invoke its updater before setAnswer returns, so a caller reading a ref
   *  written inside that updater immediately afterwards can observe a stale
   *  value. Accumulates across calls (rather than being overwritten by each
   *  one) so that if two setAnswer calls land in the same batch, an earlier
   *  call's side effect can't be shadowed by a later call's empty one — the
   *  consumer must call clearLastChangedLinkIds() once it has reacted to a
   *  non-empty value, in the same effect, or the same linkIds will still be
   *  reported on the next unrelated change. */
  lastChangedLinkIds: string[];
  /** Marks the current lastChangedLinkIds as consumed. Call this from the
   *  same effect that reacts to a non-empty lastChangedLinkIds, after
   *  handling it. */
  clearLastChangedLinkIds: () => void;
  clearAnswers: (linkIds: string[]) => void;
  goNext: () => void;
  topLevelItems: AyuQuestion[];
  isLast: boolean;
  showAll?: boolean;
  /** Validate all questions; returns true if valid, shows toast and returns false otherwise. */
  validateAllQuestions: () => boolean;
  /** True when a PE question's answer holds the camera option but has no images. */
  isCameraAnswerMissingImages: (
    question: AyuQuestion,
    questionAnswers: Record<string, AyuAnswerValue>
  ) => boolean;
  cameraUploadIssue: (question: AyuQuestion) => CameraUploadIssue | null;
}

export const useFHIRStepper = (
  props: UseFHIRStepperProps
): UseFHIRStepperReturn => {
  const {
    questionnaire,
    autoNext = true,
    summaryTitle,
    skipSummary,
    initialAnswers,
    questionIndexOffset = 0,
    onComplete,
    onSummaryShown,
    resetLinkIds,
    onResetAnswers,
  } = props;
  const hasInitialAnswers =
    initialAnswers && Object.keys(initialAnswers).length > 0;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AyuAnswerValue>>(
    initialAnswers ?? {}
  );
  const [showAll, setShowAll] = useState(!!hasInitialAnswers);
  const isAdvancingRef = useRef(false);
  // Ref to always access latest answers (avoids stale closure in setTimeout auto-advance)
  const answersRef = useRef(answers);
  answersRef.current = answers;
  /**
   * linkIds whose value changed as a side effect of a setAnswer call
   * (clearHiddenDescendantAnswers, clearInvalidPainLocationAnswers), not yet
   * consumed by clearLastChangedLinkIds. State, not a ref: consumers react to
   * it via an effect, which is only guaranteed to see the value once the
   * corresponding answers update has actually committed. Accumulated rather
   * than replaced on each call — see clearLastChangedLinkIds — so a side
   * effect from one setAnswer call can't be shadowed by a later call's empty
   * result landing in the same React batch.
   */
  const [lastChangedLinkIds, setLastChangedLinkIds] = useState<string[]>([]);
  const { showVitalConfirmationModal } = useGlobalModal();
  // PE-only: null for Visit Reason and other non-PE flows (no provider mounted).
  const peCamera = usePhysicalExamCamera();
  const topLevelItems = useMemo(() => {
    const items = questionnaire?.item || [];
    return items.filter((item: AyuQuestion) => item.type !== FHIR_TYPE_GROUP);
  }, [questionnaire]);

  const structuralTotal = topLevelItems.length;

  const currentQuestion = topLevelItems[currentIndex];

  /**
   * A physical-exam question whose answer includes the camera ("picture")
   * option but has no captured images is invalid — the user picked "take a
   * picture" but never provided one (e.g. removed every image on edit). The
   * camera answer is only ever committed with images, so this fires on the
   * edit-removed case; non-PE flows return false (no camera provider).
   */
  const isCameraAnswerMissingImages = (
    question: AyuQuestion,
    questionAnswers: Record<string, AyuAnswerValue>
  ): boolean => {
    if (!peCamera) return false;
    const cameraCode = question.answerOption?.find(o =>
      o.extension?.some(
        e =>
          e.url === EXT_URL_PE_OPTION_KIND &&
          e.valueString === PE_OPTION_KIND_CAMERA
      )
    )?.valueCoding?.code;
    if (!cameraCode) return false;
    const answer = questionAnswers[question.linkId];
    const codes = Array.isArray(answer)
      ? answer
      : typeof answer === 'string'
        ? [answer]
        : [];
    if (!codes.includes(cameraCode)) return false;
    return peCamera.cameraImagesFor(question.linkId).length === 0;
  };

  const cameraUploadIssue = (
    question: AyuQuestion
  ): CameraUploadIssue | null => {
    if (!peCamera) return null;
    if (peCamera.isCameraUploading(question.linkId)) return 'uploading';
    if (peCamera.hasFailedUploads(question.linkId)) return 'failed';
    return null;
  };

  const goNext = () => {
    if (showAll) {
      handleComplete();
      return;
    }
    if (currentIndex < structuralTotal - 1) {
      setCurrentIndex(prev => {
        if (prev < structuralTotal - 1) {
          return prev + 1;
        }
        return prev;
      });
    } else {
      handleComplete();
    }
  };

  const validateAllQuestions = (): boolean => {
    const latestAnswers = answersRef.current;

    /*
     * Legacy/stale data only — see hasInvalidAllOverCombinationInTree. Checked
     * once here (not per top-level item) since Question 1 may be nested and
     * this must fire at Submit regardless of whether Question 1's own item
     * happens to be revisited.
     */
    if (hasInvalidAllOverCombinationInTree(topLevelItems, latestAnswers)) {
      showToast(ALL_OVER_COMBINATION_CONFLICT_MESSAGE, undefined, 'warning');
      return false;
    }

    for (let index = 0; index < topLevelItems.length; index++) {
      const question = topLevelItems[index];
      const answer = latestAnswers[question.linkId];
      const questionNumber = showAll
        ? index + questionIndexOffset + 1
        : undefined;

      const uploadIssue = cameraUploadIssue(question);
      if (uploadIssue) {
        showToast(
          validationMessageForReason(
            UPLOAD_ISSUE_REASON[uploadIssue],
            questionNumber
          ),
          undefined,
          'warning'
        );
        return false;
      }

      if (!isEmpty(answer) || question.required) {
        const result = validateQuestion(
          question,
          latestAnswers,
          isCameraAnswerMissingImages,
          cameraUploadIssue
        );
        if (!result.valid) {
          showToast(
            validationMessageForReason(
              result.reason,
              questionNumber,
              result.outOfRangeText
            ),
            undefined,
            'warning'
          );
          return false;
        }
      }
    }
    return true;
  };

  const handleComplete = () => {
    if (!validateAllQuestions()) return;

    const latestAnswers = answersRef.current;

    if (skipSummary) {
      onComplete?.(latestAnswers);
      return;
    }
    setShowAll(true);

    const answersMap = new Map(Object.entries(latestAnswers));
    const sections = buildVisitSummary(
      topLevelItems,
      answersMap,
      questionnaire?.text || DEFAULT_VISIT_REASON_TEXT
    );

    sections.forEach(section => {
      section.onChange = () => {
        const targetIndex = topLevelItems.findIndex(item => {
          if (section.title === ASSOCIATED_SYMPTOMS_LABEL) {
            return item.extension?.some(
              ext => ext.valueString === ASSOCIATED_SYMPTOMS_LABEL
            );
          }
          return true;
        });
        setCurrentIndex(targetIndex >= 0 ? targetIndex : 0);
        setShowAll(true);
      };
    });

    showVitalConfirmationModal({
      icon: iconVisitReasonSummary,
      title: summaryTitle || sections[0]?.title,
      sections,
      confirmText: SUMMARY_CONFIRM_TEXT,
      cancelText: SUMMARY_CANCEL_TEXT,
      open: false,
      type: 'vitalConfirm',
      size: 'lg',
      onConfirm: () => {
        setShowAll(true);
        onComplete?.(answersRef.current);
      },
    });

    onSummaryShown?.();
  };

  const clearAnswers = (linkIds: string[]) => {
    setAnswers(prev => {
      const updated = { ...prev };
      for (const id of linkIds) {
        delete updated[id];
      }
      // Keep ref in sync so handleComplete reads cleared answers
      // when called in the same event tick (e.g. skip on last question)
      answersRef.current = updated;
      return updated;
    });
  };

  const setAnswer = (question: AyuQuestion, value: AyuAnswerValue) => {
    const linkId = question.linkId;

    let precomputedFinalValue: AyuAnswerValue = value;
    if (question.type === FHIR_TYPE_CHOICE && question.repeats) {
      if (Array.isArray(value)) {
        precomputedFinalValue = value;
      } else {
        const currentValue = answersRef.current[linkId];
        const currentArray: string[] = Array.isArray(currentValue)
          ? currentValue
          : [];
        precomputedFinalValue = computeMultiSelectToggle(
          question,
          currentArray,
          value as string
        );
      }
    }

    if (
      resetLinkIds?.includes(linkId) &&
      answersRef.current[linkId] !== undefined &&
      answersRef.current[linkId] !== precomputedFinalValue
    ) {
      const reset: Record<string, AyuAnswerValue> = {
        [linkId]: precomputedFinalValue,
      };
      answersRef.current = reset;
      setAnswers(() => reset);
      setCurrentIndex(0);
      setShowAll(false);
      onResetAnswers?.();
      return;
    }

    setAnswers(prev => {
      let finalValue: AyuAnswerValue = value;

      if (question.type === FHIR_TYPE_CHOICE && question.repeats) {
        if (Array.isArray(value)) {
          // Value is a pre-computed array (e.g. from AyuAssociatedSymptoms) — store directly.
          finalValue = value;
        } else {
          const currentValue = prev[linkId];
          const currentArray: string[] = Array.isArray(currentValue)
            ? currentValue
            : [];

          finalValue = computeMultiSelectToggle(
            question,
            currentArray,
            value as string
          );
        }
      }

      const updated: Record<string, AyuAnswerValue> = {
        ...prev,
        [linkId]: finalValue,
      };

      clearHiddenDescendantAnswers(topLevelItems, updated);
      const sideEffectLinkIds = clearInvalidPainLocationAnswers(
        topLevelItems,
        updated
      );
      /* Union into whatever is already pending, rather than replacing it, so
       * this call can't shadow an earlier call's side effect that the
       * consumer hasn't reacted to yet — e.g. if two setAnswer calls land in
       * the same React batch, only the LAST functional update's return value
       * is ever visible to the effect that reads this state; overwriting
       * would silently drop an unconsumed non-empty result from the first
       * call. Bails out to the same array reference when there is nothing
       * new to add, so an unaffected answer change (the common case) doesn't
       * schedule a state update. */
      if (sideEffectLinkIds.length > 0) {
        setLastChangedLinkIds(prevIds => {
          const merged = new Set(prevIds);
          let changed = false;
          for (const id of sideEffectLinkIds) {
            if (!merged.has(id)) {
              merged.add(id);
              changed = true;
            }
          }
          return changed ? Array.from(merged) : prevIds;
        });
      }

      if (!autoNext || !currentQuestion) return updated;

      if (cameraUploadIssue(currentQuestion)) return updated;

      if (peCamera) {
        const camCode = currentQuestion.answerOption?.find(o =>
          o.extension?.some(
            e =>
              e.url === EXT_URL_PE_OPTION_KIND &&
              e.valueString === PE_OPTION_KIND_CAMERA
          )
        )?.valueCoding?.code;
        if (camCode) {
          const ans = updated[currentQuestion.linkId];
          const ansArr: string[] = Array.isArray(ans)
            ? (ans as string[])
            : typeof ans === 'string'
              ? [ans]
              : [];
          if (ansArr.includes(camCode)) return updated;
        }
      }

      // Disable autoNext for input-based questions — user must explicitly submit
      if (
        currentQuestion.type === FHIR_TYPE_STRING ||
        currentQuestion.type === FHIR_TYPE_DATE ||
        currentQuestion.type === FHIR_TYPE_INTEGER ||
        currentQuestion.type === FHIR_TYPE_QUANTITY
      ) {
        return updated;
      }

      if (currentQuestion.linkId !== getTopLevelLinkId(linkId)) {
        return updated;
      }

      const shouldMoveNext = isTopLevelComplete(currentQuestion, updated);

      const hasVisibleStringOrRepeatsDeep = (
        items: AyuQuestion[] | undefined,
        answers: Record<string, AyuAnswerValue>
      ): { hasString: boolean; hasRepeats: boolean } => {
        if (!items) return { hasString: false, hasRepeats: false };
        for (const child of items) {
          if (!evaluateEnableWhen(child.enableWhen, answers)) continue;
          if (
            child.type === FHIR_TYPE_STRING ||
            child.type === FHIR_TYPE_DATE ||
            child.type === FHIR_TYPE_INTEGER ||
            child.type === FHIR_TYPE_QUANTITY
          )
            return { hasString: true, hasRepeats: false };
          if (child.type === FHIR_TYPE_CHOICE && child.repeats)
            return { hasString: false, hasRepeats: true };
          const deep = hasVisibleStringOrRepeatsDeep(child.item, answers);
          if (deep.hasString || deep.hasRepeats) return deep;
        }
        return { hasString: false, hasRepeats: false };
      };

      const deepCheck = hasVisibleStringOrRepeatsDeep(
        currentQuestion.item,
        updated
      );
      const hasVisibleStringChild = deepCheck.hasString;

      const hasNestedRepeats = deepCheck.hasRepeats;

      if (
        shouldMoveNext &&
        !hasVisibleStringChild &&
        !isAdvancingRef.current &&
        !(
          currentQuestion.type === FHIR_TYPE_CHOICE && currentQuestion.repeats
        ) &&
        !hasNestedRepeats &&
        !showAll
      ) {
        isAdvancingRef.current = true;

        setTimeout(() => {
          goNext();
          isAdvancingRef.current = false;
        }, 250);
      }

      return updated;
    });
  };

  const getTopLevelLinkId = (linkId: string) => {
    if (currentQuestion?.linkId === linkId) return linkId;

    if (currentQuestion && isDescendantLinkId(currentQuestion, linkId)) {
      return currentQuestion.linkId;
    }

    return linkId;
  };

  const clearLastChangedLinkIds = () => {
    setLastChangedLinkIds(prev => (prev.length === 0 ? prev : []));
  };

  return {
    currentQuestion,
    currentIndex,
    total: structuralTotal,
    answers,
    setAnswer,
    lastChangedLinkIds,
    clearLastChangedLinkIds,
    clearAnswers,
    goNext,
    topLevelItems,
    isLast: currentIndex === structuralTotal - 1,
    showAll,
    validateAllQuestions,
    isCameraAnswerMissingImages,
    cameraUploadIssue,
  };
};
