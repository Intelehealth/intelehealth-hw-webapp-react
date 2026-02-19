import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AyuDateInput } from '../../../../../modules/ayu/components/common/ayu-date-input.component';
import type { AyuQuestion } from '../../../../../modules/ayu/types/ayu.types';
import * as fhirUtils from '../../../../../modules/ayu-library/utils/fhir-to-ayu.util';

vi.spyOn(fhirUtils, 'resolveLabel').mockImplementation((question) => question.text);

describe('AyuDateInput', () => {
  const mockQuestion: AyuQuestion = {
    linkId: 'date-1',
    text: 'Select a date',
    type: 'date',
    readOnly: false,
  };

  describe('Rendering', () => {
    it('should render date input with label', () => {
      render(
        <AyuDateInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByLabelText('Select a date')).toBeInTheDocument();
      expect(screen.getByLabelText('Select a date')).toHaveAttribute('type', 'date');
    });

    it('should render without label when text is not provided', () => {
      const questionWithoutText: AyuQuestion = {
        ...mockQuestion,
        text: undefined,
      };
      render(
        <AyuDateInput
          question={questionWithoutText}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
      const input = document.querySelector('input[type="date"]');
      expect(input).toBeInTheDocument();
    });

    it('should have correct input type', () => {
      render(
        <AyuDateInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByLabelText('Select a date');
      expect(input).toHaveAttribute('type', 'date');
    });

    it('should render disabled input when readOnly is true', () => {
      const readOnlyQuestion: AyuQuestion = {
        ...mockQuestion,
        readOnly: true,
      };
      render(
        <AyuDateInput
          question={readOnlyQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByLabelText('Select a date');
      expect(input).toBeDisabled();
    });

    it('should render enabled input when readOnly is false', () => {
      render(
        <AyuDateInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByLabelText('Select a date');
      expect(input).not.toBeDisabled();
    });
  });

  describe('CSS Classes', () => {
    it('should have correct CSS classes', () => {
      render(
        <AyuDateInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByLabelText('Select a date');
      expect(input).toHaveClass('w-full', 'border', 'rounded', 'px-3', 'py-2');
    });
  });

  describe('Label Styling', () => {
    it('should render label with correct CSS classes', () => {
      render(
        <AyuDateInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const label = screen.getByText('Select a date');
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
        <AyuDateInput
          question={mockQuestion}
          parent={parent}
          previousSibling={undefined}
        />
      );
      expect(screen.getByLabelText('Select a date')).toBeInTheDocument();
    });

    it('should handle previousSibling prop', () => {
      const previousSibling: AyuQuestion = {
        linkId: 'prev-1',
        text: 'Previous Question',
        type: 'date',
      };
      render(
        <AyuDateInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={previousSibling}
        />
      );
      expect(screen.getByLabelText('Select a date')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined question gracefully', () => {
      render(
        <AyuDateInput
          question={undefined}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = document.querySelector('input[type="date"]');
      expect(input).toBeInTheDocument();
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });

    it('should handle question with empty string text', () => {
      const emptyTextQuestion: AyuQuestion = {
        ...mockQuestion,
        text: '',
      };
      render(
        <AyuDateInput
          question={emptyTextQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = document.querySelector('input[type="date"]');
      expect(input).toBeInTheDocument();
    });

    it('should handle undefined readOnly', () => {
      const questionWithoutReadOnly: AyuQuestion = {
        linkId: 'date-1',
        text: 'Select a date',
        type: 'date',
      };
      render(
        <AyuDateInput
          question={questionWithoutReadOnly}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByLabelText('Select a date');
      expect(input).not.toBeDisabled();
    });
  });

  describe('Container Layout', () => {
    it('should render with flex container classes', () => {
      const { container } = render(
        <AyuDateInput
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
