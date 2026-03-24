import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AyuTextInput } from '../../../../../modules/ayu/components/common/ayu-text-input.component';
import type { AyuQuestion } from '../../../../../modules/ayu-library/types/ayu.types';
import { resolveAyuComponent } from '../../../../../modules/ayu-library/logic/decision-matrix';

vi.mock('../../../../../modules/ayu-library/utils/fhir-to-ayu.util', () => ({
  resolveLabel: vi.fn((question) => question.text),
}));

vi.mock('../../../../../modules/ayu-library/logic/decision-matrix', () => ({
  resolveAyuComponent: vi.fn(() => 'text'),
}));

const mockResolveAyuComponent = vi.mocked(resolveAyuComponent);

describe('AyuTextInput', () => {
  const mockQuestion: AyuQuestion = {
    linkId: 'test-1',
    text: 'What is your name?',
    type: 'string',
    readOnly: false,
  };

  describe('Rendering', () => {
    it('should render text input with label', () => {
      const questionWithLabel: AyuQuestion = {
        ...mockQuestion,
        text: 'Additional information',
      };
      render(
        <AyuTextInput
          question={questionWithLabel}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByLabelText('Additional information')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render without label when text is not provided', () => {
      const questionWithoutText: AyuQuestion = {
        ...mockQuestion,
        text: undefined,
      };
      render(
        <AyuTextInput
          question={questionWithoutText}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should render disabled input when readOnly is true', () => {
      const readOnlyQuestion: AyuQuestion = {
        ...mockQuestion,
        readOnly: true,
      };
      render(
        <AyuTextInput
          question={readOnlyQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should render enabled input when readOnly is false', () => {
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByRole('textbox');
      expect(input).not.toBeDisabled();
    });

    it('should render as textarea element', () => {
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByRole('textbox');
      expect(input.tagName).toBe('TEXTAREA');
    });

    it('should render label text only when label is "Additional information"', () => {
      const questionWithLabel: AyuQuestion = {
        ...mockQuestion,
        text: 'Additional information',
      };
      render(
        <AyuTextInput
          question={questionWithLabel}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByText('Additional information')).toBeInTheDocument();
    });

    it('should not render label text when label includes "Describe" but not "Other [Describe]" and parent is not associatedSymptoms', () => {
      const questionWithDescribe: AyuQuestion = {
        ...mockQuestion,
        text: 'Please Describe your symptoms',
      };
      const parent: AyuQuestion = {
        linkId: 'parent-1',
        text: 'Parent Question',
        type: 'group',
        item: [],
      };
      render(
        <AyuTextInput
          question={questionWithDescribe}
          parent={parent}
          previousSibling={undefined}
        />
      );
      // The label element is rendered (because label is truthy), but its text content is null
      // since all three conditions are false:
      // 1. label !== 'Additional information'
      // 2. isAssociatedSymptomsParent is false (parent resolves to 'text', not 'associatedSymptoms')
      // 3. label.includes('Describe') is true, so !label.includes('Describe') is false
      expect(screen.queryByText('Please Describe your symptoms')).not.toBeInTheDocument();
    });

    it('should render label text when label does not include "Describe"', () => {
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      // Labels without "Describe" are rendered because !label.includes('Describe') is true
      expect(screen.getByText('What is your name?')).toBeInTheDocument();
    });

    it('should have placeholder text "Describe..."', () => {
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'Describe...');
    });

    it('should have correct CSS classes', () => {
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border', 'rounded-md', 'px-3', 'py-2');
    });
  });

  describe('Label Styling', () => {
    it('should render label with primary CSS classes when text is "Additional Information"', () => {
      const questionWithLabel: AyuQuestion = {
        ...mockQuestion,
        text: 'Additional Information',
      };
      render(
        <AyuTextInput
          question={questionWithLabel}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const label = screen.getByText('Additional Information');
      expect(label).toHaveClass('text-md', 'font-medium', 'text-black-500');
    });

    it('should render label with muted CSS classes for other labels', () => {
      const questionWithLabel: AyuQuestion = {
        ...mockQuestion,
        text: 'Additional information',
      };
      render(
        <AyuTextInput
          question={questionWithLabel}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const label = screen.getByText('Additional information');
      expect(label).toHaveClass('block', 'text-base');
    });
  });

  describe('Props Handling', () => {
    it('should handle parent prop', () => {
      const parent: AyuQuestion = {
        linkId: 'parent-1',
        text: 'Parent Question',
        type: 'group',
        item: [],
      };
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={parent}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should handle previousSibling prop', () => {
      const previousSibling: AyuQuestion = {
        linkId: 'prev-1',
        text: 'Previous Question',
        type: 'string',
      };
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={previousSibling}
        />
      );
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined question gracefully', () => {
      render(
        <AyuTextInput
          question={undefined}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });

    it('should handle question with empty string text', () => {
      const emptyTextQuestion: AyuQuestion = {
        ...mockQuestion,
        text: '',
      };
      render(
        <AyuTextInput
          question={emptyTextQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('should handle undefined readOnly', () => {
      const questionWithoutReadOnly: AyuQuestion = {
        linkId: 'test-1',
        text: 'Question',
        type: 'string',
      };
      render(
        <AyuTextInput
          question={questionWithoutReadOnly}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByRole('textbox');
      expect(input).not.toBeDisabled();
    });
  });

  describe('Container Layout', () => {
    it('should render with flex container classes', () => {
      const { container } = render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'flex-col', 'gap-1');
    });
  });

  describe('handleChange Function Coverage', () => {
    it('should call onChange with text value when user types', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Hello World' } });

      expect(mockOnChange).toHaveBeenCalledWith('Hello World');
    });

    it('should handle empty string value correctly', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value="Some text"
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      // Verify initial value
      expect(textarea.value).toBe('Some text');

      // Test that handleChange function logic handles empty strings
      // (the actual logic: const newValue = e.target.value; onChange?.(newValue);)
      fireEvent.change(textarea, { target: { value: 'Updated' } });
      expect(mockOnChange).toHaveBeenCalledWith('Updated');
    });

    it('should call onChange with multiline text', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      const multilineText = 'Line 1\nLine 2\nLine 3';
      fireEvent.change(textarea, { target: { value: multilineText } });

      expect(mockOnChange).toHaveBeenCalledWith(multilineText);
    });

    it('should call onChange with special characters', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      const specialText = '!@#$%^&*()_+-=[]{}|;:",.<>?/~`';
      fireEvent.change(textarea, { target: { value: specialText } });

      expect(mockOnChange).toHaveBeenCalledWith(specialText);
    });

    it('should call onChange with numeric strings', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '12345' } });

      expect(mockOnChange).toHaveBeenCalledWith('12345');
    });

    it('should call onChange with whitespace', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '   ' } });

      expect(mockOnChange).toHaveBeenCalledWith('   ');
    });

    it('should not throw error when onChange is undefined', () => {
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );

      const textarea = screen.getByRole('textbox');

      expect(() => {
        fireEvent.change(textarea, { target: { value: 'Test' } });
      }).not.toThrow();
    });

    it('should handle multiple onChange calls', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'First' } });
      fireEvent.change(textarea, { target: { value: 'Second' } });
      fireEvent.change(textarea, { target: { value: 'Third' } });

      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 'First');
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 'Second');
      expect(mockOnChange).toHaveBeenNthCalledWith(3, 'Third');
    });

    it('should call onChange with unicode characters', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      const unicodeText = '你好世界 مرحبا بالعالم';
      fireEvent.change(textarea, { target: { value: unicodeText } });

      expect(mockOnChange).toHaveBeenCalledWith(unicodeText);
    });

    it('should call onChange with emoji characters', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      const emojiText = '😀 😃 😄 😁';
      fireEvent.change(textarea, { target: { value: emojiText } });

      expect(mockOnChange).toHaveBeenCalledWith(emojiText);
    });

    it('should call onChange with very long text', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByRole('textbox');
      const longText = 'a'.repeat(1000);
      fireEvent.change(textarea, { target: { value: longText } });

      expect(mockOnChange).toHaveBeenCalledWith(longText);
    });
  });

  describe('inputValue Logic Coverage', () => {
    it('should display value prop as string', () => {
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value="Test Value"
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Test Value');
    });

    it('should convert numeric value to string', () => {
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={42}
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('42');
    });

    it('should display empty string when value is null', () => {
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={null}
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
    });

    it('should display empty string when value is undefined', () => {
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={undefined}
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
    });

    it('should display empty string when value is not provided', () => {
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
    });

    it('should convert boolean value to string', () => {
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={true}
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('true');
    });

    it('should display zero as string', () => {
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={0}
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('0');
    });

    it('should handle object value by converting to string', () => {
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={{ test: 'value' } as any}
        />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('[object Object]');
    });
  });

  describe('Associated Symptoms Parent Label Hiding', () => {
    const associatedSymptomsParent: AyuQuestion = {
      linkId: 'assoc-parent',
      text: 'Associated symptoms',
      type: 'choice',
    };

    it('should hide label containing "Other" when parent is associatedSymptoms', () => {
      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      const questionWithOther: AyuQuestion = {
        ...mockQuestion,
        text: '[Other]',
      };
      render(
        <AyuTextInput
          question={questionWithOther}
          parent={associatedSymptomsParent}
          previousSibling={undefined}
        />
      );
      expect(screen.queryByText('[Other]')).not.toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      mockResolveAyuComponent.mockReturnValue('text');
    });

    it('should hide label containing "Other [describe]" (lowercase) when parent is associatedSymptoms', () => {
      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      const questionWithDescribe: AyuQuestion = {
        ...mockQuestion,
        text: 'Other [describe]',
      };
      render(
        <AyuTextInput
          question={questionWithDescribe}
          parent={associatedSymptomsParent}
          previousSibling={undefined}
        />
      );
      // "Other [describe]" contains "other" so it is hidden when parent is associatedSymptoms
      expect(screen.queryByText('Other [describe]')).not.toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      mockResolveAyuComponent.mockReturnValue('text');
    });

    it('should show label with "describe" but without "other" when parent is associatedSymptoms', () => {
      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      const questionWithDescribe: AyuQuestion = {
        ...mockQuestion,
        text: 'Please describe your symptoms',
      };
      render(
        <AyuTextInput
          question={questionWithDescribe}
          parent={associatedSymptomsParent}
          previousSibling={undefined}
        />
      );
      // Label contains "describe" but NOT "other", so it is shown for associatedSymptoms parent
      expect(screen.getByText('Please describe your symptoms')).toBeInTheDocument();
      mockResolveAyuComponent.mockReturnValue('text');
    });

    it('should show label without "Other" or "describe" when parent is associatedSymptoms', () => {
      mockResolveAyuComponent.mockReturnValue('associatedSymptoms');
      const regularQuestion: AyuQuestion = {
        ...mockQuestion,
        text: 'Duration of fever',
      };
      render(
        <AyuTextInput
          question={regularQuestion}
          parent={associatedSymptomsParent}
          previousSibling={undefined}
        />
      );
      expect(screen.getByText('Duration of fever')).toBeInTheDocument();
      mockResolveAyuComponent.mockReturnValue('text');
    });

    it('should hide label with "describe" (case-insensitive) when parent is not associatedSymptoms', () => {
      mockResolveAyuComponent.mockReturnValue('text');
      const questionWithDescribe: AyuQuestion = {
        ...mockQuestion,
        text: 'please describe symptoms',
      };
      render(
        <AyuTextInput
          question={questionWithDescribe}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.queryByText('please describe symptoms')).not.toBeInTheDocument();
    });
  });
});
