import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReasonAlphabetList } from '../../../../../../modules/ayu/components/start-visit/visit-reason/reason-alphabetList.component';

describe('ReasonAlphabetList', () => {
  const mockAddReason = vi.fn();
  const mockGrouped = {
    F: ['Fever', 'Flu'],
    C: ['Cough', 'Cold'],
  };

  it('should render alphabet letters as headers', () => {
    render(
      <ReasonAlphabetList
        grouped={mockGrouped}
        selectedReasons={[]}
        addReason={mockAddReason}
      />
    );

    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();
  });

  it('should render reasons under their respective letters', () => {
    render(
      <ReasonAlphabetList
        grouped={mockGrouped}
        selectedReasons={[]}
        addReason={mockAddReason}
      />
    );

    expect(screen.getByText('Fever')).toBeInTheDocument();
    expect(screen.getByText('Flu')).toBeInTheDocument();
    expect(screen.getByText('Cough')).toBeInTheDocument();
    expect(screen.getByText('Cold')).toBeInTheDocument();
  });

  it('should call addReason when a reason button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ReasonAlphabetList
        grouped={mockGrouped}
        selectedReasons={[]}
        addReason={mockAddReason}
      />
    );

    await user.click(screen.getByText('Fever'));

    expect(mockAddReason).toHaveBeenCalledWith('Fever');
  });

  it('should apply selected styling to selected reasons', () => {
    render(
      <ReasonAlphabetList
        grouped={mockGrouped}
        selectedReasons={['Fever']}
        addReason={mockAddReason}
      />
    );

    const feverButton = screen.getByText('Fever');
    expect(feverButton).toHaveClass('bg-[#2E1E91]');
  });

  it('should render empty groups without errors', () => {
    render(
      <ReasonAlphabetList
        grouped={{}}
        selectedReasons={[]}
        addReason={mockAddReason}
      />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('disables and styles reasons listed in disabledReasons', async () => {
    const user = userEvent.setup();
    const addReason = vi.fn();
    render(
      <ReasonAlphabetList
        grouped={mockGrouped}
        selectedReasons={[]}
        disabledReasons={new Set(['Fever'])}
        addReason={addReason}
      />
    );

    const feverButton = screen.getByRole('button', { name: 'Fever' });
    expect(feverButton).toBeDisabled();
    expect(feverButton).toHaveAttribute('aria-disabled', 'true');
    expect(feverButton).toHaveClass('cursor-not-allowed');

    // Clicking a disabled button is a no-op (userEvent respects `disabled`).
    await user.click(feverButton);
    expect(addReason).not.toHaveBeenCalled();
  });
});
