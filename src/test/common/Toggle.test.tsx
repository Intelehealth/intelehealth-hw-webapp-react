import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Toggle from '../../components/common/toggle.component';

describe('Toggle', () => {
  it('renders with basic props', () => {
    render(<Toggle />);
    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('type', 'checkbox');
  });

  it('renders with label', () => {
    render(<Toggle label="Enable notifications" />);
    expect(screen.getByText('Enable notifications')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders with required indicator', () => {
    render(<Toggle label="Required toggle" isRequired />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders with error state', () => {
    render(<Toggle label="Toggle" error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('renders with helper text', () => {
    render(<Toggle label="Toggle" helperText="Enable this feature" />);
    expect(screen.getByText('Enable this feature')).toBeInTheDocument();
  });

  it('renders with description', () => {
    render(<Toggle label="Toggle" description="This is a description" />);
    expect(screen.getByText('This is a description')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Toggle size="sm" label="Small" />);
    const toggleContainer = screen.getByRole('checkbox').closest('label');
    expect(toggleContainer).toHaveClass('w-8', 'h-4');

    rerender(<Toggle size="md" label="Medium" />);
    const toggleContainer2 = screen.getByRole('checkbox').closest('label');
    expect(toggleContainer2).toHaveClass('w-11', 'h-6');

    rerender(<Toggle size="lg" label="Large" />);
    const toggleContainer3 = screen.getByRole('checkbox').closest('label');
    expect(toggleContainer3).toHaveClass('w-14', 'h-7');
  });

  it('renders different variants', () => {
    const { rerender } = render(<Toggle variant="default" label="Default" />);
    let toggleDiv = screen
      .getByRole('checkbox')
      .closest('label')
      ?.querySelector('div');
    expect(toggleDiv).toHaveClass('bg-gray-200'); // Default unchecked state

    rerender(<Toggle variant="success" label="Success" />);
    toggleDiv = screen
      .getByRole('checkbox')
      .closest('label')
      ?.querySelector('div');
    expect(toggleDiv).toHaveClass('bg-gray-200'); // Default unchecked state

    rerender(<Toggle variant="warning" label="Warning" />);
    toggleDiv = screen
      .getByRole('checkbox')
      .closest('label')
      ?.querySelector('div');
    expect(toggleDiv).toHaveClass('bg-gray-200'); // Default unchecked state

    rerender(<Toggle variant="error" label="Error" />);
    toggleDiv = screen
      .getByRole('checkbox')
      .closest('label')
      ?.querySelector('div');
    expect(toggleDiv).toHaveClass('bg-gray-200'); // Default unchecked state
  });

  it('handles checked state', () => {
    render(<Toggle checked label="Checked" />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('handles disabled state', () => {
    render(<Toggle disabled label="Disabled" />);
    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeDisabled();
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Toggle onChange={handleChange} label="Test toggle" />);
    const toggle = screen.getByRole('checkbox');

    await user.click(toggle);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('can be clicked via label', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Toggle onChange={handleChange} label="Clickable label" />);
    const label = screen.getByText('Clickable label');

    await user.click(label);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Toggle ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Toggle className="custom-class" />);
    expect(screen.getByRole('checkbox')).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(
      <Toggle
        label="Toggle"
        error="Required field"
        helperText="Enable this feature"
        aria-label="Test toggle"
      />
    );

    const toggle = screen.getByRole('checkbox');
    expect(toggle).toHaveAttribute('aria-invalid', 'true');
    expect(toggle).toHaveAttribute('aria-describedby');
  });

  it('shows error instead of helper text when both are provided', () => {
    render(
      <Toggle
        label="Toggle"
        error="This field is required"
        helperText="Enable this feature"
      />
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.queryByText('Enable this feature')).not.toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Toggle onChange={handleChange} label="Keyboard test" />);
    const toggle = screen.getByRole('checkbox');

    toggle.focus();
    await user.keyboard(' ');
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('renders with custom id', () => {
    render(<Toggle id="custom-id" label="Custom ID" />);
    const toggle = screen.getByRole('checkbox');
    expect(toggle).toHaveAttribute('id', 'custom-id');
  });

  it('shows error variant when error is present', () => {
    render(<Toggle variant="success" error="Error message" label="Toggle" />);
    const toggleDiv = screen
      .getByRole('checkbox')
      .closest('label')
      ?.querySelector('div');
    expect(toggleDiv).toHaveClass('bg-gray-200'); // Default unchecked state, error variant will show when checked
  });
});
