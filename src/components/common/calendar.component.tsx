import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/calendar.css';
import iconCalendar from '../../assets/icons/icon-calendar-blue.svg';
import { cn } from '../../utils/cn';
import CalendarMonthGrid from './calendar-month-grid.component';
import CalendarYearGrid from './calendar-year-grid.component';
import ChevronIcon from './chevron-icon.component';

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
  boldLabel?: boolean;
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
  boldLabel = false,
}) => {
  // Parse "yyyy-MM-dd" as a local date; `new Date(str)` treats it as UTC
  // and shifts the day in negative-offset timezones.
  const parseLocalDate = (val: string): Date | null => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val);
    const parsed = match
      ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
      : new Date(val);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? parseLocalDate(value) : null
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
    onChange?.(date ? formatLocalDate(date) : '');
  };

  const handleCalendarClose = () => {
    setShowYearGrid(false);
    setShowMonthGrid(false);
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
    setSelectedDate(value ? parseLocalDate(value) : null);
  }, [value]);

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          className={cn(
            boldLabel
              ? 'block text-large-label text-(--color-dark) mb-2'
              : 'block text-base text-(--color-muted) mb-2',
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
          onCalendarClose={handleCalendarClose}
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
            changeYear,
            changeMonth,
          }: {
            date: Date;
            decreaseMonth: () => void;
            increaseMonth: () => void;
            changeYear: (year: number) => void;
            changeMonth: (month: number) => void;
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
                    // Only navigate the view: the date is committed when the
                    // user picks an actual day.
                    changeMonth(monthIndex);
                    setShowMonthGrid(false);
                  }}
                  onYearChange={changeYear}
                />
              );
            }

            // If year grid is shown, render only the year grid
            if (showYearGrid) {
              const navigateDecade = (direction: 'prev' | 'next') => {
                const decadeStart = Math.floor(date.getFullYear() / 10) * 10;
                changeYear(decadeStart + (direction === 'next' ? 10 : -10));
              };

              return (
                <CalendarYearGrid
                  date={date}
                  onYearSelect={year => {
                    changeYear(year);
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
                    aria-label="Previous month"
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 text-gray-600"
                  >
                    <ChevronIcon direction="left" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowYearGrid(!showYearGrid)}
                    className="text-sm font-medium text-gray-700 hover:text-blue-600 flex items-center gap-1"
                  >
                    {formatDateHeader(date)}
                    <ChevronIcon direction="down" className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={increaseMonth}
                    aria-label="Next month"
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-50 text-gray-600"
                  >
                    <ChevronIcon direction="right" />
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
          <img src={iconCalendar} alt="calendar" className="w-5 h-5" />
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
