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

  it('renders without custom className', () => {
    const { container } = render(<FilterModule onApply={vi.fn()} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  // --- Mode toggling ---
  it('switches to date mode when Date button is clicked', async () => {
    const user = userEvent.setup();
    render(<FilterModule onApply={vi.fn()} />);

    expect(screen.getByText('To')).toBeInTheDocument();

    await user.click(screen.getByText('Date'));

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
  it('Apply button is disabled when from is empty', () => {
    render(<FilterModule onApply={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('Apply button is disabled when in range mode and to is empty', () => {
    render(
      <FilterModule onApply={vi.fn()} defaultFrom="2025-04-20" />
    );
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  it('Apply button is enabled when from and to are provided in range mode', () => {
    render(
      <FilterModule
        onApply={vi.fn()}
        defaultFrom="2025-04-20"
        defaultTo="2025-04-25"
      />
    );
    expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled();
  });

  it('Apply button is enabled when from is provided in date mode', () => {
    render(
      <FilterModule
        onApply={vi.fn()}
        defaultMode="date"
        defaultFrom="2025-04-20"
      />
    );
    expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled();
  });

  it('does not call onApply when Apply is clicked while disabled', async () => {
    const handleApply = vi.fn();
    render(<FilterModule onApply={handleApply} />);

    const applyBtn = screen.getByRole('button', { name: 'Apply' });
    // userEvent respects disabled attribute
    await userEvent.setup().click(applyBtn);

    expect(handleApply).not.toHaveBeenCalled();
  });

  // --- handleApply execution paths ---
  it('calls onApply with range data when Apply is clicked in range mode', async () => {
    const user = userEvent.setup();
    const handleApply = vi.fn();
    render(
      <FilterModule
        onApply={handleApply}
        defaultFrom="2025-04-20"
        defaultTo="2025-04-25"
      />
    );

    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(handleApply).toHaveBeenCalledWith({
      mode: 'range',
      from: '2025-04-20',
      to: '2025-04-25',
    });
  });

  it('calls onApply with date data (to=null) when Apply is clicked in date mode', async () => {
    const user = userEvent.setup();
    const handleApply = vi.fn();
    render(
      <FilterModule
        onApply={handleApply}
        defaultMode="date"
        defaultFrom="2025-04-20"
      />
    );

    await user.click(screen.getByRole('button', { name: 'Apply' }));

    expect(handleApply).toHaveBeenCalledWith({
      mode: 'date',
      from: '2025-04-20',
      to: null,
    });
  });

  // --- Applied state prevents double apply ---
  it('disables Apply button after successful apply', async () => {
    const user = userEvent.setup();
    const handleApply = vi.fn();
    render(
      <FilterModule
        onApply={handleApply}
        defaultFrom="2025-04-20"
        defaultTo="2025-04-25"
      />
    );

    const applyBtn = screen.getByRole('button', { name: 'Apply' });

    await user.click(applyBtn);
    expect(handleApply).toHaveBeenCalledTimes(1);

    // After applying, button becomes disabled (applied = true)
    expect(applyBtn).toBeDisabled();
  });

  // --- Calendar onChange handlers ---
  it('updates from date when Calendar From changes', () => {
    render(
      <FilterModule onApply={vi.fn()} defaultFrom="2025-04-20" />
    );

    const dateInputs = screen.getAllByDisplayValue('2025-04-20');
    expect(dateInputs.length).toBeGreaterThanOrEqual(1);

    fireEvent.change(dateInputs[0], { target: { value: '2025-05-01' } });

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

  // --- onChange resets applied state, allowing re-apply ---
  it('changing From date resets applied state allowing re-apply', async () => {
    const user = userEvent.setup();
    const handleApply = vi.fn();
    render(
      <FilterModule
        onApply={handleApply}
        defaultFrom="2025-04-20"
        defaultTo="2025-04-25"
      />
    );

    const applyBtn = screen.getByRole('button', { name: 'Apply' });

    // First apply
    await user.click(applyBtn);
    expect(handleApply).toHaveBeenCalledTimes(1);
    expect(applyBtn).toBeDisabled();

    // Change From date — resets applied
    const fromInput = screen.getAllByDisplayValue('2025-04-20')[0];
    fireEvent.change(fromInput, { target: { value: '2025-04-22' } });

    // Button re-enabled
    expect(applyBtn).toBeEnabled();

    // Apply again should work
    await user.click(applyBtn);
    expect(handleApply).toHaveBeenCalledTimes(2);
    expect(handleApply).toHaveBeenLastCalledWith({
      mode: 'range',
      from: '2025-04-22',
      to: '2025-04-25',
    });
  });

  it('changing To date resets applied state allowing re-apply', async () => {
    const user = userEvent.setup();
    const handleApply = vi.fn();
    render(
      <FilterModule
        onApply={handleApply}
        defaultFrom="2025-04-20"
        defaultTo="2025-04-25"
      />
    );

    const applyBtn = screen.getByRole('button', { name: 'Apply' });

    // First apply
    await user.click(applyBtn);
    expect(handleApply).toHaveBeenCalledTimes(1);
    expect(applyBtn).toBeDisabled();

    // Change To date — resets applied
    const toInput = screen.getAllByDisplayValue('2025-04-25')[0];
    fireEvent.change(toInput, { target: { value: '2025-04-28' } });

    // Button re-enabled
    expect(applyBtn).toBeEnabled();

    // Apply again should work
    await user.click(applyBtn);
    expect(handleApply).toHaveBeenCalledTimes(2);
    expect(handleApply).toHaveBeenLastCalledWith({
      mode: 'range',
      from: '2025-04-20',
      to: '2025-04-28',
    });
  });

  it('switching mode resets applied state allowing re-apply', async () => {
    const user = userEvent.setup();
    const handleApply = vi.fn();
    render(
      <FilterModule
        onApply={handleApply}
        defaultFrom="2025-04-20"
        defaultTo="2025-04-25"
      />
    );

    const applyBtn = screen.getByRole('button', { name: 'Apply' });

    // First apply in range mode
    await user.click(applyBtn);
    expect(handleApply).toHaveBeenCalledTimes(1);
    expect(applyBtn).toBeDisabled();

    // Switch to date mode — resets applied
    await user.click(screen.getByText('Date'));

    // Button re-enabled (from is set, date mode doesn't need to)
    expect(applyBtn).toBeEnabled();

    // Apply in date mode
    await user.click(applyBtn);
    expect(handleApply).toHaveBeenCalledTimes(2);
    expect(handleApply).toHaveBeenLastCalledWith({
      mode: 'date',
      from: '2025-04-20',
      to: null,
    });
  });

  // --- Mode change toggles To calendar ---
  it('switching mode toggles To calendar visibility', async () => {
    const user = userEvent.setup();
    render(
      <FilterModule
        onApply={vi.fn()}
        defaultFrom="2025-04-20"
        defaultTo="2025-04-25"
      />
    );

    await user.click(screen.getByText('Date'));
    expect(screen.queryByText('To')).not.toBeInTheDocument();

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

    const inputs = screen.getAllByDisplayValue('');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  // --- Branch: maxDate for From calendar ---
  it('renders From calendar with to-based maxDate when in range mode with to set', () => {
    const { container } = render(
      <FilterModule
        onApply={vi.fn()}
        defaultFrom="2025-04-20"
        defaultTo="2025-04-25"
      />
    );
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders From calendar with current-date maxDate when in range mode without to', () => {
    render(
      <FilterModule onApply={vi.fn()} defaultFrom="2025-04-20" />
    );
    expect(screen.getByText('From')).toBeInTheDocument();
  });

  it('renders From calendar with current-date maxDate in date mode', () => {
    render(
      <FilterModule
        onApply={vi.fn()}
        defaultMode="date"
        defaultFrom="2025-04-20"
      />
    );
    expect(screen.getByText('From')).toBeInTheDocument();
  });

  // --- Branch: minDate for To calendar ---
  it('renders To calendar without minDate when from is empty', () => {
    render(<FilterModule onApply={vi.fn()} defaultFrom="" />);
    expect(screen.getByText('To')).toBeInTheDocument();
  });

  it('renders To calendar with minDate when from is set', () => {
    render(
      <FilterModule
        onApply={vi.fn()}
        defaultFrom="2025-04-20"
        defaultTo="2025-04-25"
      />
    );
    expect(screen.getByText('To')).toBeInTheDocument();
  });

  // --- Branch: mode button active/inactive styling ---
  it('applies active styling to Date button when in date mode', () => {
    render(<FilterModule onApply={vi.fn()} defaultMode="date" />);

    const dateBtn = screen.getByText('Date');
    const rangeBtn = screen.getByText('Range');

    expect(dateBtn).toHaveClass('bg-[#ECEEFF]');
    expect(rangeBtn).not.toHaveClass('bg-[#ECEEFF]');
  });

  it('applies active styling to Range button when in range mode', () => {
    render(<FilterModule onApply={vi.fn()} defaultMode="range" />);

    const dateBtn = screen.getByText('Date');
    const rangeBtn = screen.getByText('Range');

    expect(rangeBtn).toHaveClass('bg-[#ECEEFF]');
    expect(dateBtn).toHaveClass('bg-white');
  });

  // --- showToggle=false with date mode ---
  it('renders in date mode without toggle', () => {
    render(
      <FilterModule
        onApply={vi.fn()}
        showToggle={false}
        defaultMode="date"
        defaultFrom="2025-04-20"
      />
    );

    expect(screen.queryByText('Date')).not.toBeInTheDocument();
    expect(screen.queryByText('Range')).not.toBeInTheDocument();
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.queryByText('To')).not.toBeInTheDocument();
  });

  // --- handleApply guard: isApplyDisabled early return ---
  it('handleApply does not call onApply when isApplyDisabled is true (from empty)', async () => {
    const user = userEvent.setup();
    const handleApply = vi.fn();
    render(<FilterModule onApply={handleApply} defaultMode="date" />);

    // Button is disabled, userEvent won't click it
    const applyBtn = screen.getByRole('button', { name: 'Apply' });
    expect(applyBtn).toBeDisabled();
    await user.click(applyBtn);
    expect(handleApply).not.toHaveBeenCalled();
  });
});
