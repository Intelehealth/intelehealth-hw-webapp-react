import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AyuRepeatableText } from '../../../../../modules/ayu/components/common/ayu-repeatable-text.component';

describe('AyuRepeatableText', () => {
  describe('Rendering', () => {
    it('should render text input', () => {
      render(<AyuRepeatableText />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should have correct input type', () => {
      render(<AyuRepeatableText />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should have placeholder text', () => {
      render(<AyuRepeatableText />);
      const input = screen.getByPlaceholderText('Add multiple values');
      expect(input).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('should have correct CSS classes', () => {
      render(<AyuRepeatableText />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('w-full', 'border', 'rounded', 'px-3', 'py-2');
    });
  });

  describe('Input Behavior', () => {
    it('should be enabled by default', () => {
      render(<AyuRepeatableText />);
      const input = screen.getByRole('textbox');
      expect(input).not.toBeDisabled();
    });

    it('should accept text input', () => {
      render(<AyuRepeatableText />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  describe('Placeholder', () => {
    it('should display correct placeholder text', () => {
      render(<AyuRepeatableText />);
      const input = screen.getByRole('textbox') as HTMLInputElement;
      expect(input.placeholder).toBe('Add multiple values');
    });
  });

  describe('Accessibility', () => {
    it('should be accessible via role', () => {
      render(<AyuRepeatableText />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should be visible', () => {
      render(<AyuRepeatableText />);
      const input = screen.getByRole('textbox');
      expect(input).toBeVisible();
    });
  });

  describe('Edge Cases', () => {
    it('should render without any props', () => {
      render(<AyuRepeatableText />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should be a valid HTML input element', () => {
      const { container } = render(<AyuRepeatableText />);
      const input = container.querySelector('input');
      expect(input).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Layout', () => {
    it('should have full width class', () => {
      render(<AyuRepeatableText />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('w-full');
    });

    it('should have border styling', () => {
      render(<AyuRepeatableText />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border', 'rounded');
    });

    it('should have padding classes', () => {
      render(<AyuRepeatableText />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('px-3', 'py-2');
    });
  });
});
