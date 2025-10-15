import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Input from '../../components/common/input.component';

describe('Input', () => {
  it('renders the input element', () => {
    render(<Input />);
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(<Input label="Username" />);
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
  });

  it('renders required asterisk when isRequired is true', () => {
    render(<Input label="Email" isRequired />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows helper text when provided', () => {
    render(<Input helperText="Enter a valid email" />);
    expect(screen.getByText('Enter a valid email')).toBeInTheDocument();
  });

  it('shows error message and applies aria attributes', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This field is required'
    );
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
  });

  it('does not show helper text when error is present', () => {
    render(<Input helperText="This is helper text" error="This is error" />);
    expect(screen.getByText('This is error')).toBeInTheDocument();
    expect(screen.queryByText('This is helper text')).not.toBeInTheDocument();
  });

  it('renders left and right icons', () => {
    const LeftIcon = <span data-testid="left-icon">L</span>;
    const RightIcon = <span data-testid="right-icon">R</span>;

    render(<Input leftIcon={LeftIcon} rightIcon={RightIcon} />);
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<Input size="sm" />);
    expect(screen.getByRole('textbox')).toHaveClass('text-sm');

    rerender(<Input size="md" />);
    expect(screen.getByRole('textbox')).toHaveClass('text-base');

    rerender(<Input size="lg" />);
    expect(screen.getByRole('textbox')).toHaveClass('text-lg');

    rerender(<Input size="default" />);
    expect(screen.getByRole('textbox')).toHaveClass('text-[13px]');
  });

  it('applies correct variant styles', () => {
    const { rerender } = render(<Input variant="filled" />);
    expect(screen.getByRole('textbox')).toHaveClass('focus:bg-white');

    rerender(<Input variant="outlined" />);
    expect(screen.getByRole('textbox')).toHaveClass('focus:border-primary-500');

    rerender(<Input variant="default" />);
    // No special class expected; just ensure it renders
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<Input label="Disabled" disabled />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(screen.getByText('Disabled')).toHaveClass('text-gray-400');
  });

  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Hello');

    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('Hello');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Input ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('assigns auto-generated ID and connects label to input', () => {
    render(<Input label="Name" />);
    const input = screen.getByLabelText('Name');
    expect(input.id).toBeTruthy();
  });

  // Additional test cases for 100% coverage

  it('handles password type with toggle functionality', async () => {
    const user = userEvent.setup();
    render(<Input type="password" />);
    
    const input = screen.getByDisplayValue('');
    expect(input).toHaveAttribute('type', 'password');
    
    // Click the toggle button to show password
    const toggleButton = screen.getByLabelText('Show password');
    await user.click(toggleButton);
    
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
    
    // Click again to hide password
    await user.click(screen.getByLabelText('Hide password'));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('handles tel input with keydown validation', async () => {
    const user = userEvent.setup();
    render(<Input type="tel" />);
    
    const input = screen.getByRole('textbox');
    
    // Test that numbers are allowed
    await user.type(input, '123');
    expect(input).toHaveValue('123');
    
    // Test that letters are prevented
    await user.type(input, 'abc');
    expect(input).toHaveValue('123'); // Should not change
    
    // Test that special keys are allowed
    await user.keyboard('{Backspace}');
    expect(input).toHaveValue('12');
    
    // Clear the input and test delete key
    await user.clear(input);
    await user.type(input, '123');
    await user.keyboard('{ArrowLeft}'); // Move cursor to before last character
    await user.keyboard('{Delete}');
    expect(input).toHaveValue('12');
    
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowRight}');
    // These should not affect the value
  });

  it('applies correct icon size classes for different sizes', () => {
    const LeftIcon = <span data-testid="left-icon">L</span>;
    const RightIcon = <span data-testid="right-icon">R</span>;

    const { rerender } = render(<Input leftIcon={LeftIcon} rightIcon={RightIcon} size="sm" />);
    expect(screen.getByTestId('left-icon').parentElement).toHaveClass('w-4', 'h-4');
    expect(screen.getByTestId('right-icon').parentElement).toHaveClass('w-4', 'h-4');

    rerender(<Input leftIcon={LeftIcon} rightIcon={RightIcon} size="md" />);
    expect(screen.getByTestId('left-icon').parentElement).toHaveClass('w-5', 'h-5');
    expect(screen.getByTestId('right-icon').parentElement).toHaveClass('w-5', 'h-5');

    rerender(<Input leftIcon={LeftIcon} rightIcon={RightIcon} size="lg" />);
    expect(screen.getByTestId('left-icon').parentElement).toHaveClass('w-6', 'h-6');
    expect(screen.getByTestId('right-icon').parentElement).toHaveClass('w-6', 'h-6');

    rerender(<Input leftIcon={LeftIcon} rightIcon={RightIcon} size="default" />);
    expect(screen.getByTestId('left-icon').parentElement).toHaveClass('w-5', 'h-5');
    expect(screen.getByTestId('right-icon').parentElement).toHaveClass('w-5', 'h-5');
  });

  it('sets correct aria-describedby attribute', () => {
    const { rerender } = render(<Input error="Error message" helperText="Helper text" />);
    const input = screen.getByRole('textbox');
    const expectedId = input.id;
    
    // When both error and helper are present, both should be included
    expect(input).toHaveAttribute('aria-describedby', `${expectedId}-error ${expectedId}-helper`);

    rerender(<Input helperText="Helper text" />);
    expect(input).toHaveAttribute('aria-describedby', `${expectedId}-helper`);

    rerender(<Input error="Error message" />);
    expect(input).toHaveAttribute('aria-describedby', `${expectedId}-error`);

    rerender(<Input />);
    expect(input).toHaveAttribute('aria-describedby', '');
  });

  it('handles password type without toggle when not password', () => {
    render(<Input type="text" />);
    expect(screen.queryByLabelText('Show password')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Hide password')).not.toBeInTheDocument();
  });

  it('handles tel input without keydown validation for other types', async () => {
    const user = userEvent.setup();
    render(<Input type="text" />);
    
    const input = screen.getByRole('textbox');
    
    // Test that letters are allowed for text input
    await user.type(input, 'abc123');
    expect(input).toHaveValue('abc123');
  });

  it('applies correct padding classes for left and right icons', () => {
    const LeftIcon = <span>L</span>;
    const RightIcon = <span>R</span>;

    const { rerender } = render(<Input leftIcon={LeftIcon} />);
    expect(screen.getByRole('textbox')).toHaveClass('pl-10');

    rerender(<Input rightIcon={RightIcon} />);
    expect(screen.getByRole('textbox')).toHaveClass('pr-10');

    rerender(<Input leftIcon={LeftIcon} rightIcon={RightIcon} />);
    expect(screen.getByRole('textbox')).toHaveClass('pl-10', 'pr-10');
  });

  it('handles password toggle state changes', async () => {
    const user = userEvent.setup();
    render(<Input type="password" />);
    
    const input = screen.getByDisplayValue('');
    const toggleButton = screen.getByLabelText('Show password');
    
    // Initial state should be password
    expect(input).toHaveAttribute('type', 'password');
    
    // Click to show password
    await user.click(toggleButton);
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
    
    // Click to hide password again
    await user.click(screen.getByLabelText('Hide password'));
    expect(input).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Show password')).toBeInTheDocument();
  });

  it('handles tel input with various key combinations', async () => {
    const user = userEvent.setup();
    render(<Input type="tel" />);
    
    const input = screen.getByRole('textbox');
    
    // Test multiple number inputs
    await user.type(input, '1234567890');
    expect(input).toHaveValue('1234567890');
    
    // Test that non-numeric characters are blocked
    await user.type(input, '!@#$%^&*()');
    expect(input).toHaveValue('1234567890');
    
    // Test navigation keys
    await user.keyboard('{Home}');
    await user.keyboard('{End}');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowRight}');
    expect(input).toHaveValue('1234567890');
  });

  it('renders password toggle button with correct attributes', () => {
    render(<Input type="password" />);
    
    const toggleButton = screen.getByLabelText('Show password');
    expect(toggleButton).toHaveAttribute('type', 'button');
    expect(toggleButton).toHaveClass('absolute', 'right-3', 'top-1/2', '-translate-y-1/2');
  });

  it('handles helper text without error', () => {
    render(<Input helperText="This is helper text" />);
    expect(screen.getByText('This is helper text')).toBeInTheDocument();
    expect(screen.getByText('This is helper text')).toHaveClass('form-helper-text');
  });

  it('does not render helper text when error is present', () => {
    render(<Input helperText="Helper text" error="Error message" />);
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
  });

  it('applies error styling to label when error is present', () => {
    render(<Input label="Test Label" error="Error message" />);
    const label = screen.getByText('Test Label');
    expect(label).toHaveClass('text-error-700');
  });

  it('applies disabled styling to label when disabled', () => {
    render(<Input label="Test Label" disabled />);
    const label = screen.getByText('Test Label');
    expect(label).toHaveClass('text-gray-400');
  });

  it('applies disabled styling to label when both error and disabled are present', () => {
    render(<Input label="Test Label" error="Error message" disabled />);
    const label = screen.getByText('Test Label');
    // When both error and disabled are present, disabled styling takes precedence
    expect(label).toHaveClass('text-gray-400');
    expect(label).not.toHaveClass('text-error-700');
  });
});
