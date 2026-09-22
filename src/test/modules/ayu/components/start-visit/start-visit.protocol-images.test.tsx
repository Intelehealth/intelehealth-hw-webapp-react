/**
 * Removing a protocol, end to end through the real StartVisit.
 *
 * start-visit.component.test.tsx mocks both Physical Exam and the image discard,
 * and the hook-level tests re-create StartVisit's wiring by hand. This file uses
 * the REAL StartVisit.handleProtocolCleared, the real physical-exam-images
 * service, the real temp-storage service, pending queue and camera hook, and
 * the real Physical Exam option / thumbnail components (over a fake temp-storage
 * backend), so it proves the actual ordering: the discard starts, Physical Exam
 * remounts with fresh state, and what it then shows and stores is only what was
 * captured for the new protocol.
 *
 * Only the parts that need a browser or a large fixture are stubbed: the
 * gallery/camera modal, Vitals, Medical History, the Visit Reason questionnaire
 * (a single "Remove protocol" button standing in for the chip / reset flow) and
 * the Physical Exam questionnaire, replaced by two real camera questions: one
 * shared "General Exams" question and one only the first protocol shows.
 */
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BreadcrumbProvider } from '../../../../../context/BreadcrumbContext';
import { StartVisit } from '../../../../../modules/ayu/components/start-visit/start-visit.component';
import {
  clearPendingImages,
  getPendingImages,
} from '../../../../../modules/ayu/services/obs.service';
import {
  getCommittedQuestionIds,
  getDeletedAssetIds,
} from '../../../../../modules/ayu/services/temp-storage.service';
import { MindmapPortalApi } from '../../../../../services/mindmap';
import { fakeTempStorage as server } from '../../../../mocks/fake-temp-storage';

/* ── Context: a stable stand-in for the start-visit provider ─────────────── */

const mockSaveSectionToTemp = vi.fn().mockResolvedValue(undefined);
const mockSetPhysExamPendingImages = vi.fn();
const mockClearPhysicalExamData = vi.fn();
const mockClearMedicalHistoryData = vi.fn();

const startVisitContext = {
  data: {
    vitals: null,
    visitReason: null,
    physicalExam: null,
    medicalHistory: null,
    medicalHistoryAnswers: null,
  },
  patientUuid: null,
  visitId: 'visit-1',
  tempRecordId: null,
  isRestoring: false,
  restoredSectionIndex: null,
  lastSectionIndex: 0,
  setLastSectionIndex: vi.fn(),
  setPatientUuid: vi.fn(),
  setVitalsData: vi.fn(),
  setVisitReasonData: vi.fn(),
  setPhysicalExamData: vi.fn(),
  setMedicalHistoryData: vi.fn(),
  setMedicalHistoryAnswers: vi.fn(),
  clearPhysicalExamData: mockClearPhysicalExamData,
  clearMedicalHistoryData: mockClearMedicalHistoryData,
  saveSectionToTemp: mockSaveSectionToTemp,
  clearVisitId: vi.fn(),
  physExamPendingImages: [],
  setPhysExamPendingImages: mockSetPhysExamPendingImages,
};

vi.mock('../../../../../modules/ayu/context/start-visit.context', () => ({
  useStartVisitData: () => startVisitContext,
}));

vi.mock('../../../../../utils/storage', () => ({
  storage: {
    get: () => null,
    set: vi.fn(),
    remove: vi.fn(),
    getUser: () => null,
  },
}));

vi.mock('../../../../../modules/ayu/hooks/useVisitReasons.hook', () => ({
  useVisitReasons: () => ({
    search: '',
    setSearch: vi.fn(),
    filteredNames: [],
    selectedReasons: [],
    addReason: vi.fn(),
    removeReason: vi.fn(),
    grouped: {},
    selectedComplaints: [],
    ayuConfigFiles: [],
  }),
}));

vi.mock('../../../../../modules/ayu/assets/icon-start-visit.svg', () => ({
  default: 'icon-start-visit.svg',
}));

