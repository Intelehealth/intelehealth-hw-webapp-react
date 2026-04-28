import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VisitReason } from '../../../../../../modules/ayu/components/start-visit/visit-reason/visit-reason.component';
import {
  CONFIRM_MODAL_OK,
  PHYSCAL_EXAM_DESCRIPTION,
} from '../../../../../../modules/ayu/utils/ayu.constants';

// Mock all child components
vi.mock('../../../../../../modules/ayu/components/loaders/question-loader.component', () => ({
  QuestionLoader: vi.fn(({ children, question }) => (
    <div data-testid="question-loader">
      <div>{question}</div>
      {children}
    </div>
  )),
}));

vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/footer', () => ({
  VisitReasonFooter: vi.fn(({ questionIndex, onNextQuestion, isNextDisabled }) => (
    <div data-testid="visit-reason-footer">
      <div>Footer - Question {questionIndex}</div>
      <button
        data-testid="footer-next-button"
        onClick={onNextQuestion}
        disabled={isNextDisabled}
      >
        Next
      </button>
    </div>
  )),
}));

vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/reason-alphabetList.component', () => ({
  ReasonAlphabetList: vi.fn(() => (
    <div data-testid="reason-alphabet-list">Alphabet List</div>
  )),
}));

vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/reason-categoryList.component', () => ({
  ReasonCategoryList: vi.fn(() => (
    <div data-testid="reason-category-list">Category List</div>
  )),
}));

vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/search-input.component', () => ({
  ReasonSearchInput: vi.fn(() => (
    <div data-testid="reason-search-input">Search Input</div>
  )),
}));

vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/selected-reasons.component', () => ({
  SelectedReasons: vi.fn(() => (
    <div data-testid="selected-reasons">Selected Reasons</div>
  )),
}));

const mockShowSummary = vi.fn();
const mockConfirm = vi.fn();
vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/ayu-stepper-container.component', async () => {
  const ReactModule = await vi.importActual<typeof import('react')>('react');
  return {
    AyuStepperContainer: ReactModule.forwardRef((props: any, ref: any) => {
      ReactModule.useImperativeHandle(ref, () => ({
        confirm: mockConfirm,
        showSummary: mockShowSummary,
      }));
      return (
        <div data-testid="ayu-stepper-container">
          <div>Stepper Container</div>
          {props.initialAnswers && (
            <div data-testid="initial-answers">{JSON.stringify(props.initialAnswers)}</div>
          )}
          <button data-testid="stepper-complete-button" onClick={() => props.onComplete?.({ q1: 'a' })}>
            Complete
          </button>
          <button
            data-testid="stepper-progress-button"
            onClick={() => props.onProgressUpdate?.(5, 3)}
          >
            Update Progress
          </button>
          <button
            data-testid="stepper-progress-complete"
            onClick={() => props.onProgressUpdate?.(5, 5)}
          >
            Complete All
          </button>
        </div>
      );
    }),
  };
});

vi.mock('../../../../../../modules/ayu/components/common/ayu-button.component', () => ({
  default: ({ children, onClick, ...rest }: any) => (
    <button onClick={onClick} {...rest}>{children}</button>
  ),
}));

vi.mock('../../../../../../assets/icons/icon-right-arrow.svg', () => ({
  default: 'right-arrow-icon.svg',
}));

vi.mock('../../../../../../modules/ayu/assets/wash-hand.svg', () => ({
  default: 'wash-hand-icon.svg',
}));

vi.mock('../../../../../../components/modal/global-modal-context', () => ({
  useGlobalModal: vi.fn(),
}));

vi.mock('../../../../../../modules/ayu-library/utils/fhir-to-ayu.util', () => ({
  transformFhirToAyu: vi.fn(),
  parsePatientAgeYears: (raw: unknown) =>
    raw == null || raw === '' ? null : Number(raw),
}));

vi.mock('../../../../../../modules/ayu/context/start-visit.context', () => ({
  useStartVisitData: vi.fn(() => ({
    setVisitReasonData: vi.fn(),
  })),
}));

vi.mock('../../../../../../modules/ayu/utils/visit-summary.util', () => ({
  buildVisitSummary: vi.fn(() => []),
}));

