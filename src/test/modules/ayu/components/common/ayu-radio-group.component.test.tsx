import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AyuRadioGroup } from '../../../../../modules/ayu/components/common/ayu-radio-group.component';
import type { AyuQuestion } from '../../../../../modules/ayu/types/ayu.types';

vi.mock('../../../../../ayu-library/utils/fhir-to-ayu.util', () => ({
  resolveLabel: vi.fn((question) => question.text),
}));

describe('AyuRadioGroup', () => {
  const mockQuestion: AyuQuestion = {
    linkId: 'radio-1',
    text: 'Select one option',
    type: 'choice',
    answerOption: [
      { valueString: 'Option A' },
      { valueString: 'Option B' },
      { valueCoding: { display: 'Option C', code: 'opt-c' } },
    ],
  };

  describe('Rendering', () => {
    it('should render radio group with label', () => {
      render(
        <AyuRadioGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByText('Select one option')).toBeInTheDocument();
    });

    it('should render without label when text is not provided', () => {
      const questionWithoutText: AyuQuestion = {
        ...mockQuestion,
        text: undefined,
      };
      render(
        <AyuRadioGroup
          question={questionWithoutText}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const radios = screen.getAllByRole('radio');
      expect(radios.length).toBe(3);
    });

    it('should render all radio options', () => {
      render(
        <AyuRadioGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(3);
    });

    it('should render radio labels with valueString', () => {
      render(
        <AyuRadioGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option B')).toBeInTheDocument();
    });

    it('should render radio labels with valueCoding display', () => {
      render(
        <AyuRadioGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByText('Option C')).toBeInTheDocument();
    });

    it('should have same name attribute for all radios', () => {
      render(
        <AyuRadioGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const radios = screen.getAllByRole('radio') as HTMLInputElement[];
      radios.forEach(radio => {
        expect(radio.name).toBe('radio-1');
      });
    });
  });

  describe('CSS Classes', () => {
    it('should have correct container CSS classes', () => {
      const { container } = render(
        <AyuRadioGroup
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
        <AyuRadioGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const label = screen.getByText('Select one option');
      expect(label).toHaveClass('text-sm', 'font-medium', 'text-gray-700');
    });

    it('should have correct radio label wrapper classes', () => {
      const { container } = render(
        <AyuRadioGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const radioLabels = container.querySelectorAll('label.flex.gap-2');
      expect(radioLabels.length).toBe(3);
    });
  });

  describe('Answer Options Handling', () => {
    it('should handle empty answerOption array', () => {
      const questionWithNoOptions: AyuQuestion = {
        ...mockQuestion,
        answerOption: [],
      };
      render(
        <AyuRadioGroup
          question={questionWithNoOptions}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const radios = screen.queryAllByRole('radio');
      expect(radios).toHaveLength(0);
    });

    it('should handle undefined answerOption', () => {
      const questionWithUndefinedOptions: AyuQuestion = {
        ...mockQuestion,
        answerOption: undefined,
      };
      render(
        <AyuRadioGroup
          question={questionWithUndefinedOptions}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const radios = screen.queryAllByRole('radio');
      expect(radios).toHaveLength(0);
    });

    it('should handle single option', () => {
      const singleOptionQuestion: AyuQuestion = {
        ...mockQuestion,
        answerOption: [{ valueString: 'Only Option' }],
      };
      render(
        <AyuRadioGroup
          question={singleOptionQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(1);
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
        <AyuRadioGroup
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
        <AyuRadioGroup
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
        <AyuRadioGroup
          question={mockQuestion}
          parent={parent}
          previousSibling={undefined}
        />
      );
      expect(screen.getAllByRole('radio')).toHaveLength(3);
    });

    it('should handle previousSibling prop', () => {
      const previousSibling: AyuQuestion = {
        linkId: 'prev-1',
        text: 'Previous Question',
        type: 'choice',
      };
      render(
        <AyuRadioGroup
          question={mockQuestion}
          parent={undefined}
          previousSibling={previousSibling}
        />
      );
      expect(screen.getAllByRole('radio')).toHaveLength(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle question with empty string text', () => {
      const emptyTextQuestion: AyuQuestion = {
        ...mockQuestion,
        text: '',
      };
      render(
        <AyuRadioGroup
          question={emptyTextQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getAllByRole('radio')).toHaveLength(3);
    });

    it('should handle options with special characters', () => {
      const specialCharsQuestion: AyuQuestion = {
        ...mockQuestion,
        answerOption: [
          { valueString: 'Option with <special> & "chars"' },
        ],
      };
      render(
        <AyuRadioGroup
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
        <AyuRadioGroup
          question={manyOptionsQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(10);
    });
  });
});
