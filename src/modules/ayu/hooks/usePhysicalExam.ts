import { useEffect, useMemo, useRef, useState } from 'react';
import { fileToBase64 } from '../../profile/profile.helpers';
import {
  filterPhysicalExamQuestions,
  PHYSICAL_EXAM_QUESTIONS,
  type PhysicalExamAnswers,
  type PhysicalExamOption,
} from '../data/physical-exam.data';
import type { SectionProps } from '../types/start-visit.types';

/** Recompute visible questions for a given answer state (used for look-ahead in selectAndAdvance) */
const computeVisible = (
  base: typeof PHYSICAL_EXAM_QUESTIONS,
  answers: PhysicalExamAnswers
) =>
  base.filter(q => {
    if (!q.showWhen) return true;
    return (answers[q.showWhen.questionId] ?? []).includes(q.showWhen.optionId);
  });

export const usePhysicalExam = ({
  onNextQuestion,
  onPrevSection,
  onProgressUpdate,
  physicalExamFilter,
}: SectionProps) => {
  const baseQuestions = useMemo(
    () =>
      filterPhysicalExamQuestions(
        PHYSICAL_EXAM_QUESTIONS,
        physicalExamFilter ?? ''
      ),
    [physicalExamFilter]
  );
  const [internalIndex, setInternalIndex] = useState(0);
  const [answers, setAnswers] = useState<PhysicalExamAnswers>({});
  /** base64 data-URL images captured per question */
  const [cameraImages, setCameraImages] = useState<Record<string, string[]>>(
    {}
  );

  const visibleQuestions = useMemo(
    () => computeVisible(baseQuestions, answers),
    [baseQuestions, answers]
  );
  const totalQuestions = visibleQuestions.length;
  const currentQuestion = visibleQuestions[internalIndex] ?? null;
  const isLastQuestion = internalIndex >= totalQuestions - 1;

  /** Keep a ref so goNext() sees the up-to-date isLastQuestion without stale closures */
  const isLastRef = useRef(isLastQuestion);
  isLastRef.current = isLastQuestion;

  useEffect(() => {
    onProgressUpdate?.(totalQuestions, internalIndex);
  }, [totalQuestions, internalIndex, onProgressUpdate]);

  /** Select a single-choice option and immediately advance to the next question.
   *  Computes the new visibility BEFORE committing state so the advance decision
   *  accounts for newly visible conditional questions. */
  const selectAndAdvance = (optionId: string) => {
    if (!currentQuestion) return;
    const { id: questionId } = currentQuestion;
    const newAnswers = { ...answers, [questionId]: [optionId] };
    const newVisible = computeVisible(baseQuestions, newAnswers);
    const newIsLast = internalIndex >= newVisible.length - 1;

    setAnswers(newAnswers);
    if (newIsLast) {
      onNextQuestion();
    } else {
      setInternalIndex(prev => prev + 1);
    }
  };

  /** Toggle a multi-choice option (no auto-advance). */
  const toggleOption = (optionId: string) => {
    if (!currentQuestion) return;
    const { id: questionId, options } = currentQuestion;
    const option = options.find((o: PhysicalExamOption) => o.id === optionId);

    setAnswers(prev => {
      const current = prev[questionId] ?? [];

      if (option?.isExclusiveOption) {
        return { ...prev, [questionId]: [optionId] };
      }
      if (option?.excludeFromMulti) {
        return { ...prev, [questionId]: [optionId] };
      }

      const filtered = current.filter(id => {
        const o = options.find((opt: PhysicalExamOption) => opt.id === id);
        return !o?.isExclusiveOption && !o?.excludeFromMulti;
      });

      if (filtered.includes(optionId)) {
        return {
          ...prev,
          [questionId]: filtered.filter(id => id !== optionId),
        };
      }
      return { ...prev, [questionId]: [...filtered, optionId] };
    });
  };

  /** Explicit advance (used by multi-choice Next). */
  const goNext = () => {
    if (isLastRef.current) {
      onNextQuestion();
    } else {
      setInternalIndex(prev => prev + 1);
    }
  };

  /** Skip current question — clears its answer and images before advancing. */
  const goSkip = () => {
    if (currentQuestion) {
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: [] }));
      setCameraImages(prev => ({ ...prev, [currentQuestion.id]: [] }));
    }
    if (isLastRef.current) {
      onNextQuestion();
    } else {
      setInternalIndex(prev => prev + 1);
    }
  };

  /** Go back one question, or exit to the previous section from question 0. */
  const goBack = () => {
    if (internalIndex === 0) {
      onPrevSection?.();
    } else {
      setInternalIndex(prev => prev - 1);
    }
  };

  const selectedOptionsFor = (questionId: string): string[] =>
    answers[questionId] ?? [];

  const cameraImagesFor = (questionId: string): string[] =>
    cameraImages[questionId] ?? [];

  const addCameraImage = async (questionId: string, file: File) => {
    const base64 = await fileToBase64(file);
    setCameraImages(prev => ({
      ...prev,
      [questionId]: [...(prev[questionId] ?? []), base64],
    }));
  };

  const removeCameraImage = (questionId: string, index: number) => {
    setCameraImages(prev => ({
      ...prev,
      [questionId]: (prev[questionId] ?? []).filter((_, i) => i !== index),
    }));
  };

  const clearCameraImages = (questionId: string) => {
    setCameraImages(prev => ({ ...prev, [questionId]: [] }));
  };

  return {
    internalIndex,
    visibleQuestions,
    totalQuestions,
    currentQuestion,
    isLastQuestion,
    selectedOptionsFor,
    cameraImagesFor,
    addCameraImage,
    removeCameraImage,
    clearCameraImages,
    selectAndAdvance,
    toggleOption,
    goNext,
    goSkip,
    goBack,
  };
};
