import { beforeEach, describe, expect, it, vi } from 'vitest';

const clearPendingImages = vi.fn();
const clearCommittedQuestionIds = vi.fn();
const deleteAssetResource = vi.fn();
const getChildResources = vi.fn();

vi.mock('../../../../modules/ayu/services/obs.service', () => ({
  clearPendingImages: (...args: unknown[]) => clearPendingImages(...args),
}));

vi.mock('../../../../modules/ayu/services/temp-storage.service', () => ({
  clearCommittedQuestionIds: (...args: unknown[]) =>
    clearCommittedQuestionIds(...args),
  deleteAssetResource: (...args: unknown[]) => deleteAssetResource(...args),
  getChildResources: (...args: unknown[]) => getChildResources(...args),
}));

import {
  clearPhysicalExamImages,
  getImageCleanupInProgress,
  getPhysicalExamImageGeneration,
} from '../../../../modules/ayu/services/physical-exam-images.service';

const image = (id: number, questionId = 'q1') => ({
  id,
  data: { questionId },
  file_path: `http://cdn/${id}.png`,
});

beforeEach(() => {
  clearPendingImages.mockReset();
  clearCommittedQuestionIds.mockReset();
  deleteAssetResource.mockReset().mockResolvedValue(undefined);
  getChildResources.mockReset().mockResolvedValue({ data: [] });
});

describe('physical-exam-images.service', () => {
  describe('clearPhysicalExamImages', () => {
    it('clears the upload queue and the committed markers straight away', async () => {
      const done = clearPhysicalExamImages('visit-1');

      // Synchronous: nothing has been awaited yet.
      expect(clearPendingImages).toHaveBeenCalledTimes(1);
      expect(clearCommittedQuestionIds).toHaveBeenCalledTimes(1);

      await done;
    });

    it('deletes every Physical Exam image stored for the visit', async () => {
      getChildResources.mockResolvedValue({
        data: [image(1, 'q1'), image(2, 'q1'), image(3, 'q2')],
      });

      await clearPhysicalExamImages('visit-1');

      expect(getChildResources).toHaveBeenCalledWith(
        'visit',
        'visit-1',
        'asset'
      );
      expect(deleteAssetResource.mock.calls.map(call => call[0])).toEqual([
        1, 2, 3,
      ]);
    });

    it('leaves assets that are not Physical Exam images alone', async () => {
      getChildResources.mockResolvedValue({
        data: [
          image(1),
          // No questionId: not a Physical Exam image
          { id: 2, data: {}, file_path: 'http://cdn/2.pdf' },
          // No data at all
          { id: 3, file_path: 'http://cdn/3.pdf' },
        ],
      });

      await clearPhysicalExamImages('visit-1');

      expect(deleteAssetResource.mock.calls.map(call => call[0])).toEqual([1]);
    });

    it('does nothing when the visit has no stored images', async () => {
      getChildResources.mockResolvedValue({ data: null });

      await clearPhysicalExamImages('visit-1');

      expect(deleteAssetResource).not.toHaveBeenCalled();
    });

    it('keeps deleting the rest when one delete fails, without treating it as an error', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getChildResources.mockResolvedValue({
        data: [image(1), image(2), image(3)],
      });
      deleteAssetResource.mockImplementation((id: number) =>
        id === 2 ? Promise.reject(new Error('gone')) : Promise.resolve()
      );

      await expect(clearPhysicalExamImages('visit-1')).resolves.toBeUndefined();

      expect(deleteAssetResource).toHaveBeenCalledTimes(3);
      // One image that could not be deleted is tolerated quietly (the
      // deleted-asset marker keeps it hidden); only a failed listing is logged.
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('does not finish until every delete has settled, even after one has failed', async () => {
      getChildResources.mockResolvedValue({ data: [image(1), image(2)] });
      let finishSecondDelete: () => void = () => {};
      deleteAssetResource.mockImplementation((id: number) =>
        id === 1
          ? Promise.reject(new Error('gone'))
          : new Promise<void>(resolve => {
              finishSecondDelete = resolve;
            })
      );

      let finished = false;
      const discarded = clearPhysicalExamImages('visit-1').then(() => {
        finished = true;
      });
      await new Promise(resolve => setTimeout(resolve, 0));

      // Image 1 already failed, image 2 is still being deleted: the discard is
      // still running, so a fresh Physical Exam keeps waiting instead of
      // reading image 2 back.
      expect(finished).toBe(false);
      expect(getImageCleanupInProgress()).not.toBeNull();

      finishSecondDelete();
      await discarded;
      expect(finished).toBe(true);
      expect(getImageCleanupInProgress()).toBeNull();
    });

    it('logs the message and still resolves when the listing fails', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getChildResources.mockRejectedValue(new Error('offline'));

      await expect(clearPhysicalExamImages('visit-1')).resolves.toBeUndefined();

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to clear Physical Exam images from temp storage',
        'offline'
      );
      expect(deleteAssetResource).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('logs a generic message when the failure is not an Error', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      getChildResources.mockRejectedValue('just a string');

      await clearPhysicalExamImages('visit-1');

      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to clear Physical Exam images from temp storage',
        'unknown error'
      );
      errorSpy.mockRestore();
    });
  });

  describe('getPhysicalExamImageGeneration', () => {
    it('changes on every discard so in-flight uploads can tell they are stale', async () => {
      const before = getPhysicalExamImageGeneration();

      await clearPhysicalExamImages('visit-1');
      const afterFirst = getPhysicalExamImageGeneration();
      await clearPhysicalExamImages('visit-1');

      expect(afterFirst).not.toBe(before);
      expect(getPhysicalExamImageGeneration()).not.toBe(afterFirst);
    });
  });

  describe('getImageCleanupInProgress', () => {
    it('is null when no discard is running', async () => {
      await clearPhysicalExamImages('visit-1');

      expect(getImageCleanupInProgress()).toBeNull();
    });

    it('exposes the running discard until it has finished deleting', async () => {
      let finishListing: (value: unknown) => void = () => {};
      getChildResources.mockReturnValue(
        new Promise(resolve => {
          finishListing = resolve;
        })
      );

      const done = clearPhysicalExamImages('visit-1');
      expect(getImageCleanupInProgress()).not.toBeNull();

      finishListing({ data: [image(1)] });
      await done;

      expect(deleteAssetResource).toHaveBeenCalledWith(1);
      expect(getImageCleanupInProgress()).toBeNull();
    });

    it('keeps reporting the newest discard when an older one finishes first', async () => {
      const finishers: Array<(value: unknown) => void> = [];
      getChildResources.mockImplementation(
        () =>
          new Promise(resolve => {
            finishers.push(resolve);
          })
      );

      const older = clearPhysicalExamImages('visit-1');
      const newer = clearPhysicalExamImages('visit-1');

      finishers[0]({ data: [] });
      await older;
      // The older discard finished, but the newer one is still running.
      expect(getImageCleanupInProgress()).not.toBeNull();

      finishers[1]({ data: [] });
      await newer;
      expect(getImageCleanupInProgress()).toBeNull();
    });
  });
});
