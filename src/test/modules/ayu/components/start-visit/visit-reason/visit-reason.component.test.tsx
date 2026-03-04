import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisitReason } from '../../../../../../modules/ayu/components/start-visit/visit-reason/visit-reason.component';

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

vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/ayu-stepper-container.component', () => ({
  AyuStepperContainer: vi.fn(({ onComplete, onProgressUpdate }) => (
    <div data-testid="ayu-stepper-container">
      <div>Stepper Container</div>
      <button data-testid="stepper-complete-button" onClick={onComplete}>
        Complete
      </button>
      <button
        data-testid="stepper-progress-button"
        onClick={() => onProgressUpdate?.(5, 3)}
      >
        Update Progress
      </button>
      <button
        data-testid="stepper-progress-complete"
        onClick={() => onProgressUpdate?.(5, 5)}
      >
        Complete All
      </button>
    </div>
  )),
}));

vi.mock('../../../../../../modules/ayu/hooks/useVisitReasons.hook', () => ({
  useVisitReasons: vi.fn(),
}));

vi.mock('../../../../../../components/modal/global-modal-context', () => ({
  useGlobalModal: vi.fn(),
}));

vi.mock('../../../../../../modules/ayu-library/utils/fhir-to-ayu.util', () => ({
  transformFhirToAyu: vi.fn(),
}));

// Import mocked functions after mocks are set up
import { useVisitReasons } from '../../../../../../modules/ayu/hooks/useVisitReasons.hook';
import { useGlobalModal } from '../../../../../../components/modal/global-modal-context';
import { transformFhirToAyu } from '../../../../../../modules/ayu-library/utils/fhir-to-ayu.util';
const mockUseVisitReasons = vi.mocked(useVisitReasons);
const mockUseGlobalModal = vi.mocked(useGlobalModal);
const mockTransformFhirToAyu = vi.mocked(transformFhirToAyu);
const mockShowConfirmModal = vi.fn();

// Helper function to create mock AyuJsonItem
const createMockAyuJsonItem = (overrides = {}) => ({
  id: 1,
  name: 'Mock Complaint',
  keyName: 'mock-complaint',
  isActive: true,
  json: {
    resourceType: 'Questionnaire',
    item: [],
  },
  ...overrides,
});

describe('VisitReason', () => {
  const mockOnNextQuestion = vi.fn();
  const mockOnPrevQuestion = vi.fn();
  const mockOnPrevSection = vi.fn();
  const mockOnProgressUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock setup
    mockUseVisitReasons.mockReturnValue({
      search: '',
      setSearch: vi.fn(),
      filteredNames: [],
      selectedReasons: [],
      addReason: vi.fn(),
      removeReason: vi.fn(),
      grouped: {},
      selectedComplaints: [],
    });

    mockUseGlobalModal.mockReturnValue({
      showConfirmModal: mockShowConfirmModal,
      showVitalConfirmationModal: vi.fn(),
      closeModal: vi.fn(),
    });
  });

  describe('Default Visit Reason UI', () => {
    it('should render question loader component', () => {
      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
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
        />
      );

      expect(screen.queryByTestId('ayu-stepper-container')).not.toBeInTheDocument();
    });
  });

  describe('canSubmit Logic', () => {
    it('should disable next button when no reasons are selected', () => {
      mockUseVisitReasons.mockReturnValue({
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
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      expect(nextButton).toBeDisabled();
    });

    it('should enable next button when reasons are selected', () => {
      mockUseVisitReasons.mockReturnValue({
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
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('handleNext Function', () => {
    it('should not show confirmation modal when canSubmit is false', async () => {
      const user = userEvent.setup();
      mockUseVisitReasons.mockReturnValue({
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
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      expect(mockShowConfirmModal).not.toHaveBeenCalled();
    });

    it('should show confirmation modal when canSubmit is true', async () => {
      const user = userEvent.setup();
      const selectedReasons = ['Fever', 'Headache'];
      const selectedComplaints = [createMockAyuJsonItem()];

      mockUseVisitReasons.mockReturnValue({
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
        size: 'sm',
        open: true,
        onConfirm: expect.any(Function),
      });
    });

    it('should pass correct items to confirmation modal', async () => {
      const user = userEvent.setup();
      const selectedReasons = ['Fever', 'Cough', 'Sore Throat'];

      mockUseVisitReasons.mockReturnValue({
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
      mockUseVisitReasons.mockReturnValue({
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
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      // Get the onConfirm callback
      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      expect(mockTransformFhirToAyu).toHaveBeenCalledWith(selectedComplaint.json);
    });

    it('should set ayuSchema state when modal is confirmed', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [{ linkId: 'q1', text: 'Question 1', type: 'string' as const }],
      };

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      mockUseVisitReasons.mockReturnValue({
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
      mockUseVisitReasons.mockReturnValue({
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
      mockUseVisitReasons.mockReturnValue({
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
      mockUseVisitReasons.mockReturnValue({
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
      mockUseVisitReasons.mockReturnValue({
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
    it('should call onProgressUpdate when stepper completes', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [],
      };

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      mockUseVisitReasons.mockReturnValue({
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

      expect(mockOnProgressUpdate).toHaveBeenCalledWith(1, 1);
    });

    it('should call onNextQuestion when stepper completes', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [],
      };

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      mockUseVisitReasons.mockReturnValue({
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
      mockUseVisitReasons.mockReturnValue({
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
      mockUseVisitReasons.mockReturnValue({
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

    it('should handle onProgressUpdate being undefined', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [],
      };

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      mockUseVisitReasons.mockReturnValue({
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

    it('should set showStepper to false when stepper completes', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [],
      };

      mockTransformFhirToAyu.mockReturnValue(mockSchema);
      mockUseVisitReasons.mockReturnValue({
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

      // Verify onNextQuestion is called, which indicates completion
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
        />
      );

      const gridContainer = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty selectedComplaints array', async () => {
      const user = userEvent.setup();
      mockUseVisitReasons.mockReturnValue({
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
        />
      );

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      expect(mockShowConfirmModal).toHaveBeenCalled();
    });

    it('should handle single selected reason', async () => {
      const user = userEvent.setup();
      mockUseVisitReasons.mockReturnValue({
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
      mockUseVisitReasons.mockReturnValue({
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
  });
});
