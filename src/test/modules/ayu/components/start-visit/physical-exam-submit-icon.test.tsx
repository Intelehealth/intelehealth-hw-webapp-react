/**
 * Regression: the Submit button's right-side completion/check icon for a
 * Physical Exam "Uploaded Images" question must disappear as soon as one of
 * its images is deleted, and only come back once the user submits the
 * updated selection again — exactly like selecting, deselecting, uploading
 * or capturing an image already does.
 *
 *   thumbnail "✕" (PhysicalExamImageCapture) -> AyuPhysicalExamOptions
 *     (handleImageRemoved) -> setAnswer -> AyuStepperContainer
 *     (handleSetAnswer) -> submittedQuestions -> Submit button's rightIcon
 *
 * This renders the real AyuStepperContainer, the real AyuRenderer /
 * componentMap resolution, the real AyuPhysicalExamOptions and the real
 * usePhysicalExamCameraImages hook (over an in-memory fake temp-storage
 * backend), so a checkmark left stale anywhere along that chain fails here.
 * Only the photo-picker modal (needs a real camera/file input) and
 * QuestionLoader's cosmetic ~800ms "loading" placeholder are stubbed.
 */
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  AyuAnswerValue,
  AyuQuestion,
} from '../../../../../modules/ayu-library/types/ayu.types';
import { PhysicalExamCameraProvider } from '../../../../../modules/ayu/components/start-visit/physical-examination/physical-exam-camera-context';
import { AyuStepperContainer } from '../../../../../modules/ayu/components/start-visit/visit-reason/ayu-stepper-container.component';
import { clearPendingImages } from '../../../../../modules/ayu/services/obs.service';
import { fakeTempStorage as server } from '../../../../mocks/fake-temp-storage';
import { makeCameraQuestion } from '../../../../mocks/pe-camera-question';

vi.mock('../../../../../services/mindmap', async () => {
  const { fakeTempStorage } = await import('../../../../mocks/fake-temp-storage');
  return { MindmapPortalApi: fakeTempStorage.api };
});
vi.mock('../../../../../services/openmrs', () => ({
  OpenMRSApi: { get: vi.fn(), post: vi.fn() },
}));
vi.mock('../../../../../utils/storage', () => ({
  storage: { getUser: () => null },
}));
vi.mock('../../../../../services/toast', () => ({ showToast: vi.fn() }));
vi.mock('../../../../../components/modal/global-modal-context', () => ({
  useGlobalModal: () => ({
    showConfirmModal: vi.fn(),
    showVitalConfirmationModal: vi.fn(),
    closeModal: vi.fn(),
  }),
}));

/*
 * QuestionLoader's own ~800ms "loading dots" timer is cosmetic and unrelated
 * to this bug; bypassing it keeps the test deterministic. isAnswered/onEdit
 * are forwarded exactly as the real component gates them, so "Edit answer"
 * only appears where it really would.
 */
vi.mock(
  '../../../../../modules/ayu/components/loaders/question-loader.component',
  () => ({
    QuestionLoader: ({
      children,
      isAnswered,
      onEdit,
    }: {
      children: React.ReactNode;
      isAnswered?: boolean;
      onEdit?: () => void;
    }) => (
      <div>
        {isAnswered && onEdit && (
          <button aria-label="Edit answer" onClick={onEdit}>
            Edit
          </button>
        )}
        {children}
      </div>
    ),
  })
);

/** Files the stubbed gallery/camera modal hands over, in order. */
const offeredPictures: File[] = [];
vi.mock(
  '../../../../../components/common/photo-upload-modal.component',
  () => ({
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
  })
);

const VISIT = 'visit-1';
let previewCounter = 0;

beforeEach(() => {
  server.reset();
  clearPendingImages();
  sessionStorage.clear();
  offeredPictures.length = 0;
  previewCounter = 0;
  globalThis.URL.createObjectURL = vi.fn(
    (file: Blob) => `blob:${(file as File).name}#${++previewCounter}`
  );
  globalThis.URL.revokeObjectURL = vi.fn();
  // AyuStepperContainer scrolls the current question into view; jsdom has no layout engine.
  Element.prototype.scrollIntoView = vi.fn();
});

type User = ReturnType<typeof userEvent.setup>;

const settle = () =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });

/** Renders a PE stepper over one or more real questions, matching how
 *  PhysicalExamination mounts AyuStepperContainer (skipSummary, no
 *  visit-summary popup). showAll renders every question at once, the way
 *  revisiting an already-answered section does. */
