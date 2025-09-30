import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { cn } from '../../utils/cn';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  placeholder?: string;
  label?: string;
  labelClassName?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  isRequired?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select an option...',
      label,
      labelClassName = '',
      error,
      helperText,
      size = 'md',
      variant = 'default',
      multiple = false,
      searchable = false,
      clearable = false,
      disabled = false,
      isRequired = false,
      className,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [internalValue, setInternalValue] = useState<string | string[]>(
      value || (multiple ? [] : '')
    );

    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const dropdownId = React.useId();
    const errorId = `${dropdownId}-error`;
    const helperId = `${dropdownId}-helper`;

    const filteredOptions = options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Use internal value if no external value is provided
    const currentValue = value !== undefined ? value : internalValue;
    const selectedValues = Array.isArray(currentValue)
      ? currentValue
      : currentValue
        ? [currentValue]
        : [];
    const selectedOptions = options.filter(option =>
      selectedValues.includes(option.value)
    );

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-5 py-4 text-lg',
    };

    const variantClasses = {
      default: '',
      filled:
        'bg-gray-100 border-transparent focus:bg-white focus:border-primary-500 focus:ring-primary-500',
      outlined:
        'border-gray-300 focus:border-primary-500 focus:ring-primary-500',
    };

    const baseClasses = cn(
      'w-full duration-200 form-input-base flex',
      sizeClasses[size],
      variantClasses[variant],
      error && 'border-error-500 focus:border-error-500 focus:ring-error-500'
    );

    const handleToggle = () => {
      if (disabled) return;
      setIsOpen(!isOpen);
      if (!isOpen && searchable) {
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    };

    const handleSelect = (optionValue: string) => {
      if (multiple) {
        const newValue = selectedValues.includes(optionValue)
          ? selectedValues.filter(v => v !== optionValue)
          : [...selectedValues, optionValue];
        setInternalValue(newValue);
        onChange?.(newValue);
      } else {
        setInternalValue(optionValue);
        onChange?.(optionValue);
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      const newValue = multiple ? [] : '';
      setInternalValue(newValue);
      onChange?.(newValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev =>
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
            handleSelect(filteredOptions[focusedIndex].value);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
      }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setFocusedIndex(-1);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setSearchTerm('');
          setFocusedIndex(-1);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Scroll focused option into view
    useEffect(() => {
      if (focusedIndex >= 0 && listRef.current) {
        const focusedElement = listRef.current.children[
          focusedIndex
        ] as HTMLElement;
        if (focusedElement) {
          focusedElement.scrollIntoView({ block: 'nearest' });
        }
      }
    }, [focusedIndex]);

    const displayValue = () => {
      if (selectedOptions.length === 0) {
        return <span className="text-gray-400">{placeholder}</span>;
      }

      if (multiple) {
        return (
          <div className="flex flex-wrap gap-1">
            {selectedOptions.map(option => (
              <span
                key={option.value}
                className="inline-flex items-center px-2 py-1 rounded-md bg-(--color-primary-dark) text-white text-sm"
              >
                {option.label}
                <span
                  onClick={e => {
                    e.stopPropagation();
                    handleSelect(option.value);
                  }}
                  className="ml-1 text-primary-600 hover:text-primary-800 cursor-pointer"
                >
                  ×
                </span>
              </span>
            ))}
          </div>
        );
      }

      return selectedOptions[0]?.label || '';
    };

    return (
      <div ref={ref} className={cn('w-full', className)}>
        {label && (
          <label
            htmlFor={dropdownId}
            className={cn(
              'block text-base text-(--color-muted) mb-2',
              error && 'text-error-700',
              disabled && 'text-gray-400',
              labelClassName
            )}
          >
            {label}
            {isRequired && <span className="text-error-500 ml-1">*</span>}
          </label>
        )}

        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            id={dropdownId}
            className={cn(
              baseClasses,
              'text-left flex items-center justify-between',
              'hover:border-gray-400',
              isOpen && ''
            )}
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              error ? errorId : undefined,
              helperText ? helperId : undefined
            )}
          >
            <div className="flex-1 min-w-0">{displayValue()}</div>

            <div className="flex items-center gap-2 ml-2">
              {clearable && selectedValues.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Clear selection"
                >
                  ×
                </button>
              )}
              <svg
                className={cn(
                  'transition-transform duration-200 text-(--color-muted)',
                  isOpen && 'rotate-180',
                  size === 'sm'
                    ? 'w-4 h-4'
                    : size === 'lg'
                      ? 'w-6 h-6'
                      : 'w-5 h-5'
                )}
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
          </button>

          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
              {searchable && (
                <div className="p-2 border-b border-gray-200">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search options..."
                    className="w-full px-3 py-2 text-sm form-input-base"
                  />
                </div>
              )}

              <ul
                ref={listRef}
                role="listbox"
                className="max-h-60 overflow-auto py-1"
                aria-multiselectable={multiple}
              >
                {filteredOptions.length === 0 ? (
                  <li className="px-4 py-2 text-sm text-gray-500">
                    No options found
                  </li>
                ) : (
                  filteredOptions.map((option, index) => (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={selectedValues.includes(option.value)}
                      className={cn(
                        'px-4 py-2 cursor-pointer transition-colors duration-150',
                        'hover:bg-gray-100 focus:bg-gray-100',
                        selectedValues.includes(option.value) &&
                          'bg-primary-50 text-primary-900',
                        index === focusedIndex && 'bg-gray-100',
                        option.disabled &&
                          'opacity-50 cursor-not-allowed hover:bg-transparent'
                      )}
                      onClick={() =>
                        !option.disabled && handleSelect(option.value)
                      }
                    >
                      <div className="flex items-center">
                        {multiple && (
                          <input
                            type="checkbox"
                            checked={selectedValues.includes(option.value)}
                            onChange={() => {}}
                            className="mr-3 text-primary-600 focus:ring-primary-500"
                          />
                        )}
                        <div className="flex-1">
                          <div className="text-base text-(--color-muted)">
                            {option.label}
                          </div>
                          {option.description && (
                            <div className="text-sm text-(--color-dark)">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {error && (
          <p id={errorId} className="mt-2 text-sm text-error-600" role="alert">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={helperId} className="mt-2 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';

export default Dropdown;
