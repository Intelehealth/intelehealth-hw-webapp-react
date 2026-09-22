/**
 * Visit Summary and final upload when Physical Exam images change.
 *
 * Renders the real VisitSummaryPage and feeds it through the real Physical Exam
 * image hook, pending-image queue, temp-storage service and
 * physical-exam-images service (over an in-memory fake of the temp-storage
 * backend), so what is asserted is what a health worker would see and what is
 * really sent: which Physical Exam thumbnails the summary shows, and which
 * files "Upload Visit" posts to OpenMRS, after
 *
 *   - one image was deleted, and
 *   - protocol A was switched to protocol B or removed altogether.
 */
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BreadcrumbProvider } from '../../../../context/BreadcrumbContext';

/* ── Navigation / context / infrastructure mocks ─────────────────────────── */

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/ayu/visit-summary' }),
}));

/** Stands in for `physExamPendingImages` in the start-visit context. */
let summarySnapshot: Array<{ file: File; comment: string }> = [];

const fullData = {
  vitals: { formValues: {}, config: [] },
  visitReason: {
    answers: {},
    reasonNames: ['Cough'],
    details: [{ label: 'Duration', value: '3 days' }],
  },
  physicalExam: {
    answers: {},
    details: [{ label: 'General', value: 'Normal' }],
  },
  medicalHistory: { patHistSummary: [], famHistSummary: [] },
};

vi.mock('../../../../modules/ayu/context/start-visit.context', () => ({
  useStartVisitData: () => ({
    data: fullData,
    patientUuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    visitId: 'visit-1',
    tempRecordId: null,
    clearVisitId: vi.fn(),
    setLastSectionIndex: vi.fn(),
    markVisitUploaded: vi.fn(),
    physExamPendingImages: summarySnapshot,
    setPhysExamPendingImages: vi.fn(),
  }),
}));

vi.mock('../../../../context/ProfileContext', () => ({
  useProfileContext: () => ({
    hwProfile: { providerUuid: 'provider-uuid', display: 'Provider' },
    profile: null,
    isLoading: false,
  }),
}));

vi.mock('../../../../utils/storage', () => ({
  storage: {
    get: vi.fn(() => null),
    set: vi.fn(),
    remove: vi.fn(),
    getUser: vi.fn(() => null),
    getLocationUuid: () => 'location-uuid',
  },
}));

const mockShowToast = vi.fn();
vi.mock('../../../../services/toast', () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args),
}));

vi.mock('../../../../components/modal/confirmation.modal', () => ({
  ConfirmationModal: ({
    open,
    onConfirm,
  }: {
    open: boolean;
    onConfirm: () => void;
  }) =>
    open ? (
      <button data-testid="modal-confirm" onClick={onConfirm}>
        Confirm
      </button>
    ) : null,
}));

vi.mock('../../../../modules/visit-summary/visit-summary-collapsed.component', () => ({
  default: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div data-testid={`collapsed-${title}`}>{children}</div>
  ),
}));

const mockUploadVisit = vi.fn();
vi.mock('../../../../modules/ayu/services/visit-upload.service', () => ({
  buildVisitReasonHtml: vi.fn(),
  buildPhysicalExamData: vi.fn(),
  buildMedicalHistoryData: vi.fn(),
  buildFamilyHistoryData: vi.fn(),
  buildVisitUploadPayload: vi.fn(),
  uploadVisit: (...args: unknown[]) => mockUploadVisit(...args),
}));

vi.mock('../../../../modules/patient/add/add-patient.service', () => ({
  patientService: { getPatient: vi.fn().mockResolvedValue({}) },
}));

vi.mock('../../../../services/concept.service', () => ({
  fetchConceptAnswers: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../../hooks/useConfig', () => ({
  useConfig: () => ({
    config: { specialization: [{ name: 'General Physician' }] },
  }),
}));

vi.mock('../../../../modules/ayu/hooks/useAyuJson.hook', () => ({
  useAyuJsonList: () => [{ name: 'physExam.json', json: {} }],
}));

vi.mock(
  '../../../../modules/ayu/utils/parseFhirPhysExamQuestionnaire',
  () => ({ parseFhirPhysExamQuestionnaire: () => [] })
);

