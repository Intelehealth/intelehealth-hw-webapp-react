/**
 * Deleting a Physical Exam picture through the real UI chain:
 *
 *   thumbnail "✕" (PhysicalExamImageCapture) -> AyuPhysicalExamOptions
 *     -> PhysicalExamCameraProvider -> usePhysicalExamCameraImages
 *     -> pending queue / temp storage
 *
 * The other tests in this area either drive the hook directly or mock the
 * capture panel with a single button wired to index 0, so nothing else proves
 * that clicking the ✕ of a *specific* thumbnail removes exactly that picture.
 * Only the gallery/camera modal is stubbed (it needs a real camera/file input);
 * everything else, including the temp-storage service, is real.
 */
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AyuPhysicalExamOptions } from '../../../../../modules/ayu/components/common/ayu-physical-exam-options.component';
import { PhysicalExamCameraProvider } from '../../../../../modules/ayu/components/start-visit/physical-examination/physical-exam-camera-context';
import type {
  AyuAnswerValue,
  AyuQuestion,
} from '../../../../../modules/ayu-library/types/ayu.types';
import {
  clearPendingImages,
  getPendingImages,
} from '../../../../../modules/ayu/services/obs.service';
import { getCommittedQuestionIds } from '../../../../../modules/ayu/services/temp-storage.service';
import { MindmapPortalApi } from '../../../../../services/mindmap';
import { fakeTempStorage as server } from '../../../../mocks/fake-temp-storage';
import { makeCameraQuestion as makeQuestion } from '../../../../mocks/pe-camera-question';

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
});

/** The Physical Exam screen: one camera provider, a stateful answer per question. */
const PhysicalExamScreen = ({ questions }: { questions: AyuQuestion[] }) => {
  const [answers, setAnswers] = useState<Record<string, AyuAnswerValue>>({});
  return (
    <PhysicalExamCameraProvider
      visitId={VISIT}
      sectionCommentFor={(questionId: string) => `Section ${questionId}`}
    >
      {questions.map(question => (
        <div key={question.linkId} data-testid={`question-${question.linkId}`}>
          <AyuPhysicalExamOptions
            question={question}
            value={answers[question.linkId]}
            setAnswer={(q, value) =>
              setAnswers(prev => ({ ...prev, [q.linkId]: value }))
            }
          />
        </div>
      ))}
    </PhysicalExamCameraProvider>
  );
};

type User = ReturnType<typeof userEvent.setup>;

const settle = () =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });

const questionArea = (linkId: string) =>
  within(screen.getByTestId(`question-${linkId}`));

/** Opens the picture panel of a question (clicked once: a second click clears it). */
const openPicturePanel = async (user: User, linkId: string) => {
  await user.click(
    questionArea(linkId).getByRole('button', { name: /Take a Picture/ })
  );
};

/** Adds a picture the way a user does: "+" -> pick in the modal. */
const addPicture = async (user: User, linkId: string, name: string) => {
  offeredPictures.push(new File([name], name, { type: 'image/jpeg' }));
  await user.click(questionArea(linkId).getByText('+'));
  await user.click(await screen.findByTestId('modal-upload'));
  await settle();
};

