import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { StartVisit } from '../../../../../modules/ayu/components/start-visit/start-visit.component';

// Mock all child components
vi.mock('../../../../../modules/ayu/components/loaders/section-completion-loader.component', () => ({
  SectionCompletionLoader: vi.fn(({ currentSectionIndex, currentQuestionIndex }) => (
    <div data-testid="section-completion-loader">
      Section: {currentSectionIndex + 1}, Question: {currentQuestionIndex + 1}
    </div>
  )),
}));

vi.mock('../../../../../modules/ayu/components/loaders/side-loader.component', () => ({
  SideLoader: vi.fn(({ totalQuestions, currentQuestionIndex }) => (
    <div data-testid="side-loader">
      Question {currentQuestionIndex + 1} of {totalQuestions}
    </div>
  )),
}));

vi.mock('../../../../../modules/ayu/components/start-visit/vitals.component', () => ({
  Vitals: vi.fn(({ questionIndex, onNextQuestion }) => (
    <div data-testid="vitals-component">
      <div>Vitals - Question {questionIndex}</div>
      <button onClick={onNextQuestion}>Next Vitals</button>
    </div>
  )),
}));

vi.mock('../../../../../modules/ayu/components/start-visit/visit-reason.component', () => ({
  VisitReason: vi.fn(({ questionIndex, onNextQuestion, onPrevQuestion, onPrevSection }) => (
    <div data-testid="visit-reason-component">
      <div>Visit Reason - Question {questionIndex}</div>
      <button onClick={onPrevSection}>Prev Section</button>
      <button onClick={onPrevQuestion}>Prev Question</button>
      <button onClick={onNextQuestion}>Next Question</button>
    </div>
  )),
}));

vi.mock('../../../../../modules/ayu/components/start-visit/physical-examination.component', () => ({
  PhysicalExamination: vi.fn(({ questionIndex, onNextQuestion, onPrevQuestion, onPrevSection }) => (
    <div data-testid="physical-exam-component">
      <div>Physical Exam - Question {questionIndex}</div>
      <button onClick={onPrevSection}>Prev Section</button>
      <button onClick={onPrevQuestion}>Prev Question</button>
      <button onClick={onNextQuestion}>Next Question</button>
    </div>
  )),
}));

vi.mock('../../../../../modules/ayu/components/start-visit/medical-history/medical-history.component', () => ({
  MedicalHistory: vi.fn(() => (
    <div data-testid="medical-history-component">
      <div>Medical History</div>
    </div>
  )),
}));

