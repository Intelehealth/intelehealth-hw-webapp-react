import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AyuAnswerValue, AyuQuestion } from '../../../../../../modules/ayu-library/types/ayu.types';
import type { AyuStepperContainerHandle } from '../../../../../../modules/ayu/components/start-visit/visit-reason/ayu-stepper-container.component';
import { AyuStepperContainer } from '../../../../../../modules/ayu/components/start-visit/visit-reason/ayu-stepper-container.component';

vi.mock('../../../../../../modules/ayu/components/loaders/question-loader.component', () => ({
  QuestionLoader: vi.fn(({ children, question, questionIndex, totalQuestions, isAnswered, onEdit }) => (
    <div data-testid={`question-loader-${questionIndex}`} data-is-answered={isAnswered ? 'true' : 'false'}>
      <div data-testid="question-text">{question}</div>
      <div data-testid="question-index">{questionIndex}</div>
      <div data-testid="total-questions">{totalQuestions}</div>
      {onEdit && (
        <button data-testid={`edit-${questionIndex}`} onClick={onEdit}>edit</button>
      )}
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
  AyuNestedRenderer: vi.fn(({ items, answers, setAnswer, selectable }) => (
    <div data-testid="nested-renderer" data-selectable={String(!!selectable)}>
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
  default: vi.fn(({ children, onClick, disabled, className, rightIcon }) => (
    <button
      data-testid={`button-${children.toLowerCase()}`}
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {children}
      {rightIcon && <span data-testid={`right-icon-${children.toLowerCase()}`}>{rightIcon}</span>}
    </button>
  )),
}));

vi.mock('../../../../../../modules/ayu/hooks/useFHIRStepper.hook', () => ({
  useFHIRStepper: vi.fn(),
}));

vi.mock('../../../../../../modules/ayu-library/logic/decision-matrix', () => ({
  resolveAyuComponent: vi.fn(),
  isStrictAssociatedSymptoms: vi.fn(),
  isPhysicalExamOptionsQuestion: vi.fn(() => false),
  ASSOCIATED_SYMPTOMS_COMPONENT: 'associatedSymptoms',
}));

vi.mock('../../../../../../modules/ayu/pages/decision-matrix', () => ({
  resolveAyuComponent: vi.fn(),
  isStrictAssociatedSymptoms: vi.fn(),
  ASSOCIATED_SYMPTOMS_COMPONENT: 'associatedSymptoms',
  PHYSICAL_EXAM_OPTIONS_COMPONENT: 'physicalExamOptions',
}));

vi.mock('../../../../../../services/toast', () => ({
  showToast: vi.fn(),
}));

vi.mock('../../../../../../modules/ayu/assets/yes.svg', () => ({
  default: 'yes-icon.svg',
}));

vi.mock('../../../../../../modules/ayu/utils/visit-summary.util', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../../../modules/ayu/utils/visit-summary.util')>();
  return {
    ...actual,
    buildVisitSummary: vi.fn(actual.buildVisitSummary),
  };
});

import {
  isStrictAssociatedSymptoms as isStrictAssociatedSymptomsLogic,
  resolveAyuComponent as resolveAyuComponentLogic,
} from '../../../../../../modules/ayu-library/logic/decision-matrix';
import { useFHIRStepper } from '../../../../../../modules/ayu/hooks/useFHIRStepper.hook';
import { isStrictAssociatedSymptoms, resolveAyuComponent } from '../../../../../../modules/ayu/pages/decision-matrix';
import { buildVisitSummary } from '../../../../../../modules/ayu/utils/visit-summary.util';
import { showToast } from '../../../../../../services/toast';
const _mockUseFHIRStepper = vi.mocked(useFHIRStepper);

const mockValidateAllQuestions = vi.fn(() => true);
const mockUseFHIRStepper = {
  mockReturnValue: (val: Record<string, unknown>) => {
    _mockUseFHIRStepper.mockReturnValue({
      validateAllQuestions: mockValidateAllQuestions,
      isCameraAnswerMissingImages: () => false,
      ...val,
    } as unknown as ReturnType<typeof useFHIRStepper>);
  },
};
const mockResolveAyuComponent = vi.mocked(resolveAyuComponent);
const mockIsStrictAssociatedSymptoms = vi.mocked(isStrictAssociatedSymptoms);

const mockResolveAyuComponentLogic = vi.mocked(resolveAyuComponentLogic);
const mockIsStrictAssociatedSymptomsLogic = vi.mocked(isStrictAssociatedSymptomsLogic);
const mockShowToast = vi.mocked(showToast);
const mockBuildVisitSummary = vi.mocked(buildVisitSummary);

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
    mockValidateAllQuestions.mockReturnValue(true);

    Element.prototype.scrollIntoView = vi.fn();

    mockResolveAyuComponent.mockReturnValue('selectableOptionGroup');
    mockIsStrictAssociatedSymptoms.mockReturnValue(false);
    mockResolveAyuComponentLogic.mockReturnValue('selectableOptionGroup');
    mockIsStrictAssociatedSymptomsLogic.mockReturnValue(false);
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

    it('should report 100% when the section completes (last question auto-advance)', () => {
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'choice' },
        { linkId: 'q2', text: 'Question 2', type: 'choice' },
      ];

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[1],
        currentIndex: 1,
        total: 2,
        answers: { q1: 'a', q2: 'b' },
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
          skipSummary
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

     const hookOnComplete = _mockUseFHIRStepper.mock.calls.at(-1)?.[0]
        ?.onComplete;
      mockOnProgressUpdate.mockClear();
      hookOnComplete?.({ q1: 'a', q2: 'b' });

      expect(mockOnProgressUpdate).toHaveBeenCalledWith(2, 2);
      expect(mockOnComplete).toHaveBeenCalledWith({ q1: 'a', q2: 'b' });
    });

    it('should not report progress on completion when the questionnaire has no items', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'choice',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 0,
        answers: {},
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      /* Questionnaire without an `item` array exercises the `?.item || []`
         fallback, so completeTotal is 0 and progress is left untouched. */
      render(
        <AyuStepperContainer
          questionnaire={{} as any}
          skipSummary
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      const hookOnComplete = _mockUseFHIRStepper.mock.calls.at(-1)?.[0]
        ?.onComplete;
      mockOnProgressUpdate.mockClear();
      hookOnComplete?.({ q1: 'a' });

      expect(mockOnProgressUpdate).not.toHaveBeenCalled();
      expect(mockOnComplete).toHaveBeenCalledWith({ q1: 'a' });
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

    it('should call goNext when submit is clicked on last question', () => {
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
        answers: { q1: 'yes' },
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
      expect(screen.getByTestId('button-skip')).toBeInTheDocument();
    });

    it('should show toast when submit clicked with invalid quantity (duration) with incomplete dropdowns', () => {
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
              days: undefined,
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
      fireEvent.click(submitButton);

      expect(mockShowToast).toHaveBeenCalledWith('Please enter a value', undefined, 'warning');
      expect(mockGoNext).not.toHaveBeenCalled();
    });

    it('should call goNext for valid quantity (duration) with complete dropdowns', () => {
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
      fireEvent.click(submitButton);

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(mockGoNext).toHaveBeenCalled();
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

    it('should show submit button for associated symptoms (Yes/No grid) even when repeats is false', () => {
      const question: AyuQuestion = {
        linkId: 'as1',
        text: 'Associated symptoms',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'fever', display: 'Fever' } },
          { valueCoding: { code: 'cough', display: 'Cough' } },
        ],
      };

      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      mockIsStrictAssociatedSymptoms.mockReturnValue(true);

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { as1: ['fever'] },
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

    it('should call goNext when skip is clicked on last question', () => {
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

    it('should hide skip button for past questions that have been submitted', () => {
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'string', required: false },
        { linkId: 'q2', text: 'Question 2', type: 'string' },
      ];

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[1],
        currentIndex: 1,
        total: 2,
        answers: { q1: 'answered', q2: 'current' },
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

      const submitButtons = screen.getAllByTestId('button-submit');
      fireEvent.click(submitButtons[0]);

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');

      expect(screen.getAllByTestId('button-skip')).toHaveLength(1);
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
    it('should show action buttons for both active and past questions', () => {
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

      expect(screen.getByTestId('question-loader-0')).toBeInTheDocument();
      expect(screen.getByTestId('question-loader-1')).toBeInTheDocument();

      const submitButtons = screen.getAllByTestId('button-submit');
      expect(submitButtons).toHaveLength(2);
    });

    it('should not call goNext when re-submitting a past question', () => {
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

      const submitButtons = screen.getAllByTestId('button-submit');
      fireEvent.click(submitButtons[0]);

      expect(mockGoNext).not.toHaveBeenCalled();
    });

    it('should not call goNext when Skip is clicked on a past (non-current) question — isCurrentQuestion=false', () => {
      /*
       * The Skip onClick contains: if (isCurrentQuestion && (isLast || !wasEditing)) goNext()
       * When clicking Skip on a question at index < currentIndex (a past question),
       * isCurrentQuestion is false so goNext must NOT be called even though the
       * skip button is visible via the (index < currentIndex) condition.
       */
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'string', required: false },
        { linkId: 'q2', text: 'Question 2', type: 'string' },
      ];

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[1],
        currentIndex: 1,
        total: 2,
        answers: { q2: 'current answer' },   // q1 deliberately unanswered → showAsAnswered=false → Skip visible
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

      // Skip button on q1 is visible because index(0) < currentIndex(1)
      const skipButtons = screen.getAllByTestId('button-skip');
      fireEvent.click(skipButtons[0]);  // click Skip on q1 (past, non-current)

      // goNext must NOT be called — q1 is not the current question
      expect(mockGoNext).not.toHaveBeenCalled();
    });

    it('isCurrentQuestion — action buttons are visible only for the question at currentIndex in step-by-step mode', () => {
      /*
       * Action button container condition: isCurrentQuestion || showAll || index < currentIndex
       * In step-by-step mode (showAll=false), only questions at or before currentIndex are
       * even rendered (visibleCount = currentIndex + 1). The current question at index
       * currentIndex satisfies isCurrentQuestion=true; all earlier questions satisfy
       * index < currentIndex. There is no case where a rendered question has both
       * isCurrentQuestion=false AND index >= currentIndex — they are filtered by slicing.
       *
       * This test verifies the current question (isCurrentQuestion=true) shows its
       * action buttons even when it is also the first and only visible question.
       * Uses type 'integer' which unconditionally renders the Submit button regardless
       * of the answer value.
       */
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'integer',  // integer always renders Submit unconditionally
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
        showAll: false,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // isCurrentQuestion=true (index 0 === currentIndex 0) → both buttons must be visible
      expect(screen.getByTestId('button-submit')).toBeInTheDocument();
      expect(screen.getByTestId('button-skip')).toBeInTheDocument();
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

      expect(screen.getByTestId('button-submit')).toBeInTheDocument();
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

    it('should not show submit when nested string is empty but visible', () => {
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
        answers: { q1: 10 },
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
      expect(screen.getByTestId('button-skip')).toBeInTheDocument();
    });
  });

  describe('Toast Validation Messages', () => {
    it('should show "Please enter a value" toast for invalid quantity', () => {
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
              days: undefined,
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

      fireEvent.click(screen.getByTestId('button-submit'));
      expect(mockShowToast).toHaveBeenCalledWith('Please enter a value', undefined, 'warning');
    });

    it('should show "Please select any one option" toast for empty repeats choice', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Multi Select',
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

      fireEvent.click(screen.getByTestId('button-submit'));
      expect(mockShowToast).toHaveBeenCalledWith('Please select any one option', undefined, 'warning');
    });

    it('should block Submit with an upload-image toast when the camera answer has no images', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Is there jaundice?',
        type: 'choice',
        repeats: true,
        answerOption: [
          {
            valueCoding: { code: 'cam', display: 'Picture Taken' },
            extension: [
              {
                url: 'urn:intelehealth:physical-exam/option-kind',
                valueString: 'camera',
              },
            ],
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: ['cam'] },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
        isCameraAnswerMissingImages: () => true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      fireEvent.click(screen.getByTestId('button-submit'));
      expect(mockShowToast).toHaveBeenCalledWith(
        'Please upload the captured image',
        undefined,
        'warning'
      );
      expect(mockGoNext).not.toHaveBeenCalled();
    });

    it('should show "All questions are compulsory" toast for incomplete associated symptoms', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Associated symptoms',
        type: 'choice',
        repeats: true,
        answerOption: [
          { valueCoding: { code: 'fever', display: 'Fever' } },
          { valueCoding: { code: 'cough', display: 'Cough' } },
        ],
      };

      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      mockIsStrictAssociatedSymptoms.mockReturnValue(true);
      mockResolveAyuComponentLogic.mockReturnValue('associatedSymptoms');
      mockIsStrictAssociatedSymptomsLogic.mockReturnValue(true);
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
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

      fireEvent.click(screen.getByTestId('button-submit'));
      expect(mockShowToast).toHaveBeenCalledWith(
        'All questions are compulsory, please answer',
        undefined,
        'warning'
      );
      expect(mockGoNext).not.toHaveBeenCalled();
    });

    it('should show "Please enter a value" toast for visible required nested string', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Parent',
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
        answers: { 'q1.1': 'some-val' },
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

      fireEvent.click(screen.getByTestId('button-submit'));

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(mockGoNext).toHaveBeenCalled();
    });
  });

  describe('Question number in validation toast', () => {
    const invalidQuantityQuestion: AyuQuestion = {
      linkId: 'q1',
      text: 'Duration Question',
      type: 'quantity',
    };

    const invalidQuantityAnswers = {
      q1: { dropdownValues: { number: 5, days: undefined } },
    };

    it('should reference the question number in review mode', () => {
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: invalidQuantityQuestion,
        currentIndex: 0,
        total: 1,
        answers: invalidQuantityAnswers,
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [invalidQuantityQuestion],
        isLast: true,
        showAll: true,
      });

      const questionnaire = createMockQuestionnaire([invalidQuantityQuestion]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      fireEvent.click(screen.getByTestId('button-submit'));
      expect(mockShowToast).toHaveBeenCalledWith(
        'Please answer Question 1 before proceeding',
        undefined,
        'warning'
      );
      expect(mockGoNext).not.toHaveBeenCalled();
    });

    it('should apply questionIndexOffset to the review mode question number', () => {
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: invalidQuantityQuestion,
        currentIndex: 0,
        total: 1,
        answers: invalidQuantityAnswers,
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [invalidQuantityQuestion],
        isLast: true,
        showAll: true,
      });

      const questionnaire = createMockQuestionnaire([invalidQuantityQuestion]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          questionIndexOffset={3}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      fireEvent.click(screen.getByTestId('button-submit'));
      expect(mockShowToast).toHaveBeenCalledWith(
        'Please answer Question 4 before proceeding',
        undefined,
        'warning'
      );
    });

    it('should not reference the question number in linear mode', () => {
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: invalidQuantityQuestion,
        currentIndex: 0,
        total: 1,
        answers: invalidQuantityAnswers,
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [invalidQuantityQuestion],
        isLast: true,
        showAll: false,
      });

      const questionnaire = createMockQuestionnaire([invalidQuantityQuestion]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      fireEvent.click(screen.getByTestId('button-submit'));
      expect(mockShowToast).toHaveBeenCalledWith(
        'Please enter a value',
        undefined,
        'warning'
      );
    });
  });

  describe('RightIcon Behavior', () => {
    it('should not show rightIcon on submit before clicking', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question',
        type: 'string',
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

      expect(screen.queryByTestId('right-icon-submit')).not.toBeInTheDocument();
    });

    it('should mark question as answered after successful submit', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question',
        type: 'string',
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

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'false');
      fireEvent.click(screen.getByTestId('button-submit'));

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');
    });

    it('should not show rightIcon on submit after failed validation', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Multi Select',
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

      fireEvent.click(screen.getByTestId('button-submit'));

      expect(screen.queryByTestId('right-icon-submit')).not.toBeInTheDocument();
    });
  });

  describe('isQuantityInvalid - Additional Cases', () => {
    it('should not show toast for non-quantity and non-choice types', () => {
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

      fireEvent.click(screen.getByTestId('button-submit'));

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(mockGoNext).toHaveBeenCalled();
    });

    it('should not show submit for choice question with regular string value (no repeats)', () => {
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

      expect(screen.queryByTestId('button-submit')).not.toBeInTheDocument();
      expect(screen.getByTestId('button-skip')).toBeInTheDocument();
    });

    it('should show toast for choice with nested invalid duration on submit click', () => {
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
              days: undefined,
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
      fireEvent.click(submitButton);
      expect(mockShowToast).toHaveBeenCalledWith('Please enter a value', undefined, 'warning');
    });

    it('should not show toast for choice with nested valid duration', () => {
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
      fireEvent.click(submitButton);
      expect(mockShowToast).not.toHaveBeenCalled();
      expect(mockGoNext).toHaveBeenCalled();
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
        answers: { 'q1.1': null },
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
        answers: { q1: '   ' },
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

    it('should show toast when not all associatedSymptoms options answered', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Associated symptoms',
        type: 'choice',
        repeats: true,
        answerOption: [
          { valueCoding: { code: 'fever', display: 'Fever' } },
          { valueCoding: { code: 'cough', display: 'Cough' } },
        ],
      };

      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      mockIsStrictAssociatedSymptoms.mockReturnValue(true);
      mockResolveAyuComponentLogic.mockReturnValue('associatedSymptoms');
      mockIsStrictAssociatedSymptomsLogic.mockReturnValue(true);
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,

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
      fireEvent.click(submitButton);

      expect(mockShowToast).toHaveBeenCalledWith(
        'All questions are compulsory, please answer',
        undefined,
        'warning'
      );
      expect(mockGoNext).not.toHaveBeenCalled();
    });

    it('should call goNext when all associatedSymptoms options are answered', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Associated symptoms',
        type: 'choice',
        repeats: true,
        answerOption: [
          { valueCoding: { code: 'fever', display: 'Fever' } },
          { valueCoding: { code: 'cough', display: 'Cough' } },
        ],
      };

      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      mockIsStrictAssociatedSymptoms.mockReturnValue(true);
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

      const submitButton = screen.getByTestId('button-submit');
      fireEvent.click(submitButton);

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(mockGoNext).toHaveBeenCalled();
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

      expect(screen.queryByTestId('nested-renderer')).not.toBeInTheDocument();
    });

    it('should show toast for associatedSymptoms when answer is not an array (non-strict)', () => {
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
      mockIsStrictAssociatedSymptoms.mockReturnValue(false);
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
      fireEvent.click(submitButton);

      expect(mockShowToast).toHaveBeenCalledWith(
        'Please select any one option',
        undefined,
        'warning'
      );
    });

    it('should show compulsory toast for strict associatedSymptoms when answer is not an array', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Associated symptoms',
        type: 'choice',
        repeats: true,
        answerOption: [
          { valueCoding: { code: 'fever', display: 'Fever' } },
        ],
      };

      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      mockIsStrictAssociatedSymptoms.mockReturnValue(true);
      mockResolveAyuComponentLogic.mockReturnValue('associatedSymptoms');
      mockIsStrictAssociatedSymptomsLogic.mockReturnValue(true);
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
      fireEvent.click(submitButton);

      expect(mockShowToast).toHaveBeenCalledWith(
        'All questions are compulsory, please answer',
        undefined,
        'warning'
      );
    });

    it('should not call goNext for associatedSymptoms when not active', () => {
      const questions: AyuQuestion[] = [
        {
          linkId: 'q1',
          text: 'Associated symptoms',
          type: 'choice',
          repeats: true,
          answerOption: [
            { valueCoding: { code: 'fever', display: 'Fever' } },
          ],
        },
        { linkId: 'q2', text: 'Question 2', type: 'string' },
      ];

      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[1],
        currentIndex: 1,
        total: 2,
        answers: { q1: ['fever'] },
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

      const submitButtons = screen.getAllByTestId('button-submit');
      fireEvent.click(submitButtons[0]);

      expect(mockGoNext).not.toHaveBeenCalled();
    });
  });

  describe('Associated symptoms with no answerOption (line 380 ?? 0 fallback)', () => {
    it('should use 0 as fallback when question.answerOption is undefined', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Associated symptoms',
        type: 'choice',
        repeats: true,

      };

      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      mockIsStrictAssociatedSymptoms.mockReturnValue(true);
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: ['some-code'] },
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

      fireEvent.click(screen.getByTestId('button-submit'));

      expect(mockGoNext).toHaveBeenCalled();
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

    it('should show toast for choice with repeats when no options selected', () => {
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
      fireEvent.click(submitButton);

      expect(mockShowToast).toHaveBeenCalledWith('Please select any one option', undefined, 'warning');
      expect(mockGoNext).not.toHaveBeenCalled();
    });

    it('should call goNext for choice with repeats when at least one option selected', () => {
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
      fireEvent.click(submitButton);

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(mockGoNext).toHaveBeenCalled();
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

      expect(screen.queryByTestId('button-submit')).not.toBeInTheDocument();
    });
  });

  describe('Grandchildren Duration Validation', () => {
    it('should show toast for choice with grandchild invalid duration', () => {
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
              days: undefined,
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
      fireEvent.click(submitButton);

      expect(mockShowToast).toHaveBeenCalledWith('Please enter a value', undefined, 'warning');
      expect(mockGoNext).not.toHaveBeenCalled();
    });

    it('should call goNext for choice with valid grandchild duration', () => {
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
      fireEvent.click(submitButton);

      expect(mockShowToast).not.toHaveBeenCalled();
      expect(mockGoNext).toHaveBeenCalled();
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

    it('should not show submit for nested repeats when hidden by enableWhen', () => {
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
            enableWhen: [
              {
                question: 'q1',
                operator: '=',
                answerCoding: { code: 'yes' },
              },
            ],
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'no' },
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

      expect(screen.queryByTestId('button-submit')).not.toBeInTheDocument();
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

    it('should show submit button for choice question with intermediate choice child containing date sub-items', () => {
      /*
       * Covers checkNestedDeep lines 632-645: when a child item is an
       * intermediate choice (both answerOption[] and item[] present) and its
       * sub-items include date/string/integer/quantity types, hasDirectInput is
       * true and the function returns hasInput=true, causing the Submit button
       * to appear.
       */
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Sleep Disorder Q8',
        type: 'choice',
        item: [
          {
            linkId: 'from-to-event',
            text: 'From / To / Event',
            type: 'choice',
            /* Both answerOption[] AND item[] → intermediate choice pattern */
            answerOption: [
              { valueCoding: { code: 'From', display: 'From' } },
              { valueCoding: { code: 'To', display: 'To' } },
              { valueCoding: { code: 'Event', display: 'Event' } },
            ],
            item: [
              { linkId: 'from-date', text: 'From', type: 'date' },
              { linkId: 'to-date', text: 'To', type: 'date' },
            ],
          },
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
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      /* Submit appears because the intermediate choice has date sub-items (hasInput=true) */
      expect(screen.getByTestId('button-submit')).toBeInTheDocument();
    });

    it('should show submit button for intermediate choice child with quantity sub-items', () => {
      /*
       * Covers line 637: sub.type === FHIR_TYPE_QUANTITY in the .some() predicate.
       * Using only quantity-type sub-items forces evaluation of all four conditions
       * (STRING→false, INTEGER→false, DATE→false, QUANTITY→true).
       */
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'BP Question',
        type: 'choice',
        item: [
          {
            linkId: 'bp-direction',
            text: 'BP Direction',
            type: 'choice',
            answerOption: [
              { valueCoding: { code: 'Lying', display: 'Lying' } },
              { valueCoding: { code: 'Standing', display: 'Standing' } },
            ],
            item: [
              { linkId: 'systolic', text: 'Systolic BP', type: 'quantity' },
              { linkId: 'diastolic', text: 'Diastolic BP', type: 'quantity' },
            ],
          },
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
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      /* Submit appears because the intermediate choice has quantity sub-items (hasInput=true) */
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
        answers: { 'q1.1': [] },
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

    it('should handle non-string child type in hasVisibleRequiredNestedString', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Parent Question',
        type: 'choice',
        item: [
          {
            linkId: 'q1.1',
            text: 'Choice Child',
            type: 'choice',
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
        answers: { q1: 'yes' },
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

      expect(mockOnProgressUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('Stable callback-ref for onProgressUpdate (FE-001)', () => {
    it('calls the LATEST onProgressUpdate reference when currentIndex changes — not the stale closure', () => {
      /* The progress useEffect dep array no longer includes onProgressUpdate;
       * instead onProgressUpdateRef is kept current via a no-dep useLayoutEffect.
       * This test verifies the NEW reference is invoked even if currentIndex
       * hasn't changed in between the re-render that swaps the callback. */
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Q1', type: 'string' },
        { linkId: 'q2', text: 'Q2', type: 'string' },
      ];

      const firstCallback = vi.fn();
      const secondCallback = vi.fn();

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
          onProgressUpdate={firstCallback}
        />
      );

      // Mount: firstCallback receives (2, 0)
      expect(firstCallback).toHaveBeenCalledWith(2, 0);
      expect(secondCallback).not.toHaveBeenCalled();

      // Swap in a NEW callback reference — currentIndex stays at 0
      rerender(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={secondCallback}
        />
      );

      // currentIndex changes to 1 → the stable-ref effect fires with the NEW callback
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
          onProgressUpdate={secondCallback}
        />
      );

      // secondCallback must have been called; firstCallback must NOT be called again
      expect(secondCallback).toHaveBeenCalledWith(2, 1);
      expect(firstCallback).toHaveBeenCalledTimes(1); // only the initial mount call
    });

    it('does NOT re-run the progress effect when only the callback reference changes (no index change)', () => {
      /* If the parent re-renders with a new onProgressUpdate reference but
       * currentIndex and totalSteps stay the same, the effect must NOT fire
       * again (prevCompletedRef guard + stable dep array prevents it). */
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Q1', type: 'string' },
      ];

      const firstCallback = vi.fn();
      const secondCallback = vi.fn();

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[0],
        currentIndex: 0,
        total: 1,
        answers: {},
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: questions,
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire(questions);
      const { rerender } = render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={firstCallback}
        />
      );

      expect(firstCallback).toHaveBeenCalledTimes(1); // mount call

      // Swap callback, keep everything else identical
      rerender(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={secondCallback}
        />
      );

      // Neither callback should be called again — prevCompletedRef guard prevents it
      expect(firstCallback).toHaveBeenCalledTimes(1);
      expect(secondCallback).not.toHaveBeenCalled();
    });
  });

  describe('associatedSymptoms answerOption fallback', () => {
    it('should show toast for associatedSymptoms when answerOption is undefined and array is empty', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Associated symptoms',
        type: 'choice',
        repeats: true,

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

      const submitButton = screen.getByTestId('button-submit');
      fireEvent.click(submitButton);

      expect(mockShowToast).toHaveBeenCalled();
      expect(mockGoNext).not.toHaveBeenCalled();
    });
  });

  describe('Review Mode (showAll)', () => {
    it('should show Submit button in review mode for pure single-choice question with answer (Option C)', () => {
      /*
       * Option C: in review mode (showAll=true) the Submit button is always
       * rendered when the question has an answer, even for plain single-choice
       * questions — because autoNext is blocked when showAll=true, the user
       * needs an explicit Submit to re-confirm the answer.
       */
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

      expect(screen.getByTestId('button-submit')).toBeInTheDocument();
    });

    it('should STILL show Submit in review mode for a PE question with a camera option', () => {
      const question: AyuQuestion = {
        linkId: 'pe-jaundice',
        text: 'Is there jaundice?',
        type: 'choice',
        extension: [
          {
            url: 'urn:intelehealth:physical-exam/section-key',
            valueString: 'General Exams',
          },
        ],
        answerOption: [
          { valueCoding: { code: 'no', display: 'No' } },
          { valueCoding: { code: 'yes', display: 'Yes' } },
          {
            valueCoding: { code: 'cam', display: 'Take a picture' },
            extension: [
              {
                url: 'urn:intelehealth:physical-exam/option-kind',
                valueString: 'camera',
              },
            ],
          },
        ],
      };

      mockResolveAyuComponent.mockReturnValue('physicalExamOptions');
      mockResolveAyuComponentLogic.mockReturnValue('physicalExamOptions');

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { 'pe-jaundice': 'yes' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
        showAll: true,
      });

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question])}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('button-submit')).toBeInTheDocument();
    });

    it('should NOT show Submit while editing a plain single-choice PE question', () => {
      const question: AyuQuestion = {
        linkId: 'pe-pinch-skin',
        text: 'Pinch skin',
        type: 'choice',
        extension: [
          {
            url: 'urn:intelehealth:physical-exam/section-key',
            valueString: 'General Exams',
          },
        ],
        answerOption: [
          { valueCoding: { code: 'normal', display: 'Normal' } },
          { valueCoding: { code: 'slow', display: 'Slow' } },
        ],
      };

      mockResolveAyuComponent.mockReturnValue('physicalExamOptions');
      mockResolveAyuComponentLogic.mockReturnValue('physicalExamOptions');

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { 'pe-pinch-skin': 'normal' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
        showAll: true,
      });

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question])}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      const edit = screen.queryByTestId('edit-0');
      if (edit) fireEvent.click(edit);

      expect(screen.queryByTestId('button-submit')).not.toBeInTheDocument();
    });

    it('should NOT show Submit in review mode for a plain single-choice PE question', () => {
      const question: AyuQuestion = {
        linkId: 'pe-pinch-skin',
        text: 'Pinch skin',
        type: 'choice',
        extension: [
          {
            url: 'urn:intelehealth:physical-exam/section-key',
            valueString: 'General Exams',
          },
        ],
        answerOption: [
          { valueCoding: { code: 'normal', display: 'Normal' } },
          { valueCoding: { code: 'slow', display: 'Slow' } },
        ],
      };

      mockResolveAyuComponent.mockReturnValue('physicalExamOptions');
      mockResolveAyuComponentLogic.mockReturnValue('physicalExamOptions');

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { 'pe-pinch-skin': 'normal' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
        showAll: true,
      });

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question])}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.queryByTestId('button-submit')).not.toBeInTheDocument();
    });

    it('should still show Submit in review mode for a PE question with nested inputs', () => {
      const question: AyuQuestion = {
        linkId: 'pe-bp',
        text: 'Blood pressure',
        type: 'choice',
        extension: [
          {
            url: 'urn:intelehealth:physical-exam/section-key',
            valueString: 'General Exams',
          },
        ],
        answerOption: [{ valueCoding: { code: 'done', display: 'Done' } }],
        item: [{ linkId: 'pe-bp-sys', text: 'Systolic', type: 'quantity' }],
      };

      mockResolveAyuComponent.mockReturnValue('physicalExamOptions');
      mockResolveAyuComponentLogic.mockReturnValue('physicalExamOptions');

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { 'pe-bp': 'done' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
        showAll: true,
      });

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question])}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('button-submit')).toBeInTheDocument();
    });

    it('should NOT show Submit button in review mode for single-choice question with no answer', () => {
      /*
       * Option C guard: the showAll early-return only fires when
       * answers[question.linkId] !== undefined. Without an answer the normal
       * type-based logic runs — pure choice without repeats/nested input → no Submit.
       */
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
        answers: {},
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

      expect(screen.queryByTestId('button-submit')).not.toBeInTheDocument();
    });

    it('should show Submit button in review mode for string type question', () => {
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

      expect(screen.getByTestId('button-submit')).toBeInTheDocument();
    });

    it('should show Submit in review mode for choice with repeats', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Multi Select',
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

      expect(screen.getByTestId('button-submit')).toBeInTheDocument();
    });

    it('should show Submit in review mode for single-choice with visible nested repeats', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Choice Question',
        type: 'choice',
        item: [
          {
            linkId: 'q1.1',
            text: 'Nested Repeats',
            type: 'choice',
            repeats: true,
          },
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

      expect(screen.getByTestId('button-submit')).toBeInTheDocument();
    });

    it('should show all questions in review mode', () => {
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'string' },
        { linkId: 'q2', text: 'Question 2', type: 'string' },
        { linkId: 'q3', text: 'Question 3', type: 'string' },
      ];

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[0],
        currentIndex: 0,
        total: 3,
        answers: { q1: 'a1', q2: 'a2', q3: 'a3' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: questions,
        isLast: false,
        showAll: true,
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
      expect(screen.getByTestId('question-loader-2')).toBeInTheDocument();
    });
  });

  describe('useImperativeHandle confirm', () => {
    it('should call onComplete with current answers when confirm is invoked via ref', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'hello' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const ref = createRef<AyuStepperContainerHandle>();
      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          ref={ref}
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      ref.current!.confirm();
      expect(mockOnComplete).toHaveBeenCalledWith({ q1: 'hello' });
    });

    it('should block confirm and warn while a question is still being edited', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'hello' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const ref = createRef<AyuStepperContainerHandle>();
      render(
        <AyuStepperContainer
          ref={ref}
          questionnaire={createMockQuestionnaire([question])}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      fireEvent.click(screen.getByTestId('button-submit'));
      fireEvent.click(screen.getByTestId('edit-0'));

      mockOnComplete.mockClear();
      ref.current!.confirm();

      expect(mockOnComplete).not.toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith(
        'Question 1: Please submit your changes before proceeding',
        undefined,
        'warning'
      );
    });

    it('should block showSummary while a question is still being edited', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'hello' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const ref = createRef<AyuStepperContainerHandle>();
      render(
        <AyuStepperContainer
          ref={ref}
          questionnaire={createMockQuestionnaire([question])}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      fireEvent.click(screen.getByTestId('button-submit'));
      fireEvent.click(screen.getByTestId('edit-0'));

      mockGoNext.mockClear();
      ref.current!.showSummary();

      expect(mockGoNext).not.toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith(
        'Question 1: Please submit your changes before proceeding',
        undefined,
        'warning'
      );
    });

    it('should allow showSummary once the edited question is submitted again', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'hello' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const ref = createRef<AyuStepperContainerHandle>();
      render(
        <AyuStepperContainer
          ref={ref}
          questionnaire={createMockQuestionnaire([question])}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      fireEvent.click(screen.getByTestId('button-submit'));
      fireEvent.click(screen.getByTestId('edit-0'));
      fireEvent.click(screen.getByTestId('button-submit'));

      mockGoNext.mockClear();
      ref.current!.showSummary();

      expect(mockGoNext).toHaveBeenCalled();
    });

    it('should allow confirm once the edited question is submitted again', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'hello' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const ref = createRef<AyuStepperContainerHandle>();
      render(
        <AyuStepperContainer
          ref={ref}
          questionnaire={createMockQuestionnaire([question])}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      fireEvent.click(screen.getByTestId('button-submit'));
      fireEvent.click(screen.getByTestId('edit-0'));
      fireEvent.click(screen.getByTestId('button-submit'));

      mockOnComplete.mockClear();
      ref.current!.confirm();

      expect(mockOnComplete).toHaveBeenCalledWith({ q1: 'hello' });
    });

    it('should not throw when onComplete is undefined and confirm is called', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'hello' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const ref = createRef<AyuStepperContainerHandle>();
      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          ref={ref}
          questionnaire={questionnaire}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(() => ref.current!.confirm()).not.toThrow();
    });
  });

  describe('Strict associated symptoms with non-array answer', () => {
    it('should use empty array fallback when answer is not an array for strict associated symptoms', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Associated Symptoms',
        type: 'choice',
        repeats: true,
        answerOption: [
          { valueCoding: { code: 'opt1', display: 'Option 1' } },
          { valueCoding: { code: 'opt2', display: 'Option 2' } },
        ],
      };

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

      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      mockIsStrictAssociatedSymptoms.mockReturnValue(true);

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

      expect(mockShowToast).toHaveBeenCalled();
      expect(mockGoNext).not.toHaveBeenCalled();
    });
  });

  describe('handleSetAnswer clears submitted/skipped state', () => {
    it('should clear submitted state when answer is edited after submit', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question',
        type: 'string',
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

      fireEvent.click(screen.getByTestId('button-submit'));
      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');

      fireEvent.click(screen.getByTestId('edit-0'));
      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'false');

      fireEvent.change(screen.getByTestId('input-q1'), { target: { value: 'new answer' } });

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'false');
    });

    it('should clear skipped state when answer is edited after skip', () => {
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

      fireEvent.click(screen.getByTestId('button-skip'));
      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');

      fireEvent.click(screen.getByTestId('edit-0'));
      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'false');

      fireEvent.change(screen.getByTestId('input-q1'), { target: { value: 'new answer' } });
      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'false');
    });
  });

  describe('useImperativeHandle showSummary', () => {
    it('should call goNext when showSummary is invoked via ref', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'hello' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const ref = createRef<AyuStepperContainerHandle>();
      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          ref={ref}
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      ref.current!.showSummary();
      expect(mockGoNext).toHaveBeenCalled();

      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('should not throw when showSummary is called without onComplete', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'hello' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const ref = createRef<AyuStepperContainerHandle>();
      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          ref={ref}
          questionnaire={questionnaire}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(() => ref.current!.showSummary()).not.toThrow();
      expect(mockGoNext).toHaveBeenCalled();
    });

    it('should expose both confirm and showSummary on the ref handle', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'val' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const ref = createRef<AyuStepperContainerHandle>();
      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          ref={ref}
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(ref.current).toBeDefined();
      expect(typeof ref.current!.confirm).toBe('function');
      expect(typeof ref.current!.showSummary).toBe('function');
      expect(typeof ref.current!.getAnswers).toBe('function');
    });
  });

  describe('useImperativeHandle getAnswers', () => {
    it('should return the current in-progress answers map', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
      };

      const answers: Record<string, AyuAnswerValue> = {
        q1: 'in-progress',
        q2: 42,
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers,
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const ref = createRef<AyuStepperContainerHandle>();
      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          ref={ref}
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Snapshot does NOT trigger completion or validation — pure read.
      expect(ref.current!.getAnswers()).toEqual(answers);
      expect(mockOnComplete).not.toHaveBeenCalled();
      expect(mockGoNext).not.toHaveBeenCalled();
    });

    it('should return an empty object when no answers have been entered', () => {
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
        isLast: false,
      });

      const ref = createRef<AyuStepperContainerHandle>();
      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          ref={ref}
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(ref.current!.getAnswers()).toEqual({});
    });
  });

  describe('onSummaryShown prop wiring', () => {
    it('should pass onSummaryShown through to useFHIRStepper', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'a' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const onSummaryShown = vi.fn();
      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          onSummaryShown={onSummaryShown}
        />
      );

      /* The container forwards the prop verbatim; the actual firing is covered
         in useFHIRStepper's own tests. */
      expect(_mockUseFHIRStepper).toHaveBeenCalledWith(
        expect.objectContaining({ onSummaryShown })
      );
    });
  });

  describe('Mount-time progress announcement (review mode)', () => {
    it('should announce totalSteps and totalSteps as completed on mount when showAll is true', () => {
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'string' },
        { linkId: 'q2', text: 'Question 2', type: 'string' },
      ];

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[0],
        currentIndex: 0,
        total: 2,
        answers: { q1: 'a', q2: 'b' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: questions,
        isLast: true,
        showAll: true,
      });

      const questionnaire = createMockQuestionnaire(questions);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ q1: 'a', q2: 'b' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      /* The mount-only effect must still announce in review mode so the
         parent's SideLoader denominator is correct after returning from Back. */
      expect(mockOnProgressUpdate).toHaveBeenCalledWith(2, 2);
    });

    it('should not double-announce on mount when showAll is false (change-driven effect handles it)', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 3,
        answers: {},
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [
          question,
          { linkId: 'q2', text: 'Q2', type: 'string' },
          { linkId: 'q3', text: 'Q3', type: 'string' },
        ],
        isLast: false,
        showAll: false,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Non-review mount → only the existing change-driven effect should fire (once).
      expect(mockOnProgressUpdate).toHaveBeenCalledTimes(1);
      expect(mockOnProgressUpdate).toHaveBeenCalledWith(3, 0);
    });

    it('should not announce in review mode when totalSteps is 0', () => {
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
        showAll: true,
      });

      const questionnaire = createMockQuestionnaire([]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      /* showAll + empty questionnaire: mount-effect guard skips, and the
         change-driven effect is suppressed by showAll → nothing fires. */
      expect(mockOnProgressUpdate).not.toHaveBeenCalled();
    });
  });

  describe('submittedQuestions initialization from initialAnswers', () => {
    it('should mark questions with answers in initialAnswers as answered', () => {
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'string' },
        { linkId: 'q2', text: 'Question 2', type: 'string' },
      ];

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[1],
        currentIndex: 1,
        total: 2,
        answers: { q1: 'answer1', q2: 'answer2' },
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
          initialAnswers={{ q1: 'answer1', q2: 'answer2' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');
      expect(screen.getByTestId('question-loader-1')).toHaveAttribute('data-is-answered', 'true');
    });

    it('should NOT show submit tick marks when initialAnswers is empty', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
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
          initialAnswers={{}}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.queryByTestId('right-icon-submit')).not.toBeInTheDocument();
    });

    it('should NOT show submit tick marks when initialAnswers is undefined', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
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

      expect(screen.queryByTestId('right-icon-submit')).not.toBeInTheDocument();
    });

    it('should only mark questions whose linkId has a value in initialAnswers', () => {
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'string' },

        { linkId: 'q2', text: 'Question 2', type: 'string', required: true },
      ];

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[1],
        currentIndex: 1,
        total: 2,
        answers: { q1: 'answer1', q2: 'answer2' },
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
          initialAnswers={{ q1: 'answer1' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');
      expect(screen.getByTestId('question-loader-1')).toHaveAttribute('data-is-answered', 'false');
    });
  });

  describe('skippedQuestions initialization from initialAnswers', () => {
    it('should mark non-required questions without answers in initialAnswers as answered (skipped)', () => {
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'string', required: false },
        { linkId: 'q2', text: 'Question 2', type: 'string', required: false },
      ];

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[1],
        currentIndex: 1,
        total: 2,
        answers: { q2: 'answer2' },
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
          initialAnswers={{ q2: 'answer2' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');
      expect(screen.getByTestId('question-loader-1')).toHaveAttribute('data-is-answered', 'true');
    });

    it('should NOT mark required questions as skipped even without answers in initialAnswers', () => {
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'string', required: true },
        { linkId: 'q2', text: 'Question 2', type: 'string', required: false },
      ];

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[1],
        currentIndex: 1,
        total: 2,
        answers: { q2: 'answer2' },
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
          initialAnswers={{ q2: 'answer2' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'false');
      expect(screen.getByTestId('question-loader-1')).toHaveAttribute('data-is-answered', 'true');
    });

    it('should hide submit button when question is in skippedQuestions from initialAnswers', () => {
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'string', required: false },
        { linkId: 'q2', text: 'Question 2', type: 'string' },
      ];

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[1],
        currentIndex: 1,
        total: 2,
        answers: { q1: 'val', q2: 'answer2' },
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
          initialAnswers={{ q2: 'answer2' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.queryByTestId('button-submit')).not.toBeInTheDocument();
    });
  });

  describe('Skip on last question calls goNext', () => {
    it('should call goNext when skip is clicked on the last question', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Last Question',
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
      fireEvent.click(skipButton);

      expect(mockGoNext).toHaveBeenCalled();

      expect(mockOnProgressUpdate).toHaveBeenCalledWith(1, 1);
    });

    it('should call both onProgressUpdate and goNext for last question skip', () => {
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'string' },
        { linkId: 'q2', text: 'Last Question', type: 'string', required: false },
      ];

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[1],
        currentIndex: 1,
        total: 2,
        answers: { q1: 'answer1' },
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

      const skipButtons = screen.getAllByTestId('button-skip');

      fireEvent.click(skipButtons[skipButtons.length - 1]);

      expect(mockOnProgressUpdate).toHaveBeenCalledWith(2, 2);
      expect(mockGoNext).toHaveBeenCalled();
    });
  });

  describe('confirm validates before calling onComplete', () => {
    it('should not call onComplete when validateAllQuestions returns false', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
        required: true,
      };

      mockValidateAllQuestions.mockReturnValue(false);

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

      const ref = createRef<AyuStepperContainerHandle>();
      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          ref={ref}
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      ref.current!.confirm();
      expect(mockValidateAllQuestions).toHaveBeenCalled();
      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('should call onComplete when validateAllQuestions returns true', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
      };

      mockValidateAllQuestions.mockReturnValue(true);

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'hello' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      const ref = createRef<AyuStepperContainerHandle>();
      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          ref={ref}
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      ref.current!.confirm();
      expect(mockValidateAllQuestions).toHaveBeenCalled();
      expect(mockOnComplete).toHaveBeenCalledWith({ q1: 'hello' });
    });
  });

  describe('getOptionDisplay branches via answered display', () => {
    const renderAnswered = (
      question: AyuQuestion,
      initialAnswers: Record<string, AyuAnswerValue>
    ) => {
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: initialAnswers,
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });
      return render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question])}
          initialAnswers={initialAnswers}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );
    };

    it('should resolve valueCoding.display when answer matches a coded option', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Pick a fruit',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'A', display: 'Apple' } },
          { valueCoding: { code: 'B', display: 'Banana' } },
        ],
      };
      renderAnswered(question, { q1: 'A' });
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    it('should resolve valueString when option uses valueString instead of valueCoding', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Pick a fruit',
        type: 'choice',
        answerOption: [{ valueString: 'Foo' }, { valueString: 'Bar' }],
      };
      renderAnswered(question, { q1: 'Foo' });
      expect(screen.getByText('Foo')).toBeInTheDocument();
    });

    it('should fall back to the raw code when valueCoding has no display and no valueString', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Pick a fruit',
        type: 'choice',
        answerOption: [{ valueCoding: { code: 'A' } }],
      };
      renderAnswered(question, { q1: 'A' });

      expect(screen.getByText('A')).toBeInTheDocument();
    });

    it('should fall back to the raw code when no option matches', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Pick a fruit',
        type: 'choice',
        answerOption: [{ valueCoding: { code: 'A', display: 'Apple' } }],
      };
      renderAnswered(question, { q1: 'Z' });

      expect(screen.getByText('Z')).toBeInTheDocument();
    });

    it('should join displays for an array (repeats) answer', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Pick fruits',
        type: 'choice',
        repeats: true,
        answerOption: [
          { valueCoding: { code: 'A', display: 'Apple' } },
          { valueCoding: { code: 'B', display: 'Banana' } },
        ],
      };
      renderAnswered(question, { q1: ['A', 'B'] });
      expect(screen.getByText('Apple, Banana')).toBeInTheDocument();
    });
  });

  describe('AyuAnsweredDisplay subheading branch (associated symptoms)', () => {
    it('should render the subheading + values block when summaryItems contains subheading items', () => {

      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      mockIsStrictAssociatedSymptoms.mockReturnValue(true);

      mockResolveAyuComponentLogic.mockReturnValue('associatedSymptoms');
      mockIsStrictAssociatedSymptomsLogic.mockReturnValue(true);

      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Associated symptoms',
        type: 'choice',
        repeats: true,
        answerOption: [
          { valueCoding: { code: 'HEAD', display: 'Headache' } },
          { valueCoding: { code: 'NAUS', display: 'Nausea' } },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { q1: ['HEAD', 'NAUS'] },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question])}
          initialAnswers={{ q1: ['HEAD', 'NAUS'] }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByText('Patient reports')).toBeInTheDocument();
      expect(screen.getByText('Headache, Nausea.')).toBeInTheDocument();
    });
  });

  describe('auto-advance backfill effect', () => {
    it('should add answered, non-skipped questions to submittedQuestions when currentIndex moves forward', () => {

      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'string', required: true },
        { linkId: 'q2', text: 'Question 2', type: 'string', required: true },
      ];

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[0],
        currentIndex: 0,
        total: 2,
        answers: { q1: 'a1' },
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

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'false');

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[1],
        currentIndex: 1,
        total: 2,
        answers: { q1: 'a1' },
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

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');
    });
  });

  describe('Skip clears editing state', () => {
    it('should remove the question from editingQuestions when Skip is clicked while editing', () => {
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

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question])}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      fireEvent.click(screen.getByTestId('button-skip'));
      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');

      fireEvent.click(screen.getByTestId('edit-0'));
      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'false');

      fireEvent.click(screen.getByTestId('button-skip'));

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');
    });
  });

  describe('Submit clears editing state', () => {
    it('should remove the question from editingQuestions when Submit is clicked while editing', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Question',
        type: 'string',
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

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question])}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      fireEvent.click(screen.getByTestId('button-submit'));
      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');

      fireEvent.click(screen.getByTestId('edit-0'));
      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'false');

      fireEvent.click(screen.getByTestId('button-submit'));

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');
    });
  });

  describe('formatAnswerValue object/number branches via answered display', () => {
    const renderAnswered = (
      question: AyuQuestion,
      initialAnswers: Record<string, AyuAnswerValue>
    ) => {
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: initialAnswers,
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
      });
      return render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question])}
          initialAnswers={initialAnswers}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );
    };

    it('should format dropdownValues with number + days as "<number> <days>"', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Duration',
        type: 'quantity',
      };
      renderAnswered(question, {
        q1: { dropdownValues: { number: '5', days: 'days' } } as unknown as AyuAnswerValue,
      });
      expect(screen.getByText('5 days')).toBeInTheDocument();
    });

    it('should format dropdownValues with number only as String(number)', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Duration',
        type: 'quantity',
      };
      renderAnswered(question, {
        q1: { dropdownValues: { number: '7' } } as unknown as AyuAnswerValue,
      });
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('should return null primary value when dropdownValues has no number', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Duration',
        type: 'quantity',
      };
      const { container } = renderAnswered(question, {
        q1: { dropdownValues: {} } as unknown as AyuAnswerValue,
      });
      expect(container.querySelectorAll('p.text-sm.font-semibold')).toHaveLength(0);
    });

    it('should format value + unit object as "<value> <unit>"', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Weight',
        type: 'quantity',
      };
      renderAnswered(question, {
        q1: { value: 70, unit: 'kg' } as unknown as AyuAnswerValue,
      });
      expect(screen.getByText('70 kg')).toBeInTheDocument();
    });

    it('should format value-only object as String(value)', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Weight',
        type: 'quantity',
      };
      renderAnswered(question, {
        q1: { value: 70 } as unknown as AyuAnswerValue,
      });
      expect(screen.getByText('70')).toBeInTheDocument();
    });

    it('should return null primary value when value object has empty value', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Weight',
        type: 'quantity',
      };
      const { container } = renderAnswered(question, {
        q1: { value: '', unit: 'kg' } as unknown as AyuAnswerValue,
      });
      expect(container.querySelectorAll('p.text-sm.font-semibold')).toHaveLength(0);
    });

    it('should stringify a numeric answer for non-choice types', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Age',
        type: 'integer',
      };
      renderAnswered(question, { q1: 42 as unknown as AyuAnswerValue });
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should treat an object whose dropdownValues is null via the nullish-coalescing fallback', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Duration',
        type: 'quantity',
      };
      const { container } = renderAnswered(question, {
        q1: { dropdownValues: null } as unknown as AyuAnswerValue,
      });

      expect(container.querySelectorAll('p.text-sm.font-semibold')).toHaveLength(0);
    });

    it('should return null primary value for a non-array, non-object, non-string, non-number answer', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Flag',
        type: 'string',
      };

      const { container } = renderAnswered(question, {
        q1: true as unknown as AyuAnswerValue,
      });

      expect(container.querySelectorAll('p.text-sm.font-semibold')).toHaveLength(0);
    });

    it('should format a range answer with both low and high as "<low> - <high>"', () => {
      /* ayu-range-input emits { low, high } — the four branches below cover
         every return path in the range branch of formatAnswerValue. */
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Cycle length (weeks)',
        type: 'integer',
      };
      renderAnswered(question, {
        q1: { low: 2, high: 6 } as unknown as AyuAnswerValue,
      });
      expect(screen.getByText('2 - 6')).toBeInTheDocument();
    });

    it('should format a range answer with only low set as String(low)', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Cycle length (weeks)',
        type: 'integer',
      };
      renderAnswered(question, {
        q1: { low: 4 } as unknown as AyuAnswerValue,
      });
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should format a range answer with only high set as String(high)', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Cycle length (weeks)',
        type: 'integer',
      };
      renderAnswered(question, {
        q1: { high: 9 } as unknown as AyuAnswerValue,
      });
      expect(screen.getByText('9')).toBeInTheDocument();
    });

    it('should return null primary value when range keys are present but values are null', () => {
      /* Outer guard ('low' in answer || 'high' in answer) passes because the
         keys exist; all three numeric returns are skipped → return null path. */
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Cycle length (weeks)',
        type: 'integer',
      };
      const { container } = renderAnswered(question, {
        q1: { low: null, high: null } as unknown as AyuAnswerValue,
      });
      expect(container.querySelectorAll('p.text-sm.font-semibold')).toHaveLength(0);
    });
  });

  describe('collectAnsweredRows nested row without label', () => {
    it('should render a row without a label when the nested item has neither text nor display extension', () => {
      const child: AyuQuestion = {
        linkId: 'child',
        type: 'string',
      };
      const parent: AyuQuestion = {
        linkId: 'q1',
        text: 'Parent question',
        type: 'choice',
        answerOption: [{ valueCoding: { code: 'A', display: 'Option A' } }],
        item: [child],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: parent,
        currentIndex: 0,
        total: 1,
        answers: { q1: 'A', child: 'child-value' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [parent],
        isLast: true,
      });

      const { container } = render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([parent])}
          initialAnswers={{ q1: 'A', child: 'child-value' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByText('child-value')).toBeInTheDocument();
      const labelEls = container.querySelectorAll('p.text-sm.text-\\[\\#7F7B92\\]');
      const labelTexts = [...labelEls].map(el => el.textContent);
      expect(labelTexts).not.toContain('child');
    });
  });

  describe('collectAnsweredRows placeholder wrapper rows', () => {
    it('skips placeholder wrapper rows and placeholder labels (Weight change)', () => {
      const integerChild: AyuQuestion = {
        linkId: 'wl_amount',
        type: 'integer',
        text: '[Enter amount of weight lost in kgs]',
        enableWhen: [
          { question: 'wl', operator: '=', answerCoding: { code: 'amount' } },
        ],
      };
      const weightLoss: AyuQuestion = {
        linkId: 'wl',
        type: 'choice',
        text: 'Weight loss',
        answerOption: [
          {
            valueCoding: {
              code: 'amount',
              display: '[Enter amount of weight lost in kgs]',
            },
          },
        ],
        enableWhen: [
          {
            question: 'weight',
            operator: '=',
            answerCoding: { code: 'loss' },
          },
        ],
        item: [integerChild],
      };
      const weightChange: AyuQuestion = {
        linkId: 'weight',
        type: 'choice',
        text: 'Weight change (kg)*',
        answerOption: [{ valueCoding: { code: 'loss', display: 'Weight loss' } }],
        item: [weightLoss],
      };

      const answers = {
        weight: 'loss',
        wl: 'amount',
        wl_amount: 34,
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: weightChange,
        currentIndex: 0,
        total: 1,
        answers,
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [weightChange],
        isLast: true,
      });

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([weightChange])}
          initialAnswers={answers}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByText('34')).toBeInTheDocument();
      expect(
        screen.getAllByText('[Enter amount of weight lost in kgs]')
      ).toHaveLength(1);
      expect(screen.getAllByText('Weight loss')).toHaveLength(1);
    });
  });

  describe('collectAnsweredRows redundant container rows (Jaundice-style)', () => {
    it('should skip a child row whose label matches the parent answer option display when it has nested items', () => {
      /*
       * Simulates the Jaundice pattern:
       *   Top: "Jaundice?" (choice: yes→"Yes" / no→"No")
       *     └── "Yes" (choice, enableWhen: parent=yes, text="Yes") ← redundant container
       *           └── "When" (string, enableWhen: yesContainer=when)
       *
       * Before fix: displayed "Yes → Yes: When → When: 20 hours"
       * After fix:  displays  "Yes → When: 20 hours"
       */
      const whenLeaf: AyuQuestion = {
        linkId: 'q1-yes-when',
        text: 'When',
        type: 'string',
        enableWhen: [
          { question: 'q1-yes', operator: '=', answerCoding: { code: 'when' } },
        ],
      };
      const yesContainer: AyuQuestion = {
        linkId: 'q1-yes',
        text: 'Yes',
        type: 'choice',
        enableWhen: [
          { question: 'q1', operator: '=', answerCoding: { code: 'yes' } },
        ],
        answerOption: [{ valueCoding: { code: 'when', display: 'When' } }],
        item: [whenLeaf],
      };
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Jaundice?',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'yes', display: 'Yes' } },
          { valueCoding: { code: 'no', display: 'No' } },
        ],
        item: [yesContainer],
      };

      const answers = {
        q1: 'yes',
        'q1-yes': 'when',
        'q1-yes-when': '20 hours',
      };

      // required: true prevents q2 from being auto-added to skippedQuestions,
      // which would render a "Skipped" <p class="text-sm font-semibold text-[#7F7B92]">
      // that would collide with the row-label CSS selector used below.
      const q2: AyuQuestion = { linkId: 'q2', text: 'Next', type: 'string', required: true };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: q2,
        currentIndex: 1,
        total: 2,
        answers,
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question, q2],
        isLast: false,
      });

      const { container } = render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question, q2])}
          initialAnswers={answers}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // The leaf value and its label should appear exactly once each
      expect(screen.getByText('20 hours')).toBeInTheDocument();
      expect(screen.getByText('When')).toBeInTheDocument();

      // "Yes" should appear as the primary answer value, NOT as a nested row label
      const rowLabels = container.querySelectorAll('p.text-sm.text-\\[\\#7F7B92\\]');
      const labelTexts = [...rowLabels].map(el => el.textContent);
      expect(labelTexts).not.toContain('Yes');

      // There should be exactly one nested row (When: 20 hours) — no duplicate Yes row
      expect(rowLabels).toHaveLength(1);
      expect(labelTexts[0]).toBe('When');
    });

    it('should not skip a child row when the child has no nested items (leaf choice)', () => {
      /*
       * A leaf choice question whose label matches a parent option display
       * should still produce a row, because there are no children to provide
       * the detail.
       */
      const leafChoice: AyuQuestion = {
        linkId: 'q1-yes',
        text: 'Yes',
        type: 'choice',
        enableWhen: [
          { question: 'q1', operator: '=', answerCoding: { code: 'yes' } },
        ],
        answerOption: [{ valueCoding: { code: 'mild', display: 'Mild' } }],
        // no item — this is a leaf
      };
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Jaundice?',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'yes', display: 'Yes' } },
          { valueCoding: { code: 'no', display: 'No' } },
        ],
        item: [leafChoice],
      };

      const answers = { q1: 'yes', 'q1-yes': 'mild' };
      const q2: AyuQuestion = { linkId: 'q2', text: 'Next', type: 'string', required: true };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: q2,
        currentIndex: 1,
        total: 2,
        answers,
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question, q2],
        isLast: false,
      });

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question, q2])}
          initialAnswers={answers}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // The leaf row should still appear because there are no nested items to replace it
      expect(screen.getByText('Mild')).toBeInTheDocument();
    });

    it('should strip the option prefix from a leaf label ("Yes - When" → "When") when the child has no nested items', () => {
      /*
       * Blood-transfusion pattern where the container IS the leaf (no sub-items).
       * Label "Yes - When" should be stripped to "When" so the row reads
       * "When: 17 Years" instead of "Yes - When: 17 Years".
       */
      const leafContainer: AyuQuestion = {
        linkId: 'bt-yes-when',
        text: 'Yes - When',
        type: 'string',
        enableWhen: [
          { question: 'bt', operator: '=', answerCoding: { code: 'yes' } },
        ],
      };
      const question: AyuQuestion = {
        linkId: 'bt',
        text: 'Blood transfusion recently?',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'yes', display: 'Yes' } },
          { valueCoding: { code: 'no', display: 'No' } },
        ],
        item: [leafContainer],
      };

      const answers = { bt: 'yes', 'bt-yes-when': '17 Years' };
      const q2: AyuQuestion = { linkId: 'q2', text: 'Next', type: 'string', required: true };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: q2,
        currentIndex: 1,
        total: 2,
        answers,
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question, q2],
        isLast: false,
      });

      const { container } = render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question, q2])}
          initialAnswers={answers}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByText('17 Years')).toBeInTheDocument();

      const rowLabels = container.querySelectorAll('p.text-sm.text-\\[\\#7F7B92\\]');
      const labelTexts = [...rowLabels].map(el => el.textContent);

      // Full composite label must not appear — only the stripped "When"
      expect(labelTexts).not.toContain('Yes - When');
      expect(rowLabels).toHaveLength(1);
      expect(labelTexts[0]).toBe('When');
    });

    it('should skip a child row whose label is a path-composite prefix of the parent option (e.g. "Yes - When")', () => {
      /*
       * Blood-transfusion pattern: the questionnaire names the container with a
       * composite path label "Yes - When" instead of just "Yes".
       * This is still redundant ("Yes" is already the primary value) and must
       * be suppressed, leaving only the leaf "When: 17 Years" row.
       */
      const whenLeaf: AyuQuestion = {
        linkId: 'bt-yes-when-val',
        text: 'When',
        type: 'string',
        enableWhen: [
          { question: 'bt-yes-when', operator: '=', answerCoding: { code: 'val' } },
        ],
      };
      const yesWhenContainer: AyuQuestion = {
        linkId: 'bt-yes-when',
        text: 'Yes - When',
        type: 'choice',
        enableWhen: [
          { question: 'bt', operator: '=', answerCoding: { code: 'yes' } },
        ],
        answerOption: [{ valueCoding: { code: 'val', display: 'When' } }],
        item: [whenLeaf],
      };
      const question: AyuQuestion = {
        linkId: 'bt',
        text: 'Blood transfusion recently?',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'yes', display: 'Yes' } },
          { valueCoding: { code: 'no', display: 'No' } },
        ],
        item: [yesWhenContainer],
      };

      const answers = {
        bt: 'yes',
        'bt-yes-when': 'val',
        'bt-yes-when-val': '17 Years',
      };
      const q2: AyuQuestion = { linkId: 'q2', text: 'Next', type: 'string', required: true };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: q2,
        currentIndex: 1,
        total: 2,
        answers,
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question, q2],
        isLast: false,
      });

      const { container } = render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question, q2])}
          initialAnswers={answers}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByText('17 Years')).toBeInTheDocument();

      const rowLabels = container.querySelectorAll('p.text-sm.text-\\[\\#7F7B92\\]');
      const labelTexts = [...rowLabels].map(el => el.textContent);

      // The composite "Yes - When" container must not appear as a row label
      expect(labelTexts).not.toContain('Yes - When');
      // Only the leaf label "When" should remain
      expect(rowLabels).toHaveLength(1);
      expect(labelTexts[0]).toBe('When');
    });

    it('strips "Yes - When" prefix via GROUP container (no answerOption on intermediate)', () => {
      /*
       * A GROUP container (no answerOption, no stored answer) sits between the
       * parent choice question and the composite "Yes - When" leaf. The leaf's
       * enableWhen references the GRANDPARENT ("bt"), not the GROUP ("bt-group"),
       * so the direct-parent check fails. The branch display ("Yes") must be
       * propagated through the GROUP so the prefix is still stripped.
       *
       *   Blood Transfusion [bt] (choice: yes→"Yes")
       *     └── GROUP "Yes" [bt-group] (no answerOption, no stored answer)
       *           └── "Yes - When" [bt-yes-when] (enableWhen: bt=yes)
       *
       * Expected: row label "When", not "Yes - When".
       */
      const leafItem: AyuQuestion = {
        linkId: 'bt-yes-when',
        text: 'Yes - When',
        type: 'string',
        enableWhen: [
          { question: 'bt', operator: '=', answerCoding: { code: 'yes' } },
        ],
      };
      const groupContainer: AyuQuestion = {
        linkId: 'bt-group',
        text: 'Yes',
        type: 'group',
        enableWhen: [
          { question: 'bt', operator: '=', answerCoding: { code: 'yes' } },
        ],
        item: [leafItem],
      };
      const question: AyuQuestion = {
        linkId: 'bt',
        text: 'Blood Transfusion?',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'yes', display: 'Yes' } },
          { valueCoding: { code: 'no', display: 'No' } },
        ],
        item: [groupContainer],
      };

      const answers = {
        bt: 'yes',
        // bt-group has no stored answer (GROUP type)
        'bt-yes-when': '17 Years',
      };
      const q2: AyuQuestion = { linkId: 'q2', text: 'Next', type: 'string', required: true };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: q2,
        currentIndex: 1,
        total: 2,
        answers,
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question, q2],
        isLast: false,
      });

      const { container } = render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question, q2])}
          initialAnswers={answers}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByText('17 Years')).toBeInTheDocument();

      const rowLabels = container.querySelectorAll('p.text-sm.text-\\[\\#7F7B92\\]');
      const labelTexts = [...rowLabels].map(el => el.textContent);

      // Full composite label must not appear
      expect(labelTexts).not.toContain('Yes - When');
      // Prefix stripped via GROUP propagation: should show "When"
      expect(rowLabels).toHaveLength(1);
      expect(labelTexts[0]).toBe('When');
    });

    it('shows nested leaf answers when intermediate container is bypassed (no stored answer, operator=)', () => {
      const leaf: AyuQuestion = {
        linkId: 'leaf',
        text: 'When',
        type: 'string',
        enableWhen: [
          { question: 'container', operator: '=', answerCoding: { code: 'when' } },
        ],
      };
      const container: AyuQuestion = {
        linkId: 'container',
        text: 'Yes',
        type: 'choice',
        enableWhen: [
          { question: 'q1', operator: '=', answerCoding: { code: 'yes' } },
        ],
        answerOption: [{ valueCoding: { code: 'when', display: 'When' } }],
        item: [leaf],
      };
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Have you eaten outside food recently?',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'yes', display: 'Yes' } },
          { valueCoding: { code: 'no', display: 'No' } },
        ],
        item: [container],
      };

      const answers: Record<string, AyuAnswerValue> = {
        q1: 'yes',
        leaf: '20 hours',
      };

      const q2: AyuQuestion = { linkId: 'q2', text: 'Next', type: 'string', required: true };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: q2,
        currentIndex: 1,
        total: 2,
        answers,
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question, q2],
        isLast: false,
      });

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question, q2])}
          initialAnswers={answers}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByText('20 hours')).toBeInTheDocument();
      expect(screen.getByText('When')).toBeInTheDocument();
    });

    it('shows nested leaf answers when intermediate container is bypassed (no stored answer, operator exists)', () => {
      const leaf: AyuQuestion = {
        linkId: 'leaf2',
        text: 'Duration',
        type: 'string',
        enableWhen: [
          { question: 'container2', operator: 'exists', answerBoolean: true },
        ],
      };
      const container2: AyuQuestion = {
        linkId: 'container2',
        text: 'Yes',
        type: 'choice',
        enableWhen: [
          { question: 'q2', operator: '=', answerCoding: { code: 'yes' } },
        ],
        answerOption: [{ valueCoding: { code: 'opt', display: 'Option' } }],
        item: [leaf],
      };
      const question2: AyuQuestion = {
        linkId: 'q2',
        text: 'Jaundice present?',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'yes', display: 'Yes' } },
          { valueCoding: { code: 'no', display: 'No' } },
        ],
        item: [container2],
      };

      const answers2: Record<string, AyuAnswerValue> = {
        q2: 'yes',
        leaf2: '3 days',
      };

      const q3: AyuQuestion = { linkId: 'q3', text: 'Next', type: 'string', required: true };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: q3,
        currentIndex: 1,
        total: 2,
        answers: answers2,
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question2, q3],
        isLast: false,
      });

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question2, q3])}
          initialAnswers={answers2}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByText('3 days')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
    });

    it('shows nested leaf answers when intermediate container is bypassed (no stored answer, operator!=)', () => {
      /*
       * Verifies that the bypassedContainers Set approach strips ALL operators,
       * not just "=" (old filter only stripped operator="=").
       *
       * Structure:
       *   question (choice, answered: 'yes')
       *     └── container3 (choice, answerOption, item[], NO answer) ← bypassed
       *           └── leaf3 (string, enableWhen: container3 != 'opt-a', answered: '7 kg')
       *
       * Because container3 is bypassed (no answer + has answerOption + item[]),
       * its enableWhen reference is stripped regardless of operator.
       * leaf3's answer must appear in the summary.
       */
      const leaf3: AyuQuestion = {
        linkId: 'leaf3',
        text: 'Weight change',
        type: 'string',
        enableWhen: [
          { question: 'container3', operator: '!=', answerString: 'opt-a' },
        ],
      };
      const container3: AyuQuestion = {
        linkId: 'container3',
        text: 'Change type',
        type: 'choice',
        enableWhen: [
          { question: 'q3', operator: '=', answerCoding: { code: 'yes' } },
        ],
        answerOption: [{ valueCoding: { code: 'opt-a', display: 'Increase' } }],
        item: [leaf3],
      };
      const question3: AyuQuestion = {
        linkId: 'q3',
        text: 'Weight changed?',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'yes', display: 'Yes' } },
          { valueCoding: { code: 'no', display: 'No' } },
        ],
        item: [container3],
      };

      const answers3: Record<string, AyuAnswerValue> = {
        q3: 'yes',
        leaf3: '7 kg',
      };

      const q4: AyuQuestion = { linkId: 'q4', text: 'Next', type: 'string', required: true };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: q4,
        currentIndex: 1,
        total: 2,
        answers: answers3,
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question3, q4],
        isLast: false,
      });

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question3, q4])}
          initialAnswers={answers3}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByText('7 kg')).toBeInTheDocument();
      expect(screen.getByText('Weight change')).toBeInTheDocument();
    });

    it('does not bypass a container that has a real answer (boolean true), and correctly hides its leaf', () => {
      /*
       * Regression test for the old true-sentinel heuristic.
       *
       * OLD BUG: isChildVisible checked answers[container] === true to detect bypass.
       * A real boolean answer of `true` on a choice container would cause its
       * children's enableWhen "=" rules to be incorrectly stripped, making hidden
       * leaves appear in the summary.
       *
       * NEW behaviour: bypass is tracked via a separate bypassedContainers Set.
       * A container with answers[container] !== undefined is never bypassed,
       * so its leaf's enableWhen is evaluated normally.
       *
       * Structure:
       *   question (choice, answered: 'yes')
       *     └── bool-container (choice, answerOption, item[], answered: true ← real boolean)
       *           └── leaf4 (string, enableWhen: bool-container = 'opt-a', answered: 'stale')
       *
       * bool-container answer is `true` (boolean), but the leaf gating requires 'opt-a'.
       * true !== 'opt-a' → leaf is hidden → its answer must NOT appear in the summary.
       */
      const leaf4: AyuQuestion = {
        linkId: 'leaf4',
        text: 'Detail',
        type: 'string',
        enableWhen: [
          { question: 'bool-container', operator: '=', answerString: 'opt-a' },
        ],
      };
      const boolContainer: AyuQuestion = {
        linkId: 'bool-container',
        text: 'Confirmed',
        type: 'choice',
        enableWhen: [
          { question: 'q5', operator: '=', answerCoding: { code: 'yes' } },
        ],
        answerOption: [{ valueCoding: { code: 'opt-a', display: 'Option A' } }],
        item: [leaf4],
      };
      const question5: AyuQuestion = {
        linkId: 'q5',
        text: 'Confirmed present?',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'yes', display: 'Yes' } },
        ],
        item: [boolContainer],
      };

      const answers5: Record<string, AyuAnswerValue> = {
        q5: 'yes',
        'bool-container': true,   // real boolean answer, not a bypass sentinel
        leaf4: 'stale answer',    // should be hidden because bool-container !== 'opt-a'
      };

      const q6: AyuQuestion = { linkId: 'q6', text: 'Next', type: 'string', required: true };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: q6,
        currentIndex: 1,
        total: 2,
        answers: answers5,
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question5, q6],
        isLast: false,
      });

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question5, q6])}
          initialAnswers={answers5}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // leaf4's enableWhen (bool-container = 'opt-a') is NOT met (true !== 'opt-a'),
      // so the stale answer must not appear in the answered summary.
      expect(screen.queryByText('stale answer')).not.toBeInTheDocument();
      expect(screen.queryByText('Detail')).not.toBeInTheDocument();
    });

    it('strips "Yes - When" to "When" via exact-match optDisplay (real blood-transfusion 3-level structure)', () => {
      /*
       * The real blood-transfusion questionnaire has THREE levels:
       *   bt  (choice: yes → "Yes")
       *     └── bt-yes  (choice: yes-when → "Yes - When", enableWhen bt=yes)
       *           └── bt-yes-when  (string "Yes - When", enableWhen bt-yes=yes-when)
       *
       * Problem: Check 1 for bt-yes-when finds optDisplay="Yes - When" === rawLabel
       * "Yes - When" (exact match), sets hasOptionPrefix=true but leaves effectiveLabel
       * as "Yes - When". Check 3 must then strip branchOptionDisplay "Yes - " from
       * effectiveLabel, yielding "When".
       *
       * Expected: label = "When", NOT "Yes - When".
       */
      const btYesWhen: AyuQuestion = {
        linkId: 'bt-yes-when',
        text: 'Yes - When',
        type: 'string',
        enableWhen: [
          { question: 'bt-yes', operator: '=', answerCoding: { code: 'yes-when' } },
        ],
      };
      const btYes: AyuQuestion = {
        linkId: 'bt-yes',
        text: 'Yes',
        type: 'choice',
        enableWhen: [
          { question: 'bt', operator: '=', answerCoding: { code: 'yes' } },
        ],
        answerOption: [
          { valueCoding: { code: 'yes-when', display: 'Yes - When' } },
        ],
        item: [btYesWhen],
      };
      const btQuestion: AyuQuestion = {
        linkId: 'bt',
        text: 'Blood transfusion recently?',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'yes', display: 'Yes' } },
          { valueCoding: { code: 'no', display: 'No' } },
        ],
        item: [btYes],
      };

      const answers = { bt: 'yes', 'bt-yes': 'yes-when', 'bt-yes-when': '17 hours' };
      const q2: AyuQuestion = { linkId: 'q2', text: 'Next', type: 'string', required: true };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: q2,
        currentIndex: 1,
        total: 2,
        answers,
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [btQuestion, q2],
        isLast: false,
      });

      const { container } = render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([btQuestion, q2])}
          initialAnswers={answers}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByText('17 hours')).toBeInTheDocument();

      const rowLabels = container.querySelectorAll('p.text-sm.text-\\[\\#7F7B92\\]');
      const labelTexts = [...rowLabels].map(el => el.textContent);

      // "Yes - When" must NOT appear as a label — only the stripped "When"
      expect(labelTexts).not.toContain('Yes - When');
      expect(rowLabels).toHaveLength(1);
      expect(labelTexts[0]).toBe('When');
    });
  });

  describe('Auto-advance backfill effect (lines 367, 373)', () => {
    it('line 367: should skip undefined items in topLevelItems during backfill', () => {
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Q1', type: 'string' },
        { linkId: 'q2', text: 'Q2', type: 'string' },
      ];

      // First render at index 0 with a short topLevelItems array (only 1 item)
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[0],
        currentIndex: 0,
        total: 2,
        answers: { q1: 'val1' },
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

      /*
       * Auto-advance to index 3 with topLevelItems only having 2 items.
       * The backfill loops from prev=0 to currentIndex=3 (i=0,1,2).
       * topLevelItems[2] is undefined — triggers `if (!q) continue;` at line 367.
       * The render slice(0, 4) on a 2-item array just renders [q1, q2] safely.
       */
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[1],
        currentIndex: 3,
        total: 2,
        answers: { q1: 'val1', q2: 'val2' },
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

      // Should not throw — the undefined entry was safely skipped
      expect(screen.getByTestId('question-loader-0')).toBeInTheDocument();
    });

    it('line 373: should not duplicate submittedQuestions when backfilling already-submitted question', () => {
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Q1', type: 'string' },
        { linkId: 'q2', text: 'Q2', type: 'string' },
        { linkId: 'q3', text: 'Q3', type: 'string' },
      ];

      // Start at index 0
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[0],
        currentIndex: 0,
        total: 3,
        answers: { q1: 'val1' },
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

      // Submit q1 normally
      fireEvent.click(screen.getByTestId('button-submit'));

      // Auto-advance to index 2 with q1 already submitted
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[2],
        currentIndex: 2,
        total: 3,
        answers: { q1: 'val1', q2: 'val2', q3: 'val3' },
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

      /* Should not throw, backfill loops over q1 (already submitted — early return)
         and q2 (newly submitted) */
      expect(screen.getByTestId('question-loader-0')).toBeInTheDocument();
    });
  });

  describe('getRowLabel fallback to display extension (lines 54-56)', () => {
    it('should use display extension when item.text is empty', () => {
      const child: AyuQuestion = {
        linkId: 'child1',
        type: 'string',
        text: '', // empty text — triggers fallback to extension
        extension: [
          {
            url: 'https://intelehealth.org/fhir/StructureDefinition/display',
            valueString: 'Display Label',
          },
        ],
      };
      const parent: AyuQuestion = {
        linkId: 'q1',
        text: 'Parent',
        type: 'choice',
        answerOption: [{ valueCoding: { code: 'A', display: 'Option A' } }],
        item: [child],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: { linkId: 'q2', text: 'Next', type: 'string' },
        currentIndex: 1,
        total: 2,
        answers: { q1: 'A', child1: 'child-answer' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [parent, { linkId: 'q2', text: 'Next', type: 'string' }],
        isLast: true,
      });

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([parent, { linkId: 'q2', text: 'Next', type: 'string' }])}
          initialAnswers={{ q1: 'A', child1: 'child-answer' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      /* getRowLabel returns 'Display Label' from extension (text is empty)
         The component renders label and value as separate elements */
      expect(screen.getByText('Display Label')).toBeInTheDocument();
      expect(screen.getByText('child-answer')).toBeInTheDocument();
    });
  });

  describe('formatAnswerValue array with non-string elements (lines 69, 71)', () => {
    it('should return null when all array elements are non-string', () => {
      const parent: AyuQuestion = {
        linkId: 'q1',
        text: 'Multi-select',
        type: 'choice',
        repeats: true,
        answerOption: [{ valueCoding: { code: 'A', display: 'Option A' } }],
        item: [
          {
            linkId: 'child1',
            type: 'choice',
            text: 'Child',
            repeats: true,
            answerOption: [{ valueCoding: { code: 'X', display: 'X opt' } }],
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: { linkId: 'q2', text: 'Next', type: 'string' },
        currentIndex: 1,
        total: 2,
        // Child answer is array with non-string elements (numbers)
        answers: { q1: ['A'], child1: [42, 99] as unknown as AyuAnswerValue },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [parent, { linkId: 'q2', text: 'Next', type: 'string' }],
        isLast: true,
      });

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([parent, { linkId: 'q2', text: 'Next', type: 'string' }])}
          initialAnswers={{ q1: ['A'], child1: [42, 99] as unknown as AyuAnswerValue }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      /* The child with all non-string array elements should not render a value row
         (formatAnswerValue returns null for values.length === 0) */
      expect(screen.queryByText('42')).not.toBeInTheDocument();
    });
  });

  describe('collectAnsweredRows enableWhen continue branch (line 110)', () => {
    it('should skip children where enableWhen evaluates to false', () => {
      const parent: AyuQuestion = {
        linkId: 'q1',
        text: 'Parent',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'A', display: 'Option A' } },
          { valueCoding: { code: 'B', display: 'Option B' } },
        ],
        item: [
          {
            linkId: 'visible-child',
            type: 'string',
            text: 'Visible Child',
            enableWhen: [{ question: 'q1', operator: '=', answerCoding: { code: 'A' } }],
          },
          {
            linkId: 'hidden-child',
            type: 'string',
            text: 'Hidden Child',
            enableWhen: [{ question: 'q1', operator: '=', answerCoding: { code: 'B' } }],
          },
        ],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: { linkId: 'q2', text: 'Next', type: 'string' },
        currentIndex: 1,
        total: 2,
        // Parent answered 'A' so hidden-child's enableWhen (code 'B') is false
        answers: { q1: 'A', 'visible-child': 'visible-value', 'hidden-child': 'hidden-value' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [parent, { linkId: 'q2', text: 'Next', type: 'string' }],
        isLast: true,
      });

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([parent, { linkId: 'q2', text: 'Next', type: 'string' }])}
          initialAnswers={{ q1: 'A', 'visible-child': 'visible-value', 'hidden-child': 'hidden-value' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Visible child should render (label and value are in separate elements)
      expect(screen.getByText('Visible Child')).toBeInTheDocument();
      expect(screen.getByText('visible-value')).toBeInTheDocument();
      // Hidden child should be skipped (enableWhen evaluates to false)
      expect(screen.queryByText('hidden-value')).not.toBeInTheDocument();
    });
  });

  describe('getBranchQualifier fallbacks (lines 165, 170)', () => {
    const makeParent = (
      options: AyuQuestion['answerOption'],
      childCode: string
    ): AyuQuestion => ({
      linkId: 'site',
      text: 'Site',
      type: 'choice',
      repeats: true,
      answerOption: options,
      item: [
        {
          linkId: 'hip',
          type: 'string',
          text: 'Hip',
          enableWhen: [
            { question: 'site', operator: '=', answerCoding: { code: childCode } },
          ],
        },
      ],
    });

    const renderWith = (parent: AyuQuestion, answers: Record<string, string | string[]>) => {
      const next = { linkId: 'q2', text: 'Next', type: 'string' } as AyuQuestion;
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: next,
        currentIndex: 1,
        total: 2,
        answers,
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [parent, next],
        isLast: true,
      });
      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([parent, next])}
          initialAnswers={answers}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );
    };

    it('should not qualify a child that is not gated by the repeating parent', () => {
      const parent: AyuQuestion = {
        linkId: 'site',
        text: 'Site',
        type: 'choice',
        repeats: true,
        answerOption: [
          { valueCoding: { code: 'RIGHT', display: 'Right leg' } },
          { valueCoding: { code: 'LEFT', display: 'Left leg' } },
        ],
        item: [{ linkId: 'hip', type: 'string', text: 'Hip' }],
      };
      renderWith(parent, { site: ['RIGHT', 'LEFT'], hip: 'sore' });

      expect(screen.getByText('Hip')).toBeInTheDocument();
      expect(screen.getByText('sore')).toBeInTheDocument();
    });

    it('should not qualify when the matched option carries no display text', () => {
      const parent = makeParent(
        [{ valueCoding: { code: 'RIGHT' } }, { valueCoding: { code: 'LEFT' } }],
        'RIGHT'
      );
      renderWith(parent, { site: ['RIGHT', 'LEFT'], hip: 'sore' });

      expect(screen.getByText('Hip')).toBeInTheDocument();
    });

    it('should fall back to valueString when the option has no valueCoding', () => {
      const parent = makeParent(
        [{ valueString: 'RIGHT' }, { valueString: 'LEFT' }],
        'RIGHT'
      );
      renderWith(parent, { site: ['RIGHT', 'LEFT'], hip: 'sore' });

      expect(screen.getByText('RIGHT - Hip')).toBeInTheDocument();
    });
  });

  describe('AyuAnsweredDisplay labelValue without label (line 188)', () => {
    it('should render just the value when labelValue item has empty label', () => {
      const question: AyuQuestion = {
        linkId: 'as1',
        text: 'Associated symptoms',
        type: 'choice',
        repeats: true,
      };

      // Mock resolveAyuComponent to identify this as associated symptoms
      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      mockResolveAyuComponentLogic.mockReturnValue('associatedSymptoms');
      mockIsStrictAssociatedSymptoms.mockReturnValue(false);
      mockIsStrictAssociatedSymptomsLogic.mockReturnValue(false);

      // Mock buildVisitSummary to return a labelValue item with empty label
      mockBuildVisitSummary.mockReturnValue([
        {
          title: 'Associated symptoms',
          items: [
            { type: 'labelValue' as const, label: '', value: 'Fever' },
            { type: 'labelValue' as const, label: 'Duration', value: '3 days' },
          ],
        },
      ]);

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: { linkId: 'q2', text: 'Next', type: 'string' },
        currentIndex: 1,
        total: 2,
        answers: { as1: ['fever'] },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question, { linkId: 'q2', text: 'Next', type: 'string' }],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ as1: ['fever'] }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Line 188: empty label renders just the value without colon separator
      expect(screen.getByText('Fever')).toBeInTheDocument();
      // Non-empty label renders "label: value"
      expect(screen.getByText('Duration: 3 days')).toBeInTheDocument();
    });

    it('renders a blank-value labelValue (e.g. family-history "None") without a trailing colon', () => {
      const question: AyuQuestion = {
        linkId: 'fam1',
        text: 'Do you have a family history of any of the following?',
        type: 'choice',
        repeats: true,
      };

      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      mockResolveAyuComponentLogic.mockReturnValue('associatedSymptoms');
      mockIsStrictAssociatedSymptoms.mockReturnValue(false);
      mockIsStrictAssociatedSymptomsLogic.mockReturnValue(false);

      mockBuildVisitSummary.mockReturnValue([
        {
          title: 'Family history',
          items: [{ type: 'labelValue' as const, label: 'None', value: ' ' }],
        },
      ]);

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: { linkId: 'q2', text: 'Next', type: 'string' },
        currentIndex: 1,
        total: 2,
        answers: { fam1: ['none'] },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question, { linkId: 'q2', text: 'Next', type: 'string' }],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ fam1: ['none'] }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByText('None')).toBeInTheDocument();
      expect(screen.queryByText(/None\s*:/)).not.toBeInTheDocument();
    });
  });

  describe('isSingleOptionPE hides primary value for single-option PE questions', () => {
    it('should hide primary value when PE question has one regular option and one camera option', () => {
      const question: AyuQuestion = {
        linkId: 'bp-pe',
        text: 'Blood Pressure',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'lying', display: 'Lying down' } },
          {
            valueCoding: { code: 'cam', display: 'Camera' },
            extension: [
              {
                url: 'urn:intelehealth:physical-exam/option-kind',
                valueString: 'camera',
              },
            ],
          },
        ],
        item: [
          { linkId: 'systolic', text: 'Systolic', type: 'integer' },
        ],
      };

      mockResolveAyuComponent.mockReturnValue('physicalExamOptions');
      mockResolveAyuComponentLogic.mockReturnValue('physicalExamOptions' as never);

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: { linkId: 'q2', text: 'Next', type: 'string' },
        currentIndex: 1,
        total: 2,
        answers: { 'bp-pe': 'lying', systolic: '120' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question, { linkId: 'q2', text: 'Next', type: 'string' }],
        isLast: true,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ 'bp-pe': 'lying', systolic: '120' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // Primary value ("Lying down") should be hidden for single-option PE
      expect(screen.queryByText('Lying down')).not.toBeInTheDocument();
      // Nested value should still appear
      expect(screen.getByText('120')).toBeInTheDocument();
    });
  });

  describe('collectAnsweredRows Check 2 branches (lines 239, 246)', () => {
    it('Check 2 exact-match: sets hasOptionPrefix when branchOptionDisplay === label (line 239)', () => {
      /*
       * Leaf inside a GROUP container (no answerOption on GROUP).
       * Leaf has no enableWhen → Check 1 is skipped.
       * branchOptionDisplay ("Yes") propagated from GROUP equals label ("Yes")
       * → line 239 fires, hasOptionPrefix = true.
       * Leaf has no children → isRedundantContainer = false → row is rendered.
       */
      const leafItem: AyuQuestion = {
        linkId: 'chk2-leaf',
        text: 'Yes',
        type: 'string',
      };
      const groupContainer: AyuQuestion = {
        linkId: 'chk2-grp',
        text: 'Yes',
        type: 'group',
        enableWhen: [
          { question: 'chk2-q', operator: '=', answerCoding: { code: 'yes' } },
        ],
        item: [leafItem],
      };
      const question: AyuQuestion = {
        linkId: 'chk2-q',
        text: 'Check 2 Question',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'yes', display: 'Yes' } },
          { valueCoding: { code: 'no', display: 'No' } },
        ],
        item: [groupContainer],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: { linkId: 'q-next', text: 'Next', type: 'string' },
        currentIndex: 1,
        total: 2,
        answers: { 'chk2-q': 'yes', 'chk2-leaf': 'detail-answer' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question, { linkId: 'q-next', text: 'Next', type: 'string' }],
        isLast: true,
      });

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question, { linkId: 'q-next', text: 'Next', type: 'string' }])}
          initialAnswers={{ 'chk2-q': 'yes', 'chk2-leaf': 'detail-answer' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      /* The leaf row { label: "Yes", value: "detail-answer" } is rendered because
         Check 2 exact-match sets hasOptionPrefix but leaf has no children. */
      expect(screen.getByText('detail-answer')).toBeInTheDocument();
    });

    it('Check 2 fallback: uses || label when slice of branchOptionDisplay prefix produces empty string (line 246)', () => {
      /*
       * Leaf label = "Yes - " (branchOptionDisplay + sep with nothing after).
       * label.startsWith("Yes - ") → true, slice(6).trim() = ""
       * → || label → effectiveLabel = "Yes - " (line 246 fires).
       */
      const leafItem: AyuQuestion = {
        linkId: 'chk2b-leaf',
        text: 'Yes - ',
        type: 'string',
      };
      const groupContainer: AyuQuestion = {
        linkId: 'chk2b-grp',
        text: 'Yes',
        type: 'group',
        enableWhen: [
          { question: 'chk2b-q', operator: '=', answerCoding: { code: 'yes' } },
        ],
        item: [leafItem],
      };
      const question: AyuQuestion = {
        linkId: 'chk2b-q',
        text: 'Check 2 Fallback',
        type: 'choice',
        answerOption: [
          { valueCoding: { code: 'yes', display: 'Yes' } },
          { valueCoding: { code: 'no', display: 'No' } },
        ],
        item: [groupContainer],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: { linkId: 'q-next2', text: 'Next', type: 'string' },
        currentIndex: 1,
        total: 2,
        answers: { 'chk2b-q': 'yes', 'chk2b-leaf': 'fallback-val' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question, { linkId: 'q-next2', text: 'Next', type: 'string' }],
        isLast: true,
      });

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question, { linkId: 'q-next2', text: 'Next', type: 'string' }])}
          initialAnswers={{ 'chk2b-q': 'yes', 'chk2b-leaf': 'fallback-val' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      /* Row: { label: "Yes - ", value: "fallback-val" } — slice(6).trim() = ""
         forces the || label fallback (line 246) → effectiveLabel = "Yes - ". */
      expect(screen.getByText('fallback-val')).toBeInTheDocument();
    });
  });

  describe('collectAnsweredRows Check 1 branches (lines 157/159/210/213/224)', () => {
    it('resolves parent answerOption with valueString (lines 157/159/210/213)', () => {
      /*
       * Parent uses valueString-only answerOption (no valueCoding).
       * child.enableWhen references parent by answerCoding.code.
       * - getNextBranchDisplay (line 157): o.valueString === expected fires
       * - getNextBranchDisplay (line 159): opt?.valueString fires
       * - Check 1 (line 210): o.valueString === expected fires
       * - Check 1 (line 213): opt?.valueString fires
       */
      const childItem: AyuQuestion = {
        linkId: 'vstep-child',
        text: 'Yes - Details',
        type: 'string',
        enableWhen: [{ question: 'vstep-parent', operator: '=', answerCoding: { code: 'yes' } }],
      };
      const question: AyuQuestion = {
        linkId: 'vstep-parent',
        text: 'ValueString Parent',
        type: 'choice',
        answerOption: [{ valueString: 'yes' }],
        item: [childItem],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: { linkId: 'q-next-vstep', text: 'Next', type: 'string' },
        currentIndex: 1,
        total: 2,
        answers: { 'vstep-parent': 'yes', 'vstep-child': 'vstep-answer' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question, { linkId: 'q-next-vstep', text: 'Next', type: 'string' }],
        isLast: true,
      });

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question, { linkId: 'q-next-vstep', text: 'Next', type: 'string' }])}
          initialAnswers={{ 'vstep-parent': 'yes', 'vstep-child': 'vstep-answer' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      /* opt found via o.valueString === expected (line 157);
         optDisplay = opt?.valueString (line 159 / 213).
         Row { label: 'Yes - Details', value: 'vstep-answer' } is rendered. */
      expect(screen.getByText('vstep-answer')).toBeInTheDocument();
    });

    it('returns null optDisplay when option has only a code (line 213 || null)', () => {
      /*
       * Parent option has valueCoding.code but no display and no valueString.
       * → opt?.valueCoding?.display = undefined, opt?.valueString = undefined
       * → optDisplay = undefined || undefined || null = null (line 213 || null fires).
       */
      const childItem: AyuQuestion = {
        linkId: 'nullstep-child',
        text: 'When',
        type: 'string',
        enableWhen: [{ question: 'nullstep-parent', operator: '=', answerCoding: { code: 'yes' } }],
      };
      const question: AyuQuestion = {
        linkId: 'nullstep-parent',
        text: 'Null Display Parent',
        type: 'choice',
        answerOption: [{ valueCoding: { code: 'yes' } }], // no display, no valueString
        item: [childItem],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: { linkId: 'q-next-nullstep', text: 'Next', type: 'string' },
        currentIndex: 1,
        total: 2,
        answers: { 'nullstep-parent': 'yes', 'nullstep-child': 'nullstep-answer' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question, { linkId: 'q-next-nullstep', text: 'Next', type: 'string' }],
        isLast: true,
      });

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question, { linkId: 'q-next-nullstep', text: 'Next', type: 'string' }])}
          initialAnswers={{ 'nullstep-parent': 'yes', 'nullstep-child': 'nullstep-answer' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      /* optDisplay = null → Check 1 skipped → effectiveLabel = 'When' unchanged.
         Row { label: 'When', value: 'nullstep-answer' } is rendered. */
      expect(screen.getByText('nullstep-answer')).toBeInTheDocument();
    });

    it('Check 1 slice fallback when slice produces empty string (line 224)', () => {
      /*
       * child.text = "Yes - " (optDisplay "Yes" + sep " - " with nothing after).
       * label.startsWith("Yes - ") → true.
       * label.slice(6).trim() = "" → || label → effectiveLabel = "Yes - " (line 224 fires).
       */
      const childItem: AyuQuestion = {
        linkId: 'c224-child',
        text: 'Yes - ',
        type: 'string',
        enableWhen: [{ question: 'c224-parent', operator: '=', answerCoding: { code: 'yes' } }],
      };
      const question: AyuQuestion = {
        linkId: 'c224-parent',
        text: 'Check 1 Fallback Parent',
        type: 'choice',
        answerOption: [{ valueCoding: { code: 'yes', display: 'Yes' } }],
        item: [childItem],
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: { linkId: 'q-next-c224', text: 'Next', type: 'string' },
        currentIndex: 1,
        total: 2,
        answers: { 'c224-parent': 'yes', 'c224-child': 'c224-answer' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question, { linkId: 'q-next-c224', text: 'Next', type: 'string' }],
        isLast: true,
      });

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([question, { linkId: 'q-next-c224', text: 'Next', type: 'string' }])}
          initialAnswers={{ 'c224-parent': 'yes', 'c224-child': 'c224-answer' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      /* "Yes - ".slice(6).trim() = "" → || label = "Yes - " (line 224 fires).
         Row { label: 'Yes - ', value: 'c224-answer' } is rendered. */
      expect(screen.getByText('c224-answer')).toBeInTheDocument();
    });
  });

  describe('PE question selectable prop', () => {
    it('should pass selectable=true to AyuNestedRenderer for physicalExamOptions questions', () => {
      const question: AyuQuestion = {
        linkId: 'pe-q1',
        text: 'Lumps',
        type: 'choice',
        item: [{ linkId: 'pe-q1.child', text: 'Where', type: 'choice' }],
      };

      mockResolveAyuComponent.mockReturnValue('physicalExamOptions');
      mockResolveAyuComponentLogic.mockReturnValue('physicalExamOptions' as never);
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

      const nestedRenderer = screen.getByTestId('nested-renderer');
      expect(nestedRenderer).toHaveAttribute('data-selectable', 'true');
    });

    it('should pass selectable=false to AyuNestedRenderer for non-PE questions', () => {
      const question: AyuQuestion = {
        linkId: 'q1',
        text: 'Normal question',
        type: 'choice',
        item: [{ linkId: 'q1.child', text: 'Detail', type: 'string' }],
      };

      mockResolveAyuComponent.mockReturnValue('selectableOptionGroup');
      mockResolveAyuComponentLogic.mockReturnValue('selectableOptionGroup');
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

      const nestedRenderer = screen.getByTestId('nested-renderer');
      expect(nestedRenderer).toHaveAttribute('data-selectable', 'false');
    });

    it('should pass selectable=false to AyuNestedRenderer for PE questions with nested integer systolic/diastolic children', () => {
      const question: AyuQuestion = {
        linkId: 'arm-lying-bp',
        text: 'Arm Lying BP',
        type: 'choice',
        item: [
          { linkId: 'systolic', text: 'Enter systolic BP', type: 'integer' },
          { linkId: 'diastolic', text: 'Enter diastolic BP', type: 'integer' },
        ],
      };

      mockResolveAyuComponent.mockReturnValue('physicalExamOptions');
      mockResolveAyuComponentLogic.mockReturnValue('physicalExamOptions' as never);
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

      const nestedRenderer = screen.getByTestId('nested-renderer');
      expect(nestedRenderer).toHaveAttribute('data-selectable', 'false');
    });

    it('should pass selectable=false to AyuNestedRenderer for PE questions with nested string systolic/diastolic children', () => {
      const question: AyuQuestion = {
        linkId: 'arm-lying-bp',
        text: 'Arm Lying BP',
        type: 'choice',
        item: [
          { linkId: 'systolic', text: 'Enter systolic BP', type: 'string' },
          { linkId: 'diastolic', text: 'Enter diastolic BP', type: 'string' },
        ],
      };

      mockResolveAyuComponent.mockReturnValue('physicalExamOptions');
      mockResolveAyuComponentLogic.mockReturnValue('physicalExamOptions' as never);
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

      const nestedRenderer = screen.getByTestId('nested-renderer');
      expect(nestedRenderer).toHaveAttribute('data-selectable', 'false');
    });

    it('should pass selectable=true to AyuNestedRenderer for PE questions with integer child that has no BP keyword in text', () => {
      const question: AyuQuestion = {
        linkId: 'pe-rash',
        text: 'Skin Rash',
        type: 'choice',
        item: [{ linkId: 'count', text: 'How many lesions?', type: 'integer' }],
      };

      mockResolveAyuComponent.mockReturnValue('physicalExamOptions');
      mockResolveAyuComponentLogic.mockReturnValue('physicalExamOptions' as never);
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

      const nestedRenderer = screen.getByTestId('nested-renderer');
      expect(nestedRenderer).toHaveAttribute('data-selectable', 'true');
    });

    it('should pass selectable=true to AyuNestedRenderer for PE questions where BP keyword appears in a choice-type child (not integer/string)', () => {
      const question: AyuQuestion = {
        linkId: 'arm-lying-bp',
        text: 'Arm Lying BP',
        type: 'choice',
        item: [{ linkId: 'systolic-choice', text: 'Enter systolic BP', type: 'choice' }],
      };

      mockResolveAyuComponent.mockReturnValue('physicalExamOptions');
      mockResolveAyuComponentLogic.mockReturnValue('physicalExamOptions' as never);
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

      const nestedRenderer = screen.getByTestId('nested-renderer');
      expect(nestedRenderer).toHaveAttribute('data-selectable', 'true');
    });

    it('should pass selectable=true to AyuNestedRenderer for PE questions with an empty item array', () => {
      const question: AyuQuestion = {
        linkId: 'pe-nail',
        text: 'Nail abnormality',
        type: 'choice',
        item: [],
      };

      mockResolveAyuComponent.mockReturnValue('physicalExamOptions');
      mockResolveAyuComponentLogic.mockReturnValue('physicalExamOptions' as never);
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

      const nestedRenderer = screen.getByTestId('nested-renderer');
      expect(nestedRenderer).toHaveAttribute('data-selectable', 'true');
    });
  });

  describe('isActive prop – back navigation from Physical Exam (useLayoutEffect)', () => {
    const makeQuestion = (linkId: string, required = false): AyuQuestion => ({
      linkId,
      text: `Question ${linkId}`,
      type: 'choice',
      required,
      answerOption: [{ valueCoding: { code: 'yes', display: 'Yes' } }],
    });

    const buildStepperReturn = (
      questions: AyuQuestion[],
      extra: Record<string, unknown> = {}
    ) => ({
      currentQuestion: questions[0],
      currentIndex: 0,
      total: questions.length,
      answers: Object.fromEntries(questions.map(q => [q.linkId, 'yes'])),
      setAnswer: mockSetAnswer,
      clearAnswers: mockClearAnswers,
      goNext: mockGoNext,
      topLevelItems: questions,
      isLast: questions.length === 1,
      showAll: true,
      ...extra,
    });

    it('default isActive=true — no edit forced on first render (useLayoutEffect guard)', () => {
      /*
       * When isActive starts as true (default), prevIsActiveRef.current is
       * also true after the first useLayoutEffect run, so the false→true
       * condition never fires and no question is added to editingQuestions.
       */
      const q = makeQuestion('q1');
      mockUseFHIRStepper.mockReturnValue(buildStepperReturn([q]));

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([q])}
          initialAnswers={{ q1: 'yes' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          isActive={true}
        />
      );

      // Question was already submitted on mount (initialAnswers), so it shows as answered.
      const loader = screen.getByTestId('question-loader-0');
      expect(loader).toHaveAttribute('data-is-answered', 'true');
    });

    it('false→true transition in showAll mode — last question shows as answered card (Edit icon visible)', () => {
      const q = makeQuestion('q1');
      mockUseFHIRStepper.mockReturnValue(buildStepperReturn([q]));

      const questionnaire = createMockQuestionnaire([q]);
      const { rerender } = render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ q1: 'yes' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          isActive={false}
        />
      );

      rerender(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ q1: 'yes' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          isActive={true}
        />
      );

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');
      expect(screen.queryByTestId('renderer-q1')).not.toBeInTheDocument();
    });

    it('false→true transition with showAll=false — does NOT add to editingQuestions', () => {
      /*
       * useLayoutEffect condition requires showAll=true. Without it the
       * condition is skipped and no question is added to editingQuestions.
       */
      const q = makeQuestion('q1');
      mockUseFHIRStepper.mockReturnValue(
        buildStepperReturn([q], { showAll: false, currentIndex: 1, topLevelItems: [q, makeQuestion('q2')] })
      );

      const questionnaire = createMockQuestionnaire([q, makeQuestion('q2')]);
      const { rerender } = render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          isActive={false}
        />
      );

      rerender(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          isActive={true}
        />
      );

      // No edit forced: question was never submitted, so renderer is shown in normal active mode
      expect(screen.getByTestId('renderer-q1')).toBeInTheDocument();
    });

    it('false→true transition in showAll mode — last question shows answered card, not edit buttons', () => {
      const q = makeQuestion('q-last', false); // non-required
      mockUseFHIRStepper.mockReturnValue(buildStepperReturn([q]));

      const questionnaire = createMockQuestionnaire([q]);
      const { rerender } = render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ 'q-last': 'yes' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          isActive={false}
        />
      );

      rerender(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ 'q-last': 'yes' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          isActive={true}
        />
      );

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');
      expect(screen.queryByTestId('button-skip')).not.toBeInTheDocument();
      expect(screen.queryByTestId('button-submit')).not.toBeInTheDocument();
    });

    it('isActive stays false — last question stays answered, editingQuestions untouched', () => {
      const q = makeQuestion('q1');
      mockUseFHIRStepper.mockReturnValue(buildStepperReturn([q]));

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire([q])}
          initialAnswers={{ q1: 'yes' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          isActive={false}
        />
      );

      // No false→true transition → editingQuestions empty → showAsAnswered stays true
      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');
    });

    it('back-navigation restores all answered questions to answered-card state', () => {
      const q1 = makeQuestion('q1');
      const q2 = makeQuestion('q2');
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: q1,
        currentIndex: 0,
        total: 2,
        answers: { q1: 'yes', q2: 'yes' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [q1, q2],
        isLast: false,
        showAll: true,
      });

      const questionnaire = createMockQuestionnaire([q1, q2]);
      const { rerender } = render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ q1: 'yes', q2: 'yes' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          isActive={false}
        />
      );

      rerender(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ q1: 'yes', q2: 'yes' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          isActive={true}
        />
      );

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');
      expect(screen.getByTestId('question-loader-1')).toHaveAttribute('data-is-answered', 'true');
      expect(screen.queryByTestId('renderer-q2')).not.toBeInTheDocument();
    });

    it('idempotent: second false→true transition keeps last question as answered card', () => {
      const q = makeQuestion('q1');
      mockUseFHIRStepper.mockReturnValue(buildStepperReturn([q]));

      const questionnaire = createMockQuestionnaire([q]);
      const { rerender } = render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ q1: 'yes' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          isActive={false}
        />
      );

      rerender(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ q1: 'yes' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          isActive={true}
        />
      );

      // Navigate away again (true→false)
      rerender(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ q1: 'yes' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          isActive={false}
        />
      );

      rerender(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ q1: 'yes' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          isActive={true}
        />
      );

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');
      expect(screen.queryByTestId('renderer-q1')).not.toBeInTheDocument();
    });

    it('does not crash when topLevelItems is empty — useLayoutEffect iterates empty array', () => {
      const q = makeQuestion('q1');
      // currentQuestion is needed to avoid the early `if (!currentQuestion) return null`
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: q,
        currentIndex: 0,
        total: 0,
        answers: {},
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [],
        isLast: false,
        showAll: true,
      });

      const questionnaire = createMockQuestionnaire([q]);
      const { rerender } = render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          isActive={false}
        />
      );

      // Should not throw even though topLevelItems is empty
      expect(() =>
        rerender(
          <AyuStepperContainer
            questionnaire={questionnaire}
            onComplete={mockOnComplete}
            onProgressUpdate={mockOnProgressUpdate}
            isActive={true}
          />
        )
      ).not.toThrow();
    });

    it('spurious re-render with isActive=true throughout — does NOT force edit (FE-001 regression)', () => {
      /*
       * FE-001 guard: the parent derives isActive={currentSectionIndex === 1}.
       * If the parent re-renders for an unrelated reason while already on the
       * VisitReason section, isActive stays true on both renders. The
       * useLayoutEffect condition !prevIsActiveRef.current && isActive is false
       * (prev === true) so no question is added to editingQuestions.
       */
      const q = makeQuestion('q1');
      mockUseFHIRStepper.mockReturnValue(buildStepperReturn([q]));

      const questionnaire = createMockQuestionnaire([q]);
      const { rerender } = render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ q1: 'yes' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          isActive={true}
        />
      );

      // Spurious re-render: isActive stays true, parent re-renders for other reasons
      rerender(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ q1: 'yes' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          isActive={true}
        />
      );

      // Question must remain in answered state — no spurious edit was forced
      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');
      expect(screen.queryByTestId('renderer-q1')).not.toBeInTheDocument();
    });

    it('back-navigation clears editingQuestions for ALL questions — not just the last one (PE Q7-Q13 regression)', () => {
      const q1 = makeQuestion('q1');
      const q2 = makeQuestion('q2');
      const q3 = makeQuestion('q3');
      const q4 = makeQuestion('q4');
      const questions = [q1, q2, q3, q4];

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: q1,
        currentIndex: 0,
        total: 4,
        answers: { q1: 'yes', q2: 'yes', q3: 'yes', q4: 'yes' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: questions,
        isLast: false,
        showAll: true,
      });

      const questionnaire = createMockQuestionnaire(questions);
      const initialAnswers = { q1: 'yes', q2: 'yes', q3: 'yes', q4: 'yes' };

      const { rerender } = render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={initialAnswers}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          isActive={true}
        />
      );

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');
      expect(screen.getByTestId('question-loader-1')).toHaveAttribute('data-is-answered', 'true');
      expect(screen.getByTestId('question-loader-2')).toHaveAttribute('data-is-answered', 'true');
      expect(screen.getByTestId('question-loader-3')).toHaveAttribute('data-is-answered', 'true');

      fireEvent.click(screen.getByTestId('edit-1'));
      fireEvent.click(screen.getByTestId('edit-2'));

      expect(screen.getByTestId('question-loader-1')).toHaveAttribute('data-is-answered', 'false');
      expect(screen.getByTestId('question-loader-2')).toHaveAttribute('data-is-answered', 'false');

      rerender(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={initialAnswers}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          isActive={false}
        />
      );

      rerender(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={initialAnswers}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          isActive={true}
        />
      );

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');
      expect(screen.getByTestId('question-loader-1')).toHaveAttribute('data-is-answered', 'true');
      expect(screen.getByTestId('question-loader-2')).toHaveAttribute('data-is-answered', 'true');
      expect(screen.getByTestId('question-loader-3')).toHaveAttribute('data-is-answered', 'true');
    });
  });

  describe('Last question Edit icon after auto-advance (regression fix)', () => {
    const lastQuestionFixQuestions: AyuQuestion[] = [
      {
        linkId: 'q1',
        text: 'Question 1',
        type: 'choice',
        answerOption: [{ valueCoding: { code: 'a', display: 'A' } }],
      },
      {
        linkId: 'q2',
        text: 'Question 2 (last)',
        type: 'choice',
        answerOption: [{ valueCoding: { code: 'b', display: 'B' } }],
      },
    ];

    it('should show Edit icon for last question after handleStepperComplete is called (skipSummary / PE path)', () => {
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: lastQuestionFixQuestions[1],
        currentIndex: 1,
        total: 2,
        answers: { q1: 'a', q2: 'b' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: lastQuestionFixQuestions,
        isLast: true,
        showAll: false,
        isCameraNotUploaded: () => false,
      });

      const questionnaire = createMockQuestionnaire(lastQuestionFixQuestions);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          skipSummary
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('question-loader-1')).toHaveAttribute('data-is-answered', 'false');
      expect(screen.queryByTestId('edit-1')).not.toBeInTheDocument();

      const hookProps = _mockUseFHIRStepper.mock.calls[0][0] as {
        onComplete?: (a: Record<string, AyuAnswerValue>) => void;
      };
      act(() => {
        hookProps.onComplete?.({ q1: 'a', q2: 'b' });
      });

      expect(screen.getByTestId('question-loader-1')).toHaveAttribute('data-is-answered', 'true');
      expect(screen.getByTestId('edit-1')).toBeInTheDocument();
    });

    it('should show Edit icon for last question when showAll transitions false → true (Visit Reason summary path)', () => {
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: lastQuestionFixQuestions[1],
        currentIndex: 1,
        total: 2,
        answers: { q1: 'a', q2: 'b' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: lastQuestionFixQuestions,
        isLast: true,
        showAll: false,
        isCameraNotUploaded: () => false,
      });

      const questionnaire = createMockQuestionnaire(lastQuestionFixQuestions);
      const { rerender } = render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('question-loader-1')).toHaveAttribute('data-is-answered', 'false');

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: lastQuestionFixQuestions[1],
        currentIndex: 1,
        total: 2,
        answers: { q1: 'a', q2: 'b' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: lastQuestionFixQuestions,
        isLast: true,
        showAll: true,
        isCameraNotUploaded: () => false,
      });

      rerender(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('question-loader-1')).toHaveAttribute('data-is-answered', 'true');
      expect(screen.getByTestId('edit-1')).toBeInTheDocument();
    });
  });

  describe('resetLinkIds — onResetAnswers clears UI state (lines 558-561)', () => {
    it('calling onResetAnswers clears submittedQuestions so the card leaves answered state', () => {
      const question: AyuQuestion = {
        linkId: 'gender',
        text: 'Gender',
        type: 'choice',
        required: true,
      };

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: question,
        currentIndex: 0,
        total: 1,
        answers: { gender: 'female' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: [question],
        isLast: true,
        showAll: false,
        isCameraNotUploaded: () => false,
      });

      const questionnaire = createMockQuestionnaire([question]);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ gender: 'female' }}
          resetLinkIds={['gender']}
        />
      );

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');

      const hookProps = _mockUseFHIRStepper.mock.calls[0][0] as { onResetAnswers?: () => void };
      act(() => { hookProps.onResetAnswers?.(); });

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'false');
    });
  });

  describe('submittedQuestions set-membership fast paths', () => {
    it('should not re-add last item to submittedQuestions when already present on complete', () => {
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'string', required: true },
      ];

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[0],
        currentIndex: 0,
        total: 1,
        answers: { q1: 'a' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: questions,
        isLast: true,
        showAll: false,
      });

      render(
        <AyuStepperContainer
          questionnaire={createMockQuestionnaire(questions)}
          initialAnswers={{ q1: 'a' }}
          skipSummary
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );


      const hookOnComplete = _mockUseFHIRStepper.mock.calls.at(-1)?.[0]?.onComplete;
      hookOnComplete?.({ q1: 'a' });

      expect(mockOnComplete).toHaveBeenCalledWith({ q1: 'a' });
      expect(screen.getByTestId('question-loader-0')).toBeInTheDocument();
    });

    it('should not re-add last question when showAll transitions false→true and question already submitted', () => {
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'string', required: true },
      ];

      const makeReturn = (showAll: boolean) => ({
        currentQuestion: questions[0],
        currentIndex: 0,
        total: 1,
        answers: { q1: 'a' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: questions,
        isLast: true,
        showAll,
      });

      mockUseFHIRStepper.mockReturnValue(makeReturn(false));

      const questionnaire = createMockQuestionnaire(questions);
      // initialAnswers puts q1 into submittedQuestions at construction time
      const { rerender } = render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ q1: 'a' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      mockUseFHIRStepper.mockReturnValue(makeReturn(true));
      rerender(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ q1: 'a' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');
    });

    it('should return prev unchanged from useLayoutEffect when no new answered items exist', () => {
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'string', required: true },
      ];

      const makeReturn = (showAll: boolean) => ({
        currentQuestion: questions[0],
        currentIndex: 0,
        total: 1,
        answers: { q1: 'a' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: questions,
        isLast: true,
        showAll,
      });

      mockUseFHIRStepper.mockReturnValue(makeReturn(true));

      const questionnaire = createMockQuestionnaire(questions);

      const { rerender } = render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ q1: 'a' }}
          isActive={true}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // isActive: true → false (prevIsActiveRef becomes false)
      rerender(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ q1: 'a' }}
          isActive={false}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );


      rerender(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ q1: 'a' }}
          isActive={true}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');
    });

    it('should not double-add question via backfill when already in submittedQuestions', () => {
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'string', required: true },
        { linkId: 'q2', text: 'Question 2', type: 'string', required: true },
      ];

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[0],
        currentIndex: 0,
        total: 2,
        answers: { q1: 'a' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: questions,
        isLast: false,
        showAll: false,
      });

      const questionnaire = createMockQuestionnaire(questions);
      // initialAnswers puts q1 into submittedQuestions at construction time.
      const { rerender } = render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ q1: 'a' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // currentIndex advances to 1; backfill effect iterates from 0 to 1 and
      // tries to add q1. q1 is already in submittedQuestions → prevSet.has('q1')
      // → true fast-path returns prevSet unchanged.
      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[1],
        currentIndex: 1,
        total: 2,
        answers: { q1: 'a' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: questions,
        isLast: true,
        showAll: false,
      });

      rerender(
        <AyuStepperContainer
          questionnaire={questionnaire}
          initialAnswers={{ q1: 'a' }}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');
      expect(screen.getByTestId('question-loader-1')).toHaveAttribute('data-is-answered', 'false');
    });
  });

  describe('onResetAnswers callback', () => {
    it('should call onResetAnswers prop when useFHIRStepper triggers a reset', () => {
      const mockOnResetAnswers = vi.fn();
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'string', required: true },
      ];

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[0],
        currentIndex: 0,
        total: 1,
        answers: {},
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: questions,
        isLast: false,
        showAll: false,
      });

      const questionnaire = createMockQuestionnaire(questions);
      render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
          onResetAnswers={mockOnResetAnswers}
        />
      );

      // Invoke the onResetAnswers callback that was wired into useFHIRStepper.
      // This calls resetAnswersRef.current(), which calls onResetAnswers?.() at line 595.
      const hookOnResetAnswers = _mockUseFHIRStepper.mock.calls.at(-1)?.[0]
        ?.onResetAnswers as () => void;
      hookOnResetAnswers();

      expect(mockOnResetAnswers).toHaveBeenCalledTimes(1);
    });

    it('should update submittedQuestions with new answered items when isActive transitions false to true', () => {
      // Covers line 694 "return next" branch:
      // prev is empty (no initialAnswers), latestAnswers has q1 → next.size > prev.size → returns next.
      const questions: AyuQuestion[] = [
        { linkId: 'q1', text: 'Question 1', type: 'string', required: true },
      ];

      mockUseFHIRStepper.mockReturnValue({
        currentQuestion: questions[0],
        currentIndex: 0,
        total: 1,
        answers: { q1: 'a' },
        setAnswer: mockSetAnswer,
        clearAnswers: mockClearAnswers,
        goNext: mockGoNext,
        topLevelItems: questions,
        isLast: false,
        showAll: true,
      });

      const questionnaire = createMockQuestionnaire(questions);
      // isActive=false → prevIsActiveRef initialises as false.
      // No initialAnswers → submittedQuestions starts empty.
      const { rerender } = render(
        <AyuStepperContainer
          questionnaire={questionnaire}
          isActive={false}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      // isActive: false → true triggers useLayoutEffect body.
      // prev is empty, latestAnswers has q1 → next adds q1 → next.size(1) != prev.size(0) → returns next.
      rerender(
        <AyuStepperContainer
          questionnaire={questionnaire}
          isActive={true}
          onComplete={mockOnComplete}
          onProgressUpdate={mockOnProgressUpdate}
        />
      );

      expect(screen.getByTestId('question-loader-0')).toHaveAttribute('data-is-answered', 'true');
    });
  });
});

