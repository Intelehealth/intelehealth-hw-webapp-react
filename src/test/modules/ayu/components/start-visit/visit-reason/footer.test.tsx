import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisitReasonFooter } from '../../../../../../modules/ayu/components/start-visit/visit-reason/footer';

// Mock AyuButton component
vi.mock('../../../../../../modules/ayu/components/common/ayu-button.component', () => ({
  default: ({ children, onClick, variant }: any) => (
    <button data-testid={`button-${variant}`} onClick={onClick}>
      {children}
    </button>
  ),
}));

describe('VisitReasonFooter', () => {
  const mockOnNextQuestion = vi.fn();
  const mockOnPrevQuestion = vi.fn();
  const mockOnPrevSection = vi.fn();

  it('should render Back and Next buttons', () => {
    render(
      <VisitReasonFooter
        questionIndex={0}
        totalQuestions={6}
        onNextQuestion={mockOnNextQuestion}
        onPrevQuestion={mockOnPrevQuestion}
      />
    );

    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('should show "Confirm" on last question', () => {
    render(
      <VisitReasonFooter
        questionIndex={5}
        totalQuestions={6}
        onNextQuestion={mockOnNextQuestion}
        onPrevQuestion={mockOnPrevQuestion}
      />
    );

    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('should call onPrevSection when Back is clicked on first question', async () => {
    const user = userEvent.setup();
    render(
      <VisitReasonFooter
        questionIndex={0}
        totalQuestions={6}
        onNextQuestion={mockOnNextQuestion}
        onPrevQuestion={mockOnPrevQuestion}
        onPrevSection={mockOnPrevSection}
      />
    );

    await user.click(screen.getByText('Back'));
    expect(mockOnPrevSection).toHaveBeenCalled();
  });

  it('should call onPrevQuestion when Back is clicked on non-first question', async () => {
    const user = userEvent.setup();
    render(
      <VisitReasonFooter
        questionIndex={2}
        totalQuestions={6}
        onNextQuestion={mockOnNextQuestion}
        onPrevQuestion={mockOnPrevQuestion}
      />
    );

    await user.click(screen.getByText('Back'));
    expect(mockOnPrevQuestion).toHaveBeenCalled();
  });

  it('should call onNextQuestion when Next is clicked', async () => {
    const user = userEvent.setup();
    render(
      <VisitReasonFooter
        questionIndex={0}
        totalQuestions={6}
        onNextQuestion={mockOnNextQuestion}
        onPrevQuestion={mockOnPrevQuestion}
      />
    );

    await user.click(screen.getByText('Next'));
    expect(mockOnNextQuestion).toHaveBeenCalled();
  });
});
