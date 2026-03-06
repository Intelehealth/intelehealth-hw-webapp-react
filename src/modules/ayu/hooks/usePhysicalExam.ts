import { useEffect, useMemo, useRef, useState } from 'react';
import { fileToBase64 } from '../../profile/profile.helpers';
import {
  filterPhysicalExamQuestions,
  PHYSICAL_EXAM_QUESTIONS,
  type PhysicalExamAnswers,
  type PhysicalExamOption,
} from '../data/physical-exam.data';
import { useAyuJsonList } from './useAyuJson.hook';
import {
  parsePhysExamJson,
  type PhysExamRawRoot,
} from '../utils/parsePhysExamJson';
import {
  clearPendingImages,
  addPendingImage,
  removePendingImage,
} from '../services/obs.service';
import type { CapturedImage } from '../types/obs.types';
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
  const ayuList = useAyuJsonList('IDA6');
  const serverQuestions = useMemo(() => {
    const item = ayuList.find(i => i.name === 'physExam.json');
    if (!item) return null;
    return parsePhysExamJson(item.json as unknown as PhysExamRawRoot);
  }, [ayuList]);

  const baseQuestions = useMemo(
    () =>
      filterPhysicalExamQuestions(
        serverQuestions ?? PHYSICAL_EXAM_QUESTIONS,
        physicalExamFilter ?? ''
      ),
    [physicalExamFilter, serverQuestions]
  );
  const [internalIndex, setInternalIndex] = useState(0);
  const [answers, setAnswers] = useState<PhysicalExamAnswers>({});
  /** Captured images per question — stores both File (for binary upload) and preview (for display) */
  const [cameraImages, setCameraImages] = useState<
    Record<string, CapturedImage[]>
  >({});

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
      clearCameraImages(currentQuestion.id);
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

  /** Returns base64 preview strings for display in the UI */
  const cameraImagesFor = (questionId: string): string[] =>
    (cameraImages[questionId] ?? []).map(img => img.preview);

  /** Stores both the original File (binary) and base64 preview, and adds to pending upload array */
  const addCameraImage = async (questionId: string, file: File) => {
    const preview = await fileToBase64(file);
    const question = baseQuestions.find(q => q.id === questionId);
    const comment =
      question?.sectionLabel?.replace(/:$/, '') ?? 'General exams';
    addPendingImage(file, comment);
    setCameraImages(prev => ({
      ...prev,
      [questionId]: [...(prev[questionId] ?? []), { file, preview }],
    }));
  };

  const removeCameraImage = (questionId: string, index: number) => {
    // Find the flat index in pendingImages for this question's image
    let flatIndex = 0;
    for (const [qId, imgs] of Object.entries(cameraImages)) {
      if (qId === questionId) {
        flatIndex += index;
        break;
      }
      flatIndex += imgs.length;
    }
    removePendingImage(flatIndex);
    setCameraImages(prev => ({
      ...prev,
      [questionId]: (prev[questionId] ?? []).filter((_, i) => i !== index),
    }));
  };

  const clearCameraImages = (questionId: string) => {
    // Rebuild pending array without this question's images
    clearPendingImages();
    const remaining = { ...cameraImages, [questionId]: [] };
    for (const [qId, imgs] of Object.entries(remaining)) {
      const question = baseQuestions.find(q => q.id === qId);
      const comment =
        question?.sectionLabel?.replace(/:$/, '') ?? 'General exams';
      for (const img of imgs) {
        addPendingImage(img.file, comment);
      }
    }
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
