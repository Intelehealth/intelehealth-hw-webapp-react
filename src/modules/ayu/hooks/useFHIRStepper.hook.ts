import { useMemo, useRef, useState } from 'react';
import iconVisitReasonSummary from '../../../assets/icons/visit-reason.svg';
import { useGlobalModal } from '../../../components/modal/global-modal-context';
import { showToast } from '../../../services/toast';
import { evaluateEnableWhen } from '../../ayu-library/logic/enable-when.logic';
import {
  computeMultiSelectToggle,
  isTopLevelComplete,
} from '../../ayu-library/logic/stepper.logic';
import {
  isEmpty,
  isNestedInputValueMissing,
  isQuantityInvalid,
} from '../../ayu-library/logic/validation.logic';
import type {
  AyuAnswerValue,
  AyuQuestion,
  FhirQuestionnaire,
} from '../../ayu-library/types/ayu.types';
import {
  clearHiddenDescendantAnswers,
  isDescendantLinkId,
} from '../../ayu-library/utils/question.utils';
import {
  ASSOCIATED_SYMPTOMS_LABEL,
  DEFAULT_VISIT_REASON_TEXT,
  SUMMARY_CANCEL_TEXT,
  SUMMARY_CONFIRM_TEXT,
  VALIDATION_ENTER_VALUE,
  VALIDATION_SELECT_OPTION,
} from '../utils/ayu.constants';
import { buildVisitSummary } from '../utils/visit-summary.util';

interface UseFHIRStepperProps {
  questionnaire: FhirQuestionnaire;
  autoNext?: boolean;
  summaryTitle?: string;
  skipSummary?: boolean;
  initialAnswers?: Record<string, AyuAnswerValue>;
  onComplete?: (answers: Record<string, AyuAnswerValue>) => void;
}

interface UseFHIRStepperReturn {
  currentQuestion: AyuQuestion | undefined;
  currentIndex: number;
  total: number;
  answers: Record<string, AyuAnswerValue>;
  setAnswer: (question: AyuQuestion, value: AyuAnswerValue) => void;
  clearAnswers: (linkIds: string[]) => void;
  goNext: () => void;
  topLevelItems: AyuQuestion[];
  isLast: boolean;
  showAll?: boolean;
  /** Validate all questions; returns true if valid, shows toast and returns false otherwise. */
  validateAllQuestions: () => boolean;
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
    onComplete,
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
  const { showVitalConfirmationModal } = useGlobalModal();
  const topLevelItems = useMemo(() => {
    const items = questionnaire?.item || [];
    return items.filter((item: AyuQuestion) => item.type !== 'group');
  }, [questionnaire]);

  const structuralTotal = topLevelItems.length;

  const currentQuestion = topLevelItems[currentIndex];

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
    for (const question of topLevelItems) {
      const answer = latestAnswers[question.linkId];

      // Required questions must have an answer
      if (question.required && isEmpty(answer)) {
        showToast(VALIDATION_SELECT_OPTION, undefined, 'warning');
        return false;
      }

      // If a question is answered (or required), validate nested children are complete
      if (!isEmpty(answer) || question.required) {
        if (!isTopLevelComplete(question, latestAnswers)) {
          const message =
            isNestedInputValueMissing(question, latestAnswers) ||
            isQuantityInvalid(question, latestAnswers)
              ? VALIDATION_ENTER_VALUE
              : VALIDATION_SELECT_OPTION;
          showToast(message, undefined, 'warning');
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

    const answersMap = new Map(Object.entries(latestAnswers));
    const sections = buildVisitSummary(
      topLevelItems,
      answersMap,
      questionnaire?.text || DEFAULT_VISIT_REASON_TEXT
    );

    // Add per-section onChange callbacks
    sections.forEach(section => {
      section.onChange = () => {
        const targetIndex = topLevelItems.findIndex(item => {
          if (section.title === ASSOCIATED_SYMPTOMS_LABEL) {
            return item.extension?.some(
              ext => ext.valueString === ASSOCIATED_SYMPTOMS_LABEL
            );
          }
          return true; // main section → first question
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

    setAnswers(prev => {
      let finalValue: AyuAnswerValue = value;

      // Handle repeats (multi-select toggle)
      if (question.type === 'choice' && question.repeats) {
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

      // When a parent answer changes, clear answers for children that are no longer visible
      if (question.item?.length) {
        clearHiddenDescendantAnswers(question.item, updated);
      }

      if (!autoNext || !currentQuestion) return updated;

      // Disable autoNext for input-based questions — user must explicitly submit
      if (
        currentQuestion.type === 'string' ||
        currentQuestion.type === 'date' ||
        currentQuestion.type === 'integer' ||
        currentQuestion.type === 'quantity'
      ) {
        return updated;
      }

      // If changed question is not current top-level, don't auto advance
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
            child.type === 'string' ||
            child.type === 'date' ||
            child.type === 'integer' ||
            child.type === 'quantity'
          )
            return { hasString: true, hasRepeats: false };
          if (child.type === 'choice' && child.repeats)
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

      const isLastQuestion = currentIndex === structuralTotal - 1;

      const hasNestedRepeats = deepCheck.hasRepeats;

      if (
        shouldMoveNext &&
        !hasVisibleStringChild &&
        !isAdvancingRef.current &&
        (!isLastQuestion || skipSummary) &&
        !(currentQuestion.type === 'choice' && currentQuestion.repeats) &&
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
    if (!currentQuestion) return linkId;

    if (currentQuestion.linkId === linkId) return linkId;

    // Recursively check all descendants, not just immediate children
    if (isDescendantLinkId(currentQuestion, linkId)) {
      return currentQuestion.linkId;
    }

    return linkId;
  };

  return {
    currentQuestion,
    currentIndex,
    total: structuralTotal,
    answers,
    setAnswer,
    clearAnswers,
    goNext,
    topLevelItems,
    isLast: currentIndex === structuralTotal - 1,
    showAll,
    validateAllQuestions,
  };
};
