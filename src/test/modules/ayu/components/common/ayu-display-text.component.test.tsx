import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AyuDisplayText } from '../../../../../modules/ayu/components/common/ayu-display-text.component';
import type { AyuQuestion } from '../../../../../modules/ayu-library/types/ayu.types';
import { EXT_URL_DISPLAY_TEXT } from '../../../../../modules/ayu-library/utils/constants';

describe('AyuDisplayText', () => {
  const mockQuestion: AyuQuestion = {
    linkId: 'display-1',
    text: 'This is display text',
    type: 'display',
  };

  describe('Rendering', () => {
    it('should render display text', () => {
      render(<AyuDisplayText question={mockQuestion} />);
      expect(screen.getByText('This is display text')).toBeInTheDocument();
    });

    it('should render as paragraph element', () => {
      const { container } = render(<AyuDisplayText question={mockQuestion} />);
      const paragraph = container.querySelector('p');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph?.textContent).toBe('This is display text');
    });

    it('should have correct CSS classes', () => {
      const { container } = render(<AyuDisplayText question={mockQuestion} />);
      const paragraph = container.querySelector('p');
      expect(paragraph).toHaveClass('text-gray-600', 'text-sm');
    });
  });

  describe('Text Content', () => {
    it('should render with empty text', () => {
      const emptyTextQuestion: AyuQuestion = {
        ...mockQuestion,
        text: '',
      };
      const { container } = render(<AyuDisplayText question={emptyTextQuestion} />);
      const paragraph = container.querySelector('p');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph?.textContent).toBe('');
    });

    it('should render with undefined text', () => {
      const undefinedTextQuestion: AyuQuestion = {
        ...mockQuestion,
        text: undefined,
      };
      const { container } = render(<AyuDisplayText question={undefinedTextQuestion} />);
      const paragraph = container.querySelector('p');
      expect(paragraph).toBeInTheDocument();
    });

    it('should render long text', () => {
      const longTextQuestion: AyuQuestion = {
        ...mockQuestion,
        text: 'This is a very long text that might span multiple lines and contains a lot of information that needs to be displayed to the user.',
      };
      render(<AyuDisplayText question={longTextQuestion} />);
      expect(screen.getByText(/This is a very long text/)).toBeInTheDocument();
    });

    it('should render text with special characters', () => {
      const specialCharsQuestion: AyuQuestion = {
        ...mockQuestion,
        text: 'Text with <special> & "characters" and symbols!',
      };
      render(<AyuDisplayText question={specialCharsQuestion} />);
      expect(screen.getByText('Text with <special> & "characters" and symbols!')).toBeInTheDocument();
    });

    it('should render text with line breaks', () => {
      const multilineQuestion: AyuQuestion = {
        ...mockQuestion,
        text: 'Line 1\nLine 2\nLine 3',
      };
      const { container } = render(<AyuDisplayText question={multilineQuestion} />);
      const paragraph = container.querySelector('p');
      expect(paragraph?.textContent).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('Question Object Handling', () => {
    it('should handle minimal question object', () => {
      const minimalQuestion: AyuQuestion = {
        linkId: 'min-1',
        text: 'Minimal',
        type: 'display',
      };
      render(<AyuDisplayText question={minimalQuestion} />);
      expect(screen.getByText('Minimal')).toBeInTheDocument();
    });

    it('should ignore other question properties', () => {
      const complexQuestion: AyuQuestion = {
        linkId: 'complex-1',
        text: 'Display text',
        type: 'display',
        required: true,
        readOnly: true,
        answerOption: [{ valueString: 'Option' }],
      };
      render(<AyuDisplayText question={complexQuestion} />);
      expect(screen.getByText('Display text')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined question gracefully', () => {
      const { container } = render(<AyuDisplayText question={undefined} />);
      const paragraph = container.querySelector('p');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph?.textContent).toBe('');
    });

    it('should handle text with only whitespace', () => {
      const whitespaceQuestion: AyuQuestion = {
        ...mockQuestion,
        text: '   ',
      };
      const { container } = render(<AyuDisplayText question={whitespaceQuestion} />);
      const paragraph = container.querySelector('p');
      expect(paragraph).toBeInTheDocument();
    });

    it('should handle text with numbers', () => {
      const numberQuestion: AyuQuestion = {
        ...mockQuestion,
        text: '12345',
      };
      render(<AyuDisplayText question={numberQuestion} />);
      expect(screen.getByText('12345')).toBeInTheDocument();
    });

    it('should handle text with emojis', () => {
      const emojiQuestion: AyuQuestion = {
        ...mockQuestion,
        text: 'Hello 👋 World 🌍',
      };
      render(<AyuDisplayText question={emojiQuestion} />);
      expect(screen.getByText('Hello 👋 World 🌍')).toBeInTheDocument();
    });

    it('should handle text with HTML entities', () => {
      const htmlEntityQuestion: AyuQuestion = {
        ...mockQuestion,
        text: 'Price: &pound;100',
      };
      render(<AyuDisplayText question={htmlEntityQuestion} />);
      expect(screen.getByText('Price: &pound;100')).toBeInTheDocument();
    });
  });

  describe('Display Extension Label', () => {
    it('should prefer the display extension over text', () => {
      const question: AyuQuestion = {
        linkId: 'display-1',
        type: 'display',
        text: 'Short text',
        extension: [
          { url: EXT_URL_DISPLAY_TEXT, valueString: 'Long display text' },
        ],
      };
      render(<AyuDisplayText question={question} />);
      expect(screen.getByText('Long display text')).toBeInTheDocument();
      expect(screen.queryByText('Short text')).not.toBeInTheDocument();
    });

    it('should fall back to text when display extension has no valueString', () => {
      const question: AyuQuestion = {
        linkId: 'display-1',
        type: 'display',
        text: 'Short text',
        extension: [{ url: EXT_URL_DISPLAY_TEXT }],
      };
      render(<AyuDisplayText question={question} />);
      expect(screen.getByText('Short text')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should be readable by screen readers', () => {
      render(<AyuDisplayText question={mockQuestion} />);
      const element = screen.getByText('This is display text');
      expect(element).toBeVisible();
    });
  });
});
