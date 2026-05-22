import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePhysicalExamCameraImages } from '../../../../modules/ayu/hooks/usePhysicalExamCameraImages';

const addPendingImage = vi.fn();
const clearPendingImages = vi.fn();
const removePendingImage = vi.fn();
const getChildResources = vi.fn();
const upsertAssetResource = vi.fn();
const fileToBase64 = vi.fn();
const getUser = vi.fn();

vi.mock('../../../../modules/ayu/services/obs.service', () => ({
  addPendingImage: (...args: unknown[]) => addPendingImage(...args),
  clearPendingImages: (...args: unknown[]) => clearPendingImages(...args),
  removePendingImage: (...args: unknown[]) => removePendingImage(...args),
}));

vi.mock('../../../../modules/ayu/services/temp-storage.service', () => ({
  getChildResources: (...args: unknown[]) => getChildResources(...args),
  upsertAssetResource: (...args: unknown[]) => upsertAssetResource(...args),
}));

vi.mock('../../../../modules/profile/profile.helpers', () => ({
  fileToBase64: (...args: unknown[]) => fileToBase64(...args),
}));

vi.mock('../../../../utils/storage', () => ({
  storage: { getUser: () => getUser() },
}));

const sectionCommentFor = vi.fn((qId: string) => `Section for ${qId}`);

