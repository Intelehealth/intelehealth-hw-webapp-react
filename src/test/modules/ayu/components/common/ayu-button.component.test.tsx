import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AyuButton from '../../../../../modules/ayu/components/common/ayu-button.component';

describe('AyuButton', () => {
  describe('Rendering', () => {
    it('should render button with children', () => {
      render(<AyuButton>Click me</AyuButton>);
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('should render with default variant (primary)', () => {
      render(<AyuButton>Primary Button</AyuButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-primary-variant');
    });

    it('should render with secondary variant', () => {
      render(<AyuButton variant="secondary">Secondary</AyuButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-secondary-variant');
    });

    it('should render with primarylight variant', () => {
      render(<AyuButton variant="primarylight">Primary Light</AyuButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-primary-light-variant');
    });

    it('should render with default size (md)', () => {
      render(<AyuButton>Medium Button</AyuButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-3', 'gap-2');
    });

    it('should render with small size', () => {
      render(<AyuButton size="sm">Small</AyuButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-2', 'gap-2');
    });

    it('should render with large size', () => {
      render(<AyuButton size="lg">Large</AyuButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-4', 'gap-3');
    });

    it('should render full width button', () => {
      render(<AyuButton fullWidth>Full Width</AyuButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });

    it('should apply custom className', () => {
      render(<AyuButton className="custom-class">Custom</AyuButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<AyuButton isLoading>Submit</AyuButton>);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });

    it('should show custom loading text', () => {
      render(
        <AyuButton isLoading loadingText="Submitting...">
          Submit
        </AyuButton>
      );
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
    });

    it('should disable button when loading', () => {
      render(<AyuButton isLoading>Submit</AyuButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should show loading spinner with correct size for small button', () => {
      render(
        <AyuButton isLoading size="sm">
          Submit
        </AyuButton>
      );
      const spinner = screen.getByRole('button').querySelector('svg');
      expect(spinner).toHaveClass('w-4', 'h-4', 'animate-spin');
    });

    it('should show loading spinner with correct size for large button', () => {
      render(
        <AyuButton isLoading size="lg">
          Submit
        </AyuButton>
      );
      const spinner = screen.getByRole('button').querySelector('svg');
      expect(spinner).toHaveClass('w-6', 'h-6', 'animate-spin');
    });
  });

  describe('Icons', () => {
    it('should render left icon', () => {
      const LeftIcon = <span data-testid="left-icon">L</span>;
      render(<AyuButton leftIcon={LeftIcon}>Button</AyuButton>);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('should render right icon', () => {
      const RightIcon = <span data-testid="right-icon">R</span>;
      render(<AyuButton rightIcon={RightIcon}>Button</AyuButton>);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should render both left and right icons', () => {
      const LeftIcon = <span data-testid="left-icon">L</span>;
      const RightIcon = <span data-testid="right-icon">R</span>;
      render(
        <AyuButton leftIcon={LeftIcon} rightIcon={RightIcon}>
          Button
        </AyuButton>
      );
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should not render icons when loading', () => {
      const LeftIcon = <span data-testid="left-icon">L</span>;
      const RightIcon = <span data-testid="right-icon">R</span>;
      render(
        <AyuButton isLoading leftIcon={LeftIcon} rightIcon={RightIcon}>
          Button
        </AyuButton>
      );
      expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument();
      expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should disable button when disabled prop is true', () => {
      render(<AyuButton disabled>Disabled</AyuButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should disable button when loading', () => {
      render(<AyuButton isLoading>Loading</AyuButton>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not call onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(
        <AyuButton disabled onClick={handleClick}>
          Disabled
        </AyuButton>
      );
      const button = screen.getByRole('button');
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Click Handlers', () => {
    it('should call onClick handler when clicked', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(<AyuButton onClick={handleClick}>Click me</AyuButton>);
      const button = screen.getByRole('button');
      await user.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      render(
        <AyuButton isLoading onClick={handleClick}>
          Click me
        </AyuButton>
      );
      const button = screen.getByRole('button');
      await user.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('HTML Attributes', () => {
    it('should support button type attribute', () => {
      render(<AyuButton type="submit">Submit</AyuButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should support aria attributes', () => {
      render(<AyuButton aria-label="Custom Label">Button</AyuButton>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom Label');
    });

    it('should support data attributes', () => {
      render(<AyuButton data-testid="custom-button">Button</AyuButton>);
      expect(screen.getByTestId('custom-button')).toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to button element', () => {
      const ref = { current: null };
      render(<AyuButton ref={ref as any}>Button</AyuButton>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  describe('Display Name', () => {
    it('should have correct display name', () => {
      expect(AyuButton.displayName).toBe('Button');
    });
  });

  describe('Variant and Size Combinations', () => {
    it('should render primary small button correctly', () => {
      render(
        <AyuButton variant="primary" size="sm">
          Primary Small
        </AyuButton>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-primary-variant', 'px-3', 'py-2');
    });

    it('should render secondary large button correctly', () => {
      render(
        <AyuButton variant="secondary" size="lg">
          Secondary Large
        </AyuButton>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-secondary-variant', 'px-6', 'py-4');
    });

    it('should render primarylight medium button correctly', () => {
      render(
        <AyuButton variant="primarylight" size="md">
          Primary Light Medium
        </AyuButton>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-primary-light-variant', 'px-4', 'py-3');
    });
  });

  describe('Edge Cases', () => {
    it('should render with empty children', () => {
      render(<AyuButton></AyuButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render with null children', () => {
      render(<AyuButton>{null}</AyuButton>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle multiple class combinations', () => {
      render(
        <AyuButton
          variant="primary"
          size="lg"
          fullWidth
          className="custom-class"
        >
          Complex Button
        </AyuButton>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass(
        'btn-primary-variant',
        'px-6',
        'py-4',
        'w-full',
        'custom-class'
      );
    });
  });
});
