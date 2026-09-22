import { useEffect, useRef, useState } from 'react';
import { storage } from '../../../utils/storage';
import {
  addPendingImage,
  getPendingImages,
  removePendingImageByAssetId,
  removePendingImageByFile,
  removePendingImagesByQuestionId,
  setPendingImageAssetId,
} from '../services/obs.service';
import {
  getImageCleanupInProgress,
  getPhysicalExamImageGeneration,
} from '../services/physical-exam-images.service';
import {
  deleteAssetResource,
  getChildResources,
  getDeletedAssetIds,
  markQuestionCommitted,
  unmarkQuestionCommitted,
  upsertAssetResource,
} from '../services/temp-storage.service';
import type { CapturedImage, CapturedImageStatus } from '../types/obs.types';
import {
  BLOB_URL_PREFIX,
  DEFAULT_CREATED_BY,
  RESOURCE_TYPE_ASSET,
  RESOURCE_TYPE_VISIT,
} from '../utils/ayu.constants';

export interface UsePhysicalExamCameraImagesParams {
  visitId: string | number | null | undefined;
  sectionCommentFor: (questionId: string) => string;
}

export interface UsePhysicalExamCameraImagesReturn {
  cameraImagesFor: (questionId: string) => string[];
  cameraImageStatesFor: (questionId: string) => CapturedImage[];
  addCameraImage: (questionId: string, file: File) => Promise<void>;
  removeCameraImage: (questionId: string, index: number) => Promise<void>;
  clearCameraImages: (questionId: string) => Promise<void>;
  commitQuestionImages: (questionId: string) => void;
  isCameraUploading: (questionId: string) => boolean;
  hasFailedUploads: (questionId: string) => boolean;
  retryCameraImage: (questionId: string, index: number) => Promise<void>;
}

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
    capturedFileStore.clear();

    if (hasRestoredRef.current) return;
    if (visitId == null || visitId === '') return;
    hasRestoredRef.current = true;
    (async () => {
      // A protocol change may still be deleting the previous protocol's
      // images; read the visit's assets back only once that has finished.
      const clearing = getImageCleanupInProgress();
      if (clearing) await clearing;
      const res = await getChildResources<{
        questionId: string;
        comment?: string;
      }>(RESOURCE_TYPE_VISIT, String(visitId), RESOURCE_TYPE_ASSET);
      if (!res.data?.length) return;
      const deletedIds = getDeletedAssetIds();
      const restored: Record<string, CapturedImage[]> = {};
      for (const record of res.data) {
        const qId = record.data?.questionId;
        if (!qId || !record.file_path) continue;
        if (deletedIds.has(record.id)) continue;
        if (!restored[qId]) restored[qId] = [];
        restored[qId].push({
          file: null,
          preview: record.file_path,
          assetRecordId: record.id,
          status: 'done',
        });
      }
      if (Object.keys(restored).length > 0) {
        setCameraImages(restored);
      }
    })().catch(err => {
      console.error('Failed to restore camera images from temp storage', err);
    });

    return () => {
      capturedFileStore.clear();
    };
  }, [visitId]);

  const cameraImagesFor = (questionId: string): string[] =>
    (cameraImages[questionId] ?? []).map(img => img.preview);

  const cameraImageStatesFor = (questionId: string): CapturedImage[] =>
    cameraImages[questionId] ?? [];

  const inFlightRef = useRef(new Map<string, Set<Promise<unknown>>>());

  const assetIdByFileRef = useRef(new Map<File, number>());

  const trackInFlight = (questionId: string, p: Promise<unknown>) => {
    const set = inFlightRef.current.get(questionId) ?? new Set();
    set.add(p);
    inFlightRef.current.set(questionId, set);
    void p.finally(() => {
      set.delete(p);
    });
  };

  const settleInFlight = async (questionId: string) => {
    const set = inFlightRef.current.get(questionId);
    if (!set?.size) return;
    await Promise.allSettled(set);
  };

  const assetIdOf = (img: CapturedImage): number | undefined =>
    img.assetRecordId ??
    /* Restored images (file: null) always carry assetRecordId, so ?? never
       falls through to the file lookup for them. */
    /* v8 ignore next */
    (img.file ? assetIdByFileRef.current.get(img.file) : undefined);

  const setImageStatus = (
    questionId: string,
    file: File,
    status: CapturedImageStatus,
    assetRecordId?: number
  ) => {
    setCameraImages(prev => ({
      ...prev,
      /* v8 ignore next */
      [questionId]: (prev[questionId] ?? []).map(img =>
        img.file === file
          ? {
              ...img,
              status,
              ...(assetRecordId != null ? { assetRecordId } : {}),
            }
          : img
      ),
    }));
  };

  const dropImage = (questionId: string, file: File) => {
    setCameraImages(prev => ({
      ...prev,
      /* v8 ignore next */
      [questionId]: (prev[questionId] ?? []).filter(img => img.file !== file),
    }));
  };

  const uploadImage = async (
    questionId: string,
    file: File,
    comment: string
  ) => {
    const generation = getPhysicalExamImageGeneration();
    setImageStatus(questionId, file, 'uploading');

    const resourceId = `${visitId}_${questionId}_${Date.now()}`;
    let createdBy = DEFAULT_CREATED_BY;
    try {
      const u = storage.getUser();
      if (u) createdBy = JSON.parse(u).uuid ?? u;
    } catch {
      /* fallback */
    }

    try {
      const res = await upsertAssetResource<{
        questionId: string;
        comment: string;
      }>(file, {
        resource_id: resourceId,
        parent_type: RESOURCE_TYPE_VISIT,
        parent_id: String(visitId),
        created_by: createdBy,
        data: { questionId, comment },
      });
      if (generation !== getPhysicalExamImageGeneration()) {
        // The protocol was removed while this image was uploading, so the
        // asset that was just stored belongs to it and must not survive.
        deleteAssetResource(res.data.id).catch(() => {});
        dropImage(questionId, file);
        return;
      }
      assetIdByFileRef.current.set(file, res.data.id);
      setPendingImageAssetId(file, res.data.id);
      setImageStatus(questionId, file, 'done', res.data.id);
    } catch (err) {
      console.error(
        'Failed to upload camera image to temp storage',
        err instanceof Error ? err.message : 'unknown error'
      );
      setImageStatus(questionId, file, 'failed');
    }
  };

  const addCameraImage = async (questionId: string, file: File) => {
    const comment = sectionCommentFor(questionId);
    const preview = URL.createObjectURL(file);

    const bucket = capturedFileStore.get(questionId) ?? [];
    bucket.push({ file, comment });
    capturedFileStore.set(questionId, bucket);

    const hasVisit = visitId != null && visitId !== '';

    setCameraImages(prev => ({
      ...prev,
      [questionId]: [
        ...(prev[questionId] ?? []),
        { file, preview, status: hasVisit ? 'uploading' : 'done' },
      ],
    }));

    if (!hasVisit) return;

    const p = uploadImage(questionId, file, comment);
    trackInFlight(questionId, p);
    await p;
  };

  const retryCameraImage = async (questionId: string, index: number) => {
    const target = cameraImagesRef.current[questionId]?.[index];

    if (!target?.file || target.status !== 'failed') return;

    const p = uploadImage(
      questionId,
      target.file,
      sectionCommentFor(questionId)
    );
    trackInFlight(questionId, p);
    await p;
  };

  const isCameraUploading = (questionId: string): boolean =>
    (cameraImages[questionId] ?? []).some(img => img.status === 'uploading');

  const hasFailedUploads = (questionId: string): boolean =>
    (cameraImages[questionId] ?? []).some(img => img.status === 'failed');

  /**
   * Remove a single camera image by index.
   * Only that image leaves the pending queue, the staging store, temp storage
   * and UI state, so every other image (of this or any other question) stays.
   * The image is resolved before the first await and matched by its preview URL
   * afterwards, so a re-render while waiting cannot shift the index onto a
   * different image.
   */
  const removeCameraImage = async (questionId: string, index: number) => {
    const target = cameraImagesRef.current[questionId]?.[index];
    if (!target) return;
    await settleInFlight(questionId);
    const targetAssetId = assetIdOf(target);
    if (targetAssetId != null) {
      deleteAssetResource(targetAssetId).catch(() => {});
      removePendingImageByAssetId(targetAssetId);
    }
    if (target.file) {
      assetIdByFileRef.current.delete(target.file);
      removePendingImageByFile(target.file);
      const staged = capturedFileStore.get(questionId);
      if (staged) {
        capturedFileStore.set(
          questionId,
          staged.filter(entry => entry.file !== target.file)
        );
      }
    }
    /* target.preview is a required string (CapturedImage), so this can never
       be nullish; kept as a defensive optional chain per PR review (TS-002). */
    /* v8 ignore next */
    if (target.preview?.startsWith(BLOB_URL_PREFIX)) {
      URL.revokeObjectURL(target.preview);
    }
    setCameraImages(prev => {
      /* v8 ignore next */
      const updated = (prev[questionId] ?? []).filter(
        img => img.preview !== target.preview
      );
      if (updated.length === 0) {
        unmarkQuestionCommitted(questionId);
      }
      return { ...prev, [questionId]: updated };
    });
  };

  const clearCameraImages = async (questionId: string) => {
    await settleInFlight(questionId);
    const imgs = cameraImagesRef.current[questionId] ?? [];
    for (const img of imgs) {
      const assetId = assetIdOf(img);
      if (assetId) {
        deleteAssetResource(assetId).catch(() => {});
      }
      if (img.file) assetIdByFileRef.current.delete(img.file);
      if (img.preview?.startsWith(BLOB_URL_PREFIX)) {
        URL.revokeObjectURL(img.preview);
      }
    }
    capturedFileStore.delete(questionId);
    removePendingImagesByQuestionId(questionId);
    unmarkQuestionCommitted(questionId);
    setCameraImages(prev => ({ ...prev, [questionId]: [] }));
  };

  const commitQuestionImages = (questionId: string) => {
    const entries = capturedFileStore.get(questionId) ?? [];
    if (entries.length === 0) return;

    // Build a set of File references already queued for this question so that
    // images committed in earlier back-navigation cycles are not lost.
    // The old pattern (removePendingImagesByQuestionId + re-add all) wiped
    // every prior batch because capturedFileStore only contains files added in
    // the current mount — restored images from temp storage have file:null and
    // are never placed back into capturedFileStore.
    const alreadyQueued = new Set(
      getPendingImages()
        .filter(img => img.questionId === questionId)
        .map(img => img.file)
    );

    for (const entry of entries) {
      if (!alreadyQueued.has(entry.file)) {
        addPendingImage(entry.file, entry.comment, questionId);
        const assetId = assetIdByFileRef.current.get(entry.file);
        if (assetId != null) setPendingImageAssetId(entry.file, assetId);
      }
    }

    markQuestionCommitted(questionId);
  };

  return {
    cameraImagesFor,
    cameraImageStatesFor,
    addCameraImage,
    removeCameraImage,
    clearCameraImages,
    commitQuestionImages,
    isCameraUploading,
    hasFailedUploads,
    retryCameraImage,
  };
};