const renderQuestions = (
  questions: AyuQuestion[],
  initialAnswers?: Record<string, AyuAnswerValue>
) => {
  const onComplete = vi.fn();
  render(
    <PhysicalExamCameraProvider
      visitId={VISIT}
      sectionCommentFor={() => 'General exams'}
    >
      <AyuStepperContainer
        questionnaire={{ item: questions } as never}
        skipSummary
        initialAnswers={initialAnswers}
        onComplete={onComplete}
      />
    </PhysicalExamCameraProvider>
  );
  return { onComplete };
};

const renderQuestion = (
  linkId = 'q1',
  initialAnswers?: Record<string, AyuAnswerValue>
) => renderQuestions([makeCameraQuestion(linkId)], initialAnswers);

/** Adds a picture the way a user does: "+" -> pick in the modal. */
const addPicture = async (user: User, name: string) => {
  offeredPictures.push(new File([name], name, { type: 'image/jpeg' }));
  await user.click(screen.getByText('+'));
  await user.click(await screen.findByTestId('modal-upload'));
  await settle();
};

const removeButtons = () => screen.getAllByText('✕');

const submitButton = () => screen.getByRole('button', { name: /^Submit/ });
const hasCheckIcon = () =>
  Boolean(submitButton().querySelector('img[alt="yes"]'));

/** Gets the question into edit mode after it has already been submitted,
 *  past QuestionLoader's isAnswered/onEdit gate. */
const reopenForEdit = async (user: User) => {
  await user.click(screen.getByRole('button', { name: 'Edit answer' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: /Take a Picture/ })).toBeInTheDocument()
  );
};

