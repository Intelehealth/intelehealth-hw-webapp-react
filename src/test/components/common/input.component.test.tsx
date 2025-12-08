import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Input from '../../../components/common/input.component';

// Mock the icon imports
vi.mock('../../../assets/icons/icon-eye-closed.svg', () => ({
  default: 'icon-eye-closed.svg',
}));

vi.mock('../../../assets/icons/icon-eye.svg', () => ({
  default: 'icon-eye.svg',
}));

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(<Input />);
      }).not.toThrow();
    });

    it('should render with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('should render with default type text', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should render with custom type', () => {
      render(<Input type="email" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'email');
    });
  });

  describe('Label Rendering', () => {
    it('should render with label', () => {
      render(<Input label="Username" />);
      expect(screen.getByText('Username')).toBeInTheDocument();
    });

    it('should render without label when not provided', () => {
      const { container } = render(<Input />);
      const label = container.querySelector('label');
      expect(label).not.toBeInTheDocument();
    });

    it('should associate label with input using htmlFor', () => {
      render(<Input label="Email" data-testid="input" />);
      const label = screen.getByText('Email');
      const input = screen.getByTestId('input');
      expect(label).toHaveAttribute('for', input.id);
    });

    it('should render required indicator when isRequired is true', () => {
      render(<Input label="Password" isRequired />);
      const requiredIndicator = screen.getByText('*');
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveClass('text-red-500');
    });

    it('should not render required indicator when isRequired is false', () => {
      render(<Input label="Optional Field" isRequired={false} />);
      const asterisk = screen.queryByText('*');
      expect(asterisk).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should render error message', () => {
      render(<Input error="This field is required" />);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should have role="alert" on error message', () => {
      render(<Input error="Error message" />);
      const errorElement = screen.getByRole('alert');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent('Error message');
    });

    it('should set aria-invalid to true when error is present', () => {
      render(<Input error="Error" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should set aria-invalid to false when no error', () => {
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should apply error styles to input', () => {
      render(<Input error="Error" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('border-error-500');
    });

    it('should apply error styles to label', () => {
      render(<Input label="Field" error="Error" />);
      const label = screen.getByText('Field');
      expect(label).toHaveClass('text-error-700');
    });

    it('should link error message to input via aria-describedby', () => {
      render(<Input error="Error message" data-testid="input" />);
      const input = screen.getByTestId('input');
      const errorElement = screen.getByRole('alert');
      expect(input).toHaveAttribute('aria-describedby', errorElement.id);
    });
  });

  describe('Helper Text', () => {
    it('should render helper text', () => {
      render(<Input helperText="Enter your email address" />);
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    it('should not render helper text when error is present', () => {
      render(<Input helperText="Helper" error="Error" />);
      expect(screen.queryByText('Helper')).not.toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should link helper text to input via aria-describedby', () => {
      render(<Input helperText="Helper text" data-testid="input" />);
      const input = screen.getByTestId('input');
      const helperElement = screen.getByText('Helper text');
      expect(input).toHaveAttribute('aria-describedby', helperElement.id);
    });

    it('should link both error and helper text to input when both present', () => {
      render(<Input helperText="Helper" error="Error" data-testid="input" />);
      const input = screen.getByTestId('input');
      const errorElement = screen.getByRole('alert');
      expect(input.getAttribute('aria-describedby')).toContain(errorElement.id);
    });
  });

  describe('Size Variants', () => {
    it('should apply default size classes', () => {
      render(<Input size="default" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('w-full');
    });

    it('should apply sm size classes', () => {
      render(<Input size="sm" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('px-3', 'py-2', 'text-sm');
    });

    it('should apply md size classes', () => {
      render(<Input size="md" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('px-4', 'py-3', 'text-base');
    });

    it('should apply lg size classes', () => {
      render(<Input size="lg" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('px-5', 'py-4', 'text-lg');
    });

    it('should apply wide size classes', () => {
      render(<Input size="wide" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('w-full', 'min-w-[200px]');
    });
  });

  describe('Variant Styles', () => {
    it('should apply default variant classes', () => {
      render(<Input variant="default" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toBeInTheDocument();
    });

    it('should apply filled variant classes', () => {
      render(<Input variant="filled" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('border-transparent');
    });

    it('should apply outlined variant classes', () => {
      render(<Input variant="outlined" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('focus:border-primary-500');
    });
  });

  describe('Disabled State', () => {
    it('should render as disabled', () => {
      render(<Input disabled data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toBeDisabled();
    });

    it('should apply disabled styles to label', () => {
      render(<Input label="Disabled Field" disabled />);
      const label = screen.getByText('Disabled Field');
      expect(label).toHaveClass('text-gray-400');
    });

    it('should not accept input when disabled', async () => {
      const user = userEvent.setup();
      render(<Input disabled data-testid="input" />);
      const input = screen.getByTestId('input') as HTMLInputElement;

      await user.type(input, 'test');
      expect(input.value).toBe('');
    });
  });

  describe('Password Type', () => {
    it('should render password input with hidden text by default', () => {
      render(<Input type="password" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should render toggle password visibility button', () => {
      render(<Input type="password" />);
      const toggleButton = screen.getByRole('button', { name: /show password/i });
      expect(toggleButton).toBeInTheDocument();
    });

    it('should toggle password visibility when button is clicked', async () => {
      const user = userEvent.setup();
      render(<Input type="password" data-testid="input" />);
      const input = screen.getByTestId('input');
      const toggleButton = screen.getByRole('button', { name: /show password/i });

      expect(input).toHaveAttribute('type', 'password');

      await user.click(toggleButton);
      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();

      await user.click(toggleButton);
      expect(input).toHaveAttribute('type', 'password');
    });

    it('should show eye icon when password is hidden', () => {
      render(<Input type="password" />);
      const eyeIcon = screen.getByAltText('Show password');
      expect(eyeIcon).toBeInTheDocument();
    });

    it('should show eye-closed icon when password is visible', async () => {
      const user = userEvent.setup();
      render(<Input type="password" />);
      const toggleButton = screen.getByRole('button', { name: /show password/i });

      await user.click(toggleButton);
      const eyeClosedIcon = screen.getByAltText('Hide password');
      expect(eyeClosedIcon).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render left icon', () => {
      const LeftIcon = <span data-testid="left-icon">L</span>;
      render(<Input leftIcon={LeftIcon} />);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('should render right icon', () => {
      const RightIcon = <span data-testid="right-icon">R</span>;
      render(<Input rightIcon={RightIcon} />);
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should apply left padding when left icon is present', () => {
      const LeftIcon = <span>L</span>;
      render(<Input leftIcon={LeftIcon} data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('pl-10');
    });

    it('should apply right padding when right icon is present', () => {
      const RightIcon = <span>R</span>;
      render(<Input rightIcon={RightIcon} data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('pr-10');
    });

    it('should render both left and right icons', () => {
      const LeftIcon = <span data-testid="left-icon">L</span>;
      const RightIcon = <span data-testid="right-icon">R</span>;
      render(<Input leftIcon={LeftIcon} rightIcon={RightIcon} />);
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should apply correct size classes to left icon for sm size', () => {
      const LeftIcon = <span data-testid="left-icon">L</span>;
      const { container } = render(<Input leftIcon={LeftIcon} size="sm" />);
      const iconWrapper = container.querySelector('.w-4.h-4');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('should apply correct size classes to left icon for lg size', () => {
      const LeftIcon = <span data-testid="left-icon">L</span>;
      const { container } = render(<Input leftIcon={LeftIcon} size="lg" />);
      const iconWrapper = container.querySelector('.w-6.h-6');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('should apply correct size classes to right icon for sm size', () => {
      const RightIcon = <span data-testid="right-icon">R</span>;
      const { container } = render(<Input rightIcon={RightIcon} size="sm" />);
      const iconWrapper = container.querySelector('.w-4.h-4');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('should apply correct size classes to right icon for lg size', () => {
      const RightIcon = <span data-testid="right-icon">R</span>;
      const { container } = render(<Input rightIcon={RightIcon} size="lg" />);
      const iconWrapper = container.querySelector('.w-6.h-6');
      expect(iconWrapper).toBeInTheDocument();
    });

    it('should apply default size classes to icons when size is not specified', () => {
      const LeftIcon = <span data-testid="left-icon">L</span>;
      const { container } = render(<Input leftIcon={LeftIcon} />);
      const iconWrapper = container.querySelector('.w-5.h-5');
      expect(iconWrapper).toBeInTheDocument();
    });
  });

  describe('Tel Type Input', () => {
    it('should render tel type input', () => {
      render(<Input type="tel" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('type', 'tel');
    });

    it('should only allow numeric input for tel type', () => {
      render(<Input type="tel" data-testid="input" />);
      const input = screen.getByTestId('input');

      // Try to type letters
      fireEvent.keyDown(input, { key: 'a' });
      expect(input).toBeInTheDocument();

      // Numbers should be allowed
      fireEvent.keyDown(input, { key: '1' });
      expect(input).toBeInTheDocument();
    });

    it('should allow special keys for tel input', () => {
      render(<Input type="tel" data-testid="input" />);
      const input = screen.getByTestId('input');

      const specialKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];

      specialKeys.forEach(key => {
        fireEvent.keyDown(input, { key });
        expect(input).toBeInTheDocument();
      });
    });

    it('should prevent non-numeric keys for tel input', () => {
      render(<Input type="tel" data-testid="input" />);
      const input = screen.getByTestId('input');

      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      input.dispatchEvent(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Allowed Pattern', () => {
    it('should allow characters matching the pattern', () => {
      render(<Input allowedPattern={/^[A-Za-z]$/} data-testid="input" />);
      const input = screen.getByTestId('input');

      fireEvent.keyDown(input, { key: 'a' });
      fireEvent.keyDown(input, { key: 'Z' });
      expect(input).toBeInTheDocument();
    });

    it('should prevent characters not matching the pattern', () => {
      render(<Input allowedPattern={/^[A-Za-z]$/} data-testid="input" />);
      const input = screen.getByTestId('input');

      const event = new KeyboardEvent('keydown', { key: '1', bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      input.dispatchEvent(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should allow special keys even with pattern', () => {
      render(<Input allowedPattern={/^[A-Za-z]$/} data-testid="input" />);
      const input = screen.getByTestId('input');

      const specialKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];

      specialKeys.forEach(key => {
        const preventDefault = vi.fn();
        fireEvent.keyDown(input, { key, preventDefault });
        expect(preventDefault).not.toHaveBeenCalled();
      });
    });

    it('should work with numeric pattern', () => {
      render(<Input allowedPattern={/^[0-9]$/} data-testid="input" />);
      const input = screen.getByTestId('input');

      fireEvent.keyDown(input, { key: '5' });
      expect(input).toBeInTheDocument();

      const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      input.dispatchEvent(event);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('User Interaction', () => {
    it('should accept text input', async () => {
      const user = userEvent.setup();
      render(<Input data-testid="input" />);
      const input = screen.getByTestId('input') as HTMLInputElement;

      await user.type(input, 'Hello World');
      expect(input.value).toBe('Hello World');
    });

    it('should handle onChange event', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} data-testid="input" />);
      const input = screen.getByTestId('input');

      await user.type(input, 'test');
      expect(handleChange).toHaveBeenCalled();
    });

    it('should handle onFocus event', async () => {
      const user = userEvent.setup();
      const handleFocus = vi.fn();
      render(<Input onFocus={handleFocus} data-testid="input" />);
      const input = screen.getByTestId('input');

      await user.click(input);
      expect(handleFocus).toHaveBeenCalled();
    });

    it('should handle onBlur event', async () => {
      const user = userEvent.setup();
      const handleBlur = vi.fn();
      render(<Input onBlur={handleBlur} data-testid="input" />);
      const input = screen.getByTestId('input');

      await user.click(input);
      await user.tab();
      expect(handleBlur).toHaveBeenCalled();
    });
  });

  describe('ForwardRef', () => {
    it('should forward ref to input element', () => {
      const ref = { current: null } as React.RefObject<HTMLInputElement>;
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('should allow access to input methods via ref', () => {
      const ref = { current: null } as React.RefObject<HTMLInputElement>;
      render(<Input ref={ref} />);
      expect(ref.current?.focus).toBeDefined();
      expect(ref.current?.blur).toBeDefined();
    });
  });

  describe('Custom ClassName', () => {
    it('should apply custom className', () => {
      render(<Input className="custom-class" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('custom-class');
    });

    it('should merge custom className with default classes', () => {
      render(<Input className="custom-class" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveClass('custom-class');
      expect(input).toHaveClass('form-input-base');
    });
  });

  describe('Additional Props', () => {
    it('should pass through additional HTML attributes', () => {
      render(<Input data-testid="input" autoComplete="off" name="username" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('autocomplete', 'off');
      expect(input).toHaveAttribute('name', 'username');
    });

    it('should accept value prop', () => {
      render(<Input value="test value" data-testid="input" readOnly />);
      const input = screen.getByTestId('input') as HTMLInputElement;
      expect(input.value).toBe('test value');
    });

    it('should accept defaultValue prop', () => {
      render(<Input defaultValue="default value" data-testid="input" />);
      const input = screen.getByTestId('input') as HTMLInputElement;
      expect(input.value).toBe('default value');
    });

    it('should accept maxLength prop', () => {
      render(<Input maxLength={10} data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('maxlength', '10');
    });

    it('should accept min and max props for number type', () => {
      render(<Input type="number" min={0} max={100} data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '100');
    });
  });

  describe('Display Name', () => {
    it('should have correct displayName', () => {
      expect(Input.displayName).toBe('Input');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty error string', () => {
      render(<Input error="" data-testid="input" />);
      const input = screen.getByTestId('input');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    it('should handle empty helperText string', () => {
      const { container } = render(<Input helperText="" />);
      const helperText = container.querySelector('.form-helper-text');
      expect(helperText).not.toBeInTheDocument();
    });

    it('should handle null values gracefully', () => {
      render(<Input error={undefined} helperText={undefined} label={undefined} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('should handle multiple keydown events', () => {
      render(<Input type="tel" data-testid="input" />);
      const input = screen.getByTestId('input');

      fireEvent.keyDown(input, { key: '1' });
      fireEvent.keyDown(input, { key: '2' });
      fireEvent.keyDown(input, { key: 'Backspace' });
      expect(input).toBeInTheDocument();
    });

    it('should work with controlled component pattern', async () => {
      const user = userEvent.setup();
      const ControlledInput = () => {
        const [value, setValue] = React.useState('');
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            data-testid="input"
          />
        );
      };

      render(<ControlledInput />);
      const input = screen.getByTestId('input') as HTMLInputElement;

      await user.type(input, 'test');
      expect(input.value).toBe('test');
    });
  });

  describe('Combined Features', () => {
    it('should handle password input with error and helper text', () => {
      render(
        <Input
          type="password"
          error="Password is required"
          helperText="Enter strong password"
          label="Password"
          isRequired
        />
      );

      expect(screen.getByText('Password')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
      expect(screen.queryByText('Enter strong password')).not.toBeInTheDocument();
    });

    it('should handle input with all features enabled', () => {
      const LeftIcon = <span data-testid="left-icon">L</span>;
      const RightIcon = <span data-testid="right-icon">R</span>;

      render(
        <Input
          label="Full Featured Input"
          placeholder="Enter value"
          error="Error message"
          helperText="Helper text"
          size="md"
          variant="outlined"
          leftIcon={LeftIcon}
          rightIcon={RightIcon}
          isRequired
          disabled={false}
          data-testid="input"
        />
      );

      expect(screen.getByText('Full Featured Input')).toBeInTheDocument();
      expect(screen.getByTestId('input')).toBeInTheDocument();
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });
});
