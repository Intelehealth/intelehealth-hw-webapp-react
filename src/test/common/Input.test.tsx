import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Input from '../../components/common/input.component';

describe('Input', () => {
  it('renders with basic props', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Username" placeholder="Enter username" />);
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument();
  });

  it('renders with required indicator', () => {
    render(<Input label="Username" isRequired />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders with error state', () => {
    render(<Input label="Username" error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders with helper text', () => {
    render(<Input label="Username" helperText="Enter your username" />);
    expect(screen.getByText('Enter your username')).toBeInTheDocument();
  });

  it('renders different input types', () => {
    const { rerender } = render(<Input type="password" />);
    const passwordInput = screen.getByDisplayValue('');
    expect(passwordInput).toHaveAttribute('type', 'password');

    rerender(<Input type="email" />);
    const emailInput = screen.getByDisplayValue('');
    expect(emailInput).toHaveAttribute('type', 'email');

    rerender(<Input type="number" />);
    const numberInput = screen.getByDisplayValue('');
    expect(numberInput).toHaveAttribute('type', 'number');
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Input size="sm" placeholder="Small" />);
    expect(screen.getByPlaceholderText('Small')).toHaveClass(
      'px-3',
      'py-2',
      'text-sm'
    );

    rerender(<Input size="md" placeholder="Medium" />);
    expect(screen.getByPlaceholderText('Medium')).toHaveClass(
      'px-4',
      'py-3',
      'text-base'
    );

    rerender(<Input size="lg" placeholder="Large" />);
    expect(screen.getByPlaceholderText('Large')).toHaveClass(
      'px-5',
      'py-4',
      'text-lg'
    );
  });

  it('renders different variants', () => {
    const { rerender } = render(
      <Input variant="outlined" placeholder="Outlined" />
    );
    expect(screen.getByPlaceholderText('Outlined')).toHaveClass(
      'border-gray-300'
    );

    rerender(<Input variant="filled" placeholder="Filled" />);
    expect(screen.getByPlaceholderText('Filled')).toHaveClass(
      'bg-gray-100',
      'border-transparent'
    );

    rerender(<Input variant="default" placeholder="Default" />);
    expect(screen.getByPlaceholderText('Default')).toHaveClass(
      'border-gray-300'
    );
  });

  it('renders with left and right icons', () => {
    const leftIcon = <span data-testid="left-icon">🔍</span>;
    const rightIcon = <span data-testid="right-icon">✓</span>;

    render(
      <Input
        leftIcon={leftIcon}
        rightIcon={rightIcon}
        placeholder="With icons"
      />
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(<Input disabled placeholder="Disabled" />);
    const input = screen.getByPlaceholderText('Disabled');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:bg-gray-50', 'disabled:text-gray-500');
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Input onChange={handleChange} placeholder="Test input" />);
    const input = screen.getByPlaceholderText('Test input');

    await user.type(input, 'Hello World');
    expect(handleChange).toHaveBeenCalledTimes(11); // One for each character
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Input ref={ref} placeholder="Test input" />);
    expect(ref).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Input className="custom-class" placeholder="Test input" />);
    expect(screen.getByPlaceholderText('Test input')).toHaveClass(
      'custom-class'
    );
  });

  it('has proper accessibility attributes', () => {
    render(
      <Input
        label="Username"
        error="Required field"
        helperText="Enter your username"
        aria-label="Username input"
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
  });

  it('shows error instead of helper text when both are provided', () => {
    render(
      <Input
        label="Username"
        error="This field is required"
        helperText="Enter your username"
      />
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.queryByText('Enter your username')).not.toBeInTheDocument();
  });
});
