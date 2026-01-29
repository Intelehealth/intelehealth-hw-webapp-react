import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AyuNumberInput } from '../../../../../modules/ayu/components/common/ayu-number-input.component';
import type { AyuQuestion } from '../../../../../modules/ayu/types/ayu.types';

vi.mock('../../../../../ayu-library/utils/fhir-to-ayu.util', () => ({
  resolveLabel: vi.fn((question) => question.text),
}));

describe('AyuNumberInput', () => {
  const mockQuestion: AyuQuestion = {
    linkId: 'num-1',
    text: 'Enter your age',
    type: 'integer',
    readOnly: false,
  };

  describe('Rendering', () => {
    it('should render number input with label', () => {
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByLabelText('Enter your age')).toBeInTheDocument();
      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('should render without label when text is not provided', () => {
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
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
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
      expect(input).toHaveClass('w-full', 'border', 'border-gray-300', 'rounded', 'px-3', 'py-2');
    });

    it('should have focus styling classes', () => {
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveClass('focus:outline-none', 'focus:border-blue-500', 'focus:ring-1', 'focus:ring-blue-500');
    });

    it('should have disabled styling classes', () => {
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByRole('spinbutton');
      expect(input).toHaveClass('disabled:bg-gray-100', 'disabled:text-gray-400', 'disabled:cursor-not-allowed');
    });
  });

  describe('Label Styling', () => {
    it('should render label with correct CSS classes', () => {
      render(
        <AyuNumberInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const label = screen.getByText('Enter your age');
      expect(label).toHaveClass('text-sm', 'font-medium', 'text-gray-700');
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
});