/* ── Stubs for the parts that are not under test ─────────────────────────── */

vi.mock('../../../../../modules/ayu/components/loaders/section-completion-loader.component', () => ({
  SectionCompletionLoader: () => null,
}));
vi.mock('../../../../../modules/ayu/components/loaders/side-loader.component', () => ({
  SideLoader: () => null,
}));
vi.mock('../../../../../modules/ayu/components/start-visit/vitals/vitals.component', () => ({
  Vitals: ({ onNextQuestion }: { onNextQuestion: () => void }) => (
    <button onClick={onNextQuestion}>Next Vitals</button>
  ),
}));
vi.mock('../../../../../modules/ayu/components/start-visit/medical-history/medical-history.component', () => ({
  MedicalHistory: () => null,
}));
vi.mock('../../../../../modules/ayu/components/start-visit/visit-reason/visit-reason.component', () => ({
  VisitReason: ({
    onNextQuestion,
    onProtocolCleared,
  }: {
    onNextQuestion: () => void;
    onProtocolCleared?: () => void;
  }) => (
    <div>
      <button onClick={onNextQuestion}>Continue to Physical Exam</button>
      <button onClick={() => onProtocolCleared?.()}>Remove protocol</button>
    </div>
  ),
}));

/**
 * Physical Exam: the real camera provider and option components over two
 * questions, without the questionnaire/stepper machinery around them.
 */
vi.mock('../../../../../modules/ayu/components/start-visit/physical-examination/physical-examination.component', async () => {
  const { useState } = await import('react');
  const { useStartVisitData } = await import(
    '../../../../../modules/ayu/context/start-visit.context'
  );
  const { PhysicalExamCameraProvider } = await import(
    '../../../../../modules/ayu/components/start-visit/physical-examination/physical-exam-camera-context'
  );
  const { AyuPhysicalExamOptions } = await import(
    '../../../../../modules/ayu/components/common/ayu-physical-exam-options.component'
  );
  const { makeCameraQuestion } = await import(
    '../../../../mocks/pe-camera-question'
  );
  const questions = [
    makeCameraQuestion('q-general'),
    makeCameraQuestion('q-a-only'),
  ];
  return {
    PhysicalExamination: ({ onPrevSection }: { onPrevSection?: () => void }) => {
      const { visitId } = useStartVisitData();
      const [answers, setAnswers] = useState<Record<string, unknown>>({});
      return (
        <PhysicalExamCameraProvider
          visitId={visitId}
          sectionCommentFor={(questionId: string) => `Section ${questionId}`}
        >
          <button onClick={onPrevSection}>Back to Visit Reason</button>
          {questions.map(question => (
            <div
              key={question.linkId}
              data-testid={`question-${question.linkId}`}
            >
              <AyuPhysicalExamOptions
                question={question}
                value={answers[question.linkId] as never}
                setAnswer={(q, value) =>
                  setAnswers(prev => ({ ...prev, [q.linkId]: value }))
                }
              />
            </div>
          ))}
        </PhysicalExamCameraProvider>
      );
    },
  };
});

/** Files the stubbed gallery/camera modal hands over, in order. */
const offeredPictures: File[] = [];

vi.mock('../../../../../components/common/photo-upload-modal.component', () => ({
  default: ({
    isOpen,
    onUploadPhoto,
  }: {
    isOpen: boolean;
    onUploadPhoto: (file: File) => void;
  }) =>
    isOpen ? (
      <button
        data-testid="modal-upload"
        onClick={() => onUploadPhoto(offeredPictures.shift()!)}
      >
        pick
      </button>
    ) : null,
}));

/* ── Fake backend ────────────────────────────────────────────────────────── */

vi.mock('../../../../../services/mindmap', async () => {
  const { fakeTempStorage } = await import('../../../../mocks/fake-temp-storage');
  return { MindmapPortalApi: fakeTempStorage.api };
});
vi.mock('../../../../../services/openmrs', () => ({
  OpenMRSApi: { get: vi.fn(), post: vi.fn() },
}));

