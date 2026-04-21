import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AyuDateInput } from '../../../../../modules/ayu/components/common/ayu-date-input.component';
import type { AyuQuestion } from '../../../../../modules/ayu-library/types/ayu.types';
import * as fhirUtils from '../../../../../modules/ayu-library/utils/fhir-to-ayu.util';

vi.spyOn(fhirUtils, 'resolveLabel').mockImplementation((question) => question?.text);

// Mock the Calendar component for simpler testing
vi.mock('../../../../../components/common/calendar.component', () => ({
  default: vi.fn(({ label, value, onChange, disabled, minDate }: any) => (
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
      {minDate && <span data-testid="calendar-min-date">{minDate.toISOString().split('T')[0]}</span>}
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

  describe('minDate from previous sibling', () => {
    it('should set minDate when previous sibling is a date with a value', () => {
      const previousSibling: AyuQuestion = {
        linkId: 'from-date',
        text: 'From Date',
        type: 'date',
      };
      render(
        <AyuDateInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={previousSibling}
          answers={{ 'from-date': '2026-01-15' }}
        />
      );
      const minDateEl = screen.getByTestId('calendar-min-date');
      expect(minDateEl).toHaveTextContent('2026-01-15');
    });

    it('should not set minDate when previous sibling is not a date type', () => {
      const previousSibling: AyuQuestion = {
        linkId: 'prev-string',
        text: 'Some string',
        type: 'string',
      };
      render(
        <AyuDateInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={previousSibling}
          answers={{ 'prev-string': 'some value' }}
        />
      );
      expect(screen.queryByTestId('calendar-min-date')).not.toBeInTheDocument();
    });

    it('should not set minDate when answers are not provided', () => {
      const previousSibling: AyuQuestion = {
        linkId: 'from-date',
        text: 'From Date',
        type: 'date',
      };
      render(
        <AyuDateInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={previousSibling}
        />
      );
      expect(screen.queryByTestId('calendar-min-date')).not.toBeInTheDocument();
    });

    it('should not set minDate when previous sibling date has no value', () => {
      const previousSibling: AyuQuestion = {
        linkId: 'from-date',
        text: 'From Date',
        type: 'date',
      };
      render(
        <AyuDateInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={previousSibling}
          answers={{ 'from-date': '' }}
        />
      );
      expect(screen.queryByTestId('calendar-min-date')).not.toBeInTheDocument();
    });

    it('should not set minDate when previous sibling value is not a string', () => {
      const previousSibling: AyuQuestion = {
        linkId: 'from-date',
        text: 'From Date',
        type: 'date',
      };
      render(
        <AyuDateInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={previousSibling}
          answers={{ 'from-date': 42 }}
        />
      );
      expect(screen.queryByTestId('calendar-min-date')).not.toBeInTheDocument();
    });

    it('should not set minDate when no previousSibling', () => {
      render(
        <AyuDateInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          answers={{ 'some-id': '2026-01-01' }}
        />
      );
      expect(screen.queryByTestId('calendar-min-date')).not.toBeInTheDocument();
    });
  });

  describe('onChange callback', () => {
    it('should call onChange when date is selected', async () => {
      const onChangeMock = vi.fn();
      render(
        <AyuDateInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
          onChange={onChangeMock}
        />
      );
      const input = screen.getByTestId('calendar-input');
      fireEvent.change(input, { target: { value: '15 Jan,2026' } });
      expect(onChangeMock).toHaveBeenCalledWith('15 Jan,2026');
    });

    it('should not throw when onChange is undefined', () => {
      render(
        <AyuDateInput
          question={mockQuestion}
          parent={undefined}
          previousSibling={undefined}
        />
      );
      const input = screen.getByTestId('calendar-input');
      expect(() => {
        fireEvent.change(input, { target: { value: '15 Jan,2026' } });
      }).not.toThrow();
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
