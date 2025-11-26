import { forwardRef, useEffect, useMemo, useState } from 'react';
import type { State } from '../../types/common.types';
import { getStatesByCountry } from '../../utils/states-districts';
import Dropdown, { type DropdownOption } from './dropdown.component';

export interface StateSelectorProps {
  countryId?: number | string;
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

const StateSelector = forwardRef<HTMLDivElement, StateSelectorProps>(
  (
    {
      countryId,
      value,
      onChange,
      placeholder = 'Select State',
      label,
      labelClassName = '',
      error,
      helperText,
      size = 'md',
      variant = 'default',
      multiple = false,
      searchable = true,
      clearable = true,
      disabled = false,
      isRequired = false,
      className,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
    },
    ref
  ) => {
    const [states, setStates] = useState<State[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      if (!countryId) {
        setStates([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const countryName = typeof countryId === 'string' ? countryId : '';

        if (countryName) {
          // Get states for the selected country
          const countryStates = getStatesByCountry(countryName);
          // Transform State objects to match the expected format
          const formattedStates = countryStates.map(state => ({
            name: state.state,
            state: state.state,
            stateHi: state['state-hi'],
            districts: state.districts,
          }));
          setStates(formattedStates as State[]);
        } else {
          setStates([]);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading states:', error);
        setStates([]);
        setIsLoading(false);
      }
    }, [countryId]);

    const options: DropdownOption[] = useMemo(
      () =>
        states.map(state => ({
          value: state.state,
          label: state.state,
        })),
      [states]
    );

    const handleChange = (selectedValue: string | string[]) => {
      onChange?.(selectedValue);
    };

    return (
      <Dropdown
        ref={ref}
        options={options}
        value={value}
        onChange={handleChange}
        placeholder={isLoading ? 'Loading states...' : placeholder}
        label={label}
        labelClassName={labelClassName}
        error={error}
        helperText={helperText}
        size={size}
        variant={variant}
        multiple={multiple}
        searchable={searchable}
        clearable={clearable}
        disabled={disabled || !countryId || isLoading}
        isRequired={isRequired}
        className={className}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
      />
    );
  }
);

StateSelector.displayName = 'StateSelector';

export default StateSelector;
