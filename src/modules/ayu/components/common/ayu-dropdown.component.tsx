import React from 'react';

export interface DropdownOption {
  label: string;
  value: string | number;
}

export interface AyuDropdownProps {
  options: DropdownOption[];
  value?: string | number;
  onChange?: (value: string | number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  maxVisibleOptions?: number;
}

export function AyuDropdown({
  options,
  value,
  onChange,
  placeholder = 'Select',
  className = '',
  disabled = false,
  id,
  maxVisibleOptions = 10,
}: AyuDropdownProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className={`relative ${className}`}>
      <select
        id={id}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="w-full bg-white border border-emerald-400 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-0 focus:border-emerald-500 appearance-none text-sm text-gray-700 cursor-pointer disabled:bg-gray-100 disabled:cursor-not-allowed"
        style={{
          // This inline style helps limit dropdown height in some browsers
          // For better control, consider using a custom dropdown component
          maxHeight: maxVisibleOptions
            ? `${maxVisibleOptions * 2.5}rem`
            : undefined,
        }}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          className="w-4 h-4 text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}
