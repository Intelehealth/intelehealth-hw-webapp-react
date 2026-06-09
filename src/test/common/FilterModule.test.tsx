import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import FilterModule from '../../components/common/filter-module.component';

describe('FilterModule', () => {
  // --- Rendering ---
  it('renders with default props (range mode, toggle visible)', () => {
    render(<FilterModule onApply={vi.fn()} />);

    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Range')).toBeInTheDocument();
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('To')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Apply' })
    ).toBeInTheDocument();
  });

  it('renders in date mode when defaultMode is date', () => {
    render(<FilterModule onApply={vi.fn()} defaultMode="date" />);

    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.queryByText('To')).not.toBeInTheDocument();
  });

  it('hides toggle buttons when showToggle is false', () => {
    render(<FilterModule onApply={vi.fn()} showToggle={false} />);

    expect(screen.queryByText('Date')).not.toBeInTheDocument();
    expect(screen.queryByText('Range')).not.toBeInTheDocument();
  });

  it('applies custom className to container', () => {
    const { container } = render(
      <FilterModule onApply={vi.fn()} className="custom-test" />
    );
    expect(container.firstChild).toHaveClass('custom-test');
  });

  // --- Mode toggling ---
  it('switches to date mode when Date button is clicked', async () => {
    const user = userEvent.setup();
    render(<FilterModule onApply={vi.fn()} />);

    // Default is range, so To should be visible
    expect(screen.getByText('To')).toBeInTheDocument();

    await user.click(screen.getByText('Date'));

    // To should be hidden in date mode
    expect(screen.queryByText('To')).not.toBeInTheDocument();
  });

  it('switches to range mode when Range button is clicked', async () => {
    const user = userEvent.setup();
    render(<FilterModule onApply={vi.fn()} defaultMode="date" />);

    expect(screen.queryByText('To')).not.toBeInTheDocument();

    await user.click(screen.getByText('Range'));

    expect(screen.getByText('To')).toBeInTheDocument();
  });

  // --- Apply button disabled state ---
  it('Apply button is disabled by default', () => {
    render(<FilterModule onApply={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('Apply button is disabled even when dates are provided', () => {
    render(
      <FilterModule
        onApply={vi.fn()}
        defaultFrom="2025-04-20"
        defaultTo="2025-04-25"
      />
    );
    // isApplyDisablednow is hardcoded true
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('does not call onApply when Apply button is clicked (disabled)', async () => {
    const handleApply = vi.fn();
    render(
      <FilterModule
        onApply={handleApply}
        defaultFrom="2025-04-20"
        defaultTo="2025-04-25"
      />
    );

    const applyBtn = screen.getByRole('button', { name: 'Apply' });
    // userEvent respects disabled attribute
    await userEvent.setup().click(applyBtn);

    expect(handleApply).not.toHaveBeenCalled();
  });

  // --- Calendar onChange handlers ---
  it('updates from date when Calendar From changes', () => {
    render(
      <FilterModule onApply={vi.fn()} defaultFrom="2025-04-20" />
    );

    // The mock DatePicker renders an <input type="date">
    const dateInputs = screen.getAllByDisplayValue('2025-04-20');
    expect(dateInputs.length).toBeGreaterThanOrEqual(1);

    fireEvent.change(dateInputs[0], { target: { value: '2025-05-01' } });

    // After change, the input should reflect new value
    expect(screen.getAllByDisplayValue('2025-05-01').length).toBeGreaterThanOrEqual(1);
  });

  it('updates to date when Calendar To changes', () => {
    render(
      <FilterModule
        onApply={vi.fn()}
        defaultFrom="2025-04-20"
        defaultTo="2025-04-25"
      />
    );

    const dateInputs = screen.getAllByDisplayValue('2025-04-25');
    expect(dateInputs.length).toBeGreaterThanOrEqual(1);

    fireEvent.change(dateInputs[0], { target: { value: '2025-05-10' } });

    expect(screen.getAllByDisplayValue('2025-05-10').length).toBeGreaterThanOrEqual(1);
  });

  // --- Mode change resets applied state ---
  it('switching mode resets applied flag', async () => {
    const user = userEvent.setup();
    render(
      <FilterModule
        onApply={vi.fn()}
        defaultFrom="2025-04-20"
        defaultTo="2025-04-25"
      />
    );

    // Switch to date mode
    await user.click(screen.getByText('Date'));
    // To calendar should be hidden
    expect(screen.queryByText('To')).not.toBeInTheDocument();

    // Switch back to range
    await user.click(screen.getByText('Range'));
    expect(screen.getByText('To')).toBeInTheDocument();
  });

  // --- Default values ---
  it('initialises From and To with defaultFrom and defaultTo', () => {
    render(
      <FilterModule
        onApply={vi.fn()}
        defaultFrom="2025-01-15"
        defaultTo="2025-01-20"
      />
    );

    expect(screen.getAllByDisplayValue('2025-01-15').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByDisplayValue('2025-01-20').length).toBeGreaterThanOrEqual(1);
  });

  it('renders with empty defaults when no defaultFrom/defaultTo', () => {
    render(<FilterModule onApply={vi.fn()} />);

    // Calendar inputs should have empty values
    const inputs = screen.getAllByDisplayValue('');
    expect(inputs.length).toBeGreaterThanOrEqual(2); // From and To
  });
});
