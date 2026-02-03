import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { QuestionLoader } from '../../../../../modules/ayu/components/loaders/question-loader.component';

describe('QuestionLoader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  const defaultProps = {
    question: 'What is your age?',
    questionIndex: 0,
    totalQuestions: 5,
    onNextQuestion: vi.fn(),
  };

  describe('Rendering', () => {
    it('should render the component with basic structure', () => {
      const { container } = render(<QuestionLoader {...defaultProps} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('should display question icon', () => {
      render(<QuestionLoader {...defaultProps} />);
      const icon = screen.getByAltText('Question Icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute('src');
    });

    it('should render question counter correctly', () => {
      render(<QuestionLoader {...defaultProps} />);
      expect(screen.getByText('1 of 5 questions')).toBeInTheDocument();
    });

    it('should calculate question counter correctly for different indices', () => {
      render(<QuestionLoader {...defaultProps} questionIndex={2} totalQuestions={10} />);
      expect(screen.getByText('3 of 10 questions')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading dots initially', () => {
      const { container } = render(<QuestionLoader {...defaultProps} />);
      const dots = container.querySelectorAll('.bg-emerald-500');
      expect(dots).toHaveLength(3);
    });

    it('should show question text after loading timeout', async () => {
      render(<QuestionLoader {...defaultProps} />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(screen.getByText('What is your age?')).toBeInTheDocument();
    });

    it('should not show loading dots after timeout', async () => {
      const { container } = render(<QuestionLoader {...defaultProps} />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      const dots = container.querySelectorAll('.bg-emerald-500');
      expect(dots).toHaveLength(0);
    });

    it('should reset loading state when questionIndex changes', async () => {
      const { rerender, container } = render(<QuestionLoader {...defaultProps} />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(screen.getByText('What is your age?')).toBeInTheDocument();

      rerender(<QuestionLoader {...defaultProps} questionIndex={1} />);

      const dots = container.querySelectorAll('.bg-emerald-500');
      expect(dots).toHaveLength(3);
    });
  });

  describe('Question Display', () => {
    it('should display the question text after loading', async () => {
      render(<QuestionLoader {...defaultProps} question="How old are you?" />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(screen.getByText('How old are you?')).toBeInTheDocument();
    });

    it('should display required asterisk when question is provided', async () => {
      render(<QuestionLoader {...defaultProps} />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      const asterisk = screen.getByText('*');
      expect(asterisk).toHaveClass('text-red-500');
    });

    it('should render children after loading completes', async () => {
      render(
        <QuestionLoader {...defaultProps}>
          <div>Test child content</div>
        </QuestionLoader>
      );

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(screen.getByText('Test child content')).toBeInTheDocument();
    });

    it('should use default question when not provided', async () => {
      const propsWithoutQuestion = {
        ...defaultProps,
        question: undefined as any,
      };
      render(<QuestionLoader {...propsWithoutQuestion} />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(screen.getByText('Since when have you had this symptom?')).toBeInTheDocument();
    });
  });

  describe('Question Counter Edge Cases', () => {
    it('should handle questionIndex of 0', () => {
      render(<QuestionLoader {...defaultProps} questionIndex={0} />);
      expect(screen.getByText('1 of 5 questions')).toBeInTheDocument();
    });

    it('should handle last question index', () => {
      render(<QuestionLoader {...defaultProps} questionIndex={4} totalQuestions={5} />);
      expect(screen.getByText('5 of 5 questions')).toBeInTheDocument();
    });

    it('should handle single question', () => {
      render(<QuestionLoader {...defaultProps} questionIndex={0} totalQuestions={1} />);
      expect(screen.getByText('1 of 1 questions')).toBeInTheDocument();
    });
  });

  describe('Loading Animation', () => {
    it('should have three animated dots with different delays', () => {
      const { container } = render(<QuestionLoader {...defaultProps} />);
      const dots = container.querySelectorAll('.bg-emerald-500');

      expect(dots).toHaveLength(3);
      expect(dots[0]).toHaveStyle({ animationDelay: '0s' });
      expect(dots[1]).toHaveStyle({ animationDelay: '0.2s' });
      expect(dots[2]).toHaveStyle({ animationDelay: '0.4s' });
    });
  });

  describe('Component Structure', () => {
    it('should have emerald green comment box', () => {
      const { container } = render(<QuestionLoader {...defaultProps} />);
      const commentBox = container.querySelector('.bg-emerald-50');
      expect(commentBox).toBeInTheDocument();
    });

    it('should maintain max width of 760px', () => {
      const { container } = render(<QuestionLoader {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('max-w-[760px]');
    });
  });
});
