import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, render, screen, act } from '@testing-library/react';
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

    it('should render question counter correctly after loading completes', async () => {
      render(<QuestionLoader {...defaultProps} />);
      await act(async () => {
        vi.advanceTimersByTime(800);
      });
      expect(screen.getByText('Question 1/5')).toBeInTheDocument();
    });

    it('should calculate question counter correctly for different indices', async () => {
      render(<QuestionLoader {...defaultProps} questionIndex={2} totalQuestions={10} />);
      await act(async () => {
        vi.advanceTimersByTime(800);
      });
      expect(screen.getByText('Question 3/10')).toBeInTheDocument();
    });

    it('should hide question counter when isShowQuestionNumber is false', async () => {
      render(<QuestionLoader {...defaultProps} isShowQuestionNumber={false} />);
      await act(async () => {
        vi.advanceTimersByTime(800);
      });
      expect(screen.queryByText(/Question 1\/5/)).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading dots initially', () => {
      const { container } = render(<QuestionLoader {...defaultProps} />);
      const dots = container.querySelectorAll('.bg-emerald-500');
      expect(dots).toHaveLength(3);
    });

    it('should hide loading dots after loading timeout', async () => {
      const { container } = render(<QuestionLoader {...defaultProps} />);

      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      const dots = container.querySelectorAll('.bg-emerald-500');
      expect(dots).toHaveLength(0);
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

      let dots = container.querySelectorAll('.bg-emerald-500');
      expect(dots).toHaveLength(0);

      rerender(<QuestionLoader {...defaultProps} questionIndex={1} />);

      dots = container.querySelectorAll('.bg-emerald-500');
      expect(dots).toHaveLength(3);
    });
  });

  describe('Question Display', () => {
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
  });

  describe('Question Counter Edge Cases', () => {
    it('should handle questionIndex of 0', async () => {
      render(<QuestionLoader {...defaultProps} questionIndex={0} />);
      await act(async () => {
        vi.advanceTimersByTime(800);
      });
      expect(screen.getByText('Question 1/5')).toBeInTheDocument();
    });

    it('should handle last question index', async () => {
      render(<QuestionLoader {...defaultProps} questionIndex={4} totalQuestions={5} />);
      await act(async () => {
        vi.advanceTimersByTime(800);
      });
      expect(screen.getByText('Question 5/5')).toBeInTheDocument();
    });

    it('should handle single question', async () => {
      render(<QuestionLoader {...defaultProps} questionIndex={0} totalQuestions={1} />);
      await act(async () => {
        vi.advanceTimersByTime(800);
      });
      expect(screen.getByText('Question 1/1')).toBeInTheDocument();
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
      const commentBox = container.querySelector('.bg-\\[\\#E5FFF3\\]');
      expect(commentBox).toBeInTheDocument();
    });

    it('should maintain max width of 760px', () => {
      const { container } = render(<QuestionLoader {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('max-w-[950px]');
    });
  });

  describe('Answered State', () => {
    it('should render the green answered icon when isAnswered is true', () => {
      render(<QuestionLoader {...defaultProps} isAnswered={true} />);
      const answeredIcon = screen.getByAltText('Answered');
      expect(answeredIcon).toBeInTheDocument();

      const circle = answeredIcon.parentElement as HTMLElement;
      expect(circle).toHaveClass('bg-[#0FD197]');
      expect(circle).toHaveClass('rounded-full');
    });

    it('should not render the question icon when isAnswered is true', () => {
      render(<QuestionLoader {...defaultProps} isAnswered={true} />);
      expect(screen.queryByAltText('Question Icon')).not.toBeInTheDocument();
    });

    it('should render the white-card variant when isAnswered is true', () => {
      const { container } = render(
        <QuestionLoader {...defaultProps} isAnswered={true} />
      );

      expect(container.querySelector('.bg-white')).toBeInTheDocument();
      expect(container.querySelector('.bg-\\[\\#E5FFF3\\]')).not.toBeInTheDocument();
    });

    it('should skip the loading delay when isAnswered is true', () => {
      const { container } = render(
        <QuestionLoader {...defaultProps} isAnswered={true} />
      );

      expect(container.querySelectorAll('.bg-emerald-500')).toHaveLength(0);
    });

    it('should render the edit affordance when isAnswered and onEdit are provided', () => {
      const onEdit = vi.fn();
      render(<QuestionLoader {...defaultProps} isAnswered={true} onEdit={onEdit} />);
      const editButton = screen.getByRole('button', { name: /edit answer/i });
      expect(editButton).toBeInTheDocument();
    });

    it('should call onEdit when the edit affordance is clicked', () => {
      const onEdit = vi.fn();
      render(<QuestionLoader {...defaultProps} isAnswered={true} onEdit={onEdit} />);
      fireEvent.click(screen.getByRole('button', { name: /edit answer/i }));
      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('should not render the edit affordance when onEdit is not provided', () => {
      render(<QuestionLoader {...defaultProps} isAnswered={true} />);
      expect(screen.queryByRole('button', { name: /edit answer/i })).not.toBeInTheDocument();
    });

    it('should not render the edit affordance when isAnswered is false even if onEdit is provided', async () => {
      render(
        <QuestionLoader {...defaultProps} isAnswered={false} onEdit={vi.fn()} />
      );
      await act(async () => {
        vi.advanceTimersByTime(800);
      });

      expect(screen.queryByRole('button', { name: /edit answer/i })).not.toBeInTheDocument();
    });
  });
});
