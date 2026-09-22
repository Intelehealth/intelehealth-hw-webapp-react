/**
 * Regression: deleting ONE Physical Exam image must not remove the others.
 *
 * usePhysicalExamCameraImages.test.tsx mocks every collaborator. This file runs
 * the real hook against the real pending-image queue (obs.service) and the real
 * temp-storage service (session-storage bookkeeping included), over an
 * in-memory fake of the temp-storage backend and of the OpenMRS obs endpoint.
 * That is the path a visit takes:
 *
 *   camera / gallery -> hook state -> pending queue + temp storage
 *     -> Visit Summary (reads the queue) -> final obs upload
 *
 * so asserting on the queue asserts on what the Visit Summary shows and on what
 * the final upload sends.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePhysicalExamCameraImages } from '../../../../modules/ayu/hooks/usePhysicalExamCameraImages';
import { MindmapPortalApi } from '../../../../services/mindmap';
import { OpenMRSApi } from '../../../../services/openmrs';
import {
  clearPendingImages,
  getPendingImages,
  uploadAllPhysicalExamImages,
} from '../../../../modules/ayu/services/obs.service';
import {
  getCommittedQuestionIds,
  getDeletedAssetIds,
} from '../../../../modules/ayu/services/temp-storage.service';
import { fakeTempStorage as server } from '../../../mocks/fake-temp-storage';

vi.mock('../../../../services/mindmap', async () => {
  const { fakeTempStorage } = await import('../../../mocks/fake-temp-storage');
  return { MindmapPortalApi: fakeTempStorage.api };
});
vi.mock('../../../../services/openmrs', () => ({
  OpenMRSApi: { get: vi.fn(), post: vi.fn() },
}));
vi.mock('../../../../utils/storage', () => ({
  storage: { getUser: () => null },
}));

const VISIT = 'visit-1';
const sectionCommentFor = (questionId: string) => `Section ${questionId}`;

let previewCounter = 0;

beforeEach(() => {
  server.reset();
  clearPendingImages();
  sessionStorage.clear();
  previewCounter = 0;
  globalThis.URL.createObjectURL = vi.fn(
    (file: Blob) => `blob:${(file as File).name}#${++previewCounter}`
  );
  globalThis.URL.revokeObjectURL = vi.fn();
  vi.mocked(OpenMRSApi.post).mockReset().mockResolvedValue({});
});

const mount = (visitId: string | null = VISIT) =>
  renderHook(() =>
    usePhysicalExamCameraImages({ visitId, sectionCommentFor })
  );
type Hook = ReturnType<typeof mount>;

const cameraShot = (n: number) =>
  new File([`camera-${n}`], `camera-${n}.jpg`, { type: 'image/jpeg' });
const galleryUpload = (n: number) =>
  new File([`upload-${n}`], `upload-${n}.png`, { type: 'image/png' });

/** Same sequence as AyuPhysicalExamOptions.handleImageAdded: add, then commit. */
const addLikeUi = async (hook: Hook, questionId: string, file: File) => {
  await act(async () => {
    const uploading = hook.result.current.addCameraImage(questionId, file);
    hook.result.current.commitQuestionImages(questionId);
    await uploading;
  });
};

const remove = (hook: Hook, questionId: string, index: number) =>
  act(async () => {
    await hook.result.current.removeCameraImage(questionId, index);
  });