const nameOf = (url: string | null) =>
  (url ?? '')
    .replace(/^blob:/, '')
    .replace(/#\d+$/, '')
    .split('/')
    .pop();

/** File names behind the thumbnails a question currently shows. */
const thumbnails = (linkId: string) =>
  questionArea(linkId)
    .queryAllByAltText(/^capture-/)
    .map(img => nameOf(img.getAttribute('src')));

const removeButtons = (linkId: string) => questionArea(linkId).getAllByText('✕');

const queued = () => getPendingImages().map(img => img.file.name);
const stored = () => server.assets.map(asset => asset.name);

describe('deleting a Physical Exam picture from the thumbnail list', () => {
  it('removes only the clicked thumbnail from the screen, the queue and storage', async () => {
    const user = userEvent.setup();
    render(<PhysicalExamScreen questions={[makeQuestion('q1')]} />);
    await openPicturePanel(user, 'q1');
    await addPicture(user, 'q1', 'camera-1.jpg');
    await addPicture(user, 'q1', 'upload-1.png');
    await addPicture(user, 'q1', 'camera-2.jpg');
    expect(thumbnails('q1')).toEqual([
      'camera-1.jpg',
      'upload-1.png',
      'camera-2.jpg',
    ]);

    await user.click(removeButtons('q1')[1]);
    await settle();

    const remaining = ['camera-1.jpg', 'camera-2.jpg'];
    expect(thumbnails('q1')).toEqual(remaining);
    expect(queued()).toEqual(remaining);
    expect(stored()).toEqual(remaining);
    expect(getCommittedQuestionIds().has('q1')).toBe(true);
  });

  it.each([0, 1, 2])(
    'deleting thumbnail #%i of 3 leaves the other two',
    async index => {
      const user = userEvent.setup();
      render(<PhysicalExamScreen questions={[makeQuestion('q1')]} />);
      await openPicturePanel(user, 'q1');
      const names = ['one.jpg', 'two.jpg', 'three.jpg'];
      for (const name of names) await addPicture(user, 'q1', name);

      await user.click(removeButtons('q1')[index]);
      await settle();

      const remaining = names.filter((_, i) => i !== index);
      expect(thumbnails('q1')).toEqual(remaining);
      expect(queued()).toEqual(remaining);
      expect(stored()).toEqual(remaining);
    }
  );

  it("leaves the other questions' thumbnails alone", async () => {
    const user = userEvent.setup();
    render(
      <PhysicalExamScreen questions={[makeQuestion('q1'), makeQuestion('q2')]} />
    );
    await openPicturePanel(user, 'q1');
    await openPicturePanel(user, 'q2');
    await addPicture(user, 'q1', 'q1-a.jpg');
    await addPicture(user, 'q1', 'q1-b.jpg');
    await addPicture(user, 'q2', 'q2-a.jpg');
    await addPicture(user, 'q2', 'q2-b.jpg');

    await user.click(removeButtons('q1')[0]);
    await settle();

    expect(thumbnails('q1')).toEqual(['q1-b.jpg']);
    expect(thumbnails('q2')).toEqual(['q2-a.jpg', 'q2-b.jpg']);
    expect(queued()).toEqual(['q1-b.jpg', 'q2-a.jpg', 'q2-b.jpg']);
    expect(stored()).toEqual(['q1-b.jpg', 'q2-a.jpg', 'q2-b.jpg']);
  });

  it('a picture added after a delete joins the remaining ones', async () => {
    const user = userEvent.setup();
    render(<PhysicalExamScreen questions={[makeQuestion('q1')]} />);
    await openPicturePanel(user, 'q1');
    await addPicture(user, 'q1', 'one.jpg');
    await addPicture(user, 'q1', 'two.jpg');
    await user.click(removeButtons('q1')[0]);
    await settle();

    await addPicture(user, 'q1', 'three.jpg');

    expect(thumbnails('q1')).toEqual(['two.jpg', 'three.jpg']);
    expect(queued()).toEqual(['two.jpg', 'three.jpg']);
    expect(stored()).toEqual(['two.jpg', 'three.jpg']);
  });

  it('deleting the last picture brings back the empty state and asks for an image again', async () => {
    const user = userEvent.setup();
    render(<PhysicalExamScreen questions={[makeQuestion('q1')]} />);
    await openPicturePanel(user, 'q1');
    await addPicture(user, 'q1', 'one.jpg');
    await addPicture(user, 'q1', 'two.jpg');

    await user.click(removeButtons('q1')[0]);
    await settle();
    expect(
      questionArea('q1').queryByText('Please upload at least one image')
    ).not.toBeInTheDocument();
    await user.click(removeButtons('q1')[0]);
    await settle();

    expect(thumbnails('q1')).toEqual([]);
    expect(
      questionArea('q1').getByText(
        'Upload an image from gallery or take a picture'
      )
    ).toBeInTheDocument();
    // The camera answer is still selected, so the missing image is flagged.
    expect(
      questionArea('q1').getByText('Please upload at least one image')
    ).toBeInTheDocument();
    expect(queued()).toEqual([]);
    expect(stored()).toEqual([]);
    expect(getCommittedQuestionIds().has('q1')).toBe(false);
  });

  it("cannot delete a picture that is still uploading, and can once it has finished", async () => {
    const user = userEvent.setup();
    render(<PhysicalExamScreen questions={[makeQuestion('q1')]} />);
    await openPicturePanel(user, 'q1');
    await addPicture(user, 'q1', 'one.jpg');
    let releaseUpload: () => void = () => {};
    server.uploadGate = new Promise<void>(resolve => {
      releaseUpload = resolve;
    });

    await addPicture(user, 'q1', 'two.jpg'); // upload of this one is held back

    expect(removeButtons('q1')[0]).toBeEnabled();
    expect(removeButtons('q1')[1]).toBeDisabled();
    expect(
      questionArea('q1').getByRole('status', { name: 'Uploading image' })
    ).toBeInTheDocument();

    server.uploadGate = undefined;
    await act(async () => {
      releaseUpload();
    });
    await settle();
    expect(removeButtons('q1')[1]).toBeEnabled();

    await user.click(removeButtons('q1')[1]);
    await settle();
    expect(thumbnails('q1')).toEqual(['one.jpg']);
    expect(stored()).toEqual(['one.jpg']);
  });

  it('deletes a picture whose upload failed without touching storage or the others', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<PhysicalExamScreen questions={[makeQuestion('q1')]} />);
    await openPicturePanel(user, 'q1');
    server.failUploads = 1;
    await addPicture(user, 'q1', 'broken.jpg');
    await addPicture(user, 'q1', 'fine.jpg');
    errorSpy.mockRestore();
    expect(
      questionArea('q1').getByRole('button', { name: 'Retry' })
    ).toBeInTheDocument();

    await user.click(removeButtons('q1')[0]);
    await settle();

    expect(thumbnails('q1')).toEqual(['fine.jpg']);
    expect(queued()).toEqual(['fine.jpg']);
    expect(stored()).toEqual(['fine.jpg']);
    expect(vi.mocked(MindmapPortalApi.delete)).not.toHaveBeenCalled();
  });

  it('a retried upload can be deleted afterwards without leaving anything behind', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    render(<PhysicalExamScreen questions={[makeQuestion('q1')]} />);
    await openPicturePanel(user, 'q1');
    server.failUploads = 1;
    await addPicture(user, 'q1', 'flaky.jpg');
    errorSpy.mockRestore();

    await user.click(questionArea('q1').getByRole('button', { name: 'Retry' }));
    await settle();
    expect(thumbnails('q1')).toEqual(['flaky.jpg']);
    expect(stored()).toEqual(['flaky.jpg']);

    await user.click(removeButtons('q1')[0]);
    await settle();

    expect(thumbnails('q1')).toEqual([]);
    expect(queued()).toEqual([]);
    expect(stored()).toEqual([]);
  });
});
