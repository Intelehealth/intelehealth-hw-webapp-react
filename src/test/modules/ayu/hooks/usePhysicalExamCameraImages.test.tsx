import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockInstance } from 'vitest';

import { usePhysicalExamCameraImages } from '../../../../modules/ayu/hooks/usePhysicalExamCameraImages';

const addPendingImage = vi.fn();
const removePendingImagesByQuestionId = vi.fn();
const removePendingImageByFile = vi.fn();
const removePendingImageByAssetId = vi.fn();
const setPendingImageAssetId = vi.fn();
const getPendingImages = vi.fn().mockReturnValue([]);
const getChildResources = vi.fn();
const upsertAssetResource = vi.fn();
const deleteAssetResource = vi.fn().mockResolvedValue(undefined);
const markQuestionCommitted = vi.fn();
const unmarkQuestionCommitted = vi.fn();
const getDeletedAssetIds = vi.fn().mockReturnValue(new Set<number>());
const getUser = vi.fn();

vi.mock('../../../../modules/ayu/services/obs.service', () => ({
  addPendingImage: (...args: unknown[]) => addPendingImage(...args),
  removePendingImagesByQuestionId: (...args: unknown[]) =>
    removePendingImagesByQuestionId(...args),
  removePendingImageByFile: (...args: unknown[]) =>
    removePendingImageByFile(...args),
  removePendingImageByAssetId: (...args: unknown[]) =>
    removePendingImageByAssetId(...args),
  setPendingImageAssetId: (...args: unknown[]) =>
    setPendingImageAssetId(...args),
  getPendingImages: (...args: unknown[]) => getPendingImages(...args),
}));

vi.mock('../../../../modules/ayu/services/temp-storage.service', () => ({
  getChildResources: (...args: unknown[]) => getChildResources(...args),
  upsertAssetResource: (...args: unknown[]) => upsertAssetResource(...args),
  deleteAssetResource: (...args: unknown[]) => deleteAssetResource(...args),
  markQuestionCommitted: (...args: unknown[]) =>
    markQuestionCommitted(...args),
  unmarkQuestionCommitted: (...args: unknown[]) =>
    unmarkQuestionCommitted(...args),
  getDeletedAssetIds: (...args: unknown[]) => getDeletedAssetIds(...args),
}));

const getImageCleanupInProgress = vi.fn().mockReturnValue(null);
const getPhysicalExamImageGeneration = vi.fn().mockReturnValue(0);

vi.mock('../../../../modules/ayu/services/physical-exam-images.service', () => ({
  getImageCleanupInProgress: (...args: unknown[]) =>
    getImageCleanupInProgress(...args),
  getPhysicalExamImageGeneration: (...args: unknown[]) =>
    getPhysicalExamImageGeneration(...args),
}));

vi.mock('../../../../utils/storage', () => ({
  storage: { getUser: () => getUser() },
}));

const sectionCommentFor = vi.fn((qId: string) => `Section for ${qId}`);

let blobCounter = 0;

beforeEach(() => {
  addPendingImage.mockReset();
  removePendingImagesByQuestionId.mockReset();
  removePendingImageByFile.mockReset();
  removePendingImageByAssetId.mockReset();
  setPendingImageAssetId.mockReset();
  getPendingImages.mockReset().mockReturnValue([]);
  getChildResources.mockReset();
  upsertAssetResource.mockReset();
  deleteAssetResource.mockReset().mockResolvedValue(undefined);
  markQuestionCommitted.mockReset();
  unmarkQuestionCommitted.mockReset();
  getDeletedAssetIds.mockReset().mockReturnValue(new Set<number>());
  getImageCleanupInProgress.mockReset().mockReturnValue(null);
  getPhysicalExamImageGeneration.mockReset().mockReturnValue(0);
  getUser.mockReset();
  sectionCommentFor.mockClear();
  blobCounter = 0;
  globalThis.URL.createObjectURL = vi.fn(() => `blob:mock-${++blobCounter}`);
  globalThis.URL.revokeObjectURL = vi.fn();
});

