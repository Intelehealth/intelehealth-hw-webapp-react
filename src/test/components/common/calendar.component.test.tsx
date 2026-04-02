import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Calendar from '../../../components/common/calendar.component';

// Mock react-datepicker
vi.mock('react-datepicker', () => ({
  default: vi.fn(({ selected, onChange, placeholderText, disabled, className }: any) => (
    <input
      data-testid="datepicker-input"
      value={selected ? selected.toISOString().split('T')[0] : ''}
      placeholder={placeholderText}
      disabled={disabled}
      className={className}
      onChange={e => {
        if (e.target.value) {
          onChange(new Date(e.target.value + 'T12:00:00'));
        } else {
          onChange(null);
        }
      }}
    />
  )),
}));

// Mock CSS imports
vi.mock('react-datepicker/dist/react-datepicker.css', () => ({}));
vi.mock('../../../styles/calendar.css', () => ({}));

// Mock sub-components
vi.mock('../../../components/common/calendar-month-grid.component', () => ({
  default: () => <div data-testid="month-grid" />,
}));
vi.mock('../../../components/common/calendar-year-grid.component', () => ({
  default: () => <div data-testid="year-grid" />,
}));

describe('Calendar', () => {
  describe('formatLocalDate (via handleDateChange)', () => {
    it('should format date using local date components', () => {
      const onChangeMock = vi.fn();
      render(<Calendar onChange={onChangeMock} />);

      const input = screen.getByTestId('datepicker-input');
      fireEvent.change(input, { target: { value: '2026-03-28' } });

      expect(onChangeMock).toHaveBeenCalledWith('2026-03-28');
    });

    it('should pad single-digit months and days', () => {
      const onChangeMock = vi.fn();
      render(<Calendar onChange={onChangeMock} />);

      const input = screen.getByTestId('datepicker-input');
      fireEvent.change(input, { target: { value: '2026-01-05' } });

      expect(onChangeMock).toHaveBeenCalledWith('2026-01-05');
    });

    it('should emit empty string when date is cleared (null)', () => {
      const onChangeMock = vi.fn();
      render(<Calendar value="2026-03-28" onChange={onChangeMock} />);

      const input = screen.getByTestId('datepicker-input');
      fireEvent.change(input, { target: { value: '' } });

      expect(onChangeMock).toHaveBeenCalledWith('');
    });

    it('should handle double-digit months and days without extra padding', () => {
      const onChangeMock = vi.fn();
      render(<Calendar onChange={onChangeMock} />);

      const input = screen.getByTestId('datepicker-input');
      fireEvent.change(input, { target: { value: '2026-12-25' } });

      expect(onChangeMock).toHaveBeenCalledWith('2026-12-25');
    });
  });

  describe('rendering', () => {
    it('should render with default label', () => {
      render(<Calendar />);
      expect(screen.getByText('Select Date')).toBeInTheDocument();
    });

    it('should render with custom label', () => {
      render(<Calendar label="Pick a date" />);
      expect(screen.getByText('Pick a date')).toBeInTheDocument();
    });

    it('should render without label when label is empty string', () => {
      render(<Calendar label="" />);
      expect(screen.queryByText('Select Date')).not.toBeInTheDocument();
    });

    it('should render required indicator when isRequired is true', () => {
      render(<Calendar label="Date" isRequired />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should not render required indicator when isRequired is false', () => {
      render(<Calendar label="Date" isRequired={false} />);
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('should render error message', () => {
      render(<Calendar label="Date" error="Invalid date" />);
      expect(screen.getByText('Invalid date')).toBeInTheDocument();
    });

    it('should not render error message when no error', () => {
      render(<Calendar label="Date" />);
      expect(screen.queryByText('Invalid date')).not.toBeInTheDocument();
    });

    it('should render disabled state', () => {
      render(<Calendar disabled />);
      const input = screen.getByTestId('datepicker-input');
      expect(input).toBeDisabled();
    });

    it('should render enabled state when not disabled', () => {
      render(<Calendar />);
      const input = screen.getByTestId('datepicker-input');
      expect(input).not.toBeDisabled();
    });

    it('should render with initial value', () => {
      render(<Calendar value="2026-03-28" />);
      const input = screen.getByTestId('datepicker-input') as HTMLInputElement;
      expect(input.value).toBe('2026-03-28');
    });

    it('should render empty input when no value', () => {
      render(<Calendar />);
      const input = screen.getByTestId('datepicker-input') as HTMLInputElement;
      expect(input.value).toBe('');
    });

    it('should render the calendar icon button', () => {
      const { container } = render(<Calendar />);
      const icon = container.querySelector('.fa-calendar');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('useEffect value sync', () => {
    it('should sync selectedDate when value prop changes to a new date', () => {
      const { rerender } = render(<Calendar value="2026-01-01" />);
      const input = screen.getByTestId('datepicker-input') as HTMLInputElement;
      expect(input.value).toBe('2026-01-01');

      rerender(<Calendar value="2026-06-15" />);
      expect(input.value).toBe('2026-06-15');
    });

    it('should clear selectedDate when value prop changes to empty string', () => {
      const { rerender } = render(<Calendar value="2026-01-01" />);
      const input = screen.getByTestId('datepicker-input') as HTMLInputElement;
      expect(input.value).toBe('2026-01-01');

      rerender(<Calendar value="" />);
      expect(input.value).toBe('');
    });

    it('should clear selectedDate when value prop changes to undefined', () => {
      const { rerender } = render(<Calendar value="2026-01-01" />);
      const input = screen.getByTestId('datepicker-input') as HTMLInputElement;
      expect(input.value).toBe('2026-01-01');

      rerender(<Calendar value={undefined} />);
      expect(input.value).toBe('');
    });
  });

  describe('props passthrough', () => {
    it('should pass placeholder to DatePicker', () => {
      render(<Calendar placeholder="Choose date" />);
      const input = screen.getByTestId('datepicker-input');
      expect(input.getAttribute('placeholder')).toBe('Choose date');
    });

    it('should use default placeholder when not provided', () => {
      render(<Calendar />);
      const input = screen.getByTestId('datepicker-input');
      expect(input.getAttribute('placeholder')).toBe('Select date');
    });

    it('should apply className to wrapper', () => {
      const { container } = render(<Calendar className="custom-class" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('custom-class');
    });
  });
});
