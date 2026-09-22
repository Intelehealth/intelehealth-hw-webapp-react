/**
 * Regression: removing / replacing the selected protocol must discard the
 * Physical Exam images that belonged to it.
 *
 * Runs the real hook, the real pending-image queue (obs.service), the real
 * temp-storage service (session-storage bookkeeping included) and the real
 * physical-exam-images service over an in-memory fake of the temp-storage
 * backend and of the OpenMRS obs endpoint.
 *
 * Images are not tagged with a protocol: they live under the visit, keyed by
 * question id, and "General Exams" questions are shared by every protocol. The
 * fixtures below therefore use one shared question (`q-general`) plus one
 * question that only that protocol shows, which is what made the previous
 * protocol's pictures reappear under the new one.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usePhysicalExamCameraImages } from '../../../../modules/ayu/hooks/usePhysicalExamCameraImages';
import { MindmapPortalApi } from '../../../../services/mindmap';
import { OpenMRSApi } from '../../../../services/openmrs';
import {
  addPendingDocument,
  clearPendingDocuments,
  clearPendingImages,
  getPendingDocuments,
  getPendingImages,
  uploadAllPhysicalExamImages,
} from '../../../../modules/ayu/services/obs.service';
import { clearPhysicalExamImages } from '../../../../modules/ayu/services/physical-exam-images.service';
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

/** Stands in for `physExamPendingImages` in the start-visit context. */
let summarySnapshot: Array<{ file: File; comment: string }> = [];

let previewCounter = 0;

beforeEach(() => {
  server.reset();
  summarySnapshot = [];
  clearPendingImages();
  clearPendingDocuments();
  sessionStorage.clear();
  previewCounter = 0;
  globalThis.URL.createObjectURL = vi.fn(
    (file: Blob) => `blob:${(file as File).name}#${++previewCounter}`
  );
  globalThis.URL.revokeObjectURL = vi.fn();
  vi.mocked(OpenMRSApi.post).mockReset().mockResolvedValue({});
  vi.mocked(MindmapPortalApi.get).mockClear();
});

/** Lets every pending promise chain (restore, deletes, uploads) run to the end. */
const settle = () =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });

const mount = () =>
  renderHook(() =>
    usePhysicalExamCameraImages({ visitId: VISIT, sectionCommentFor })
  );
type Hook = ReturnType<typeof mount>;

const picture = (name: string) =>
  new File([name], name, { type: 'image/jpeg' });

/** Same sequence as AyuPhysicalExamOptions.handleImageAdded: add, then commit. */
const addLikeUi = async (hook: Hook, questionId: string, name: string) => {
  await act(async () => {
    const uploading = hook.result.current.addCameraImage(
      questionId,
      picture(name)
    );
    hook.result.current.commitQuestionImages(questionId);
    await uploading;
  });
};

/** PhysicalExamination.onConfirm hands the Visit Summary a copy of the queue. */
const confirmPhysicalExam = () => {
  summarySnapshot = [...getPendingImages()];
};

/**
 * What StartVisit.handleProtocolCleared does for images, in the same order:
 * empty the Visit Summary snapshot, start discarding the images, then
 * remount Physical Exam with fresh state (the downstream reset key).
 */
const removeProtocol = (physicalExam: Hook) => {
  summarySnapshot = [];
  const discarded = clearPhysicalExamImages(VISIT);
  physicalExam.unmount();
  return { discarded, freshPhysicalExam: mount() };
};

