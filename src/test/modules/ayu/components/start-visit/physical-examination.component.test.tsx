import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PhysicalExamQuestion } from '../../../../../modules/ayu/data/physical-exam.data';

// ── Mock questions ──────────────────────────────────────────────────────────

const MOCK_QUESTIONS: PhysicalExamQuestion[] = [
  {
    id: 'q1',
    sectionLabel: 'General:',
    categoryLabel: 'Jaundice',
    questionText: 'Is there jaundice?',
    isRequired: true,
    isMultiChoice: false,
    sectionKey: 'General',
    jobAidType: 'image',
    jobAidFile: 'jaundice',
    options: [
      { id: 'q1-yes', text: 'Yes' },
      { id: 'q1-no', text: 'No' },
      { id: 'q1-cam', text: 'Take a picture', isCamera: true, isExclusiveOption: true },
    ],
  },
  {
    id: 'q2',
    sectionLabel: 'General:',
    categoryLabel: 'Pallor',
    questionText: 'Is there pallor?',
    isRequired: true,
    isMultiChoice: true,
    sectionKey: 'General',
    jobAidType: 'video',
    jobAidFile: 'pallor',
    options: [
      { id: 'q2-normal', text: 'Normal', excludeFromMulti: true },
      { id: 'q2-a', text: 'Option A' },
      { id: 'q2-cam', text: 'Take a picture', isCamera: true, isExclusiveOption: true },
    ],
  },
  {
    id: 'q3',
    sectionLabel: 'Head:',
    categoryLabel: 'Injury',
    questionText: 'Any injuries?',
    isRequired: false,
    isMultiChoice: false,
    sectionKey: 'Head',
    options: [
      { id: 'q3-yes', text: 'Yes' },
      { id: 'q3-other', text: 'Maybe' },
    ],
  },
];

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockHookReturn = {
  internalIndex: 0,
  visibleQuestions: MOCK_QUESTIONS,
  totalQuestions: 3,
  currentQuestion: MOCK_QUESTIONS[0],
  isLastQuestion: false,
  selectedOptionsFor: vi.fn().mockReturnValue([]),
  cameraImagesFor: vi.fn().mockReturnValue([]),
  addCameraImage: vi.fn(),
  removeCameraImage: vi.fn(),
  clearCameraImages: vi.fn(),
  selectAndAdvance: vi.fn(),
  toggleOption: vi.fn(),
  goNext: vi.fn(),
  goSkip: vi.fn(),
  goBack: vi.fn(),
};

vi.mock('../../../../../modules/ayu/hooks/usePhysicalExam', () => ({
  usePhysicalExam: () => mockHookReturn,
}));

vi.mock('../../../../../modules/ayu/components/loaders/question-loader.component', () => ({
  QuestionLoader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="question-loader">{children}</div>
  ),
}));

vi.mock('../../../../../modules/ayu/components/common/ayu-button.component', () => ({
  default: ({ children, onClick, ...rest }: any) => (
    <button onClick={onClick} {...rest}>{children}</button>
  ),
}));

vi.mock('../../../../../modules/ayu/components/common/ayu-selectable-option.component', () => ({
  AyuSelectableOption: ({ label, value, onClick, leftIcon, selected }: any) => (
    <button
      data-testid={`option-${value}`}
      data-selected={selected}
      onClick={onClick}
    >
      {leftIcon && <span data-testid={`icon-${value}`}>{leftIcon}</span>}
      {label}
    </button>
  ),
}));

vi.mock('../../../../../modules/ayu/components/start-visit/physical-exam-image-capture.component', () => ({
  PhysicalExamImageCapture: ({ onAdd, onRemove, onUpload, images }: any) => (
    <div data-testid="image-capture">
      <button data-testid="capture-add" onClick={() => onAdd(new File([''], 'test.jpg'))}>
        Add
      </button>
      <button data-testid="capture-remove" onClick={() => onRemove(0)}>Remove</button>
      <button data-testid="capture-upload" onClick={onUpload}>Upload</button>
      <span data-testid="capture-count">{images.length}</span>
    </div>
  ),
}));

