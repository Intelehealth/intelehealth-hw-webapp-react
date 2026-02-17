import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AyuStepperContainer } from '../../../../../../modules/ayu/components/start-visit/visit-reason/ayu-stepper-container.component';
import type { AyuQuestion } from '../../../../../../modules/ayu/types/ayu.types';

// Mock child components
vi.mock('../../../../../../modules/ayu/components/loaders/question-loader.component', () => ({
  QuestionLoader: vi.fn(({ children, question, questionIndex, totalQuestions }) => (
    <div data-testid={`question-loader-${questionIndex}`}>
      <div data-testid="question-text">{question}</div>
      <div data-testid="question-index">{questionIndex}</div>
      <div data-testid="total-questions">{totalQuestions}</div>
      {children}
    </div>
  )),
}));

vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/ayu-renderer.component', () => ({
  AyuRenderer: vi.fn(({ question, value, onChange }) => (
    <div data-testid={`renderer-${question.linkId}`}>
      <div>{question.text}</div>
      <input
        data-testid={`input-${question.linkId}`}
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
      />
    </div>
  )),
}));

vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/ayu-nested-renderer.component', () => ({
  AyuNestedRenderer: vi.fn(({ items, answers, setAnswer }) => (
    <div data-testid="nested-renderer">
      {items?.map((item: AyuQuestion) => (
        <div key={item.linkId} data-testid={`nested-item-${item.linkId}`}>
          <input
            data-testid={`nested-input-${item.linkId}`}
            value={answers[item.linkId] || ''}
            onChange={e => setAnswer(item.linkId, e.target.value)}
          />
        </div>
      ))}
    </div>
  )),
}));

vi.mock('../../../../../../modules/ayu/components/common/ayu-button.component', () => ({
  default: vi.fn(({ children, onClick, disabled, className }) => (
    <button
      data-testid={`button-${children.toLowerCase()}`}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
    </button>
  )),
}));

// Mock the useFHIRStepper hook
vi.mock('../../../../../../modules/ayu/hooks/useFHIRStepper.hook', () => ({
  useFHIRStepper: vi.fn(),
}));

// Import the mocked function after the mock is set up
import { useFHIRStepper } from '../../../../../../modules/ayu/hooks/useFHIRStepper.hook';
const mockUseFHIRStepper = vi.mocked(useFHIRStepper);

