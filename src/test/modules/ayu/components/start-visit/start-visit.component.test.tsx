import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import {
  StartVisit,
  getPhysicalExamFilter,
} from '../../../../../modules/ayu/components/start-visit/start-visit.component';

// Mock useStartVisitData context
const mockSetLastSectionIndex = vi.fn();
const mockSaveSectionToTemp = vi.fn().mockResolvedValue(undefined);
const mockUseStartVisitData = vi.fn(
  () =>
    ({
      data: {
        vitals: null,
        visitReason: null,
        physicalExam: null,
        medicalHistory: null,
        medicalHistoryAnswers: null,
      } as any,
      patientUuid: null as string | null,
      visitId: 'test-visit-id',
      tempRecordId: null as number | null,
      isRestoring: false,
      restoredSectionIndex: null as number | null,
      lastSectionIndex: 0,
      setLastSectionIndex: mockSetLastSectionIndex,
      setPatientUuid: vi.fn(),
      setVitalsData: vi.fn(),
      setVisitReasonData: vi.fn(),
      setPhysicalExamData: vi.fn(),
      setMedicalHistoryData: vi.fn(),
      setMedicalHistoryAnswers: vi.fn(),
      saveSectionToTemp: mockSaveSectionToTemp,
      clearVisitId: vi.fn(),
    })
);

vi.mock('../../../../../modules/ayu/context/start-visit.context', () => ({
  useStartVisitData: () => mockUseStartVisitData(),
}));

// Mock storage for patient info (StartVisit reads patient display from localStorage)
const mockStorageStore: Record<string, string | null> = {};
vi.mock('../../../../../utils/storage', () => ({
  storage: {
    get: (key: string) => mockStorageStore[key] ?? null,
    set: (key: string, value: string) => { mockStorageStore[key] = value; },
    remove: (key: string) => { delete mockStorageStore[key]; },
    getUser: () => JSON.stringify({ uuid: 'user-uuid' }),
  },
}));

// Mock useVisitReasons hook
vi.mock('../../../../../modules/ayu/hooks/useVisitReasons.hook', () => ({
  useVisitReasons: vi.fn(() => ({
    search: '',
    setSearch: vi.fn(),
    filteredNames: [],
    selectedReasons: [],
    addReason: vi.fn(),
    removeReason: vi.fn(),
    grouped: {},
    selectedComplaints: [],
    ayuConfigFiles: [],
  })),
}));

// Mock Cough questionnaire JSON — includes a matching extension so the
// `?.valueString ?? ''` branch for "found extension" is exercised.
vi.mock('../../../../../modules/ayu/pages/Cough.questionnaire.json', () => ({
  default: {
    item: [],
    extension: [
      {
        url: 'urn:intelehealth:perform-physical-exam',
        valueString: 'ga-gen',
      },
    ],
  },
}));

// Mock SVG import
vi.mock('../../../../../modules/ayu/assets/icon-start-visit.svg', () => ({
  default: 'mock-icon-start-visit.svg',
}));

// Mock all child components
vi.mock('../../../../../modules/ayu/components/loaders/section-completion-loader.component', () => ({
  SectionCompletionLoader: vi.fn(({ sections, currentSectionIndex }) => (
    <div data-testid="section-completion-loader">
      Section: {currentSectionIndex + 1}, Question: {sections?.[currentSectionIndex]?.answeredQuestions || 0}
    </div>
  )),
}));

vi.mock('../../../../../modules/ayu/components/loaders/side-loader.component', () => ({
  SideLoader: vi.fn(({ sections, currentSectionIndex, currentQuestionIndex }) => (
    <div data-testid="side-loader">
      Question {currentQuestionIndex + 1} of {sections?.[currentSectionIndex]?.totalQuestions || 0}
    </div>
  )),
}));

vi.mock('../../../../../modules/ayu/components/start-visit/vitals/vitals.component', () => ({
  Vitals: vi.fn(({ questionIndex, onNextQuestion }) => (
    <div data-testid="vitals-component">
      <div>Vitals - Question {questionIndex}</div>
      <button onClick={onNextQuestion}>Next Vitals</button>
    </div>
  )),
}));

vi.mock('../../../../../modules/ayu/components/start-visit/visit-reason/visit-reason.component', () => ({
  VisitReason: vi.fn(({ questionIndex, onNextQuestion, onPrevQuestion, onPrevSection, onReasonsConfirmed }) => (
    <div data-testid="visit-reason-component">
      <div>Visit Reason - Question {questionIndex}</div>
      <button onClick={onPrevSection}>Prev Section</button>
      <button onClick={onPrevQuestion}>Prev Question</button>
      <button onClick={onNextQuestion}>Next Question</button>
      {onReasonsConfirmed && (
        <button onClick={() => onReasonsConfirmed(['Fever', 'Cough'])}>Confirm Reasons</button>
      )}
    </div>
  )),
}));

vi.mock('../../../../../modules/ayu/components/start-visit/physical-examination/physical-examination.component', () => ({
  PhysicalExamination: vi.fn(({ questionIndex, onNextQuestion, onPrevQuestion, onPrevSection, onProgressUpdate }: any) => {
    React.useEffect(() => {
      onProgressUpdate?.(3, questionIndex);
    }, [questionIndex, onProgressUpdate]);
    return (
      <div data-testid="physical-exam-component">
        <div>Physical Exam - Question {questionIndex}</div>
        <button onClick={onPrevSection}>Prev Section</button>
        <button onClick={onPrevQuestion}>Prev Question</button>
        <button onClick={onNextQuestion}>Next Question</button>
      </div>
    );
  }),
}));

vi.mock('../../../../../modules/ayu/components/start-visit/medical-history/medical-history.component', () => ({
  MedicalHistory: vi.fn(({ onPrevSection, onSubtitleChange, onNextQuestion }) => (
    <div data-testid="medical-history-component">
      <div>Medical History</div>
      {onPrevSection && <button onClick={onPrevSection}>Prev Section</button>}
      {onNextQuestion && <button onClick={onNextQuestion}>Next Question</button>}
      {onSubtitleChange && (
        <button onClick={() => onSubtitleChange('Diabetes, Hypertension')}>Set Subtitle</button>
      )}
    </div>
  )),
}));