vi.mock('../../../../../assets/icons/icon-camera.svg', () => ({
  default: 'camera-icon.svg',
}));

import { PhysicalExamination } from '../../../../../modules/ayu/components/start-visit/physical-examination.component';

// ── Helpers ─────────────────────────────────────────────────────────────────

const defaultProps = {
  questionIndex: 0,
  onNextQuestion: vi.fn(),
  onPrevQuestion: vi.fn(),
  onPrevSection: vi.fn(),
};

function resetHookReturn(overrides: Partial<typeof mockHookReturn> = {}) {
  Object.assign(mockHookReturn, {
    internalIndex: 0,
    visibleQuestions: MOCK_QUESTIONS,
    totalQuestions: 3,
    currentQuestion: MOCK_QUESTIONS[0],
    isLastQuestion: false,
    selectedOptionsFor: vi.fn().mockReturnValue([]),
    cameraImagesFor: vi.fn().mockReturnValue([]),
    addCameraImage: vi.fn(),
    removeCameraImage: vi.fn(),
    clearCameraImages: vi.fn(),
    uploadImages: vi.fn(),
    uploadingQuestions: new Set<string>(),
    selectAndAdvance: vi.fn(),
    toggleOption: vi.fn(),
    goNext: vi.fn(),
    goSkip: vi.fn(),
    goBack: vi.fn(),
    ...overrides,
  });
}

// Mock scrollIntoView (not implemented in jsdom)
Element.prototype.scrollIntoView = vi.fn();

// ── Tests ───────────────────────────────────────────────────────────────────