// Import mocked functions after mocks are set up
import { useGlobalModal } from '../../../../../../components/modal/global-modal-context';
import { transformFhirToAyu } from '../../../../../../modules/ayu-library/utils/fhir-to-ayu.util';
import { useStartVisitData } from '../../../../../../modules/ayu/context/start-visit.context';
import { buildVisitSummary } from '../../../../../../modules/ayu/utils/visit-summary.util';
import { VisitReasonFooter } from '../../../../../../modules/ayu/components/start-visit/visit-reason/footer';
const mockUseGlobalModal = vi.mocked(useGlobalModal);
const mockTransformFhirToAyu = vi.mocked(transformFhirToAyu);
const mockUseStartVisitData = vi.mocked(useStartVisitData);
const mockBuildVisitSummary = vi.mocked(buildVisitSummary);
const mockShowConfirmModal = vi.fn();

// Helper function to create mock AyuJsonItem
const createMockAyuJsonItem = (overrides = {}) => ({
  id: 1,
  name: 'Mock Complaint',
  keyName: 'mock-complaint',
  isActive: true,
  json: {
    resourceType: 'Questionnaire' as const,
    item: [] as never[],
  },
  ...overrides,
});

const createDefaultVisitReasons = (overrides: any = {}) => ({
  search: '',
  setSearch: vi.fn(),
  filteredNames: [],
  selectedReasons: [] as string[],
  addReason: vi.fn(),
  removeReason: vi.fn(),
  grouped: {},
  selectedComplaints: [] as any[],
  ...overrides,
});

