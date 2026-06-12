import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VisitReason } from '../../../../../../modules/ayu/components/start-visit/visit-reason/visit-reason.component';
import {
  CONFIRM_MODAL_OK,
  PHYSCAL_EXAM_DESCRIPTION,
} from '../../../../../../modules/ayu/utils/ayu.constants';

vi.mock('react-router-dom', () => ({
  useLocation: () => ({
    pathname: '/ayu',
    search: '',
    hash: '',
    state: null,
    key: 'default',
  }),
}));

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

vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/search-input.component', () => ({
  ReasonSearchInput: vi.fn(() => (
    <div data-testid="reason-search-input">Search Input</div>
  )),
}));

vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/selected-reasons.component', () => ({
  SelectedReasons: vi.fn(({ selectedReasons, removeReason }) => (
    <div data-testid="selected-reasons">
      Selected Reasons
      {(selectedReasons as string[])?.map(reason => (
        <button
          key={reason}
          data-testid={`remove-reason-${reason}`}
          onClick={() => removeReason?.(reason)}
        >
          Remove {reason}
        </button>
      ))}
    </div>
  )),
}));

const mockShowSummary = vi.fn();
const mockConfirm = vi.fn();
const mockStepperGetAnswers = vi.fn(() => ({}));
vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/ayu-stepper-container.component', async () => {
  const ReactModule = await vi.importActual<typeof import('react')>('react');
  return {
    AyuStepperContainer: ReactModule.forwardRef((props: any, ref: any) => {
      ReactModule.useImperativeHandle(ref, () => ({
        confirm: mockConfirm,
        showSummary: mockShowSummary,
        getAnswers: mockStepperGetAnswers,
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
          <button
            data-testid="stepper-summary-shown"
            onClick={() => props.onSummaryShown?.()}
          >
            Summary Shown
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
  questionnaireMatchesDemographics: vi.fn(() => true),
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
  const mockClearVisitReasonData = vi.fn();
  const mockSaveSectionToTemp = vi.fn().mockResolvedValue(undefined);

  let defaultVisitReasons: ReturnType<typeof createDefaultVisitReasons>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStepperGetAnswers.mockReturnValue({});

    defaultVisitReasons = createDefaultVisitReasons();

    mockUseGlobalModal.mockReturnValue({
      showConfirmModal: mockShowConfirmModal,
      showVitalConfirmationModal: vi.fn(),
      closeModal: vi.fn(),
    });

    mockUseStartVisitData.mockReturnValue({
      data: { vitals: null, visitReason: null, physicalExam: null, medicalHistory: null, medicalHistoryAnswers: null },
      setVisitReasonData: mockSetVisitReasonData,
      clearVisitReasonData: mockClearVisitReasonData,
      saveSectionToTemp: mockSaveSectionToTemp,
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

      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

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

      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });

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
        const wrapper = container.querySelector('.w-full.flex.flex-col');
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

      await waitFor(() => {
        expect(mockShowConfirmModal).toHaveBeenCalled();
      });

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

      const progressButton = screen.getByTestId('stepper-progress-button');
      await user.click(progressButton);

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

      await waitFor(() => {
        expect(mockShowConfirmModal).toHaveBeenCalledWith(
          expect.objectContaining({
            description: 'Please wash/sanitize your hands',
          })
        );
      });

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

      const mainContainer = container.querySelector('.w-full.flex.flex-col');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should render single-column layout for default UI', () => {
      const { container } = render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      const stackContainer = container.querySelector('.flex.flex-col.gap-4.mt-4');
      expect(stackContainer).toBeInTheDocument();
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

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);

      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });

      const completeButton = screen.getByTestId('stepper-complete-button');
      await user.click(completeButton);

      expect(mockBuildVisitSummary).toHaveBeenCalled();
      expect(mockSetVisitReasonData).toHaveBeenCalledWith(
        expect.anything(),
        ['Fever'],
        [{ label: 'Duration', value: '3 days' }],
        [
          {
            title: 'Summary',
            items: [{ type: 'labelValue', label: 'Duration', value: '3 days' }],
          },
        ]
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
        ],
        [
          {
            title: 'Summary',
            items: [
              {
                type: 'subheading',
                heading: 'Symptoms',
                values: ['Cough', 'Fever'],
              },
              { type: 'labelValue', label: 'Duration', value: '5 days' },
            ],
          },
        ]
      );
    });

    it('should handle schema with no item property (stableSchema?.item ?? [])', async () => {
      const user = userEvent.setup();

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
        [{ label: 'Notes', value: '' }],
        [
          {
            title: 'Summary',
            items: [{ type: 'labelValue', label: 'Notes', value: null }],
          },
        ]
      );
    });
  });

  describe('Review Mode', () => {
    const savedAnswers = { q1: 'answer1', q2: 'answer2' };

    it('should show stepper immediately when savedAnswers exists', () => {
      mockUseStartVisitData.mockReturnValue({
        data: { vitals: null, visitReason: { answers: savedAnswers, reasonNames: ['Fever'], details: [] }, physicalExam: null, medicalHistory: null, medicalHistoryAnswers: null },
        setVisitReasonData: mockSetVisitReasonData,
        clearVisitReasonData: mockClearVisitReasonData,
        saveSectionToTemp: mockSaveSectionToTemp,
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

      expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();

      expect(screen.queryByTestId('visit-reason-footer')).not.toBeInTheDocument();
    });

    it('should pass initialAnswers to AyuStepperContainer', () => {
      mockUseStartVisitData.mockReturnValue({
        data: { vitals: null, visitReason: { answers: savedAnswers, reasonNames: ['Fever'], details: [] }, physicalExam: null, medicalHistory: null, medicalHistoryAnswers: null },
        setVisitReasonData: mockSetVisitReasonData,
        clearVisitReasonData: mockClearVisitReasonData,
        saveSectionToTemp: mockSaveSectionToTemp,
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
        clearVisitReasonData: mockClearVisitReasonData,
        saveSectionToTemp: mockSaveSectionToTemp,
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
      expect(screen.getByText('Save & Next')).toBeInTheDocument();
    });

    it('should switch to selection view (not previous section) when Back is clicked in review mode', async () => {
      const user = userEvent.setup();
      mockUseStartVisitData.mockReturnValue({
        data: { vitals: null, visitReason: { answers: savedAnswers, reasonNames: ['Fever'], details: [] }, physicalExam: null, medicalHistory: null, medicalHistoryAnswers: null },
        setVisitReasonData: mockSetVisitReasonData,
        clearVisitReasonData: mockClearVisitReasonData,
        saveSectionToTemp: mockSaveSectionToTemp,
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
        clearVisitReasonData: mockClearVisitReasonData,
        saveSectionToTemp: mockSaveSectionToTemp,
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
        clearVisitReasonData: mockClearVisitReasonData,
        saveSectionToTemp: mockSaveSectionToTemp,
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

      await user.click(screen.getByText('Save & Next'));
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

      const nextButton = screen.getByTestId('footer-next-button');
      await user.click(nextButton);
      const onConfirm = mockShowConfirmModal.mock.calls[0][0].onConfirm;
      onConfirm();

      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });

      expect(screen.queryByText('Back')).not.toBeInTheDocument();
      expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
    });

    it('should directly call onProgressUpdate and onNextQuestion in review mode (no wash-hands modal)', async () => {
      const user = userEvent.setup();
      mockUseStartVisitData.mockReturnValue({
        data: { vitals: null, visitReason: { answers: savedAnswers, reasonNames: ['Fever'], details: [] }, physicalExam: null, medicalHistory: null, medicalHistoryAnswers: null },
        setVisitReasonData: mockSetVisitReasonData,
        clearVisitReasonData: mockClearVisitReasonData,
        saveSectionToTemp: mockSaveSectionToTemp,
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

      expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();

      mockShowConfirmModal.mockClear();
      const completeButton = screen.getByTestId('stepper-complete-button');
      await user.click(completeButton);

      expect(mockOnProgressUpdate).toHaveBeenCalledWith(1, 1);
      expect(mockOnNextQuestion).toHaveBeenCalled();

      expect(mockShowConfirmModal).not.toHaveBeenCalled();
    });

    it('should not render stepper when savedAnswers exists but selectedComplaints is empty', () => {
      mockUseStartVisitData.mockReturnValue({
        data: { vitals: null, visitReason: { answers: savedAnswers, reasonNames: ['Fever'], details: [] }, physicalExam: null, medicalHistory: null, medicalHistoryAnswers: null },
        setVisitReasonData: mockSetVisitReasonData,
        clearVisitReasonData: mockClearVisitReasonData,
        saveSectionToTemp: mockSaveSectionToTemp,
      } as any);

      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Fever'],
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

      expect(screen.queryByTestId('ayu-stepper-container')).not.toBeInTheDocument();
      expect(screen.getByTestId('visit-reason-footer')).toBeInTheDocument();
    });
  });

  describe('handleRemoveReason (deselect confirm dialog)', () => {
    it('should remove reason silently when there are no answers and no schema', async () => {
      const user = userEvent.setup();
      const removeReason = vi.fn();
      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Fever'],
        selectedComplaints: [createMockAyuJsonItem()],
        removeReason,
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      await user.click(screen.getByTestId('remove-reason-Fever'));

      expect(removeReason).toHaveBeenCalledWith('Fever');
      expect(mockShowConfirmModal).not.toHaveBeenCalled();
      expect(mockClearVisitReasonData).not.toHaveBeenCalled();
    });

    it('should open confirm dialog when saved answers exist', async () => {
      const user = userEvent.setup();
      const savedAnswers = { q1: 'a' };
      const removeReason = vi.fn();

      mockUseStartVisitData.mockReturnValue({
        data: {
          vitals: null,
          visitReason: { answers: savedAnswers, reasonNames: ['Fever'], details: [] },
          physicalExam: null,
          medicalHistory: null,
          medicalHistoryAnswers: null,
        },
        setVisitReasonData: mockSetVisitReasonData,
        clearVisitReasonData: mockClearVisitReasonData,
        saveSectionToTemp: mockSaveSectionToTemp,
      } as any);

      mockTransformFhirToAyu.mockReturnValue({
        linkId: 'root',
        type: 'group' as const,
        item: [],
      });

      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Fever'],
        selectedComplaints: [createMockAyuJsonItem()],
        removeReason,
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
        />
      );

      // Trigger Back to surface the picker UI (chip is rendered there).
      await user.click(screen.getByText('Back'));
      await user.click(screen.getByTestId('remove-reason-Fever'));

      expect(mockShowConfirmModal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Remove visit reason?',
          confirmText: 'Yes',
          cancelText: 'No',
          type: 'confirm',
          onConfirm: expect.any(Function),
        })
      );
      // Reason is not removed and data is not cleared until the user confirms.
      expect(removeReason).not.toHaveBeenCalled();
      expect(mockClearVisitReasonData).not.toHaveBeenCalled();
    });

    it('should clear data, reset progress, and remove reason when confirm is clicked', async () => {
      const user = userEvent.setup();
      const savedAnswers = { q1: 'a' };
      const removeReason = vi.fn();

      mockUseStartVisitData.mockReturnValue({
        data: {
          vitals: null,
          visitReason: { answers: savedAnswers, reasonNames: ['Fever'], details: [] },
          physicalExam: null,
          medicalHistory: null,
          medicalHistoryAnswers: null,
        },
        setVisitReasonData: mockSetVisitReasonData,
        clearVisitReasonData: mockClearVisitReasonData,
        saveSectionToTemp: mockSaveSectionToTemp,
      } as any);

      mockTransformFhirToAyu.mockReturnValue({
        linkId: 'root',
        type: 'group' as const,
        item: [],
      });

      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Fever'],
        selectedComplaints: [createMockAyuJsonItem()],
        removeReason,
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

      await user.click(screen.getByText('Back'));
      await user.click(screen.getByTestId('remove-reason-Fever'));

      const onConfirm = mockShowConfirmModal.mock.calls.at(-1)?.[0]
        .onConfirm as () => void;
      onConfirm();

      expect(mockClearVisitReasonData).toHaveBeenCalled();
      expect(mockSaveSectionToTemp).toHaveBeenCalledWith({
        visitReason: null,
        confirmedReasons: [],
      });
      // Reset to 1/0 so the SideLoader (gated on totalQuestions > 1) hides.
      expect(mockOnProgressUpdate).toHaveBeenCalledWith(1, 0);
      expect(removeReason).toHaveBeenCalledWith('Fever');
    });

    it('should notify the parent to clear downstream sections (PE/MH) on confirm', async () => {
      const user = userEvent.setup();
      const onProtocolCleared = vi.fn();
      const savedAnswers = { q1: 'a' };

      mockUseStartVisitData.mockReturnValue({
        data: {
          vitals: null,
          visitReason: { answers: savedAnswers, reasonNames: ['Fever'], details: [] },
          physicalExam: null,
          medicalHistory: null,
          medicalHistoryAnswers: null,
        },
        setVisitReasonData: mockSetVisitReasonData,
        clearVisitReasonData: mockClearVisitReasonData,
        saveSectionToTemp: mockSaveSectionToTemp,
      } as any);

      mockTransformFhirToAyu.mockReturnValue({
        linkId: 'root',
        type: 'group' as const,
        item: [],
      });

      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Fever'],
        selectedComplaints: [createMockAyuJsonItem()],
        removeReason: vi.fn(),
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
          onProtocolCleared={onProtocolCleared}
        />
      );

      await user.click(screen.getByText('Back'));
      await user.click(screen.getByTestId('remove-reason-Fever'));

      // Not cleared until the user actually confirms.
      expect(onProtocolCleared).not.toHaveBeenCalled();

      const onConfirm = mockShowConfirmModal.mock.calls.at(-1)?.[0]
        .onConfirm as () => void;
      onConfirm();

      expect(onProtocolCleared).toHaveBeenCalledTimes(1);
    });
  });

  describe('summaryShown footer visibility (Back/Save & Next after cancelling summary)', () => {
    it('should show Back and Save & Next once the summary modal has been opened', async () => {
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

      // Initially in fresh stepper mode → footer hidden (no answers, no summary yet).
      expect(screen.queryByText('Back')).not.toBeInTheDocument();
      expect(screen.queryByText('Save & Next')).not.toBeInTheDocument();

      // Simulate the stepper's summary modal being opened.
      await user.click(screen.getByTestId('stepper-summary-shown'));

      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Save & Next')).toBeInTheDocument();
    });

    it('should reset summaryShown when entering the stepper afresh from confirm', async () => {
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
          onProgressUpdate={mockOnProgressUpdate}
          visitReasons={defaultVisitReasons}
        />
      );

      // First confirm → enter stepper → open summary → footer shown.
      await user.click(screen.getByTestId('footer-next-button'));
      mockShowConfirmModal.mock.calls[0][0].onConfirm();
      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('stepper-summary-shown'));
      expect(screen.getByText('Save & Next')).toBeInTheDocument();

      // Back to picker.
      await user.click(screen.getByText('Back'));
      expect(screen.queryByTestId('ayu-stepper-container')).not.toBeInTheDocument();

      // Re-confirm → stepper remounts → summaryShown must be reset.
      mockShowConfirmModal.mockClear();
      await user.click(screen.getByTestId('footer-next-button'));
      mockShowConfirmModal.mock.calls[0][0].onConfirm();
      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });

      // Footer should be hidden again on fresh stepper entry.
      expect(screen.queryByText('Save & Next')).not.toBeInTheDocument();
    });
  });

  describe('Back button persists in-progress answers and resets progress', () => {
    it('should snapshot answers via getAnswers and persist them on Back', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [],
      };

      const inProgressAnswers = { q1: 'partial', q2: 7 };
      mockStepperGetAnswers.mockReturnValue(inProgressAnswers);

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
          onProgressUpdate={mockOnProgressUpdate}
          visitReasons={defaultVisitReasons}
        />
      );

      await user.click(screen.getByTestId('footer-next-button'));
      mockShowConfirmModal.mock.calls[0][0].onConfirm();
      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });

      // Surface the footer so Back is clickable.
      await user.click(screen.getByTestId('stepper-summary-shown'));
      await user.click(screen.getByText('Back'));

      expect(mockStepperGetAnswers).toHaveBeenCalled();
      expect(mockSetVisitReasonData).toHaveBeenCalledWith(
        inProgressAnswers,
        ['Fever'],
        []
      );
      expect(mockSaveSectionToTemp).toHaveBeenCalledWith({
        visitReason: {
          answers: inProgressAnswers,
          reasonNames: ['Fever'],
          details: [],
        },
        confirmedReasons: ['Fever'],
      });
      // Progress reset so the SideLoader hides on the picker screen.
      expect(mockOnProgressUpdate).toHaveBeenCalledWith(1, 0);
    });

    it('should not persist when there are no answers to snapshot', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [],
      };

      mockStepperGetAnswers.mockReturnValue({});
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
          onProgressUpdate={mockOnProgressUpdate}
          visitReasons={defaultVisitReasons}
        />
      );

      await user.click(screen.getByTestId('footer-next-button'));
      mockShowConfirmModal.mock.calls[0][0].onConfirm();
      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('stepper-summary-shown'));

      mockSetVisitReasonData.mockClear();
      mockSaveSectionToTemp.mockClear();

      await user.click(screen.getByText('Back'));

      expect(mockSetVisitReasonData).not.toHaveBeenCalled();
      expect(mockSaveSectionToTemp).not.toHaveBeenCalled();
      // Progress still resets regardless.
      expect(mockOnProgressUpdate).toHaveBeenCalledWith(1, 0);
    });

    it('should handle getAnswers returning undefined (nullish fallback)', async () => {
      const user = userEvent.setup();
      const mockSchema = {
        linkId: 'root',
        type: 'group' as const,
        item: [],
      };

      mockStepperGetAnswers.mockReturnValue(undefined as unknown as object);
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
          onProgressUpdate={mockOnProgressUpdate}
          visitReasons={defaultVisitReasons}
        />
      );

      await user.click(screen.getByTestId('footer-next-button'));
      mockShowConfirmModal.mock.calls[0][0].onConfirm();
      await waitFor(() => {
        expect(screen.getByTestId('ayu-stepper-container')).toBeInTheDocument();
      });
      await user.click(screen.getByTestId('stepper-summary-shown'));

      mockSetVisitReasonData.mockClear();
      mockSaveSectionToTemp.mockClear();

      await user.click(screen.getByText('Back'));

      // getAnswers() returned undefined → fallback to {} → no keys → no persist
      expect(mockSetVisitReasonData).not.toHaveBeenCalled();
      expect(mockSaveSectionToTemp).not.toHaveBeenCalled();
      expect(mockOnProgressUpdate).toHaveBeenCalledWith(1, 0);
    });
  });

  describe('onStepperActiveChange (Assessment Progress loader gating)', () => {
    it('should report inactive on the selection screen (showStepper false)', () => {
      const onStepperActiveChange = vi.fn();

      mockUseStartVisitData.mockReturnValue({
        data: { vitals: null, visitReason: null, physicalExam: null, medicalHistory: null, medicalHistoryAnswers: null },
        setVisitReasonData: mockSetVisitReasonData,
        clearVisitReasonData: mockClearVisitReasonData,
        saveSectionToTemp: mockSaveSectionToTemp,
      } as any);

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
          onStepperActiveChange={onStepperActiveChange}
        />
      );

      expect(onStepperActiveChange).toHaveBeenLastCalledWith(false);
    });

    it('should report active once the stepper is showing with a schema', () => {
      const onStepperActiveChange = vi.fn();

      // savedAnswers + selectedComplaints → showStepper true and ayuSchema set.
      mockUseStartVisitData.mockReturnValue({
        data: { vitals: null, visitReason: { answers: { q1: 'a' }, reasonNames: ['Fever'], details: [] }, physicalExam: null, medicalHistory: null, medicalHistoryAnswers: null },
        setVisitReasonData: mockSetVisitReasonData,
        clearVisitReasonData: mockClearVisitReasonData,
        saveSectionToTemp: mockSaveSectionToTemp,
      } as any);

      mockTransformFhirToAyu.mockReturnValue({ linkId: 'root', type: 'group' as const, item: [] });

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
          onStepperActiveChange={onStepperActiveChange}
        />
      );

      expect(onStepperActiveChange).toHaveBeenLastCalledWith(true);
    });

    it('should report inactive when showStepper is true but no schema is built yet', () => {
      const onStepperActiveChange = vi.fn();

      // savedAnswers present but no selectedComplaints → showStepper true, ayuSchema null.
      mockUseStartVisitData.mockReturnValue({
        data: { vitals: null, visitReason: { answers: { q1: 'a' }, reasonNames: ['Fever'], details: [] }, physicalExam: null, medicalHistory: null, medicalHistoryAnswers: null },
        setVisitReasonData: mockSetVisitReasonData,
        clearVisitReasonData: mockClearVisitReasonData,
        saveSectionToTemp: mockSaveSectionToTemp,
      } as any);

      defaultVisitReasons = createDefaultVisitReasons({
        selectedReasons: ['Fever'],
        selectedComplaints: [],
      });

      render(
        <VisitReason
          questionIndex={0}
          onNextQuestion={mockOnNextQuestion}
          onPrevQuestion={mockOnPrevQuestion}
          visitReasons={defaultVisitReasons}
          onStepperActiveChange={onStepperActiveChange}
        />
      );

      expect(onStepperActiveChange).toHaveBeenLastCalledWith(false);
    });
  });
});
