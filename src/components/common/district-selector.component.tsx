import { forwardRef, useEffect, useMemo, useState } from 'react';
import type { District } from '../../types/common.types';
import { getDistrictsByState } from '../../utils/states-districts';
import Dropdown, { type DropdownOption } from './dropdown.component';

export interface DistrictSelectorProps {
  countryId?: string;
  stateId?: string;
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

const DistrictSelector = forwardRef<HTMLDivElement, DistrictSelectorProps>(
  (
    {
      countryId,
      stateId,
      value,
      onChange,
      placeholder = 'Select District',
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
    const [districts, setDistricts] = useState<District[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
      if (!countryId || !stateId) {
        setDistricts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const countryName = typeof countryId === 'string' ? countryId : '';
        const stateName = typeof stateId === 'string' ? stateId : '';

        if (countryName && stateName) {
          // Get districts for the state in the specified country
          const districtsData = getDistrictsByState(stateName, countryName);
          setDistricts(districtsData);
        } else {
          setDistricts([]);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading districts:', error);
        setDistricts([]);
        setIsLoading(false);
      }
    }, [countryId, stateId]);

    const options: DropdownOption[] = useMemo(
      () =>
        districts.map(district => ({
          value: district.name,
          label: district.name,
        })),
      [districts]
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
        placeholder={isLoading ? 'Loading districts...' : placeholder}
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

DistrictSelector.displayName = 'DistrictSelector';

export default DistrictSelector;
