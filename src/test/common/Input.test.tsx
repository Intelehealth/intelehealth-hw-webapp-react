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
});
