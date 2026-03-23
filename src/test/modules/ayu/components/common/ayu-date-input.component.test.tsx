import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AyuDateInput } from '../../../../../modules/ayu/components/common/ayu-date-input.component';
import type { AyuQuestion } from '../../../../../modules/ayu-library/types/ayu.types';
import * as fhirUtils from '../../../../../modules/ayu-library/utils/fhir-to-ayu.util';

vi.spyOn(fhirUtils, 'resolveLabel').mockImplementation((question) => question?.text);

// Mock the Calendar component for simpler testing
vi.mock('../../../../../components/common/calendar.component', () => ({
  default: vi.fn(({ label, value, onChange, disabled }: any) => (
    <div data-testid="calendar-component">
      {label && <label data-testid="calendar-label">{label}</label>}
      <input
        data-testid="calendar-input"
        type="text"
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
        disabled={disabled}
        aria-label={label}
      />
    </div>
  )),
}));

describe('AyuDateInput', () => {
  const mockQuestion: AyuQuestion = {
    linkId: 'date-1',
    text: 'Select a date',
    type: 'date',
    readOnly: false,
  };

  describe('Rendering', () => {
    it('should render Calendar component with label', () => {
      render(
        <AyuDateInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      expect(screen.getByTestId('calendar-component')).toBeInTheDocument();
      expect(screen.getByTestId('calendar-label')).toHaveTextContent('Select a date');
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
      expect(screen.getByTestId('calendar-component')).toBeInTheDocument();
      expect(screen.queryByTestId('calendar-label')).not.toBeInTheDocument();
    });

    it('should render the Calendar input', () => {
      render(
        <AyuDateInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByTestId('calendar-input');
      expect(input).toBeInTheDocument();
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
      const input = screen.getByTestId('calendar-input');
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
      const input = screen.getByTestId('calendar-input');
      expect(input).not.toBeDisabled();
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
      expect(screen.getByTestId('calendar-component')).toBeInTheDocument();
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
      expect(screen.getByTestId('calendar-component')).toBeInTheDocument();
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
      expect(screen.getByTestId('calendar-component')).toBeInTheDocument();
      expect(screen.queryByTestId('calendar-label')).not.toBeInTheDocument();
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
      expect(screen.getByTestId('calendar-component')).toBeInTheDocument();
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
      const input = screen.getByTestId('calendar-input');
      expect(input).not.toBeDisabled();
    });
  });

  describe('Value Handling', () => {
    it('should pass empty string to Calendar when value is not a string (e.g. number)', () => {
      render(
        <AyuDateInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value={42}
        />
      );
      const input = screen.getByTestId('calendar-input') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should pass the string value to Calendar when value is a string', () => {
      render(
        <AyuDateInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          value="01 Jan,2025"
        />
      );
      const input = screen.getByTestId('calendar-input') as HTMLInputElement;
      expect(input.value).toBe('01 Jan,2025');
    });
  });

  describe('Container Layout', () => {
    it('should render with a div wrapper', () => {
      const { container } = render(
        <AyuDateInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.tagName).toBe('DIV');
    });
  });
});