describe('usePhysicalExamCameraImages', () => {
  describe('restore on mount', () => {
    it('does nothing when visitId is null', () => {
      renderHook(() =>
        usePhysicalExamCameraImages({ visitId: null, sectionCommentFor })
      );
      expect(getChildResources).not.toHaveBeenCalled();
    });

    it('does nothing when visitId is an empty string', () => {
      renderHook(() =>
        usePhysicalExamCameraImages({ visitId: '', sectionCommentFor })
      );
      expect(getChildResources).not.toHaveBeenCalled();
    });

    it('rebuilds cameraImages from temp-storage asset records', async () => {
      getChildResources.mockResolvedValue({
        data: [
          {
            id: 11,
            file_path: 'http://cdn/a.png',
            data: { questionId: 'q1' },
          },
          {
            id: 12,
            file_path: 'http://cdn/b.png',
            data: { questionId: 'q1' },
          },
          // record missing file_path → skipped
          { id: 13, file_path: null, data: { questionId: 'q1' } },
          // record missing questionId → skipped
          { id: 14, file_path: 'http://cdn/c.png', data: {} },
        ],
      });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await waitFor(() =>
        expect(result.current.cameraImagesFor('q1')).toEqual([
          'http://cdn/a.png',
          'http://cdn/b.png',
        ])
      );
    });

    it('does nothing when temp-storage returns an empty list', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await waitFor(() => expect(getChildResources).toHaveBeenCalled());
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
    });

    it('does nothing when every record is filtered out by missing fields', async () => {
      getChildResources.mockResolvedValue({
        data: [{ id: 1, file_path: null, data: {} }],
      });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await waitFor(() => expect(getChildResources).toHaveBeenCalled());
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
    });

    it('filters out assets that are in the deleted-asset set', async () => {
      getDeletedAssetIds.mockReturnValue(new Set([11]));
      getChildResources.mockResolvedValue({
        data: [
          { id: 11, file_path: 'http://cdn/a.png', data: { questionId: 'q1' } },
          { id: 12, file_path: 'http://cdn/b.png', data: { questionId: 'q1' } },
        ],
      });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await waitFor(() =>
        expect(result.current.cameraImagesFor('q1')).toEqual([
          'http://cdn/b.png',
        ])
      );
    });

    it('waits for a running protocol-image cleanup before reading the stored images', async () => {
      let finishCleanup: () => void = () => {};
      getImageCleanupInProgress.mockReturnValue(
        new Promise<void>(resolve => {
          finishCleanup = resolve;
        })
      );
      getChildResources.mockResolvedValue({
        data: [
          { id: 11, file_path: 'http://cdn/a.png', data: { questionId: 'q1' } },
        ],
      });

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );

      // The previous protocol's images are still being deleted.
      await act(async () => {
        await Promise.resolve();
      });
      expect(getChildResources).not.toHaveBeenCalled();
      expect(result.current.cameraImagesFor('q1')).toEqual([]);

      await act(async () => {
        finishCleanup();
      });
      await waitFor(() =>
        expect(result.current.cameraImagesFor('q1')).toEqual([
          'http://cdn/a.png',
        ])
      );
      expect(getChildResources).toHaveBeenCalledTimes(1);
    });

    it('logs error and re-throws when temp-storage fails', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getChildResources.mockRejectedValue(new Error('boom'));
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await waitFor(() => expect(getChildResources).toHaveBeenCalled());
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
      await waitFor(() =>
        expect(errorSpy).toHaveBeenCalledWith(
          'Failed to restore camera images from temp storage',
          expect.any(Error)
        )
      );
      errorSpy.mockRestore();
    });
  });

  describe('addCameraImage', () => {
    it('stores locally and does not upload when visitId is missing', async () => {
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: null, sectionCommentFor })
      );
      const file = new File(['a'], 'a.png');
      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });
      // addCameraImage no longer calls addPendingImage — that happens on commitQuestionImages
      expect(addPendingImage).not.toHaveBeenCalled();
      expect(upsertAssetResource).not.toHaveBeenCalled();
      // Preview is from URL.createObjectURL
      expect(result.current.cameraImagesFor('q1')).toEqual([
        'blob:mock-1',
      ]);
    });

    it('uploads via upsertAssetResource and stores assetRecordId when visitId is present', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(JSON.stringify({ uuid: 'user-uuid' }));
      upsertAssetResource.mockResolvedValue({ data: { id: 99 } });

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      const file = new File(['a'], 'a.png');
      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });

      expect(upsertAssetResource).toHaveBeenCalledTimes(1);
      // The queued copy of the file is linked to the asset that was created for it.
      expect(setPendingImageAssetId).toHaveBeenCalledWith(file, 99);
      const meta = upsertAssetResource.mock.calls[0][1];
      expect(meta).toMatchObject({
        parent_type: 'visit',
        parent_id: 'visit-1',
        created_by: 'user-uuid',
        data: { questionId: 'q1', comment: 'Section for q1' },
      });
      // Preview is from URL.createObjectURL
      expect(result.current.cameraImagesFor('q1')).toEqual([
        'blob:mock-1',
      ]);
    });

    it('discards the stored asset and the image when the protocol was removed mid-upload', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      let resolveUpload: (v: unknown) => void = () => {};
      upsertAssetResource.mockReturnValue(
        new Promise(resolve => {
          resolveUpload = resolve;
        })
      );

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      let uploading: Promise<void>;
      act(() => {
        uploading = result.current.addCameraImage(
          'q1',
          new File(['a'], 'a.png')
        );
      });
      await waitFor(() =>
        expect(result.current.isCameraUploading('q1')).toBe(true)
      );

      // The protocol is removed while the image is still on its way up.
      getPhysicalExamImageGeneration.mockReturnValue(1);
      await act(async () => {
        resolveUpload({ data: { id: 55 } });
        await uploading;
      });

      // The asset that was just stored belongs to the removed protocol.
      expect(deleteAssetResource).toHaveBeenCalledWith(55);
      expect(setPendingImageAssetId).not.toHaveBeenCalled();
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
      expect(result.current.isCameraUploading('q1')).toBe(false);
    });

    it('tolerates the backend refusing to delete the asset of a stale upload', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      let resolveUpload: (v: unknown) => void = () => {};
      upsertAssetResource.mockReturnValue(
        new Promise(resolve => {
          resolveUpload = resolve;
        })
      );
      // See the note in "removeCameraImage side effects": check the handler.
      let rejectionHandler: MockInstance | undefined;
      deleteAssetResource.mockImplementation(() => {
        const failingDelete = Promise.reject(new Error('offline'));
        rejectionHandler = vi.spyOn(failingDelete, 'catch');
        return failingDelete;
      });

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      let uploading: Promise<void>;
      act(() => {
        uploading = result.current.addCameraImage(
          'q1',
          new File(['a'], 'a.png')
        );
      });
      await waitFor(() =>
        expect(result.current.isCameraUploading('q1')).toBe(true)
      );

      getPhysicalExamImageGeneration.mockReturnValue(1);
      await act(async () => {
        resolveUpload({ data: { id: 55 } });
        await uploading;
      });

      expect(deleteAssetResource).toHaveBeenCalledWith(55);
      expect(rejectionHandler).toHaveBeenCalledTimes(1);
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
    });

    it('keeps the other images of the question when a stale upload is discarded', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      let resolveStale: (v: unknown) => void = () => {};
      upsertAssetResource
        .mockResolvedValueOnce({ data: { id: 1 } })
        .mockReturnValueOnce(
          new Promise(resolve => {
            resolveStale = resolve;
          })
        );

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await act(async () => {
        await result.current.addCameraImage('q1', new File(['a'], 'a.png'));
      });
      let stale: Promise<void>;
      act(() => {
        stale = result.current.addCameraImage('q1', new File(['b'], 'b.png'));
      });
      await waitFor(() =>
        expect(result.current.isCameraUploading('q1')).toBe(true)
      );

      getPhysicalExamImageGeneration.mockReturnValue(1);
      await act(async () => {
        resolveStale({ data: { id: 2 } });
        await stale;
      });

      // Only the image that was mid-upload is dropped.
      expect(result.current.cameraImagesFor('q1')).toEqual(['blob:mock-1']);
      expect(deleteAssetResource).toHaveBeenCalledWith(2);
      expect(deleteAssetResource).not.toHaveBeenCalledWith(1);
    });

    it('uses "unknown" when getUser returns invalid JSON', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue('not-json');
      upsertAssetResource.mockResolvedValue({ data: { id: 1 } });

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await act(async () => {
        await result.current.addCameraImage('q1', new File(['a'], 'a.png'));
      });
      expect(upsertAssetResource.mock.calls[0][1].created_by).toBe('unknown');
    });

    it('falls back to the raw string when getUser returns JSON without a uuid', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      const raw = JSON.stringify({ name: 'Akki' });
      getUser.mockReturnValue(raw);
      upsertAssetResource.mockResolvedValue({ data: { id: 1 } });

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await act(async () => {
        await result.current.addCameraImage('q1', new File(['a'], 'a.png'));
      });
      expect(upsertAssetResource.mock.calls[0][1].created_by).toBe(raw);
    });

    it('uses "unknown" when getUser returns null', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockResolvedValue({ data: { id: 1 } });

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await act(async () => {
        await result.current.addCameraImage('q1', new File(['a'], 'a.png'));
      });
      expect(upsertAssetResource.mock.calls[0][1].created_by).toBe('unknown');
    });

    it('logs error when the upload fails', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockRejectedValue(new Error('upload failed'));

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await act(async () => {
        await result.current.addCameraImage('q1', new File(['a'], 'a.png'));
      });
      expect(result.current.cameraImagesFor('q1')).toEqual([
        'blob:mock-1',
      ]);
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to upload camera image to temp storage',
        'upload failed'
      );
      errorSpy.mockRestore();
    });
  });

  describe('removeCameraImage', () => {
    it('removes only the image at the given index and only that file from the pending queue', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource
        .mockResolvedValueOnce({ data: { id: 1 } })
        .mockResolvedValueOnce({ data: { id: 2 } });

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );

      const fileA = new File(['a'], 'a.png');
      const fileB = new File(['b'], 'b.png');
      await act(async () => {
        await result.current.addCameraImage('q1', fileA);
        await result.current.addCameraImage('q1', fileB);
      });

      await act(async () => {
        await result.current.removeCameraImage('q1', 1);
      });

      expect(removePendingImageByFile).toHaveBeenCalledTimes(1);
      expect(removePendingImageByFile).toHaveBeenCalledWith(fileB);
      expect(removePendingImageByAssetId).toHaveBeenCalledWith(2);
      // A single delete must never wipe the whole question's queue.
      expect(removePendingImagesByQuestionId).not.toHaveBeenCalled();
      expect(result.current.cameraImagesFor('q1')).toEqual(['blob:mock-1']);
    });

    it('keeps the removed image out of the next commit while its siblings stay committable', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockResolvedValue({ data: { id: 1 } });

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      const fileA = new File(['a'], 'a.png');
      const fileB = new File(['b'], 'b.png');
      await act(async () => {
        await result.current.addCameraImage('q1', fileA);
        await result.current.addCameraImage('q1', fileB);
      });

      await act(async () => {
        await result.current.removeCameraImage('q1', 0);
      });

      addPendingImage.mockClear();
      act(() => result.current.commitQuestionImages('q1'));
      const enqueued = addPendingImage.mock.calls.map(
        (call: unknown[]) => call[0]
      );
      expect(enqueued).toEqual([fileB]);
      expect(enqueued.includes(fileA)).toBe(false);
    });

    it('deletes the asset record when the removed image has an assetRecordId', async () => {
      getChildResources.mockResolvedValue({
        data: [
          { id: 42, file_path: 'http://cdn/a.png', data: { questionId: 'q1' } },
        ],
      });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await waitFor(() =>
        expect(result.current.cameraImagesFor('q1').length).toBe(1)
      );
      await act(async () => {
        await result.current.removeCameraImage('q1', 0);
      });
      expect(deleteAssetResource).toHaveBeenCalledWith(42);
      // A restored image has no File: its queued twin is found by asset id.
      expect(removePendingImageByAssetId).toHaveBeenCalledWith(42);
      expect(removePendingImageByFile).not.toHaveBeenCalled();
      expect(removePendingImagesByQuestionId).not.toHaveBeenCalled();
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
    });

    it('leaves the queue alone for a local-only image that never got an asset', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: null, sectionCommentFor })
      );
      const file = new File(['a'], 'a.png');
      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });

      await act(async () => {
        await result.current.removeCameraImage('q1', 0);
      });

      expect(deleteAssetResource).not.toHaveBeenCalled();
      expect(removePendingImageByAssetId).not.toHaveBeenCalled();
      expect(removePendingImageByFile).toHaveBeenCalledWith(file);
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
    });

    it('does nothing when the question has no image at that index', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await act(async () => {
        await result.current.removeCameraImage('nonexistent', 0);
      });
      expect(removePendingImageByFile).not.toHaveBeenCalled();
      expect(removePendingImageByAssetId).not.toHaveBeenCalled();
      expect(removePendingImagesByQuestionId).not.toHaveBeenCalled();
      expect(unmarkQuestionCommitted).not.toHaveBeenCalled();
      expect(result.current.cameraImagesFor('nonexistent')).toEqual([]);
    });

    it('does not un-commit the question while other images remain', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockResolvedValue({ data: { id: 1 } });

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await act(async () => {
        await result.current.addCameraImage('q1', new File(['a'], 'a.png'));
        await result.current.addCameraImage('q1', new File(['b'], 'b.png'));
      });

      await act(async () => {
        await result.current.removeCameraImage('q1', 0);
      });
      expect(unmarkQuestionCommitted).not.toHaveBeenCalled();
    });

    it('still removes an image whose staging entry was already cleared', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockResolvedValue({ data: { id: 1 } });

      const { result, rerender } = renderHook(
        ({ visitId }) =>
          usePhysicalExamCameraImages({ visitId, sectionCommentFor }),
        { initialProps: { visitId: 'visit-1' as string | null } }
      );
      const file = new File(['a'], 'a.png');
      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });
      // A visitId change re-runs the mount effect, which clears the staging store.
      rerender({ visitId: 'visit-2' });

      await act(async () => {
        await result.current.removeCameraImage('q1', 0);
      });
      expect(removePendingImageByFile).toHaveBeenCalledWith(file);
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
    });

    it('unmarks the question as committed when all images are removed', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockResolvedValue({ data: { id: 1 } });

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );

      await act(async () => {
        await result.current.addCameraImage('q1', new File(['a'], 'a.png'));
      });

      await act(async () => {
        await result.current.removeCameraImage('q1', 0);
      });
      expect(unmarkQuestionCommitted).toHaveBeenCalledWith('q1');
    });
  });

  describe('removeCameraImage side effects', () => {
    it("revokes the removed image's blob URL and no other", async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockResolvedValue({ data: { id: 1 } });

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await act(async () => {
        await result.current.addCameraImage('q1', new File(['a'], 'a.png'));
        await result.current.addCameraImage('q1', new File(['b'], 'b.png'));
        await result.current.addCameraImage('q1', new File(['c'], 'c.png'));
      });

      await act(async () => {
        await result.current.removeCameraImage('q1', 1);
      });

      expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledTimes(1);
      expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-2');
      expect(result.current.cameraImagesFor('q1')).toEqual([
        'blob:mock-1',
        'blob:mock-3',
      ]);
    });

    it('does not revoke the URL of a restored (remote) image', async () => {
      getChildResources.mockResolvedValue({
        data: [
          { id: 8, file_path: 'http://cdn/a.png', data: { questionId: 'q1' } },
        ],
      });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await waitFor(() =>
        expect(result.current.cameraImagesFor('q1')).toHaveLength(1)
      );

      await act(async () => {
        await result.current.removeCameraImage('q1', 0);
      });

      expect(globalThis.URL.revokeObjectURL).not.toHaveBeenCalled();
    });

    it('still removes the image when deleting its stored asset fails', async () => {
      getChildResources.mockResolvedValue({
        data: [
          { id: 42, file_path: 'http://cdn/a.png', data: { questionId: 'q1' } },
        ],
      });
      // vi.fn hooks every promise it returns, so a rejection from a mock is
      // never "unhandled". Check instead that the hook attaches its own
      // rejection handler (otherwise the browser logs an uncaught rejection).
      // The rejected promise is created at call time so it is never left
      // unhandled between creation and the hook's own .catch.
      let rejectionHandler: MockInstance | undefined;
      deleteAssetResource.mockImplementation(() => {
        const failingDelete = Promise.reject(new Error('offline'));
        rejectionHandler = vi.spyOn(failingDelete, 'catch');
        return failingDelete;
      });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await waitFor(() =>
        expect(result.current.cameraImagesFor('q1')).toHaveLength(1)
      );

      await act(async () => {
        await result.current.removeCameraImage('q1', 0);
      });

      expect(deleteAssetResource).toHaveBeenCalledWith(42);
      expect(rejectionHandler).toHaveBeenCalledTimes(1);
      expect(removePendingImageByAssetId).toHaveBeenCalledWith(42);
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
    });

    it('removes an image whose upload failed without touching the backend', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockRejectedValue(new Error('nope'));
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      const file = new File(['a'], 'a.png');
      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });
      errorSpy.mockRestore();
      expect(result.current.hasFailedUploads('q1')).toBe(true);

      await act(async () => {
        await result.current.removeCameraImage('q1', 0);
      });

      expect(deleteAssetResource).not.toHaveBeenCalled();
      expect(removePendingImageByAssetId).not.toHaveBeenCalled();
      expect(removePendingImageByFile).toHaveBeenCalledWith(file);
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
      expect(result.current.hasFailedUploads('q1')).toBe(false);
    });

    it('resolves the clicked image before waiting, so a shifted list cannot redirect it', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockResolvedValue({ data: { id: 1 } });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      const fileA = new File(['a'], 'a.png');
      const fileB = new File(['b'], 'b.png');
      const fileC = new File(['c'], 'c.png');
      await act(async () => {
        await result.current.addCameraImage('q1', fileA);
        await result.current.addCameraImage('q1', fileB);
        await result.current.addCameraImage('q1', fileC);
      });

      // Two clicks on the list as rendered: index 0, then index 2.
      await act(async () => {
        await Promise.all([
          result.current.removeCameraImage('q1', 0),
          result.current.removeCameraImage('q1', 2),
        ]);
      });

      expect(removePendingImageByFile.mock.calls.map(call => call[0])).toEqual([
        fileA,
        fileC,
      ]);
      expect(result.current.cameraImagesFor('q1')).toEqual(['blob:mock-2']);
    });
  });

  describe('restore-once guard', () => {
    it('does not re-fetch from temp-storage when visitId changes after the first restore', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      const { rerender } = renderHook(
        ({ visitId }) =>
          usePhysicalExamCameraImages({ visitId, sectionCommentFor }),
        { initialProps: { visitId: 'visit-1' as string | null } }
      );
      await waitFor(() => expect(getChildResources).toHaveBeenCalledTimes(1));

      rerender({ visitId: 'visit-2' });
      expect(getChildResources).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearCameraImages', () => {
    it('clears the question images and removes from pending queue by questionId', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockResolvedValue({ data: { id: 1 } });

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await act(async () => {
        await result.current.addCameraImage('q1', new File(['a'], 'a.png'));
        await result.current.addCameraImage('q2', new File(['b'], 'b.png'));
      });

      await act(async () => {
        await result.current.clearCameraImages('q1');
      });

      expect(removePendingImagesByQuestionId).toHaveBeenCalledWith('q1');
      expect(unmarkQuestionCommitted).toHaveBeenCalledWith('q1');
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
      // q2 is untouched
      expect(result.current.cameraImagesFor('q2')).toHaveLength(1);
    });

    it('handles clearing a question with no images gracefully', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await act(async () => {
        await result.current.clearCameraImages('nonexistent');
      });
      expect(removePendingImagesByQuestionId).toHaveBeenCalledWith('nonexistent');
      expect(unmarkQuestionCommitted).toHaveBeenCalledWith('nonexistent');
      expect(deleteAssetResource).not.toHaveBeenCalled();
    });

    it('deletes asset records for restored images when clearing', async () => {
      getChildResources.mockResolvedValue({
        data: [
          { id: 5, file_path: 'http://cdn/a.png', data: { questionId: 'q1' } },
        ],
      });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await waitFor(() =>
        expect(result.current.cameraImagesFor('q1').length).toBe(1)
      );

      await act(async () => {
        await result.current.clearCameraImages('q1');
      });
      expect(deleteAssetResource).toHaveBeenCalledWith(5);
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
    });
  });

  describe('commitQuestionImages', () => {
    it('moves captured files from internal store to the pending queue', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockResolvedValue({ data: { id: 1 } });

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      const file = new File(['a'], 'a.png');
      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });

      act(() => result.current.commitQuestionImages('q1'));

      // Does NOT clear the pending queue — uses dedup instead
      expect(removePendingImagesByQuestionId).not.toHaveBeenCalled();
      // Adds the file to the pending queue
      expect(addPendingImage).toHaveBeenCalledWith(
        file,
        'Section for q1',
        'q1'
      );
      expect(markQuestionCommitted).toHaveBeenCalledWith('q1');
    });

    it('links a file to its asset when the upload finished before the commit', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockResolvedValue({ data: { id: 7 } });

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      const file = new File(['a'], 'a.png');
      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });
      setPendingImageAssetId.mockClear();

      act(() => result.current.commitQuestionImages('q1'));

      expect(addPendingImage).toHaveBeenCalledWith(file, 'Section for q1', 'q1');
      expect(setPendingImageAssetId).toHaveBeenCalledWith(file, 7);
    });

    it('does not link an asset when the file has none yet (upload still in flight)', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockReturnValue(new Promise(() => {}));

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      const file = new File(['a'], 'a.png');
      act(() => {
        void result.current.addCameraImage('q1', file);
      });

      act(() => result.current.commitQuestionImages('q1'));

      expect(addPendingImage).toHaveBeenCalledWith(file, 'Section for q1', 'q1');
      expect(setPendingImageAssetId).not.toHaveBeenCalled();
    });

    it('does not re-add a file that is already present in the pending queue', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockResolvedValue({ data: { id: 1 } });

      const file = new File(['a'], 'a.png');
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });

      // First commit — queue is empty so the file is added once
      act(() => result.current.commitQuestionImages('q1'));
      expect(addPendingImage).toHaveBeenCalledTimes(1);

      // Simulate the queue now containing that file (as it would in production)
      getPendingImages.mockReturnValue([
        { file, comment: 'Section for q1', questionId: 'q1' },
      ]);

      // Second commit — file is already queued, must not be added again
      act(() => result.current.commitQuestionImages('q1'));
      expect(addPendingImage).toHaveBeenCalledTimes(1); // unchanged
    });

    it('does nothing when no files are captured for the question', () => {
      getChildResources.mockResolvedValue({ data: [] });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );

      act(() => result.current.commitQuestionImages('q1'));

      // Early return — no side-effects at all
      expect(removePendingImagesByQuestionId).not.toHaveBeenCalled();
      expect(addPendingImage).not.toHaveBeenCalled();
      expect(markQuestionCommitted).not.toHaveBeenCalled();
    });

    it('preserves images from earlier upload cycles when the user navigates back and uploads again', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockResolvedValue({ data: { id: 1 } });

      const file1 = new File(['a'], 'a.png');
      const file2 = new File(['b'], 'b.png');
      const file3 = new File(['c'], 'c.png');
      const file4 = new File(['d'], 'd.png');
      const file5 = new File(['e'], 'e.png');

      // ── First Physical Exam visit ──────────────────────────────────────────
      const { result: r1, unmount } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );

      await act(async () => {
        await r1.current.addCameraImage('q1', file1);
        await r1.current.addCameraImage('q1', file2);
        await r1.current.addCameraImage('q1', file3);
      });

      act(() => r1.current.commitQuestionImages('q1'));
      expect(addPendingImage).toHaveBeenCalledTimes(3);

      // After first confirm the module-level queue holds file1–3.
      // Simulate that state so the dedup check sees them on the next commit.
      getPendingImages.mockReturnValue([
        { file: file1, comment: 'Section for q1', questionId: 'q1' },
        { file: file2, comment: 'Section for q1', questionId: 'q1' },
        { file: file3, comment: 'Section for q1', questionId: 'q1' },
      ]);

      // ── Back navigation: component unmounts, capturedFileStore is cleared ──
      unmount();

      // ── Second Physical Exam visit ─────────────────────────────────────────
      const { result: r2 } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );

      await act(async () => {
        await r2.current.addCameraImage('q1', file4);
        await r2.current.addCameraImage('q1', file5);
      });

      addPendingImage.mockClear();
      act(() => r2.current.commitQuestionImages('q1'));

      // Only the NEW files should be enqueued; file1–3 are already in the queue.
      // Use reference identity (mock.calls[n][0] === fileX) rather than deep
      // equality because Vitest cannot distinguish between two File instances
      // when comparing them structurally.
      expect(addPendingImage).toHaveBeenCalledTimes(2);
      const enqueuedFiles = addPendingImage.mock.calls.map(
        (call: unknown[]) => call[0]
      );
      expect(enqueuedFiles.includes(file4)).toBe(true);
      expect(enqueuedFiles.includes(file5)).toBe(true);
      expect(enqueuedFiles.includes(file1)).toBe(false);
      expect(enqueuedFiles.includes(file2)).toBe(false);
      expect(enqueuedFiles.includes(file3)).toBe(false);
      // Previously committed question remains marked
      expect(markQuestionCommitted).toHaveBeenCalledWith('q1');
    });
  });

  describe('upload status tracking', () => {
    it('reports isCameraUploading while the write is in flight and clears it after', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      let resolveUpload: (v: unknown) => void = () => {};
      upsertAssetResource.mockReturnValue(
        new Promise(res => {
          resolveUpload = res;
        })
      );

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );

      let pending: Promise<void>;
      act(() => {
        pending = result.current.addCameraImage('q1', new File(['a'], 'a.png'));
      });

      await waitFor(() =>
        expect(result.current.isCameraUploading('q1')).toBe(true)
      );
      expect(result.current.hasFailedUploads('q1')).toBe(false);

      await act(async () => {
        resolveUpload({ data: { id: 7 } });
        await pending;
      });

      expect(result.current.isCameraUploading('q1')).toBe(false);
      expect(result.current.hasFailedUploads('q1')).toBe(false);
      expect(result.current.cameraImageStatesFor('q1')[0]).toMatchObject({
        status: 'done',
        assetRecordId: 7,
      });
    });

    it('reports hasFailedUploads when the write rejects', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockRejectedValue(new Error('nope'));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await act(async () => {
        await result.current.addCameraImage('q1', new File(['a'], 'a.png'));
      });

      expect(result.current.hasFailedUploads('q1')).toBe(true);
      expect(result.current.isCameraUploading('q1')).toBe(false);
      errorSpy.mockRestore();
    });

    it('logs a generic message when the rejection is not an Error', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockRejectedValue('just a string');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await act(async () => {
        await result.current.addCameraImage('q1', new File(['a'], 'a.png'));
      });

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to upload camera image to temp storage',
        'unknown error'
      );
      expect(result.current.hasFailedUploads('q1')).toBe(true);
      errorSpy.mockRestore();
    });

    it('marks a question with no images as neither uploading nor failed', () => {
      getChildResources.mockResolvedValue({ data: [] });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      expect(result.current.isCameraUploading('none')).toBe(false);
      expect(result.current.hasFailedUploads('none')).toBe(false);
      expect(result.current.cameraImageStatesFor('none')).toEqual([]);
    });

    it('treats a local-only image as done when there is no visit', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: null, sectionCommentFor })
      );
      await act(async () => {
        await result.current.addCameraImage('q1', new File(['a'], 'a.png'));
      });
      expect(upsertAssetResource).not.toHaveBeenCalled();
      expect(result.current.isCameraUploading('q1')).toBe(false);
      expect(result.current.cameraImageStatesFor('q1')[0].status).toBe('done');
    });
  });

  describe('retryCameraImage', () => {
    const renderWithFailedUpload = async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockRejectedValue(new Error('nope'));
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const hook = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await act(async () => {
        await hook.result.current.addCameraImage('q1', new File(['a'], 'a.png'));
      });
      errorSpy.mockRestore();
      return hook;
    };

    it('re-uploads a failed image and marks it done on success', async () => {
      const { result } = await renderWithFailedUpload();
      expect(result.current.hasFailedUploads('q1')).toBe(true);

      upsertAssetResource.mockReset().mockResolvedValue({ data: { id: 9 } });
      await act(async () => {
        await result.current.retryCameraImage('q1', 0);
      });

      expect(upsertAssetResource).toHaveBeenCalledTimes(1);
      // A successful retry links the queued file to the freshly created asset.
      expect(setPendingImageAssetId).toHaveBeenCalledWith(expect.any(File), 9);
      expect(result.current.hasFailedUploads('q1')).toBe(false);
      expect(result.current.cameraImageStatesFor('q1')[0]).toMatchObject({
        status: 'done',
        assetRecordId: 9,
      });
    });

    it('discards the asset and the image when the protocol was removed while the retry was uploading', async () => {
      const { result } = await renderWithFailedUpload();
      let resolveRetry: (v: unknown) => void = () => {};
      upsertAssetResource.mockReset().mockReturnValue(
        new Promise(resolve => {
          resolveRetry = resolve;
        })
      );

      let retrying: Promise<void>;
      act(() => {
        retrying = result.current.retryCameraImage('q1', 0);
      });
      await waitFor(() =>
        expect(result.current.isCameraUploading('q1')).toBe(true)
      );

      getPhysicalExamImageGeneration.mockReturnValue(1);
      await act(async () => {
        resolveRetry({ data: { id: 77 } });
        await retrying;
      });

      expect(deleteAssetResource).toHaveBeenCalledWith(77);
      expect(setPendingImageAssetId).not.toHaveBeenCalled();
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
      expect(result.current.isCameraUploading('q1')).toBe(false);
    });

    it('leaves the image failed when the retry also rejects', async () => {
      const { result } = await renderWithFailedUpload();
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        await result.current.retryCameraImage('q1', 0);
      });

      expect(result.current.hasFailedUploads('q1')).toBe(true);
      errorSpy.mockRestore();
    });

    it('does nothing for an image that has not failed', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockResolvedValue({ data: { id: 1 } });

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await act(async () => {
        await result.current.addCameraImage('q1', new File(['a'], 'a.png'));
      });
      upsertAssetResource.mockClear();

      await act(async () => {
        await result.current.retryCameraImage('q1', 0);
      });
      expect(upsertAssetResource).not.toHaveBeenCalled();
    });

    it('does nothing for a missing index or a restored image with no file', async () => {
      getChildResources.mockResolvedValue({
        data: [
          { id: 3, file_path: 'http://cdn/a.png', data: { questionId: 'q1' } },
        ],
      });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await waitFor(() =>
        expect(result.current.cameraImagesFor('q1').length).toBe(1)
      );

      await act(async () => {
        await result.current.retryCameraImage('q1', 0);
        await result.current.retryCameraImage('q1', 99);
      });
      expect(upsertAssetResource).not.toHaveBeenCalled();
    });

    it('does nothing when there is no visit to attach the asset to', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: null, sectionCommentFor })
      );
      await act(async () => {
        await result.current.addCameraImage('q1', new File(['a'], 'a.png'));
        await result.current.retryCameraImage('q1', 0);
      });
      expect(upsertAssetResource).not.toHaveBeenCalled();
    });
  });

  describe('in-flight settling before delete', () => {
    it('waits for a pending upload before deleting the asset it creates', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      let resolveUpload: (v: unknown) => void = () => {};
      upsertAssetResource.mockReturnValue(
        new Promise(res => {
          resolveUpload = res;
        })
      );

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );

      const file = new File(['a'], 'a.png');
      let pendingAdd: Promise<void>;
      act(() => {
        pendingAdd = result.current.addCameraImage('q1', file);
      });
      await waitFor(() =>
        expect(result.current.isCameraUploading('q1')).toBe(true)
      );

      /* Remove while the write is still in flight — no assetRecordId exists yet. */
      await act(async () => {
        const pendingRemove = result.current.removeCameraImage('q1', 0);
        resolveUpload({ data: { id: 42 } });
        await pendingAdd;
        await pendingRemove;
      });

      /* The delete must still reach the record the upload just created. */
      expect(deleteAssetResource).toHaveBeenCalledWith(42);
      /* …and the queue entry for that same image goes too, by file and by asset. */
      expect(removePendingImageByFile).toHaveBeenCalledWith(file);
      expect(removePendingImageByAssetId).toHaveBeenCalledWith(42);
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
    });
  });
});
