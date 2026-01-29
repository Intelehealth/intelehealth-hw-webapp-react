import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AyuTextInput } from '../../../../../modules/ayu/components/common/ayu-text-input.component';
import type { AyuQuestion } from '../../../../../modules/ayu/types/ayu.types';

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
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByLabelText('What is your name?')).toBeInTheDocument();
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

    it('should have correct input type', () => {
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
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
      expect(input).toHaveClass('border', 'rounded', 'px-3', 'py-2');
    });
  });

  describe('Label Styling', () => {
    it('should render label with correct CSS classes', () => {
      render(
        <AyuTextInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const label = screen.getByText('What is your name?');
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
});
