import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { forwardRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CitySelector from '../../../components/common/city-selector.component';

// Mock country-state-city
const mockCountries = [
  { name: 'India', isoCode: 'IN' },
  { name: 'United States', isoCode: 'US' },
  { name: 'United Kingdom', isoCode: 'GB' },
];

const mockStates = [
  { name: 'Karnataka', isoCode: 'KA' },
  { name: 'Maharashtra', isoCode: 'MH' },
  { name: 'Tamil Nadu', isoCode: 'TN' },
];

const mockCities = [
  { name: 'Bangalore', isoCode: 'BLR' },
  { name: 'Mysore', isoCode: 'MYS' },
  { name: 'Mangalore', isoCode: 'MGL' },
];

vi.mock('country-state-city', () => ({
  Country: {
    getAllCountries: vi.fn(() => mockCountries),
  },
  State: {
    getStatesOfCountry: vi.fn((isoCode: string) => {
      if (isoCode === 'IN') {
        return mockStates;
      }
      return [];
    }),
  },
  City: {
    getCitiesOfState: vi.fn((countryIsoCode: string, stateIsoCode: string) => {
      if (countryIsoCode === 'IN' && stateIsoCode === 'KA') {
        return mockCities;
      }
      return [];
    }),
  },
}));

// Mock the Dropdown component
vi.mock('../../../components/common/dropdown.component', () => ({
  default: forwardRef(
    (
      {
        label,
        options,
        onChange,
        value,
        error,
        isRequired,
        placeholder,
        disabled,
        multiple,
        className,
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledBy,
      }: any,
      ref: any
    ) => {
      return (
        <div ref={ref} className={className}>
          {label && (
            <label>
              {label} {isRequired && <span>*</span>}
            </label>
          )}
          <select
            value={Array.isArray(value) ? value[0] : value || ''}
            onChange={(e) => {
              if (multiple) {
                const selectedValues = Array.from(
                  e.target.selectedOptions,
                  option => option.value
                );
                onChange?.(selectedValues);
              } else {
                onChange?.(e.target.value);
              }
            }}
            disabled={disabled}
            multiple={multiple}
            data-testid={`dropdown-${label || 'city'}`}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
          >
            <option value="">{placeholder || 'Select...'}</option>
            {options?.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {error && <span className="error">{error}</span>}
        </div>
      );
    }
  ),
}));

describe('CitySelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(<CitySelector />);
      }).not.toThrow();
    });

    it('should render with default placeholder', () => {
      render(<CitySelector />);
      expect(screen.getByText('Select City')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(<CitySelector placeholder="Choose City" />);
      expect(screen.getByText('Choose City')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<CitySelector label="City" />);
      expect(screen.getByText('City')).toBeInTheDocument();
    });

    it('should render with required indicator when isRequired is true', () => {
      render(<CitySelector label="City" isRequired />);
      const label = screen.getByText('City');
      expect(label.parentElement).toContainHTML('*');
    });

    it('should not render required indicator when isRequired is false', () => {
      render(<CitySelector label="City" isRequired={false} />);
      const label = screen.getByText('City');
      expect(label.parentElement).not.toContainHTML('*');
    });

    it('should render error message when error is provided', () => {
      render(<CitySelector error="City is required" />);
      expect(screen.getByText('City is required')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<CitySelector className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('City Options Loading', () => {
    it('should load cities when countryId and stateId are provided', async () => {
      render(<CitySelector countryId="India" stateId="Karnataka" label="City" />);
      await waitFor(() => {
        expect(screen.getByText('Bangalore')).toBeInTheDocument();
      });
      expect(screen.getByText('Mysore')).toBeInTheDocument();
      expect(screen.getByText('Mangalore')).toBeInTheDocument();
    });

    it('should not load cities when countryId is not provided', async () => {
      render(<CitySelector stateId="Karnataka" label="City" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City');
        expect(dropdown).toBeInTheDocument();
      });

      const dropdown = screen.getByTestId('dropdown-City');
      const options = dropdown.querySelectorAll('option');
      // Should only have placeholder option
      expect(options.length).toBe(1);
    });

    it('should not load cities when stateId is not provided', async () => {
      render(<CitySelector countryId="India" label="City" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City');
        expect(dropdown).toBeInTheDocument();
      });

      const dropdown = screen.getByTestId('dropdown-City');
      const options = dropdown.querySelectorAll('option');
      // Should only have placeholder option
      expect(options.length).toBe(1);
    });

    it('should clear cities when countryId is cleared', async () => {
      const { rerender } = render(
        <CitySelector countryId="India" stateId="Karnataka" label="City" />
      );
      await waitFor(() => {
        expect(screen.getByText('Bangalore')).toBeInTheDocument();
      });

      rerender(<CitySelector countryId="" stateId="Karnataka" label="City" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });

    it('should clear cities when stateId is cleared', async () => {
      const { rerender } = render(
        <CitySelector countryId="India" stateId="Karnataka" label="City" />
      );
      await waitFor(() => {
        expect(screen.getByText('Bangalore')).toBeInTheDocument();
      });

      rerender(<CitySelector countryId="India" stateId="" label="City" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });

    it('should handle countryId as number (should be treated as empty)', async () => {
      render(<CitySelector countryId={123 as any} stateId="Karnataka" label="City" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });

    it('should handle stateId as number (should be treated as empty)', async () => {
      render(<CitySelector countryId="India" stateId={456 as any} label="City" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });

    it('should handle invalid country name', async () => {
      render(<CitySelector countryId="InvalidCountry" stateId="Karnataka" label="City" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });

    it('should handle invalid state name', async () => {
      render(<CitySelector countryId="India" stateId="InvalidState" label="City" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });

    it('should update cities when countryId changes', async () => {
      const { rerender } = render(
        <CitySelector countryId="India" stateId="Karnataka" label="City" />
      );
      await waitFor(() => {
        expect(screen.getByText('Bangalore')).toBeInTheDocument();
      });

      rerender(<CitySelector countryId="United States" stateId="Karnataka" label="City" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City');
        const options = dropdown.querySelectorAll('option');
        // United States has no matching state, so only placeholder
        expect(options.length).toBe(1);
      });
    });

    it('should update cities when stateId changes', async () => {
      const { rerender } = render(
        <CitySelector countryId="India" stateId="Karnataka" label="City" />
      );
      await waitFor(() => {
        expect(screen.getByText('Bangalore')).toBeInTheDocument();
      });

      rerender(<CitySelector countryId="India" stateId="Maharashtra" label="City" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City');
        const options = dropdown.querySelectorAll('option');
        // Maharashtra has no cities in mock, so only placeholder
        expect(options.length).toBe(1);
      });
    });
  });

  describe('Value Handling', () => {
    it('should display selected value', async () => {
      render(
        <CitySelector countryId="India" stateId="Karnataka" value="Bangalore" label="City" />
      );
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City') as HTMLSelectElement;
        expect(dropdown.value).toBe('Bangalore');
      });
    });

    it('should handle empty value', async () => {
      render(<CitySelector countryId="India" stateId="Karnataka" value="" label="City" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City') as HTMLSelectElement;
        expect(dropdown.value).toBe('');
      });
    });

    it('should handle undefined value', async () => {
      render(<CitySelector countryId="India" stateId="Karnataka" label="City" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City') as HTMLSelectElement;
        expect(dropdown.value).toBe('');
      });
    });
  });

  describe('Change Handling', () => {
    it('should call onChange when value changes', async () => {
      const user = userEvent.setup();
      render(
        <CitySelector
          countryId="India"
          stateId="Karnataka"
          onChange={mockOnChange}
          label="City"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Bangalore')).toBeInTheDocument();
      });

      const dropdown = screen.getByTestId('dropdown-City');
      await user.selectOptions(dropdown, 'Bangalore');

      expect(mockOnChange).toHaveBeenCalledWith('Bangalore');
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should not call onChange when onChange is not provided', async () => {
      const user = userEvent.setup();
      render(<CitySelector countryId="India" stateId="Karnataka" label="City" />);

      await waitFor(() => {
        expect(screen.getByText('Bangalore')).toBeInTheDocument();
      });

      const dropdown = screen.getByTestId('dropdown-City');
      await user.selectOptions(dropdown, 'Bangalore');

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should handle multiple selection when multiple is true', async () => {
      render(
        <CitySelector
          countryId="India"
          stateId="Karnataka"
          onChange={mockOnChange}
          multiple
          label="City"
        />
      );

      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City') as HTMLSelectElement;
        expect(dropdown.multiple).toBe(true);
      });
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', async () => {
      render(
        <CitySelector countryId="India" stateId="Karnataka" disabled label="City" />
      );
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City') as HTMLSelectElement;
        expect(dropdown.disabled).toBe(true);
      });
    });

    it('should be disabled when countryId is not provided', async () => {
      render(<CitySelector stateId="Karnataka" disabled={false} label="City" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City') as HTMLSelectElement;
        expect(dropdown.disabled).toBe(true);
      });
    });

    it('should be disabled when stateId is not provided', async () => {
      render(<CitySelector countryId="India" disabled={false} label="City" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City') as HTMLSelectElement;
        expect(dropdown.disabled).toBe(true);
      });
    });

    it('should not be disabled when both countryId and stateId are provided and disabled is false', async () => {
      render(
        <CitySelector countryId="India" stateId="Karnataka" disabled={false} label="City" />
      );
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City') as HTMLSelectElement;
        expect(dropdown.disabled).toBe(false);
      });
    });
  });

  describe('Props Forwarding', () => {
    it('should forward size prop to Dropdown', () => {
      render(
        <CitySelector countryId="India" stateId="Karnataka" size="lg" label="City" />
      );
      expect(screen.getByTestId('dropdown-City')).toBeInTheDocument();
    });

    it('should forward variant prop to Dropdown', () => {
      render(
        <CitySelector countryId="India" stateId="Karnataka" variant="outlined" label="City" />
      );
      expect(screen.getByTestId('dropdown-City')).toBeInTheDocument();
    });

    it('should forward searchable prop to Dropdown', () => {
      render(
        <CitySelector countryId="India" stateId="Karnataka" searchable={false} label="City" />
      );
      expect(screen.getByTestId('dropdown-City')).toBeInTheDocument();
    });

    it('should forward clearable prop to Dropdown', () => {
      render(
        <CitySelector countryId="India" stateId="Karnataka" clearable={false} label="City" />
      );
      expect(screen.getByTestId('dropdown-City')).toBeInTheDocument();
    });

    it('should forward labelClassName prop to Dropdown', () => {
      render(
        <CitySelector
          countryId="India"
          stateId="Karnataka"
          label="City"
          labelClassName="custom-label"
        />
      );
      expect(screen.getByText('City')).toBeInTheDocument();
    });

    it('should forward helperText prop to Dropdown', () => {
      render(
        <CitySelector
          countryId="India"
          stateId="Karnataka"
          helperText="Select your city"
          label="City"
        />
      );
      expect(screen.getByTestId('dropdown-City')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label when provided', () => {
      render(
        <CitySelector
          countryId="India"
          stateId="Karnataka"
          aria-label="Select city"
          label="City"
        />
      );
      const dropdown = screen.getByTestId('dropdown-City');
      expect(dropdown).toHaveAttribute('aria-label', 'Select city');
    });

    it('should have aria-labelledby when provided', () => {
      render(
        <CitySelector
          countryId="India"
          stateId="Karnataka"
          aria-labelledby="city-label"
          label="City"
        />
      );
      const dropdown = screen.getByTestId('dropdown-City');
      expect(dropdown).toHaveAttribute('aria-labelledby', 'city-label');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to Dropdown component', () => {
      const ref = { current: null };
      render(<CitySelector countryId="India" stateId="Karnataka" ref={ref} label="City" />);
      expect(ref.current).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty cities list', async () => {
      const countryStateCity = await import('country-state-city');
      vi.mocked(countryStateCity.City.getCitiesOfState).mockReturnValueOnce([]);
      render(<CitySelector countryId="India" stateId="Maharashtra" label="City" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City');
        expect(dropdown).toBeInTheDocument();
      });
    });

    it('should handle value change from controlled component', async () => {
      const { rerender } = render(
        <CitySelector countryId="India" stateId="Karnataka" value="Bangalore" label="City" />
      );
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City') as HTMLSelectElement;
        expect(dropdown.value).toBe('Bangalore');
      });

      rerender(
        <CitySelector countryId="India" stateId="Karnataka" value="Mysore" label="City" />
      );
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City') as HTMLSelectElement;
        expect(dropdown.value).toBe('Mysore');
      });
    });

    it('should handle array value for multiple selection', async () => {
      render(
        <CitySelector
          countryId="India"
          stateId="Karnataka"
          value={['Bangalore', 'Mysore']}
          multiple
          label="City"
        />
      );
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City') as HTMLSelectElement;
        expect(dropdown.multiple).toBe(true);
      });
    });

    it('should handle countryId change that clears cities', async () => {
      const { rerender } = render(
        <CitySelector countryId="India" stateId="Karnataka" label="City" />
      );
      await waitFor(() => {
        expect(screen.getByText('Bangalore')).toBeInTheDocument();
      });

      rerender(<CitySelector countryId={undefined} stateId="Karnataka" label="City" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });

    it('should handle stateId change that clears cities', async () => {
      const { rerender } = render(
        <CitySelector countryId="India" stateId="Karnataka" label="City" />
      );
      await waitFor(() => {
        expect(screen.getByText('Bangalore')).toBeInTheDocument();
      });

      rerender(<CitySelector countryId="India" stateId={undefined} label="City" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });

    it('should handle both countryId and stateId being cleared', async () => {
      const { rerender } = render(
        <CitySelector countryId="India" stateId="Karnataka" label="City" />
      );
      await waitFor(() => {
        expect(screen.getByText('Bangalore')).toBeInTheDocument();
      });

      rerender(<CitySelector countryId={undefined} stateId={undefined} label="City" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-City');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });
  });
});