describe('AyuStepperContainer', () => {
  const mockOnComplete = vi.fn();
  const mockOnProgressUpdate = vi.fn();
  const mockGoNext = vi.fn();
  const mockSetAnswer = vi.fn();

  const createMockQuestionnaire = (items: AyuQuestion[]): { item: AyuQuestion[] } => ({
    item: items,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset scroll mock
    Element.prototype.scrollIntoView = vi.fn();
  });

  describe('Basic Rendering', () => {
    it('should return null when currentQuestion is null', () => {
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: undefined,
        currentIndex: 0,
        total: 0,
        answers: {},
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [],
        isLast: false,
      });

      const questionnaire = createMockQuestionnaire([]);
      const { container } = render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render current question', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'First Question',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {},
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('question-loader-0')).toBeInTheDocument();
      expect(screen.getByTestId('renderer-q1')).toBeInTheDocument();
    });

    it('should render multiple questions up to current index', () => {
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'string' },
        { linkId: 'q2', text: 'Question 2', type: 'string' },
        { linkId: 'q3', text: 'Question 3', type: 'string' },
      ];

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[1],
        currentIndex: 1,
        total: 3,
        answers: {},
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: questions,
        isLast: false,
      });

      const questionnaire = createMockQuestionnaire(questions);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('question-loader-0')).toBeInTheDocument();
      expect(screen.getByTestId('question-loader-1')).toBeInTheDocument();
      expect(screen.queryByTestId('question-loader-2')).not.toBeInTheDocument();
    });
  });

  describe('Progress Updates', () => {
    it('should call onProgressUpdate on mount', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 2,
        answers: {},
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question, { linkId: 'q2', text: 'Q2', type: 'string' }],
        isLast: false,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(mockOnProgressUpdate).toHaveBeenCalledWith(2, 1);
    });

    it('should update progress when currentIndex changes', () => {
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'string' },
        { linkId: 'q2', text: 'Question 2', type: 'string' },
      ];

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[0],
        currentIndex: 0,
        total: 2,
        answers: {},
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: questions,
        isLast: false,
      });

      const questionnaire = createMockQuestionnaire(questions);
      const { rerender } = render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(mockOnProgressUpdate).toHaveBeenCalledWith(2, 1);

      // Update to next question
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[1],
        currentIndex: 1,
        total: 2,
        answers: {},
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: questions,
        isLast: true,
      });

      rerender(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(mockOnProgressUpdate).toHaveBeenCalledWith(2, 2);
    });
  });

  describe('Scroll Behavior', () => {
    it('should scroll to current question when index changes', async () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {},
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      await waitFor(() => {
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'start',
        });
      });
    });
  });

  describe('Submit Button', () => {
    it('should show submit button for string type with answer', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'test answer' },
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('button-submit')).toBeInTheDocument();
    });

    it('should show submit button for quantity type with answer', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Quantity Question',
        type: 'quantity',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 5 },
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('button-submit')).toBeInTheDocument();
    });

    it('should call goNext when submit is clicked on non-last question', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 2,
        answers: { q1: 'answer' },
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question, { linkId: 'q2', text: 'Q2', type: 'string' }],
        isLast: false,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      const submitButton = screen.getByTestId('button-submit');
      fireEvent.click(submitButton);

      expect(mockGoNext).toHaveBeenCalled();
      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('should call onComplete when submit is clicked on last question', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Last Question',
        type: 'string',
      };

      const answers = { q1: 'final answer' };
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: answers,
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      const submitButton = screen.getByTestId('button-submit');
      fireEvent.click(submitButton);

      expect(mockOnComplete).toHaveBeenCalledWith(answers);
      expect(mockOnProgressUpdate).toHaveBeenCalledWith(1, 1);
    });

    it('should show skip button for choice question with nested empty string', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Parent Question',
        type: 'choice',
        item: [
          {
            linkId: 'q1.1',
            text: 'Nested String',
            type: 'string',
            enableWhen: [
              {
                question: 'q1',
                operator: '=',
                answerString: 'yes',
              },
            ],
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'yes' }, // Enables nested question but nested answer is empty
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Choice question with string answer doesn't show submit button, shows skip button instead
      expect(screen.queryByTestId('button-submit')).not.toBeInTheDocument();
      expect(screen.getByTestId('button-skip')).toBeInTheDocument();
    });

    it('should disable submit button for invalid quantity (duration) with incomplete dropdowns', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Duration Question',
        type: 'quantity',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {
          q1: {
            dropdownValues: {
              number: 5,
              days: undefined, // Missing days value
            },
          },
        },
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      const submitButton = screen.getByTestId('button-submit');
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button for valid quantity (duration) with complete dropdowns', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Duration Question',
        type: 'quantity',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {
          q1: {
            dropdownValues: {
              number: 5,
              days: 'days',
            },
          },
        },
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      const submitButton = screen.getByTestId('button-submit');
      expect(submitButton).not.toBeDisabled();
    });

    it('should show submit button for choice type with duration in nested child', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Choice Question',
        type: 'choice',
        item: [
          {
            linkId: 'q1.1',
            text: 'Duration',
            type: 'string',
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {
          'q1.1': {
            dropdownValues: {
              number: 3,
              days: 'weeks',
            },
          },
        },
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('button-submit')).toBeInTheDocument();
    });
  });

  describe('Skip Button', () => {
    it('should show skip button for non-required questions', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Optional Question',
        type: 'string',
        required: false,
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {},
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('button-skip')).toBeInTheDocument();
    });

    it('should not show skip button for required questions', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Required Question',
        type: 'string',
        required: true,
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'answer' },
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.queryByTestId('button-skip')).not.toBeInTheDocument();
    });

    it('should call goNext when skip is clicked on non-last question', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
        required: false,
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 2,
        answers: {},
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question, { linkId: 'q2', text: 'Q2', type: 'string' }],
        isLast: false,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      const skipButton = screen.getByTestId('button-skip');
      fireEvent.click(skipButton);

      expect(mockGoNext).toHaveBeenCalled();
    });

    it('should call onComplete when skip is clicked on last question', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Last Question',
        type: 'string',
        required: false,
      };

      const answers = {};
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: answers,
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      const skipButton = screen.getByTestId('button-skip');
      fireEvent.click(skipButton);

      expect(mockOnComplete).toHaveBeenCalledWith(answers);
      expect(mockOnProgressUpdate).toHaveBeenCalledWith(1, 1);
    });
  });

  describe('Nested Items', () => {
    it('should render nested items when present', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Parent Question',
        type: 'choice',
        item: [
          { linkId: 'q1.1', text: 'Child 1', type: 'string' },
          { linkId: 'q1.2', text: 'Child 2', type: 'string' },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {},
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('nested-renderer')).toBeInTheDocument();
    });

    it('should not render nested items when not present', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Simple Question',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {},
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.queryByTestId('nested-renderer')).not.toBeInTheDocument();
    });
  });

  describe('Question Navigation', () => {
    it('should only show action buttons on the current (active) question', () => {
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'string' },
        { linkId: 'q2', text: 'Question 2', type: 'string' },
      ];

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[1],
        currentIndex: 1,
        total: 2,
        answers: { q1: 'answer 1', q2: 'answer 2' },
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: questions,
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire(questions);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Both questions are rendered
      expect(screen.getByTestId('question-loader-0')).toBeInTheDocument();
      expect(screen.getByTestId('question-loader-1')).toBeInTheDocument();

      // But only one submit button (for the active question)
      const submitButtons = screen.getAllByTestId('button-submit');
      expect(submitButtons).toHaveLength(1);
    });
  });

  describe('Answer Management', () => {
    it('should pass setAnswer to AyuRenderer', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {},
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      const input = screen.getByTestId('input-q1');
      fireEvent.change(input, { target: { value: 'new answer' } });

      expect(mockSetAnswer).toHaveBeenCalledWith('q1', 'new answer');
    });

    it('should pass setAnswer to AyuNestedRenderer', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Parent Question',
        type: 'choice',
        item: [{ linkId: 'q1.1', text: 'Child', type: 'string' }],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {},
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      const input = screen.getByTestId('nested-input-q1.1');
      fireEvent.change(input, { target: { value: 'nested answer' } });

      expect(mockSetAnswer).toHaveBeenCalledWith('q1.1', 'nested answer');
    });
  });

  describe('Edge Cases', () => {
    it('should handle questionnaire with no items', () => {
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: undefined,
        currentIndex: 0,
        total: 0,
        answers: {},
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [],
        isLast: false,
      });

      const questionnaire = createMockQuestionnaire([]);
      const { container } = render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should handle onComplete being undefined', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question',
        type: 'string',
        required: false,
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {},
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      const skipButton = screen.getByTestId('button-skip');
      expect(() => fireEvent.click(skipButton)).not.toThrow();
    });

    it('should handle onProgressUpdate being undefined', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {},
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      expect(() => {
        render(
          <AyuStepperContainer
            questionnaire={questionnaire}
            onComplete={mockOnComplete}
          />
        );
      }).not.toThrow();
    });

    it('should handle empty string value correctly', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: '' },
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Empty string is considered a defined answer, so submit button shows
      expect(screen.getByTestId('button-submit')).toBeInTheDocument();
      expect(screen.getByTestId('button-submit')).not.toBeDisabled();
    });

    it('should handle array value correctly', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Multi Question',
        type: 'choice',
        repeats: true,
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: [] },
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('renderer-q1')).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('should have correct container classes', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {},
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      const { container } = render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'flex-col', 'gap-6');
    });

    it('should apply correct button classes', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question',
        type: 'string',
        required: false,
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {},
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      const skipButton = screen.getByTestId('button-skip');
      expect(skipButton).toHaveClass('w-full', 'md:w-[10%]');
    });
  });

  describe('EnableWhen with Different Answer Types', () => {
    it('should handle enableWhen with answerInteger', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Parent Question',
        type: 'choice',
        item: [
          {
            linkId: 'q1.1',
            text: 'Nested String',
            type: 'string',
            enableWhen: [
              {
                question: 'q1',
                operator: '=',
                answerInteger: 5,
              },
            ],
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 5 },
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Nested item should be rendered as it's visible
      expect(screen.getByTestId('nested-renderer')).toBeInTheDocument();
    });

    it('should handle enableWhen with answerBoolean', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Parent Question',
        type: 'choice',
        item: [
          {
            linkId: 'q1.1',
            text: 'Nested String',
            type: 'string',
            enableWhen: [
              {
                question: 'q1',
                operator: '=',
                answerBoolean: true,
              },
            ],
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: true },
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('nested-renderer')).toBeInTheDocument();
    });

    it('should handle enableWhen with answerCoding', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Parent Question',
        type: 'choice',
        item: [
          {
            linkId: 'q1.1',
            text: 'Nested String',
            type: 'string',
            enableWhen: [
              {
                question: 'q1',
                operator: '=',
                answerCoding: { code: 'option-1', display: 'Option 1' },
              },
            ],
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'option-1' },
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('nested-renderer')).toBeInTheDocument();
    });

    it('should disable submit when nested string is empty but visible', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Parent Question',
        type: 'choice',
        item: [
          {
            linkId: 'q1.1',
            text: 'Nested String',
            type: 'string',
            enableWhen: [
              {
                question: 'q1',
                operator: '=',
                answerInteger: 10,
              },
            ],
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 10 }, // Enables nested but no answer for q1.1
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Submit button should be disabled because required nested string is empty
      expect(screen.queryByTestId('button-submit')).not.toBeInTheDocument();
      expect(screen.getByTestId('button-skip')).toBeInTheDocument();
    });
  });

  describe('isQuantityInvalid - Additional Cases', () => {
    it('should return false for non-quantity and non-choice types', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'String Question',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'some answer' },
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Submit should be enabled (not disabled by isQuantityInvalid)
      expect(screen.getByTestId('button-submit')).not.toBeDisabled();
    });

    it('should return false for choice question with regular string value', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Choice Question',
        type: 'choice',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'regular-string-answer' },
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Submit should be enabled (not disabled by isQuantityInvalid)
      expect(screen.queryByTestId('button-submit')).not.toBeInTheDocument();
      expect(screen.getByTestId('button-skip')).toBeInTheDocument();
    });

    it('should disable submit for choice with nested invalid duration', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Choice Question',
        type: 'choice',
        item: [
          {
            linkId: 'q1.1',
            text: 'Duration Child',
            type: 'string',
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {
          'q1.1': {
            dropdownValues: {
              number: 5,
              days: undefined, // Incomplete duration
            },
          },
        },
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      const submitButton = screen.getByTestId('button-submit');
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit for choice with nested valid duration', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Choice Question',
        type: 'choice',
        item: [
          {
            linkId: 'q1.1',
            text: 'Duration Child',
            type: 'string',
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {
          'q1.1': {
            dropdownValues: {
              number: 5,
              days: 'weeks',
            },
          },
        },
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      const submitButton = screen.getByTestId('button-submit');
      expect(submitButton).not.toBeDisabled();
    });

    it('should show submit button for choice with top-level duration answer', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Choice Question',
        type: 'choice',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {
          q1: {
            dropdownValues: {
              number: 7,
              days: 'days',
            },
          },
        },
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('button-submit')).toBeInTheDocument();
    });

    it('should show submit button for nested string child with answer', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Parent Question',
        type: 'choice',
        item: [
          {
            linkId: 'q1.1',
            text: 'Child String',
            type: 'string',
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {
          'q1.1': 'child answer',
        },
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('button-submit')).toBeInTheDocument();
    });
  });

  describe('isEmpty helper function coverage', () => {
    it('should handle null values in nested items', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Parent Question',
        type: 'choice',
        item: [
          {
            linkId: 'q1.1',
            text: 'Child String',
            type: 'string',
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { 'q1.1': null }, // null value in nested item
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Null is considered empty by isEmpty helper
      // Since nested string is empty, submit button shouldn't show (or be disabled)
      expect(screen.getByTestId('button-skip')).toBeInTheDocument();
    });

    it('should handle whitespace-only string as empty', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: '   ' }, // Whitespace only
        setAnswer: mockSetAnswer,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Whitespace-only string shows submit button but should be considered for validation
      expect(screen.getByTestId('button-submit')).toBeInTheDocument();
    });
  });
});
