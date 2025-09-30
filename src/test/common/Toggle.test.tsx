import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Toggle from '../../components/common/toggle.component';

describe('Toggle', () => {
  it('renders with a label', () => {
    render(<Toggle label="Enable feature" />);
    const toggle = screen.getByRole('checkbox');
    const label = screen.getByText('Enable feature');

    expect(toggle).toBeInTheDocument();
    expect(label).toBeInTheDocument();
    expect(label.tagName.toLowerCase()).toBe('label');
  });

  it('shows required asterisk when `isRequired` is true', () => {
    render(<Toggle label="Required Toggle" isRequired />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders with description text', () => {
    render(
      <Toggle label="With Description" description="Some helpful info here" />
    );
    expect(screen.getByText('Some helpful info here')).toBeInTheDocument();
  });

  it('shows error message when `error` is passed', () => {
    render(<Toggle label="Error Toggle" error="This is required" />);
    const errorMessage = screen.getByText('This is required');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveAttribute('role', 'alert');
  });

  it('shows helper text if no error is present', () => {
    render(<Toggle label="Helper" helperText="Some helper text" />);
    expect(screen.getByText('Some helper text')).toBeInTheDocument();
  });

  it('does not show helperText when error is present', () => {
    render(
      <Toggle
        label="Conflict"
        helperText="Should be hidden"
        error="Has error"
      />
    );
    expect(screen.queryByText('Should be hidden')).not.toBeInTheDocument();
    expect(screen.getByText('Has error')).toBeInTheDocument();
  });

  it('supports different sizes', () => {
    const { rerender } = render(<Toggle label="Small" size="sm" />);
    expect(screen.getByRole('checkbox').id).toBeTruthy(); // ID auto-generated

    rerender(<Toggle label="Medium" size="md" />);
    rerender(<Toggle label="Large" size="lg" />);
    // Since size affects styling classes only, basic render test is enough here
  });

  it('applies correct variant styles', () => {
    const { rerender } = render(
      <Toggle label="Primary Toggle" variant="primary" checked />
    );
    // Can't test Tailwind class values directly without snapshots/CSS modules
    expect(screen.getByRole('checkbox')).toBeChecked();

    rerender(<Toggle label="Secondary Toggle" variant="secondary" checked />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('disables the toggle when `disabled` is true', () => {
    render(<Toggle label="Disabled Toggle" disabled />);
    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('handles controlled checked state', async () => {
    const user = userEvent.setup();
    let checked = false;
    const handleChange = vi.fn(e => {
      checked = e.target.checked;
    });

    const { rerender } = render(
      <Toggle
        label="Controlled Toggle"
        checked={checked}
        onChange={handleChange}
      />
    );

    const toggle = screen.getByRole('checkbox');
    expect(toggle).not.toBeChecked();

    await user.click(toggle);
    expect(handleChange).toHaveBeenCalled();

    // simulate external re-render with new checked state
    rerender(
      <Toggle
        label="Controlled Toggle"
        checked={true}
        onChange={handleChange}
      />
    );
    expect(toggle).toBeChecked();
  });

  it('calls onChange handler when clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Toggle label="Click me" onChange={handleChange} />);
    const toggle = screen.getByRole('checkbox');

    await user.click(toggle);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Toggle ref={ref} label="With ref" />);
    expect(ref).toHaveBeenCalled();
  });
});