vi.mock('../../../../assets/icons/icon-chevron-down.svg', () => ({
  default: 'icon-chevron-down.svg',
}));
vi.mock('../../../../assets/icons/icon-physical-examination.svg', () => ({
  default: 'icon-physical-examination.svg',
}));
vi.mock('../../../../assets/icons/icon-visit-summery.svg', () => ({
  default: 'icon-visit-summery.svg',
}));
vi.mock('../../../../assets/icons/visit-reason.svg', () => ({
  default: 'visit-reason.svg',
}));
vi.mock('../../../../assets/icons/vitals.svg', () => ({
  default: 'vitals.svg',
}));
vi.mock('../../../../assets/icons/icon-info.svg', () => ({
  default: 'icon-info.svg',
}));
vi.mock(
  '../../../../assets/icons/icon-medical-history-green-rounded-bordered.svg',
  () => ({ default: 'icon-medical-history.svg' })
);

/* ── Fake temp-storage backend + OpenMRS ─────────────────────────────────── */

vi.mock('../../../../services/mindmap', async () => {
  const { fakeTempStorage } = await import('../../../mocks/fake-temp-storage');
  return { MindmapPortalApi: fakeTempStorage.api };
});
vi.mock('../../../../services/openmrs', () => ({
  OpenMRSApi: { get: vi.fn(), post: vi.fn() },
}));

/* ── Imports that must see the mocks above ───────────────────────────────── */

const { default: VisitSummaryPage } = await import(
  '../../../../modules/ayu/pages/visit-summary.page'
);
const { usePhysicalExamCameraImages } = await import(
  '../../../../modules/ayu/hooks/usePhysicalExamCameraImages'
);
const { MindmapPortalApi } = await import('../../../../services/mindmap');
const { OpenMRSApi } = await import('../../../../services/openmrs');
const { clearPendingImages, getPendingImages } = await import(
  '../../../../modules/ayu/services/obs.service'
);
const { clearPhysicalExamImages } = await import(
  '../../../../modules/ayu/services/physical-exam-images.service'
);
const { fakeTempStorage: server } = await import(
  '../../../mocks/fake-temp-storage'
);

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const VISIT = 'visit-1';
const ADULT_INITIAL_UUID = '8d5b27bc-c2cc-11de-8d13-0010c6dffd0f';
let previewCounter = 0;

beforeEach(() => {
  server.reset();
  summarySnapshot = [];
  clearPendingImages();
  sessionStorage.clear();
  previewCounter = 0;
  mockShowToast.mockClear();
  globalThis.URL.createObjectURL = vi.fn(
    (file: Blob) => `blob:${(file as File).name}#${++previewCounter}`
  );
  globalThis.URL.revokeObjectURL = vi.fn();
  mockUploadVisit.mockReset().mockResolvedValue({
    encounters: [
      { uuid: 'enc-1', encounterType: { uuid: ADULT_INITIAL_UUID } },
    ],
  });
  vi.mocked(OpenMRSApi.post).mockReset().mockResolvedValue({});
  vi.mocked(OpenMRSApi.get)
    .mockReset()
    .mockResolvedValue({ results: [{ uuid: 'visit-uuid' }] });
});

const mountPhysicalExam = () =>
  renderHook(() =>
    usePhysicalExamCameraImages({
      visitId: VISIT,
      sectionCommentFor: (questionId: string) => `Section ${questionId}`,
    })
  );
type PhysicalExam = ReturnType<typeof mountPhysicalExam>;

/** Same sequence as AyuPhysicalExamOptions.handleImageAdded: add, then commit. */
const addLikeUi = async (
  physicalExam: PhysicalExam,
  questionId: string,
  name: string
) => {
  await act(async () => {
    const uploading = physicalExam.result.current.addCameraImage(
      questionId,
      new File([name], name, { type: 'image/jpeg' })
    );
    physicalExam.result.current.commitQuestionImages(questionId);
    await uploading;
  });
};

const removeImage = (
  physicalExam: PhysicalExam,
  questionId: string,
  index: number
) =>
  act(async () => {
    await physicalExam.result.current.removeCameraImage(questionId, index);
  });

/** PhysicalExamination.onConfirm hands the Visit Summary a copy of the queue. */
const confirmPhysicalExam = () => {
  summarySnapshot = [...getPendingImages()];
};