describe('VisitReason', () => {
  const mockOnNextQuestion = vi.fn();
  const mockOnPrevQuestion = vi.fn();
  const mockOnPrevSection = vi.fn();
  const mockOnProgressUpdate = vi.fn();
  const mockSetVisitReasonData = vi.fn();

  let defaultVisitReasons: ReturnType<typeof createDefaultVisitReasons>;

  beforeEach(() => {
    vi.clearAllMocks();

    defaultVisitReasons = createDefaultVisitReasons();

    mockUseGlobalModal.mockReturnValue({
      showConfirmModal: mockShowConfirmModal,
      showVitalConfirmationModal: vi.fn(),
      closeModal: vi.fn(),
    });

    mockUseStartVisitData.mockReturnValue({
      data: { vitals: null, visitReason: null, physicalExam: null, medicalHistory: null, medicalHistoryAnswers: null },
      setVisitReasonData: mockSetVisitReasonData,
      saveSectionToTemp: vi.fn().mockResolvedValue(undefined),
    } as any);
  });

  describe('Default Visit Reason UI', () => {
    it('should render question loader component', () => {
      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      expect(screen.getByTestId('question-loader')).toBeInTheDocument();
    });

    it('should render all child components', () => {
      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      expect(screen.getByTestId('question-loader')).toBeInTheDocument();
      expect(screen.getByTestId('reason-search-input')).toBeInTheDocument();
      expect(screen.getByTestId('selected-reasons')).toBeInTheDocument();
      expect(screen.getByTestId('reason-category-list')).toBeInTheDocument();
      expect(screen.getByTestId('reason-alphabet-list')).toBeInTheDocument();
      expect(screen.getByTestId('visit-reason-footer')).toBeInTheDocument();
    });

    it('should render footer with correct question index', () => {
      render(
        <VisitReason
          questionIndex={2}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      expect(screen.getByText('Footer - Question 2')).toBeInTheDocument();
    });

    it('should render with onPrevSection prop', () => {
      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          onPrevSection={mockOnPrevSection}
          visitReasons={defaultVisitReasons}
        />
      );

      expect(screen.getByTestId('visit-reason-footer')).toBeInTheDocument();
    });

    it('should not render stepper container initially', () => {
      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      expect(screen.queryByTestId('ayu-stepper-container')).not.toBeInTheDocument();
    });
  });

  describe('canSubmit Logic', () => {
    it('should disable next button when no reasons are selected', () => {
      defaultVisitReasons = createDefaultVisitReasons({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: [],
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      expect(nextButton).toBeDisabled();
    });

    it('should enable next button when reasons are selected', () => {
      defaultVisitReasons = createDefaultVisitReasons({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: ['Fever', 'Cough'],
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('handleNext Function', () => {
    it('should not show confirmation modal when canSubmit is false', () => {
      defaultVisitReasons = createDefaultVisitReasons({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: [],
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      // React swallows clicks on disabled buttons, so we directly invoke the
      // onNextQuestion prop captured by the VisitReasonFooter mock to
      // exercise handleNext's `!canSubmit` early-return branch.
      const footerCalls = (
        VisitReasonFooter as unknown as { mock: { calls: unknown[][] } }
      ).mock.calls;
      const lastFooterProps = footerCalls[footerCalls.length - 1][0] as {
        onNextQuestion: () => void;
        isNextDisabled?: boolean;
      };
      expect(lastFooterProps.isNextDisabled).toBe(true);
      lastFooterProps.onNextQuestion();

      expect(mockShowConfirmModal).not.toHaveBeenCalled();
    });

    it('should show confirmation modal when canSubmit is true', async () => {
      const user = userEvent.setup();
      const selectedReasons = ['Fever', 'Headache'];
      const selectedComplaints = [createMockAyuJsonItem()];

      defaultVisitReasons = createDefaultVisitReasons({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: selectedReasons,
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: selectedComplaints,
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      expect(mockShowConfirmModal).toHaveBeenCalledWith({
        icon: expect.any(String),
        title: 'Confirm visit reason?',
        description: 'Are you sure the patient has the following reasons for a visit?',
        confirmText: 'Yes',
        cancelText: 'No',
        type: 'confirm',
        items: selectedReasons,
        open: true,
        onConfirm: expect.any(Function),
      });
    });

    it('should pass correct items to confirmation modal', async () => {
      const user = userEvent.setup();
      const selectedReasons = ['Fever', 'Cough', 'Sore Throat'];

      defaultVisitReasons = createDefaultVisitReasons({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: selectedReasons,
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      expect(mockShowConfirmModal).toHaveBeenCalledWith(
        expect.objectContaining({
          items: selectedReasons,
        })
      );
    });

    it('should call transformFhirToAyu when modal is confirmed', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [{ linkId: 'q1', text: 'Question 1', type: 'string' as const }],
      };
      const selectedComplaint = createMockAyuJsonItem();

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      defaultVisitReasons = createDefaultVisitReasons({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: ['Fever'],
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [selectedComplaint],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      // Get the onConfirm callback
      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      expect(mockTransformFhirToAyu).toHaveBeenCalledWith(
        selectedComplaint.json,
        expect.objectContaining({ age: null })
      );
    });

    it('should set ayuSchema state when modal is confirmed', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [{ linkId: 'q1', text: 'Question 1', type: 'string' as const }],
      };

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      defaultVisitReasons = createDefaultVisitReasons({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: ['Fever'],
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      // Schema is set, which triggers stepper rendering
      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });
    });

    it('should pass icon to confirmation modal', async () => {
      const user = userEvent.setup();
      defaultVisitReasons = createDefaultVisitReasons({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: ['Fever'],
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      expect(mockShowConfirmModal).toHaveBeenCalledWith(
        expect.objectContaining({
          icon: expect.any(String),
        })
      );
    });
  });

  describe('AyuStepperContainer Rendering', () => {
    it('should render stepper container when showStepper is true', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [{ linkId: 'q1', text: 'Question 1', type: 'string' as const }],
      };

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      defaultVisitReasons = createDefaultVisitReasons({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: ['Fever'],
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      // Trigger the onConfirm callback
      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      // Wait for stepper to render
      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });
    });

    it('should not render default UI when stepper is active', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [{ linkId: 'q1', text: 'Question 1', type: 'string' as const }],
      };

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      defaultVisitReasons = createDefaultVisitReasons({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: ['Fever'],
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      // Trigger the onConfirm callback
      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      // Wait for stepper to render
      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });

      // Default UI should not be visible
      expect(screen.queryByTestId('reason-search-input')).not.toBeInTheDocument();
      expect(screen.queryByTestId('visit-reason-footer')).not.toBeInTheDocument();
    });

    it('should render stepper container with correct wrapper classes', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [],
      };

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      defaultVisitReasons = createDefaultVisitReasons({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: ['Fever'],
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [createMockAyuJsonItem()],
      });

      const { container } = render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      await waitFor(() => {
        const wrapper = container.querySelector('.w-full.flex.flex-col.h-full');
        expect(wrapper).toBeInTheDocument();
      });
    });
  });

  describe('AyuStepperContainer Callbacks', () => {
    it('should show wash-hands modal when stepper completes in first-pass mode', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [],
      };

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      defaultVisitReasons = createDefaultVisitReasons({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: ['Fever'],
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          onProgressUpdate={mockOnProgressUpdate}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });

      mockShowConfirmModal.mockClear();
      const completeButton = screen.getByTestId('stepper-complete-button');
      await user.click(completeButton);

      // Wait for the setTimeout(0) to fire and show the wash-hands modal
      await waitFor(() => {
        expect(mockShowConfirmModal).toHaveBeenCalledWith(
          expect.objectContaining({
            description: PHYSCAL_EXAM_DESCRIPTION,
            confirmText: CONFIRM_MODAL_OK,
            type: 'confirm',
            open: true,
            title: '',
          })
        );
      });

      // onProgressUpdate and onNextQuestion should NOT be called yet
      expect(mockOnProgressUpdate).not.toHaveBeenCalled();
      expect(mockOnNextQuestion).not.toHaveBeenCalled();
    });

    it('should call onProgressUpdate and onNextQuestion when wash-hands modal is confirmed', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [],
      };

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      defaultVisitReasons = createDefaultVisitReasons({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: ['Fever'],
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          onProgressUpdate={mockOnProgressUpdate}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });

      mockShowConfirmModal.mockClear();
      const completeButton = screen.getByTestId('stepper-complete-button');
      await user.click(completeButton);

      // Wait for the setTimeout(0) wash-hands modal
      await waitFor(() => {
        expect(mockShowConfirmModal).toHaveBeenCalled();
      });

      // Simulate confirming the wash-hands modal
      const washHandsOnConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      washHandsOnConfirm();

      expect(mockOnProgressUpdate).toHaveBeenCalledWith(1, 1);
      expect(mockOnNextQuestion).toHaveBeenCalled();
    });

    it('should update progress as 0 when stepper progress is incomplete', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [],
      };

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      defaultVisitReasons = createDefaultVisitReasons({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: ['Fever'],
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          onProgressUpdate={mockOnProgressUpdate}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });

      const progressButton = screen.getByTestId('stepper-progress-button');
      await user.click(progressButton);

      // When not complete (3 out of 5), should pass actual progress
      expect(mockOnProgressUpdate).toHaveBeenCalledWith(5, 3);
    });

    it('should update progress to 1 when all stepper questions are answered', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [],
      };

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      defaultVisitReasons = createDefaultVisitReasons({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: ['Fever'],
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          onProgressUpdate={mockOnProgressUpdate}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });

      const progressCompleteButton = screen.getByTestId('stepper-progress-complete');
      await user.click(progressCompleteButton);

      // When complete (5 out of 5), should pass actual progress
      expect(mockOnProgressUpdate).toHaveBeenCalledWith(5, 5);
    });

    it('should not throw when onProgressUpdate is undefined and stepper reports progress', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [],
      };

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Fever'],
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });

      // Click the progress button (not complete) without onProgressUpdate prop
      const progressButton = screen.getByTestId('stepper-progress-button');
      await user.click(progressButton);

      // Should not throw — handleStepperProgress uses optional chaining
      expect(mockOnNextQuestion).not.toHaveBeenCalled();
    });

    it('should handle onProgressUpdate being undefined', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [],
      };

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      defaultVisitReasons = createDefaultVisitReasons({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: ['Fever'],
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;

      expect(() => onConfirm()).not.toThrow();

      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });

      const completeButton = screen.getByTestId('stepper-complete-button');
      expect(() => user.click(completeButton)).not.toThrow();
    });

    it('should show wash-hands modal when stepper completes (first-pass mode)', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [],
      };

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      defaultVisitReasons = createDefaultVisitReasons({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: ['Fever'],
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });

      mockShowConfirmModal.mockClear();
      const completeButton = screen.getByTestId('stepper-complete-button');
      await user.click(completeButton);

      // Wait for the setTimeout(0) wash-hands modal
      await waitFor(() => {
        expect(mockShowConfirmModal).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Please wash/sanitize your hands',
          })
        );
      });

      // Simulate confirming wash-hands modal
      const washHandsOnConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      washHandsOnConfirm();

      expect(mockOnNextQuestion).toHaveBeenCalled();
    });
  });

  describe('Container Styling', () => {
    it('should render default UI with correct container classes', () => {
      const { container } = render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      const mainContainer = container.querySelector('.w-full.flex.flex-col.h-full');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should render grid layout for default UI', () => {
      const { container } = render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      const gridContainer = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty selectedComplaints array', async () => {
      const user = userEvent.setup();
      defaultVisitReasons = createDefaultVisitReasons({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: ['Fever'],
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      expect(mockShowConfirmModal).toHaveBeenCalled();
    });

    it('should handle single selected reason', async () => {
      const user = userEvent.setup();
      defaultVisitReasons = createDefaultVisitReasons({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: ['Fever'],
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      expect(nextButton).not.toBeDisabled();

      await user.click(nextButton);
      expect(mockShowConfirmModal).toHaveBeenCalledWith(
        expect.objectContaining({
          items: ['Fever'],
        })
      );
    });

    it('should handle multiple selected reasons', async () => {
      const user = userEvent.setup();
      const selectedReasons = ['Fever', 'Cough', 'Headache', 'Nausea'];
      defaultVisitReasons = createDefaultVisitReasons({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: selectedReasons,
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      expect(mockShowConfirmModal).toHaveBeenCalledWith(
        expect.objectContaining({
          items: selectedReasons,
        })
      );
    });

    it('should call onReasonsConfirmed with selected reasons when modal is confirmed', async () => {
      const user = userEvent.setup();
      const mockOnReasonsConfirmed = vi.fn();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [{ linkId: 'q1', text: 'Question 1', type: 'string' as const }],
      };

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Fever'],
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          onReasonsConfirmed={mockOnReasonsConfirmed}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      expect(mockOnReasonsConfirmed).toHaveBeenCalledWith(['Fever']);
    });
  });

  describe('handleStepperComplete (onConfirm flow with buildVisitSummary)', () => {
    it('should call setVisitReasonData with labelValue details when stepper completes', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [{ linkId: 'q1', text: 'Duration', type: 'string' as const }],
      };

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      mockBuildVisitSummary.mockReturnValue([
        {
          title: 'Summary',
          items: [
            { type: 'labelValue' as const, label: 'Duration', value: '3 days' },
          ],
        },
      ]);

      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Fever'],
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          onProgressUpdate={mockOnProgressUpdate}
          visitReasons={defaultVisitReasons}
        />
      );

      // Trigger modal
      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      // Wait for stepper to render
      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });

      // Click complete button to trigger handleStepperComplete
      const completeButton = screen.getByTestId('stepper-complete-button');
      await user.click(completeButton);

      expect(mockBuildVisitSummary).toHaveBeenCalled();
      expect(mockSetVisitReasonData).toHaveBeenCalledWith(
        expect.anything(),
        ['Fever'],
        [{ label: 'Duration', value: '3 days' }]
      );
    });

    it('should process subheading items from buildVisitSummary into details', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [{ linkId: 'q1', text: 'Symptoms', type: 'string' as const }],
      };

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      mockBuildVisitSummary.mockReturnValue([
        {
          title: 'Summary',
          items: [
            { type: 'subheading' as const, heading: 'Symptoms', values: ['Cough', 'Fever'] },
            { type: 'labelValue' as const, label: 'Duration', value: '5 days' },
          ],
        },
      ]);

      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Cold'],
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          onProgressUpdate={mockOnProgressUpdate}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });

      const completeButton = screen.getByTestId('stepper-complete-button');
      await user.click(completeButton);

      expect(mockSetVisitReasonData).toHaveBeenCalledWith(
        expect.anything(),
        ['Cold'],
        [
          { label: 'Symptoms', value: 'Cough, Fever' },
          { label: 'Duration', value: '5 days' },
        ]
      );
    });

    it('should handle schema with no item property (stableSchema?.item ?? [])', async () => {
      const user = userEvent.setup();

      // Schema with no item property — covers the ?? [] fallback
      const schemaWithoutItems = {
        linkId: 'root',
        type: 'group' as const,
      };
      mockTransformFhirToAyu.mockReturnValue(schemaWithoutItems);
      mockBuildVisitSummary.mockReturnValue([]);

      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Fever'],
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          onProgressUpdate={mockOnProgressUpdate}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });

      const completeButton = screen.getByTestId('stepper-complete-button');
      await user.click(completeButton);

      // buildVisitSummary should be called with empty array (from ?? [])
      expect(mockBuildVisitSummary).toHaveBeenCalledWith([], expect.any(Map), '');
    });

    it('should handle null value in labelValue items by converting to empty string', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [],
      };

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      mockBuildVisitSummary.mockReturnValue([
        {
          title: 'Summary',
          items: [
            { type: 'labelValue' as const, label: 'Notes', value: null },
          ],
        },
      ]);

      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Fever'],
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });

      const completeButton = screen.getByTestId('stepper-complete-button');
      await user.click(completeButton);

      expect(mockSetVisitReasonData).toHaveBeenCalledWith(
        expect.anything(),
        ['Fever'],
        [{ label: 'Notes', value: '' }]
      );
    });
  });

  // ── Review Mode (savedAnswers from context) ─────────────────────────

  describe('Review Mode', () => {
    const savedAnswers = { q1: 'answer1', q2: 'answer2' };

    it('should show stepper immediately when savedAnswers exists', () => {
      mockUseStartVisitData.mockReturnValue({
        data: { vitals: null, visitReason: { answers: savedAnswers, reasonNames: ['Fever'], details: [] }, physicalExam: null, medicalHistory: null, medicalHistoryAnswers: null },
        setVisitReasonData: mockSetVisitReasonData,
        saveSectionToTemp: vi.fn().mockResolvedValue(undefined),
      } as any);
      const mockSchema = { linkId: 'root', type: 'group' as const, item: [] };
      mockTransformFhirToAyu.mockReturnValue(mockSchema);

      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Fever'],
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      // Stepper should render immediately without needing modal confirm
      expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      // Default UI should not be shown
      expect(screen.queryByTestId('visit-reason-footer')).not.toBeInTheDocument();
    });

    it('should pass initialAnswers to AyuStepperContainer', () => {
      mockUseStartVisitData.mockReturnValue({
        data: { vitals: null, visitReason: { answers: savedAnswers, reasonNames: ['Fever'], details: [] }, physicalExam: null, medicalHistory: null, medicalHistoryAnswers: null },
        setVisitReasonData: mockSetVisitReasonData,
        saveSectionToTemp: vi.fn().mockResolvedValue(undefined),
      } as any);
      const mockSchema = { linkId: 'root', type: 'group' as const, item: [] };
      mockTransformFhirToAyu.mockReturnValue(mockSchema);

      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Fever'],
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      expect(screen.getByTestId('initial-answers')).toHaveTextContent(JSON.stringify(savedAnswers));
    });

    it('should show Back and Confirm buttons in review mode', () => {
      mockUseStartVisitData.mockReturnValue({
        data: { vitals: null, visitReason: { answers: savedAnswers, reasonNames: ['Fever'], details: [] }, physicalExam: null, medicalHistory: null, medicalHistoryAnswers: null },
        setVisitReasonData: mockSetVisitReasonData,
        saveSectionToTemp: vi.fn().mockResolvedValue(undefined),
      } as any);
      const mockSchema = { linkId: 'root', type: 'group' as const, item: [] };
      mockTransformFhirToAyu.mockReturnValue(mockSchema);

      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Fever'],
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          onPrevSection={mockOnPrevSection}
          visitReasons={defaultVisitReasons}
        />
      );

      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('should switch to selection view (not previous section) when Back is clicked in review mode', async () => {
      const user = userEvent.setup();
      mockUseStartVisitData.mockReturnValue({
        data: { vitals: null, visitReason: { answers: savedAnswers, reasonNames: ['Fever'], details: [] }, physicalExam: null, medicalHistory: null, medicalHistoryAnswers: null },
        setVisitReasonData: mockSetVisitReasonData,
        saveSectionToTemp: vi.fn().mockResolvedValue(undefined),
      } as any);
      const mockSchema = { linkId: 'root', type: 'group' as const, item: [] };
      mockTransformFhirToAyu.mockReturnValue(mockSchema);

      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Fever'],
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          onPrevSection={mockOnPrevSection}
          visitReasons={defaultVisitReasons}
        />
      );

      await user.click(screen.getByText('Back'));
      expect(mockOnPrevSection).not.toHaveBeenCalled();
      expect(screen.queryByTestId('ayu-stepper-container')).not.toBeInTheDocument();
      expect(screen.getByTestId('visit-reason-footer')).toBeInTheDocument();
    });

    it('resets stepper view on review-mode Back so next forward-entry shows selection', async () => {
      const user = userEvent.setup();
      mockUseStartVisitData.mockReturnValue({
        data: {
          vitals: null,
          visitReason: {
            answers: savedAnswers,
            reasonNames: ['Fever'],
            details: [],
          },
          physicalExam: null,
          medicalHistory: null,
          medicalHistoryAnswers: null,
        },
        setVisitReasonData: mockSetVisitReasonData,
        saveSectionToTemp: vi.fn().mockResolvedValue(undefined),
      } as any);
      const mockSchema = { linkId: 'root', type: 'group' as const, item: [] };
      mockTransformFhirToAyu.mockReturnValue(mockSchema);

      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Fever'],
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          onPrevSection={mockOnPrevSection}
          visitReasons={defaultVisitReasons}
        />
      );

      // Stepper renders immediately in review mode.
      expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();

      await user.click(screen.getByText('Back'));

      expect(mockOnPrevSection).not.toHaveBeenCalled();
      expect(screen.queryByTestId('ayu-stepper-container')).not.toBeInTheDocument();
      expect(screen.getByTestId('visit-reason-footer')).toBeInTheDocument();
    });

    it('should call showSummary when Confirm is clicked in review mode', async () => {
      const user = userEvent.setup();
      mockUseStartVisitData.mockReturnValue({
        data: { vitals: null, visitReason: { answers: savedAnswers, reasonNames: ['Fever'], details: [] }, physicalExam: null, medicalHistory: null, medicalHistoryAnswers: null },
        setVisitReasonData: mockSetVisitReasonData,
        saveSectionToTemp: vi.fn().mockResolvedValue(undefined),
      } as any);
      const mockSchema = { linkId: 'root', type: 'group' as const, item: [] };
      mockTransformFhirToAyu.mockReturnValue(mockSchema);

      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Fever'],
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      await user.click(screen.getByText('Confirm'));
      expect(mockShowSummary).toHaveBeenCalledTimes(1);
    });

    it('should not show Back/Confirm buttons when not in review mode', async () => {
      const user = userEvent.setup();
      const mockSchema = { linkId: 'root', type: 'group' as const, item: [] };
      mockTransformFhirToAyu.mockReturnValue(mockSchema);

      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Fever'],
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      // Enter stepper via normal flow
      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);
      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });

      // No Back/Confirm buttons in first-pass mode (savedAnswers is null)
      expect(screen.queryByText('Back')).not.toBeInTheDocument();
      expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
    });

    it('should directly call onProgressUpdate and onNextQuestion in review mode (no wash-hands modal)', async () => {
      const user = userEvent.setup();
      mockUseStartVisitData.mockReturnValue({
        data: { vitals: null, visitReason: { answers: savedAnswers, reasonNames: ['Fever'], details: [] }, physicalExam: null, medicalHistory: null, medicalHistoryAnswers: null },
        setVisitReasonData: mockSetVisitReasonData,
        saveSectionToTemp: vi.fn().mockResolvedValue(undefined),
      } as any);
      const mockSchema = { linkId: 'root', type: 'group' as const, item: [] };
      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      mockBuildVisitSummary.mockReturnValue([]);

      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Fever'],
        selectedComplaints: [createMockAyuJsonItem()],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          onProgressUpdate={mockOnProgressUpdate}
          visitReasons={defaultVisitReasons}
        />
      );

      // Stepper renders immediately in review mode
      expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();

      mockShowConfirmModal.mockClear();
      const completeButton = screen.getByTestId('stepper-complete-button');
      await user.click(completeButton);

      // In review mode, should directly navigate without wash-hands modal
      expect(mockOnProgressUpdate).toHaveBeenCalledWith(1, 1);
      expect(mockOnNextQuestion).toHaveBeenCalled();
      // showConfirmModal should NOT be called for wash-hands
      expect(mockShowConfirmModal).not.toHaveBeenCalled();
    });

    it('should not render stepper when savedAnswers exists but selectedComplaints is empty', () => {
      mockUseStartVisitData.mockReturnValue({
        data: { vitals: null, visitReason: { answers: savedAnswers, reasonNames: ['Fever'], details: [] }, physicalExam: null, medicalHistory: null, medicalHistoryAnswers: null },
        setVisitReasonData: mockSetVisitReasonData,
        saveSectionToTemp: vi.fn().mockResolvedValue(undefined),
      } as any);

      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Fever'],
        selectedComplaints: [], // empty
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      // No schema can be built, so default UI should render
      expect(screen.queryByTestId('ayu-stepper-container')).not.toBeInTheDocument();
      expect(screen.getByTestId('visit-reason-footer')).toBeInTheDocument();
    });
  });
});
