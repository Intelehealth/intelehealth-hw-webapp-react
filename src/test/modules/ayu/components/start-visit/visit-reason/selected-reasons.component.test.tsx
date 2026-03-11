import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectedReasons } from '../../../../../../modules/ayu/components/start-visit/visit-reason/selected-reasons.component';

describe('SelectedReasons', () => {
  const mockRemoveReason = vi.fn();

  it('should return null when no reasons are selected', () => {
    const { container } = render(
      <SelectedReasons selectedReasons={[]} removeReason={mockRemoveReason} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render selected reasons', () => {
    render(
      <SelectedReasons
        selectedReasons={['Fever', 'Cough']}
        removeReason={mockRemoveReason}
      />
    );

    expect(screen.getByText('Fever')).toBeInTheDocument();
    expect(screen.getByText('Cough')).toBeInTheDocument();
  });

  it('should display "Selected reasons" heading', () => {
    render(
      <SelectedReasons
        selectedReasons={['Fever']}
        removeReason={mockRemoveReason}
      />
    );

    expect(screen.getByText('Selected reasons')).toBeInTheDocument();
  });

  it('should call removeReason when remove button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SelectedReasons
        selectedReasons={['Fever']}
        removeReason={mockRemoveReason}
      />
    );

    const removeButton = screen.getByRole('button');
    await user.click(removeButton);

    expect(mockRemoveReason).toHaveBeenCalledWith('Fever');
  });

  it('should render multiple reasons with remove buttons', () => {
    render(
      <SelectedReasons
        selectedReasons={['Fever', 'Cough', 'Headache']}
        removeReason={mockRemoveReason}
      />
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);
  });

  it('should call removeReason with correct reason for each button', async () => {
    const user = userEvent.setup();
    render(
      <SelectedReasons
        selectedReasons={['Fever', 'Cough']}
        removeReason={mockRemoveReason}
      />
    );

    const buttons = screen.getAllByRole('button');
    await user.click(buttons[1]);

    expect(mockRemoveReason).toHaveBeenCalledWith('Cough');
  });

  it('should render remove button with ✕ character', () => {
    render(
      <SelectedReasons
        selectedReasons={['Fever']}
        removeReason={mockRemoveReason}
      />
    );

    const button = screen.getByRole('button');
    expect(button.textContent).toBe('✕');
  });

  it('should render reasons with correct styling classes', () => {
    const { container } = render(
      <SelectedReasons
        selectedReasons={['Fever']}
        removeReason={mockRemoveReason}
      />
    );

    const reasonChip = container.querySelector('.bg-\\[\\#2E1E91\\]');
    expect(reasonChip).toBeInTheDocument();
  });
});