beforeEach(() => {
  addPendingImage.mockReset();
  clearPendingImages.mockReset();
  removePendingImage.mockReset();
  getChildResources.mockReset();
  upsertAssetResource.mockReset();
  fileToBase64.mockReset().mockResolvedValue('data:image/png;base64,xxx');
  getUser.mockReset();
  sectionCommentFor.mockClear();
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

    it('swallows errors from temp-storage', async () => {
      getChildResources.mockRejectedValue(new Error('boom'));
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await waitFor(() => expect(getChildResources).toHaveBeenCalled());
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
    });
  });

  describe('addCameraImage', () => {
    it('persists locally only when visitId is missing (no upload)', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: null, sectionCommentFor })
      );
      const file = new File(['a'], 'a.png');
      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });
      expect(addPendingImage).toHaveBeenCalledWith(
        file,
        'Section for q1'
      );
      expect(upsertAssetResource).not.toHaveBeenCalled();
      expect(result.current.cameraImagesFor('q1')).toEqual([
        'data:image/png;base64,xxx',
      ]);
    });

    it('uploads via upsertAssetResource and stores assetRecordId when visitId is present', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(JSON.stringify({ uuid: 'user-uuid' }));
      upsertAssetResource.mockResolvedValue({ data: { id: 99 } });

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await act(async () => {
        await result.current.addCameraImage('q1', new File(['a'], 'a.png'));
      });

      expect(upsertAssetResource).toHaveBeenCalledTimes(1);
      const meta = upsertAssetResource.mock.calls[0][1];
      expect(meta).toMatchObject({
        parent_type: 'visit',
        parent_id: 'visit-1',
        created_by: 'user-uuid',
        data: { questionId: 'q1' },
      });
      expect(result.current.cameraImagesFor('q1')).toEqual([
        'data:image/png;base64,xxx',
      ]);
    });

    it('uses the raw storage user string when getUser returns invalid JSON', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      // Non-JSON value — JSON.parse throws, the catch falls through
      getUser.mockReturnValue('not-json');
      upsertAssetResource.mockResolvedValue({ data: { id: 1 } });

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await act(async () => {
        await result.current.addCameraImage('q1', new File(['a'], 'a.png'));
      });
      // createdBy stays at 'unknown' since the parse threw
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
      // No uuid field → ?? falls back to the raw string
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

    it('still adds the image to local state when the upload fails', async () => {
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
        'data:image/png;base64,xxx',
      ]);
    });
  });

  describe('removeCameraImage', () => {
    it('removes the image and de-queues it from the pending queue (using flat index)', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockResolvedValue({ data: { id: 1 } });

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );

      // Add 2 images to q1 and 1 to q2 → flat order is [q1#0, q1#1, q2#0]
      await act(async () => {
        await result.current.addCameraImage('q1', new File(['a'], 'a.png'));
        await result.current.addCameraImage('q1', new File(['b'], 'b.png'));
        await result.current.addCameraImage('q2', new File(['c'], 'c.png'));
      });

      // Remove q1's second image — its flat index is 1 (after q1#0)
      act(() => {
        result.current.removeCameraImage('q1', 1);
      });
      expect(removePendingImage).toHaveBeenLastCalledWith(1);
      expect(result.current.cameraImagesFor('q1')).toEqual([
        'data:image/png;base64,xxx',
      ]);
    });

    it('skips the pending queue update when the removed image has no file (restored from temp-storage)', async () => {
      getChildResources.mockResolvedValue({
        data: [
          { id: 1, file_path: 'http://cdn/a.png', data: { questionId: 'q1' } },
        ],
      });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await waitFor(() =>
        expect(result.current.cameraImagesFor('q1').length).toBe(1)
      );
      act(() => result.current.removeCameraImage('q1', 0));
      expect(removePendingImage).not.toHaveBeenCalled();
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
    });

    it('is a no-op on the pending queue when the index is out of range', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: null, sectionCommentFor })
      );
      act(() => result.current.removeCameraImage('q1', 0));
      expect(removePendingImage).not.toHaveBeenCalled();
    });

    it('counts files of preceding questions into flat index when removing from a later question', async () => {
      getChildResources.mockResolvedValue({ data: [] });
      getUser.mockReturnValue(null);
      upsertAssetResource.mockResolvedValue({ data: { id: 1 } });

      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );

      // Insertion order: q1 (2 files), q2 (1 file). Pending queue order is
      // [q1#0, q1#1, q2#0]. Removing q2#0 must report flatIndex = 2 (after
      // both q1 files), exercising the `flatIndex += imgs.filter(...).length`
      // path for the non-target question.
      await act(async () => {
        await result.current.addCameraImage('q1', new File(['a'], 'a.png'));
        await result.current.addCameraImage('q1', new File(['b'], 'b.png'));
        await result.current.addCameraImage('q2', new File(['c'], 'c.png'));
      });

      act(() => result.current.removeCameraImage('q2', 0));
      expect(removePendingImage).toHaveBeenLastCalledWith(2);
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

      // visitId change re-fires the effect, but `hasRestoredRef.current` is
      // true so the early-return guard kicks in — getChildResources stays at 1.
      rerender({ visitId: 'visit-2' });
      expect(getChildResources).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearCameraImages', () => {
    it('clears the question and rebuilds the pending queue from remaining images', async () => {
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
      addPendingImage.mockClear();

      act(() => result.current.clearCameraImages('q1'));

      expect(clearPendingImages).toHaveBeenCalled();
      // q2's image stays — its pending entry is re-added; q1 is cleared
      expect(addPendingImage).toHaveBeenCalledTimes(1);
      expect(addPendingImage.mock.calls[0][1]).toBe('Section for q2');
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
      expect(result.current.cameraImagesFor('q2')).toEqual([
        'data:image/png;base64,xxx',
      ]);
    });

    it('does not re-add restored (file-less) images to the pending queue', async () => {
      getChildResources.mockResolvedValue({
        data: [
          { id: 1, file_path: 'http://cdn/a.png', data: { questionId: 'q2' } },
        ],
      });
      const { result } = renderHook(() =>
        usePhysicalExamCameraImages({ visitId: 'visit-1', sectionCommentFor })
      );
      await waitFor(() =>
        expect(result.current.cameraImagesFor('q2').length).toBe(1)
      );
      addPendingImage.mockClear();

      act(() => result.current.clearCameraImages('q1'));
      expect(clearPendingImages).toHaveBeenCalled();
      // q2's image has no `file` (restored), so it's NOT re-added to pending
      expect(addPendingImage).not.toHaveBeenCalled();
    });
  });
});
