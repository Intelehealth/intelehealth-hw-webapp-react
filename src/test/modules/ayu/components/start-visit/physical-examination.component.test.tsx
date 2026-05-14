import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PhysicalExamQuestion } from '../../../../../modules/ayu/types/physical-exam.types';

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

const mockHookReturn = {
  internalIndex: 0,
  visibleQuestions: MOCK_QUESTIONS,
  totalQuestions: 3,
  currentQuestion: MOCK_QUESTIONS[0],
  isLastQuestion: false,
  answers: {} as Record<string, string[]>,
  selectedOptionsFor: vi.fn().mockReturnValue([]),
  cameraImagesFor: vi.fn().mockReturnValue([]),
  addCameraImage: vi.fn(),
  removeCameraImage: vi.fn(),
  clearCameraImages: vi.fn(),
  selectAndAdvance: vi.fn(),
  selectSingle: vi.fn(),
  toggleOption: vi.fn(),
  goNext: vi.fn(),
  goSkip: vi.fn(),
  goBack: vi.fn(),
  onPrevSection: vi.fn(),
  allRequiredAnswered: true,
};

let capturedHookProps: any = {};
vi.mock('../../../../../modules/ayu/hooks/usePhysicalExam', () => ({
  usePhysicalExam: (props: any) => { capturedHookProps = props; return mockHookReturn; },
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

vi.mock('../../../../../modules/ayu/components/start-visit/physical-examination/physical-exam-image-capture.component', () => ({
  PhysicalExamImageCapture: ({ onAdd, onRemove, images }: any) => (
    <div data-testid="image-capture">
      <button data-testid="capture-add" onClick={() => onAdd(new File([''], 'test.jpg'))}>
        Add
      </button>
      <button data-testid="capture-remove" onClick={() => onRemove(0)}>Remove</button>
      <span data-testid="capture-count">{images.length}</span>
    </div>
  ),
}));

vi.mock('../../../../../assets/icons/icon-camera.svg', () => ({
  default: 'camera-icon.svg',
}));

vi.mock('../../../../../assets/icons/icon-physical-examination.svg', () => ({
  default: 'physical-exam-icon.svg',
}));

vi.mock('../../../../../assets/icons/icon-right-arrow.svg', () => ({
  default: 'right-arrow-icon.svg',
}));

const mockShowVitalConfirmationModal = vi.fn();
vi.mock('../../../../../components/modal/global-modal-context', () => ({
  useGlobalModal: () => ({
    showConfirmModal: vi.fn(),
    showVitalConfirmationModal: mockShowVitalConfirmationModal,
    closeModal: vi.fn(),
  }),
}));

vi.mock('../../../../../modules/ayu/assets/yes.svg', () => ({
  default: 'yes-icon.svg',
}));

const mockSetPhysicalExamData = vi.fn();
const mockSaveSectionToTempPE = vi.fn().mockResolvedValue(undefined);
let mockContextData: { physicalExam: { answers: Record<string, string[]>; details: Array<{ label: string; value: string }> } | null } = { physicalExam: null };
vi.mock('../../../../../modules/ayu/context/start-visit.context', () => ({
  useStartVisitData: () => ({
    data: {
      vitals: null,
      visitReason: null,
      physicalExam: mockContextData.physicalExam,
      medicalHistory: null,
      medicalHistoryAnswers: null,
    },
    patientUuid: null,
    visitId: 'test-visit-id',
    tempRecordId: null,
    isRestoring: false,
    restoredSectionIndex: null,
    lastSectionIndex: 0,
    setLastSectionIndex: vi.fn(),
    setPatientUuid: vi.fn(),
    setVitalsData: vi.fn(),
    setVisitReasonData: vi.fn(),
    setPhysicalExamData: mockSetPhysicalExamData,
    setMedicalHistoryData: vi.fn(),
    setMedicalHistoryAnswers: vi.fn(),
    saveSectionToTemp: mockSaveSectionToTempPE,
    clearVisitId: vi.fn(),
  }),
}));

const mockGetJobAidUrl = vi.fn().mockReturnValue(undefined);

vi.mock('../../../../../modules/ayu/utils/physExamAssets', () => ({
  getJobAidUrl: (...args: unknown[]) => mockGetJobAidUrl(...args),
}));

import { PhysicalExamination } from '../../../../../modules/ayu/components/start-visit/physical-examination/physical-examination.component';

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
    answers: {},
    selectedOptionsFor: vi.fn().mockReturnValue([]),
    cameraImagesFor: vi.fn().mockReturnValue([]),
    addCameraImage: vi.fn(),
    removeCameraImage: vi.fn(),
    clearCameraImages: vi.fn(),
    selectAndAdvance: vi.fn(),
    selectSingle: vi.fn(),
    toggleOption: vi.fn(),
    goNext: vi.fn(),
    goSkip: vi.fn(),
    goBack: vi.fn(),
    onPrevSection: vi.fn(),
    ...overrides,
  });
}

