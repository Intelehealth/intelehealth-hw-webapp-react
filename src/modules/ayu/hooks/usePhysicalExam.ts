import { useState, useMemo, useCallback } from 'react';
import type { FlattenedQuestion } from '../types/physical-exam.types';
import {
  getVisibleQuestions,
  validateRequiredQuestions,
} from '../utils/physical-exam.utils';

export const usePhysicalExam = (allQuestions: FlattenedQuestion[]) => {
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Get visible questions based on current answers
  const visibleQuestions = useMemo(
    () => getVisibleQuestions(allQuestions, answers),
    [allQuestions, answers]
  );

  const currentQuestion = visibleQuestions[currentQuestionIndex];

  // Handle single or multi-choice answer
  const handleAnswer = useCallback(
    (questionId: string, answerId: string, isMultiChoice: boolean, isExclusive: boolean) => {
      setAnswers((prev) => {
        if (isMultiChoice) {
          const currentAnswers = (prev[questionId] as string[]) || [];

          // If this is an exclusive option, clear others and set only this one
          if (isExclusive) {
            return { ...prev, [questionId]: [answerId] };
          }

          // Check if we're selecting an option that excludes others
          const currentQuestion = visibleQuestions.find((q) => q.id === questionId);
          const selectedOption = currentQuestion?.options.find((opt) => opt.id === answerId);

          if (selectedOption?.['exclude-from-multi-choice']) {
            // This option excludes others, so clear all and set only this
            return { ...prev, [questionId]: [answerId] };
          }

          // If we have answers and we're adding a new one, remove any "exclude-from-multi-choice" options
          if (currentAnswers.includes(answerId)) {
            // Remove the answer
            const newAnswers = currentAnswers.filter((id) => id !== answerId);
            return { ...prev, [questionId]: newAnswers };
          } else {
            // Add the answer, but first remove any exclusive options
            const filteredAnswers = currentAnswers.filter((id) => {
              const option = currentQuestion?.options.find((opt) => opt.id === id);
              return !option?.['exclude-from-multi-choice'];
            });
            return { ...prev, [questionId]: [...filteredAnswers, answerId] };
          }
        } else {
          // Single choice
          return { ...prev, [questionId]: answerId };
        }
      });
    },
    [visibleQuestions]
  );

  // Handle image/camera capture - supports multiple images
  const handleImageCapture = useCallback((questionId: string, imageData: string) => {
    setAnswers((prev) => {
      const imageKey = `${questionId}_images`;
      const existingImages = (prev[imageKey] as string[]) || [];
      return {
        ...prev,
        [imageKey]: [...existingImages, imageData],
      };
    });
  }, []);

  // Remove an image from the gallery
  const handleImageRemove = useCallback((questionId: string, imageIndex: number) => {
    setAnswers((prev) => {
      const imageKey = `${questionId}_images`;
      const existingImages = (prev[imageKey] as string[]) || [];
      return {
        ...prev,
        [imageKey]: existingImages.filter((_, index) => index !== imageIndex),
      };
    });
  }, []);

  // Navigate to next question
  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < visibleQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [currentQuestionIndex, visibleQuestions.length]);

  // Navigate to previous question
  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  // Check if current question is answered
  const isCurrentQuestionAnswered = useMemo(() => {
    if (!currentQuestion) return false;
    const answer = answers[currentQuestion.id];
    return !!answer && (!Array.isArray(answer) || answer.length > 0);
  }, [currentQuestion, answers]);

  // Validate all required questions
  const validation = useMemo(
    () => validateRequiredQuestions(allQuestions, answers),
    [allQuestions, answers]
  );

  return {
    currentQuestion,
    currentQuestionIndex,
    totalQuestions: visibleQuestions.length,
    answers,
    handleAnswer,
    handleImageCapture,
    handleImageRemove,
    goToNextQuestion,
    goToPreviousQuestion,
    isCurrentQuestionAnswered,
    isFirstQuestion: currentQuestionIndex === 0,
    isLastQuestion: currentQuestionIndex === visibleQuestions.length - 1,
    validation,
    visibleQuestions,
  };
};
