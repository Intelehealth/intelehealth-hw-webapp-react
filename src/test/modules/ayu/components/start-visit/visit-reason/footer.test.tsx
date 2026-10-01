import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisitReasonFooter } from '../../../../../../modules/ayu/components/start-visit/visit-reason/footer';
import { HeaderActionsSlotContext } from '../../../../../../modules/ayu/components/start-visit/header-actions-slot.context';

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

  it('should render Back and Start Assessment buttons', () => {
    render(
      <VisitReasonFooter
        questionIndex={0}
        totalQuestions={6}
        onNextQuestion={mockOnNextQuestion}
        onPrevQuestion={mockOnPrevQuestion}
      />
    );

    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('Start Assessment')).toBeInTheDocument();
  });

  it('should show "Start Assessment" on last question (no Confirm button)', () => {
    render(
      <VisitReasonFooter
        questionIndex={5}
        totalQuestions={6}
        onNextQuestion={mockOnNextQuestion}
        onPrevQuestion={mockOnPrevQuestion}
      />
    );

    expect(screen.getByText('Start Assessment')).toBeInTheDocument();
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

  it('should call onNextQuestion when Start Assessment is clicked', async () => {
    const user = userEvent.setup();
    render(
      <VisitReasonFooter
        questionIndex={0}
        totalQuestions={6}
        onNextQuestion={mockOnNextQuestion}
        onPrevQuestion={mockOnPrevQuestion}
      />
    );

    await user.click(screen.getByText('Start Assessment'));
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

    await user.click(screen.getByText('Back'));
    expect(mockOnPrevQuestion).not.toHaveBeenCalled();
  });

  describe('header actions slot', () => {
    const renderWithSlot = (slot: HTMLElement | null, isActive?: boolean) =>
      render(
        <HeaderActionsSlotContext.Provider value={slot}>
          <VisitReasonFooter
            questionIndex={0}
            totalQuestions={6}
            onNextQuestion={mockOnNextQuestion}
            onPrevQuestion={mockOnPrevQuestion}
            isActive={isActive}
          />
        </HeaderActionsSlotContext.Provider>
      );

    it('should portal the buttons into the header slot when one is provided', () => {
      const slot = document.createElement('div');
      document.body.appendChild(slot);

      const { container } = renderWithSlot(slot);

      // The buttons live in the header slot, not where the footer is rendered,
      // so they no longer take a row of their own.
      expect(slot).toHaveTextContent('Back');
      expect(slot).toHaveTextContent('Start Assessment');
      expect(container).toBeEmptyDOMElement();
    });

    it('should stay wired up to its callbacks once portalled', async () => {
      const user = userEvent.setup();
      const slot = document.createElement('div');
      document.body.appendChild(slot);

      renderWithSlot(slot);
      await user.click(screen.getByText('Start Assessment'));

      expect(mockOnNextQuestion).toHaveBeenCalled();
    });

    it('should render nothing when the section is not active', () => {
      const slot = document.createElement('div');
      document.body.appendChild(slot);

      // The header slot is shared between sections; a hidden section must not
      // portal its actions into it, since a portal escapes `display: none`.
      const { container } = renderWithSlot(slot, false);

      expect(slot).toBeEmptyDOMElement();
      expect(container).toBeEmptyDOMElement();
    });

    it('should fall back to rendering in place when there is no slot', () => {
      const { container } = renderWithSlot(null);

      expect(container).toHaveTextContent('Back');
      expect(container).toHaveTextContent('Start Assessment');
    });
  });
});
