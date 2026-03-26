import { useEffect, useMemo, useRef, useState } from 'react';
import type { SectionProps } from '../../ayu-library/types/start-visit.types';
import { fileToBase64 } from '../../profile/profile.helpers';
import {
  filterPhysicalExamQuestions,
  PHYSICAL_EXAM_QUESTIONS,
  type PhysicalExamAnswers,
  type PhysicalExamOption,
} from '../data/physical-exam.data';
import {
  addPendingImage,
  clearPendingImages,
  removePendingImage,
} from '../services/obs.service';
import type { CapturedImage } from '../types/obs.types';
import {
  parsePhysExamJson,
  type PhysExamRawRoot,
} from '../utils/parsePhysExamJson';
import { useAyuJsonList } from './useAyuJson.hook';

const computeVisible = (
  base: typeof PHYSICAL_EXAM_QUESTIONS,
  answers: PhysicalExamAnswers
) =>
  base.filter(
    q =>
      !q.showWhen ||
      (answers[q.showWhen.questionId] ?? []).includes(q.showWhen.optionId)
  );

const allReqMet = (
  questions: typeof PHYSICAL_EXAM_QUESTIONS,
  ans: PhysicalExamAnswers
) =>
  questions.filter(q => q.isRequired).every(q => (ans[q.id] ?? []).length > 0);

const sectionComment = (
  questions: typeof PHYSICAL_EXAM_QUESTIONS,
  qId: string
) =>
  questions.find(q => q.id === qId)?.sectionLabel?.replace(/:$/, '') ??
  'General exams';

export const usePhysicalExam = ({
  onNextQuestion,
  onPrevSection,
  onProgressUpdate,
  physicalExamFilter,
}: SectionProps) => {
  const ayuList = useAyuJsonList('IDA6');
  const serverQuestions = useMemo(() => {
    const item = ayuList.find(i => i.name === 'physExam.json');
    return item
      ? parsePhysExamJson(item.json as unknown as PhysExamRawRoot)
      : null;
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
  const allRequiredAnswered = useMemo(
    () => allReqMet(visibleQuestions, answers),
    [visibleQuestions, answers]
  );

  const isLastRef = useRef(isLastQuestion);
  isLastRef.current = isLastQuestion;

  useEffect(() => {
    onProgressUpdate?.(totalQuestions, internalIndex);
  }, [totalQuestions, internalIndex, onProgressUpdate]);

  const advance = (isLast: boolean, reqMet: boolean) => {
    if (isLast) {
      if (reqMet) onNextQuestion();
    } else setInternalIndex(prev => prev + 1);
  };

  const selectSingle = (optionId: string, targetQuestionId: string) => {
    const question = visibleQuestions.find(q => q.id === targetQuestionId);
    if (!question) return;
    const cameraIds = (answers[targetQuestionId] ?? []).filter(
      id =>
        question.options.find((o: PhysicalExamOption) => o.id === id)?.isCamera
    );
    setAnswers(prev => ({
      ...prev,
      [targetQuestionId]: [...cameraIds, optionId],
    }));
  };

  const selectAndAdvance = (optionId: string) => {
    if (!currentQuestion) return;
    const { id: questionId } = currentQuestion;
    const newAnswers = { ...answers, [questionId]: [optionId] };
    const newVisible = computeVisible(baseQuestions, newAnswers);
    setAnswers(newAnswers);
    advance(
      internalIndex >= newVisible.length - 1,
      allReqMet(newVisible, newAnswers)
    );
  };

  const toggleOption = (optionId: string, targetQuestionId?: string) => {
    const question = targetQuestionId
      ? (visibleQuestions.find(q => q.id === targetQuestionId) ??
        currentQuestion)
      : currentQuestion;
    if (!question) return;
    const { id: questionId, options } = question;
    const option = options.find((o: PhysicalExamOption) => o.id === optionId);

    setAnswers(prev => {
      const current = prev[questionId] ?? [];
      if (option?.isCamera) {
        return current.includes(optionId)
          ? { ...prev, [questionId]: current.filter(id => id !== optionId) }
          : { ...prev, [questionId]: [...current, optionId] };
      }
      if (option?.isExclusiveOption)
        return { ...prev, [questionId]: [optionId] };
      if (option?.excludeFromMulti)
        return { ...prev, [questionId]: [optionId] };

      const filtered = current.filter(id => {
        const o = options.find((opt: PhysicalExamOption) => opt.id === id);
        return o?.isCamera || (!o?.isExclusiveOption && !o?.excludeFromMulti);
      });
      return filtered.includes(optionId)
        ? { ...prev, [questionId]: filtered.filter(id => id !== optionId) }
        : { ...prev, [questionId]: [...filtered, optionId] };
    });
  };

  const goNext = () => advance(isLastRef.current, allRequiredAnswered);

  const goSkip = () => {
    if (currentQuestion) {
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: [] }));
      clearCameraImgs(currentQuestion.id);
    }
    advance(isLastRef.current, allRequiredAnswered);
  };

  const goBack = () => {
    if (internalIndex === 0) onPrevSection?.();
    else setInternalIndex(prev => prev - 1);
  };

  const selectedOptionsFor = (questionId: string): string[] =>
    answers[questionId] ?? [];
  const cameraImagesFor = (questionId: string): string[] =>
    (cameraImages[questionId] ?? []).map(img => img.preview);

  const addCameraImage = async (questionId: string, file: File) => {
    const preview = await fileToBase64(file);
    addPendingImage(file, sectionComment(baseQuestions, questionId));
    setCameraImages(prev => ({
      ...prev,
      [questionId]: [...(prev[questionId] ?? []), { file, preview }],
    }));
  };

  const removeCameraImage = (questionId: string, index: number) => {
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

  const clearCameraImgs = (questionId: string) => {
    clearPendingImages();
    const remaining = { ...cameraImages, [questionId]: [] };
    for (const [qId, imgs] of Object.entries(remaining))
      for (const img of imgs)
        addPendingImage(img.file, sectionComment(baseQuestions, qId));
    setCameraImages(prev => ({ ...prev, [questionId]: [] }));
  };

  return {
    internalIndex,
    visibleQuestions,
    totalQuestions,
    currentQuestion,
    isLastQuestion,
    answers,
    selectedOptionsFor,
    cameraImagesFor,
    addCameraImage,
    removeCameraImage,
    clearCameraImages: clearCameraImgs,
    selectAndAdvance,
    selectSingle,
    toggleOption,
    goNext,
    goSkip,
    goBack,
    onPrevSection,
    allRequiredAnswered,
  };
};
