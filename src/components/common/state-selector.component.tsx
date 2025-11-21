import type { IState } from 'country-state-city';
import { forwardRef, useEffect, useMemo, useState } from 'react';
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
    const [states, setStates] = useState<IState[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      if (!countryId) {
        setStates([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      // Dynamically import country-state-city to reduce initial bundle size
      import('country-state-city')
        .then(({ Country, State }) => {
          // Find country by name (countryId is passed as country name string)
          const countryName = typeof countryId === 'string' ? countryId : '';
          const allCountries = Country.getAllCountries();
          const country = allCountries.find(c => c.name === countryName);

          if (country) {
            const countryStates = State.getStatesOfCountry(country.isoCode);
            setStates(countryStates);
          } else {
            setStates([]);
          }
          setIsLoading(false);
        })
        .catch(() => {
          setStates([]);
          setIsLoading(false);
        });
    }, [countryId]);

    const options: DropdownOption[] = useMemo(
      () =>
        states.map(state => ({
          value: state.name,
          label: state.name,
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
