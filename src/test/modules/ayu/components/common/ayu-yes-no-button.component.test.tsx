import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AyuYesNoButton } from '../../../../../modules/ayu/components/common/ayu-yes-no-button.component';

// Mock AyuButton to render a plain <button> so we can inspect className and style directly
vi.mock('../../../../../modules/ayu/components/common/ayu-button.component', () => ({
  default: vi.fn(({ children, onClick, className, style, disabled, ...props }) => (
    <button
      onClick={onClick}
      className={className}
      style={style}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )),
}));

describe('AyuYesNoButton', () => {
  describe('Rendering', () => {
    it('should render both Yes and No buttons', () => {
      render(<AyuYesNoButton value={null} onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument();
    });

    it('should render inside a flex container', () => {
      const { container } = render(<AyuYesNoButton value={null} onChange={vi.fn()} />);
      expect(container.firstChild).toHaveClass('flex', 'gap-2');
    });
  });

  describe('getButtonClass — inactive (value is null)', () => {
    it('Yes button should have inactive class when value is null', () => {
      render(<AyuYesNoButton value={null} onChange={vi.fn()} />);
      const yesButton = screen.getByRole('button', { name: /yes/i });
      expect(yesButton).toHaveClass('bg-white', 'text-gray-700');
    });

    it('No button should have inactive class when value is null', () => {
      render(<AyuYesNoButton value={null} onChange={vi.fn()} />);
      const noButton = screen.getByRole('button', { name: /no/i });
      expect(noButton).toHaveClass('bg-white', 'text-gray-700');
    });
  });

  describe('getButtonClass — active', () => {
    it('Yes button should have active class when value is "Yes"', () => {
      render(<AyuYesNoButton value="Yes" onChange={vi.fn()} />);
      const yesButton = screen.getByRole('button', { name: /yes/i });
      expect(yesButton).toHaveClass('text-white');
      expect(yesButton).not.toHaveClass('bg-white');
    });

    it('No button should have inactive class when value is "Yes"', () => {
      render(<AyuYesNoButton value="Yes" onChange={vi.fn()} />);
      const noButton = screen.getByRole('button', { name: /no/i });
      expect(noButton).toHaveClass('bg-white', 'text-gray-700');
    });

    it('No button should have active class when value is "No"', () => {
      render(<AyuYesNoButton value="No" onChange={vi.fn()} />);
      const noButton = screen.getByRole('button', { name: /no/i });
      expect(noButton).toHaveClass('text-white');
      expect(noButton).not.toHaveClass('bg-white');
    });

    it('Yes button should have inactive class when value is "No"', () => {
      render(<AyuYesNoButton value="No" onChange={vi.fn()} />);
      const yesButton = screen.getByRole('button', { name: /yes/i });
      expect(yesButton).toHaveClass('bg-white', 'text-gray-700');
    });
  });

  describe('getButtonStyle — active', () => {
    it('should apply default activeColor style to Yes when selected', () => {
      render(<AyuYesNoButton value="Yes" onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: /yes/i })).toHaveStyle({
        backgroundColor: '#0fd197',
      });
    });

    it('should apply custom activeColor style to Yes when selected', () => {
      render(<AyuYesNoButton value="Yes" onChange={vi.fn()} activeColor="#ff0000" />);
      expect(screen.getByRole('button', { name: /yes/i })).toHaveStyle({
        backgroundColor: '#ff0000',
      });
    });

    it('should apply default activeColor style to No when selected', () => {
      render(<AyuYesNoButton value="No" onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: /no/i })).toHaveStyle({
        backgroundColor: '#0fd197',
      });
    });

    it('should apply custom activeColor style to No when selected', () => {
      render(<AyuYesNoButton value="No" onChange={vi.fn()} activeColor="#123456" />);
      expect(screen.getByRole('button', { name: /no/i })).toHaveStyle({
        backgroundColor: '#123456',
      });
    });
  });

  describe('getButtonStyle — inactive', () => {
    it('should not apply backgroundColor to unselected Yes when value is "No"', () => {
      render(<AyuYesNoButton value="No" onChange={vi.fn()} activeColor="#ff0000" />);
      expect(screen.getByRole('button', { name: /yes/i })).not.toHaveStyle({
        backgroundColor: '#ff0000',
      });
    });

    it('should not apply backgroundColor to unselected No when value is "Yes"', () => {
      render(<AyuYesNoButton value="Yes" onChange={vi.fn()} activeColor="#ff0000" />);
      expect(screen.getByRole('button', { name: /no/i })).not.toHaveStyle({
        backgroundColor: '#ff0000',
      });
    });
  });

  describe('Click Handlers', () => {
    it('should call onChange with "Yes" when Yes is clicked', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<AyuYesNoButton value={null} onChange={handleChange} />);
      await user.click(screen.getByRole('button', { name: /yes/i }));
      expect(handleChange).toHaveBeenCalledWith('Yes');
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should call onChange with "No" when No is clicked', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<AyuYesNoButton value={null} onChange={handleChange} />);
      await user.click(screen.getByRole('button', { name: /no/i }));
      expect(handleChange).toHaveBeenCalledWith('No');
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should call onChange even when clicking the already-selected value', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<AyuYesNoButton value="Yes" onChange={handleChange} />);
      await user.click(screen.getByRole('button', { name: /yes/i }));
      expect(handleChange).toHaveBeenCalledWith('Yes');
    });
  });

  describe('Disabled State', () => {
    it('should disable both buttons when disabled is true', () => {
      render(<AyuYesNoButton value={null} onChange={vi.fn()} disabled />);
      expect(screen.getByRole('button', { name: /yes/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /no/i })).toBeDisabled();
    });

    it('should not call onChange when Yes is disabled', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<AyuYesNoButton value={null} onChange={handleChange} disabled />);
      await user.click(screen.getByRole('button', { name: /yes/i }));
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should not call onChange when No is disabled', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<AyuYesNoButton value={null} onChange={handleChange} disabled />);
      await user.click(screen.getByRole('button', { name: /no/i }));
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should not disable buttons when disabled is false (default)', () => {
      render(<AyuYesNoButton value={null} onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: /yes/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /no/i })).not.toBeDisabled();
    });
  });
});
