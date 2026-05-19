import { useEffect, useRef, useState } from 'react';
import { storage } from '../../../utils/storage';
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
import { fileToBase64 } from '../../profile/profile.helpers';

/**
 * Hook that owns the camera-image lifecycle for a Physical Exam visit.
 *
 * Lifted out of usePhysicalExam so it can be consumed by the new
 * AyuStepperContainer-based PE flow (via PhysicalExamCameraContext) without
 * dragging in the whole question/answer state machine.
 *
 * Responsibilities:
 *  - Maintain per-question camera image state (CapturedImage[])
 *  - Restore previously uploaded images on mount from temp-storage assets
 *  - Upload new images via upsertAssetResource and mirror them into the
 *    "pending images" queue used by the upload pipeline
 *  - Keep the pending-image queue consistent on remove/clear
 */
export interface UsePhysicalExamCameraImagesParams {
  visitId: string | number | null | undefined;
  /**
   * Returns the human-readable section/comment for a given question id —
   * passed to addPendingImage so the upload pipeline can group images.
   */
  sectionCommentFor: (questionId: string) => string;
}

export interface UsePhysicalExamCameraImagesReturn {
  /** Preview URLs (data URI or remote URL) for a question's captured images. */
  cameraImagesFor: (questionId: string) => string[];
  /** Captures a file: uploads as an asset resource and queues as pending. */
  addCameraImage: (questionId: string, file: File) => Promise<void>;
  /** Removes a single captured image (index) and de-queues it from pending. */
  removeCameraImage: (questionId: string, index: number) => void;
  /** Clears every image for a question and rebuilds the pending queue. */
  clearCameraImages: (questionId: string) => void;
}

export const usePhysicalExamCameraImages = ({
  visitId,
  sectionCommentFor,
}: UsePhysicalExamCameraImagesParams): UsePhysicalExamCameraImagesReturn => {
  const [cameraImages, setCameraImages] = useState<
    Record<string, CapturedImage[]>
  >({});

  const hasRestoredRef = useRef(false);
  useEffect(() => {
    if (hasRestoredRef.current) return;
    if (visitId == null || visitId === '') return;
    hasRestoredRef.current = true;
    (async () => {
      try {
        const res = await getChildResources<{ questionId: string }>(
          'visit',
          String(visitId),
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
  }, [visitId]);

  const cameraImagesFor = (questionId: string): string[] =>
    (cameraImages[questionId] ?? []).map(img => img.preview);

  const addCameraImage = async (questionId: string, file: File) => {
    const preview = await fileToBase64(file);
    addPendingImage(file, sectionCommentFor(questionId));

    if (visitId == null || visitId === '') {
      setCameraImages(prev => ({
        ...prev,
        [questionId]: [...(prev[questionId] ?? []), { file, preview }],
      }));
      return;
    }

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
        parent_id: String(visitId),
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

  const clearCameraImages = (questionId: string) => {
    clearPendingImages();
    const remaining = { ...cameraImages, [questionId]: [] };
    for (const [qId, imgs] of Object.entries(remaining)) {
      for (const img of imgs) {
        if (img.file) addPendingImage(img.file, sectionCommentFor(qId));
      }
    }
    setCameraImages(prev => ({ ...prev, [questionId]: [] }));
  };

  return {
    cameraImagesFor,
    addCameraImage,
    removeCameraImage,
    clearCameraImages,
  };
};
