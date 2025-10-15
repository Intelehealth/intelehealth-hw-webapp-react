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

  it('does not handle click events when disabled and clickable', () => {
    const handleClick = vi.fn();
    render(
      <Chip clickable disabled onClick={handleClick}>
        Test Chip
      </Chip>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('cursor-not-allowed');
    
    // Use fireEvent.click to trigger the handleClick function
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('handles click events when clickable and not disabled', () => {
    const handleClick = vi.fn();
    render(
      <Chip clickable onClick={handleClick}>
        Test Chip
      </Chip>
    );

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('handles click events when clickable but no onClick provided', () => {
    render(<Chip clickable>Test Chip</Chip>);

    const button = screen.getByRole('button');
    expect(button).not.toBeDisabled();
    // This should not throw an error even when onClick is undefined
    fireEvent.click(button);
    expect(button).toBeInTheDocument();
  });

  it('handles remove button click when onRemove is not provided', () => {
    render(<Chip removable>Test Chip</Chip>);
    
    const removeButton = screen.getByLabelText('Remove');
    // This should not throw an error even when onRemove is undefined
    fireEvent.click(removeButton);
    expect(removeButton).toBeInTheDocument();
  });

  it('does not handle click events when disabled and removable', () => {
    const handleClick = vi.fn();
    const handleRemove = vi.fn();
    render(
      <Chip removable disabled onClick={handleClick} onRemove={handleRemove}>
        Test Chip
      </Chip>
    );

    // Get all buttons and find the main chip button (the one with aria-pressed)
    const buttons = screen.getAllByRole('button');
    const mainButton = buttons.find(button => button.hasAttribute('aria-pressed'));
    const removeButton = screen.getByLabelText('Remove');
    
    expect(mainButton).toHaveClass('cursor-not-allowed');
    expect(removeButton).toHaveClass('cursor-not-allowed');
    
    // Click the main button
    fireEvent.click(mainButton!);
    expect(handleClick).not.toHaveBeenCalled();
    
    // Click the remove button
    fireEvent.click(removeButton);
    expect(handleRemove).not.toHaveBeenCalled();
  });

  it('prevents default behavior when disabled chip is clicked', () => {
    const handleClick = vi.fn();
    render(
      <Chip clickable disabled onClick={handleClick}>
        Test Chip
      </Chip>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('cursor-not-allowed');
    
    // Simulate the click event
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('prevents default behavior when disabled removable chip remove button is clicked', () => {
    const handleRemove = vi.fn();
    render(
      <Chip removable disabled onRemove={handleRemove}>
        Test Chip
      </Chip>
    );

    const removeButton = screen.getByLabelText('Remove');
    expect(removeButton).toHaveClass('cursor-not-allowed');
    
    // Simulate the click event
    fireEvent.click(removeButton);
    expect(handleRemove).not.toHaveBeenCalled();
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

  // Additional comprehensive test cases for 100% coverage

  it('renders secondary variant', () => {
    render(<Chip variant="secondary">Secondary Chip</Chip>);
    expect(screen.getByText('Secondary Chip')).toBeInTheDocument();
  });

  it('applies correct size classes for small size', () => {
    render(<Chip size="sm">Small Chip</Chip>);
    const chip = screen.getByText('Small Chip').parentElement;
    expect(chip).toHaveClass('px-2', 'py-1', 'text-xs');
  });

  it('applies correct size classes for medium size', () => {
    render(<Chip size="md">Medium Chip</Chip>);
    const chip = screen.getByText('Medium Chip').parentElement;
    expect(chip).toHaveClass('px-3', 'py-1.5', 'text-sm');
  });

  it('applies correct size classes for large size', () => {
    render(<Chip size="lg">Large Chip</Chip>);
    const chip = screen.getByText('Large Chip').parentElement;
    expect(chip).toHaveClass('px-4', 'py-2', 'text-base');
  });

  it('applies correct icon size classes for small size', () => {
    const leftIcon = <span data-testid="left-icon">←</span>;
    render(<Chip size="sm" leftIcon={leftIcon}>Small Chip</Chip>);
    const iconContainer = screen.getByTestId('left-icon').parentElement;
    expect(iconContainer).toHaveClass('w-3', 'h-3');
  });

  it('applies correct icon size classes for medium size', () => {
    const leftIcon = <span data-testid="left-icon">←</span>;
    render(<Chip size="md" leftIcon={leftIcon}>Medium Chip</Chip>);
    const iconContainer = screen.getByTestId('left-icon').parentElement;
    expect(iconContainer).toHaveClass('w-4', 'h-4');
  });

  it('applies correct icon size classes for large size', () => {
    const leftIcon = <span data-testid="left-icon">←</span>;
    render(<Chip size="lg" leftIcon={leftIcon}>Large Chip</Chip>);
    const iconContainer = screen.getByTestId('left-icon').parentElement;
    expect(iconContainer).toHaveClass('w-5', 'h-5');
  });

  it('applies correct remove button size classes for small size', () => {
    const handleRemove = vi.fn();
    render(
      <Chip size="sm" removable onRemove={handleRemove}>
        Small Chip
      </Chip>
    );
    const removeButton = screen.getByLabelText('Remove');
    expect(removeButton).toHaveClass('w-3', 'h-3', 'ml-1');
  });

  it('applies correct remove button size classes for medium size', () => {
    const handleRemove = vi.fn();
    render(
      <Chip size="md" removable onRemove={handleRemove}>
        Medium Chip
      </Chip>
    );
    const removeButton = screen.getByLabelText('Remove');
    expect(removeButton).toHaveClass('w-4', 'h-4', 'ml-1.5');
  });

  it('applies correct remove button size classes for large size', () => {
    const handleRemove = vi.fn();
    render(
      <Chip size="lg" removable onRemove={handleRemove}>
        Large Chip
      </Chip>
    );
    const removeButton = screen.getByLabelText('Remove');
    expect(removeButton).toHaveClass('w-5', 'h-5', 'ml-2');
  });

  it('applies correct spacing classes for small size', () => {
    const leftIcon = <span data-testid="left-icon">←</span>;
    render(<Chip size="sm" leftIcon={leftIcon}>Small Chip</Chip>);
    const chip = screen.getByText('Small Chip').parentElement;
    expect(chip).toHaveClass('gap-1');
  });

  it('applies correct spacing classes for medium size', () => {
    const leftIcon = <span data-testid="left-icon">←</span>;
    render(<Chip size="md" leftIcon={leftIcon}>Medium Chip</Chip>);
    const chip = screen.getByText('Medium Chip').parentElement;
    expect(chip).toHaveClass('gap-1.5');
  });

  it('applies correct spacing classes for large size', () => {
    const leftIcon = <span data-testid="left-icon">←</span>;
    render(<Chip size="lg" leftIcon={leftIcon}>Large Chip</Chip>);
    const chip = screen.getByText('Large Chip').parentElement;
    expect(chip).toHaveClass('gap-2');
  });

  it('applies variant classes correctly for default variant', () => {
    render(<Chip variant="default">Default Chip</Chip>);
    const chip = screen.getByText('Default Chip').parentElement;
    expect(chip).toHaveClass('bg-gray-100', 'text-gray-800', 'border-gray-200');
  });

  it('applies variant classes correctly for primary variant', () => {
    render(<Chip variant="primary">Primary Chip</Chip>);
    const chip = screen.getByText('Primary Chip').parentElement;
    expect(chip).toHaveClass('bg-primary-100', 'text-primary-800', 'border-primary-200');
  });

  it('applies variant classes correctly for secondary variant', () => {
    render(<Chip variant="secondary">Secondary Chip</Chip>);
    const chip = screen.getByText('Secondary Chip').parentElement;
    expect(chip).toHaveClass('bg-secondary-100', 'text-secondary-800', 'border-secondary-200');
  });

  it('applies variant classes correctly for success variant', () => {
    render(<Chip variant="success">Success Chip</Chip>);
    const chip = screen.getByText('Success Chip').parentElement;
    expect(chip).toHaveClass('bg-success-100', 'text-success-800', 'border-success-200');
  });

  it('applies variant classes correctly for warning variant', () => {
    render(<Chip variant="warning">Warning Chip</Chip>);
    const chip = screen.getByText('Warning Chip').parentElement;
    expect(chip).toHaveClass('bg-warning-100', 'text-warning-800', 'border-warning-200');
  });

  it('applies variant classes correctly for error variant', () => {
    render(<Chip variant="error">Error Chip</Chip>);
    const chip = screen.getByText('Error Chip').parentElement;
    expect(chip).toHaveClass('bg-error-100', 'text-error-800', 'border-error-200');
  });

  it('applies variant classes correctly for outline variant', () => {
    render(<Chip variant="outline">Outline Chip</Chip>);
    const chip = screen.getByText('Outline Chip').parentElement;
    expect(chip).toHaveClass('bg-transparent', 'text-gray-700', 'border-gray-300');
  });

  it('applies hover classes when clickable and not disabled', () => {
    render(<Chip clickable variant="primary">Hover Chip</Chip>);
    const chip = screen.getByText('Hover Chip').parentElement;
    expect(chip).toHaveClass('hover:bg-primary-200');
  });

  it('does not apply hover classes when disabled', () => {
    render(<Chip clickable disabled variant="primary">Disabled Chip</Chip>);
    const chip = screen.getByText('Disabled Chip').parentElement;
    expect(chip).not.toHaveClass('hover:bg-primary-200');
  });

  it('applies selected classes when selected', () => {
    render(<Chip selected variant="primary">Selected Chip</Chip>);
    const chip = screen.getByText('Selected Chip').parentElement;
    expect(chip).toHaveClass('bg-primary-200', 'ring-2', 'ring-primary-300');
  });

  it('applies disabled classes when disabled', () => {
    render(<Chip disabled variant="primary">Disabled Chip</Chip>);
    const chip = screen.getByText('Disabled Chip').parentElement;
    expect(chip).toHaveClass('bg-primary-50', 'text-primary-400', 'border-primary-100');
  });

  it('applies cursor pointer when clickable and not disabled', () => {
    render(<Chip clickable>Clickable Chip</Chip>);
    const chip = screen.getByText('Clickable Chip').parentElement;
    expect(chip).toHaveClass('cursor-pointer');
  });

  it('applies cursor default when not clickable', () => {
    render(<Chip>Non-clickable Chip</Chip>);
    const chip = screen.getByText('Non-clickable Chip').parentElement;
    expect(chip).toHaveClass('cursor-default');
  });

  it('applies cursor not-allowed when disabled', () => {
    render(<Chip disabled>Disabled Chip</Chip>);
    const chip = screen.getByText('Disabled Chip').parentElement;
    expect(chip).toHaveClass('cursor-not-allowed');
  });

  it('renders with both left and right icons when not removable', () => {
    const leftIcon = <span data-testid="left-icon">←</span>;
    const rightIcon = <span data-testid="right-icon">→</span>;
    render(
      <Chip leftIcon={leftIcon} rightIcon={rightIcon}>
        Both Icons
      </Chip>
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('renders with both left and right icons when clickable and not removable', () => {
    const leftIcon = <span data-testid="left-icon">←</span>;
    const rightIcon = <span data-testid="right-icon">→</span>;
    render(
      <Chip clickable leftIcon={leftIcon} rightIcon={rightIcon}>
        Both Icons Clickable
      </Chip>
    );

    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('handles keyboard events', () => {
    const handleKeyDown = vi.fn();
    render(
      <Chip clickable onKeyDown={handleKeyDown}>
        Keyboard Chip
      </Chip>
    );

    const chip = screen.getByRole('button');
    fireEvent.keyDown(chip, { key: 'Enter' });
    expect(handleKeyDown).toHaveBeenCalledTimes(1);
  });

  it('handles focus events', () => {
    const handleFocus = vi.fn();
    render(
      <Chip clickable onFocus={handleFocus}>
        Focus Chip
      </Chip>
    );

    const chip = screen.getByRole('button');
    fireEvent.focus(chip);
    expect(handleFocus).toHaveBeenCalledTimes(1);
  });

  it('handles blur events', () => {
    const handleBlur = vi.fn();
    render(
      <Chip clickable onBlur={handleBlur}>
        Blur Chip
      </Chip>
    );

    const chip = screen.getByRole('button');
    fireEvent.blur(chip);
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('forwards all button props', () => {
    render(
      <Chip
        clickable
        data-testid="custom-chip"
        name="test-chip"
        value="test-value"
        type="button"
      >
        Custom Props Chip
      </Chip>
    );

    const chip = screen.getByRole('button');
    expect(chip).toHaveAttribute('data-testid', 'custom-chip');
    expect(chip).toHaveAttribute('name', 'test-chip');
    expect(chip).toHaveAttribute('value', 'test-value');
    expect(chip).toHaveAttribute('type', 'button');
  });

  it('handles mouse events', () => {
    const handleMouseEnter = vi.fn();
    const handleMouseLeave = vi.fn();
    render(
      <Chip
        clickable
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        Mouse Chip
      </Chip>
    );

    const chip = screen.getByRole('button');
    fireEvent.mouseEnter(chip);
    fireEvent.mouseLeave(chip);

    expect(handleMouseEnter).toHaveBeenCalledTimes(1);
    expect(handleMouseLeave).toHaveBeenCalledTimes(1);
  });

  it('renders with all props combined', () => {
    const leftIcon = <span data-testid="left-icon">←</span>;
    const handleClick = vi.fn();
    const handleRemove = vi.fn();
    
    render(
      <Chip
        variant="primary"
        size="lg"
        clickable
        removable
        selected
        leftIcon={leftIcon}
        onClick={handleClick}
        onRemove={handleRemove}
        className="custom-class"
        data-testid="complete-chip"
      >
        Complete Chip
      </Chip>
    );

    const chip = screen.getByTestId('complete-chip');
    const leftIconElement = screen.getByTestId('left-icon');
    const removeButton = screen.getByLabelText('Remove');

    expect(chip).toBeInTheDocument();
    expect(chip).toHaveClass('custom-class', 'bg-primary-200', 'text-primary-800');
    expect(chip).toHaveAttribute('aria-pressed', 'true');
    expect(chip).toHaveAttribute('data-testid', 'complete-chip');
    
    expect(leftIconElement).toBeInTheDocument();
    expect(removeButton).toBeInTheDocument();
    expect(screen.getByText('Complete Chip')).toBeInTheDocument();
  });

  it('handles remove button with disabled state styling', () => {
    const handleRemove = vi.fn();
    render(
      <Chip removable disabled onRemove={handleRemove}>
        Disabled Removable Chip
      </Chip>
    );

    const removeButton = screen.getByLabelText('Remove');
    expect(removeButton).toHaveClass('opacity-50', 'cursor-not-allowed');
  });

  it('renders as span when not clickable and not removable', () => {
    render(<Chip>Non-interactive Chip</Chip>);
    const chip = screen.getByText('Non-interactive Chip').closest('span');
    expect(chip).toBeInTheDocument();
    expect(chip?.tagName.toLowerCase()).toBe('span');
  });

  it('renders as button when clickable or removable', () => {
    const { rerender } = render(<Chip clickable>Clickable Chip</Chip>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Chip removable onRemove={vi.fn()}>Removable Chip</Chip>);
    // When removable, there are multiple buttons (main chip + remove button)
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent('Removable Chip');
    expect(buttons[1]).toHaveAttribute('aria-label', 'Remove');
  });
});
