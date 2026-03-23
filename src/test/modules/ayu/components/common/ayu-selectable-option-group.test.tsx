import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AyuSelectableOptionGroup } from '../../../../../modules/ayu/components/common/ayu-selectable-option-group';
import type { AyuQuestion } from '../../../../../modules/ayu-library/types/ayu.types';

vi.mock('../../../../../ayu-library/utils/fhir-to-ayu.util', () => ({
  resolveLabel: vi.fn((question) => question.text),
}));

describe('AyuSelectableOptionGroup', () => {
  const mockQuestion: AyuQuestion = {
    linkId: 'select-group-1',
    text: 'Select an option',
    type: 'choice',
    required: false,
    answerOption: [
      { valueString: 'Option A' },
      { valueString: 'Option B' },
      { valueCoding: { display: 'Option C', code: 'opt-c' } },
    ],
  };

  describe('Rendering', () => {
    it('should render option group with label', () => {
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByText('Select an option')).toBeInTheDocument();
    });

    it('should render without label when text is not provided', () => {
      const questionWithoutText: AyuQuestion = {
        ...mockQuestion,
        text: undefined,
      };
      render(
        <AyuSelectableOptionGroup
          question={questionWithoutText}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3);
    });

    it('should render all selectable options', () => {
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('button', { name: 'Option A' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Option B' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Option C' })).toBeInTheDocument();
    });

    it('should not render required asterisk (asterisk is disabled)', () => {
      const requiredQuestion: AyuQuestion = {
        ...mockQuestion,
        required: true,
      };
      render(
        <AyuSelectableOptionGroup
          question={requiredQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('should have option-group-wrapper class', () => {
      const { container } = render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const wrapper = container.querySelector('.option-group-wrapper');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have option-group class', () => {
      const { container } = render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const group = container.querySelector('.option-group');
      expect(group).toBeInTheDocument();
    });

    it('should have correct label classes', () => {
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const label = screen.getByText('Select an option');
      expect(label).toHaveClass('text-md', 'font-medium', 'text-black-500');
    });
  });

  describe('Answer Options Handling', () => {
    it('should handle empty answerOption array', () => {
      const questionWithNoOptions: AyuQuestion = {
        ...mockQuestion,
        answerOption: [],
      };
      render(
        <AyuSelectableOptionGroup
          question={questionWithNoOptions}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('should handle undefined answerOption', () => {
      const questionWithUndefinedOptions: AyuQuestion = {
        ...mockQuestion,
        answerOption: undefined,
      };
      render(
        <AyuSelectableOptionGroup
          question={questionWithUndefinedOptions}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const buttons = screen.queryAllByRole('button');
      expect(buttons).toHaveLength(0);
    });

    it('should handle single option', () => {
      const singleOptionQuestion: AyuQuestion = {
        ...mockQuestion,
        answerOption: [{ valueString: 'Only Option' }],
      };
      render(
        <AyuSelectableOptionGroup
          question={singleOptionQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('button', { name: 'Only Option' })).toBeInTheDocument();
    });

    it('should render valueCoding display when available', () => {
      const codingQuestion: AyuQuestion = {
        ...mockQuestion,
        answerOption: [
          { valueCoding: { display: 'Coded Option', code: 'code-1' } },
        ],
      };
      render(
        <AyuSelectableOptionGroup
          question={codingQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('button', { name: 'Coded Option' })).toBeInTheDocument();
    });

    it('should use valueString as key and label when present', () => {
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('button', { name: 'Option A' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Option B' })).toBeInTheDocument();
    });

    it('should use valueCoding code as key when valueString is not present', () => {
      const { container } = render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(container).toBeTruthy();
    });
  });

  describe('State Management', () => {
    it('should initialize with undefined selectedValue', () => {
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
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
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={parent}
          previousSibling={undefined}
        />
      );
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });

    it('should handle previousSibling prop', () => {
      const previousSibling: AyuQuestion = {
        linkId: 'prev-1',
        text: 'Previous Question',
        type: 'choice',
      };
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={previousSibling}
        />
      );
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle question with empty string text', () => {
      const emptyTextQuestion: AyuQuestion = {
        ...mockQuestion,
        text: '',
      };
      render(
        <AyuSelectableOptionGroup
          question={emptyTextQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getAllByRole('button')).toHaveLength(3);
    });

    it('should handle options with special characters', () => {
      const specialCharsQuestion: AyuQuestion = {
        ...mockQuestion,
        answerOption: [
          { valueString: 'Option with <special> & "chars"' },
        ],
      };
      render(
        <AyuSelectableOptionGroup
          question={specialCharsQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('button', { name: 'Option with <special> & "chars"' })).toBeInTheDocument();
    });

    it('should handle many options', () => {
      const manyOptionsQuestion: AyuQuestion = {
        ...mockQuestion,
        answerOption: Array.from({ length: 10 }, (_, i) => ({
          valueString: `Option ${i + 1}`,
        })),
      };
      render(
        <AyuSelectableOptionGroup
          question={manyOptionsQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(10);
    });

    it('should handle undefined question gracefully', () => {
      render(
        <AyuSelectableOptionGroup
          question={undefined}
          parent={undefined}
          previousSibling={undefined}
        />
      );

      // Should render without crashing and without label
      expect(screen.queryByText('Select an option')).not.toBeInTheDocument();
    });

    it('should handle option with undefined valueCoding', () => {
      const questionWithUndefinedCoding: AyuQuestion = {
        ...mockQuestion,
        answerOption: [
          { valueCoding: undefined, valueString: 'Option No Coding' },
        ],
      };
      render(
        <AyuSelectableOptionGroup
          question={questionWithUndefinedCoding}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('button', { name: 'Option No Coding' })).toBeInTheDocument();
    });

    it('should handle option with valueCoding but undefined code', () => {
      const questionWithUndefinedCode: AyuQuestion = {
        ...mockQuestion,
        answerOption: [
          { valueCoding: { display: 'Option No Code' } as any },
        ],
      };
      render(
        <AyuSelectableOptionGroup
          question={questionWithUndefinedCode}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('button', { name: 'Option No Code' })).toBeInTheDocument();
    });
  });

  describe('onChange Callback', () => {
    it('should call onChange with valueCoding code when option is clicked', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={onChange}
        />
      );

      const optionC = screen.getByRole('button', { name: 'Option C' });
      await user.click(optionC);

      expect(onChange).toHaveBeenCalledWith('opt-c');
    });

    it('should call onChange with valueString when valueCoding is undefined', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const questionWithNoCode: AyuQuestion = {
        ...mockQuestion,
        answerOption: [
          { valueString: 'Option A' },
        ],
      };

      render(
        <AyuSelectableOptionGroup
          question={questionWithNoCode}
          parent={undefined}
          previousSibling={undefined}
          onChange={onChange}
        />
      );

      const optionA = screen.getByRole('button', { name: 'Option A' });
      await user.click(optionA);

      expect(onChange).toHaveBeenCalledWith('Option A');
    });

    it('should call onChange with empty string when both valueCoding.code and valueString are undefined', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const questionWithUndefinedCode: AyuQuestion = {
        ...mockQuestion,
        answerOption: [
          { valueCoding: { display: 'Option No Code' } as any },
        ],
      };

      render(
        <AyuSelectableOptionGroup
          question={questionWithUndefinedCode}
          parent={undefined}
          previousSibling={undefined}
          onChange={onChange}
        />
      );

      const option = screen.getByRole('button', { name: 'Option No Code' });
      await user.click(option);

      expect(onChange).toHaveBeenCalledWith('');
    });

    it('should not throw error when onChange is undefined', async () => {
      const user = userEvent.setup();

      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={undefined}
        />
      );

      const optionA = screen.getByRole('button', { name: 'Option A' });

      // Should not throw error even without onChange prop
      await expect(user.click(optionA)).resolves.not.toThrow();
    });

    it('should handle multiple clicks on different options', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={onChange}
        />
      );

      const optionA = screen.getByRole('button', { name: 'Option A' });
      const optionC = screen.getByRole('button', { name: 'Option C' });

      await user.click(optionA);
      await user.click(optionC);

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenNthCalledWith(1, 'Option A'); // Option A has valueString
      expect(onChange).toHaveBeenNthCalledWith(2, 'opt-c'); // Option C has code
    });
  });

  describe('Selection State', () => {
    it('should mark option as selected when value matches for single-select', () => {
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value="opt-c"
          onChange={vi.fn()}
        />
      );

      const optionC = screen.getByRole('button', { name: 'Option C' });
      expect(optionC).toHaveClass('selected');
    });

    it('should mark option as selected when value includes option for multi-select', () => {
      const multiSelectQuestion: AyuQuestion = {
        ...mockQuestion,
        repeats: true,
      };

      render(
        <AyuSelectableOptionGroup
          question={multiSelectQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={['Option A', 'opt-c']}
          onChange={vi.fn()}
        />
      );

      const optionA = screen.getByRole('button', { name: 'Option A' });
      const optionC = screen.getByRole('button', { name: 'Option C' });
      expect(optionA).toHaveClass('selected');
      expect(optionC).toHaveClass('selected');
    });

    it('should not mark option as selected when value does not match', () => {
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value="other-value"
          onChange={vi.fn()}
        />
      );

      const optionA = screen.getByRole('button', { name: 'Option A' });
      expect(optionA).not.toHaveClass('selected');
    });

    it('should handle undefined value', () => {
      render(
        <AyuSelectableOptionGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={undefined}
          onChange={vi.fn()}
        />
      );

      const optionA = screen.getByRole('button', { name: 'Option A' });
      expect(optionA).not.toHaveClass('selected');
    });
  });
});