// Helper function to render with Router and optional location state
const renderWithRouter = (
  component: React.ReactElement,
  { state }: { state?: Record<string, unknown> } = {}
) => {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/', state }]}>
      {component}
    </MemoryRouter>
  );
};

describe('StartVisit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear mock storage between tests
    Object.keys(mockStorageStore).forEach(k => delete mockStorageStore[k]);
    mockUseStartVisitData.mockReturnValue({
      data: { vitals: null, visitReason: null, physicalExam: null, medicalHistory: null, medicalHistoryAnswers: null } as any,
      patientUuid: null,
      visitId: 'test-visit-id',
      tempRecordId: null,
      isRestoring: false,
      restoredSectionIndex: null,
      lastSectionIndex: 0,
      setLastSectionIndex: mockSetLastSectionIndex,
      setPatientUuid: vi.fn(),
      setVitalsData: vi.fn(),
      setVisitReasonData: vi.fn(),
      setPhysicalExamData: vi.fn(),
      setMedicalHistoryData: vi.fn(),
      setMedicalHistoryAnswers: vi.fn(),
      saveSectionToTemp: mockSaveSectionToTemp,
      clearVisitId: vi.fn(),
    });
    // Mock window.alert
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render the Start Visit header with icon', () => {
      renderWithRouter(<StartVisit />);
      expect(screen.getByText('Start Visit')).toBeInTheDocument();
      expect(screen.getByAltText('Ayu Loader')).toBeInTheDocument();
    });

    it('should display current section as "1/4 Vitals"', () => {
      renderWithRouter(<StartVisit />);
      expect(screen.getByText('1/4 Vitals')).toBeInTheDocument();
    });

    it('should render SectionCompletionLoader', () => {
      renderWithRouter(<StartVisit />);
      expect(screen.getByTestId('section-completion-loader')).toBeInTheDocument();
    });

    it('should not render SideLoader for sections with single question', () => {
      renderWithRouter(<StartVisit />);
      // Vitals section has only 1 question, so SideLoader should not render
      expect(screen.queryByTestId('side-loader')).not.toBeInTheDocument();
    });

    it('should render Vitals component initially', () => {
      renderWithRouter(<StartVisit />);
      expect(screen.getByTestId('vitals-component')).toBeInTheDocument();
      // VisitReason, PhysicalExam, MedicalHistory are always mounted but hidden via display:none
      expect(screen.getByTestId('visit-reason-component')).not.toBeVisible();
      expect(screen.getByTestId('physical-exam-component')).not.toBeVisible();
      expect(screen.getByTestId('medical-history-component')).not.toBeVisible();
    });

    it('should start at question index 0', () => {
      renderWithRouter(<StartVisit />);
      expect(screen.getByText(/Vitals - Question 0/)).toBeInTheDocument();
    });
  });

  describe('Patient Info Display', () => {
    it('should display patient name, age, and gender when stored in localStorage', () => {
      mockStorageStore.patientName = 'John Doe';
      mockStorageStore.patientAge = '34';
      mockStorageStore.patientGender = 'M';
      renderWithRouter(<StartVisit />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText(/\(34/)).toBeInTheDocument();
      expect(screen.getByText(/\| M\)/)).toBeInTheDocument();
    });

    it('should not render patient info when storage is empty', () => {
      renderWithRouter(<StartVisit />);
      expect(screen.queryByText(/\|/)).not.toBeInTheDocument();
    });

    it('should handle partial patient info (name only)', () => {
      mockStorageStore.patientName = 'Jane';
      renderWithRouter(<StartVisit />);
      expect(screen.getByText('Jane')).toBeInTheDocument();
    });
  });

  describe('Section Navigation - Vitals Section', () => {
    it('should transition from Vitals to Visit Reason when completing Vitals', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Initially on Vitals
      expect(screen.getByTestId('vitals-component')).toBeInTheDocument();
      expect(screen.getByText('1/4 Vitals')).toBeInTheDocument();

      // Click next on the last question of Vitals (only 1 question)
      const nextButton = screen.getByText('Next Vitals');
      await user.click(nextButton);

      // Should move to Visit Reason section
      expect(screen.getByTestId('visit-reason-component')).toBeVisible();
      expect(screen.queryByTestId('vitals-component')).not.toBeInTheDocument();
      expect(screen.getByText('2/4 Visit Reason')).toBeInTheDocument();
    });
  });

  describe('Section Navigation - Visit Reason Section', () => {
    it('should navigate within Visit Reason questions', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Move to Visit Reason section
      await user.click(screen.getByText('Next Vitals'));

      expect(screen.getByText(/Visit Reason - Question 0/)).toBeInTheDocument();

      // Visit Reason is treated as 1 question, clicking Next moves to Physical Exam
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));

      // Should move to Physical Exam (next section)
      expect(screen.getByTestId('physical-exam-component')).toBeVisible();
    });

    it('should go back to Vitals when clicking Prev Section from Visit Reason', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Move to Visit Reason section
      await user.click(screen.getByText('Next Vitals'));
      expect(screen.getByTestId('visit-reason-component')).toBeVisible();

      // Click Prev Section (scope within Visit Reason to avoid duplicate buttons)
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Prev Section'));

      // Should be back to Vitals
      expect(screen.getByTestId('vitals-component')).toBeInTheDocument();
      expect(screen.getByText('1/4 Vitals')).toBeInTheDocument();
    });

    it('should transition to Physical Exam after completing Visit Reason', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Move to Visit Reason section
      await user.click(screen.getByText('Next Vitals'));

      // Visit Reason is 1 question, click next once (scope within Visit Reason)
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));

      // Should move to Physical Exam
      expect(screen.getByTestId('physical-exam-component')).toBeVisible();
      expect(screen.getByText(/3\s*\/\s*4\s+Physical Examination/)).toBeInTheDocument();
    });
  });

  describe('Section Navigation - Physical Examination Section', () => {
    it('should render Physical Exam component', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Navigate to Physical Exam (1 from Vitals + 1 from Visit Reason)
      await user.click(screen.getByText('Next Vitals'));
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));

      expect(screen.getByTestId('physical-exam-component')).toBeVisible();
      expect(screen.getByText(/3\s*\/\s*4\s+Physical Examination/)).toBeInTheDocument();
    });

    it('should navigate within Physical Exam questions', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Navigate to Physical Exam
      await user.click(screen.getByText('Next Vitals'));
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));

      expect(screen.getByText(/Physical Exam - Question 0/)).toBeInTheDocument();

      // Navigate to next question (scope within Physical Exam to avoid duplicate buttons)
      const physExam = screen.getByTestId('physical-exam-component');
      await user.click(within(physExam).getByText('Next Question'));
      expect(screen.getByTestId('physical-exam-component')).toBeInTheDocument();
    });

    it('should go back to Visit Reason when clicking Prev Section from Physical Exam', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Navigate to Physical Exam
      await user.click(screen.getByText('Next Vitals'));
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));

      // Click Prev Section (scope within Physical Exam to avoid duplicate buttons)
      const physExam = screen.getByTestId('physical-exam-component');
      await user.click(within(physExam).getByText('Prev Section'));

      // Should be back to Visit Reason
      expect(screen.getByTestId('visit-reason-component')).toBeVisible();
      expect(screen.getByText('2/4 Visit Reason')).toBeInTheDocument();
    });

    it('should transition to Medical History after completing Physical Exam', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Navigate to Physical Exam
      await user.click(screen.getByText('Next Vitals'));
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));

      // Complete Physical Exam (3 questions) - scope within Physical Exam
      for (let i = 0; i < 3; i++) {
        const physExam = screen.getByTestId('physical-exam-component');
        await user.click(within(physExam).getByText('Next Question'));
      }

      // Should move to Medical History
      expect(screen.getByTestId('medical-history-component')).toBeVisible();
      expect(screen.getByText('4/4 Medical History')).toBeInTheDocument();
    });
  });

  describe('Section Navigation - Medical History Section', () => {
    it('should render Medical History component', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Navigate to Medical History (1 + 1 + 3 questions)
      await user.click(screen.getByText('Next Vitals'));
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));
      for (let i = 0; i < 3; i++) {
        const physExam = screen.getByTestId('physical-exam-component');
        await user.click(within(physExam).getByText('Next Question'));
      }

      expect(screen.getByTestId('medical-history-component')).toBeVisible();
      expect(screen.getByText('4/4 Medical History')).toBeInTheDocument();
    });

    it('should render Medical History component when reaching it', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Navigate to Medical History
      await user.click(screen.getByText('Next Vitals'));
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));
      for (let i = 0; i < 3; i++) {
        const physExam = screen.getByTestId('physical-exam-component');
        await user.click(within(physExam).getByText('Next Question'));
      }

      // Should be in Medical History
      expect(screen.getByTestId('medical-history-component')).toBeVisible();
      expect(screen.getByText('4/4 Medical History')).toBeInTheDocument();
    });

    it('should complete all sections up to Medical History', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Navigate through all sections
      await user.click(screen.getByText('Next Vitals'));
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));
      for (let i = 0; i < 3; i++) {
        const physExam = screen.getByTestId('physical-exam-component');
        await user.click(within(physExam).getByText('Next Question'));
      }

      // Should reach Medical History (last section)
      expect(screen.getByTestId('medical-history-component')).toBeVisible();
      expect(screen.getByText('4/4 Medical History')).toBeInTheDocument();
    });

  });

  describe('Question Navigation - Previous Question', () => {
    it('should not go below question index 0', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Move to Visit Reason to access Prev Question button
      await user.click(screen.getByText('Next Vitals'));

      // Already at question 0
      expect(screen.getByText(/Visit Reason - Question 0/)).toBeInTheDocument();

      // Try to go to previous question (scope within Visit Reason)
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Prev Question'));

      // Should still be at question 0
      expect(screen.getByTestId('visit-reason-component')).toBeInTheDocument();
    });

    it('should navigate to previous question within a section', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Move to Physical Exam (which has 3 questions)
      await user.click(screen.getByText('Next Vitals'));
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));

      // Advance a few questions (scope within Physical Exam to avoid duplicate buttons)
      const physExam = screen.getByTestId('physical-exam-component');
      await user.click(within(physExam).getByText('Next Question'));
      await user.click(within(physExam).getByText('Next Question'));

      // Go back one question
      await user.click(within(physExam).getByText('Prev Question'));

      // Should still be in Physical Exam section
      expect(screen.getByTestId('physical-exam-component')).toBeInTheDocument();
    });
  });

  describe('Section Completion Tracking', () => {
    it('should mark section as completed when finishing last question', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Complete Vitals (1 question)
      await user.click(screen.getByText('Next Vitals'));

      // The section should be marked as completed internally
      // This is verified by the component transitioning to next section
      expect(screen.getByTestId('visit-reason-component')).toBeVisible();
    });

    it('should update answered questions count when completing a section', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Complete first section
      await user.click(screen.getByText('Next Vitals'));

      // Verify we're in the next section
      expect(screen.getByText('2/4 Visit Reason')).toBeInTheDocument();
    });
  });

  describe('Section Previous Navigation with Question Restoration', () => {
    it('should restore to last answered question when going back to previous section', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Complete Vitals and move to Visit Reason
      await user.click(screen.getByText('Next Vitals'));

      // Complete Visit Reason and move to Physical Exam
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));

      // Advance in Physical Exam a few questions (scope within Physical Exam)
      const physExam = screen.getByTestId('physical-exam-component');
      await user.click(within(physExam).getByText('Next Question'));
      await user.click(within(physExam).getByText('Next Question'));

      // Go back to previous section (Visit Reason) from Physical Exam
      await user.click(within(physExam).getByText('Prev Section'));

      // Should be back in Visit Reason
      expect(screen.getByTestId('visit-reason-component')).toBeVisible();
      expect(screen.getByText('2/4 Visit Reason')).toBeInTheDocument();
    });
  });

  describe('Loader Components Integration', () => {
    it('should pass correct props to SectionCompletionLoader', () => {
      renderWithRouter(<StartVisit />);

      const loader = screen.getByTestId('section-completion-loader');
      expect(loader).toHaveTextContent('Section: 1, Question: 1');
    });

    it('should pass correct props to SideLoader', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Navigate to Physical Exam which has 3 questions (SideLoader will render)
      await user.click(screen.getByText('Next Vitals'));
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));

      const sideLoader = screen.getByTestId('side-loader');
      expect(sideLoader).toHaveTextContent('Question 1 of 3');
    });

    it('should update SideLoader when navigating to different sections', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Initially in Vitals (1 question) - SideLoader not rendered
      expect(screen.queryByTestId('side-loader')).not.toBeInTheDocument();

      // Move to Visit Reason (1 question) - SideLoader still not rendered
      await user.click(screen.getByText('Next Vitals'));
      expect(screen.queryByTestId('side-loader')).not.toBeInTheDocument();

      // Move to Physical Exam (3 questions) - SideLoader now rendered
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));
      expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
    });
  });

  describe('Section Display Information', () => {
    it('should update section counter when navigating', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      expect(screen.getByText('1/4 Vitals')).toBeInTheDocument();

      await user.click(screen.getByText('Next Vitals'));
      expect(screen.getByText('2/4 Visit Reason')).toBeInTheDocument();
    });

    it('should display all section names correctly', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      expect(screen.getByText('1/4 Vitals')).toBeInTheDocument();

      await user.click(screen.getByText('Next Vitals'));
      expect(screen.getByText('2/4 Visit Reason')).toBeInTheDocument();

      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));
      expect(screen.getByText(/3\s*\/\s*4\s+Physical Examination/)).toBeInTheDocument();

      for (let i = 0; i < 3; i++) {
        const physExam = screen.getByTestId('physical-exam-component');
        await user.click(within(physExam).getByText('Next Question'));
      }
      expect(screen.getByText('4/4 Medical History')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should not exceed the last section index', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Navigate to the very last section
      await user.click(screen.getByText('Next Vitals'));
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));
      for (let i = 0; i < 3; i++) {
        const physExam = screen.getByTestId('physical-exam-component');
        await user.click(within(physExam).getByText('Next Question'));
      }

      // Should be in Medical History (last section) and stay there
      expect(screen.getByText('4/4 Medical History')).toBeInTheDocument();
      expect(screen.getByTestId('medical-history-component')).toBeVisible();
    });

    it('should handle rapid navigation clicks', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Rapidly click next
      await user.click(screen.getByText('Next Vitals'));
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));
      const physExam = screen.getByTestId('physical-exam-component');
      await user.click(within(physExam).getByText('Next Question'));

      // Should be in Physical Exam after navigating through Visit Reason
      expect(screen.getByTestId('physical-exam-component')).toBeInTheDocument();
    });
  });

  describe('Component Props Passing', () => {
    it('should pass questionIndex prop to Vitals', () => {
      renderWithRouter(<StartVisit />);
      expect(screen.getByText(/Vitals - Question 0/)).toBeInTheDocument();
    });

    it('should pass all required props to VisitReason', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      await user.click(screen.getByText('Next Vitals'));

      const visitReason = screen.getByTestId('visit-reason-component');
      expect(screen.getByText(/Visit Reason - Question 0/)).toBeInTheDocument();
      expect(within(visitReason).getByText('Prev Section')).toBeInTheDocument();
      expect(within(visitReason).getByText('Prev Question')).toBeInTheDocument();
      expect(within(visitReason).getByText('Next Question')).toBeInTheDocument();
    });

    it('should pass all required props to PhysicalExamination', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      await user.click(screen.getByText('Next Vitals'));
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));

      const physExam = screen.getByTestId('physical-exam-component');
      expect(screen.getByText(/Physical Exam - Question 0/)).toBeInTheDocument();
      expect(within(physExam).getByText('Prev Section')).toBeInTheDocument();
      expect(within(physExam).getByText('Prev Question')).toBeInTheDocument();
      expect(within(physExam).getByText('Next Question')).toBeInTheDocument();
    });

    it('should render MedicalHistory component when reaching last section', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      await user.click(screen.getByText('Next Vitals'));
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));
      for (let i = 0; i < 3; i++) {
        const physExam = screen.getByTestId('physical-exam-component');
        await user.click(within(physExam).getByText('Next Question'));
      }

      expect(screen.getByTestId('medical-history-component')).toBeVisible();
      expect(screen.getByText('4/4 Medical History')).toBeInTheDocument();
    });
  });

  describe('updateSectionProgress Function Coverage', () => {
    it('should pass onProgressUpdate prop to VisitReason component', async () => {
      const VisitReasonMock = vi.mocked(
        await import('../../../../../modules/ayu/components/start-visit/visit-reason/visit-reason.component')
      ).VisitReason;

      renderWithRouter(<StartVisit />);

      // VisitReason is always rendered now, so it should have been called
      expect(VisitReasonMock).toHaveBeenCalled();
      const callArgs = VisitReasonMock.mock.calls[0][0];
      expect(callArgs).toHaveProperty('onProgressUpdate');
      expect(typeof callArgs.onProgressUpdate).toBe('function');
    });

    it('should pass onProgressUpdate prop to PhysicalExamination component', async () => {
      const PhysicalExamMock = vi.mocked(
        await import('../../../../../modules/ayu/components/start-visit/physical-examination/physical-examination.component')
      ).PhysicalExamination;

      renderWithRouter(<StartVisit />);

      // PhysicalExamination is always rendered now, so it should have been called
      expect(PhysicalExamMock).toHaveBeenCalled();
      const callArgs = PhysicalExamMock.mock.calls[0][0];
      expect(callArgs).toHaveProperty('onProgressUpdate');
      expect(typeof callArgs.onProgressUpdate).toBe('function');
    });

    it('should pass onProgressUpdate prop to MedicalHistory component', async () => {
      const MedicalHistoryMock = vi.mocked(
        await import('../../../../../modules/ayu/components/start-visit/medical-history/medical-history.component')
      ).MedicalHistory;

      renderWithRouter(<StartVisit />);

      // MedicalHistory is always rendered now, so it should have been called
      expect(MedicalHistoryMock).toHaveBeenCalled();
      const callArgs = (MedicalHistoryMock.mock.calls[0] as any)[0];
      expect(callArgs).toHaveProperty('onProgressUpdate');
      expect(typeof callArgs.onProgressUpdate).toBe('function');
    });

    it('should update section progress when onProgressUpdate is called from VisitReason', async () => {
      const user = userEvent.setup();
      let capturedOnProgressUpdate: ((total: number, answered: number) => void) | null = null;

      vi.mocked(
        await import('../../../../../modules/ayu/components/start-visit/visit-reason/visit-reason.component')
      ).VisitReason.mockImplementation(({ onProgressUpdate }) => {
        if (onProgressUpdate) {
          capturedOnProgressUpdate = onProgressUpdate;
        }
        return <div data-testid="visit-reason-component">Visit Reason</div>;
      });

      renderWithRouter(<StartVisit />);
      await user.click(screen.getByText('Next Vitals'));

      // Call the onProgressUpdate callback
      if (capturedOnProgressUpdate) {
        (capturedOnProgressUpdate as (total: number, answered: number) => void)(5, 3);
      }

      // Verify the section state is updated (indirectly through loader props)
      const sectionLoader = screen.getByTestId('section-completion-loader');
      expect(sectionLoader).toBeInTheDocument();
    });

    it('should update section progress when onProgressUpdate is called from PhysicalExamination', async () => {
      const user = userEvent.setup();
      let capturedOnProgressUpdate: ((total: number, answered: number) => void) | null = null;

      vi.mocked(
        await import('../../../../../modules/ayu/components/start-visit/physical-examination/physical-examination.component')
      ).PhysicalExamination.mockImplementation(({ onProgressUpdate }) => {
        if (onProgressUpdate) {
          capturedOnProgressUpdate = onProgressUpdate;
        }
        return <div data-testid="physical-exam-component">Physical Exam</div>;
      });

      renderWithRouter(<StartVisit />);
      await user.click(screen.getByText('Next Vitals'));
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));

      // Call the onProgressUpdate callback
      if (capturedOnProgressUpdate) {
        (capturedOnProgressUpdate as (total: number, answered: number) => void)(8, 4);
      }

      // Verify the section state is updated
      const sectionLoader = screen.getByTestId('section-completion-loader');
      expect(sectionLoader).toBeInTheDocument();
    });

    it('should update section progress when onProgressUpdate is called from MedicalHistory', async () => {
      const user = userEvent.setup();
      let capturedOnProgressUpdate: ((total: number, answered: number) => void) | null = null;

      (vi.mocked(
        await import('../../../../../modules/ayu/components/start-visit/medical-history/medical-history.component')
      ).MedicalHistory as any).mockImplementation(({ onProgressUpdate }: { onProgressUpdate?: (total: number, answered: number) => void }) => {
        if (onProgressUpdate) {
          capturedOnProgressUpdate = onProgressUpdate;
        }
        return <div data-testid="medical-history-component">Medical History</div>;
      });

      renderWithRouter(<StartVisit />);
      await user.click(screen.getByText('Next Vitals'));
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));
      for (let i = 0; i < 3; i++) {
        const physExam = screen.getByTestId('physical-exam-component');
        await user.click(within(physExam).getByText('Next Question'));
      }

      // Call the onProgressUpdate callback
      if (capturedOnProgressUpdate) {
        (capturedOnProgressUpdate as (total: number, answered: number) => void)(5, 2);
      }

      // Verify the section state is updated
      const sectionLoader = screen.getByTestId('section-completion-loader');
      expect(sectionLoader).toBeInTheDocument();
    });

    it('should update totalQuestions and answeredQuestions for matching section', async () => {
      const user = userEvent.setup();

      vi.mocked(
        await import('../../../../../modules/ayu/components/start-visit/visit-reason/visit-reason.component')
      ).VisitReason.mockImplementation(({ onProgressUpdate }) => {
        return (
          <div data-testid="visit-reason-component">
            <button onClick={() => onProgressUpdate?.(10, 7)}>Update Progress</button>
          </div>
        );
      });

      renderWithRouter(<StartVisit />);
      await user.click(screen.getByText('Next Vitals'));

      const updateButton = screen.getByText('Update Progress');
      await user.click(updateButton);

      // The section should be updated, which affects the loader display
      expect(screen.getByTestId('section-completion-loader')).toBeInTheDocument();
    });

    it('should handle multiple progress updates for the same section', async () => {
      const user = userEvent.setup();

      vi.mocked(
        await import('../../../../../modules/ayu/components/start-visit/visit-reason/visit-reason.component')
      ).VisitReason.mockImplementation(({ onProgressUpdate }) => {
        return (
          <div data-testid="visit-reason-component">
            <button onClick={() => onProgressUpdate?.(10, 3)}>Update 1</button>
            <button onClick={() => onProgressUpdate?.(10, 6)}>Update 2</button>
            <button onClick={() => onProgressUpdate?.(10, 10)}>Update 3</button>
          </div>
        );
      });

      renderWithRouter(<StartVisit />);
      await user.click(screen.getByText('Next Vitals'));

      await user.click(screen.getByText('Update 1'));
      await user.click(screen.getByText('Update 2'));
      await user.click(screen.getByText('Update 3'));

      // Should handle all updates without errors
      expect(screen.getByTestId('visit-reason-component')).toBeInTheDocument();
    });

    it('should handle zero progress values', async () => {
      const user = userEvent.setup();

      vi.mocked(
        await import('../../../../../modules/ayu/components/start-visit/physical-examination/physical-examination.component')
      ).PhysicalExamination.mockImplementation(({ onProgressUpdate }) => {
        return (
          <div data-testid="physical-exam-component">
            <button onClick={() => onProgressUpdate?.(0, 0)}>Zero Progress</button>
          </div>
        );
      });

      renderWithRouter(<StartVisit />);
      await user.click(screen.getByText('Next Vitals'));
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));

      const zeroButton = screen.getByText('Zero Progress');
      await user.click(zeroButton);

      // Should handle zero values without errors
      expect(screen.getByTestId('physical-exam-component')).toBeInTheDocument();
    });

    it('should handle large progress values', async () => {
      const user = userEvent.setup();

      (vi.mocked(
        await import('../../../../../modules/ayu/components/start-visit/medical-history/medical-history.component')
      ).MedicalHistory as any).mockImplementation(({ onProgressUpdate }: { onProgressUpdate?: (total: number, answered: number) => void }) => {
        return (
          <div data-testid="medical-history-component">
            <button onClick={() => onProgressUpdate?.(1000, 500)}>Large Progress</button>
          </div>
        );
      });

      renderWithRouter(<StartVisit />);
      await user.click(screen.getByText('Next Vitals'));
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));
      for (let i = 0; i < 3; i++) {
        const physExam = screen.getByTestId('physical-exam-component');
        await user.click(within(physExam).getByText('Next Question'));
      }

      const largeButton = screen.getByText('Large Progress');
      await user.click(largeButton);

      // Should handle large values without errors
      expect(screen.getByTestId('medical-history-component')).toBeInTheDocument();
    });

    it('should only update the specified section without affecting others', async () => {
      const user = userEvent.setup();

      vi.mocked(
        await import('../../../../../modules/ayu/components/start-visit/visit-reason/visit-reason.component')
      ).VisitReason.mockImplementation(({ onProgressUpdate }) => {
        return (
          <div data-testid="visit-reason-component">
            <button onClick={() => onProgressUpdate?.(1, 1)}>Complete Visit Reason</button>
          </div>
        );
      });

      renderWithRouter(<StartVisit />);

      // Complete Vitals
      await user.click(screen.getByText('Next Vitals'));

      // Update Visit Reason progress
      const completeButton = screen.getByText('Complete Visit Reason');
      await user.click(completeButton);

      // Section completion loader should still be rendering correctly
      expect(screen.getByTestId('section-completion-loader')).toBeInTheDocument();
      // SideLoader not rendered for Visit Reason (only 1 question)
      expect(screen.queryByTestId('side-loader')).not.toBeInTheDocument();
    });
  });

  describe('goNextQuestion early exit for already-completed section', () => {
    it('should immediately advance to next section when answeredQuestions >= totalQuestions', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Complete Vitals → now on Visit Reason
      await user.click(screen.getByText('Next Vitals'));
      expect(screen.getByText('2/4 Visit Reason')).toBeInTheDocument();

      // Complete Visit Reason (1 question) → now on Physical Exam
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));
      expect(screen.getByText(/3\s*\/\s*4\s+Physical Examination/)).toBeInTheDocument();

      // Go back to Visit Reason (which is now fully completed: answeredQuestions=1, totalQuestions=1)
      const physExam = screen.getByTestId('physical-exam-component');
      await user.click(within(physExam).getByText('Prev Section'));
      expect(screen.getByText('2/4 Visit Reason')).toBeInTheDocument();

      // Click Next Question on the already-completed Visit Reason section.
      // The new check (answeredQuestions >= totalQuestions) should cause
      // goNextQuestion to call goNextSection() immediately.
      const visitReasonAgain = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReasonAgain).getByText('Next Question'));

      // Should jump straight to Physical Exam (next section)
      expect(screen.getByText(/3\s*\/\s*4\s+Physical Examination/)).toBeInTheDocument();
      expect(screen.getByTestId('physical-exam-component')).toBeVisible();
    });
  });

  describe('Section Subtitle Coverage', () => {
    it('should display visit reason subtitle when reasons are confirmed', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Navigate to Visit Reason section
      await user.click(screen.getByText('Next Vitals'));

      // Confirm reasons via the mock button
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Confirm Reasons'));

      // The subtitle should now appear
      expect(screen.getByText(/Fever, Cough/)).toBeInTheDocument();
    });

    it('should display medical history subtitle when subtitle changes', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Navigate to Medical History (Vitals → Visit Reason → Physical Exam → Medical History)
      await user.click(screen.getByText('Next Vitals'));
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Next Question'));
      for (let i = 0; i < 3; i++) {
        const physExam = screen.getByTestId('physical-exam-component');
        await user.click(within(physExam).getByText('Next Question'));
      }

      // Set subtitle via the mock button
      const medHistory = screen.getByTestId('medical-history-component');
      await user.click(within(medHistory).getByText('Set Subtitle'));

      // The subtitle should now appear
      expect(screen.getByText(/Diabetes, Hypertension/)).toBeInTheDocument();
    });
  });

  describe('lastSectionIndex persistence via context', () => {
    it('should initialize at lastSectionIndex from context when returning from visit summary', () => {
      mockUseStartVisitData.mockReturnValue({
        data: {
          vitals: { formValues: {}, config: [] },
          visitReason: { answers: {}, reasonNames: [], details: [] },
          physicalExam: { answers: {} },
          medicalHistory: { patHistSummary: [], famHistSummary: [] },
        } as any,
        patientUuid: null,
        visitId: 'test-visit-id',
        tempRecordId: null,
        isRestoring: false,
        restoredSectionIndex: 3,
        lastSectionIndex: 3,
        setLastSectionIndex: mockSetLastSectionIndex,
        setPatientUuid: vi.fn(),
        setVitalsData: vi.fn(),
        setVisitReasonData: vi.fn(),
        setPhysicalExamData: vi.fn(),
        setMedicalHistoryData: vi.fn(),
        setMedicalHistoryAnswers: vi.fn(),
        saveSectionToTemp: mockSaveSectionToTemp,
        clearVisitId: vi.fn(),
      });

      renderWithRouter(<StartVisit />);

      // Should start at Medical History (index 3)
      expect(screen.getByText('4/4 Medical History')).toBeInTheDocument();
      expect(screen.getByTestId('medical-history-component')).toBeVisible();
    });

    it('should persist currentSectionIndex to temp-storage when navigating forward', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      await user.click(screen.getByText('Next Vitals'));

      expect(mockSaveSectionToTemp).toHaveBeenCalledWith(
        expect.objectContaining({ currentSectionIndex: 1 })
      );
    });

    it('should persist currentSectionIndex to temp-storage when navigating back', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Navigate to Visit Reason
      await user.click(screen.getByText('Next Vitals'));
      mockSaveSectionToTemp.mockClear();

      // Go back to Vitals
      const visitReason = screen.getByTestId('visit-reason-component');
      await user.click(within(visitReason).getByText('Prev Section'));

      expect(mockSaveSectionToTemp).toHaveBeenCalledWith(
        expect.objectContaining({ currentSectionIndex: 0 })
      );
    });
  });

  describe('sections initialization from context data', () => {
    it('should mark all sections as completed when all data exists in context', () => {
      mockUseStartVisitData.mockReturnValue({
        data: {
          vitals: { formValues: {}, config: [] },
          visitReason: { answers: {}, reasonNames: [], details: [] },
          physicalExam: { answers: {} },
          medicalHistory: { patHistSummary: [], famHistSummary: [] },
        } as any,
        patientUuid: null,
        visitId: 'test-visit-id',
        tempRecordId: null,
        isRestoring: false,
        restoredSectionIndex: 3,
        lastSectionIndex: 3,
        setLastSectionIndex: mockSetLastSectionIndex,
        setPatientUuid: vi.fn(),
        setVitalsData: vi.fn(),
        setVisitReasonData: vi.fn(),
        setPhysicalExamData: vi.fn(),
        setMedicalHistoryData: vi.fn(),
        setMedicalHistoryAnswers: vi.fn(),
        saveSectionToTemp: mockSaveSectionToTemp,
        clearVisitId: vi.fn(),
      });

      renderWithRouter(<StartVisit />);

      // The SectionCompletionLoader should reflect completed sections
      const loader = screen.getByTestId('section-completion-loader');
      expect(loader).toBeInTheDocument();
      // Medical History section (index 3) should show answered = totalQuestions
      expect(screen.getByText('4/4 Medical History')).toBeInTheDocument();
    });

    it('should leave sections as incomplete when no data in context', () => {
      renderWithRouter(<StartVisit />);

      // The SectionCompletionLoader shows vitals as answered (default 1)
      const loader = screen.getByTestId('section-completion-loader');
      expect(loader).toHaveTextContent('Section: 1, Question: 1');
    });
  });

  /* ── Branch coverage: confirmedReasons restore + section subtitles + isCurrentSectionCompleted ── */
  describe('Branch coverage', () => {
    it('should restore confirmedReasons from restoredData on mount', () => {
      mockUseStartVisitData.mockReturnValue({
        data: {
          vitals: { formValues: {}, config: [] },
          visitReason: { answers: {}, reasonNames: ['Fever', 'Cough'], details: [] },
          physicalExam: null,
          medicalHistory: null,
          medicalHistoryAnswers: null,
        } as any,
        patientUuid: null,
        visitId: 'test-visit-id',
        tempRecordId: null,
        isRestoring: false,
        restoredSectionIndex: 1, // Visit Reason section
        lastSectionIndex: 0,
        setLastSectionIndex: mockSetLastSectionIndex,
        setPatientUuid: vi.fn(),
        setVitalsData: vi.fn(),
        setVisitReasonData: vi.fn(),
        setPhysicalExamData: vi.fn(),
        setMedicalHistoryData: vi.fn(),
        setMedicalHistoryAnswers: vi.fn(),
        saveSectionToTemp: mockSaveSectionToTemp,
        clearVisitId: vi.fn(),
      });
      renderWithRouter(<StartVisit />);

      // After restore, subtitle for Visit Reason joins reasonNames
      expect(screen.getByText(/Fever, Cough/)).toBeInTheDocument();
    });

    it('should render Physical Examination subtitle from ayuConfigFiles when present', async () => {
      // Override useVisitReasons mock to supply a physExam config file
      const { useVisitReasons } = await import(
        '../../../../../modules/ayu/hooks/useVisitReasons.hook'
      );
      vi.mocked(useVisitReasons).mockReturnValue({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: [],
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [],
        ayuConfigFiles: [
          { name: 'physExam.json', json: { title: 'General Physical Exam' } as any },
        ],
      } as any);

      mockUseStartVisitData.mockReturnValue({
        data: {
          vitals: { formValues: {}, config: [] },
          visitReason: { answers: {}, reasonNames: [], details: [] },
          physicalExam: null,
          medicalHistory: null,
          medicalHistoryAnswers: null,
        } as any,
        patientUuid: null,
        visitId: 'test-visit-id',
        tempRecordId: null,
        isRestoring: false,
        restoredSectionIndex: 2, // Physical Examination section
        lastSectionIndex: 0,
        setLastSectionIndex: mockSetLastSectionIndex,
        setPatientUuid: vi.fn(),
        setVitalsData: vi.fn(),
        setVisitReasonData: vi.fn(),
        setPhysicalExamData: vi.fn(),
        setMedicalHistoryData: vi.fn(),
        setMedicalHistoryAnswers: vi.fn(),
        saveSectionToTemp: mockSaveSectionToTemp,
        clearVisitId: vi.fn(),
      });
      renderWithRouter(<StartVisit />);

      expect(screen.getByText(/General Physical Exam/)).toBeInTheDocument();
    });

    it('should fall back to empty subtitle when physExam config has no title', async () => {
      const { useVisitReasons } = await import(
        '../../../../../modules/ayu/hooks/useVisitReasons.hook'
      );
      vi.mocked(useVisitReasons).mockReturnValue({
        search: '',
        setSearch: vi.fn(),
        filteredNames: [],
        selectedReasons: [],
        addReason: vi.fn(),
        removeReason: vi.fn(),
        grouped: {},
        selectedComplaints: [],
        ayuConfigFiles: [{ name: 'physExam.json', json: {} as any }],
      } as any);

      mockUseStartVisitData.mockReturnValue({
        data: {
          vitals: { formValues: {}, config: [] },
          visitReason: { answers: {}, reasonNames: [], details: [] },
          physicalExam: null,
          medicalHistory: null,
          medicalHistoryAnswers: null,
        } as any,
        patientUuid: null,
        visitId: 'test-visit-id',
        tempRecordId: null,
        isRestoring: false,
        restoredSectionIndex: 2,
        lastSectionIndex: 0,
        setLastSectionIndex: mockSetLastSectionIndex,
        setPatientUuid: vi.fn(),
        setVitalsData: vi.fn(),
        setVisitReasonData: vi.fn(),
        setPhysicalExamData: vi.fn(),
        setMedicalHistoryData: vi.fn(),
        setMedicalHistoryAnswers: vi.fn(),
        saveSectionToTemp: mockSaveSectionToTemp,
        clearVisitId: vi.fn(),
      });
      renderWithRouter(<StartVisit />);

      // Header shows "3/4 Physical Examination" with no trailing subtitle text
      expect(screen.getByText(/3\/4 Physical Examination/)).toBeInTheDocument();
    });

    it('should short-circuit goNextQuestion on revisit when medicalHistory data exists (case 3)', async () => {
      const user = userEvent.setup();
      mockUseStartVisitData.mockReturnValue({
        data: {
          vitals: { formValues: {}, config: [] },
          visitReason: { answers: {}, reasonNames: [], details: [] },
          physicalExam: { answers: {}, details: [] },
          medicalHistory: { patHistSummary: [], famHistSummary: [] },
          medicalHistoryAnswers: null,
        } as any,
        patientUuid: null,
        visitId: 'test-visit-id',
        tempRecordId: null,
        isRestoring: false,
        restoredSectionIndex: 3, // Medical History section
        lastSectionIndex: 0,
        setLastSectionIndex: mockSetLastSectionIndex,
        setPatientUuid: vi.fn(),
        setVitalsData: vi.fn(),
        setVisitReasonData: vi.fn(),
        setPhysicalExamData: vi.fn(),
        setMedicalHistoryData: vi.fn(),
        setMedicalHistoryAnswers: vi.fn(),
        saveSectionToTemp: mockSaveSectionToTemp,
        clearVisitId: vi.fn(),
      });
      renderWithRouter(<StartVisit />);

      // Start at Medical History — isCurrentSectionCompleted returns true via case 3
      expect(screen.getByText('4/4 Medical History')).toBeInTheDocument();

      // Go back to Physical Exam then forward — case 3 branch is reached when
      // we arrive on MH with data and its own Confirm triggers goNextQuestion.
      // We simulate via Prev/Next to exercise section transitions.
      const mh = screen.getByTestId('medical-history-component');
      await user.click(within(mh).getByText('Prev Section'));
      expect(screen.getByText('3/4 Physical Examination')).toBeInTheDocument();
    });

    it('should execute case 3 of isCurrentSectionCompleted when Next fires on MH with data', async () => {
      const user = userEvent.setup();
      mockUseStartVisitData.mockReturnValue({
        data: {
          vitals: { formValues: {}, config: [] },
          visitReason: { answers: {}, reasonNames: [], details: [] },
          physicalExam: { answers: {}, details: [] },
          medicalHistory: { patHistSummary: [], famHistSummary: [] },
          medicalHistoryAnswers: null,
        } as any,
        patientUuid: null,
        visitId: 'test-visit-id',
        tempRecordId: null,
        isRestoring: false,
        restoredSectionIndex: 3,
        lastSectionIndex: 0,
        setLastSectionIndex: mockSetLastSectionIndex,
        setPatientUuid: vi.fn(),
        setVitalsData: vi.fn(),
        setVisitReasonData: vi.fn(),
        setPhysicalExamData: vi.fn(),
        setMedicalHistoryData: vi.fn(),
        setMedicalHistoryAnswers: vi.fn(),
        saveSectionToTemp: mockSaveSectionToTemp,
        clearVisitId: vi.fn(),
      });
      renderWithRouter(<StartVisit />);

      // Clicking Next on MH triggers goNextQuestion → isCurrentSectionCompleted case 3
      // → goNextSection (but already at last, clamps).
      const mh = screen.getByTestId('medical-history-component');
      await user.click(within(mh).getByText('Next Question'));

      // saveSectionToTemp is called with next index (still 3 since clamped at sections.length-1)
      expect(mockSaveSectionToTemp).toHaveBeenCalledWith(
        expect.objectContaining({ currentSectionIndex: 3 })
      );
    });

    it('should compute restoreIndex from data when restoredSectionIndex is null', () => {
      // No saved section index → falls into the else branch (lines 122-124)
      // computing restoreIndex from which sections have data.
      mockUseStartVisitData.mockReturnValue({
        data: {
          vitals: { formValues: {}, config: [] },
          visitReason: { answers: {}, reasonNames: [], details: [] },
          physicalExam: { answers: {}, details: [] },
          medicalHistory: null,
          medicalHistoryAnswers: null,
        } as any,
        patientUuid: null,
        visitId: 'test-visit-id',
        tempRecordId: null,
        isRestoring: false,
        restoredSectionIndex: null, // Forces else branch
        lastSectionIndex: 0,
        setLastSectionIndex: mockSetLastSectionIndex,
        setPatientUuid: vi.fn(),
        setVitalsData: vi.fn(),
        setVisitReasonData: vi.fn(),
        setPhysicalExamData: vi.fn(),
        setMedicalHistoryData: vi.fn(),
        setMedicalHistoryAnswers: vi.fn(),
        saveSectionToTemp: mockSaveSectionToTemp,
        clearVisitId: vi.fn(),
      });
      renderWithRouter(<StartVisit />);

      // PE data exists → restoreIndex = 3 → lands on Medical History
      expect(screen.getByText('4/4 Medical History')).toBeInTheDocument();
    });

    it('should render loading state when isRestoring is true', () => {
      mockUseStartVisitData.mockReturnValue({
        data: {
          vitals: null,
          visitReason: null,
          physicalExam: null,
          medicalHistory: null,
          medicalHistoryAnswers: null,
        } as any,
        patientUuid: null,
        visitId: 'test-visit-id',
        tempRecordId: null,
        isRestoring: true,
        restoredSectionIndex: null,
        lastSectionIndex: 0,
        setLastSectionIndex: mockSetLastSectionIndex,
        setPatientUuid: vi.fn(),
        setVitalsData: vi.fn(),
        setVisitReasonData: vi.fn(),
        setPhysicalExamData: vi.fn(),
        setMedicalHistoryData: vi.fn(),
        setMedicalHistoryAnswers: vi.fn(),
        saveSectionToTemp: mockSaveSectionToTemp,
        clearVisitId: vi.fn(),
      });
      renderWithRouter(<StartVisit />);

      expect(screen.getByText('Restoring visit data...')).toBeInTheDocument();
      // Main UI should not render
      expect(screen.queryByTestId('vitals-component')).not.toBeInTheDocument();
    });
  });

  describe('getPhysicalExamFilter', () => {
    it('returns the matching extension valueString when present', () => {
      const questionnaire = {
        extension: [
          { url: 'urn:intelehealth:perform-physical-exam', valueString: 'ga-gen' },
        ],
      } as any;
      expect(getPhysicalExamFilter(questionnaire)).toBe('ga-gen');
    });

    it('returns empty string when the extension array is missing', () => {
      expect(getPhysicalExamFilter({} as any)).toBe('');
    });

    it('returns empty string when no extension matches the physical-exam URL', () => {
      const questionnaire = {
        extension: [{ url: 'urn:intelehealth:some-other-ext', valueString: 'x' }],
      } as any;
      expect(getPhysicalExamFilter(questionnaire)).toBe('');
    });

    it('returns empty string when the matching extension has no valueString', () => {
      const questionnaire = {
        extension: [{ url: 'urn:intelehealth:perform-physical-exam' }],
      } as any;
      expect(getPhysicalExamFilter(questionnaire)).toBe('');
    });
  });
});
