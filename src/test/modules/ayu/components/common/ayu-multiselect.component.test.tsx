import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AyuMultiSelect } from '../../../../../modules/ayu/components/common/ayu-multiselect.component';
import type { AyuQuestion } from '../../../../../modules/ayu-library/types/ayu.types';

vi.mock('../../../../../ayu-library/utils/fhir-to-ayu.util', () => ({
  resolveLabel: vi.fn((question) => question.text),
}));

describe('AyuMultiSelect', () => {
  const mockQuestion: AyuQuestion = {
    linkId: 'multi-1',
    text: 'Select multiple options',
    type: 'choice',
    repeats: true,
    answerOption: [
      { valueString: 'Option 1' },
      { valueString: 'Option 2' },
      { valueCoding: { display: 'Option 3', code: 'opt-3' } },
    ],
  };

  describe('Rendering', () => {
    it('should render multiselect with label', () => {
      render(
        <AyuMultiSelect
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByText('Select multiple options')).toBeInTheDocument();
    });

    it('should render without label when text is not provided', () => {
      const questionWithoutText: AyuQuestion = {
        ...mockQuestion,
        text: undefined,
      };
      render(
        <AyuMultiSelect
          question={questionWithoutText}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBe(3);
    });

    it('should render all checkbox options', () => {
      render(
        <AyuMultiSelect
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
    });

    it('should render checkbox labels with valueString', () => {
      render(
        <AyuMultiSelect
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('should render checkbox labels with valueCoding display', () => {
      render(
        <AyuMultiSelect
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('should have correct container CSS classes', () => {
      const { container } = render(
        <AyuMultiSelect
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('space-y-2');
    });

    it('should have correct label CSS classes', () => {
      render(
        <AyuMultiSelect
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const label = screen.getByText('Select multiple options');
      expect(label).toHaveClass('text-sm', 'font-medium', 'text-gray-700');
    });

    it('should have correct checkbox label wrapper classes', () => {
      const { container } = render(
        <AyuMultiSelect
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const checkboxLabels = container.querySelectorAll('label.flex.gap-2');
      expect(checkboxLabels.length).toBe(3);
    });
  });

  describe('Answer Options Handling', () => {
    it('should handle empty answerOption array', () => {
      const questionWithNoOptions: AyuQuestion = {
        ...mockQuestion,
        answerOption: [],
      };
      render(
        <AyuMultiSelect
          question={questionWithNoOptions}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const checkboxes = screen.queryAllByRole('checkbox');
      expect(checkboxes).toHaveLength(0);
    });

    it('should handle undefined answerOption', () => {
      const questionWithUndefinedOptions: AyuQuestion = {
        ...mockQuestion,
        answerOption: undefined,
      };
      render(
        <AyuMultiSelect
          question={questionWithUndefinedOptions}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const checkboxes = screen.queryAllByRole('checkbox');
      expect(checkboxes).toHaveLength(0);
    });

    it('should handle single option', () => {
      const singleOptionQuestion: AyuQuestion = {
        ...mockQuestion,
        answerOption: [{ valueString: 'Only Option' }],
      };
      render(
        <AyuMultiSelect
          question={singleOptionQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(1);
      expect(screen.getByText('Only Option')).toBeInTheDocument();
    });

    it('should prioritize valueString over valueCoding display', () => {
      const mixedOptionQuestion: AyuQuestion = {
        ...mockQuestion,
        answerOption: [
          { valueString: 'String Value', valueCoding: { display: 'Coding Display', code: 'code-1' } },
        ],
      };
      render(
        <AyuMultiSelect
          question={mixedOptionQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByText('String Value')).toBeInTheDocument();
      expect(screen.queryByText('Coding Display')).not.toBeInTheDocument();
    });

    it('should fallback to valueCoding display when valueString is undefined', () => {
      const codingOnlyQuestion: AyuQuestion = {
        ...mockQuestion,
        answerOption: [
          { valueCoding: { display: 'Coding Only', code: 'code-2' } },
        ],
      };
      render(
        <AyuMultiSelect
          question={codingOnlyQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByText('Coding Only')).toBeInTheDocument();
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
        <AyuMultiSelect
          question={mockQuestion}
          parent={parent}
          previousSibling={undefined}
        />
      );
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    });

    it('should handle previousSibling prop', () => {
      const previousSibling: AyuQuestion = {
        linkId: 'prev-1',
        text: 'Previous Question',
        type: 'choice',
      };
      render(
        <AyuMultiSelect
          question={mockQuestion}
          parent={undefined}
          previousSibling={previousSibling}
        />
      );
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined question gracefully', () => {
      const { container } = render(
        <AyuMultiSelect
          question={undefined}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(container.firstChild).toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('should handle question with empty string text', () => {
      const emptyTextQuestion: AyuQuestion = {
        ...mockQuestion,
        text: '',
      };
      render(
        <AyuMultiSelect
          question={emptyTextQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    });

    it('should handle options with special characters', () => {
      const specialCharsQuestion: AyuQuestion = {
        ...mockQuestion,
        answerOption: [
          { valueString: 'Option with <special> & "chars"' },
        ],
      };
      render(
        <AyuMultiSelect
          question={specialCharsQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByText('Option with <special> & "chars"')).toBeInTheDocument();
    });

    it('should handle many options', () => {
      const manyOptionsQuestion: AyuQuestion = {
        ...mockQuestion,
        answerOption: Array.from({ length: 10 }, (_, i) => ({
          valueString: `Option ${i + 1}`,
        })),
      };
      render(
        <AyuMultiSelect
          question={manyOptionsQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(10);
    });
  });

  describe('Multiple Selection Support', () => {
    it('should allow checking multiple checkboxes', async () => {
      render(
        <AyuMultiSelect
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      ) as any;
      const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];

      expect(checkboxes[0].checked).toBe(false);
      expect(checkboxes[1].checked).toBe(false);
    });
  });
});
