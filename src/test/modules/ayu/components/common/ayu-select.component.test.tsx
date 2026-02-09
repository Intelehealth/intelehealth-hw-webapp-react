import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AyuSelect } from '../../../../../modules/ayu/components/common/ayu-select.component';
import type { AyuQuestion } from '../../../../../modules/ayu/types/ayu.types';

vi.mock('../../../../../modules/ayu-library/utils/fhir-to-ayu.util', () => ({
  resolveLabel: vi.fn((question) => question.text),
}));

describe('AyuSelect', () => {
  const mockQuestion: AyuQuestion = {
    linkId: 'select-1',
    text: 'Select an option',
    type: 'choice',
    answerOption: [
      { valueString: 'Option 1' },
      { valueString: 'Option 2' },
      { valueCoding: { display: 'Option 3', code: 'opt-3' } },
    ],
  };

  describe('Rendering', () => {
    it('should render select dropdown with label', () => {
      render(
        <AyuSelect
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByLabelText('Select an option')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render without label when text is not provided', () => {
      const questionWithoutText: AyuQuestion = {
        ...mockQuestion,
        text: undefined,
      };
      render(
        <AyuSelect
          question={questionWithoutText}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should render all answer options', () => {
      render(
        <AyuSelect
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('option', { name: 'Option 1' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 2' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Option 3' })).toBeInTheDocument();
    });

    it('should render options with valueString', () => {
      render(
        <AyuSelect
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const option1 = screen.getByRole('option', { name: 'Option 1' }) as HTMLOptionElement;
      expect(option1.value).toBe('Option 1');
    });

    it('should render options with valueCoding display', () => {
      render(
        <AyuSelect
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const option3 = screen.getByRole('option', { name: 'Option 3' });
      expect(option3).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('should have correct select CSS classes', () => {
      render(
        <AyuSelect
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('bg-white', 'border', 'border-emerald-400', 'rounded-lg', 'px-3', 'py-2');
    });
  });

  describe('Label Styling', () => {
    it('should render label with correct CSS classes', () => {
      render(
        <AyuSelect
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const label = screen.getByText('Select an option');
      expect(label).toHaveClass('text-sm', 'font-medium', 'text-gray-700');
    });
  });

  describe('Answer Options Handling', () => {
    it('should handle empty answerOption array', () => {
      const questionWithNoOptions: AyuQuestion = {
        ...mockQuestion,
        answerOption: [],
      };
      render(
        <AyuSelect
          question={questionWithNoOptions}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const select = screen.getByRole('combobox');
      expect(select.children).toHaveLength(0);
    });

    it('should handle undefined answerOption', () => {
      const questionWithUndefinedOptions: AyuQuestion = {
        ...mockQuestion,
        answerOption: undefined,
      };
      render(
        <AyuSelect
          question={questionWithUndefinedOptions}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should handle single option', () => {
      const singleOptionQuestion: AyuQuestion = {
        ...mockQuestion,
        answerOption: [{ valueString: 'Only Option' }],
      };
      render(
        <AyuSelect
          question={singleOptionQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('option', { name: 'Only Option' })).toBeInTheDocument();
    });

    it('should handle options with both valueString and valueCoding', () => {
      const mixedOptionQuestion: AyuQuestion = {
        ...mockQuestion,
        answerOption: [
          { valueString: 'String Option', valueCoding: { display: 'Coding Display', code: 'code-1' } },
        ],
      };
      render(
        <AyuSelect
          question={mixedOptionQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('option', { name: 'String Option' })).toBeInTheDocument();
    });

    it('should fallback to valueCoding display when valueString is undefined', () => {
      const codingOnlyQuestion: AyuQuestion = {
        ...mockQuestion,
        answerOption: [
          { valueCoding: { display: 'Coding Only', code: 'code-2' } },
        ],
      };
      render(
        <AyuSelect
          question={codingOnlyQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('option', { name: 'Coding Only' })).toBeInTheDocument();
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
        <AyuSelect
          question={mockQuestion}
          parent={parent}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should handle previousSibling prop', () => {
      const previousSibling: AyuQuestion = {
        linkId: 'prev-1',
        text: 'Previous Question',
        type: 'choice',
      };
      render(
        <AyuSelect
          question={mockQuestion}
          parent={undefined}
          previousSibling={previousSibling}
        />
      );
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('Container Layout', () => {
    it('should render with flex container classes', () => {
      const { container } = render(
        <AyuSelect
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'flex-col', 'gap-1');
    });
  });

  describe('Edge Cases', () => {
    it('should handle question with empty string text', () => {
      const emptyTextQuestion: AyuQuestion = {
        ...mockQuestion,
        text: '',
      };
      render(
        <AyuSelect
          question={emptyTextQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should handle options with special characters', () => {
      const specialCharsQuestion: AyuQuestion = {
        ...mockQuestion,
        answerOption: [
          { valueString: 'Option with <special> & "chars"' },
        ],
      };
      render(
        <AyuSelect
          question={specialCharsQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByRole('option', { name: 'Option with <special> & "chars"' })).toBeInTheDocument();
    });
  });
});
