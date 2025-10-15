import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
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

  it('renders without label', () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Checkbox label="Custom" className="custom-class" />);
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveClass('custom-class');
  });

  it('applies label size classes correctly', () => {
    const { rerender } = render(<Checkbox label="Small Label" size="sm" />);
    expect(screen.getByText('Small Label')).toHaveClass('text-sm');

    rerender(<Checkbox label="Medium Label" size="md" />);
    expect(screen.getByText('Medium Label')).toHaveClass('text-base');

    rerender(<Checkbox label="Large Label" size="lg" />);
    expect(screen.getByText('Large Label')).toHaveClass('text-lg');
  });

  it('applies error styling to label when error is present', () => {
    render(<Checkbox label="Error Label" error="This is an error" />);
    const label = screen.getByText('Error Label');
    expect(label).toHaveClass('text-error-700');
  });

  it('applies disabled styling to label when disabled', () => {
    render(<Checkbox label="Disabled Label" disabled />);
    const label = screen.getByText('Disabled Label');
    expect(label).toHaveClass('text-gray-400', 'cursor-not-allowed');
  });

  it('applies description size classes correctly', () => {
    const { rerender } = render(
      <Checkbox label="Test" description="Small description" size="sm" />
    );
    const description = screen.getByText('Small description');
    expect(description).toHaveClass('text-sm');

    rerender(
      <Checkbox label="Test" description="Medium description" size="md" />
    );
    const mediumDescription = screen.getByText('Medium description');
    expect(mediumDescription).toHaveClass('text-sm');

    rerender(
      <Checkbox label="Test" description="Large description" size="lg" />
    );
    const largeDescription = screen.getByText('Large description');
    expect(largeDescription).toHaveClass('text-base');
  });

  it('sets correct aria-describedby attribute', () => {
    const { rerender } = render(
      <Checkbox label="Test" error="Error message" helperText="Helper text" description="Description" />
    );
    const checkbox = screen.getByRole('checkbox');
    const expectedId = checkbox.id;
    // When error is present, it should only include error (not helper or description)
    expect(checkbox).toHaveAttribute('aria-describedby', `${expectedId}-error`);

    rerender(<Checkbox label="Test" helperText="Helper text" description="Description" />);
    expect(checkbox).toHaveAttribute('aria-describedby', `${expectedId}-helper ${expectedId}-description`);

    rerender(<Checkbox label="Test" description="Description" />);
    expect(checkbox).toHaveAttribute('aria-describedby', `${expectedId}-description`);

    rerender(<Checkbox label="Test" />);
    expect(checkbox).toHaveAttribute('aria-describedby', '');
  });

  it('forwards all HTML input props', () => {
    const handleChange = vi.fn();
    render(
      <Checkbox 
        label="Test" 
        name="test-checkbox"
        value="test-value"
        checked={true}
        onChange={handleChange}
        data-testid="custom-checkbox"
      />
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toHaveAttribute('name', 'test-checkbox');
    expect(checkbox).toHaveAttribute('value', 'test-value');
    expect(checkbox).toBeChecked();
    expect(checkbox).toHaveAttribute('data-testid', 'custom-checkbox');
  });

  it('handles checked state correctly', () => {
    const handleChange = vi.fn();
    const { rerender } = render(<Checkbox label="Unchecked" onChange={handleChange} />);
    expect(screen.getByRole('checkbox')).not.toBeChecked();

    rerender(<Checkbox label="Checked" checked onChange={handleChange} />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('handles defaultChecked state correctly', () => {
    render(<Checkbox label="Default Checked" defaultChecked />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('handles indeterminate state', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Checkbox label="Indeterminate" ref={ref} />);
    
    // Set indeterminate via ref
    if (ref.current) {
      ref.current.indeterminate = true;
    }
    
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.indeterminate).toBe(true);
  });

  it('handles focus and blur events', async () => {
    const user = userEvent.setup();
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();

    render(<Checkbox label="Focus Test" onFocus={handleFocus} onBlur={handleBlur} />);
    const checkbox = screen.getByRole('checkbox');

    await user.click(checkbox);
    expect(handleFocus).toHaveBeenCalledTimes(1);

    await user.tab();
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    const handleKeyDown = vi.fn();

    render(<Checkbox label="Keyboard Test" onKeyDown={handleKeyDown} />);

    await user.tab();
    await user.keyboard('{Space}');
    expect(handleKeyDown).toHaveBeenCalled();
  });

  it('renders with all props combined', () => {
    const handleChange = vi.fn();
    render(
      <Checkbox
        label="Complete Test"
        description="This is a complete test"
        helperText="This is helper text"
        size="lg"
        variant="secondary"
        isRequired
        className="custom-class"
        disabled
        id="complete-test"
        name="complete"
        value="test"
        checked
        onChange={handleChange}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    const label = screen.getByText('Complete Test');
    const description = screen.getByText('This is a complete test');
    const requiredAsterisk = screen.getByText('*');

    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveClass('form-checkbox-secondary', 'w-6', 'h-6', 'custom-class');
    expect(checkbox).toBeDisabled();
    expect(checkbox).toBeChecked();
    expect(checkbox).toHaveAttribute('id', 'complete-test');
    expect(checkbox).toHaveAttribute('name', 'complete');
    expect(checkbox).toHaveAttribute('value', 'test');

    expect(label).toHaveClass('text-lg', 'text-gray-400', 'cursor-not-allowed');
    expect(description).toHaveClass('text-base');
    expect(requiredAsterisk).toBeInTheDocument();
  });
});
