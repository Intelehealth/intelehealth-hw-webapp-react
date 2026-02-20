import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AyuDuration } from '../../../../../modules/ayu/components/common/ayu-duration.component';

// Mock the dependencies
import { resolveLabel } from '../../../../../modules/ayu-library/utils/fhir-to-ayu.util';
vi.mock('../../../../../modules/ayu-library/utils/fhir-to-ayu.util', () => ({
  resolveLabel: vi.fn((question) => question?.text || null),
}));

vi.mock('../../../../../modules/ayu/components/common/ayu-dropdown.component', () => ({
  AyuDropdown: vi.fn(({ options, value, onChange, placeholder, className }) => (
    <select
      data-testid={`dropdown-${placeholder?.toLowerCase()?.replace(/\s+/g, '-')}`}
      value={value || ''}
      onChange={(e) => onChange?.(e.target.value)}
      className={className}
    >
      <option value="">{placeholder}</option>
      {options?.map((opt: any) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )),
}));

vi.mock('../../../../../modules/ayu/utils/constants', () => ({
  DURATION_DROPDOWN_CONFIGS: [
    {
      id: 'number',
      placeholder: 'Number',
      options: Array.from({ length: 10 }, (_, i) => ({
        label: String(i + 1),
        value: i + 1,
      })),
    },
    {
      id: 'days',
      placeholder: 'Duration Type',
      options: [
        { label: 'Hours', value: 'hours' },
        { label: 'Days', value: 'days' },
        { label: 'Weeks', value: 'weeks' },
      ],
    },
  ],
}));

describe('AyuDuration', () => {
  const mockQuestion = {
    linkId: 'duration-1',
    text: 'How long?',
    type: 'quantity',
  };

  describe('Rendering', () => {
    it('should render label from resolveLabel', () => {
      render(<AyuDuration question={mockQuestion} />);

      expect(screen.getByText('How long?')).toBeInTheDocument();
    });

    it('should render two dropdowns (number and duration type)', () => {
      render(<AyuDuration question={mockQuestion} />);

      expect(screen.getByTestId('dropdown-number')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-duration-type')).toBeInTheDocument();
    });

    it('should render without label when label is null', () => {
      const questionWithoutText = { linkId: 'duration-1', type: 'quantity' };
      render(<AyuDuration question={questionWithoutText} />);

      const labels = screen.queryAllByRole('textbox');
      expect(labels).toHaveLength(0);
    });

    it('should use DURATION_DROPDOWN_CONFIGS', () => {
      render(<AyuDuration question={mockQuestion} />);

      // Should have options from the config
      expect(screen.getByText('Number')).toBeInTheDocument();
      expect(screen.getByText('Duration Type')).toBeInTheDocument();
    });
  });

  describe('Value Handling (Nested Structure)', () => {
    it('should parse value.dropdownValues correctly', () => {
      const value = {
        dropdownValues: {
          number: 5,
          days: 'days',
        },
      };

      render(<AyuDuration question={mockQuestion} value={value} />);

      const numberDropdown = screen.getByTestId('dropdown-number') as HTMLSelectElement;
      const durationDropdown = screen.getByTestId('dropdown-duration-type') as HTMLSelectElement;

      expect(numberDropdown.value).toBe('5');
      expect(durationDropdown.value).toBe('days');
    });

    it('should handle undefined value', () => {
      render(<AyuDuration question={mockQuestion} value={undefined} />);

      const numberDropdown = screen.getByTestId('dropdown-number') as HTMLSelectElement;
      const durationDropdown = screen.getByTestId('dropdown-duration-type') as HTMLSelectElement;

      expect(numberDropdown.value).toBe('');
      expect(durationDropdown.value).toBe('');
    });

    it('should handle null value', () => {
      render(<AyuDuration question={mockQuestion} value={null} />);

      const numberDropdown = screen.getByTestId('dropdown-number') as HTMLSelectElement;
      const durationDropdown = screen.getByTestId('dropdown-duration-type') as HTMLSelectElement;

      expect(numberDropdown.value).toBe('');
      expect(durationDropdown.value).toBe('');
    });

    it('should handle empty dropdownValues object', () => {
      const value = { dropdownValues: {} };
      render(<AyuDuration question={mockQuestion} value={value} />);

      const numberDropdown = screen.getByTestId('dropdown-number') as HTMLSelectElement;
      const durationDropdown = screen.getByTestId('dropdown-duration-type') as HTMLSelectElement;

      expect(numberDropdown.value).toBe('');
      expect(durationDropdown.value).toBe('');
    });

    it('should pass correct value to each dropdown', () => {
      const value = {
        dropdownValues: {
          number: 10,
          days: 'weeks',
        },
      };

      render(<AyuDuration question={mockQuestion} value={value} />);

      const numberDropdown = screen.getByTestId('dropdown-number') as HTMLSelectElement;
      const durationDropdown = screen.getByTestId('dropdown-duration-type') as HTMLSelectElement;

      expect(numberDropdown.value).toBe('10');
      expect(durationDropdown.value).toBe('weeks');
    });
  });

  describe('onChange Callback', () => {
    it('should call onChange with dropdownValues structure when number changes', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<AyuDuration question={mockQuestion} onChange={onChange} />);

      const numberDropdown = screen.getByTestId('dropdown-number');
      await user.selectOptions(numberDropdown, '3');

      expect(onChange).toHaveBeenCalledWith({
        dropdownValues: {
          number: '3',
        },
      });
    });

    it('should call onChange with dropdownValues structure when duration type changes', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<AyuDuration question={mockQuestion} onChange={onChange} />);

      const durationDropdown = screen.getByTestId('dropdown-duration-type');
      await user.selectOptions(durationDropdown, 'hours');

      expect(onChange).toHaveBeenCalledWith({
        dropdownValues: {
          days: 'hours',
        },
      });
    });

    it('should preserve other dropdown values when one changes', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const initialValue = {
        dropdownValues: {
          number: 5,
          days: 'days',
        },
      };

      render(
        <AyuDuration
          question={mockQuestion}
          value={initialValue}
          onChange={onChange}
        />
      );

      const numberDropdown = screen.getByTestId('dropdown-number');
      await user.selectOptions(numberDropdown, '8');

      expect(onChange).toHaveBeenCalledWith({
        dropdownValues: {
          number: '8',
          days: 'days',
        },
      });
    });

    it('should handle onChange with both dropdowns changed', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      const { rerender } = render(
        <AyuDuration question={mockQuestion} onChange={onChange} />
      );

      // Change number
      const numberDropdown = screen.getByTestId('dropdown-number');
      await user.selectOptions(numberDropdown, '7');

      expect(onChange).toHaveBeenLastCalledWith({
        dropdownValues: {
          number: '7',
        },
      });

      // Rerender with new value
      rerender(
        <AyuDuration
          question={mockQuestion}
          value={{ dropdownValues: { number: 7 } }}
          onChange={onChange}
        />
      );

      // Change duration type
      const durationDropdown = screen.getByTestId('dropdown-duration-type');
      await user.selectOptions(durationDropdown, 'weeks');

      expect(onChange).toHaveBeenLastCalledWith({
        dropdownValues: {
          number: 7,
          days: 'weeks',
        },
      });
    });

    it('should handle onChange with undefined', async () => {
      const user = userEvent.setup();
      render(<AyuDuration question={mockQuestion} onChange={undefined} />);

      // Should not throw error when onChange is not provided
      const numberDropdown = screen.getByTestId('dropdown-number');
      expect(numberDropdown).toBeInTheDocument();

      // Should not throw error when dropdown value changes without onChange
      await expect(user.selectOptions(numberDropdown, '5')).resolves.not.toThrow();
    });
  });

  describe('Props Handling', () => {
    it('should handle parent and previousSibling in resolveLabel', () => {
      const parent = { linkId: 'parent', text: 'Parent Question', type: 'group' as const };
      const previousSibling = { linkId: 'sibling', text: 'Previous Question', type: 'quantity' as const };

      render(
        <AyuDuration
          question={mockQuestion}
          parent={parent}
          previousSibling={previousSibling}
        />
      );

      // resolveLabel should have been called with all three parameters
      expect(resolveLabel).toHaveBeenCalledWith(mockQuestion, parent, previousSibling);
      expect(screen.getByText('How long?')).toBeInTheDocument();
    });

    it('should pass question to resolveLabel', () => {
      render(<AyuDuration question={mockQuestion} />);

      // Verify resolveLabel was called with just the question (parent and previousSibling are undefined)
      expect(resolveLabel).toHaveBeenCalledWith(mockQuestion, undefined, undefined);
      expect(screen.getByText('How long?')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined question gracefully', () => {
      render(<AyuDuration question={undefined} />);

      // Should render without crashing and without label
      expect(screen.queryByText('How long?')).not.toBeInTheDocument();
      expect(screen.getByTestId('dropdown-number')).toBeInTheDocument();
    });

    it('should handle DURATION_DROPDOWN_CONFIGS undefined', () => {
      vi.doMock('../../../../../modules/ayu/utils/constants', () => ({
        DURATION_DROPDOWN_CONFIGS: undefined,
      }));

      render(<AyuDuration question={mockQuestion} />);

      // Should render label but no dropdowns
      expect(screen.getByText('How long?')).toBeInTheDocument();
    });

    it('should handle empty DURATION_DROPDOWN_CONFIGS array', () => {
      vi.doMock('../../../../../modules/ayu/utils/constants', () => ({
        DURATION_DROPDOWN_CONFIGS: [],
      }));

      render(<AyuDuration question={mockQuestion} />);

      // Should render label but no dropdowns
      expect(screen.getByText('How long?')).toBeInTheDocument();
    });

    it('should handle partial dropdownValues (only number)', () => {
      const value = {
        dropdownValues: {
          number: 3,
        },
      };

      render(<AyuDuration question={mockQuestion} value={value} />);

      const numberDropdown = screen.getByTestId('dropdown-number') as HTMLSelectElement;
      const durationDropdown = screen.getByTestId('dropdown-duration-type') as HTMLSelectElement;

      expect(numberDropdown.value).toBe('3');
      expect(durationDropdown.value).toBe('');
    });

    it('should handle partial dropdownValues (only days)', () => {
      const value = {
        dropdownValues: {
          days: 'weeks',
        },
      };

      render(<AyuDuration question={mockQuestion} value={value} />);

      const numberDropdown = screen.getByTestId('dropdown-number') as HTMLSelectElement;
      const durationDropdown = screen.getByTestId('dropdown-duration-type') as HTMLSelectElement;

      expect(numberDropdown.value).toBe('');
      expect(durationDropdown.value).toBe('weeks');
    });

    it('should handle value that is not an object', () => {
      const invalidValue: any = "invalid";
      render(<AyuDuration question={mockQuestion} value={invalidValue} />);

      const numberDropdown = screen.getByTestId('dropdown-number') as HTMLSelectElement;
      const durationDropdown = screen.getByTestId('dropdown-duration-type') as HTMLSelectElement;

      expect(numberDropdown.value).toBe('');
      expect(durationDropdown.value).toBe('');
    });

    it('should handle numeric values in dropdownValues', () => {
      const value = {
        dropdownValues: {
          number: 7,
          days: 'days',
        },
      };

      render(<AyuDuration question={mockQuestion} value={value} />);

      const numberDropdown = screen.getByTestId('dropdown-number') as HTMLSelectElement;
      expect(numberDropdown.value).toBe('7');
    });
  });

  describe('Layout and Styling', () => {
    it('should render dropdowns in a flex container with gap', () => {
      const { container } = render(<AyuDuration question={mockQuestion} />);

      const flexContainer = container.querySelector('.flex.gap-3');
      expect(flexContainer).toBeInTheDocument();
    });

    it('should apply flex-1 class to each dropdown', () => {
      render(<AyuDuration question={mockQuestion} />);

      const numberDropdown = screen.getByTestId('dropdown-number');
      const durationDropdown = screen.getByTestId('dropdown-duration-type');

      expect(numberDropdown).toHaveClass('flex-1');
      expect(durationDropdown).toHaveClass('flex-1');
    });

    it('should have space-y-3 on container', () => {
      const { container } = render(<AyuDuration question={mockQuestion} />);

      const mainContainer = container.querySelector('.space-y-3');
      expect(mainContainer).toBeInTheDocument();
    });
  });
});