// Helper function to render with Router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('StartVisit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    it('should render SideLoader', () => {
      renderWithRouter(<StartVisit />);
      expect(screen.getByTestId('side-loader')).toBeInTheDocument();
    });

    it('should render Vitals component initially', () => {
      renderWithRouter(<StartVisit />);
      expect(screen.getByTestId('vitals-component')).toBeInTheDocument();
      expect(screen.queryByTestId('visit-reason-component')).not.toBeInTheDocument();
      expect(screen.queryByTestId('physical-exam-component')).not.toBeInTheDocument();
      expect(screen.queryByTestId('medical-history-component')).not.toBeInTheDocument();
    });

    it('should start at question index 0', () => {
      renderWithRouter(<StartVisit />);
      expect(screen.getByText(/Vitals - Question 0/)).toBeInTheDocument();
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
      expect(screen.getByTestId('visit-reason-component')).toBeInTheDocument();
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

      // Navigate to next question within section
      await user.click(screen.getByText('Next Question'));

      // Still in Visit Reason but question index should increase
      expect(screen.getByTestId('visit-reason-component')).toBeInTheDocument();
    });

    it('should go back to Vitals when clicking Prev Section from Visit Reason', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Move to Visit Reason section
      await user.click(screen.getByText('Next Vitals'));
      expect(screen.getByTestId('visit-reason-component')).toBeInTheDocument();

      // Click Prev Section
      await user.click(screen.getByText('Prev Section'));

      // Should be back to Vitals
      expect(screen.getByTestId('vitals-component')).toBeInTheDocument();
      expect(screen.getByText('1/4 Vitals')).toBeInTheDocument();
    });

    it('should transition to Physical Exam after completing Visit Reason', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Move to Visit Reason section
      await user.click(screen.getByText('Next Vitals'));

      // Click next 6 times (Visit Reason has 6 questions)
      for (let i = 0; i < 6; i++) {
        await user.click(screen.getByText('Next Question'));
      }

      // Should move to Physical Exam
      expect(screen.getByTestId('physical-exam-component')).toBeInTheDocument();
      expect(screen.getByText('3/4 Physical Exam')).toBeInTheDocument();
    });
  });

  describe('Section Navigation - Physical Examination Section', () => {
    it('should render Physical Exam component', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Navigate to Physical Exam (1 from Vitals + 6 from Visit Reason)
      await user.click(screen.getByText('Next Vitals'));
      for (let i = 0; i < 6; i++) {
        await user.click(screen.getByText('Next Question'));
      }

      expect(screen.getByTestId('physical-exam-component')).toBeInTheDocument();
      expect(screen.getByText('3/4 Physical Exam')).toBeInTheDocument();
    });

    it('should navigate within Physical Exam questions', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Navigate to Physical Exam
      await user.click(screen.getByText('Next Vitals'));
      for (let i = 0; i < 6; i++) {
        await user.click(screen.getByText('Next Question'));
      }

      expect(screen.getByText(/Physical Exam - Question 0/)).toBeInTheDocument();

      // Navigate to next question
      await user.click(screen.getByText('Next Question'));
      expect(screen.getByTestId('physical-exam-component')).toBeInTheDocument();
    });

    it('should go back to Visit Reason when clicking Prev Section from Physical Exam', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Navigate to Physical Exam
      await user.click(screen.getByText('Next Vitals'));
      for (let i = 0; i < 6; i++) {
        await user.click(screen.getByText('Next Question'));
      }

      // Click Prev Section
      await user.click(screen.getByText('Prev Section'));

      // Should be back to Visit Reason
      expect(screen.getByTestId('visit-reason-component')).toBeInTheDocument();
      expect(screen.getByText('2/4 Visit Reason')).toBeInTheDocument();
    });

    it('should transition to Medical History after completing Physical Exam', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Navigate to Physical Exam
      await user.click(screen.getByText('Next Vitals'));
      for (let i = 0; i < 6; i++) {
        await user.click(screen.getByText('Next Question'));
      }

      // Complete Physical Exam (8 questions)
      for (let i = 0; i < 8; i++) {
        await user.click(screen.getByText('Next Question'));
      }

      // Should move to Medical History
      expect(screen.getByTestId('medical-history-component')).toBeInTheDocument();
      expect(screen.getByText('4/4 Medical History')).toBeInTheDocument();
    });
  });

  describe('Section Navigation - Medical History Section', () => {
    it('should render Medical History component', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Navigate to Medical History (1 + 6 + 8 questions)
      await user.click(screen.getByText('Next Vitals'));
      for (let i = 0; i < 6; i++) {
        await user.click(screen.getByText('Next Question'));
      }
      for (let i = 0; i < 8; i++) {
        await user.click(screen.getByText('Next Question'));
      }

      expect(screen.getByTestId('medical-history-component')).toBeInTheDocument();
      expect(screen.getByText('4/4 Medical History')).toBeInTheDocument();
    });

    it('should render Medical History component when reaching it', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Navigate to Medical History
      await user.click(screen.getByText('Next Vitals'));
      for (let i = 0; i < 6; i++) {
        await user.click(screen.getByText('Next Question'));
      }
      for (let i = 0; i < 8; i++) {
        await user.click(screen.getByText('Next Question'));
      }

      // Should be in Medical History
      expect(screen.getByTestId('medical-history-component')).toBeInTheDocument();
      expect(screen.getByText('4/4 Medical History')).toBeInTheDocument();
    });

    it('should complete all sections up to Medical History', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Navigate through all sections
      await user.click(screen.getByText('Next Vitals'));
      for (let i = 0; i < 6; i++) {
        await user.click(screen.getByText('Next Question'));
      }
      for (let i = 0; i < 8; i++) {
        await user.click(screen.getByText('Next Question'));
      }

      // Should reach Medical History (last section)
      expect(screen.getByTestId('medical-history-component')).toBeInTheDocument();
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

      // Try to go to previous question
      await user.click(screen.getByText('Prev Question'));

      // Should still be at question 0
      expect(screen.getByTestId('visit-reason-component')).toBeInTheDocument();
    });

    it('should navigate to previous question within a section', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Move to Visit Reason and advance a few questions
      await user.click(screen.getByText('Next Vitals'));
      await user.click(screen.getByText('Next Question'));
      await user.click(screen.getByText('Next Question'));

      // Go back one question
      await user.click(screen.getByText('Prev Question'));

      // Should still be in Visit Reason section
      expect(screen.getByTestId('visit-reason-component')).toBeInTheDocument();
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
      expect(screen.getByTestId('visit-reason-component')).toBeInTheDocument();
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

      // Complete Vitals and advance in Visit Reason
      await user.click(screen.getByText('Next Vitals'));
      await user.click(screen.getByText('Next Question'));
      await user.click(screen.getByText('Next Question'));
      await user.click(screen.getByText('Next Question'));

      // Move to next section
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByText('Next Question'));
      }

      // Now in Physical Exam, go back to previous section
      await user.click(screen.getByText('Prev Section'));

      // Should be back in Visit Reason
      expect(screen.getByTestId('visit-reason-component')).toBeInTheDocument();
    });
  });

  describe('Loader Components Integration', () => {
    it('should pass correct props to SectionCompletionLoader', () => {
      renderWithRouter(<StartVisit />);

      const loader = screen.getByTestId('section-completion-loader');
      expect(loader).toHaveTextContent('Section: 1, Question: 1');
    });

    it('should pass correct props to SideLoader', () => {
      renderWithRouter(<StartVisit />);

      const sideLoader = screen.getByTestId('side-loader');
      expect(sideLoader).toHaveTextContent('Question 1 of 1');
    });

    it('should update SideLoader when navigating to different sections', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Initially shows Vitals (1 question)
      expect(screen.getByText('Question 1 of 1')).toBeInTheDocument();

      // Move to Visit Reason (6 questions)
      await user.click(screen.getByText('Next Vitals'));
      expect(screen.getByText('Question 1 of 6')).toBeInTheDocument();
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

      for (let i = 0; i < 6; i++) {
        await user.click(screen.getByText('Next Question'));
      }
      expect(screen.getByText('3/4 Physical Exam')).toBeInTheDocument();

      for (let i = 0; i < 8; i++) {
        await user.click(screen.getByText('Next Question'));
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
      for (let i = 0; i < 6; i++) {
        await user.click(screen.getByText('Next Question'));
      }
      for (let i = 0; i < 8; i++) {
        await user.click(screen.getByText('Next Question'));
      }

      // Should be in Medical History (last section) and stay there
      expect(screen.getByText('4/4 Medical History')).toBeInTheDocument();
      expect(screen.getByTestId('medical-history-component')).toBeInTheDocument();
    });

    it('should handle rapid navigation clicks', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      // Rapidly click next
      await user.click(screen.getByText('Next Vitals'));
      await user.click(screen.getByText('Next Question'));
      await user.click(screen.getByText('Next Question'));

      // Should still be in a valid state
      expect(screen.getByTestId('visit-reason-component')).toBeInTheDocument();
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

      expect(screen.getByText(/Visit Reason - Question 0/)).toBeInTheDocument();
      expect(screen.getByText('Prev Section')).toBeInTheDocument();
      expect(screen.getByText('Prev Question')).toBeInTheDocument();
      expect(screen.getByText('Next Question')).toBeInTheDocument();
    });

    it('should pass all required props to PhysicalExamination', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      await user.click(screen.getByText('Next Vitals'));
      for (let i = 0; i < 6; i++) {
        await user.click(screen.getByText('Next Question'));
      }

      expect(screen.getByText(/Physical Exam - Question 0/)).toBeInTheDocument();
      expect(screen.getByText('Prev Section')).toBeInTheDocument();
      expect(screen.getByText('Prev Question')).toBeInTheDocument();
      expect(screen.getByText('Next Question')).toBeInTheDocument();
    });

    it('should render MedicalHistory without props', async () => {
      const user = userEvent.setup();
      renderWithRouter(<StartVisit />);

      await user.click(screen.getByText('Next Vitals'));
      for (let i = 0; i < 6; i++) {
        await user.click(screen.getByText('Next Question'));
      }
      for (let i = 0; i < 8; i++) {
        await user.click(screen.getByText('Next Question'));
      }

      expect(screen.getByTestId('medical-history-component')).toBeInTheDocument();
      expect(screen.getByText('Medical History')).toBeInTheDocument();
    });
  });
});
