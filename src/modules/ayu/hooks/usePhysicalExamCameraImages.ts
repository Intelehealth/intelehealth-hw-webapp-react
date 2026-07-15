import { useEffect, useRef, useState } from 'react';
import { storage } from '../../../utils/storage';
import {
  addPendingImage,
  removePendingImagesByQuestionId,
} from '../services/obs.service';
import {
  deleteAssetResource,
  getChildResources,
  getDeletedAssetIds,
  markQuestionCommitted,
  unmarkQuestionCommitted,
  upsertAssetResource,
} from '../services/temp-storage.service';
import type { CapturedImage } from '../types/obs.types';

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
  /** Captures a file: uploads as an asset resource (local state only, not pending queue). */
  addCameraImage: (questionId: string, file: File) => Promise<void>;
  /** Removes a single captured image (index) from local state. */
  removeCameraImage: (questionId: string, index: number) => void;
  /** Clears every image for a question from local state and pending queue. */
  clearCameraImages: (questionId: string) => void;
  /** Commits a single question's images to the pending-upload queue.
   *  Removes any previously committed images for the same question first,
   *  then adds the current ones. Call on explicit Upload click. */
  commitQuestionImages: (questionId: string) => void;
}

/**
 * Module-level store that mirrors captured File objects for each question.
 * Updated synchronously when images are added/removed, so commitQuestionImages
 * can always read the latest files without depending on React state timing.
 */
const capturedFileStore = new Map<
  string,
  Array<{ file: File; comment: string }>
>();

export const usePhysicalExamCameraImages = ({
  visitId,
  sectionCommentFor,
}: UsePhysicalExamCameraImagesParams): UsePhysicalExamCameraImagesReturn => {
  const [cameraImages, setCameraImages] = useState<
    Record<string, CapturedImage[]>
  >({});

  const cameraImagesRef = useRef(cameraImages);
  cameraImagesRef.current = cameraImages;

  const hasRestoredRef = useRef(false);
  useEffect(() => {
    // Clear stale module-level data from any previous mount so restored images
    // don't mix with old File-backed entries from a prior capture session.
    capturedFileStore.clear();

    if (hasRestoredRef.current) return;
    if (visitId == null || visitId === '') return;
    hasRestoredRef.current = true;
    (async () => {
      try {
        const res = await getChildResources<{
          questionId: string;
          comment?: string;
        }>('visit', String(visitId), 'asset');
        if (!res.data?.length) return;
        const deletedIds = getDeletedAssetIds();
        const restored: Record<string, CapturedImage[]> = {};
        for (const record of res.data) {
          const qId = record.data?.questionId;
          if (!qId || !record.file_path) continue;
          // Skip assets that were deleted this session
          if (deletedIds.has(record.id)) continue;
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

    // Clean up module-level store when this hook unmounts (user leaves PE)
    return () => {
      capturedFileStore.clear();
    };
  }, [visitId]);

  const cameraImagesFor = (questionId: string): string[] =>
    (cameraImages[questionId] ?? []).map(img => img.preview);

  const addCameraImage = async (questionId: string, file: File) => {
    const comment = sectionCommentFor(questionId);
    // URL.createObjectURL is instant — no need to read/convert the file data.
    const preview = URL.createObjectURL(file);

    // Synchronously mirror the file into the module-level store so
    // commitQuestionImages can always read it, regardless of React state timing.
    const bucket = capturedFileStore.get(questionId) ?? [];
    bucket.push({ file, comment });
    capturedFileStore.set(questionId, bucket);

    // Show the preview immediately so the user sees feedback right away.
    setCameraImages(prev => ({
      ...prev,
      [questionId]: [...(prev[questionId] ?? []), { file, preview }],
    }));

    // Upload to temp-storage in the background — don't block the UI.
    if (visitId == null || visitId === '') return;

    const resourceId = `${visitId}_${questionId}_${Date.now()}`;
    try {
      let createdBy = 'unknown';
      try {
        const u = storage.getUser();
        if (u) createdBy = JSON.parse(u).uuid ?? u;
      } catch {
        /* fallback */
      }
      const res = await upsertAssetResource<{
        questionId: string;
        comment: string;
      }>(file, {
        resource_id: resourceId,
        parent_type: 'visit',
        parent_id: String(visitId),
        created_by: createdBy,
        data: { questionId, comment },
      });
      // Patch the assetRecordId into state so removeCameraImage can delete it.
      const recordId = res.data.id;
      setCameraImages(prev => ({
        ...prev,
        [questionId]: (prev[questionId] ?? []).map(img =>
          img.file === file ? { ...img, assetRecordId: recordId } : img
        ),
      }));
    } catch {
      // Upload failed — image still available in memory for current session
    }
  };

  const removeCameraImage = (questionId: string, index: number) => {
    const target = cameraImagesRef.current[questionId]?.[index];
    if (target?.assetRecordId) {
      deleteAssetResource(target.assetRecordId).catch(() => {});
    }
    // Revoke blob URL to free memory
    if (target?.preview?.startsWith('blob:')) {
      URL.revokeObjectURL(target.preview);
    }
    // Remove from the pending queue — the user must click Upload again to
    // re-commit remaining images. Avoids index corruption when multiple
    // removals are batched by React before a re-render.
    removePendingImagesByQuestionId(questionId);
    // Rebuild capturedFileStore from the remaining React state (filter-based,
    // not index-splice, so it stays correct under batching).
    setCameraImages(prev => {
      const updated = (prev[questionId] ?? []).filter((_, i) => i !== index);
      // Synchronously rebuild the module-level store from surviving entries
      capturedFileStore.set(
        questionId,
        updated
          .filter(img => img.file != null)
          .map(img => ({
            file: img.file!,
            comment: sectionCommentFor(questionId),
          }))
      );
      // If all images for this question are gone, unmark it as committed
      // so the Visit Summary won't try to load them from temp-storage.
      if (updated.length === 0) {
        unmarkQuestionCommitted(questionId);
      }
      return { ...prev, [questionId]: updated };
    });
  };

  const clearCameraImages = (questionId: string) => {
    const imgs = cameraImagesRef.current[questionId] ?? [];
    for (const img of imgs) {
      if (img.assetRecordId) {
        deleteAssetResource(img.assetRecordId).catch(() => {});
      }
      // Revoke blob URL to free memory
      if (img.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(img.preview);
      }
    }
    // Clear from module-level store
    capturedFileStore.delete(questionId);
    // Also remove any committed images for this question from the upload queue
    removePendingImagesByQuestionId(questionId);
    unmarkQuestionCommitted(questionId);
    setCameraImages(prev => ({ ...prev, [questionId]: [] }));
  };

  const commitQuestionImages = (questionId: string) => {
    // Read from the module-level store — always up-to-date, bypasses React
    // state batching that could cause cameraImagesRef to be stale.
    const entries = capturedFileStore.get(questionId) ?? [];
    // Remove previously committed entries for this question (handles re-upload)
    removePendingImagesByQuestionId(questionId);
    // Add current File-backed images
    for (const entry of entries) {
      addPendingImage(entry.file, entry.comment, questionId);
    }
    // Track this question as committed so the Visit Summary knows to display
    // its images from temp-storage (survives page reload).
    if (entries.length > 0) {
      markQuestionCommitted(questionId);
    }
  };

  return {
    cameraImagesFor,
    addCameraImage,
    removeCameraImage,
    clearCameraImages,
    commitQuestionImages,
  };
};
