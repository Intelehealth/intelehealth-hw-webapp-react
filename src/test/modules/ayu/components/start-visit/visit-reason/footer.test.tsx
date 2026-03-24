import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisitReasonFooter } from '../../../../../../modules/ayu/components/start-visit/visit-reason/footer';

// Mock AyuButton component
vi.mock('../../../../../../modules/ayu/components/common/ayu-button.component', () => ({
  default: ({ children, onClick, variant, disabled }: any) => (
    <button data-testid={`button-${variant}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));

describe('VisitReasonFooter', () => {
  const mockOnNextQuestion = vi.fn();
  const mockOnPrevQuestion = vi.fn();
  const mockOnPrevSection = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it('should show "Next" on last question (no Confirm button)', () => {
    render(
      <VisitReasonFooter
        questionIndex={5}
        totalQuestions={6}
        onNextQuestion={mockOnNextQuestion}
        onPrevQuestion={mockOnPrevQuestion}
      />
    );

    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
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

  it('should disable next button when isNextDisabled is true', () => {
    render(
      <VisitReasonFooter
        questionIndex={0}
        totalQuestions={6}
        onNextQuestion={mockOnNextQuestion}
        onPrevQuestion={mockOnPrevQuestion}
        isNextDisabled={true}
      />
    );

    const nextButton = screen.getByTestId('button-primary');
    expect(nextButton).toBeDisabled();
  });

  it('should not disable next button when isNextDisabled is false', () => {
    render(
      <VisitReasonFooter
        questionIndex={0}
        totalQuestions={6}
        onNextQuestion={mockOnNextQuestion}
        onPrevQuestion={mockOnPrevQuestion}
        isNextDisabled={false}
      />
    );

    const nextButton = screen.getByTestId('button-primary');
    expect(nextButton).not.toBeDisabled();
  });

  it('should not disable next button by default when isNextDisabled is not provided', () => {
    render(
      <VisitReasonFooter
        questionIndex={0}
        totalQuestions={6}
        onNextQuestion={mockOnNextQuestion}
        onPrevQuestion={mockOnPrevQuestion}
      />
    );

    const nextButton = screen.getByTestId('button-primary');
    expect(nextButton).not.toBeDisabled();
  });

  it('should call onPrevQuestion when Back is clicked on non-first question without onPrevSection', async () => {
    const user = userEvent.setup();
    render(
      <VisitReasonFooter
        questionIndex={1}
        totalQuestions={6}
        onNextQuestion={mockOnNextQuestion}
        onPrevQuestion={mockOnPrevQuestion}
      />
    );

    await user.click(screen.getByText('Back'));
    expect(mockOnPrevQuestion).toHaveBeenCalled();
  });

  it('should not call onPrevQuestion when Back is clicked on first question without onPrevSection', async () => {
    const user = userEvent.setup();
    render(
      <VisitReasonFooter
        questionIndex={0}
        totalQuestions={6}
        onNextQuestion={mockOnNextQuestion}
        onPrevQuestion={mockOnPrevQuestion}
      />
    );

    // When onPrevSection is not provided and it's the first question,
    // clicking Back should call onPrevSection (undefined), not onPrevQuestion
    await user.click(screen.getByText('Back'));
    expect(mockOnPrevQuestion).not.toHaveBeenCalled();
  });
});
