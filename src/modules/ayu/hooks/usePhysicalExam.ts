import { useEffect, useMemo, useRef, useState } from 'react';
import type { SectionProps } from '../../ayu-library/types/start-visit.types';
import { fileToBase64 } from '../../profile/profile.helpers';
import { storage } from '../../../utils/storage';
import { useStartVisitData } from '../context/start-visit.context';
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
import {
  getChildResources,
  upsertAssetResource,
} from '../services/temp-storage.service';
import type { CapturedImage } from '../types/obs.types';
import { AYU_JSON_KEY_NAME } from '../utils/ayu.constants';
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
  initialAnswers,
}: SectionProps & { initialAnswers?: PhysicalExamAnswers }) => {
  const { visitId } = useStartVisitData();
  const ayuList = useAyuJsonList(AYU_JSON_KEY_NAME);
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
  const hasInitial = initialAnswers && Object.keys(initialAnswers).length > 0;
  const [answers, setAnswers] = useState<PhysicalExamAnswers>(
    initialAnswers ?? {}
  );
  const [cameraImages, setCameraImages] = useState<
    Record<string, CapturedImage[]>
  >({});

  // Restore camera images from temp-storage assets on init
  const hasRestoredImages = useRef(false);
  useEffect(() => {
    if (!hasInitial || hasRestoredImages.current) return;
    hasRestoredImages.current = true;
    (async () => {
      try {
        const res = await getChildResources<{ questionId: string }>(
          'visit',
          visitId,
          'asset'
        );
        if (!res.data?.length) return;
        const restored: Record<string, CapturedImage[]> = {};
        for (const record of res.data) {
          const qId = record.data?.questionId;
          if (!qId || !record.file_path) continue;
          if (!restored[qId]) restored[qId] = [];
          restored[qId].push({
            file: null,
            preview: record.file_path,
            assetRecordId: record.id,
          });
        }
        if (Object.keys(restored).length > 0) {
          setCameraImages(restored);
        }
      } catch {
        // Restore failed — images won't show but answers are intact
      }
    })();
  }, [hasInitial, visitId]);

  const [internalIndex, setInternalIndex] = useState(() => {
    if (!hasInitial) return 0;
    const visible = computeVisible(baseQuestions, initialAnswers);
    let lastAnswered = -1;
    for (let i = visible.length - 1; i >= 0; i--) {
      if ((initialAnswers[visible[i].id] ?? []).length > 0) {
        lastAnswered = i;
        break;
      }
    }
    return lastAnswered >= 0
      ? Math.min(lastAnswered + 1, visible.length - 1)
      : 0;
  });

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

  // Count of questions that have actual answers (not just the pointer position).
  // Used as the "answered" count in progress updates so the parent can reflect
  // true completion state (especially on restore where internalIndex is clamped).
  const answeredCount = useMemo(
    () => visibleQuestions.filter(q => (answers[q.id] ?? []).length > 0).length,
    [visibleQuestions, answers]
  );

  useEffect(() => {
    onProgressUpdate?.(totalQuestions, answeredCount);
  }, [totalQuestions, answeredCount, onProgressUpdate]);

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

    const resourceId = `${visitId}_${questionId}_${Date.now()}`;
    let assetRecordId: number | undefined;
    try {
      let createdBy = 'unknown';
      try {
        const u = storage.getUser();
        if (u) createdBy = JSON.parse(u).uuid ?? u;
      } catch {
        /* fallback */
      }
      const res = await upsertAssetResource<{ questionId: string }>(file, {
        resource_id: resourceId,
        parent_type: 'visit',
        parent_id: visitId,
        created_by: createdBy,
        data: { questionId },
      });
      assetRecordId = res.data.id;
    } catch {
      // Upload failed — image still available in memory for current session
    }

    setCameraImages(prev => ({
      ...prev,
      [questionId]: [
        ...(prev[questionId] ?? []),
        { file, preview, assetRecordId },
      ],
    }));
  };

  const removeCameraImage = (questionId: string, index: number) => {
    const target = cameraImages[questionId]?.[index];
    if (target?.file) {
      let flatIndex = 0;
      for (const [qId, imgs] of Object.entries(cameraImages)) {
        if (qId === questionId) {
          for (let i = 0; i < index; i++) {
            if (imgs[i]?.file) flatIndex++;
          }
          break;
        }
        flatIndex += imgs.filter(img => img.file).length;
      }
      removePendingImage(flatIndex);
    }
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
        if (img.file)
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
