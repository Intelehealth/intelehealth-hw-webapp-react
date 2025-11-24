import { forwardRef, useEffect, useMemo, useState } from 'react';
import type { Country } from '../../types';
import { getAllCountries } from '../../utils/countries';
import Dropdown, { type DropdownOption } from './dropdown.component';

export interface CountrySelectProps {
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

const CountrySelect = forwardRef<HTMLDivElement, CountrySelectProps>(
  (
    {
      value,
      onChange,
      placeholder = 'Select Country',
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
    const [countries, setCountries] = useState<Country[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      // Load countries from local JSON data
      try {
        const allCountries = getAllCountries();
        setCountries(allCountries);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading countries:', error);
        setIsLoading(false);
      }
    }, []);

    const options: DropdownOption[] = useMemo(
      () =>
        countries.map(country => ({
          value: country.name,
          label: country.name,
        })),
      [countries]
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
        placeholder={isLoading ? 'Loading countries...' : placeholder}
        label={label}
        labelClassName={labelClassName}
        error={error}
        helperText={helperText}
        size={size}
        variant={variant}
        multiple={multiple}
        searchable={searchable}
        clearable={clearable}
        disabled={disabled || isLoading}
        isRequired={isRequired}
        className={className}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
      />
    );
  }
);

CountrySelect.displayName = 'CountrySelect';

export default CountrySelect;
