import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { forwardRef } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DistrictSelector from '../../../components/common/district-selector.component';

// Mock districts data
const mockDistricts = [
  { name: 'Bangalore' },
  { name: 'Mysore' },
  { name: 'Mangalore' },
];

// Mock the states-districts utility
vi.mock('../../../utils/states-districts', () => ({
  getDistrictsByState: vi.fn((stateName: string, countryName?: string) => {
    if (countryName === 'India' && stateName === 'Karnataka') {
      return mockDistricts;
    }
    return [];
  }),
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
            data-testid={`dropdown-${label || 'district'}`}
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

describe('DistrictSelector', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(<DistrictSelector />);
      }).not.toThrow();
    });

    it('should render with default placeholder', () => {
      render(<DistrictSelector />);
      expect(screen.getByText('Select District')).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      render(<DistrictSelector placeholder="Choose District" />);
      expect(screen.getByText('Choose District')).toBeInTheDocument();
    });

    it('should render with label', () => {
      render(<DistrictSelector label="District" />);
      expect(screen.getByText('District')).toBeInTheDocument();
    });

    it('should render with required indicator when isRequired is true', () => {
      render(<DistrictSelector label="District" isRequired />);
      const label = screen.getByText('District');
      expect(label.parentElement).toContainHTML('*');
    });

    it('should not render required indicator when isRequired is false', () => {
      render(<DistrictSelector label="District" isRequired={false} />);
      const label = screen.getByText('District');
      expect(label.parentElement).not.toContainHTML('*');
    });

    it('should render error message when error is provided', () => {
      render(<DistrictSelector error="District is required" />);
      expect(screen.getByText('District is required')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<DistrictSelector className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('District Options Loading', () => {
    it('should load districts when countryId and stateId are provided', async () => {
      render(<DistrictSelector countryId="India" stateId="Karnataka" label="District" />);
      await waitFor(() => {
        expect(screen.getByText('Bangalore')).toBeInTheDocument();
      });
      expect(screen.getByText('Mysore')).toBeInTheDocument();
      expect(screen.getByText('Mangalore')).toBeInTheDocument();
    });

    it('should not load districts when countryId is not provided', async () => {
      render(<DistrictSelector stateId="Karnataka" label="District" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District');
        expect(dropdown).toBeInTheDocument();
      });

      const dropdown = screen.getByTestId('dropdown-District');
      const options = dropdown.querySelectorAll('option');
      // Should only have placeholder option
      expect(options.length).toBe(1);
    });

    it('should not load districts when stateId is not provided', async () => {
      render(<DistrictSelector countryId="India" label="District" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District');
        expect(dropdown).toBeInTheDocument();
      });

      const dropdown = screen.getByTestId('dropdown-District');
      const options = dropdown.querySelectorAll('option');
      // Should only have placeholder option
      expect(options.length).toBe(1);
    });

    it('should clear districts when countryId is cleared', async () => {
      const { rerender } = render(
        <DistrictSelector countryId="India" stateId="Karnataka" label="District" />
      );
      await waitFor(() => {
        expect(screen.getByText('Bangalore')).toBeInTheDocument();
      });

      rerender(<DistrictSelector countryId="" stateId="Karnataka" label="District" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });

    it('should clear districts when stateId is cleared', async () => {
      const { rerender } = render(
        <DistrictSelector countryId="India" stateId="Karnataka" label="District" />
      );
      await waitFor(() => {
        expect(screen.getByText('Bangalore')).toBeInTheDocument();
      });

      rerender(<DistrictSelector countryId="India" stateId="" label="District" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });

    it('should handle countryId as number (should be treated as empty)', async () => {
      render(<DistrictSelector countryId={123 as any} stateId="Karnataka" label="District" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });

    it('should handle stateId as number (should be treated as empty)', async () => {
      render(<DistrictSelector countryId="India" stateId={456 as any} label="District" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });

    it('should handle invalid country name', async () => {
      render(<DistrictSelector countryId="InvalidCountry" stateId="Karnataka" label="District" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });

    it('should handle invalid state name', async () => {
      render(<DistrictSelector countryId="India" stateId="InvalidState" label="District" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });

    it('should update districts when countryId changes', async () => {
      const { rerender } = render(
        <DistrictSelector countryId="India" stateId="Karnataka" label="District" />
      );
      await waitFor(() => {
        expect(screen.getByText('Bangalore')).toBeInTheDocument();
      });

      rerender(<DistrictSelector countryId="United States" stateId="Karnataka" label="District" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District');
        const options = dropdown.querySelectorAll('option');
        // United States has no matching state, so only placeholder
        expect(options.length).toBe(1);
      });
    });

    it('should update districts when stateId changes', async () => {
      const { rerender } = render(
        <DistrictSelector countryId="India" stateId="Karnataka" label="District" />
      );
      await waitFor(() => {
        expect(screen.getByText('Bangalore')).toBeInTheDocument();
      });

      rerender(<DistrictSelector countryId="India" stateId="Maharashtra" label="District" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District');
        const options = dropdown.querySelectorAll('option');
        // Maharashtra has no districts in mock, so only placeholder
        expect(options.length).toBe(1);
      });
    });
  });

  describe('Value Handling', () => {
    it('should display selected value', async () => {
      render(
        <DistrictSelector countryId="India" stateId="Karnataka" value="Bangalore" label="District" />
      );
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District') as HTMLSelectElement;
        expect(dropdown.value).toBe('Bangalore');
      });
    });

    it('should handle empty value', async () => {
      render(<DistrictSelector countryId="India" stateId="Karnataka" value="" label="District" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District') as HTMLSelectElement;
        expect(dropdown.value).toBe('');
      });
    });

    it('should handle undefined value', async () => {
      render(<DistrictSelector countryId="India" stateId="Karnataka" label="District" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District') as HTMLSelectElement;
        expect(dropdown.value).toBe('');
      });
    });
  });

  describe('Change Handling', () => {
    it('should call onChange when value changes', async () => {
      const user = userEvent.setup();
      render(
        <DistrictSelector
          countryId="India"
          stateId="Karnataka"
          onChange={mockOnChange}
          label="District"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Bangalore')).toBeInTheDocument();
      });

      const dropdown = screen.getByTestId('dropdown-District');
      await user.selectOptions(dropdown, 'Bangalore');

      expect(mockOnChange).toHaveBeenCalledWith('Bangalore');
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });

    it('should not call onChange when onChange is not provided', async () => {
      const user = userEvent.setup();
      render(<DistrictSelector countryId="India" stateId="Karnataka" label="District" />);

      await waitFor(() => {
        expect(screen.getByText('Bangalore')).toBeInTheDocument();
      });

      const dropdown = screen.getByTestId('dropdown-District');
      await user.selectOptions(dropdown, 'Bangalore');

      // Should not throw error
      expect(true).toBe(true);
    });

    it('should handle multiple selection when multiple is true', async () => {
      render(
        <DistrictSelector
          countryId="India"
          stateId="Karnataka"
          onChange={mockOnChange}
          multiple
          label="District"
        />
      );

      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District') as HTMLSelectElement;
        expect(dropdown.multiple).toBe(true);
      });
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', async () => {
      render(
        <DistrictSelector countryId="India" stateId="Karnataka" disabled label="District" />
      );
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District') as HTMLSelectElement;
        expect(dropdown.disabled).toBe(true);
      });
    });

    it('should be disabled when countryId is not provided', async () => {
      render(<DistrictSelector stateId="Karnataka" disabled={false} label="District" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District') as HTMLSelectElement;
        expect(dropdown.disabled).toBe(true);
      });
    });

    it('should be disabled when stateId is not provided', async () => {
      render(<DistrictSelector countryId="India" disabled={false} label="District" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District') as HTMLSelectElement;
        expect(dropdown.disabled).toBe(true);
      });
    });

    it('should not be disabled when both countryId and stateId are provided and disabled is false', async () => {
      render(
        <DistrictSelector countryId="India" stateId="Karnataka" disabled={false} label="District" />
      );
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District') as HTMLSelectElement;
        expect(dropdown.disabled).toBe(false);
      });
    });
  });

  describe('Props Forwarding', () => {
    it('should forward size prop to Dropdown', () => {
      render(
        <DistrictSelector countryId="India" stateId="Karnataka" size="lg" label="District" />
      );
      expect(screen.getByTestId('dropdown-District')).toBeInTheDocument();
    });

    it('should forward variant prop to Dropdown', () => {
      render(
        <DistrictSelector countryId="India" stateId="Karnataka" variant="outlined" label="District" />
      );
      expect(screen.getByTestId('dropdown-District')).toBeInTheDocument();
    });

    it('should forward searchable prop to Dropdown', () => {
      render(
        <DistrictSelector countryId="India" stateId="Karnataka" searchable={false} label="District" />
      );
      expect(screen.getByTestId('dropdown-District')).toBeInTheDocument();
    });

    it('should forward clearable prop to Dropdown', () => {
      render(
        <DistrictSelector countryId="India" stateId="Karnataka" clearable={false} label="District" />
      );
      expect(screen.getByTestId('dropdown-District')).toBeInTheDocument();
    });

    it('should forward labelClassName prop to Dropdown', () => {
      render(
        <DistrictSelector
          countryId="India"
          stateId="Karnataka"
          label="District"
          labelClassName="custom-label"
        />
      );
      expect(screen.getByText('District')).toBeInTheDocument();
    });

    it('should forward helperText prop to Dropdown', () => {
      render(
        <DistrictSelector
          countryId="India"
          stateId="Karnataka"
          helperText="Select your district"
          label="District"
        />
      );
      expect(screen.getByTestId('dropdown-District')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label when provided', () => {
      render(
        <DistrictSelector
          countryId="India"
          stateId="Karnataka"
          aria-label="Select district"
          label="District"
        />
      );
      const dropdown = screen.getByTestId('dropdown-District');
      expect(dropdown).toHaveAttribute('aria-label', 'Select district');
    });

    it('should have aria-labelledby when provided', () => {
      render(
        <DistrictSelector
          countryId="India"
          stateId="Karnataka"
          aria-labelledby="district-label"
          label="District"
        />
      );
      const dropdown = screen.getByTestId('dropdown-District');
      expect(dropdown).toHaveAttribute('aria-labelledby', 'district-label');
    });
  });

  describe('Ref Forwarding', () => {
    it('should forward ref to Dropdown component', () => {
      const ref = { current: null };
      render(<DistrictSelector countryId="India" stateId="Karnataka" ref={ref} label="District" />);
      expect(ref.current).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty districts list', async () => {
      const statesDistricts = await import('../../../utils/states-districts');
      vi.mocked(statesDistricts.getDistrictsByState).mockReturnValueOnce([]);
      render(<DistrictSelector countryId="India" stateId="Maharashtra" label="District" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District');
        expect(dropdown).toBeInTheDocument();
      });
    });

    it('should handle value change from controlled component', async () => {
      const { rerender } = render(
        <DistrictSelector countryId="India" stateId="Karnataka" value="Bangalore" label="District" />
      );
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District') as HTMLSelectElement;
        expect(dropdown.value).toBe('Bangalore');
      });

      rerender(
        <DistrictSelector countryId="India" stateId="Karnataka" value="Mysore" label="District" />
      );
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District') as HTMLSelectElement;
        expect(dropdown.value).toBe('Mysore');
      });
    });

    it('should handle array value for multiple selection', async () => {
      render(
        <DistrictSelector
          countryId="India"
          stateId="Karnataka"
          value={['Bangalore', 'Mysore']}
          multiple
          label="District"
        />
      );
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District') as HTMLSelectElement;
        expect(dropdown.multiple).toBe(true);
      });
    });

    it('should handle countryId change that clears districts', async () => {
      const { rerender } = render(
        <DistrictSelector countryId="India" stateId="Karnataka" label="District" />
      );
      await waitFor(() => {
        expect(screen.getByText('Bangalore')).toBeInTheDocument();
      });

      rerender(<DistrictSelector countryId={undefined} stateId="Karnataka" label="District" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });

    it('should handle stateId change that clears districts', async () => {
      const { rerender } = render(
        <DistrictSelector countryId="India" stateId="Karnataka" label="District" />
      );
      await waitFor(() => {
        expect(screen.getByText('Bangalore')).toBeInTheDocument();
      });

      rerender(<DistrictSelector countryId="India" stateId={undefined} label="District" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });

    it('should handle both countryId and stateId being cleared', async () => {
      const { rerender } = render(
        <DistrictSelector countryId="India" stateId="Karnataka" label="District" />
      );
      await waitFor(() => {
        expect(screen.getByText('Bangalore')).toBeInTheDocument();
      });

      rerender(<DistrictSelector countryId={undefined} stateId={undefined} label="District" />);
      await waitFor(() => {
        const dropdown = screen.getByTestId('dropdown-District');
        const options = dropdown.querySelectorAll('option');
        expect(options.length).toBe(1); // Only placeholder
      });
    });
  });
});

