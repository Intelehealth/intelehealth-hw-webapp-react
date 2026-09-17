import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AyuQuestion } from '../../../../../modules/ayu-library/types/ayu.types';
import { AyuNumberInput } from '../../../../../modules/ayu/components/common/ayu-number-input.component';

describe('AyuNumberInput', () => {
  const mockQuestion: AyuQuestion = {
    linkId: 'num-1',
    text: 'Enter your age',
    type: 'integer',
    readOnly: false,
  };

  describe('Rendering', () => {
    it('should render number input', () => {
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('should render without crashing when text is not provided', () => {
      const questionWithoutText: AyuQuestion = {
        ...mockQuestion,
        text: undefined,
      };
      render(
        <AyuNumberInput
          question={questionWithoutText}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('should have correct input type', () => {
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should have min attribute defaulting to 0', () => {
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('min', '0');
    });

    it('should use minValue from FHIR extension', () => {
      const questionWithMinMax: AyuQuestion = {
        ...mockQuestion,
        extension: [
          {
            url: 'http://hl7.org/fhir/StructureDefinition/minValue',
            valueInteger: 1,
          },
          {
            url: 'http://hl7.org/fhir/StructureDefinition/maxValue',
            valueInteger: 50,
          },
        ],
      };
      render(
        <AyuNumberInput
          question={questionWithMinMax}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('min', '1');
      expect(input).toHaveAttribute('max', '50');
    });

    it('should render disabled input when readOnly is true', () => {
      const readOnlyQuestion: AyuQuestion = {
        ...mockQuestion,
        readOnly: true,
      };
      render(
        <AyuNumberInput
          question={readOnlyQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByRole('spinbutton');
      expect(input).toBeDisabled();
    });

    it('should render enabled input when readOnly is false', () => {
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByRole('spinbutton');
      expect(input).not.toBeDisabled();
    });
  });

  describe('CSS Classes', () => {
    it('should have correct base CSS classes', () => {
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveClass('border', 'bg-white', 'border-solid', 'border-[#20c997]', 'rounded', 'px-3', 'py-2', 'outline-none', 'resize-y');
    });

    it('should have outline-none styling', () => {
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveClass('outline-none');
    });

    it('should apply same base classes regardless of disabled state', () => {
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveClass('border', 'bg-white', 'border-solid', 'border-[#20c997]', 'rounded', 'px-3', 'py-2');
    });

    it('should render top-level label with primary CSS classes when no parent', () => {
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const label = screen.getByText('Enter your age');
      expect(label).toHaveClass('text-md', 'font-medium', 'text-black-500');
    });

    it('should render nested label with the standard question-label classes when parent is provided', () => {
      const parent: AyuQuestion = {
        linkId: 'parent-1',
        text: 'Parent Question',
        type: 'choice',
      };
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={parent}
          previousSibling={undefined}
        />
      );
      const label = screen.getByText('Enter your age');
      expect(label).toHaveClass(
        'block',
        'text-large-label',
        'text-(--color-dark)'
      );
    });
  });

  describe('Input ID', () => {
    it('should set correct id on the input element', () => {
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('id', 'ayu-number-num-1');
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
        <AyuNumberInput
          question={mockQuestion}
          parent={parent}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('should handle previousSibling prop', () => {
      const previousSibling: AyuQuestion = {
        linkId: 'prev-1',
        text: 'Previous Question',
        type: 'integer',
      };
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={previousSibling}
        />
      );
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle question with empty string text', () => {
      const emptyTextQuestion: AyuQuestion = {
        ...mockQuestion,
        text: '',
      };
      render(
        <AyuNumberInput
          question={emptyTextQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('should handle undefined readOnly', () => {
      const questionWithoutReadOnly: AyuQuestion = {
        linkId: 'num-1',
        text: 'Question',
        type: 'integer',
      };
      render(
        <AyuNumberInput
          question={questionWithoutReadOnly}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByRole('spinbutton');
      expect(input).not.toBeDisabled();
    });

    it('should handle undefined question gracefully', () => {
      render(
        <AyuNumberInput
          question={undefined}
          parent={undefined}
          previousSibling={undefined}
        />
      );

      // Should render without crashing and without label
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });
  });

  describe('Container Layout', () => {
    it('should render with flex container classes', () => {
      const { container } = render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'flex-col', 'gap-1');
    });
  });

  describe('Different Number Types', () => {
    it('should handle integer type question', () => {
      const integerQuestion: AyuQuestion = {
        ...mockQuestion,
        type: 'integer',
      };
      render(
        <AyuNumberInput
          question={integerQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('should handle decimal type question', () => {
      const decimalQuestion: AyuQuestion = {
        ...mockQuestion,
        type: 'decimal',
      };
      render(
        <AyuNumberInput
          question={decimalQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });
  });

  describe('Wheel scroll behavior', () => {
    it('should blur the input on wheel so scrolling does not change the value', () => {
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      input.focus();
      expect(document.activeElement).toBe(input);

      fireEvent.wheel(input);
      expect(document.activeElement).not.toBe(input);
    });
  });

  describe('Focus-gated external value resync', () => {
    it('does NOT overwrite the typed text with the external value while focused', () => {
      // The regression this guards: an unconditional resync effect wiped
      // whatever the user was typing whenever a round-tripped `value` prop
      // didn't stringify back to the same text. Gating the resync on focus
      // means an external value change while the field is focused is
      // ignored until blur.
      const { rerender } = render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={5}
        />
      );
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '12' } });
      expect(input.value).toBe('12');

      // Parent re-renders with a stale/out-of-sync external value while the
      // field is still focused — must not clobber what the user typed.
      rerender(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={5}
        />
      );
      expect(input.value).toBe('12');
    });

    it('resyncs the displayed text from the external value once the field is blurred', () => {
      const { rerender } = render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={5}
        />
      );
      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '12' } });
      fireEvent.blur(input);

      // After blur, the effect resumes syncing from the external value.
      rerender(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={7}
        />
      );
      expect(input.value).toBe('7');
    });
  });

  describe('handleChange Function Coverage', () => {
    it('should call onChange with parsed integer value', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '42' } });

      expect(mockOnChange).toHaveBeenCalledWith(42);
    });

    it('should call onChange with parsed decimal value', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '3.14' } });

      expect(mockOnChange).toHaveBeenCalledWith(3.14);
    });

    it('should report the real parsed value and show error for out-of-range negative value', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '-15' } });

      // Out-of-range reports the real parsed number (not NaN) so
      // validateQuestion's numericOutOfRange check can still catch it with
      // the specific range message at Submit.
      expect(mockOnChange).toHaveBeenCalledWith(-15);
      expect(screen.getByText('Value must be at least 0')).toBeInTheDocument();
    });

    it('should return empty string when input value is empty', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={42}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      // Simulate clearing by setting to a non-numeric value that parseFloat can't parse
      fireEvent.change(input, { target: { value: null } });

      // When value is falsy, handleChange returns empty string
      // This tests the ternary logic: e.target.value ? parseFloat(...) : ''
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should call onChange with zero value', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '0' } });

      expect(mockOnChange).toHaveBeenCalledWith(0);
    });

    it('should call onChange with large number value', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '999999' } });

      expect(mockOnChange).toHaveBeenCalledWith(999999);
    });

    it('should call onChange with small decimal value', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '0.001' } });

      expect(mockOnChange).toHaveBeenCalledWith(0.001);
    });

    it('should not throw error when onChange is undefined', () => {
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );

      const input = screen.getByRole('spinbutton');

      // Should not throw error even without onChange prop
      expect(() => {
        fireEvent.change(input, { target: { value: '123' } });
      }).not.toThrow();
    });

    it('should handle multiple onChange calls', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '1' } });
      fireEvent.change(input, { target: { value: '12' } });
      fireEvent.change(input, { target: { value: '123' } });

      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 1);
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 12);
      expect(mockOnChange).toHaveBeenNthCalledWith(3, 123);
    });

    it('should report the real parsed value and show error for out-of-range negative decimal', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '-2.5' } });

      expect(mockOnChange).toHaveBeenCalledWith(-2.5);
      expect(screen.getByText('Value must be at least 0')).toBeInTheDocument();
    });

    it('should handle value prop correctly', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={50}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input.value).toBe('50');

      fireEvent.change(input, { target: { value: '75' } });
      expect(mockOnChange).toHaveBeenCalledWith(75);
    });

    it('should handle the empty string branch of ternary operator', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '999' } });
      expect(mockOnChange).toHaveBeenCalledWith(999);

      // Test the ternary: e.target.value ? parseFloat(e.target.value) : ''
      // When target.value is falsy (0, null, undefined, '', etc.), it returns ''
      mockOnChange.mockClear();
      fireEvent.change(input, { target: { value: '0' } });
      // Zero is a valid number, so it parses to 0
      expect(mockOnChange).toHaveBeenCalledWith(0);
    });

    it('should parse scientific notation correctly', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '1e3' } });

      expect(mockOnChange).toHaveBeenCalledWith(1000);
    });

    it('should report the real parsed value and show error when value exceeds FHIR maxValue', () => {
      const mockOnChange = vi.fn();
      const questionWithMax: AyuQuestion = {
        ...mockQuestion,
        extension: [
          {
            url: 'http://hl7.org/fhir/StructureDefinition/minValue',
            valueInteger: 0,
          },
          {
            url: 'http://hl7.org/fhir/StructureDefinition/maxValue',
            valueInteger: 50,
          },
        ],
      };
      render(
        <AyuNumberInput
          question={questionWithMax}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '75' } });

      expect(mockOnChange).toHaveBeenCalledWith(75);
      expect(screen.getByText('Value must be at most 50')).toBeInTheDocument();
    });

    it('should accept negative zero as valid (equals min default 0)', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '-0' } });

      expect(mockOnChange).toHaveBeenCalledWith(-0);
      expect(screen.queryByText(/Value must be/)).not.toBeInTheDocument();
    });

    it('should display empty string when value is null', () => {
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={null}
        />
      );

      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should display empty string when value is undefined', () => {
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={undefined}
        />
      );

      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should display string representation of numeric value', () => {
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={0}
        />
      );

      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input.value).toBe('0');
    });

    it('should display a numeric value that arrives as a string (restored/prefilled answer)', () => {
      // Regression: toDisplay previously only handled `typeof value === 'number'`,
      // so a numeric string value (e.g. from a restored answer set) rendered blank.
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={'120' as unknown as number}
        />
      );

      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input.value).toBe('120');
    });

    it('should display empty string when value prop is NaN', () => {
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={NaN}
        />
      );

      const input = screen.getByRole('spinbutton') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should show "Please enter a valid number" when non-numeric text is set', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );
      const input = screen.getByRole('spinbutton');
      // Temporarily change type to 'text' so jsdom does not sanitize non-numeric input
      input.setAttribute('type', 'text');
      fireEvent.change(input, { target: { value: 'abc' } });
      // Unparseable input reports undefined (same as "cleared"), not NaN —
      // the local error message alone carries the "invalid" distinction.
      expect(mockOnChange).toHaveBeenCalledWith(undefined);
      expect(screen.getByText('Please enter a valid number')).toBeInTheDocument();
    });

    it('should show required error when required field is cleared after being touched', () => {
      const requiredQ: AyuQuestion = { ...mockQuestion, required: true };
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={requiredQ}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );
      const input = screen.getByRole('spinbutton');
      // First type a valid value — sets touched=true
      fireEvent.change(input, { target: { value: '42' } });
      // Then clear the field — touched=true and required=true → REQUIRED_ERROR
      fireEvent.change(input, { target: { value: '' } });
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(mockOnChange).toHaveBeenLastCalledWith(undefined);
    });
  });

  describe('Range validation error messages', () => {
    const questionWithRange: AyuQuestion = {
      ...mockQuestion,
      extension: [
        {
          url: 'http://hl7.org/fhir/StructureDefinition/minValue',
          valueInteger: 60,
        },
        {
          url: 'http://hl7.org/fhir/StructureDefinition/maxValue',
          valueInteger: 260,
        },
      ],
    };

    it('should show error when value is below min', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={questionWithRange}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '50' } });

      expect(mockOnChange).toHaveBeenCalledWith(50);
      expect(screen.getByText('Value must be at least 60')).toBeInTheDocument();
    });

    it('should show error when value is above max', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={questionWithRange}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '300' } });

      expect(mockOnChange).toHaveBeenCalledWith(300);
      expect(screen.getByText('Value must be at most 260')).toBeInTheDocument();
    });

    it('should not show error when value is within range', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={questionWithRange}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '120' } });

      expect(mockOnChange).toHaveBeenCalledWith(120);
      expect(screen.queryByText(/Value must be/)).not.toBeInTheDocument();
    });

    it('should clear error when valid value is entered after invalid', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={questionWithRange}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '10' } });
      expect(screen.getByText('Value must be at least 60')).toBeInTheDocument();

      fireEvent.change(input, { target: { value: '120' } });
      expect(screen.queryByText(/Value must be/)).not.toBeInTheDocument();
    });

    it('should clear error when input is cleared', () => {
      const mockOnChange = vi.fn();
      const { rerender } = render(
        <AyuNumberInput
          question={questionWithRange}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '10' } });
      expect(screen.getByText('Value must be at least 60')).toBeInTheDocument();

      // Re-render with the out-of-range value so the controlled input reflects it
      rerender(
        <AyuNumberInput
          question={questionWithRange}
          parent={undefined}
          previousSibling={undefined}
          value={10}
          onChange={mockOnChange}
        />
      );

      fireEvent.change(input, { target: { value: '' } });
      expect(screen.queryByText(/Value must be/)).not.toBeInTheDocument();
    });

    it('should apply red border class when error is present', () => {
      render(
        <AyuNumberInput
          question={questionWithRange}
          parent={undefined}
          previousSibling={undefined}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '10' } });

      expect(input).toHaveClass('border-red-500');
      expect(input).not.toHaveClass('border-[#20c997]');
    });

    it('should apply green border class when no error', () => {
      render(
        <AyuNumberInput
          question={questionWithRange}
          parent={undefined}
          previousSibling={undefined}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '120' } });

      expect(input).toHaveClass('border-[#20c997]');
      expect(input).not.toHaveClass('border-red-500');
    });

    it('should accept boundary values without error', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={questionWithRange}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );

      const input = screen.getByRole('spinbutton');

      fireEvent.change(input, { target: { value: '60' } });
      expect(screen.queryByText(/Value must be/)).not.toBeInTheDocument();

      fireEvent.change(input, { target: { value: '260' } });
      expect(screen.queryByText(/Value must be/)).not.toBeInTheDocument();
    });
  });

  describe('BP text-based fallback validation', () => {
    const systolicQuestion: AyuQuestion = {
      linkId: 'systolic',
      text: 'Enter systolic BP',
      type: 'integer',
    };
    const diastolicQuestion: AyuQuestion = {
      linkId: 'diastolic',
      text: 'Enter diastolic BP',
      type: 'integer',
    };

    it('should show error for systolic value below 60', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={systolicQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );
      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '50' } });
      expect(screen.getByText('Value must be at least 60')).toBeInTheDocument();
      expect(mockOnChange).toHaveBeenCalledWith(50);
    });

    it('should show error for systolic value above 260', () => {
      const mockOnChange = vi.fn();
      render(
        <AyuNumberInput
          question={systolicQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={mockOnChange}
        />
      );
      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '300' } });
      expect(screen.getByText('Value must be at most 260')).toBeInTheDocument();
    });

    it('should show error for diastolic value below 30', () => {
      render(
        <AyuNumberInput
          question={diastolicQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '20' } });
      expect(screen.getByText('Value must be at least 30')).toBeInTheDocument();
    });

    it('should show error for diastolic value above 150', () => {
      render(
        <AyuNumberInput
          question={diastolicQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '160' } });
      expect(screen.getByText('Value must be at most 150')).toBeInTheDocument();
    });

    it('should not show error for valid systolic value', () => {
      render(
        <AyuNumberInput
          question={systolicQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '120' } });
      expect(screen.queryByText(/Value must be/)).not.toBeInTheDocument();
    });

    it('should not show error for valid diastolic value', () => {
      render(
        <AyuNumberInput
          question={diastolicQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '80' } });
      expect(screen.queryByText(/Value must be/)).not.toBeInTheDocument();
    });

    it('should prefer FHIR extensions over BP fallback', () => {
      const questionWithExtensions: AyuQuestion = {
        ...systolicQuestion,
        extension: [
          {
            url: 'http://hl7.org/fhir/StructureDefinition/minValue',
            valueInteger: 10,
          },
          {
            url: 'http://hl7.org/fhir/StructureDefinition/maxValue',
            valueInteger: 100,
          },
        ],
      };
      render(
        <AyuNumberInput
          question={questionWithExtensions}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      // Value 50 is valid for extension range (10-100), even though it's below BP systolic min (60)
      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '50' } });
      expect(screen.queryByText(/Value must be/)).not.toBeInTheDocument();
    });
  });

  describe('handleBlur (synchronous required check)', () => {
    const requiredQuestion: AyuQuestion = {
      linkId: 'blur-test',
      text: 'Required field',
      type: 'integer',
      required: true,
      readOnly: false,
    };

    it('should show required error synchronously on blur when required field is empty', () => {
      render(
        <AyuNumberInput
          question={requiredQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={undefined}
        />
      );
      const input = screen.getByRole('spinbutton');
      fireEvent.blur(input);
      // No timer to advance — the check runs immediately on blur.
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should NOT show required error on blur when field is optional and empty', () => {
      const optionalQuestion: AyuQuestion = {
        ...requiredQuestion,
        required: false,
      };
      render(
        <AyuNumberInput
          question={optionalQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={undefined}
        />
      );
      const input = screen.getByRole('spinbutton');
      fireEvent.blur(input);
      expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
    });

    it('should show required error on blur when value prop is empty string', () => {
      render(
        <AyuNumberInput
          question={requiredQuestion}
          parent={undefined}
          previousSibling={undefined}
          value=""
        />
      );
      const input = screen.getByRole('spinbutton');
      fireEvent.blur(input);
      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should NOT show a stale required error when the field was filled just before blur (ASYNC-004 regression)', () => {
      // Regression for the stale-closure bug: handleBlur used to read the
      // `value` prop, which hasn't been updated yet by the parent when blur
      // fires in the same tick as the last keystroke. Checking displayValue
      // (local, always current) instead means a filled field never shows a
      // spurious required error on blur, with no need for a delay/timer.
      render(
        <AyuNumberInput
          question={requiredQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={undefined}
        />
      );
      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '42' } });
      // Parent hasn't re-rendered with a new `value` prop yet — still undefined.
      fireEvent.blur(input);
      expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
    });

    it('should NOT show required error on blur when field has a value', () => {
      render(
        <AyuNumberInput
          question={requiredQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={42}
        />
      );
      const input = screen.getByRole('spinbutton');
      fireEvent.blur(input);
      expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
    });
  });
});
