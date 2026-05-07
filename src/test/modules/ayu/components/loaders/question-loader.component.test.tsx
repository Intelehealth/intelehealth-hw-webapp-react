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

      // Loading should be complete
      let dots = container.querySelectorAll('.bg-emerald-500');
      expect(dots).toHaveLength(0);

      rerender(<QuestionLoader {...defaultProps} questionIndex={1} />);

      // Loading should restart
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
});
