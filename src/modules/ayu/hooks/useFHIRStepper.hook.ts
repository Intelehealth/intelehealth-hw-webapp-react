import { useMemo, useRef, useState } from 'react';
import iconVisitReasonSummary from '../../../assets/icons/visit-reason.svg';
import { useGlobalModal } from '../../../components/modal/global-modal-context';
import type {
  AyuAnswerValue,
  AyuQuestion,
  FhirQuestionnaire,
} from '../../ayu-library/types/ayu.types';
import { evaluateEnableWhen } from '../../ayu-library/logic/enable-when.logic';
import {
  computeMultiSelectToggle,
  isTopLevelComplete,
} from '../../ayu-library/logic/stepper.logic';
import { clearHiddenDescendantAnswers } from '../../ayu-library/utils/question.utils';
import { buildVisitSummary } from '../utils/visit-summary.util';

interface UseFHIRStepperProps {
  questionnaire: FhirQuestionnaire;
  autoNext?: boolean;
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
}

export const useFHIRStepper = (
  props: UseFHIRStepperProps
): UseFHIRStepperReturn => {
  const { questionnaire, autoNext = true, onComplete } = props;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AyuAnswerValue>>({});
  const [showAll, setShowAll] = useState(false);
  const isAdvancingRef = useRef(false);
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

  const handleComplete = () => {
    const answersMap = new Map(Object.entries(answers));
    const sections = buildVisitSummary(
      topLevelItems,
      answersMap,
      questionnaire?.text || 'Visit reason'
    );
    // Add per-section onChange callbacks
    sections.forEach(section => {
      section.onChange = () => {
        const targetIndex = topLevelItems.findIndex(item => {
          if (section.title === 'Associated symptoms') {
            return item.extension?.some(
              ext => ext.valueString === 'Associated symptoms'
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
      title: '2/4. Visit reason summary',
      sections,
      confirmText: 'Confirm',
      cancelText: 'Back',
      open: false,
      type: 'vitalConfirm',
      size: 'lg',
      onConfirm: () => {
        setShowAll(true);
        onComplete?.(answers);
      },
    });
  };

  const clearAnswers = (linkIds: string[]) => {
    setAnswers(prev => {
      const updated = { ...prev };
      for (const id of linkIds) {
        delete updated[id];
      }
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

      // Disable autoNext for required string
      if (currentQuestion.type === 'string' && currentQuestion.required) {
        return updated;
      }

      // If changed question is not current top-level, don't auto advance
      if (currentQuestion.linkId !== getTopLevelLinkId(linkId)) {
        return updated;
      }

      const shouldMoveNext = isTopLevelComplete(currentQuestion, updated);

      const hasVisibleStringChild = currentQuestion.item?.some(child => {
        return (
          evaluateEnableWhen(child.enableWhen, updated) &&
          child.type === 'string'
        );
      });

      const isLastQuestion = currentIndex === structuralTotal - 1;

      const hasNestedRepeats = currentQuestion.item?.some(
        child =>
          child.type === 'choice' &&
          child.repeats &&
          evaluateEnableWhen(child.enableWhen, updated)
      );

      if (
        shouldMoveNext &&
        !hasVisibleStringChild &&
        !isAdvancingRef.current &&
        !isLastQuestion &&
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

    const isChild = currentQuestion.item?.some(
      child => child.linkId === linkId
    );

    return isChild ? currentQuestion.linkId : linkId;
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
  };
};