/* ── Helpers ─────────────────────────────────────────────────────────────── */

let previewCounter = 0;

beforeEach(() => {
  server.reset();
  clearPendingImages();
  sessionStorage.clear();
  offeredPictures.length = 0;
  previewCounter = 0;
  mockSaveSectionToTemp.mockClear();
  mockSetPhysExamPendingImages.mockClear();
  mockClearPhysicalExamData.mockClear();
  mockClearMedicalHistoryData.mockClear();
  globalThis.URL.createObjectURL = vi.fn(
    (file: Blob) => `blob:${(file as File).name}#${++previewCounter}`
  );
  globalThis.URL.revokeObjectURL = vi.fn();
});

type User = ReturnType<typeof userEvent.setup>;

const settle = () =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });

const renderStartVisit = () =>
  render(
    <MemoryRouter>
      <BreadcrumbProvider>
        <StartVisit />
      </BreadcrumbProvider>
    </MemoryRouter>
  );

/** Vitals -> Visit Reason -> Physical Exam, the way the health worker moves. */
const goToPhysicalExam = async (user: User) => {
  const next = screen.queryByText('Next Vitals');
  if (next) await user.click(next);
  await user.click(screen.getByText('Continue to Physical Exam'));
};

const question = (linkId: string) =>
  within(screen.getByTestId(`question-${linkId}`));

const openPicturePanel = async (user: User, linkId: string) => {
  await user.click(
    question(linkId).getByRole('button', { name: /Take a Picture/ })
  );
};

const addPicture = async (user: User, linkId: string, name: string) => {
  offeredPictures.push(new File([name], name, { type: 'image/jpeg' }));
  await user.click(question(linkId).getByText('+'));
  await user.click(await screen.findByTestId('modal-upload'));
  await settle();
};

