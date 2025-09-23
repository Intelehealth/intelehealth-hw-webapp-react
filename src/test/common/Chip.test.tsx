import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Chip } from '../../components/common';

describe('Chip', () => {
  it('renders with basic props', () => {
    render(<Chip>Test Chip</Chip>);
    expect(screen.getByText('Test Chip')).toBeInTheDocument();
  });

  it('renders as non-interactive by default', () => {
    render(<Chip>Test Chip</Chip>);
    const chip = screen.getByText('Test Chip').closest('span');
    expect(chip).toBeInTheDocument();
    expect(chip).not.toHaveAttribute('type', 'button');
  });

  it('renders as button when clickable', () => {
    render(<Chip clickable>Test Chip</Chip>);
    const chip = screen.getByRole('button');
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveTextContent('Test Chip');
  });

  it('handles click events when clickable', () => {
    const handleClick = vi.fn();
    render(
      <Chip clickable onClick={handleClick}>
        Test Chip
      </Chip>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not handle click events when not clickable', () => {
    const handleClick = vi.fn();
    render(<Chip onClick={handleClick}>Test Chip</Chip>);

    fireEvent.click(screen.getByText('Test Chip'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders different variants', () => {
    const { rerender } = render(<Chip variant="default">Default</Chip>);
    expect(screen.getByText('Default')).toBeInTheDocument();

    rerender(<Chip variant="primary">Primary</Chip>);
    expect(screen.getByText('Primary')).toBeInTheDocument();

    rerender(<Chip variant="success">Success</Chip>);
    expect(screen.getByText('Success')).toBeInTheDocument();

    rerender(<Chip variant="warning">Warning</Chip>);
    expect(screen.getByText('Warning')).toBeInTheDocument();

    rerender(<Chip variant="error">Error</Chip>);
    expect(screen.getByText('Error')).toBeInTheDocument();

    rerender(<Chip variant="outline">Outline</Chip>);
    expect(screen.getByText('Outline')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Chip size="sm">Small</Chip>);
    expect(screen.getByText('Small')).toBeInTheDocument();

    rerender(<Chip size="md">Medium</Chip>);
    expect(screen.getByText('Medium')).toBeInTheDocument();

    rerender(<Chip size="lg">Large</Chip>);
    expect(screen.getByText('Large')).toBeInTheDocument();
  });

  it('shows selected state', () => {
    render(<Chip selected>Selected Chip</Chip>);
    const chip = screen.getByText('Selected Chip');
    expect(chip).toBeInTheDocument();
  });

  it('shows disabled state', () => {
    render(<Chip disabled>Disabled Chip</Chip>);
    const chip = screen.getByText('Disabled Chip');
    expect(chip).toBeInTheDocument();
  });

  it('renders with left icon', () => {
    const leftIcon = <span data-testid="left-icon">←</span>;
    render(<Chip leftIcon={leftIcon}>With Left Icon</Chip>);

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByText('With Left Icon')).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    const rightIcon = <span data-testid="right-icon">→</span>;
    render(<Chip rightIcon={rightIcon}>With Right Icon</Chip>);

    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    expect(screen.getByText('With Right Icon')).toBeInTheDocument();
  });

  it('renders with remove button when removable', () => {
    const handleRemove = vi.fn();
    render(
      <Chip removable onRemove={handleRemove}>
        Removable Chip
      </Chip>
    );

    const removeButton = screen.getByLabelText('Remove');
    expect(removeButton).toBeInTheDocument();
    expect(screen.getByText('Removable Chip')).toBeInTheDocument();
  });

  it('handles remove button click', () => {
    const handleRemove = vi.fn();
    render(
      <Chip removable onRemove={handleRemove}>
        Removable Chip
      </Chip>
    );

    const removeButton = screen.getByLabelText('Remove');
    fireEvent.click(removeButton);
    expect(handleRemove).toHaveBeenCalledTimes(1);
  });

  it('does not show right icon when removable', () => {
    const rightIcon = <span data-testid="right-icon">→</span>;
    render(
      <Chip removable rightIcon={rightIcon}>
        Chip
      </Chip>
    );

    expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Remove')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Chip className="custom-class">Test Chip</Chip>);
    const chip = screen.getByText('Test Chip').parentElement;
    expect(chip).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(
      <Chip ref={ref} clickable>
        Test Chip
      </Chip>
    );
    expect(ref).toHaveBeenCalled();
  });

  it('has proper accessibility attributes when clickable', () => {
    render(
      <Chip clickable selected>
        Test Chip
      </Chip>
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('prevents click when disabled', () => {
    const handleClick = vi.fn();
    render(
      <Chip clickable disabled onClick={handleClick}>
        Disabled Chip
      </Chip>
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('prevents remove when disabled', () => {
    const handleRemove = vi.fn();
    render(
      <Chip removable disabled onRemove={handleRemove}>
        Disabled Chip
      </Chip>
    );

    const removeButton = screen.getByLabelText('Remove');
    fireEvent.click(removeButton);
    expect(handleRemove).not.toHaveBeenCalled();
  });

  it('stops propagation on remove button click', () => {
    const handleClick = vi.fn();
    const handleRemove = vi.fn();
    render(
      <Chip clickable removable onClick={handleClick} onRemove={handleRemove}>
        Test Chip
      </Chip>
    );

    const removeButton = screen.getByLabelText('Remove');
    fireEvent.click(removeButton);

    expect(handleRemove).toHaveBeenCalledTimes(1);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
