import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/calendar.css';
import { cn } from '../../utils/cn';
import CalendarMonthGrid from './calendar-month-grid.component';
import CalendarYearGrid from './calendar-year-grid.component';

export interface CalendarProps {
  value?: string;
  onChange?: (date: string) => void;
  label?: string;
  error?: string;
  isRequired?: boolean;
  className?: string;
  placeholder?: string;
  dateFormat?: string;
  maxDate?: Date;
  minDate?: Date;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'default' | 'wide';
}

const Calendar: React.FC<CalendarProps> = ({
  value = '',
  onChange,
  label = 'Select Date',
  error,
  isRequired = false,
  className = '',
  placeholder = 'Select date',
  dateFormat = 'dd-MMM-yy',
  maxDate,
  minDate,
  disabled = false,
  size = 'default',
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const [currentDate, setCurrentDate] = useState<Date>(
    value ? new Date(value) : new Date()
  );
  const [showYearGrid, setShowYearGrid] = useState(false);
  const [showMonthGrid, setShowMonthGrid] = useState(false);

  const formatLocalDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setCurrentDate(date || new Date());
    onChange?.(date ? formatLocalDate(date) : '');
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg',
    default: 'w-full py-[10px] px-3 text-[13px]',
    wide: 'w-full py-[10px] px-3 text-[13px] min-w-[200px]',
  };

  const baseClasses = cn(
    'form-input-base',
    sizeClasses[size],
    error && 'border-error-500 focus:border-error-500 focus:ring-error-500',
    disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer',
    className
  );

  // Sync currentDate when value prop changes
  useEffect(() => {
    if (value) {
      const newDate = new Date(value);
      setSelectedDate(newDate);
      setCurrentDate(newDate);
    } else {
      setSelectedDate(null);
      setCurrentDate(new Date());
    }
  }, [value]);

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          className={cn(
            'block text-base text-(--color-muted) mb-2',
            error && 'text-error-700',
            disabled && 'text-gray-400'
          )}
        >
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          placeholderText={placeholder}
          dateFormat={dateFormat}
          showYearDropdown={false}
          showMonthDropdown={false}
          calendarClassName={cn(
            (showYearGrid || showMonthGrid) && 'react-datepicker--grid-mode'
          )}
          openToDate={currentDate}
          renderDayContents={(dayOfMonth: number) => {
            if (showYearGrid || showMonthGrid) {
              return null; // Hide calendar days when year or month grid is shown
            }
            return dayOfMonth;
          }}
          renderCustomHeader={({
            date,
            decreaseMonth,
            increaseMonth,
          }: {
            date: Date;
            decreaseMonth: () => void;
            increaseMonth: () => void;
          }) => {
            const formatDateHeader = (date: Date) => {
              const dayNames = [
                'SUN',
                'MON',
                'TUE',
                'WED',
                'THU',
                'FRI',
                'SAT',
              ];
              const monthNames = [
                'JAN',
                'FEB',
                'MAR',
                'APR',
                'MAY',
                'JUN',
                'JUL',
                'AUG',
                'SEP',
                'OCT',
                'NOV',
                'DEC',
              ];
              return `${dayNames[date.getDay()]} ${monthNames[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
            };

            // If month grid is shown, render month grid
            if (showMonthGrid) {
              return (
                <CalendarMonthGrid
                  date={date}
                  onMonthSelect={monthIndex => {
                    const newDate = new Date(currentDate);
                    newDate.setMonth(monthIndex);
                    setCurrentDate(newDate);
                    setSelectedDate(newDate);
                    onChange?.(formatLocalDate(newDate));
                    setShowMonthGrid(false);
                  }}
                  onYearChange={year => {
                    const newDate = new Date(currentDate);
                    newDate.setFullYear(year);
                    setCurrentDate(newDate);
                  }}
                />
              );
            }

            // If year grid is shown, render only the year grid
            if (showYearGrid) {
              const navigateDecade = (direction: 'prev' | 'next') => {
                const currentYear = currentDate.getFullYear();
                const decadeStart = Math.floor(currentYear / 10) * 10;
                const newDecade =
                  decadeStart + (direction === 'next' ? 10 : -10);
                const newDate = new Date(currentDate);
                newDate.setFullYear(newDecade);
                setCurrentDate(newDate);
              };

              return (
                <CalendarYearGrid
                  date={date}
                  onYearSelect={year => {
                    const newDate = new Date(currentDate);
                    newDate.setFullYear(year);
                    setCurrentDate(newDate);
                    setShowYearGrid(false);
                    setShowMonthGrid(true);
                  }}
                  onNavigateDecade={navigateDecade}
                />
              );
            }

            // Default calendar view
            return (
              <div className="p-2">
                {/* Navigation */}
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={decreaseMonth}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                  >
                    <i className="fa-solid fa-chevron-left text-gray-600"></i>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowYearGrid(!showYearGrid)}
                    className="text-sm font-medium text-gray-700 hover:text-blue-600 flex items-center gap-1"
                  >
                    {formatDateHeader(date)}
                    <i className="fa-solid fa-chevron-down text-xs"></i>
                  </button>

                  <button
                    type="button"
                    onClick={increaseMonth}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-50"
                  >
                    <i className="fa-solid fa-chevron-right text-gray-600"></i>
                  </button>
                </div>
              </div>
            );
          }}
          maxDate={maxDate}
          minDate={minDate}
          disabled={disabled}
          className={cn(baseClasses)}
          wrapperClassName="w-full"
          popperClassName="react-datepicker-popper"
          autoComplete="off"
          inline={false}
          withPortal={false}
          popperPlacement="bottom-start"
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 pointer-events-none"
        >
          <i className="fa-solid fa-calendar text-sm"></i>
        </button>
      </div>
      {error && (
        <div className="form-error-message text-red-500 text-sm mt-1">
          {error}
        </div>
      )}
    </div>
  );
};

export default Calendar;