const nameOf = (url: string | null) =>
  (url ?? '')
    .replace(/^blob:/, '')
    .replace(/#\d+$/, '')
    .split('/')
    .pop();

const thumbnails = (linkId: string) =>
  question(linkId)
    .queryAllByAltText(/^capture-/)
    .map(img => nameOf(img.getAttribute('src')));

const queued = () => getPendingImages().map(img => img.file.name);
const stored = () => server.assets.map(asset => asset.name);

/** Protocol A: two pictures on the shared question, one on the A-only question. */
const captureForProtocolA = async (user: User) => {
  await goToPhysicalExam(user);
  await openPicturePanel(user, 'q-general');
  await openPicturePanel(user, 'q-a-only');
  await addPicture(user, 'q-general', 'a-general-1.jpg');
  await addPicture(user, 'q-general', 'a-general-2.jpg');
  await addPicture(user, 'q-a-only', 'a-only.jpg');
};

const removeProtocol = async (user: User) => {
  await user.click(screen.getByText('Back to Visit Reason'));
  await user.click(screen.getByText('Remove protocol'));
  await settle();
};

/* ── Tests ───────────────────────────────────────────────────────────────── */

describe('StartVisit: removing the selected protocol', () => {
  it('starts protocol B with no pictures, including on the question every protocol shares', async () => {
    const user = userEvent.setup();
    renderStartVisit();
    await captureForProtocolA(user);
    expect(thumbnails('q-general')).toEqual([
      'a-general-1.jpg',
      'a-general-2.jpg',
    ]);
    expect(stored()).toHaveLength(3);

    await removeProtocol(user);
    await goToPhysicalExam(user);
    await openPicturePanel(user, 'q-general');
    await openPicturePanel(user, 'q-a-only');

    expect(thumbnails('q-general')).toEqual([]);
    expect(thumbnails('q-a-only')).toEqual([]);
    expect(
      question('q-general').getByText(
        'Upload an image from gallery or take a picture'
      )
    ).toBeInTheDocument();
    // Nothing is left in the queue, storage or committed markers, and every
    // deleted picture is remembered as deleted (kept for a failed backend delete).
    expect(queued()).toEqual([]);
    expect(stored()).toEqual([]);
    expect(getCommittedQuestionIds().size).toBe(0);
    expect(getDeletedAssetIds().size).toBe(3);
  });

  it('also resets what the Visit Summary and the saved visit hold', async () => {
    const user = userEvent.setup();
    renderStartVisit();
    await captureForProtocolA(user);

    await removeProtocol(user);

    expect(mockSetPhysExamPendingImages).toHaveBeenCalledWith([]);
    expect(mockClearPhysicalExamData).toHaveBeenCalledTimes(1);
    expect(mockClearMedicalHistoryData).toHaveBeenCalledTimes(1);
    expect(mockSaveSectionToTemp).toHaveBeenCalledWith({
      physicalExam: null,
      medicalHistory: null,
      medicalHistoryAnswers: undefined,
    });
  });

  it("stores and shows only protocol B's picture afterwards", async () => {
    const user = userEvent.setup();
    renderStartVisit();
    await captureForProtocolA(user);

    await removeProtocol(user);
    await goToPhysicalExam(user);
    await openPicturePanel(user, 'q-general');
    await addPicture(user, 'q-general', 'b-general-1.jpg');

    expect(thumbnails('q-general')).toEqual(['b-general-1.jpg']);
    expect(queued()).toEqual(['b-general-1.jpg']);
    expect(stored()).toEqual(['b-general-1.jpg']);
    expect([...getCommittedQuestionIds()]).toEqual(['q-general']);
  });

  it("keeps A's pictures out of the fresh Physical Exam while their delete is still running", async () => {
    const user = userEvent.setup();
    renderStartVisit();
    await captureForProtocolA(user);
    let releaseDeletes: () => void = () => {};
    server.deleteGate = new Promise<void>(resolve => {
      releaseDeletes = resolve;
    });
    vi.mocked(MindmapPortalApi.get).mockClear();

    await removeProtocol(user);
    await goToPhysicalExam(user);
    await openPicturePanel(user, 'q-general');
    await settle();

    // The backend still holds A's pictures, but the fresh Physical Exam has not
    // read them back: the only listing so far is the discard's own.
    expect(stored()).toHaveLength(3);
    expect(vi.mocked(MindmapPortalApi.get)).toHaveBeenCalledTimes(1);
    expect(thumbnails('q-general')).toEqual([]);

    await act(async () => {
      releaseDeletes();
    });
    await settle();
    expect(stored()).toEqual([]);
    expect(thumbnails('q-general')).toEqual([]);

    server.deleteGate = undefined;
    await addPicture(user, 'q-general', 'b-general-1.jpg');
    expect(thumbnails('q-general')).toEqual(['b-general-1.jpg']);
    expect(stored()).toEqual(['b-general-1.jpg']);
  });

  it('does not let a picture that was still uploading survive the protocol change', async () => {
    const user = userEvent.setup();
    renderStartVisit();
    await goToPhysicalExam(user);
    await openPicturePanel(user, 'q-general');
    await addPicture(user, 'q-general', 'a-general-1.jpg');
    let releaseUpload: () => void = () => {};
    server.uploadGate = new Promise<void>(resolve => {
      releaseUpload = resolve;
    });
    await addPicture(user, 'q-general', 'a-late.jpg'); // upload held back

    await removeProtocol(user);
    server.uploadGate = undefined;
    await act(async () => {
      releaseUpload();
    });
    await settle();
    await settle();

    // The late upload finished after the protocol was gone: its asset is deleted.
    expect(stored()).toEqual([]);
    expect(queued()).toEqual([]);
    await goToPhysicalExam(user);
    await openPicturePanel(user, 'q-general');
    expect(thumbnails('q-general')).toEqual([]);
  });
});
