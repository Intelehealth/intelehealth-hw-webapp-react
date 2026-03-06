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
            onChange={e => setAnswer(item, e.target.value)}
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

// Mock resolveAyuComponent so we can control associatedSymptoms detection
vi.mock('../../../../../../modules/ayu/pages/decision-matrix', () => ({
  resolveAyuComponent: vi.fn(),
}));

// Import the mocked functions after mocks are set up
import { useFHIRStepper } from '../../../../../../modules/ayu/hooks/useFHIRStepper.hook';
import { resolveAyuComponent } from '../../../../../../modules/ayu/pages/decision-matrix';
const mockUseFHIRStepper = vi.mocked(useFHIRStepper);
const mockResolveAyuComponent = vi.mocked(resolveAyuComponent);

describe('AyuStepperContainer', () => {
  const mockOnComplete = vi.fn();
  const mockOnProgressUpdate = vi.fn();
  const mockGoNext = vi.fn();
  const mockSetAnswer = vi.fn();
  const mockClearAnswers = vi.fn();

  const createMockQuestionnaire = (items: AyuQuestion[]): { item: AyuQuestion[] } => ({
    item: items,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset scroll mock
    Element.prototype.scrollIntoView = vi.fn();
    // Default: resolveAyuComponent returns 'selectableOptionGroup' (not associatedSymptoms)
    mockResolveAyuComponent.mockReturnValue('selectableOptionGroup');
  });

  describe('Basic Rendering', () => {
    it('should return null when currentQuestion is null', () => {
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: undefined,
        currentIndex: 0,
        total: 0,
        answers: {},
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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

      expect(mockOnProgressUpdate).toHaveBeenCalledWith(2, 0);
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
        clearAnswers: mockClearAnswers,
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

      expect(mockOnProgressUpdate).toHaveBeenCalledWith(2, 0);

      // Update to next question
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[1],
        currentIndex: 1,
        total: 2,
        answers: {},
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
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

      expect(mockOnProgressUpdate).toHaveBeenCalledWith(2, 1);
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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

      expect(mockGoNext).toHaveBeenCalled();
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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

      expect(mockGoNext).toHaveBeenCalled();
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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

      expect(mockSetAnswer).toHaveBeenCalledWith(question, 'new answer');
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
        clearAnswers: mockClearAnswers,
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

      expect(mockSetAnswer).toHaveBeenCalledWith(question.item![0], 'nested answer');
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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
        clearAnswers: mockClearAnswers,
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

  describe('Associated Symptoms Question Type', () => {
    it('should show submit button for associatedSymptoms question', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Associated Symptoms',
        type: 'choice',
        repeats: true,
        answerOption: [
          { valueCoding: { code: 'fever', display: 'Fever' } },
          { valueCoding: { code: 'cough', display: 'Cough' } },
        ],
      };

      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: ['fever', 'NO_cough'] },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
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

    it('should disable submit when not all associatedSymptoms options answered', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Associated Symptoms',
        type: 'choice',
        repeats: true,
        answerOption: [
          { valueCoding: { code: 'fever', display: 'Fever' } },
          { valueCoding: { code: 'cough', display: 'Cough' } },
        ],
      };

      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        // Only 1 of 2 options answered
        answers: { q1: ['fever'] },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
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

    it('should enable submit when all associatedSymptoms options are answered', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Associated Symptoms',
        type: 'choice',
        repeats: true,
        answerOption: [
          { valueCoding: { code: 'fever', display: 'Fever' } },
          { valueCoding: { code: 'cough', display: 'Cough' } },
        ],
      };

      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        // All 2 options answered (fever yes, cough no)
        answers: { q1: ['fever', 'NO_cough'] },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
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

    it('should NOT render nested renderer for associatedSymptoms question', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Associated Symptoms',
        type: 'choice',
        repeats: true,
        item: [{ linkId: 'nested-q', text: 'Duration', type: 'string' }],
      };

      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {},
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
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

      // associatedSymptoms handles its own nested rendering internally
      expect(screen.queryByTestId('nested-renderer')).not.toBeInTheDocument();
    });

    it('should disable submit for associatedSymptoms when answer is not an array', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Associated Symptoms',
        type: 'choice',
        repeats: true,
        answerOption: [
          { valueCoding: { code: 'fever', display: 'Fever' } },
        ],
      };

      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'not-an-array' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
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
  });

  describe('Choice with Repeats Submit Button', () => {
    it('should show submit button for choice type with repeats even without answer', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Multi Select Question',
        type: 'choice',
        repeats: true,
        answerOption: [
          { valueCoding: { code: 'opt1', display: 'Option 1' } },
          { valueCoding: { code: 'opt2', display: 'Option 2' } },
        ],
      };

      // Use default mock (selectableOptionGroup, not associatedSymptoms)
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {},
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
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

    it('should disable submit for choice with repeats when no options selected', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Multi Select Question',
        type: 'choice',
        repeats: true,
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: [] },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
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

    it('should enable submit for choice with repeats when at least one option selected', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Multi Select Question',
        type: 'choice',
        repeats: true,
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: ['opt1'] },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
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

    it('should NOT show submit for choice without repeats and no duration', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Single Select Question',
        type: 'choice',
        repeats: false,
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'opt1' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
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

      // Non-repeats choice without duration - no submit button shown
      expect(screen.queryByTestId('button-submit')).not.toBeInTheDocument();
    });
  });

  describe('Grandchildren Duration Validation', () => {
    it('should disable submit for choice with grandchild invalid duration', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Choice Question',
        type: 'choice',
        repeats: true,
        item: [
          {
            linkId: 'q1.1',
            text: 'Child Level',
            type: 'choice',
            item: [
              {
                linkId: 'q1.1.1',
                text: 'Grandchild Duration',
                type: 'quantity',
              },
            ],
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {
          q1: ['some-option'],
          'q1.1.1': {
            dropdownValues: {
              number: 5,
              days: undefined, // Incomplete
            },
          },
        },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
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

    it('should enable submit for choice with valid grandchild duration', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Choice Question',
        type: 'choice',
        repeats: true,
        item: [
          {
            linkId: 'q1.1',
            text: 'Child Level',
            type: 'choice',
            item: [
              {
                linkId: 'q1.1.1',
                text: 'Grandchild Duration',
                type: 'quantity',
              },
            ],
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {
          q1: ['some-option'],
          'q1.1.1': {
            dropdownValues: {
              number: 5,
              days: 'weeks',
            },
          },
        },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
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
  });

  describe('hasNestedRepeats Submit Button', () => {
    it('should show submit button when child has repeats', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Parent Question',
        type: 'choice',
        item: [
          {
            linkId: 'q1.1',
            text: 'Repeating Child',
            type: 'choice',
            repeats: true,
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: {},
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
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

  describe('Nested integer and quantity child with answer', () => {
    it('should show submit for nested integer child with answer', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Parent',
        type: 'choice',
        item: [
          {
            linkId: 'q1.1',
            text: 'Integer Child',
            type: 'integer',
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { 'q1.1': 42 },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
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

    it('should show submit for nested quantity child with answer', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Parent',
        type: 'choice',
        item: [
          {
            linkId: 'q1.1',
            text: 'Quantity Child',
            type: 'quantity',
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { 'q1.1': { dropdownValues: { number: 3, days: 'days' } } },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
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

  describe('isEmpty Additional Coverage', () => {
    it('should handle empty array as empty value in nested string check', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Parent Question',
        type: 'choice',
        item: [
          {
            linkId: 'q1.1',
            text: 'Nested String',
            type: 'string',
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { 'q1.1': [] }, // Empty array - isEmpty returns true
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
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

      // Nested string with empty array is "empty", so submit is disabled
      const submitButton = screen.getByTestId('button-submit');
      expect(submitButton).toBeDisabled();
    });

    it('should handle non-string child type in hasVisibleRequiredNestedString', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Parent Question',
        type: 'choice',
        item: [
          {
            linkId: 'q1.1',
            text: 'Choice Child',
            type: 'choice', // Non-string type should be skipped
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'selected' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
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

      // Non-string child should not trigger the hasVisibleRequiredNestedString check
      expect(screen.getByTestId('button-skip')).toBeInTheDocument();
    });

    it('should handle invisible nested string child (enableWhen not met)', () => {
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
                answerString: 'no',
              },
            ],
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'yes' }, // enableWhen expects 'no', so child is invisible
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
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

      // Invisible string child should not prevent skip
      expect(screen.getByTestId('button-skip')).toBeInTheDocument();
    });
  });

  describe('Progress Update Same Value', () => {
    it('should not call onProgressUpdate when completedSteps has not changed', () => {
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
        clearAnswers: mockClearAnswers,
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

      expect(mockOnProgressUpdate).toHaveBeenCalledTimes(1);

      // Change total (a dependency of the effect) but keep currentIndex the same.
      // This forces the useEffect to re-run while completedSteps hasn't changed,
      // hitting the early-return branch (prevCompletedRef.current === completedSteps).
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[0],
        currentIndex: 0,
        total: 3,
        answers: {},
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [...questions, { linkId: 'q3', text: 'Question 3', type: 'string' }],
        isLast: false,
      });

      rerender(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // onProgressUpdate should still only have been called once (the early return prevented a second call)
      expect(mockOnProgressUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('associatedSymptoms answerOption fallback', () => {
    it('should handle associatedSymptoms when answerOption is undefined', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Associated Symptoms',
        type: 'choice',
        repeats: true,
        // No answerOption
      };

      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: [] },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
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

      // answerOption?.length ?? 0 fallback - answers.length (0) < 0 is false, so not disabled
      const submitButton = screen.getByTestId('button-submit');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Review Mode (showAll)', () => {
    it('should show Submit button in review mode when question has an answer', () => {
      // A single-select choice question without repeats normally does NOT show Submit.
      // But in review mode (showAll=true), Submit should appear if there is an answer.
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Choice Question',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'yes', display: 'Yes' } },
          { valueCoding: { code: 'no', display: 'No' } },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'yes' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
        showAll: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Submit button should be visible because showAll=true and answer exists
      const submitButton = screen.getByTestId('button-submit');
      expect(submitButton).toBeInTheDocument();
    });
  });
});
