import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  AyuDropdown,
  type DropdownOption,
} from '../../../../../modules/ayu/components/common/ayu-dropdown.component';

describe('AyuDropdown', () => {
  const mockOptions: DropdownOption[] = [
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
    { label: 'Option 3', value: 3 },
  ];

  describe('Rendering', () => {
    it('should render select element with options', () => {
      render(<AyuDropdown options={mockOptions} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();

      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });

    it('should render placeholder option when provided', () => {
      render(
        <AyuDropdown options={mockOptions} placeholder="Choose an option" />
      );

      expect(screen.getByText('Choose an option')).toBeInTheDocument();
      const placeholderOption = screen.getByRole('option', {
        name: 'Choose an option',
      }) as HTMLOptionElement;
      expect(placeholderOption.disabled).toBe(true);
    });

    it('should render with default placeholder "Select"', () => {
      render(<AyuDropdown options={mockOptions} />);

      expect(screen.getByText('Select')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <AyuDropdown options={mockOptions} className="custom-class" />
      );

      const wrapper = container.querySelector('.custom-class');
      expect(wrapper).toBeInTheDocument();
    });

    it('should render with correct id attribute', () => {
      render(<AyuDropdown options={mockOptions} id="test-dropdown" />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('id', 'test-dropdown');
    });

    it('should render SVG chevron icon', () => {
      const { container } = render(<AyuDropdown options={mockOptions} />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('w-4', 'h-4', 'text-gray-500');
    });
  });

  describe('User Interaction', () => {
    it('should call onChange with string value when option is selected', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<AyuDropdown options={mockOptions} onChange={onChange} />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'opt1');

      expect(onChange).toHaveBeenCalledWith('opt1');
    });

    it('should call onChange with number value when option is selected', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(<AyuDropdown options={mockOptions} onChange={onChange} />);

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '3');

      expect(onChange).toHaveBeenCalledWith('3');
    });

    it('should not call onChange when disabled', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <AyuDropdown options={mockOptions} onChange={onChange} disabled />
      );

      const select = screen.getByRole('combobox');

      // Trying to interact with disabled select
      try {
        await user.selectOptions(select, 'opt1');
      } catch {
        // Expected to fail or not trigger onChange
      }

      expect(onChange).not.toHaveBeenCalled();
    });

    it('should update value when controlled', () => {
      const { rerender } = render(
        <AyuDropdown options={mockOptions} value="opt1" />
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('opt1');

      rerender(<AyuDropdown options={mockOptions} value="opt2" />);
      expect(select.value).toBe('opt2');
    });
  });

  describe('Props Handling', () => {
    it('should handle disabled state', () => {
      render(<AyuDropdown options={mockOptions} disabled />);

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
    });

    it('should apply disabled styling classes', () => {
      render(<AyuDropdown options={mockOptions} disabled />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('disabled:bg-gray-100');
      expect(select).toHaveClass('disabled:cursor-not-allowed');
    });

    it('should apply maxVisibleOptions style', () => {
      render(<AyuDropdown options={mockOptions} maxVisibleOptions={5} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.style.maxHeight).toBe('12.5rem'); // 5 * 2.5rem
    });

    it('should not apply maxHeight style when maxVisibleOptions is 0', () => {
      render(<AyuDropdown options={mockOptions} maxVisibleOptions={0} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.style.maxHeight).toBe('');
    });

    it('should handle undefined onChange gracefully', async () => {
      const user = userEvent.setup();
      render(<AyuDropdown options={mockOptions} />);

      const select = screen.getByRole('combobox');
      // Trigger a change event when onChange is not provided — should not throw
      await user.selectOptions(select, 'opt1');
      expect(select).toBeInTheDocument();
    });

    it('should handle empty options array', () => {
      render(<AyuDropdown options={[]} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();

      // Only placeholder option should be present
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(1); // Just the placeholder
    });
  });

  describe('CSS Classes', () => {
    it('should have correct base styling classes', () => {
      render(<AyuDropdown options={mockOptions} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('w-full');
      expect(select).toHaveClass('bg-white');
      expect(select).toHaveClass('border');
      expect(select).toHaveClass('border-emerald-400');
      expect(select).toHaveClass('rounded-lg');
    });

    it('should have focus styling classes', () => {
      render(<AyuDropdown options={mockOptions} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('focus:outline-none');
      expect(select).toHaveClass('focus:ring-0');
      expect(select).toHaveClass('focus:border-emerald-500');
    });

    it('should have appearance-none class', () => {
      render(<AyuDropdown options={mockOptions} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('appearance-none');
    });
  });

  describe('Edge Cases', () => {
    it('should handle options with special characters', () => {
      const specialOptions: DropdownOption[] = [
        { label: 'Option & Special', value: 'opt1' },
        { label: 'Option < Greater', value: 'opt2' },
        { label: 'Option "Quote"', value: 'opt3' },
      ];

      render(<AyuDropdown options={specialOptions} />);

      expect(screen.getByText('Option & Special')).toBeInTheDocument();
      expect(screen.getByText('Option < Greater')).toBeInTheDocument();
      expect(screen.getByText('Option "Quote"')).toBeInTheDocument();
    });

    it('should handle numeric values correctly', () => {
      const numericOptions: DropdownOption[] = [
        { label: 'One', value: 1 },
        { label: 'Two', value: 2 },
        { label: 'Zero', value: 0 },
      ];

      render(<AyuDropdown options={numericOptions} value={0} />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('0');
    });

    it('should handle empty string value', () => {
      render(<AyuDropdown options={mockOptions} value="" />);

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('');
    });

    it('should render with no placeholder when placeholder is empty string', () => {
      render(<AyuDropdown options={mockOptions} placeholder="" />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();

      // Only regular options should be present (no placeholder)
      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(3);
    });

    it('should handle options with same labels but different values', () => {
      const duplicateLabelOptions: DropdownOption[] = [
        { label: 'Same Label', value: 'val1' },
        { label: 'Same Label', value: 'val2' },
      ];

      render(<AyuDropdown options={duplicateLabelOptions} />);

      const options = screen.getAllByText('Same Label');
      expect(options).toHaveLength(2);
    });
  });

  describe('Accessibility', () => {
    it('should be accessible via role', () => {
      render(<AyuDropdown options={mockOptions} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should have cursor-pointer class when enabled', () => {
      render(<AyuDropdown options={mockOptions} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('cursor-pointer');
    });

    it('should have proper option structure', () => {
      render(<AyuDropdown options={mockOptions} />);

      const option1 = screen.getByRole('option', {
        name: 'Option 1',
      }) as HTMLOptionElement;
      expect(option1.value).toBe('opt1');

      const option2 = screen.getByRole('option', {
        name: 'Option 2',
      }) as HTMLOptionElement;
      expect(option2.value).toBe('opt2');
    });
  });
});
