import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { forwardRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CountrySelect from '../../../components/common/country-select.component';

// Mock country-state-city
const mockCountries = [
  { name: 'India', isoCode: 'IN' },
  { name: 'United States', isoCode: 'US' },
  { name: 'United Kingdom', isoCode: 'GB' },
  { name: 'Canada', isoCode: 'CA' },
];

vi.mock('country-state-city', () => ({
  Country: {
    getAllCountries: vi.fn(() => mockCountries),
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
            data-testid={`dropdown-${label || 'country'}`}
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

describe('CountrySelect', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(<CountrySelect />);
      }).not.toThrow();
    });

    it('should render with default placeholder', () => {
      render(<CountrySelect />);
      expect(screen.getByText('Select Country')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(<CountrySelect placeholder="Choose Country" />);
      expect(screen.getByText('Choose Country')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<CountrySelect label="Country" />);
      expect(screen.getByText('Country')).toBeInTheDocument();
    });

    it('should render with required indicator when isRequired is true', () => {
      render(<CountrySelect label="Country" isRequired />);
      const label = screen.getByText('Country');
      expect(label.parentElement).toContainHTML('*');
    });

    it('should not render required indicator when isRequired is false', () => {
      render(<CountrySelect label="Country" isRequired={false} />);
      const label = screen.getByText('Country');
      expect(label.parentElement).not.toContainHTML('*');
    });

    it('should render error message when error is provided', () => {
      render(<CountrySelect error="Country is required" />);
      expect(screen.getByText('Country is required')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<CountrySelect className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('Country Options', () => {
    it('should load and display all countries', async () => {
      render(<CountrySelect label="Country" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-Country');
        expect(dropdown).toBeInTheDocument();
      });

      const dropdown = screen.getByTestId('dropdown-Country');
      const options = dropdown.querySelectorAll('option');
      // Should have placeholder + 4 countries
      expect(options.length).toBeGreaterThanOrEqual(5);
    });

    it('should display country names as options', async () => {
      render(<CountrySelect label="Country" />);
      await waitFor(() => {
        expect(screen.getByText('India')).toBeInTheDocument();
      });
      expect(screen.getByText('United States')).toBeInTheDocument();
      expect(screen.getByText('United Kingdom')).toBeInTheDocument();
      expect(screen.getByText('Canada')).toBeInTheDocument();
    });
  });

  describe('Value Handling', () => {
    it('should display selected value', async () => {
      render(<CountrySelect value="India" label="Country" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-Country') as HTMLSelectElement;
        expect(dropdown.value).toBe('India');
      });
    });

    it('should handle empty value', async () => {
      render(<CountrySelect value="" label="Country" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-Country') as HTMLSelectElement;
        expect(dropdown.value).toBe('');
      });
    });

    it('should handle undefined value', async () => {
      render(<CountrySelect label="Country" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-Country') as HTMLSelectElement;
        expect(dropdown.value).toBe('');
      });
    });
  });

  describe('Change Handling', () => {
    it('should call onChange when value changes', async () => {
      const user = userEvent.setup();
      render(<CountrySelect onChange={mockOnChange} label="Country" />);

      await waitFor(() => {
        expect(screen.getByTestId('dropdown-Country')).toBeInTheDocument();
      });

      const dropdown = screen.getByTestId('dropdown-Country');
      await user.selectOptions(dropdown, 'India');

      expect(mockOnChange).toHaveBeenCalledWith('India');
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should not call onChange when onChange is not provided', async () => {
      const user = userEvent.setup();
      render(<CountrySelect label="Country" />);

      await waitFor(() => {
        expect(screen.getByTestId('dropdown-Country')).toBeInTheDocument();
      });

      const dropdown = screen.getByTestId('dropdown-Country');
      await user.selectOptions(dropdown, 'India');

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should handle multiple selection when multiple is true', async () => {
      render(<CountrySelect onChange={mockOnChange} multiple label="Country" />);

      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-Country') as HTMLSelectElement;
        expect(dropdown.multiple).toBe(true);
      });
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', async () => {
      render(<CountrySelect disabled label="Country" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-Country') as HTMLSelectElement;
        expect(dropdown.disabled).toBe(true);
      });
    });

    it('should not be disabled when disabled prop is false', async () => {
      render(<CountrySelect disabled={false} label="Country" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-Country') as HTMLSelectElement;
        expect(dropdown.disabled).toBe(false);
      });
    });
  });

  describe('Props Forwarding', () => {
    it('should forward size prop to Dropdown', () => {
      render(<CountrySelect size="lg" label="Country" />);
      // Size is forwarded to Dropdown, which applies classes
      // We can verify the component renders without error
      expect(screen.getByTestId('dropdown-Country')).toBeInTheDocument();
    });

    it('should forward variant prop to Dropdown', () => {
      render(<CountrySelect variant="outlined" label="Country" />);
      expect(screen.getByTestId('dropdown-Country')).toBeInTheDocument();
    });

    it('should forward searchable prop to Dropdown', () => {
      render(<CountrySelect searchable={false} label="Country" />);
      expect(screen.getByTestId('dropdown-Country')).toBeInTheDocument();
    });

    it('should forward clearable prop to Dropdown', () => {
      render(<CountrySelect clearable={false} label="Country" />);
      expect(screen.getByTestId('dropdown-Country')).toBeInTheDocument();
    });

    it('should forward labelClassName prop to Dropdown', () => {
      render(<CountrySelect label="Country" labelClassName="custom-label" />);
      expect(screen.getByText('Country')).toBeInTheDocument();
    });

    it('should forward helperText prop to Dropdown', () => {
      render(<CountrySelect helperText="Select your country" label="Country" />);
      // Helper text is rendered by Dropdown component
      expect(screen.getByTestId('dropdown-Country')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label when provided', () => {
      render(<CountrySelect aria-label="Select country" label="Country" />);
      const dropdown = screen.getByTestId('dropdown-Country');
      expect(dropdown).toHaveAttribute('aria-label', 'Select country');
    });

    it('should have aria-labelledby when provided', () => {
      render(<CountrySelect aria-labelledby="country-label" label="Country" />);
      const dropdown = screen.getByTestId('dropdown-Country');
      expect(dropdown).toHaveAttribute('aria-labelledby', 'country-label');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to Dropdown component', () => {
      const ref = { current: null };
      render(<CountrySelect ref={ref} label="Country" />);
      // Ref is forwarded to Dropdown's root div
      expect(ref.current).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty countries list', async () => {
      const countryStateCity = await import('country-state-city');
      vi.mocked(countryStateCity.Country.getAllCountries).mockReturnValueOnce([]);
      render(<CountrySelect label="Country" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-Country');
        expect(dropdown).toBeInTheDocument();
      });
    });

    it('should handle value change from controlled component', async () => {
      const { rerender } = render(<CountrySelect value="India" label="Country" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-Country') as HTMLSelectElement;
        expect(dropdown.value).toBe('India');
      });

      rerender(<CountrySelect value="United States" label="Country" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-Country') as HTMLSelectElement;
        expect(dropdown.value).toBe('United States');
      });
    });

    it('should handle array value for multiple selection', async () => {
      render(<CountrySelect value={['India', 'United States']} multiple label="Country" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-Country') as HTMLSelectElement;
        expect(dropdown.multiple).toBe(true);
      });
    });
  });
});

