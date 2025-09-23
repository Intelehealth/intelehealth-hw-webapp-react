import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Checkbox from '../../components/common/checkbox.component';

describe('Checkbox', () => {
  it('renders with basic props', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('type', 'checkbox');
  });

  it('renders with label', () => {
    render(<Checkbox label="Accept terms" />);
    expect(screen.getByText('Accept terms')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('renders with required indicator', () => {
    render(<Checkbox label="Required field" isRequired />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders with error state', () => {
    render(<Checkbox label="Checkbox" error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('renders with helper text', () => {
    render(<Checkbox label="Checkbox" helperText="Check this box" />);
    expect(screen.getByText('Check this box')).toBeInTheDocument();
  });

  it('renders with description', () => {
    render(<Checkbox label="Checkbox" description="This is a description" />);
    expect(screen.getByText('This is a description')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Checkbox size="sm" label="Small" />);
    expect(screen.getByRole('checkbox')).toHaveClass('w-4', 'h-4');

    rerender(<Checkbox size="md" label="Medium" />);
    expect(screen.getByRole('checkbox')).toHaveClass('w-5', 'h-5');

    rerender(<Checkbox size="lg" label="Large" />);
    expect(screen.getByRole('checkbox')).toHaveClass('w-6', 'h-6');
  });

  it('handles checked state', () => {
    render(<Checkbox checked label="Checked" />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('handles disabled state', () => {
    render(<Checkbox disabled label="Disabled" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Checkbox onChange={handleChange} label="Test checkbox" />);
    const checkbox = screen.getByRole('checkbox');

    await user.click(checkbox);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('can be clicked via label', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Checkbox onChange={handleChange} label="Clickable label" />);
    const label = screen.getByText('Clickable label');

    await user.click(label);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Checkbox ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Checkbox className="custom-class" />);
    expect(screen.getByRole('checkbox')).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(
      <Checkbox
        label="Checkbox"
        error="Required field"
        helperText="Check this box"
        aria-label="Test checkbox"
      />
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('aria-invalid', 'true');
    expect(checkbox).toHaveAttribute('aria-describedby');
  });

  it('shows error instead of helper text when both are provided', () => {
    render(
      <Checkbox
        label="Checkbox"
        error="This field is required"
        helperText="Check this box"
      />
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.queryByText('Check this box')).not.toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Checkbox onChange={handleChange} label="Keyboard test" />);
    const checkbox = screen.getByRole('checkbox');

    checkbox.focus();
    await user.keyboard(' ');
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('renders with custom id', () => {
    render(<Checkbox id="custom-id" label="Custom ID" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('id', 'custom-id');
  });
});
