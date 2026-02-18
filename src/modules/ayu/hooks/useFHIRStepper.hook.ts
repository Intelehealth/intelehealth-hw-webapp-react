import { useMemo, useRef, useState } from 'react';
import type {
  AyuAnswerValue,
  AyuQuestion,
  DurationAnswer,
} from '../types/ayu.types';

interface UseFHIRStepperProps {
  questionnaire: AyuQuestion | { item?: AyuQuestion[] };
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
  setAnswer: (linkId: string, value: AyuAnswerValue) => void;
  goNext: () => void;
  topLevelItems: AyuQuestion[];
  isLast: boolean;
}

export const useFHIRStepper = (
  props: UseFHIRStepperProps
): UseFHIRStepperReturn => {
  const { questionnaire, autoNext = true, onComplete } = props;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AyuAnswerValue>>({});
  const isAdvancingRef = useRef(false);

  const topLevelItems = useMemo(() => {
    const items = questionnaire?.item || [];
    return items.filter((item: AyuQuestion) => item.type !== 'group');
  }, [questionnaire]);

  const structuralTotal = topLevelItems.length;

  const currentQuestion = topLevelItems[currentIndex];

  const goNext = () => {
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
    // TODO:
    // - Submit QuestionnaireResponse
    // - Navigate to summary screen
    // - Call API
    onComplete?.(answers);
  };

  const setAnswer = (linkId: string, value: AyuAnswerValue) => {
    setAnswers(prev => {
      const updated: Record<string, AyuAnswerValue> = {
        ...prev,
        [linkId]: value,
      };

      if (!autoNext || !currentQuestion) return updated;

      // Disable autoNext for required string
      if (currentQuestion.type === 'string' && currentQuestion.required) {
        return updated;
      }

      // Disable autoNext for quantity type
      if (currentQuestion.type === 'quantity') {
        return updated;
      }

      // If the changed question is not the current top-level question, do not auto-advance
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

            return updated[rule.question] === expected;
          });

        return isVisible && child.type === 'string';
      });

      // Check if we're on the last question
      const isLastQuestion = currentIndex === structuralTotal - 1;

      // Auto-move to next question if current top-level question is complete and has no visible string children
      // BUT don't auto-advance on the last question - require manual submit
      if (
        shouldMoveNext &&
        !hasVisibleStringChild &&
        !isAdvancingRef.current &&
        !isLastQuestion
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
    if (!updatedAnswers[question.linkId]) return false;

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

          return updatedAnswers[rule.question] === expected;
        });

      if (!isVisible) continue;

      if (!updatedAnswers[child.linkId]) {
        return false;
      }
    }

    return true;
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
  };
};