const labelOf = (preview: string) =>
  preview.replace(/^blob:/, '').replace(/#\d+$/, '').split('/').pop();

/** Thumbnails Physical Exam shows for a question. */
const shown = (hook: Hook, questionId: string) =>
  hook.result.current.cameraImagesFor(questionId).map(labelOf);

/** Images waiting in the queue the Visit Summary and the final upload read. */
const queued = () => getPendingImages().map(img => img.file.name);

/** Images the temp-storage backend holds for the visit. */
const stored = () => server.assets.map(a => a.name);

/**
 * What the Visit Summary falls back to when nothing is queued: stored images of
 * committed questions that were not deleted (same rule as visit-summary.page).
 */
const summaryFallback = () =>
  server.assets
    .filter(
      a =>
        a.data.questionId &&
        !getDeletedAssetIds().has(a.id) &&
        getCommittedQuestionIds().has(a.data.questionId)
    )
    .map(a => a.name);

const sentToOpenMrs = async () => {
  await uploadAllPhysicalExamImages('enc-1', 'patient-1');
  return vi
    .mocked(OpenMRSApi.post)
    .mock.calls.map(call => ((call[1] as FormData).get('file') as File).name);
};

/** Protocol A: one shared General Exams question and one that only A shows. */
const captureForProtocolA = async () => {
  const physicalExam = mount();
  await addLikeUi(physicalExam, 'q-general', 'a-general-1.jpg');
  await addLikeUi(physicalExam, 'q-general', 'a-general-2.jpg');
  await addLikeUi(physicalExam, 'q-a-only', 'a-only.jpg');
  confirmPhysicalExam();
  return physicalExam;
};

describe('protocol A images, before the protocol changes', () => {
  it('are stored, queued and committed for the visit', async () => {
    const physicalExam = await captureForProtocolA();

    expect(shown(physicalExam, 'q-general')).toEqual([
      'a-general-1.jpg',
      'a-general-2.jpg',
    ]);
    expect(queued()).toEqual([
      'a-general-1.jpg',
      'a-general-2.jpg',
      'a-only.jpg',
    ]);
    expect(stored()).toHaveLength(3);
    expect([...getCommittedQuestionIds()].sort()).toEqual([
      'q-a-only',
      'q-general',
    ]);
    expect(summarySnapshot).toHaveLength(3);
  });
});

describe('protocol A is switched to protocol B', () => {
  it("clears A's images from Physical Exam, the queue, the Summary snapshot and storage", async () => {
    const physicalExamA = await captureForProtocolA();

    const { discarded, freshPhysicalExam } = removeProtocol(physicalExamA);
    await discarded;

    // Physical Exam for protocol B starts empty, including the shared question.
    await waitFor(() => expect(getPendingImages()).toHaveLength(0));
    expect(shown(freshPhysicalExam, 'q-general')).toEqual([]);
    expect(shown(freshPhysicalExam, 'q-a-only')).toEqual([]);
    // Nothing is left for the Visit Summary or the final upload to pick up.
    expect(summarySnapshot).toEqual([]);
    expect(queued()).toEqual([]);
    expect(summaryFallback()).toEqual([]);
    expect(await sentToOpenMrs()).toEqual([]);
    // Nor in the persisted data, and no committed marker is inherited.
    expect(stored()).toEqual([]);
    expect(getCommittedQuestionIds().size).toBe(0);
  });

  it("does not hand A's pictures to B's shared questions (the reported bug)", async () => {
    const physicalExamA = await captureForProtocolA();

    const { discarded, freshPhysicalExam } = removeProtocol(physicalExamA);
    await discarded;
    // Give the fresh Physical Exam time to read stored images back.
    await settle();

    expect(shown(freshPhysicalExam, 'q-general')).toEqual([]);
    expect(shown(freshPhysicalExam, 'q-a-only')).toEqual([]);
  });

  it("stores and shows only B's images when B uploads after the switch", async () => {
    const physicalExamA = await captureForProtocolA();
    const { discarded, freshPhysicalExam } = removeProtocol(physicalExamA);
    await discarded;

    await addLikeUi(freshPhysicalExam, 'q-general', 'b-general-1.jpg');
    await addLikeUi(freshPhysicalExam, 'q-b-only', 'b-only.jpg');
    confirmPhysicalExam();

    expect(shown(freshPhysicalExam, 'q-general')).toEqual(['b-general-1.jpg']);
    expect(shown(freshPhysicalExam, 'q-b-only')).toEqual(['b-only.jpg']);
    expect(queued()).toEqual(['b-general-1.jpg', 'b-only.jpg']);
    expect(summarySnapshot.map(img => img.file.name)).toEqual([
      'b-general-1.jpg',
      'b-only.jpg',
    ]);
    expect(stored()).toEqual(['b-general-1.jpg', 'b-only.jpg']);
    expect([...getCommittedQuestionIds()].sort()).toEqual([
      'q-b-only',
      'q-general',
    ]);
    expect(await sentToOpenMrs()).toEqual(['b-general-1.jpg', 'b-only.jpg']);
  });

  it("keeps a slow, already-running A delete from taking B's new images with it", async () => {
    const physicalExamA = await captureForProtocolA();
    let releaseDeletes: () => void = () => {};
    server.deleteGate = new Promise<void>(resolve => {
      releaseDeletes = resolve;
    });

    vi.mocked(MindmapPortalApi.get).mockClear();
    const { discarded, freshPhysicalExam } = removeProtocol(physicalExamA);
    await settle();
    // A's images are still being deleted, so they are still on the backend.
    // The fresh Physical Exam must not have read the visit's images yet: the
    // only listing so far is the discard's own.
    expect(stored()).toHaveLength(3);
    expect(vi.mocked(MindmapPortalApi.get)).toHaveBeenCalledTimes(1);
    expect(shown(freshPhysicalExam, 'q-general')).toEqual([]);

    await act(async () => {
      releaseDeletes();
      await discarded;
    });
    await settle();
    // Only now does it read them back, and there is nothing left to read.
    expect(vi.mocked(MindmapPortalApi.get)).toHaveBeenCalledTimes(2);
    expect(shown(freshPhysicalExam, 'q-general')).toEqual([]);
    expect(stored()).toEqual([]);

    // B works normally afterwards.
    server.deleteGate = undefined;
    await addLikeUi(freshPhysicalExam, 'q-general', 'b-general-1.jpg');
    expect(shown(freshPhysicalExam, 'q-general')).toEqual(['b-general-1.jpg']);
    expect(stored()).toEqual(['b-general-1.jpg']);
  });
});

describe('protocol A is removed without selecting another', () => {
  it("clears A's images and leaves a clean state", async () => {
    const physicalExamA = await captureForProtocolA();

    const { discarded, freshPhysicalExam } = removeProtocol(physicalExamA);
    await discarded;

    expect(shown(freshPhysicalExam, 'q-general')).toEqual([]);
    expect(queued()).toEqual([]);
    expect(summarySnapshot).toEqual([]);
    expect(stored()).toEqual([]);
    expect(getCommittedQuestionIds().size).toBe(0);
    expect(await sentToOpenMrs()).toEqual([]);
  });
});

describe('reopening or refreshing the visit after the protocol changed', () => {
  it("does not bring A's images back", async () => {
    const physicalExamA = await captureForProtocolA();
    const { discarded, freshPhysicalExam } = removeProtocol(physicalExamA);
    await discarded;
    freshPhysicalExam.unmount();

    // A full refresh: module-level queue is gone, Physical Exam mounts again.
    clearPendingImages();
    const reopened = mount();
    await settle();

    expect(shown(reopened, 'q-general')).toEqual([]);
    expect(shown(reopened, 'q-a-only')).toEqual([]);
    expect(summaryFallback()).toEqual([]);
  });

  it("does not bring A's images back in a new browser session either", async () => {
    const physicalExamA = await captureForProtocolA();
    const { discarded, freshPhysicalExam } = removeProtocol(physicalExamA);
    await discarded;
    freshPhysicalExam.unmount();

    // Session storage (committed / deleted markers) is gone too.
    clearPendingImages();
    sessionStorage.clear();
    const reopened = mount();
    await settle();

    // The images are gone from the backend itself, not just hidden by markers.
    expect(stored()).toEqual([]);
    expect(shown(reopened, 'q-general')).toEqual([]);
  });

  it("keeps A's images hidden after a refresh even when the backend delete failed", async () => {
    const physicalExamA = await captureForProtocolA();
    server.failDeletes = true;
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { discarded, freshPhysicalExam } = removeProtocol(physicalExamA);
    await discarded;
    freshPhysicalExam.unmount();

    // The three assets could not be deleted (backend unreachable) …
    expect(stored()).toHaveLength(3);
    // … but the deleted-asset markers survive a refresh in the same tab.
    clearPendingImages();
    const reopened = mount();
    await settle();

    expect(shown(reopened, 'q-general')).toEqual([]);
    expect(summaryFallback()).toEqual([]);
    errorSpy.mockRestore();
  });
});

describe('an image is still uploading when the protocol is removed', () => {
  it("does not let A's late upload survive into protocol B", async () => {
    const physicalExamA = mount();
    await addLikeUi(physicalExamA, 'q-general', 'a-general-1.jpg');

    // Second picture: the upload is slow and still in flight.
    let releaseUpload: () => void = () => {};
    server.uploadGate = new Promise<void>(resolve => {
      releaseUpload = resolve;
    });
    let lateUpload: Promise<void> = Promise.resolve();
    act(() => {
      lateUpload = physicalExamA.result.current.addCameraImage(
        'q-general',
        picture('a-late.jpg')
      );
      physicalExamA.result.current.commitQuestionImages('q-general');
    });
    server.uploadGate = undefined;

    // The protocol is removed before that upload finishes.
    const { discarded, freshPhysicalExam } = removeProtocol(physicalExamA);
    await discarded;
    await act(async () => {
      releaseUpload();
      await lateUpload;
    });
    // Let the late asset's own delete settle.
    await settle();

    // The asset created by the late upload was discarded as well.
    expect(stored()).toEqual([]);
    expect(queued()).toEqual([]);
    expect(shown(freshPhysicalExam, 'q-general')).toEqual([]);
  });
});

describe('unrelated visit data when the protocol changes', () => {
  it('leaves other assets, other visits, and additional documents alone', async () => {
    const physicalExamA = await captureForProtocolA();
    // An asset on this visit that is not a Physical Exam image (no question)
    // and a Physical Exam image that belongs to a different visit.
    server.assets.push(
      {
        id: 900,
        name: 'not-a-pe-image.pdf',
        parent_id: VISIT,
        data: {},
        file_path: 'http://cdn/900/not-a-pe-image.pdf',
      },
      {
        id: 901,
        name: 'other-visit.jpg',
        parent_id: 'visit-2',
        data: { questionId: 'q-general', comment: 'Section q-general' },
        file_path: 'http://cdn/901/other-visit.jpg',
      }
    );
    addPendingDocument(picture('lab-report.pdf'), 'Lab report');

    const { discarded } = removeProtocol(physicalExamA);
    await discarded;

    expect(stored()).toEqual(['not-a-pe-image.pdf', 'other-visit.jpg']);
    expect(getPendingDocuments().map(doc => doc.file.name)).toEqual([
      'lab-report.pdf',
    ]);
  });
});
