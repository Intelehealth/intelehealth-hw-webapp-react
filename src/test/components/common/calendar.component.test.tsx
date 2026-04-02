import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
  describe('date formatting (timezone-safe)', () => {
    it('should format date using local components, not toISOString', () => {
      const onChangeMock = vi.fn();
      render(<Calendar onChange={onChangeMock} />);

      const input = screen.getByTestId('datepicker-input');
      // Simulate selecting March 28, 2026
      fireEvent.change(input, { target: { value: '2026-03-28' } });

      expect(onChangeMock).toHaveBeenCalledWith('2026-03-28');
    });

    it('should emit empty string when date is cleared', () => {
      const onChangeMock = vi.fn();
      render(<Calendar value="2026-03-28" onChange={onChangeMock} />);

      const input = screen.getByTestId('datepicker-input');
      fireEvent.change(input, { target: { value: '' } });

      expect(onChangeMock).toHaveBeenCalledWith('');
    });

    it('should pad single-digit months and days', () => {
      const onChangeMock = vi.fn();
      render(<Calendar onChange={onChangeMock} />);

      const input = screen.getByTestId('datepicker-input');
      // January 5 should be 01 and 05
      fireEvent.change(input, { target: { value: '2026-01-05' } });

      expect(onChangeMock).toHaveBeenCalledWith('2026-01-05');
    });
  });

  describe('rendering', () => {
    it('should render with label', () => {
      render(<Calendar label="Select Date" />);
      expect(screen.getByText('Select Date')).toBeInTheDocument();
    });

    it('should render required indicator', () => {
      render(<Calendar label="Date" isRequired />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('should render error message', () => {
      render(<Calendar label="Date" error="Invalid date" />);
      expect(screen.getByText('Invalid date')).toBeInTheDocument();
    });

    it('should render disabled state', () => {
      render(<Calendar disabled />);
      const input = screen.getByTestId('datepicker-input');
      expect(input).toBeDisabled();
    });

    it('should render with initial value', () => {
      render(<Calendar value="2026-03-28" />);
      const input = screen.getByTestId('datepicker-input') as HTMLInputElement;
      expect(input.value).toBe('2026-03-28');
    });
  });
});
