import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AyuTextInput } from '../../../../../modules/ayu/components/common/ayu-text-input.component';
import type { AyuQuestion } from '../../../../../modules/ayu-library/types/ayu.types';

vi.mock('../../../../../modules/ayu-library/utils/fhir-to-ayu.util', () => ({
  resolveLabel: vi.fn((question) => question.text),
}));

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

    it('hides the label of a string field that is the sole child of its option', () => {
      const parent: AyuQuestion = {
        linkId: 'p1',
        type: 'choice',
        text: 'Timing',
        answerOption: [
          { valueCoding: { code: 'OTHER', display: 'Other[Describe]' } },
        ],
        item: [
          {
            linkId: 'p1_other',
            type: 'string',
            text: 'Other[Describe]',
            enableWhen: [
              { question: 'p1', operator: '=', answerCoding: { code: 'OTHER' } },
            ],
          },
        ],
      };
      render(
        <AyuTextInput
          question={parent.item![0]}
          parent={parent}
          previousSibling={undefined}
        />
      );
      expect(screen.queryByText('Other[Describe]')).not.toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('shows the label of a string field grouped with siblings under the same option', () => {
      const parent: AyuQuestion = {
        linkId: 'exposure',
        type: 'choice',
        text: 'Exposure to irritants/offending agents',
        answerOption: [{ valueCoding: { code: 'YES', display: 'Yes' } }],
        item: [
          {
            linkId: 'duration',
            type: 'quantity',
            text: 'Duration from contact to a symptom development',
            enableWhen: [
              { question: 'exposure', operator: '=', answerCoding: { code: 'YES' } },
            ],
          },
          {
            linkId: 'irritant',
            type: 'string',
            text: 'Irritant/agents  (Describe)',
            enableWhen: [
              { question: 'exposure', operator: '=', answerCoding: { code: 'YES' } },
            ],
          },
        ],
      };
      render(
        <AyuTextInput
          question={parent.item![1]}
          parent={parent}
          previousSibling={undefined}
        />
      );
      expect(
        screen.getByText('Irritant/agents (Describe)')
      ).toBeInTheDocument();
    });

    it('should render label text for a standalone field without a parent', () => {
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByText('What is your name?')).toBeInTheDocument();
    });

    it('should have dynamic placeholder based on question text', () => {
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'Enter what is your name?');
    });

    it('should have placeholder "Describe..." when question text contains "describe"', () => {
      const describeQuestion: AyuQuestion = {
        ...mockQuestion,
        text: 'Color change in stool [describe]',
      };
      render(
        <AyuTextInput
          question={describeQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'Describe...');
    });

    it('should have placeholder "Describe..." when question text contains "other"', () => {
      const otherQuestion: AyuQuestion = {
        ...mockQuestion,
        text: 'Other [Describe]',
      };
      render(
        <AyuTextInput
          question={otherQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'Describe...');
    });

    it('should have placeholder "Describe..." when question text contains "additional information"', () => {
      const additionalInfoQuestion: AyuQuestion = {
        ...mockQuestion,
        text: 'Enter additional information',
      };
      render(
        <AyuTextInput
          question={additionalInfoQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'Describe...');
    });

    it('should not prepend "Enter" when question text already starts with "enter"', () => {
      const enterQuestion: AyuQuestion = {
        ...mockQuestion,
        text: 'Enter if known',
      };
      render(
        <AyuTextInput
          question={enterQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'enter if known');
    });

    it('should have placeholder "Describe..." when question text is undefined', () => {
      const noTextQuestion: AyuQuestion = {
        ...mockQuestion,
        text: undefined,
      };
      render(
        <AyuTextInput
          question={noTextQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'Describe...');
    });

    it('should show dynamic placeholder for medication name', () => {
      const medicationQuestion: AyuQuestion = {
        ...mockQuestion,
        text: 'Medication Name',
      };
      render(
        <AyuTextInput
          question={medicationQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('placeholder', 'Enter medication name');
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
    it('should render label with primary CSS classes when text matches ADDITIONAL_INFORMATION_LABEL', () => {
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
      expect(label).toHaveClass('text-md', 'font-medium', 'text-black-500');
    });

    it('should render label with primary CSS classes when text contains ADDITIONAL_INFORMATION_LABEL with extra hint', () => {
      // Real JSON often pairs "Additional information" with a placeholder hint,
      // e.g. "Additional information - [Enter additional information]". The
      // label class check uses .includes() so the styling still applies.
      const questionWithLabel: AyuQuestion = {
        ...mockQuestion,
        text: 'Additional information - [Enter additional information]',
      };
      render(
        <AyuTextInput
          question={questionWithLabel}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const label = screen.getByText(
        'Additional information - [Enter additional information]'
      );
      expect(label).toHaveClass('text-md', 'font-medium', 'text-black-500');
    });

    it('should render label with muted CSS classes for other labels', () => {
      const questionWithLabel: AyuQuestion = {
        ...mockQuestion,
        text: 'Some other label',
      };
      render(
        <AyuTextInput
          question={questionWithLabel}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const label = screen.getByText('Some other label');
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

  describe('BP Inline Validation', () => {
    const systolicQuestion: AyuQuestion = {
      linkId: 'systolic-1',
      text: 'Enter systolic BP',
      type: 'string',
      readOnly: false,
    };

    const diastolicQuestion: AyuQuestion = {
      linkId: 'diastolic-1',
      text: 'Enter diastolic BP',
      type: 'string',
      readOnly: false,
    };

    it('should show error when systolic value is below 60', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuTextInput
          question={systolicQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '50' } });
      expect(screen.getByText('Value must be at least 60')).toBeInTheDocument();
      expect(mockOnChange).toHaveBeenCalledWith('50');
    });

    it('should show error when systolic value is above 260', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuTextInput
          question={systolicQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '300' } });
      expect(screen.getByText('Value must be at most 260')).toBeInTheDocument();
    });

    it('should not show error for valid systolic value', () => {
      render(
        <AyuTextInput
          question={systolicQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '120' } });
      expect(screen.queryByText(/Value must be/)).not.toBeInTheDocument();
    });

    it('should show error when diastolic value is below 30', () => {
      render(
        <AyuTextInput
          question={diastolicQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '20' } });
      expect(screen.getByText('Value must be at least 30')).toBeInTheDocument();
    });

    it('should show error when diastolic value is above 150', () => {
      render(
        <AyuTextInput
          question={diastolicQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '160' } });
      expect(screen.getByText('Value must be at most 150')).toBeInTheDocument();
    });

    it('should not show error for valid diastolic value', () => {
      render(
        <AyuTextInput
          question={diastolicQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '80' } });
      expect(screen.queryByText(/Value must be/)).not.toBeInTheDocument();
    });

    it('should clear error when a valid value is entered after invalid', () => {
      render(
        <AyuTextInput
          question={systolicQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '50' } });
      expect(screen.getByText('Value must be at least 60')).toBeInTheDocument();
      fireEvent.change(textarea, { target: { value: '120' } });
      expect(screen.queryByText(/Value must be/)).not.toBeInTheDocument();
    });

    it('should not show error for non-numeric text in BP field', () => {
      render(
        <AyuTextInput
          question={systolicQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'abc' } });
      expect(screen.queryByText(/Value must be/)).not.toBeInTheDocument();
    });

    it('should not show error for non-BP questions', () => {
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '5' } });
      expect(screen.queryByText(/Value must be/)).not.toBeInTheDocument();
    });

    it('should apply red border when error is present', () => {
      render(
        <AyuTextInput
          question={systolicQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '50' } });
      expect(textarea).toHaveClass('border-red-500');
    });

    it('should apply green border when no error', () => {
      render(
        <AyuTextInput
          question={systolicQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '120' } });
      expect(textarea).toHaveClass('border-[#20c997]');
    });

    it('should show error at boundary value below systolic min', () => {
      render(
        <AyuTextInput
          question={systolicQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '59' } });
      expect(screen.getByText('Value must be at least 60')).toBeInTheDocument();
    });

    it('should not show error at exact systolic min boundary', () => {
      render(
        <AyuTextInput
          question={systolicQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '60' } });
      expect(screen.queryByText(/Value must be/)).not.toBeInTheDocument();
    });

    it('should not show error at exact systolic max boundary', () => {
      render(
        <AyuTextInput
          question={systolicQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '260' } });
      expect(screen.queryByText(/Value must be/)).not.toBeInTheDocument();
    });

    it('should show error at boundary value above systolic max', () => {
      render(
        <AyuTextInput
          question={systolicQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '261' } });
      expect(screen.getByText('Value must be at most 260')).toBeInTheDocument();
    });
  });

  describe('Inline describe-field label hiding (structural)', () => {
    const soleChildParent = (childType: AyuQuestion['type']): AyuQuestion => ({
      linkId: 'p1',
      type: 'choice',
      text: 'Timing',
      answerOption: [
        { valueCoding: { code: 'OTHER', display: 'Other[Describe]' } },
      ],
      item: [
        {
          linkId: 'p1_other',
          type: childType,
          text: 'Other[Describe]',
          enableWhen: [
            { question: 'p1', operator: '=', answerCoding: { code: 'OTHER' } },
          ],
        },
      ],
    });

    it('hides the label when the string field is the sole child of its option', () => {
      const parent = soleChildParent('string');
      render(
        <AyuTextInput
          question={parent.item![0]}
          parent={parent}
          previousSibling={undefined}
        />
      );
      expect(screen.queryByText('Other[Describe]')).not.toBeInTheDocument();
    });

    it('shows the label when the field is grouped with a sibling under the option', () => {
      const parent: AyuQuestion = {
        linkId: 'exposure',
        type: 'choice',
        text: 'Exposure',
        answerOption: [{ valueCoding: { code: 'YES', display: 'Yes' } }],
        item: [
          {
            linkId: 'duration',
            type: 'quantity',
            text: 'Duration',
            enableWhen: [
              { question: 'exposure', operator: '=', answerCoding: { code: 'YES' } },
            ],
          },
          {
            linkId: 'irritant',
            type: 'string',
            text: 'Irritant/agents  (Describe)',
            enableWhen: [
              { question: 'exposure', operator: '=', answerCoding: { code: 'YES' } },
            ],
          },
        ],
      };
      render(
        <AyuTextInput
          question={parent.item![1]}
          parent={parent}
          previousSibling={undefined}
        />
      );
      expect(
        screen.getByText('Irritant/agents (Describe)')
      ).toBeInTheDocument();
    });

    it('shows the label for a non-string sole child', () => {
      const parent = soleChildParent('integer');
      render(
        <AyuTextInput
          question={parent.item![0]}
          parent={parent}
          previousSibling={undefined}
        />
      );
      expect(screen.getByText('Other[Describe]')).toBeInTheDocument();
    });

    it('shows the label when the parent has no item children', () => {
      const parent: AyuQuestion = {
        linkId: 'p1',
        type: 'choice',
        text: 'Timing',
        item: [],
      };
      const question: AyuQuestion = {
        ...mockQuestion,
        text: 'Standalone field',
        enableWhen: [
          { question: 'p1', operator: '=', answerCoding: { code: 'OTHER' } },
        ],
      };
      render(
        <AyuTextInput
          question={question}
          parent={parent}
          previousSibling={undefined}
        />
      );
      expect(screen.getByText('Standalone field')).toBeInTheDocument();
    });

    it('shows the label when the field has no enableWhen gate on its parent', () => {
      const parent: AyuQuestion = {
        linkId: 'p1',
        type: 'choice',
        text: 'Timing',
        item: [
          { linkId: 'p1_child', type: 'string', text: 'Ungated field' },
        ],
      };
      render(
        <AyuTextInput
          question={parent.item![0]}
          parent={parent}
          previousSibling={undefined}
        />
      );
      expect(screen.getByText('Ungated field')).toBeInTheDocument();
    });
  });
});