/** File name behind a thumbnail URL (blob preview or restored temp-storage URL). */
const labelOf = (preview: string) =>
  preview.replace(/^blob:/, '').replace(/#\d+$/, '').split('/').pop();

/** Thumbnails the Physical Exam screen shows for a question. */
const shown = (hook: Hook, questionId: string) =>
  hook.result.current.cameraImagesFor(questionId).map(labelOf);

/** Images waiting in the queue the Visit Summary and the final upload read. */
const queued = (questionId?: string) =>
  getPendingImages()
    .filter(img => questionId === undefined || img.questionId === questionId)
    .map(img => img.file.name);

/** Images the temp-storage backend still holds for the visit. */
const stored = () => server.assets.map(a => a.name);

/** Files the final obs upload would send, in order. */
const sentToOpenMrs = async () => {
  await uploadAllPhysicalExamImages('enc-1', 'patient-1');
  return vi
    .mocked(OpenMRSApi.post)
    .mock.calls.map(call => ((call[1] as FormData).get('file') as File).name);
};

describe('Physical Exam image deletion keeps every other image', () => {
  it('capture 2 images, delete 1: only the other one remains everywhere', async () => {
    const hook = mount();
    await addLikeUi(hook, 'q1', cameraShot(1));
    await addLikeUi(hook, 'q1', cameraShot(2));

    await remove(hook, 'q1', 0);

    expect(shown(hook, 'q1')).toEqual(['camera-2.jpg']);
    expect(queued('q1')).toEqual(['camera-2.jpg']);
    expect(stored()).toEqual(['camera-2.jpg']);
    expect(getCommittedQuestionIds().has('q1')).toBe(true);
    expect(await sentToOpenMrs()).toEqual(['camera-2.jpg']);
  });

  it('upload 5 images, delete 1: 4 remain everywhere', async () => {
    const hook = mount();
    for (let n = 1; n <= 5; n++) {
      await addLikeUi(hook, 'q1', galleryUpload(n));
    }

    await remove(hook, 'q1', 2);

    const expected = [
      'upload-1.png',
      'upload-2.png',
      'upload-4.png',
      'upload-5.png',
    ];
    expect(shown(hook, 'q1')).toEqual(expected);
    expect(queued('q1')).toEqual(expected);
    expect(stored()).toEqual(expected);
    expect(await sentToOpenMrs()).toEqual(expected);
  });

  it('mix of camera and gallery images across questions: only the deleted one goes, other questions are untouched', async () => {
    const hook = mount();
    await addLikeUi(hook, 'q1', cameraShot(1));
    await addLikeUi(hook, 'q1', galleryUpload(1));
    await addLikeUi(hook, 'q1', cameraShot(2));
    await addLikeUi(hook, 'q2', galleryUpload(2));
    await addLikeUi(hook, 'q2', cameraShot(3));

    await remove(hook, 'q1', 1); // the gallery upload on q1

    expect(shown(hook, 'q1')).toEqual(['camera-1.jpg', 'camera-2.jpg']);
    expect(shown(hook, 'q2')).toEqual(['upload-2.png', 'camera-3.jpg']);
    expect(queued()).toEqual([
      'camera-1.jpg',
      'camera-2.jpg',
      'upload-2.png',
      'camera-3.jpg',
    ]);

    await remove(hook, 'q2', 1); // then a camera shot on q2

    expect(shown(hook, 'q1')).toEqual(['camera-1.jpg', 'camera-2.jpg']);
    expect(shown(hook, 'q2')).toEqual(['upload-2.png']);
    expect(stored()).toEqual(['camera-1.jpg', 'camera-2.jpg', 'upload-2.png']);
    expect(await sentToOpenMrs()).toEqual([
      'camera-1.jpg',
      'camera-2.jpg',
      'upload-2.png',
    ]);
  });

  it.each([0, 1, 2])(
    'deleting image #%i of 3 removes exactly that image',
    async index => {
      const hook = mount();
      const names = ['camera-1.jpg', 'camera-2.jpg', 'camera-3.jpg'];
      for (let n = 1; n <= 3; n++) await addLikeUi(hook, 'q1', cameraShot(n));

      await remove(hook, 'q1', index);

      const expected = names.filter((_, i) => i !== index);
      expect(shown(hook, 'q1')).toEqual(expected);
      expect(queued('q1')).toEqual(expected);
      expect(stored()).toEqual(expected);
    }
  );

  it('two images with the same file name are told apart by identity, not by name', async () => {
    const hook = mount();
    const first = new File(['x'], 'photo.png', { type: 'image/png' });
    const second = new File(['y'], 'photo.png', { type: 'image/png' });
    await addLikeUi(hook, 'q1', first);
    await addLikeUi(hook, 'q1', second);

    await remove(hook, 'q1', 1);

    expect(getPendingImages()).toHaveLength(1);
    expect(getPendingImages()[0].file).toBe(first);
    expect(hook.result.current.cameraImagesFor('q1')).toEqual([
      'blob:photo.png#1',
    ]);
  });

  it('deleting the last remaining image empties the question and un-commits it', async () => {
    const hook = mount();
    await addLikeUi(hook, 'q1', cameraShot(1));
    await addLikeUi(hook, 'q1', cameraShot(2));

    await remove(hook, 'q1', 0);
    expect(getCommittedQuestionIds().has('q1')).toBe(true);
    await remove(hook, 'q1', 0);

    expect(shown(hook, 'q1')).toEqual([]);
    expect(queued()).toEqual([]);
    expect(stored()).toEqual([]);
    expect(getCommittedQuestionIds().has('q1')).toBe(false);
  });

  it('deleting on one question leaves the images of the other questions in the queue', async () => {
    const hook = mount();
    await addLikeUi(hook, 'q1', cameraShot(1));
    await addLikeUi(hook, 'q2', cameraShot(2));
    await addLikeUi(hook, 'q3', cameraShot(3));

    await remove(hook, 'q1', 0);

    expect(queued()).toEqual(['camera-2.jpg', 'camera-3.jpg']);
    expect(shown(hook, 'q2')).toEqual(['camera-2.jpg']);
    expect(shown(hook, 'q3')).toEqual(['camera-3.jpg']);
    expect(getCommittedQuestionIds().has('q2')).toBe(true);
    expect(getCommittedQuestionIds().has('q3')).toBe(true);
  });

  it('two quick deletes from the same render remove exactly the two clicked images', async () => {
    const hook = mount();
    for (let n = 1; n <= 3; n++) await addLikeUi(hook, 'q1', cameraShot(n));

    // Both clicks target indexes of the list as it was rendered; the first
    // removal must not shift the second click onto a different image.
    await act(async () => {
      await Promise.all([
        hook.result.current.removeCameraImage('q1', 0),
        hook.result.current.removeCameraImage('q1', 2),
      ]);
    });

    expect(shown(hook, 'q1')).toEqual(['camera-2.jpg']);
    expect(queued('q1')).toEqual(['camera-2.jpg']);
    expect(stored()).toEqual(['camera-2.jpg']);
  });

  it('deleting an image whose upload is still in flight removes that image and its asset only', async () => {
    const hook = mount();
    let release: () => void = () => {};
    server.uploadGate = new Promise<void>(resolve => {
      release = resolve;
    });
    let firstUpload: Promise<void> = Promise.resolve();
    act(() => {
      firstUpload = hook.result.current.addCameraImage('q1', cameraShot(1));
      hook.result.current.commitQuestionImages('q1');
    });
    server.uploadGate = undefined;
    await addLikeUi(hook, 'q1', cameraShot(2));

    await act(async () => {
      const removal = hook.result.current.removeCameraImage('q1', 0);
      release();
      await firstUpload;
      await removal;
    });

    expect(shown(hook, 'q1')).toEqual(['camera-2.jpg']);
    expect(queued('q1')).toEqual(['camera-2.jpg']);
    // The asset the in-flight upload created is deleted as well.
    expect(stored()).toEqual(['camera-2.jpg']);
  });

  it('clearing the camera tile of one question still wipes only that question', async () => {
    const hook = mount();
    await addLikeUi(hook, 'q1', cameraShot(1));
    await addLikeUi(hook, 'q1', cameraShot(2));
    await addLikeUi(hook, 'q2', cameraShot(3));

    await act(async () => {
      await hook.result.current.clearCameraImages('q1');
    });

    expect(queued()).toEqual(['camera-3.jpg']);
    expect(stored()).toEqual(['camera-3.jpg']);
    expect(getCommittedQuestionIds().has('q1')).toBe(false);
    expect(getCommittedQuestionIds().has('q2')).toBe(true);
  });
});

describe('deleting alongside other image operations', () => {
  it('adding an image after a delete keeps the rest and does not bring the deleted one back', async () => {
    const hook = mount();
    for (let n = 1; n <= 3; n++) await addLikeUi(hook, 'q1', cameraShot(n));

    await remove(hook, 'q1', 1); // camera-2 goes
    await addLikeUi(hook, 'q1', galleryUpload(1));

    const expected = ['camera-1.jpg', 'camera-3.jpg', 'upload-1.png'];
    expect(shown(hook, 'q1')).toEqual(expected);
    expect(queued('q1')).toEqual(expected);
    expect(stored()).toEqual(expected);
    expect(await sentToOpenMrs()).toEqual(expected);
  });

  it('an image whose upload failed is deleted without touching the backend or its siblings', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const hook = mount();
    server.failUploads = 1;
    await addLikeUi(hook, 'q1', cameraShot(1)); // upload fails: no asset exists
    await addLikeUi(hook, 'q1', cameraShot(2));
    errorSpy.mockRestore();
    expect(hook.result.current.hasFailedUploads('q1')).toBe(true);

    await remove(hook, 'q1', 0);

    expect(shown(hook, 'q1')).toEqual(['camera-2.jpg']);
    expect(queued('q1')).toEqual(['camera-2.jpg']);
    expect(stored()).toEqual(['camera-2.jpg']);
    // There was nothing stored for the failed image, so nothing to delete.
    expect(vi.mocked(MindmapPortalApi.delete)).not.toHaveBeenCalled();
    expect(hook.result.current.hasFailedUploads('q1')).toBe(false);
  });

  it('a double click on the same thumbnail removes that image once and leaves the rest', async () => {
    const hook = mount();
    for (let n = 1; n <= 3; n++) await addLikeUi(hook, 'q1', cameraShot(n));

    // Both clicks resolve against the list as it was rendered.
    await act(async () => {
      await Promise.all([
        hook.result.current.removeCameraImage('q1', 1),
        hook.result.current.removeCameraImage('q1', 1),
      ]);
    });

    expect(shown(hook, 'q1')).toEqual(['camera-1.jpg', 'camera-3.jpg']);
    expect(queued('q1')).toEqual(['camera-1.jpg', 'camera-3.jpg']);
    expect(stored()).toEqual(['camera-1.jpg', 'camera-3.jpg']);
  });

  it('removes the blob URL of the deleted image and no other', async () => {
    const hook = mount();
    for (let n = 1; n <= 3; n++) await addLikeUi(hook, 'q1', cameraShot(n));
    const [first, second, third] = hook.result.current.cameraImagesFor('q1');

    await remove(hook, 'q1', 1);

    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith(second);
    expect(globalThis.URL.revokeObjectURL).not.toHaveBeenCalledWith(first);
    expect(globalThis.URL.revokeObjectURL).not.toHaveBeenCalledWith(third);
  });
});