describe('AyuStepperContainer - answered rows across repeating branches', () => {
  const SYS = 'https://intelehealth.org/fhir/CodeSystem/questionnaire-options';
  const RIGHT = 'ID_274596701';
  const LEFT = 'ID_1753721531';
  const gate = (question: string, code: string) => [
    { question, operator: '=', answerCoding: { system: SYS, code } },
  ];
  const part = (linkId: string, text: string, leg: string) =>
    ({ linkId, text, type: 'string', enableWhen: gate('site', leg) }) as unknown as AyuQuestion;

  const site = {
    linkId: 'site',
    text: 'Which part of the leg or hip do you feel pain?*',
    type: 'choice',
    repeats: true,
    answerOption: [
      { valueCoding: { system: SYS, code: RIGHT, display: 'Right leg' } },
      { valueCoding: { system: SYS, code: LEFT, display: 'Left leg' } },
    ],
    item: [
      part('r-hip', 'Hip', RIGHT),
      part('r-calf', 'Calf', RIGHT),
      part('l-hip', 'Hip', LEFT),
      part('l-calf', 'Calf', LEFT),
    ],
  } as unknown as AyuQuestion;

  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateAllQuestions.mockReturnValue(true);
    Element.prototype.scrollIntoView = vi.fn();
    mockResolveAyuComponent.mockReturnValue('selectableOptionGroup');
    mockIsStrictAssociatedSymptoms.mockReturnValue(false);
    mockResolveAyuComponentLogic.mockReturnValue('selectableOptionGroup');
    mockIsStrictAssociatedSymptomsLogic.mockReturnValue(false);
  });

  const renderAndSubmit = (answers: Record<string, AyuAnswerValue>) => {
    mockUseFHIRStepper.mockReturnValue({
      currentQuestion: site,
      currentIndex: 0,
      total: 1,
      answers,
      setAnswer: vi.fn(),
      clearAnswers: vi.fn(),
      goNext: vi.fn(),
      topLevelItems: [site],
      isLast: true,
      showAll: false,
    });

    const utils = render(
      <AyuStepperContainer questionnaire={{ item: [site] }} onComplete={vi.fn()} />
    );
    fireEvent.click(screen.getByText('Submit'));
    return utils;
  };

  it('qualifies duplicated labels with their branch', () => {
    const { container } = renderAndSubmit({
      site: [RIGHT, LEFT],
      'r-hip': 'dsv',
      'r-calf': 'sdv',
      'l-hip': 'abc',
      'l-calf': 'xyz',
    });

    const text = container.textContent ?? '';
    expect(text).toContain('Right leg - Hip');
    expect(text).toContain('Left leg - Hip');
    expect(text).toContain('Right leg - Calf');
    expect(text).toContain('Left leg - Calf');
  });

  it('leaves labels unqualified when only one branch is answered', () => {
    const { container } = renderAndSubmit({
      site: [RIGHT],
      'r-hip': 'dsv',
      'r-calf': 'sdv',
    });

    const text = container.textContent ?? '';
    expect(text).not.toContain('Right leg - Hip');
    expect(text).toContain('Hip');
  });
});
