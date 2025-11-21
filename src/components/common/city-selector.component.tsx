import type { ICity } from 'country-state-city';
import { forwardRef, useEffect, useMemo, useState } from 'react';
import Dropdown, { type DropdownOption } from './dropdown.component';

export interface CitySelectorProps {
  countryId?: number | string;
  stateId?: number | string;
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

const CitySelector = forwardRef<HTMLDivElement, CitySelectorProps>(
  (
    {
      countryId,
      stateId,
      value,
      onChange,
      placeholder = 'Select City',
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
    const [cities, setCities] = useState<ICity[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      if (!countryId || !stateId) {
        setCities([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      // Dynamically import country-state-city to reduce initial bundle size
      import('country-state-city')
        .then(({ City, Country, State }) => {
          // Find country by name (countryId is passed as country name string)
          const countryName = typeof countryId === 'string' ? countryId : '';
          const stateName = typeof stateId === 'string' ? stateId : '';

          const allCountries = Country.getAllCountries();
          const country = allCountries.find(c => c.name === countryName);

          if (country) {
            const allStates = State.getStatesOfCountry(country.isoCode);
            const state = allStates.find(s => s.name === stateName);

            if (state) {
              const stateCities = City.getCitiesOfState(
                country.isoCode,
                state.isoCode
              );
              setCities(stateCities);
            } else {
              setCities([]);
            }
          } else {
            setCities([]);
          }
          setIsLoading(false);
        })
        .catch(() => {
          setCities([]);
          setIsLoading(false);
        });
    }, [countryId, stateId]);

    const options: DropdownOption[] = useMemo(
      () =>
        cities.map(city => ({
          value: city.name,
          label: city.name,
        })),
      [cities]
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
        placeholder={isLoading ? 'Loading cities...' : placeholder}
        label={label}
        labelClassName={labelClassName}
        error={error}
        helperText={helperText}
        size={size}
        variant={variant}
        multiple={multiple}
        searchable={searchable}
        clearable={clearable}
        disabled={disabled || !countryId || !stateId || isLoading}
        isRequired={isRequired}
        className={className}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
      />
    );
  }
);

CitySelector.displayName = 'CitySelector';

export default CitySelector;
