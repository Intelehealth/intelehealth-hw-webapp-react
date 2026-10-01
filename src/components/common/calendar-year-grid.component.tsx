import React from 'react';
import { cn } from '../../utils/cn';
import ChevronIcon from './chevron-icon.component';

interface CalendarYearGridProps {
  date: Date;
  onYearSelect: (year: number) => void;
  onNavigateDecade: (direction: 'prev' | 'next') => void;
}

const CalendarYearGrid: React.FC<CalendarYearGridProps> = ({
  date,
  onYearSelect,
  onNavigateDecade,
}) => {
  const currentYear = date.getFullYear();
  const decadeStart = Math.floor(currentYear / 10) * 10;
  const decadeEnd = decadeStart + 9;
  const years = Array.from({ length: 12 }, (_, i) => decadeStart - 1 + i);

  return (
    <div className="calendar-year-grid">
      {/* Decade Header */}
      <div className="calendar-header">
        <div className="year-range">
          <span>
            {decadeStart} – {decadeEnd}
          </span>
          <button
            type="button"
            aria-label="Year range"
            className="p-1 hover:bg-gray-100 rounded text-gray-600"
          >
            <ChevronIcon direction="up" className="w-3 h-3" />
          </button>
        </div>
        <div className="navigation">
          <button
            type="button"
            onClick={() => onNavigateDecade('prev')}
            aria-label="Previous decade"
            className="p-1 hover:bg-gray-100 rounded text-gray-600"
          >
            <ChevronIcon direction="left" />
          </button>
          <button
            type="button"
            onClick={() => onNavigateDecade('next')}
            aria-label="Next decade"
            className="p-1 hover:bg-gray-100 rounded text-gray-600"
          >
            <ChevronIcon direction="right" />
          </button>
        </div>
      </div>

      {/* Year Grid - 4 columns, 6 rows with proper spacing */}
      <div className="grid grid-cols-4 gap-4">
        {years.map(year => {
          const isCurrentYear = year === currentYear;
          const isInDecade = year >= decadeStart && year <= decadeEnd;

          return (
            <button
              key={year}
              type="button"
              onClick={() => onYearSelect(year)}
              className={cn(
                'px-4 py-3 text-sm font-medium rounded-full transition-all duration-200 text-center',
                'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
                // Default styling for years in decade
                isInDecade &&
                  !isCurrentYear &&
                  'text-gray-700 hover:bg-blue-50',
                // Current year selection - dark blue/purple background
                isCurrentYear && 'text-white shadow-md',
                // Years outside decade - lighter styling
                !isInDecade && 'text-gray-400 hover:text-gray-600'
              )}
              style={isCurrentYear ? { backgroundColor: '#2f1e91' } : {}}
            >
              {year}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarYearGrid;
