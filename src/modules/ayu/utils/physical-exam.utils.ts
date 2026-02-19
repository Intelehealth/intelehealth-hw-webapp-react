import type {
  PhysicalExamData,
  PhysicalExamOption,
  FlattenedQuestion,
} from '../types/physical-exam.types';

/**
 * Flattens the nested physical exam structure into a linear array of questions
 */
export const flattenPhysicalExamQuestions = (
  data: PhysicalExamData
): FlattenedQuestion[] => {
  const questions: FlattenedQuestion[] = [];

  const traverse = (
    options: PhysicalExamOption[],
    categoryPath: string[] = [],
    parentAnswerId?: string
  ) => {
    for (const option of options) {
      // Check if this option has nested questions (is a question itself)
      if (option.options && option.options.length > 0) {
        const hasSubQuestions = option.options.some((opt) => opt.options);

        if (hasSubQuestions) {
          // This is a category, recurse into it
          traverse(option.options, [...categoryPath, option.text], parentAnswerId);
        } else {
          // This is a question with answer options
          questions.push({
            id: option.id,
            text: option.text,
            categoryPath: [...categoryPath],
            isRequired: option.isRequired === 'true' || option.isRequired === true,
            multiChoice: option['multi-choice'] === true,
            enableExclusiveOption:
              option['enable-exclusive-option'] === 'true' ||
              option['enable-exclusive-option'] === true,
            jobAidType: option['job-aid-type'],
            jobAidFile: option['job-aid-file'],
            options: option.options,
            parentAnswerId,
          });

          // Check for nested questions in answer options
          for (const answerOption of option.options) {
            if (
              answerOption.havingNestedQuestion === 'true' ||
              answerOption.havingNestedQuestion === true
            ) {
              if (answerOption.options && answerOption.options.length > 0) {
                traverse(
                  answerOption.options,
                  [...categoryPath, option.text],
                  answerOption.id
                );
              }
            }
          }
        }
      }
    }
  };

  if (data.options) {
    traverse(data.options);
  }

  return questions;
};

/**
 * Gets visible questions based on current answers (for nested questions)
 */
export const getVisibleQuestions = (
  allQuestions: FlattenedQuestion[],
  answers: Record<string, string | string[]>
): FlattenedQuestion[] => {
  const visibleQuestions = allQuestions.filter((question) => {
    // Always show questions without parent dependencies
    if (!question.parentAnswerId) {
      return true;
    }

    // Check if the parent answer that triggers this question has been selected
    const parentQuestion = allQuestions.find((q) =>
      q.options.some((opt) => opt.id === question.parentAnswerId)
    );

    if (!parentQuestion) {
      return false;
    }

    const parentAnswer = answers[parentQuestion.id];

    if (!parentAnswer) {
      return false;
    }

    // Check if the parent answer includes the triggering answer
    if (Array.isArray(parentAnswer)) {
      return parentAnswer.includes(question.parentAnswerId);
    }

    return parentAnswer === question.parentAnswerId;
  });

  return visibleQuestions;
};

/**
 * Validates if all required questions have been answered
 */
export const validateRequiredQuestions = (
  questions: FlattenedQuestion[],
  answers: Record<string, string | string[]>
): { isValid: boolean; missingQuestions: string[] } => {
  const visibleQuestions = getVisibleQuestions(questions, answers);
  const missingQuestions: string[] = [];

  for (const question of visibleQuestions) {
    if (question.isRequired) {
      const answer = answers[question.id];
      if (!answer || (Array.isArray(answer) && answer.length === 0)) {
        missingQuestions.push(question.text);
      }
    }
  }

  return {
    isValid: missingQuestions.length === 0,
    missingQuestions,
  };
};
