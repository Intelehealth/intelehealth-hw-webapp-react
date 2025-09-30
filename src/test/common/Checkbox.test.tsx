import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Checkbox from '../../components/common/checkbox.component';

describe('Checkbox', () => {
  it('renders with a string label', () => {
    render(<Checkbox label="Accept Terms" />);
    const checkbox = screen.getByRole('checkbox');
    const label = screen.getByText('Accept Terms');

    expect(checkbox).toBeInTheDocument();
    expect(label).toBeInTheDocument();
    expect(label.tagName.toLowerCase()).toBe('label');
  });

  it('renders with a ReactNode label', () => {
    const label = <span data-testid="custom-label">Custom Label</span>;
    render(<Checkbox label={label} />);
    expect(screen.getByTestId('custom-label')).toBeInTheDocument();
  });

  it('renders required asterisk when isRequired is true', () => {
    render(<Checkbox label="Agree" isRequired />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(<Checkbox label="Option" description="This is extra info" />);
    expect(screen.getByText('This is extra info')).toBeInTheDocument();
  });

  it('renders error message when error prop is passed', () => {
    render(<Checkbox label="Opt in" error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('renders helper text when no error is present', () => {
    render(<Checkbox label="News" helperText="You can unsubscribe later" />);
    expect(screen.getByText('You can unsubscribe later')).toBeInTheDocument();
  });

  it('does not render helper text when error is present', () => {
    render(
      <Checkbox label="Alert" helperText="Help text" error="Error text" />
    );
    expect(screen.queryByText('Help text')).not.toBeInTheDocument();
    expect(screen.getByText('Error text')).toBeInTheDocument();
  });

  it('renders all sizes correctly', () => {
    const { rerender } = render(<Checkbox label="Small" size="sm" />);
    expect(screen.getByRole('checkbox')).toHaveClass('w-4', 'h-4');

    rerender(<Checkbox label="Medium" size="md" />);
    expect(screen.getByRole('checkbox')).toHaveClass('w-5', 'h-5');

    rerender(<Checkbox label="Large" size="lg" />);
    expect(screen.getByRole('checkbox')).toHaveClass('w-6', 'h-6');
  });

  it('applies variant classes', () => {
    const { rerender } = render(<Checkbox label="Primary" variant="primary" />);
    expect(screen.getByRole('checkbox')).toHaveClass('form-checkbox-primary');

    rerender(<Checkbox label="Secondary" variant="secondary" />);
    expect(screen.getByRole('checkbox')).toHaveClass('form-checkbox-secondary');
  });

  it('handles disabled state', () => {
    render(<Checkbox label="Disabled" disabled />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
    expect(screen.getByText('Disabled')).toHaveClass('cursor-not-allowed');
  });

  it('calls onChange handler when clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Checkbox label="Change" onChange={handleChange} />);
    const checkbox = screen.getByRole('checkbox');

    await user.click(checkbox);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('uses provided `id` and links it to the label', () => {
    render(<Checkbox id="custom-id" label="Linked Label" />);
    const checkbox = screen.getByRole('checkbox');
    const label = screen.getByText('Linked Label');

    expect(checkbox).toHaveAttribute('id', 'custom-id');
    expect(label).toHaveAttribute('for', 'custom-id');
  });

  it('auto-generates id if none is provided', () => {
    render(<Checkbox label="Auto ID" />);
    const checkbox = screen.getByRole('checkbox');
    const label = screen.getByText('Auto ID');

    expect(label).toHaveAttribute('for', checkbox.id);
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Checkbox ref={ref} label="Ref Test" />);
    expect(ref).toHaveBeenCalled();
  });
});
