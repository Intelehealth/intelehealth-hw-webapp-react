import { useMemo, useRef, useState } from 'react';
import iconVisitReasonSummary from '../../../assets/icons/visit-reason.svg';
import { useGlobalModal } from '../../../components/modal/global-modal-context';
import type {
  AyuAnswerValue,
  AyuQuestion,
  DurationAnswer,
  FhirQuestionnaire,
} from '../types/ayu.types';
import { buildVisitSummary } from '../utils/visit-summary.util';

interface UseFHIRStepperProps {
  questionnaire: FhirQuestionnaire;
  autoNext?: boolean;
  onComplete?: (answers: Record<string, AyuAnswerValue>) => void;
}

const isDurationAnswer = (value: unknown): value is DurationAnswer => {
  return (
    typeof value === 'object' && value !== null && 'dropdownValues' in value
  );
};

interface UseFHIRStepperReturn {
  currentQuestion: AyuQuestion | undefined;
  currentIndex: number;
  total: number;
  answers: Record<string, AyuAnswerValue>;
  setAnswer: (question: AyuQuestion, value: AyuAnswerValue) => void;
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

          const selectedValue = value as string;

          const isExclusive = isMutuallyExclusiveOption(
            question,
            selectedValue
          );

          // If clicked option is mutually exclusive
          if (isExclusive) {
            // If already selected → unselect
            if (currentArray.includes(selectedValue)) {
              finalValue = [];
            } else {
              // Replace all with only this option
              finalValue = [selectedValue];
            }
          } else {
            // Normal option clicked

            // Remove any mutually exclusive option from array
            const filtered = currentArray.filter(code => {
              return !isMutuallyExclusiveOption(question, code);
            });

            if (filtered.includes(selectedValue)) {
              finalValue = filtered.filter(v => v !== selectedValue);
            } else {
              finalValue = [...filtered, selectedValue];
            }
          }
        }
      }

      const updated: Record<string, AyuAnswerValue> = {
        ...prev,
        [linkId]: finalValue,
      };

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
        const isVisible =
          !child.enableWhen ||
          child.enableWhen.every(rule => {
            const expected =
              rule.answerBoolean ??
              rule.answerString ??
              rule.answerInteger ??
              rule.answerCoding?.code;

            const parentAnswer = updated[rule.question];

            if (Array.isArray(parentAnswer)) {
              return parentAnswer.includes(expected as string);
            }

            return parentAnswer === expected;
          });

        return isVisible && child.type === 'string';
      });

      const isLastQuestion = currentIndex === structuralTotal - 1;

      const hasNestedRepeats = currentQuestion.item?.some(
        child => child.type === 'choice' && child.repeats
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

  const isTopLevelComplete = (
    question: AyuQuestion,
    updatedAnswers: Record<string, unknown>
  ) => {
    // Parent must be answered
    const parentAnswer = updatedAnswers[question.linkId];

    if (
      question.repeats
        ? !Array.isArray(parentAnswer) || parentAnswer.length === 0
        : !parentAnswer
    ) {
      return false;
    }

    // For choice questions, check if any nested child has duration structure
    if (question.type === 'choice' && question.item?.length) {
      for (const child of question.item) {
        const childAnswer = updatedAnswers[child.linkId];
        if (isDurationAnswer(childAnswer)) {
          // Must have both number and days filled
          const hasNumber = !!childAnswer.dropdownValues?.number;
          const hasDays = !!childAnswer.dropdownValues?.days;
          if (!hasNumber || !hasDays) {
            return false;
          }
        }
      }
    }

    // Also check top-level for duration structure
    const answer = updatedAnswers[question.linkId];
    if (question.type === 'choice' && isDurationAnswer(answer)) {
      // Must have both number and days filled
      const hasNumber = !!answer.dropdownValues?.number;
      const hasDays = !!answer.dropdownValues?.days;
      if (!hasNumber || !hasDays) return false;
    }

    if (!question.item?.length) return true;

    // Check visible nested
    for (const child of question.item) {
      const isVisible =
        !child.enableWhen ||
        child.enableWhen.every(rule => {
          const expected =
            rule.answerBoolean ??
            rule.answerString ??
            rule.answerInteger ??
            rule.answerCoding?.code;

          const parentAnswer = updatedAnswers[rule.question];

          if (Array.isArray(parentAnswer)) {
            return parentAnswer.includes(expected as string);
          }

          return parentAnswer === expected;
        });

      if (!isVisible) continue;

      if (!updatedAnswers[child.linkId]) {
        return false;
      }
    }

    return true;
  };

  const isMutuallyExclusiveOption = (
    question: AyuQuestion,
    optionCode: string
  ) => {
    const option = question.answerOption?.find(
      opt => opt.valueCoding?.code === optionCode
    );

    return option?.extension?.some(
      ext =>
        ext.url === 'urn:intelehealth:mutually-exclusive' &&
        ext.valueBoolean === true
    );
  };

  return {
    currentQuestion,
    currentIndex,
    total: structuralTotal,
    answers,
    setAnswer,
    goNext,
    topLevelItems,
    isLast: currentIndex === structuralTotal - 1,
    showAll,
  };
};
