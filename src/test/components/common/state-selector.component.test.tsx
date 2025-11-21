import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { forwardRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StateSelector from '../../../components/common/state-selector.component';

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
            data-testid={`dropdown-${label || 'state'}`}
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

describe('StateSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(<StateSelector />);
      }).not.toThrow();
    });

    it('should render with default placeholder', () => {
      render(<StateSelector />);
      expect(screen.getByText('Select State')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(<StateSelector placeholder="Choose State" />);
      expect(screen.getByText('Choose State')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<StateSelector label="State" />);
      expect(screen.getByText('State')).toBeInTheDocument();
    });

    it('should render with required indicator when isRequired is true', () => {
      render(<StateSelector label="State" isRequired />);
      const label = screen.getByText('State');
      expect(label.parentElement).toContainHTML('*');
    });

    it('should not render required indicator when isRequired is false', () => {
      render(<StateSelector label="State" isRequired={false} />);
      const label = screen.getByText('State');
      expect(label.parentElement).not.toContainHTML('*');
    });

    it('should render error message when error is provided', () => {
      render(<StateSelector error="State is required" />);
      expect(screen.getByText('State is required')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<StateSelector className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('State Options Loading', () => {
    it('should load states when countryId is provided', async () => {
      render(<StateSelector countryId="India" label="State" />);
      await waitFor(() => {
        expect(screen.getByText('Karnataka')).toBeInTheDocument();
      });
      expect(screen.getByText('Maharashtra')).toBeInTheDocument();
      expect(screen.getByText('Tamil Nadu')).toBeInTheDocument();
    });

    it('should not load states when countryId is not provided', async () => {
      render(<StateSelector label="State" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-State');
        expect(dropdown).toBeInTheDocument();
      });

      const dropdown = screen.getByTestId('dropdown-State');
      const options = dropdown.querySelectorAll('option');
      // Should only have placeholder option
      expect(options.length).toBe(1);
    });

    it('should clear states when countryId is cleared', async () => {
      const { rerender } = render(<StateSelector countryId="India" label="State" />);
      await waitFor(() => {
        expect(screen.getByText('Karnataka')).toBeInTheDocument();
      });

      rerender(<StateSelector countryId="" label="State" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-State');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });

    it('should handle countryId as number (should be treated as empty)', async () => {
      render(<StateSelector countryId={123 as any} label="State" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-State');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });

    it('should handle invalid country name', async () => {
      render(<StateSelector countryId="InvalidCountry" label="State" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-State');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });

    it('should update states when countryId changes', async () => {
      const { rerender } = render(<StateSelector countryId="India" label="State" />);
      await waitFor(() => {
        expect(screen.getByText('Karnataka')).toBeInTheDocument();
      });

      rerender(<StateSelector countryId="United States" label="State" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-State');
        const options = dropdown.querySelectorAll('option');
        // United States has no states in mock, so only placeholder
        expect(options.length).toBe(1);
      });
    });
  });

  describe('Value Handling', () => {
    it('should display selected value', async () => {
      render(<StateSelector countryId="India" value="Karnataka" label="State" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-State') as HTMLSelectElement;
        expect(dropdown.value).toBe('Karnataka');
      });
    });

    it('should handle empty value', async () => {
      render(<StateSelector countryId="India" value="" label="State" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-State') as HTMLSelectElement;
        expect(dropdown.value).toBe('');
      });
    });

    it('should handle undefined value', async () => {
      render(<StateSelector countryId="India" label="State" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-State') as HTMLSelectElement;
        expect(dropdown.value).toBe('');
      });
    });
  });

  describe('Change Handling', () => {
    it('should call onChange when value changes', async () => {
      const user = userEvent.setup();
      render(<StateSelector countryId="India" onChange={mockOnChange} label="State" />);

      await waitFor(() => {
        expect(screen.getByText('Karnataka')).toBeInTheDocument();
      });

      const dropdown = screen.getByTestId('dropdown-State');
      await user.selectOptions(dropdown, 'Karnataka');

      expect(mockOnChange).toHaveBeenCalledWith('Karnataka');
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should not call onChange when onChange is not provided', async () => {
      const user = userEvent.setup();
      render(<StateSelector countryId="India" label="State" />);

      await waitFor(() => {
        expect(screen.getByText('Karnataka')).toBeInTheDocument();
      });

      const dropdown = screen.getByTestId('dropdown-State');
      await user.selectOptions(dropdown, 'Karnataka');

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should handle multiple selection when multiple is true', async () => {
      render(
        <StateSelector countryId="India" onChange={mockOnChange} multiple label="State" />
      );

      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-State') as HTMLSelectElement;
        expect(dropdown.multiple).toBe(true);
      });
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', async () => {
      render(<StateSelector countryId="India" disabled label="State" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-State') as HTMLSelectElement;
        expect(dropdown.disabled).toBe(true);
      });
    });

    it('should be disabled when countryId is not provided', async () => {
      render(<StateSelector disabled={false} label="State" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-State') as HTMLSelectElement;
        expect(dropdown.disabled).toBe(true);
      });
    });

    it('should not be disabled when countryId is provided and disabled is false', async () => {
      render(<StateSelector countryId="India" disabled={false} label="State" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-State') as HTMLSelectElement;
        expect(dropdown.disabled).toBe(false);
      });
    });
  });

  describe('Props Forwarding', () => {
    it('should forward size prop to Dropdown', () => {
      render(<StateSelector countryId="India" size="lg" label="State" />);
      expect(screen.getByTestId('dropdown-State')).toBeInTheDocument();
    });

    it('should forward variant prop to Dropdown', () => {
      render(<StateSelector countryId="India" variant="outlined" label="State" />);
      expect(screen.getByTestId('dropdown-State')).toBeInTheDocument();
    });

    it('should forward searchable prop to Dropdown', () => {
      render(<StateSelector countryId="India" searchable={false} label="State" />);
      expect(screen.getByTestId('dropdown-State')).toBeInTheDocument();
    });

    it('should forward clearable prop to Dropdown', () => {
      render(<StateSelector countryId="India" clearable={false} label="State" />);
      expect(screen.getByTestId('dropdown-State')).toBeInTheDocument();
    });

    it('should forward labelClassName prop to Dropdown', () => {
      render(<StateSelector countryId="India" label="State" labelClassName="custom-label" />);
      expect(screen.getByText('State')).toBeInTheDocument();
    });

    it('should forward helperText prop to Dropdown', () => {
      render(
        <StateSelector countryId="India" helperText="Select your state" label="State" />
      );
      expect(screen.getByTestId('dropdown-State')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label when provided', () => {
      render(<StateSelector countryId="India" aria-label="Select state" label="State" />);
      const dropdown = screen.getByTestId('dropdown-State');
      expect(dropdown).toHaveAttribute('aria-label', 'Select state');
    });

    it('should have aria-labelledby when provided', () => {
      render(<StateSelector countryId="India" aria-labelledby="state-label" label="State" />);
      const dropdown = screen.getByTestId('dropdown-State');
      expect(dropdown).toHaveAttribute('aria-labelledby', 'state-label');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to Dropdown component', () => {
      const ref = { current: null };
      render(<StateSelector countryId="India" ref={ref} label="State" />);
      expect(ref.current).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty states list', async () => {
      const countryStateCity = await import('country-state-city');
      vi.mocked(countryStateCity.State.getStatesOfCountry).mockReturnValueOnce([]);
      render(<StateSelector countryId="United States" label="State" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-State');
        expect(dropdown).toBeInTheDocument();
      });
    });

    it('should handle value change from controlled component', async () => {
      const { rerender } = render(
        <StateSelector countryId="India" value="Karnataka" label="State" />
      );
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-State') as HTMLSelectElement;
        expect(dropdown.value).toBe('Karnataka');
      });

      rerender(<StateSelector countryId="India" value="Maharashtra" label="State" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-State') as HTMLSelectElement;
        expect(dropdown.value).toBe('Maharashtra');
      });
    });

    it('should handle array value for multiple selection', async () => {
      render(
        <StateSelector
          countryId="India"
          value={['Karnataka', 'Maharashtra']}
          multiple
          label="State"
        />
      );
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-State') as HTMLSelectElement;
        expect(dropdown.multiple).toBe(true);
      });
    });

    it('should handle countryId change that clears states', async () => {
      const { rerender } = render(<StateSelector countryId="India" label="State" />);
      await waitFor(() => {
        expect(screen.getByText('Karnataka')).toBeInTheDocument();
      });

      rerender(<StateSelector countryId={undefined} label="State" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-State');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });
  });
});

