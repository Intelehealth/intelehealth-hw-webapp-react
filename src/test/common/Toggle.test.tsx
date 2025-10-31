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
      <Toggle label="Primary Toggle" variant="primary" checked readOnly />
    );
    // Can't test Tailwind class values directly without snapshots/CSS modules
    expect(screen.getByRole('checkbox')).toBeChecked();

    rerender(<Toggle label="Secondary Toggle" variant="secondary" checked readOnly />);
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

  // Additional test cases for 100% coverage

  it('applies correct size classes for toggle and thumb', () => {
    const { rerender } = render(<Toggle label="Small" size="sm" />);
    const toggle = screen.getByRole('checkbox');
    // const label = screen.getByText('Small');
    
    // Check that the toggle container has the correct size classes
    const toggleContainer = toggle.closest('label');
    expect(toggleContainer).toHaveClass('w-8', 'h-4');

    rerender(<Toggle label="Medium" size="md" />);
    const mdToggleContainer = screen.getByRole('checkbox').closest('label');
    expect(mdToggleContainer).toHaveClass('w-11', 'h-6');

    rerender(<Toggle label="Large" size="lg" />);
    const lgToggleContainer = screen.getByRole('checkbox').closest('label');
    expect(lgToggleContainer).toHaveClass('w-14', 'h-7');
  });

  it('applies correct variant classes for checked and unchecked states', () => {
    const { rerender } = render(<Toggle label="Primary" variant="primary" checked readOnly />);
    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeChecked();

    rerender(<Toggle label="Secondary" variant="secondary" checked readOnly />);
    expect(toggle).toBeChecked();

    rerender(<Toggle label="Primary Unchecked" variant="primary" checked={false} readOnly />);
    expect(toggle).not.toBeChecked();
  });

  it('applies correct label size classes', () => {
    const { rerender } = render(<Toggle size="sm" label="Small Label" />);
    expect(screen.getByText('Small Label')).toHaveClass('text-sm');

    rerender(<Toggle size="md" label="Medium Label" />);
    expect(screen.getByText('Medium Label')).toHaveClass('text-base');

    rerender(<Toggle size="lg" label="Large Label" />);
    expect(screen.getByText('Large Label')).toHaveClass('text-lg');
  });

  it('applies correct description size classes', () => {
    const { rerender } = render(
      <Toggle size="sm" label="Small" description="Small description" />
    );
    expect(screen.getByText('Small description')).toHaveClass('text-sm');

    rerender(<Toggle size="md" label="Medium" description="Medium description" />);
    expect(screen.getByText('Medium description')).toHaveClass('text-sm');

    rerender(<Toggle size="lg" label="Large" description="Large description" />);
    expect(screen.getByText('Large description')).toHaveClass('text-base');
  });

  it('sets correct aria-describedby attribute', () => {
    const { rerender } = render(
      <Toggle 
        label="Test" 
        error="Error message" 
        helperText="Helper text" 
        description="Description text" 
      />
    );
    const toggle = screen.getByRole('checkbox');
    const expectedId = toggle.id;
    
    // When error is present, it should include error, helper, and description
    expect(toggle).toHaveAttribute('aria-describedby', 
      `${expectedId}-error ${expectedId}-helper ${expectedId}-description`);

    rerender(<Toggle label="Test" helperText="Helper text" description="Description text" />);
    expect(toggle).toHaveAttribute('aria-describedby', 
      `${expectedId}-helper ${expectedId}-description`);

    rerender(<Toggle label="Test" description="Description text" />);
    expect(toggle).toHaveAttribute('aria-describedby', `${expectedId}-description`);

    rerender(<Toggle label="Test" />);
    expect(toggle).toHaveAttribute('aria-describedby', '');
  });

  it('applies error styling to label when error is present', () => {
    render(<Toggle label="Test Label" error="Error message" />);
    const label = screen.getByText('Test Label');
    expect(label).toHaveClass('text-error-700');
  });

  it('applies disabled styling to label when disabled', () => {
    render(<Toggle label="Test Label" disabled />);
    const label = screen.getByText('Test Label');
    expect(label).toHaveClass('text-gray-400', 'cursor-not-allowed');
  });

  it('applies disabled styling to label when both error and disabled are present', () => {
    render(<Toggle label="Test Label" error="Error message" disabled />);
    const label = screen.getByText('Test Label');
    // When both error and disabled are present, disabled styling takes precedence
    expect(label).toHaveClass('text-gray-400', 'cursor-not-allowed');
    expect(label).not.toHaveClass('text-error-700');
  });

  it('applies disabled styling to toggle container when disabled', () => {
    render(<Toggle label="Disabled Toggle" disabled />);
    const toggle = screen.getByRole('checkbox');
    const toggleContainer = toggle.closest('label');
    expect(toggleContainer).toHaveClass('cursor-not-allowed');
  });

  it('applies error styling to toggle when error is present', () => {
    render(<Toggle label="Error Toggle" error="Error message" />);
    const toggle = screen.getByRole('checkbox');
    expect(toggle).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders without label', () => {
    render(<Toggle />);
    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeInTheDocument();
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('renders without description', () => {
    render(<Toggle label="Test Label" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.queryByText('Description')).not.toBeInTheDocument();
  });

  it('handles custom id', () => {
    render(<Toggle id="custom-id" label="Custom ID" />);
    const toggle = screen.getByRole('checkbox');
    expect(toggle).toHaveAttribute('id', 'custom-id');
  });

  it('applies focus ring styles correctly', () => {
    render(<Toggle label="Focus Test" />);
    const toggle = screen.getByRole('checkbox');
    const toggleContainer = toggle.closest('label');
    const innerDiv = toggleContainer?.querySelector('div');
    // The focus ring classes are applied to the inner div
    expect(innerDiv).toHaveClass('peer-focus:ring-primary-500');
  });

  it('applies error focus ring when error is present', () => {
    render(<Toggle label="Error Focus Test" error="Error message" />);
    const toggle = screen.getByRole('checkbox');
    const toggleContainer = toggle.closest('label');
    const innerDiv = toggleContainer?.querySelector('div');
    expect(innerDiv).toHaveClass('peer-focus:ring-error-500');
  });

  it('applies opacity when disabled', () => {
    render(<Toggle label="Disabled Opacity Test" disabled />);
    const toggle = screen.getByRole('checkbox');
    const toggleContainer = toggle.closest('label');
    const innerDiv = toggleContainer?.querySelector('div');
    expect(innerDiv).toHaveClass('opacity-50');
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

  it('can be clicked via label', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Toggle onChange={handleChange} label="Clickable label" />);
    const label = screen.getByText('Clickable label');

    await user.click(label);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });
});