describe('Physical Exam Uploaded Images: Submit check icon after deletion', () => {
  it('shows the check icon once submitted, and removes it again as soon as one of several images is deleted', async () => {
    const user = userEvent.setup();
    renderQuestion();
    await user.click(screen.getByRole('button', { name: /Take a Picture/ }));
    await addPicture(user, 'a.jpg');
    await addPicture(user, 'b.jpg');

    await user.click(submitButton());
    await reopenForEdit(user);
    expect(hasCheckIcon()).toBe(true);

    await user.click(removeButtons()[0]);
    await settle();

    expect(hasCheckIcon()).toBe(false);
  });

  it('shows the check icon again once the updated selection is submitted', async () => {
    const user = userEvent.setup();
    renderQuestion();
    await user.click(screen.getByRole('button', { name: /Take a Picture/ }));
    await addPicture(user, 'a.jpg');
    await addPicture(user, 'b.jpg');
    await user.click(submitButton());
    await reopenForEdit(user);
    await user.click(removeButtons()[0]);
    await settle();
    expect(hasCheckIcon()).toBe(false);

    await user.click(submitButton());
    await reopenForEdit(user);

    expect(hasCheckIcon()).toBe(true);
  });

  it('keeps the check icon hidden while several images are deleted one after another', async () => {
    const user = userEvent.setup();
    renderQuestion();
    await user.click(screen.getByRole('button', { name: /Take a Picture/ }));
    await addPicture(user, 'a.jpg');
    await addPicture(user, 'b.jpg');
    await addPicture(user, 'c.jpg');
    await user.click(submitButton());
    await reopenForEdit(user);
    expect(hasCheckIcon()).toBe(true);

    await user.click(removeButtons()[0]);
    await settle();
    expect(hasCheckIcon()).toBe(false);

    await user.click(removeButtons()[0]);
    await settle();
    expect(hasCheckIcon()).toBe(false);

    // Still not submitted — only a fresh Submit click may bring it back.
    expect(screen.queryByText('✕')).toBeInTheDocument(); // one image left
    expect(removeButtons()).toHaveLength(1);
  });

  it('hides the check icon when the last remaining image is deleted, and blocks re-submit until a new one is added', async () => {
    const user = userEvent.setup();
    renderQuestion();
    await user.click(screen.getByRole('button', { name: /Take a Picture/ }));
    await addPicture(user, 'only.jpg');
    await user.click(submitButton());
    await reopenForEdit(user);
    expect(hasCheckIcon()).toBe(true);

    await user.click(removeButtons()[0]);
    await settle();
    expect(hasCheckIcon()).toBe(false);
    expect(
      screen.getByText('Please upload at least one image')
    ).toBeInTheDocument();

    // Submit is rejected while the camera option is committed with no images.
    await user.click(submitButton());
    expect(hasCheckIcon()).toBe(false);

    await addPicture(user, 'replacement.jpg');
    await user.click(submitButton());
    await reopenForEdit(user);
    expect(hasCheckIcon()).toBe(true);
  });

  it('hides the check icon again when a new image is captured after submitting', async () => {
    const user = userEvent.setup();
    renderQuestion();
    await user.click(screen.getByRole('button', { name: /Take a Picture/ }));
    await addPicture(user, 'a.jpg');
    await user.click(submitButton());
    await reopenForEdit(user);
    expect(hasCheckIcon()).toBe(true);

    await addPicture(user, 'b.jpg');

    expect(hasCheckIcon()).toBe(false);
  });

  it('restores the check icon on reopening an already-submitted question, and still clears it on delete', async () => {
    /* Simulates revisiting a visit whose Physical Exam section was already
       submitted (StartVisit remounts AyuStepperContainer with
       initialAnswers, entering review/showAll mode). */
    const user = userEvent.setup();
    renderQuestion('q1', { q1: ['cam'] });

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Edit answer' })
      ).toBeInTheDocument()
    );
    await reopenForEdit(user);
    // Restored from a previous session: no in-memory images to show, but the
    // question is still reported as already submitted.
    expect(hasCheckIcon()).toBe(true);

    await addPicture(user, 'new.jpg');
    expect(hasCheckIcon()).toBe(false);

    await user.click(submitButton());
    await reopenForEdit(user);
    expect(hasCheckIcon()).toBe(true);

    await user.click(removeButtons()[0]);
    await settle();
    expect(hasCheckIcon()).toBe(false);
  });

  /*
   * The ticket lists selecting, deselecting, uploading and capturing an
   * image alongside deleting one — all as the same class of "state change".
   * Uploading/capturing are covered above through the real handleImageAdded
   * path; these two cover select/deselect the same way, at the same
   * rendered-icon level, over the pre-existing (unmodified) handlers.
   */
  it('clears the check icon when a different option is selected after submitting', async () => {
    const user = userEvent.setup();
    renderQuestion();
    await user.click(screen.getByRole('button', { name: /Take a Picture/ }));
    await addPicture(user, 'a.jpg');
    await user.click(submitButton());
    await reopenForEdit(user);
    expect(hasCheckIcon()).toBe(true);

    await user.click(screen.getByRole('button', { name: /^No$/ }));

    expect(hasCheckIcon()).toBe(false);
  });

  it('clears the check icon when the camera tile itself is deselected after submitting', async () => {
    const user = userEvent.setup();
    renderQuestion();
    await user.click(screen.getByRole('button', { name: /Take a Picture/ }));
    await addPicture(user, 'a.jpg');
    await user.click(submitButton());
    await reopenForEdit(user);
    expect(hasCheckIcon()).toBe(true);

    // Second click on an already-selected camera tile deselects it.
    await user.click(screen.getByRole('button', { name: /Take a Picture/ }));

    expect(hasCheckIcon()).toBe(false);
  });

  it('clears the check icon for a multi-choice (repeats) question too', async () => {
    const user = userEvent.setup();
    renderQuestions([{ ...makeCameraQuestion('q1'), repeats: true }]);
    await user.click(screen.getByRole('button', { name: /Take a Picture/ }));
    await addPicture(user, 'a.jpg');
    await addPicture(user, 'b.jpg');
    await user.click(submitButton());
    await reopenForEdit(user);
    expect(hasCheckIcon()).toBe(true);

    await user.click(removeButtons()[0]);
    await settle();

    expect(hasCheckIcon()).toBe(false);
  });

  it("does not affect another question's check icon when one image is deleted", async () => {
    const user = userEvent.setup();
    renderQuestions([makeCameraQuestion('q1'), makeCameraQuestion('q2')]);
    const cameraTile = () =>
      screen.getAllByRole('button', { name: /Take a Picture/ })[0];
    const submitBtns = () =>
      screen.getAllByRole('button', { name: /^Submit/ });
    const editBtns = () =>
      screen.getAllByRole('button', { name: 'Edit answer' });
    const iconAt = (index: number) =>
      Boolean(submitBtns()[index].querySelector('img[alt="yes"]'));

    // q1: two images, submitted — auto-advances to q2 as the current question.
    await user.click(cameraTile());
    await addPicture(user, 'q1-a.jpg');
    await addPicture(user, 'q1-b.jpg');
    await user.click(submitBtns()[0]);
    await settle();

    // q2: one image, submitted.
    await user.click(cameraTile());
    await addPicture(user, 'q2-a.jpg');
    await user.click(submitBtns()[0]);
    await settle();

    // Reopen both for edit (q1's own edit button, then q2's — which becomes
    // index 0 again once q1 is no longer collapsed).
    await user.click(editBtns()[0]);
    await waitFor(() => expect(submitBtns()).toHaveLength(1));
    await user.click(editBtns()[0]);
    await waitFor(() => expect(submitBtns()).toHaveLength(2));
    expect(iconAt(0)).toBe(true);
    expect(iconAt(1)).toBe(true);

    // q1's thumbnails render first in document order.
    await user.click(screen.getAllByText('✕')[0]);
    await settle();

    expect(iconAt(0)).toBe(false);
    expect(iconAt(1)).toBe(true);
  });
});