/** StartVisit.handleProtocolCleared for images, then Physical Exam remounts. */
const removeProtocol = async (physicalExam: PhysicalExam) => {
  summarySnapshot = [];
  const discarded = clearPhysicalExamImages(VISIT);
  physicalExam.unmount();
  const fresh = mountPhysicalExam();
  await act(async () => {
    await discarded;
  });
  return fresh;
};

const settle = () =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });

const renderSummary = async () => {
  render(
    <BreadcrumbProvider>
      <VisitSummaryPage />
    </BreadcrumbProvider>
  );
  await settle();
};

const nameOf = (url: string | null) =>
  (url ?? '')
    .replace(/^blob:/, '')
    .replace(/#\d+$/, '')
    .split('/')
    .pop();

/** File names behind the Physical Exam thumbnails the summary renders. */
const thumbnails = () =>
  screen
    .queryAllByRole('img')
    .filter(img => (img.getAttribute('alt') ?? '').startsWith('Section '))
    .map(img => nameOf(img.getAttribute('src')));

/** Presses "Upload Visit" and waits for the success toast. */
const uploadVisit = async () => {
  fireEvent.click(screen.getByRole('button', { name: /select doctor's specialty/i }));
  fireEvent.click(screen.getByText('General Physician'));
  fireEvent.click(screen.getByText('Upload Visit'));
  fireEvent.click(screen.getByTestId('modal-confirm'));
  await waitFor(() =>
    expect(mockShowToast).toHaveBeenCalledWith(
      'Success',
      'Visit uploaded successfully',
      'success'
    )
  );
};

/** File names the visit upload posted to OpenMRS as Physical Exam obs. */
const uploadedToOpenMrs = () =>
  vi
    .mocked(OpenMRSApi.post)
    .mock.calls.filter(call => call[0] === '/obs')
    .map(call => ((call[1] as FormData).get('file') as File).name);

const captureForProtocolA = async () => {
  const physicalExam = mountPhysicalExam();
  await addLikeUi(physicalExam, 'q-general', 'a-general-1.jpg');
  await addLikeUi(physicalExam, 'q-general', 'a-general-2.jpg');
  await addLikeUi(physicalExam, 'q-a-only', 'a-only.jpg');
  confirmPhysicalExam();
  return physicalExam;
};

/* ── Deleting one image ──────────────────────────────────────────────────── */

describe('Visit Summary after one Physical Exam image was deleted', () => {
  const captureThree = async () => {
    const physicalExam = mountPhysicalExam();
    await addLikeUi(physicalExam, 'q-general', 'photo-1.jpg');
    await addLikeUi(physicalExam, 'q-general', 'photo-2.jpg');
    await addLikeUi(physicalExam, 'q-general', 'photo-3.jpg');
    confirmPhysicalExam();
    return physicalExam;
  };

  it('lists all the captured images before anything is deleted', async () => {
    await captureThree();

    await renderSummary();

    expect(thumbnails()).toEqual(['photo-1.jpg', 'photo-2.jpg', 'photo-3.jpg']);
  });

  it('shows every remaining image after one is deleted and the section is saved again', async () => {
    const physicalExam = await captureThree();

    await removeImage(physicalExam, 'q-general', 1);
    confirmPhysicalExam();
    await renderSummary();

    expect(thumbnails()).toEqual(['photo-1.jpg', 'photo-3.jpg']);
  });

  it('still shows every remaining image when the summary is reopened after a refresh', async () => {
    const physicalExam = await captureThree();
    await removeImage(physicalExam, 'q-general', 1);
    physicalExam.unmount();

    // Refresh: queue and context snapshot are gone; only temp storage is left.
    clearPendingImages();
    summarySnapshot = [];
    await renderSummary();

    await waitFor(() =>
      expect(thumbnails()).toEqual(['photo-1.jpg', 'photo-3.jpg'])
    );
  });

  it('uploads exactly the remaining images when the visit is submitted', async () => {
    const physicalExam = await captureThree();
    await removeImage(physicalExam, 'q-general', 1);
    confirmPhysicalExam();
    await renderSummary();

    await uploadVisit();

    expect(uploadedToOpenMrs()).toEqual(['photo-1.jpg', 'photo-3.jpg']);
  });

  it('uploads nothing when the only image was deleted', async () => {
    const physicalExam = mountPhysicalExam();
    await addLikeUi(physicalExam, 'q-general', 'photo-1.jpg');
    await removeImage(physicalExam, 'q-general', 0);
    confirmPhysicalExam();
    await renderSummary();

    expect(thumbnails()).toEqual([]);
    await uploadVisit();

    expect(uploadedToOpenMrs()).toEqual([]);
  });
});

/* ── Changing the protocol ───────────────────────────────────────────────── */

describe('Visit Summary Physical Exam images across a protocol change', () => {
  it('lists the protocol A images while protocol A is selected', async () => {
    await captureForProtocolA();

    await renderSummary();

    expect(thumbnails()).toEqual([
      'a-general-1.jpg',
      'a-general-2.jpg',
      'a-only.jpg',
    ]);
  });

  it('shows only protocol B images once A was switched to B and B uploaded new ones', async () => {
    const physicalExamA = await captureForProtocolA();

    const physicalExamB = await removeProtocol(physicalExamA);
    await addLikeUi(physicalExamB, 'q-general', 'b-general-1.jpg');
    await addLikeUi(physicalExamB, 'q-b-only', 'b-only.jpg');
    confirmPhysicalExam();
    await renderSummary();

    expect(thumbnails()).toEqual(['b-general-1.jpg', 'b-only.jpg']);
  });

  it('shows no protocol A image when the protocol was removed and nothing new was uploaded', async () => {
    const physicalExamA = await captureForProtocolA();

    const physicalExamB = await removeProtocol(physicalExamA);
    confirmPhysicalExam();
    await renderSummary();

    expect(thumbnails()).toEqual([]);
    expect(physicalExamB.result.current.cameraImagesFor('q-general')).toEqual(
      []
    );
  });

  it('does not bring protocol A images back when the summary is reopened after a refresh', async () => {
    const physicalExamA = await captureForProtocolA();
    const physicalExamB = await removeProtocol(physicalExamA);
    physicalExamB.unmount();

    // Refresh: the module-level queue and the context snapshot are gone, so
    // the summary can only fall back to what temp storage still holds.
    clearPendingImages();
    summarySnapshot = [];
    await renderSummary();

    await waitFor(() =>
      expect(vi.mocked(MindmapPortalApi.get)).toHaveBeenCalled()
    );
    await settle();
    expect(thumbnails()).toEqual([]);
  });

  it('does not mix protocol A images into the summary when B uploads on a shared question and the visit is reopened', async () => {
    const physicalExamA = await captureForProtocolA();

    // B re-commits the shared General Exams question with one new picture.
    const physicalExamB = await removeProtocol(physicalExamA);
    await addLikeUi(physicalExamB, 'q-general', 'b-general-1.jpg');
    physicalExamB.unmount();

    // Reopened: nothing queued, so the summary reads the committed questions'
    // stored images. A's pictures on `q-general` must not be among them.
    clearPendingImages();
    summarySnapshot = [];
    await renderSummary();

    await waitFor(() => expect(thumbnails()).toEqual(['b-general-1.jpg']));
  });

  it('control: without the discard, a refreshed summary would still list protocol A images', async () => {
    const physicalExamA = await captureForProtocolA();
    physicalExamA.unmount();

    // Same refresh, but the protocol was never removed / images never discarded.
    clearPendingImages();
    summarySnapshot = [];
    await renderSummary();

    await waitFor(() =>
      expect(thumbnails()).toEqual([
        'a-general-1.jpg',
        'a-general-2.jpg',
        'a-only.jpg',
      ])
    );
  });

  it('uploads only protocol B images after A was switched to B', async () => {
    const physicalExamA = await captureForProtocolA();

    const physicalExamB = await removeProtocol(physicalExamA);
    await addLikeUi(physicalExamB, 'q-general', 'b-general-1.jpg');
    await addLikeUi(physicalExamB, 'q-b-only', 'b-only.jpg');
    confirmPhysicalExam();
    await renderSummary();

    await uploadVisit();

    expect(uploadedToOpenMrs()).toEqual(['b-general-1.jpg', 'b-only.jpg']);
  });

  it('uploads no Physical Exam image when the protocol was removed and nothing new was captured', async () => {
    const physicalExamA = await captureForProtocolA();

    await removeProtocol(physicalExamA);
    confirmPhysicalExam();
    await renderSummary();

    await uploadVisit();

    expect(uploadedToOpenMrs()).toEqual([]);
  });
});