describe('PhysicalExamination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHookReturn();
  });

  // ── Rendering ──────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('should render the first question as active', () => {
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.getByText('Is there jaundice?')).toBeInTheDocument();
    });

    it('should render section and category labels', () => {
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.getByText('General:')).toBeInTheDocument();
      expect(screen.getByText('Jaundice')).toBeInTheDocument();
    });

    it('should show required asterisk for required questions', () => {
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render Back button', () => {
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('should render only visited questions (internalIndex+1)', () => {
      render(<PhysicalExamination {...defaultProps} />);
      // Only q1 (index 0) is visited
      expect(screen.getByText('Is there jaundice?')).toBeInTheDocument();
      expect(screen.queryByText('Is there pallor?')).not.toBeInTheDocument();
      expect(screen.queryByText('Any injuries?')).not.toBeInTheDocument();
    });

    it('should render multiple visited questions when internalIndex > 0', () => {
      resetHookReturn({ internalIndex: 1, currentQuestion: MOCK_QUESTIONS[1] });
      render(<PhysicalExamination {...defaultProps} />);
      // q1 and q2 are both visited
      expect(screen.getByText('Is there jaundice?')).toBeInTheDocument();
      expect(screen.getByText('Is there pallor?')).toBeInTheDocument();
    });

    it('should render QuestionLoader for each visited question', () => {
      resetHookReturn({ internalIndex: 1, currentQuestion: MOCK_QUESTIONS[1] });
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.getAllByTestId('question-loader')).toHaveLength(2);
    });
  });

  // ── Active vs inactive question cards ──────────────────────────────────

  describe('active vs inactive cards', () => {
    it('should show options only for the active question', () => {
      resetHookReturn({ internalIndex: 1, currentQuestion: MOCK_QUESTIONS[1] });
      render(<PhysicalExamination {...defaultProps} />);

      // q2 is active — should show "Select any" for multi-choice
      expect(screen.getByText('Select any')).toBeInTheDocument();
    });

    it('should show answered summary for inactive questions with selections', () => {
      const selFn = vi.fn((qId: string) => {
        if (qId === 'q1') return ['q1-yes'];
        return [];
      });
      resetHookReturn({
        internalIndex: 1,
        currentQuestion: MOCK_QUESTIONS[1],
        selectedOptionsFor: selFn,
      });
      render(<PhysicalExamination {...defaultProps} />);
      // q1 is inactive with selection — shows answered badge
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    it('should not show answered summary for inactive questions without selections', () => {
      resetHookReturn({
        internalIndex: 1,
        currentQuestion: MOCK_QUESTIONS[1],
        selectedOptionsFor: vi.fn().mockReturnValue([]),
      });
      render(<PhysicalExamination {...defaultProps} />);
      // q1 is inactive with no selections — no badge
      const q1Section = screen.getByText('Is there jaundice?').closest('div[data-testid="question-loader"]');
      const badges = q1Section?.querySelectorAll('.bg-emerald-500');
      expect(badges?.length ?? 0).toBe(0);
    });

    it('should show option id as fallback when option text not found', () => {
      const selFn = vi.fn((qId: string) => {
        if (qId === 'q1') return ['unknown-opt-id'];
        return [];
      });
      resetHookReturn({
        internalIndex: 1,
        currentQuestion: MOCK_QUESTIONS[1],
        selectedOptionsFor: selFn,
      });
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.getByText('unknown-opt-id')).toBeInTheDocument();
    });
  });

  // ── getOptionIcon ──────────────────────────────────────────────────────

  describe('getOptionIcon', () => {
    it('should render CheckIcon for "Yes" option', () => {
      render(<PhysicalExamination {...defaultProps} />);
      const yesIcon = screen.getByTestId('icon-q1-yes');
      // CheckIcon is an SVG with a specific path
      const svg = yesIcon.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.querySelector('path')?.getAttribute('d')).toContain('2 7l3.5');
    });

    it('should render XIcon for "No" option', () => {
      render(<PhysicalExamination {...defaultProps} />);
      const noIcon = screen.getByTestId('icon-q1-no');
      const svg = noIcon.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg?.querySelector('path')?.getAttribute('d')).toContain('2 2l10 10');
    });

    it('should not render icon for other option text', () => {
      resetHookReturn({ internalIndex: 2, currentQuestion: MOCK_QUESTIONS[2] });
      render(<PhysicalExamination {...defaultProps} />);
      // "Maybe" should have no icon
      expect(screen.queryByTestId('icon-q3-other')).not.toBeInTheDocument();
    });
  });

  // ── Job aid references ─────────────────────────────────────────────────

  describe('job aid references', () => {
    it('should show reference images for image jobAidType', () => {
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.getByText('References:')).toBeInTheDocument();
      // 3 placeholder boxes for images
      const imgPlaceholders = screen.getAllByText('img');
      expect(imgPlaceholders).toHaveLength(3);
    });

    it('should show video placeholder for video jobAidType', () => {
      resetHookReturn({ internalIndex: 1, currentQuestion: MOCK_QUESTIONS[1] });
      render(<PhysicalExamination {...defaultProps} />);
      const videoPlaceholders = screen.getAllByText('▶ video');
      expect(videoPlaceholders).toHaveLength(3);
    });

    it('should not show references when no jobAidFile', () => {
      resetHookReturn({ internalIndex: 2, currentQuestion: MOCK_QUESTIONS[2] });
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.queryByText('References:')).not.toBeInTheDocument();
    });
  });

  // ── Multi-choice vs single-choice label ────────────────────────────────

  describe('choice type label', () => {
    it('should show "Select any one" for single-choice questions', () => {
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.getByText('Select any one')).toBeInTheDocument();
    });

    it('should show "Select any" for multi-choice questions', () => {
      resetHookReturn({ internalIndex: 1, currentQuestion: MOCK_QUESTIONS[1] });
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.getByText('Select any')).toBeInTheDocument();
    });
  });

  // ── Skip button ────────────────────────────────────────────────────────

  describe('skip button', () => {
    it('should show Skip for non-required questions', () => {
      resetHookReturn({ internalIndex: 2, currentQuestion: MOCK_QUESTIONS[2] });
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.getByTestId('option-skip')).toBeInTheDocument();
    });

    it('should not show Skip for required questions', () => {
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.queryByTestId('option-skip')).not.toBeInTheDocument();
    });

    it('should call goSkip when Skip is clicked', async () => {
      const user = userEvent.setup();
      resetHookReturn({ internalIndex: 2, currentQuestion: MOCK_QUESTIONS[2] });
      render(<PhysicalExamination {...defaultProps} />);

      await user.click(screen.getByTestId('option-skip'));
      expect(mockHookReturn.goSkip).toHaveBeenCalledTimes(1);
    });
  });

  // ── Camera option ──────────────────────────────────────────────────────

  describe('camera option', () => {
    it('should render camera option button', () => {
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.getByTestId('option-q1-cam')).toBeInTheDocument();
    });

    it('should call toggleOption when camera clicked and not selected', async () => {
      const user = userEvent.setup();
      render(<PhysicalExamination {...defaultProps} />);

      await user.click(screen.getByTestId('option-q1-cam'));
      expect(mockHookReturn.toggleOption).toHaveBeenCalledWith('q1-cam');
    });

    it('should call clearCameraImages when camera clicked and already selected', async () => {
      const user = userEvent.setup();
      resetHookReturn({
        selectedOptionsFor: vi.fn((qId: string) =>
          qId === 'q1' ? ['q1-cam'] : []
        ),
      });
      render(<PhysicalExamination {...defaultProps} />);

      await user.click(screen.getByTestId('option-q1-cam'));
      expect(mockHookReturn.clearCameraImages).toHaveBeenCalledWith('q1');
    });

    it('should show PhysicalExamImageCapture when camera is selected', () => {
      resetHookReturn({
        selectedOptionsFor: vi.fn((qId: string) =>
          qId === 'q1' ? ['q1-cam'] : []
        ),
      });
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.getByTestId('image-capture')).toBeInTheDocument();
    });

    it('should not show PhysicalExamImageCapture when camera is not selected', () => {
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.queryByTestId('image-capture')).not.toBeInTheDocument();
    });
  });

  // ── Option interactions ────────────────────────────────────────────────

  describe('option interactions', () => {
    it('should call selectAndAdvance when regular option is clicked', async () => {
      const user = userEvent.setup();
      render(<PhysicalExamination {...defaultProps} />);

      await user.click(screen.getByTestId('option-q1-yes'));
      expect(mockHookReturn.selectAndAdvance).toHaveBeenCalledWith('q1-yes');
    });
  });

  // ── Back button ────────────────────────────────────────────────────────

  describe('back button', () => {
    it('should call goBack when clicked', async () => {
      const user = userEvent.setup();
      render(<PhysicalExamination {...defaultProps} />);

      await user.click(screen.getByText('Back'));
      expect(mockHookReturn.goBack).toHaveBeenCalledTimes(1);
    });
  });

  // ── Image capture callbacks ────────────────────────────────────────────

  describe('image capture callbacks', () => {
    beforeEach(() => {
      resetHookReturn({
        selectedOptionsFor: vi.fn((qId: string) =>
          qId === 'q1' ? ['q1-cam'] : []
        ),
        cameraImagesFor: vi.fn().mockReturnValue(['img1']),
      });
    });

    it('should call addCameraImage with question id', async () => {
      const user = userEvent.setup();
      render(<PhysicalExamination {...defaultProps} />);

      await user.click(screen.getByTestId('capture-add'));
      expect(mockHookReturn.addCameraImage).toHaveBeenCalledWith(
        'q1',
        expect.any(File)
      );
    });

    it('should call removeCameraImage with question id and index', async () => {
      const user = userEvent.setup();
      render(<PhysicalExamination {...defaultProps} />);

      await user.click(screen.getByTestId('capture-remove'));
      expect(mockHookReturn.removeCameraImage).toHaveBeenCalledWith('q1', 0);
    });

    it('should call goNext when upload clicked (images saved, upload deferred)', async () => {
      const user = userEvent.setup();
      render(<PhysicalExamination {...defaultProps} />);

      await user.click(screen.getByTestId('capture-upload'));
      expect(mockHookReturn.goNext).toHaveBeenCalled();
    });
  });

  // ── scrollIntoView ────────────────────────────────────────────────────

  describe('scrollIntoView', () => {
    it('should call scrollIntoView on the active question card', () => {
      render(<PhysicalExamination {...defaultProps} />);
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });
});