describe('after returning to Physical Exam from the Visit Summary', () => {
  const capturedTwoQuestions = async () => {
    const first = mount();
    await addLikeUi(first, 'q1', cameraShot(1));
    await addLikeUi(first, 'q1', galleryUpload(1));
    await addLikeUi(first, 'q1', cameraShot(2));
    await addLikeUi(first, 'q2', galleryUpload(2));
    await addLikeUi(first, 'q2', cameraShot(3));
    // Leaving the screen unmounts the hook; the module-level queue survives.
    first.unmount();
    const second = mount();
    await waitFor(() => expect(shown(second, 'q1')).toHaveLength(3));
    await waitFor(() => expect(shown(second, 'q2')).toHaveLength(2));
    return second;
  };

  it('deleting a restored image keeps its siblings and the other question in the queue', async () => {
    const hook = await capturedTwoQuestions();

    await remove(hook, 'q1', 1);

    expect(shown(hook, 'q1')).toEqual(['camera-1.jpg', 'camera-2.jpg']);
    expect(shown(hook, 'q2')).toEqual(['upload-2.png', 'camera-3.jpg']);
    expect(queued('q1')).toEqual(['camera-1.jpg', 'camera-2.jpg']);
    expect(queued('q2')).toEqual(['upload-2.png', 'camera-3.jpg']);
    expect(stored()).toEqual([
      'camera-1.jpg',
      'camera-2.jpg',
      'upload-2.png',
      'camera-3.jpg',
    ]);
    expect(await sentToOpenMrs()).toEqual([
      'camera-1.jpg',
      'camera-2.jpg',
      'upload-2.png',
      'camera-3.jpg',
    ]);
  });

  it('a snapshot of the queue taken for the Visit Summary lists every remaining image', async () => {
    const hook = await capturedTwoQuestions();

    await remove(hook, 'q2', 0);
    // What PhysicalExamination hands to the Visit Summary when it is confirmed.
    const snapshot = [...getPendingImages()].map(img => img.file.name);

    expect(snapshot).toEqual([
      'camera-1.jpg',
      'upload-1.png',
      'camera-2.jpg',
      'camera-3.jpg',
    ]);
  });

  it('a failed upload that was retried is still matched to its asset after the round trip', async () => {
    const first = mount();
    server.failUploads = 1;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await addLikeUi(first, 'q1', cameraShot(1)); // fails, no asset yet
    await addLikeUi(first, 'q1', cameraShot(2));
    errorSpy.mockRestore();
    await act(async () => {
      await first.result.current.retryCameraImage('q1', 0);
    });
    first.unmount();
    const second = mount();
    await waitFor(() => expect(shown(second, 'q1')).toHaveLength(2));

    // Restored order follows the backend: camera-2 was stored first.
    const index = shown(second, 'q1').indexOf('camera-1.jpg');
    await remove(second, 'q1', index);

    expect(shown(second, 'q1')).toEqual(['camera-2.jpg']);
    expect(queued('q1')).toEqual(['camera-2.jpg']);
    expect(stored()).toEqual(['camera-2.jpg']);
  });
});

describe('after a full page refresh (queue and hook state are gone)', () => {
  it('deleting a restored image removes only that asset and the rest survive another refresh', async () => {
    const first = mount();
    for (let n = 1; n <= 3; n++) await addLikeUi(first, 'q1', cameraShot(n));
    first.unmount();
    clearPendingImages(); // a reload resets the module-level queue

    const second = mount();
    await waitFor(() => expect(shown(second, 'q1')).toHaveLength(3));
    await remove(second, 'q1', 1);

    expect(shown(second, 'q1')).toEqual(['camera-1.jpg', 'camera-3.jpg']);
    expect(getDeletedAssetIds().size).toBe(1);
    expect(stored()).toEqual(['camera-1.jpg', 'camera-3.jpg']);
    expect(getCommittedQuestionIds().has('q1')).toBe(true);

    second.unmount();
    const third = mount(); // refresh again
    await waitFor(() =>
      expect(shown(third, 'q1')).toEqual(['camera-1.jpg', 'camera-3.jpg'])
    );
  });
});
