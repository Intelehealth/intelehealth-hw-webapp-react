import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AyuYesNoButton } from '../../../../../modules/ayu/components/common/ayu-yes-no-button.component';

describe('AyuYesNoButton', () => {
  describe('Rendering', () => {
    it('should render both Yes and No buttons', () => {
      render(<AyuYesNoButton value={null} onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /no/i })).toBeInTheDocument();
    });

    it('should render with no selected value (null)', () => {
      render(<AyuYesNoButton value={null} onChange={vi.fn()} />);
      const yesButton = screen.getByRole('button', { name: /yes/i });
      const noButton = screen.getByRole('button', { name: /no/i });
      expect(yesButton).toHaveClass('bg-white', 'text-gray-700');
      expect(noButton).toHaveClass('bg-white', 'text-gray-700');
    });

    it('should apply active styles to Yes button when value is "Yes"', () => {
      render(<AyuYesNoButton value="Yes" onChange={vi.fn()} />);
      const yesButton = screen.getByRole('button', { name: /yes/i });
      expect(yesButton).toHaveClass('text-white');
      expect(yesButton).not.toHaveClass('bg-white', 'text-gray-700');
    });

    it('should apply inactive styles to No button when value is "Yes"', () => {
      render(<AyuYesNoButton value="Yes" onChange={vi.fn()} />);
      const noButton = screen.getByRole('button', { name: /no/i });
      expect(noButton).toHaveClass('bg-white', 'text-gray-700');
    });

    it('should apply active styles to No button when value is "No"', () => {
      render(<AyuYesNoButton value="No" onChange={vi.fn()} />);
      const noButton = screen.getByRole('button', { name: /no/i });
      expect(noButton).toHaveClass('text-white');
      expect(noButton).not.toHaveClass('bg-white', 'text-gray-700');
    });

    it('should apply inactive styles to Yes button when value is "No"', () => {
      render(<AyuYesNoButton value="No" onChange={vi.fn()} />);
      const yesButton = screen.getByRole('button', { name: /yes/i });
      expect(yesButton).toHaveClass('bg-white', 'text-gray-700');
    });
  });

  describe('Styles', () => {
    it('should apply default activeColor to Yes button when selected', () => {
      render(<AyuYesNoButton value="Yes" onChange={vi.fn()} />);
      const yesButton = screen.getByRole('button', { name: /yes/i });
      expect(yesButton).toHaveStyle({ backgroundColor: '#0fd197' });
    });

    it('should apply custom activeColor to Yes button when selected', () => {
      render(<AyuYesNoButton value="Yes" onChange={vi.fn()} activeColor="#ff0000" />);
      const yesButton = screen.getByRole('button', { name: /yes/i });
      expect(yesButton).toHaveStyle({ backgroundColor: '#ff0000' });
    });

    it('should apply default activeColor to No button when selected', () => {
      render(<AyuYesNoButton value="No" onChange={vi.fn()} />);
      const noButton = screen.getByRole('button', { name: /no/i });
      expect(noButton).toHaveStyle({ backgroundColor: '#0fd197' });
    });

    it('should apply custom activeColor to No button when selected', () => {
      render(<AyuYesNoButton value="No" onChange={vi.fn()} activeColor="#123456" />);
      const noButton = screen.getByRole('button', { name: /no/i });
      expect(noButton).toHaveStyle({ backgroundColor: '#123456' });
    });

    it('should not apply activeColor to unselected buttons', () => {
      render(<AyuYesNoButton value="Yes" onChange={vi.fn()} activeColor="#ff0000" />);
      const noButton = screen.getByRole('button', { name: /no/i });
      expect(noButton).not.toHaveStyle({ backgroundColor: '#ff0000' });
    });
  });

  describe('Click Handlers', () => {
    it('should call onChange with "Yes" when Yes button is clicked', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<AyuYesNoButton value={null} onChange={handleChange} />);
      await user.click(screen.getByRole('button', { name: /yes/i }));
      expect(handleChange).toHaveBeenCalledWith('Yes');
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should call onChange with "No" when No button is clicked', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<AyuYesNoButton value={null} onChange={handleChange} />);
      await user.click(screen.getByRole('button', { name: /no/i }));
      expect(handleChange).toHaveBeenCalledWith('No');
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('should call onChange again when clicking already selected value', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<AyuYesNoButton value="Yes" onChange={handleChange} />);
      await user.click(screen.getByRole('button', { name: /yes/i }));
      expect(handleChange).toHaveBeenCalledWith('Yes');
    });
  });

  describe('Disabled State', () => {
    it('should disable both buttons when disabled prop is true', () => {
      render(<AyuYesNoButton value={null} onChange={vi.fn()} disabled />);
      expect(screen.getByRole('button', { name: /yes/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /no/i })).toBeDisabled();
    });

    it('should not call onChange when Yes button is disabled and clicked', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<AyuYesNoButton value={null} onChange={handleChange} disabled />);
      await user.click(screen.getByRole('button', { name: /yes/i }));
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should not call onChange when No button is disabled and clicked', async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<AyuYesNoButton value={null} onChange={handleChange} disabled />);
      await user.click(screen.getByRole('button', { name: /no/i }));
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('should not disable buttons when disabled prop is false (default)', () => {
      render(<AyuYesNoButton value={null} onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: /yes/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /no/i })).not.toBeDisabled();
    });
  });
});