Element.prototype.scrollIntoView = vi.fn();

describe('PhysicalExamination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetHookReturn();
    capturedHookProps = {};
    mockContextData = { physicalExam: null };
  });

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

      expect(screen.getByText('Is there jaundice?')).toBeInTheDocument();
      expect(screen.queryByText('Is there pallor?')).not.toBeInTheDocument();
      expect(screen.queryByText('Any injuries?')).not.toBeInTheDocument();
    });

    it('should render multiple visited questions when internalIndex > 0', () => {
      resetHookReturn({ internalIndex: 1, currentQuestion: MOCK_QUESTIONS[1] });
      render(<PhysicalExamination {...defaultProps} />);

      expect(screen.getByText('Is there jaundice?')).toBeInTheDocument();
      expect(screen.getByText('Is there pallor?')).toBeInTheDocument();
    });

    it('should render QuestionLoader for each visited question', () => {
      resetHookReturn({ internalIndex: 1, currentQuestion: MOCK_QUESTIONS[1] });
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.getAllByTestId('question-loader')).toHaveLength(2);
    });
  });

  describe('active vs inactive cards', () => {
    it('should show options only for the active question', () => {
      resetHookReturn({ internalIndex: 1, currentQuestion: MOCK_QUESTIONS[1] });
      render(<PhysicalExamination {...defaultProps} />);

      expect(screen.getByText('Select one or more')).toBeInTheDocument();
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

      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    it('should not show answered summary for inactive questions without selections', () => {
      resetHookReturn({
        internalIndex: 1,
        currentQuestion: MOCK_QUESTIONS[1],
        selectedOptionsFor: vi.fn().mockReturnValue([]),
      });
      render(<PhysicalExamination {...defaultProps} />);

      const q1Section = screen.getByText('Is there jaundice?').closest('div[data-testid="question-loader"]');
      const badges = q1Section?.querySelectorAll('.bg-emerald-500');
      expect(badges?.length ?? 0).toBe(0);
    });

    it('should not crash when selectedOptionsFor returns unknown option ids', () => {
      const selFn = vi.fn((qId: string) => {
        if (qId === 'q1') return ['unknown-opt-id'];
        return [];
      });
      resetHookReturn({
        internalIndex: 1,
        currentQuestion: MOCK_QUESTIONS[1],
        selectedOptionsFor: selFn,
      });

      expect(() => render(<PhysicalExamination {...defaultProps} />)).not.toThrow();
    });
  });

  describe('getOptionIcon', () => {
    it('should render CheckIcon for "Yes" option', () => {
      render(<PhysicalExamination {...defaultProps} />);
      const yesIcon = screen.getByTestId('icon-q1-yes');

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

      expect(screen.queryByTestId('icon-q3-other')).not.toBeInTheDocument();
    });
  });

  describe('job aid references', () => {
    it('should not show references when asset files are not available', () => {
      mockGetJobAidUrl.mockReturnValue(undefined);
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.queryByText('References:')).not.toBeInTheDocument();
    });

    it('should not show references when no jobAidFile', () => {
      resetHookReturn({ internalIndex: 2, currentQuestion: MOCK_QUESTIONS[2] });
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.queryByText('References:')).not.toBeInTheDocument();
    });

    it('should render image reference when jobAidType is image and asset exists', () => {
      mockGetJobAidUrl.mockReturnValue('/assets/jaundice.jpg');

      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.getByText('References:')).toBeInTheDocument();
      const img = screen.getByAltText('Jaundice');
      expect(img).toBeInTheDocument();
      expect(img.getAttribute('src')).toBe('/assets/jaundice.jpg');
    });

    it('should render video reference when jobAidType is video and asset exists', () => {
      mockGetJobAidUrl.mockReturnValue('/assets/pallor.mp4');

      const q2Only = [MOCK_QUESTIONS[1]];
      resetHookReturn({
        internalIndex: 0,
        visibleQuestions: q2Only,
        totalQuestions: 1,
        currentQuestion: MOCK_QUESTIONS[1],
      });
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.getByText('References:')).toBeInTheDocument();
      const video = document.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video?.getAttribute('src')).toBe('/assets/pallor.mp4');
    });
  });

  describe('choice type label', () => {
    it('should show "Select any one" for single-choice questions', () => {
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.getByText('Select any one')).toBeInTheDocument();
    });

    it('should show "Select any" for multi-choice questions', () => {
      resetHookReturn({ internalIndex: 1, currentQuestion: MOCK_QUESTIONS[1] });
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.getByText('Select one or more')).toBeInTheDocument();
    });
  });

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

  describe('camera option', () => {
    it('should render camera option button', () => {
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.getByTestId('option-q1-cam')).toBeInTheDocument();
    });

    it('should call toggleOption when camera clicked and not selected', async () => {
      const user = userEvent.setup();
      render(<PhysicalExamination {...defaultProps} />);

      await user.click(screen.getByTestId('option-q1-cam'));
      expect(mockHookReturn.toggleOption).toHaveBeenCalledWith('q1-cam', 'q1');
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

  describe('option interactions', () => {
    it('should call selectAndAdvance when regular option is clicked', async () => {
      const user = userEvent.setup();
      render(<PhysicalExamination {...defaultProps} />);

      await user.click(screen.getByTestId('option-q1-yes'));
      expect(mockHookReturn.selectAndAdvance).toHaveBeenCalledWith('q1-yes');
    });

    it('should call toggleOption when regular option clicked on previous question', async () => {
      const user = userEvent.setup();

      resetHookReturn({
        internalIndex: 1,
        currentQuestion: MOCK_QUESTIONS[1],
        selectedOptionsFor: vi.fn((qId: string) => {
          if (qId === 'q1') return ['q1-yes'];
          return [];
        }),
      });
      render(<PhysicalExamination {...defaultProps} />);

      await user.click(screen.getByTestId('option-q1-no'));
      expect(mockHookReturn.selectSingle).toHaveBeenCalledWith('q1-no', 'q1');
    });
  });

  describe('back button', () => {
    it('should call onPrevSection when clicked', async () => {
      const user = userEvent.setup();
      render(<PhysicalExamination {...defaultProps} />);

      await user.click(screen.getByText('Back'));
      expect(mockHookReturn.onPrevSection).toHaveBeenCalledTimes(1);
    });
  });

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

    it('should not show upload button in image capture (handled by Submit)', () => {
      render(<PhysicalExamination {...defaultProps} />);
      expect(screen.queryByTestId('capture-upload')).not.toBeInTheDocument();
    });
  });

  describe('multi-choice option click', () => {
    it('should call toggleOption when clicking a regular option on a multi-choice question (line 151)', async () => {
      const user = userEvent.setup();

      resetHookReturn({
        internalIndex: 1,
        currentQuestion: MOCK_QUESTIONS[1],
        visibleQuestions: MOCK_QUESTIONS,
      });
      render(<PhysicalExamination {...defaultProps} />);

      await user.click(screen.getByTestId('option-q2-a'));
      expect(mockHookReturn.toggleOption).toHaveBeenCalledWith('q2-a', 'q2');
    });
  });

  describe('Submit button (onUploadImages)', () => {
    it('should call goNext and track submitted answers when Submit is clicked (lines 269-272)', async () => {
      const user = userEvent.setup();
      resetHookReturn({
        internalIndex: 1,
        currentQuestion: MOCK_QUESTIONS[1],
        visibleQuestions: MOCK_QUESTIONS,
        selectedOptionsFor: vi.fn((qId: string) => qId === 'q2' ? ['q2-a'] : []),
        allRequiredAnswered: true,
      });
      render(<PhysicalExamination {...defaultProps} />);

      const submitBtn = screen.getByText('Submit');
      await user.click(submitBtn);

      expect(mockHookReturn.goNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('Upload button with tick icon', () => {
    it('should show Upload with image count and tick icon when camera images are uploaded and submitted', async () => {
      const user = userEvent.setup();
      resetHookReturn({
        internalIndex: 1,
        currentQuestion: MOCK_QUESTIONS[1],
        visibleQuestions: MOCK_QUESTIONS,
        selectedOptionsFor: vi.fn((qId: string) => qId === 'q2' ? ['q2-a', 'q2-cam'] : []),
        cameraImagesFor: vi.fn((qId: string) => qId === 'q2' ? ['img1.jpg', 'img2.jpg'] : []),
        allRequiredAnswered: true,
      });
      render(<PhysicalExamination {...defaultProps} />);

      const uploadBtn = screen.getByText('Upload (2)');
      expect(uploadBtn).toBeInTheDocument();

      await user.click(uploadBtn);

      const tickIcon = screen.getByAltText('yes');
      expect(tickIcon).toBeInTheDocument();
      expect(tickIcon).toHaveAttribute('src', 'yes-icon.svg');
    });
  });

  describe('scrollIntoView', () => {
    it('should call scrollIntoView on the active question card', () => {
      render(<PhysicalExamination {...defaultProps} />);
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });

  describe('wrappedOnNextQuestion', () => {
    it('should show summary modal with sections grouped by sectionKey and call setPhysicalExamData on confirm', () => {
      const originalOnNext = vi.fn();

      mockHookReturn.answers = { q1: ['q1-yes'], q2: ['q2-normal'], q3: ['q3-yes'] };
      render(<PhysicalExamination {...defaultProps} onNextQuestion={originalOnNext} />);

      expect(capturedHookProps.onNextQuestion).toBeDefined();
      expect(capturedHookProps.onNextQuestion).not.toBe(originalOnNext);

      capturedHookProps.onNextQuestion();
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      expect(modalConfig.open).toBe(true);
      expect(modalConfig.type).toBe('vitalConfirm');
      expect(modalConfig.title).toBe('Physical Examination Summary');
      expect(modalConfig.size).toBe('lg');
      expect(modalConfig.sections).toHaveLength(2);
      expect(modalConfig.sections[0].title).toBe('General');
      expect(modalConfig.sections[0].items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'labelValue', label: 'Jaundice', value: 'Yes' }),
          expect.objectContaining({ type: 'labelValue', label: 'Pallor', value: 'Normal' }),
        ])
      );
      expect(modalConfig.sections[1].title).toBe('Head');
      expect(modalConfig.sections[1].items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'labelValue', label: 'Injury', value: 'Yes' }),
        ])
      );

      expect(modalConfig.sections[0].onChange).toBeInstanceOf(Function);
      modalConfig.sections[0].onChange();

      modalConfig.onConfirm();

      expect(mockSetPhysicalExamData).toHaveBeenCalledWith(
        expect.any(Object),
        expect.arrayContaining([
          expect.objectContaining({ label: 'Jaundice', value: 'Yes' }),
          expect.objectContaining({ label: 'Pallor', value: 'Normal' }),
          expect.objectContaining({ label: 'Injury', value: 'Yes' }),
        ])
      );
      expect(originalOnNext).toHaveBeenCalled();
    });

    it('should show empty sections when no answers are provided', () => {
      mockHookReturn.answers = {};
      render(<PhysicalExamination {...defaultProps} />);

      capturedHookProps.onNextQuestion();
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      expect(modalConfig.sections).toEqual([]);
    });

    it('should skip questions with non-matching option IDs', () => {
      mockHookReturn.answers = { q1: ['nonexistent-id'] };
      render(<PhysicalExamination {...defaultProps} />);

      capturedHookProps.onNextQuestion();
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];

      expect(modalConfig.sections).toEqual([]);
    });

    it('should show "Picture taken" when camera option selected and images exist', () => {
      mockHookReturn.answers = { q1: ['q1-cam'] };
      mockHookReturn.cameraImagesFor = vi.fn((qId: string) =>
        qId === 'q1' ? ['img1.jpg'] : []
      );
      render(<PhysicalExamination {...defaultProps} />);

      capturedHookProps.onNextQuestion();
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      expect(modalConfig.sections).toHaveLength(1);
      expect(modalConfig.sections[0].items[0].value).toBe('Picture taken');
    });

    it('should produce empty sections when camera option selected but no images uploaded', () => {
      mockHookReturn.answers = { q1: ['q1-cam'] };
      mockHookReturn.cameraImagesFor = vi.fn().mockReturnValue([]);
      render(<PhysicalExamination {...defaultProps} />);

      capturedHookProps.onNextQuestion();
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];

      expect(modalConfig.sections).toEqual([]);
    });

    it('should use visibleQuestions from hook (not static PHYSICAL_EXAM_QUESTIONS)', () => {

      const serverQuestion = {
        id: 'server-q1',
        sectionLabel: 'Custom:',
        categoryLabel: 'Custom Check',
        questionText: 'Custom question?',
        isRequired: true,
        isMultiChoice: false,
        sectionKey: 'Custom Section',
        options: [
          { id: 'server-opt-yes', text: 'Yes' },
          { id: 'server-opt-no', text: 'No' },
        ],
      };
      resetHookReturn({
        visibleQuestions: [serverQuestion] as any,
        totalQuestions: 1,
        currentQuestion: serverQuestion as any,
      });
      mockHookReturn.answers = { 'server-q1': ['server-opt-yes'] };
      render(<PhysicalExamination {...defaultProps} />);

      capturedHookProps.onNextQuestion();
      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      expect(modalConfig.sections).toHaveLength(1);
      expect(modalConfig.sections[0].title).toBe('Custom Section');
      expect(modalConfig.sections[0].items[0]).toEqual(
        expect.objectContaining({ label: 'Custom Check', value: 'Yes' })
      );
    });

    it('should update answersRef immediately in onSelectSingle so last question answer appears in summary', async () => {
      const user = userEvent.setup();
      const originalOnNext = vi.fn();

      resetHookReturn({
        selectAndAdvance: vi.fn(() => {

          capturedHookProps.onNextQuestion();
        }),
      });
      mockHookReturn.answers = {};
      render(<PhysicalExamination {...defaultProps} onNextQuestion={originalOnNext} />);

      await user.click(screen.getByTestId('option-q1-yes'));

      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];

      expect(modalConfig.sections).toHaveLength(1);
      expect(modalConfig.sections[0].items[0]).toEqual(
        expect.objectContaining({ label: 'Jaundice', value: 'Yes' })
      );
    });
  });

  describe('confirm button', () => {
    it('should not show Confirm button when data.physicalExam is null', () => {
      mockContextData = { physicalExam: null };
      render(<PhysicalExamination {...defaultProps} />);

      expect(screen.queryByText('Save & Next')).not.toBeInTheDocument();
    });

    it('should show Confirm button when data.physicalExam is truthy', () => {
      mockContextData = { physicalExam: { answers: { q1: ['q1-yes'] }, details: [{ label: 'Jaundice', value: 'Yes' }] } };
      render(<PhysicalExamination {...defaultProps} />);

      expect(screen.getByText('Save & Next')).toBeInTheDocument();
    });

    it('should show summary modal and call setPhysicalExamData on confirm when Confirm is clicked', async () => {
      const user = userEvent.setup();
      const originalOnNext = vi.fn();
      mockContextData = { physicalExam: { answers: { q1: ['q1-yes'] }, details: [{ label: 'Jaundice', value: 'Yes' }] } };
      render(<PhysicalExamination {...defaultProps} onNextQuestion={originalOnNext} />);

      await user.click(screen.getByText('Save & Next'));
      expect(mockShowVitalConfirmationModal).toHaveBeenCalled();

      const modalConfig = mockShowVitalConfirmationModal.mock.calls[0][0];
      modalConfig.onConfirm();

      expect(mockSetPhysicalExamData).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Array)
      );
      expect(originalOnNext).toHaveBeenCalled();
    });
  });
});
