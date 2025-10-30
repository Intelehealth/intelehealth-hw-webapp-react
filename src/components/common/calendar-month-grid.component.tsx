import React from 'react';
import { cn } from '../../utils/cn';

interface CalendarMonthGridProps {
  date: Date;
  onMonthSelect: (monthIndex: number) => void;
  onYearChange: (year: number) => void;
}

const CalendarMonthGrid: React.FC<CalendarMonthGridProps> = ({
  date,
  onMonthSelect,
  onYearChange,
}) => {
  const months = [
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

  return (
    <div className="calendar-month-grid">
      {/* Year Header */}
      <div className="calendar-header">
        <div className="year-range">
          <span className="text-lg font-bold">{date.getFullYear()}</span>
          <button type="button" className="p-1 hover:bg-gray-100 rounded">
            <i className="fa-solid fa-chevron-up text-gray-600 text-xs"></i>
          </button>
        </div>
        <div className="navigation">
          <button
            type="button"
            onClick={() => onYearChange(date.getFullYear() - 1)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <i className="fa-solid fa-chevron-left text-gray-600 text-xs"></i>
          </button>
          <button
            type="button"
            onClick={() => onYearChange(date.getFullYear() + 1)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <i className="fa-solid fa-chevron-right text-gray-600 text-xs"></i>
          </button>
        </div>
      </div>

      {/* Month Grid - 4 columns, 3 rows with proper spacing */}
      <div className="grid grid-cols-4 gap-4">
        {months.map((month, index) => {
          const isCurrentMonth = index === date.getMonth();

          return (
            <button
              key={month}
              type="button"
              onClick={() => onMonthSelect(index)}
              className={cn(
                'px-4 py-3 text-sm font-medium rounded-full transition-all duration-200 text-center',
                'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
                // Default styling
                !isCurrentMonth && 'text-gray-700 hover:bg-blue-50',
                // Current month selection - dark blue/purple background
                isCurrentMonth && 'text-white shadow-md'
              )}
              style={isCurrentMonth ? { backgroundColor: '#2f1e91' } : {}}
            >
              {month}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarMonthGrid;
