import {
  RESOURCE_TYPE_ASSET,
  RESOURCE_TYPE_VISIT,
} from '../utils/ayu.constants';
import { clearPendingImages } from './obs.service';
import {
  clearCommittedQuestionIds,
  deleteAssetResource,
  getChildResources,
} from './temp-storage.service';

/**
 * Physical Exam images are not tagged with a protocol. They are stored under
 * the visit, keyed by question id, and the shared "General Exams" questions are
 * the same for every protocol. So the images of the protocol being removed are
 * every image of the visit, and they must be discarded explicitly when it goes.
 */

/**
 * Bumped on every discard. An upload that started under an older value
 * finished after its protocol was removed, so the asset it stored must not
 * survive.
 */
let generation = 0;

export const getPhysicalExamImageGeneration = (): number => generation;

let cleanup: Promise<void> | null = null;

/**
 * The discard that is still deleting the visit's stored images, or null when
 * none is running. Physical Exam reads those images back on mount, so it waits
 * for this first.
 */
export const getImageCleanupInProgress = (): Promise<void> | null => cleanup;

const deleteStoredImages = async (visitId: string): Promise<void> => {
  try {
    const res = await getChildResources<{ questionId?: string }>(
      RESOURCE_TYPE_VISIT,
      visitId,
      RESOURCE_TYPE_ASSET
    );
    // Only Physical Exam images carry a questionId; any other asset is left alone.
    const images = (res.data ?? []).filter(record => record.data?.questionId);
    await Promise.allSettled(
      images.map(record => deleteAssetResource(record.id))
    );
  } catch (err) {
    console.error(
      'Failed to clear Physical Exam images from temp storage',
      err instanceof Error ? err.message : 'unknown error'
    );
  }
};

/**
 * Discards every Physical Exam image of the visit: the upload queue, the
 * committed-question markers and the images persisted in temp storage.
 * Nothing else about the visit is touched.
 */
export const clearPhysicalExamImages = (visitId: string): Promise<void> => {
  generation += 1;
  clearPendingImages();
  clearCommittedQuestionIds();
  const running = deleteStoredImages(visitId).finally(() => {
    if (cleanup === running) cleanup = null;
  });
  cleanup = running;
  return running;
};
