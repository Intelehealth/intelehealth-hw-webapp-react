import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AyuSelectableOption } from '../../../../../modules/ayu/components/common/ayu-selectable-option.component';

describe('AyuSelectableOption', () => {
  describe('Rendering', () => {
    it('should render button with label', () => {
      render(<AyuSelectableOption label="Option 1" value="opt-1" selected={false} />);
      expect(screen.getByRole('button', { name: 'Option 1' })).toBeInTheDocument();
    });

    it('should render button with undefined label', () => {
      render(<AyuSelectableOption label={undefined} value="opt-1" selected={false} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have correct button type', () => {
      render(<AyuSelectableOption label="Option 1" value="opt-1" selected={false} />);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should have selectable-option class', () => {
      render(<AyuSelectableOption label="Option 1" value="opt-1" selected={false} />);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('selectable-option');
    });
  });

  describe('Props Handling', () => {
    it('should accept value prop', () => {
      render(<AyuSelectableOption label="Option 1" value="opt-1" selected={false} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should accept undefined value', () => {
      render(<AyuSelectableOption label="Option 1" value={undefined} selected={false} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should accept selected prop as true', () => {
      render(<AyuSelectableOption label="Option 1" value="opt-1" selected={true} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should accept selected prop as false', () => {
      render(<AyuSelectableOption label="Option 1" value="opt-1" selected={false} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    it('should be clickable', async () => {
      const user = userEvent.setup();
      render(<AyuSelectableOption label="Option 1" value="opt-1" selected={false} />);
      const button = screen.getByRole('button');
      await user.click(button);
    });

    it('should have empty onClick handler', async () => {
      const user = userEvent.setup();
      render(<AyuSelectableOption label="Option 1" value="opt-1" selected={false} />);
      const button = screen.getByRole('button');
      await user.click(button);
      expect(button).toBeInTheDocument();
    });
  });

  describe('Label Display', () => {
    it('should display text label', () => {
      render(<AyuSelectableOption label="Test Option" value="test" selected={false} />);
      expect(screen.getByText('Test Option')).toBeInTheDocument();
    });

    it('should display empty label', () => {
      render(<AyuSelectableOption label="" value="test" selected={false} />);
      const button = screen.getByRole('button');
      expect(button.textContent).toBe('');
    });

    it('should display label with special characters', () => {
      render(<AyuSelectableOption label={"Option <1> & \"2\""} value="test" selected={false} />);
      expect(screen.getByText('Option <1> & "2"')).toBeInTheDocument();
    });

    it('should display long label', () => {
      const longLabel = 'This is a very long option label that might wrap to multiple lines';
      render(<AyuSelectableOption label={longLabel} value="test" selected={false} />);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle all undefined props', () => {
      render(<AyuSelectableOption label={undefined} value={undefined} selected={false} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle numeric string value', () => {
      render(<AyuSelectableOption label="Number" value="123" selected={false} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle empty string value', () => {
      render(<AyuSelectableOption label="Empty" value="" selected={false} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible as button', () => {
      render(<AyuSelectableOption label="Accessible Option" value="acc" selected={false} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should have visible text content', () => {
      render(<AyuSelectableOption label="Visible Text" value="vis" selected={false} />);
      const button = screen.getByRole('button');
      expect(button).toBeVisible();
    });
  });

  describe('CSS Classes', () => {
    it('should apply selectable-option class', () => {
      const { container } = render(
        <AyuSelectableOption label="Option" value="opt" selected={false} />
      );
      const button = container.querySelector('.selectable-option');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Button Type', () => {
    it('should prevent form submission', () => {
      render(<AyuSelectableOption label="Option" value="opt" selected={false} />);
      const button = screen.getByRole('button');
      expect(button.getAttribute('type')).toBe('button');
    });
  });
});
