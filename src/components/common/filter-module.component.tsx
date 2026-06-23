import { useState } from 'react';
import type { FilterMode, FilterValue } from '../../utils/date-filter';
import { cn } from '../../utils/cn';
import Calendar from './calendar.component';

export interface FilterModuleProps {
  defaultMode?: FilterMode;
  defaultFrom?: string;
  defaultTo?: string;
  onApply: (value: FilterValue) => void;
  showToggle?: boolean;
  className?: string;
}

const FilterModule: React.FC<FilterModuleProps> = ({
  defaultMode = 'range',
  defaultFrom = '',
  defaultTo = '',
  onApply,
  showToggle = true,
  className,
}) => {
  const [mode, setMode] = useState<FilterMode>(defaultMode);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [applied, setApplied] = useState(false);

  const isApplyDisabled = !from || (mode === 'range' && !to) || applied;
  const handleFromChange = (date: string) => {
    setFrom(date);
    setApplied(false);
  };

  const handleToChange = (date: string) => {
    setTo(date);
    setApplied(false);
  };

  const handleModeChange = (newMode: FilterMode) => {
    setMode(newMode);
    setApplied(false);
  };

  const handleApply = () => {
    onApply({
      mode,
      from,
      to: mode === 'range' ? to : null,
    });
    setApplied(true);
  };

  return (
    <div
      className={cn(
        'w-72 rounded-2xl border border-[#ECEEFF] bg-white p-5 shadow-[0_10px_40px_rgba(0,0,0,0.08)]',
        className
      )}
    >
      {showToggle && (
        <div className="mb-5 flex gap-3">
          <button
            type="button"
            onClick={() => handleModeChange('date')}
            className={cn(
              'flex-1 rounded-xl border py-2.5 text-sm font-semibold transition',
              mode === 'date'
                ? 'border-[#ECEEFF] bg-[#ECEEFF] text-[#2f1e91]'
                : 'border-[#ECEEFF] bg-white text-[#2f1e91] hover:bg-[#f5f3ff]'
            )}
          >
            Date
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('range')}
            className={cn(
              'flex-1 rounded-xl border py-2.5 text-sm font-semibold transition',
              mode === 'range'
                ? 'border-[#ECEEFF] bg-[#ECEEFF] text-[#2f1e91]'
                : 'border-[#ECEEFF] bg-white text-[#2f1e91] hover:bg-[#f5f3ff]'
            )}
          >
            Range
          </button>
        </div>
      )}

      <Calendar
        label="From"
        value={from}
        onChange={handleFromChange}
        size="sm"
        maxDate={mode === 'range' && to ? new Date(to) : new Date()}
      />

      {mode === 'range' && (
        <div className="mt-3">
          <Calendar
            label="To"
            value={to}
            onChange={handleToChange}
            size="sm"
            minDate={from ? new Date(from) : undefined}
            maxDate={new Date()}
          />
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={handleApply}
          disabled={isApplyDisabled}
          className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white border border-[#2b1a92] cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default FilterModule;
