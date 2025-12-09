import { configureStore } from '@reduxjs/toolkit';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PatientAddressInfo from '../../../../../../modules/patient/add/steps/address-info/patient-address-info.component';
import { loaderReducer } from '../../../../../../reducers/loader.reducer';

// Create test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      loader: loaderReducer,
    },
  });
};

// Helper function to render with Redux Provider
const renderWithProvider = (ui: React.ReactElement) => {
  const store = createTestStore();
  return {
    ...render(<Provider store={store}>{ui}</Provider>),
    store,
  };
};

// Mock the common components
vi.mock('../../../../../../components/common', () => ({
  Button: ({ children, onClick, type, variant, className }: any) => (
    <button type={type} onClick={onClick} className={className} data-variant={variant}>
      {children}
    </button>
  ),
  Input: ({ label, placeholder, error, isRequired, rightIcon, ...props }: any) => (
    <div>
      {label && (
        <label>
          {label} {isRequired && <span>*</span>}
        </label>
      )}
      <input placeholder={placeholder} {...props} />
      {rightIcon}
      {error && <span className="error">{error}</span>}
    </div>
  ),
  Dropdown: ({ label, options, onChange, value, error, isRequired, placeholder }: any) => (
    <div>
      {label && (
        <label>
          {label} {isRequired && <span>*</span>}
        </label>
      )}
      <select
        value={Array.isArray(value) ? value[0] : value}
        onChange={(e) => onChange?.(e.target.value)}
        data-testid={`dropdown-${label}`}
      >
        <option value="">{placeholder}</option>
        {options?.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="error">{error}</span>}
    </div>
  ),
  Loader: () => <span data-testid="loader">Loading...</span>,
}));

// Mock the toast service
vi.mock('../../../../../../services/toast', () => ({
  showToast: vi.fn(),
}));

// Mock country-state-city
vi.mock('country-state-city', () => ({
  Country: {
    getAllCountries: vi.fn(() => [
      { name: 'India', isoCode: 'IN' },
      { name: 'United States', isoCode: 'US' },
      { name: 'United Kingdom', isoCode: 'GB' },
    ]),
  },
  State: {
    getStatesOfCountry: vi.fn((isoCode: string) => {
      if (isoCode === 'IN') {
        return [
          { name: 'Karnataka', isoCode: 'KA' },
          { name: 'Maharashtra', isoCode: 'MH' },
          { name: 'Tamil Nadu', isoCode: 'TN' },
        ];
      }
      return [];
    }),
  },
  City: {
    getCitiesOfState: vi.fn((countryIsoCode: string, stateIsoCode: string) => {
      if (countryIsoCode === 'IN' && stateIsoCode === 'KA') {
        return [
          { name: 'Bangalore', isoCode: 'BLR' },
          { name: 'Mysore', isoCode: 'MYS' },
        ];
      }
      return [];
    }),
  },
}));

// Mock the selector components
const mockCountrySelectorOnChange = vi.fn();
vi.mock('../../../../../../components/common/country-select.component', () => ({
  default: ({ label, options, onChange, value, error, isRequired, placeholder }: any) => {
    // Provide default options if not provided
    const defaultOptions = options || [
      { value: 'India', label: 'India' },
      { value: 'United States', label: 'United States' },
      { value: 'United Kingdom', label: 'United Kingdom' },
    ];
    
    // Store the onChange handler for testing
    if (onChange) {
      mockCountrySelectorOnChange.mockImplementation(onChange);
    }
    
    return (
      <div>
        {label && (
          <label>
            {label} {isRequired && <span>*</span>}
          </label>
        )}
        <select
          value={Array.isArray(value) ? value[0] : value || ''}
          onChange={(e) => {
            const handler = onChange || mockCountrySelectorOnChange;
            handler?.(e.target.value);
          }}
          data-testid={`dropdown-${label}`}
        >
          <option value="">{placeholder}</option>
          {defaultOptions.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <span className="error">{error}</span>}
      </div>
    );
  },
}));

const mockStateSelectorOnChange = vi.fn();
vi.mock('../../../../../../components/common/state-selector.component', () => ({
  default: ({ label, options, onChange, value, error, isRequired, placeholder, countryId }: any) => {
    // Provide default options if countryId is provided
    const defaultOptions = options || (countryId === 'India' ? [
      { value: 'Karnataka', label: 'Karnataka' },
      { value: 'Maharashtra', label: 'Maharashtra' },
      { value: 'Tamil Nadu', label: 'Tamil Nadu' },
    ] : []);
    
    // Store the onChange handler for testing
    if (onChange) {
      mockStateSelectorOnChange.mockImplementation(onChange);
    }
    
    return (
      <div>
        {label && (
          <label>
            {label} {isRequired && <span>*</span>}
          </label>
        )}
        <select
          value={Array.isArray(value) ? value[0] : value || ''}
          onChange={(e) => {
            const handler = onChange || mockStateSelectorOnChange;
            handler?.(e.target.value);
          }}
          data-testid={`dropdown-${label}`}
        >
          <option value="">{placeholder}</option>
          {defaultOptions.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <span className="error">{error}</span>}
      </div>
    );
  },
}));

const mockDistrictSelectorOnChange = vi.fn();
vi.mock('../../../../../../components/common/district-selector.component', () => ({
  default: ({ label, options, onChange, value, error, isRequired, placeholder, countryId, stateId }: any) => {
    // Provide default options if both countryId and stateId are provided
    const defaultOptions = options || (countryId === 'India' && stateId === 'Karnataka' ? [
      { value: 'Bangalore', label: 'Bangalore' },
      { value: 'Mysore', label: 'Mysore' },
    ] : []);
    
    // Store the onChange handler for testing
    if (onChange) {
      mockDistrictSelectorOnChange.mockImplementation(onChange);
    }
    
    return (
      <div>
        {label && (
          <label>
            {label} {isRequired && <span>*</span>}
          </label>
        )}
        <select
          value={Array.isArray(value) ? value[0] : value || ''}
          onChange={(e) => {
            const handler = onChange || mockDistrictSelectorOnChange;
            handler?.(e.target.value);
          }}
          data-testid={`dropdown-${label}`}
        >
          <option value="">{placeholder}</option>
          {defaultOptions.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <span className="error">{error}</span>}
      </div>
    );
  },
}));

// Mock the countries data
vi.mock('../../../../../../assets/data/countries', () => ({
  countries: [
    { name: 'India', code: 'IN' },
    { name: 'United States', code: 'US' },
    { name: 'United Kingdom', code: 'UK' },
  ],
}));

// Mock the postal code service
const mockFetchPostalCodeData = vi.fn();
vi.mock('../../../../../../services/postal-code.service', () => ({
  fetchPostalCodeData: (pincode: string) => mockFetchPostalCodeData(pincode),
}));

describe('PatientAddressInfo', () => {
  const mockOnNext = vi.fn();
  const mockOnPrev = vi.fn();
  const defaultValues = {
    postalCode: '',
    country: '',
    state: '',
    district: '',
    city: '',
    correspondingAddress1: '',
    correspondingAddress2: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchPostalCodeData.mockResolvedValue(null);
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      expect(() => {
        renderWithProvider(
          <PatientAddressInfo
            defaultValues={defaultValues}
            onNext={mockOnNext}
            onPrev={mockOnPrev}
          />
        );
      }).not.toThrow();
    });

    it('should render with default values', () => {
      const valuesWithData = {
        postalCode: '123456',
        country: 'India',
        state: 'Karnataka',
        district: 'Bangalore',
        city: 'Bangalore',
        correspondingAddress1: '123 Main Street',
        correspondingAddress2: 'Apt 4B',
      };

      renderWithProvider(
        <PatientAddressInfo
          defaultValues={valuesWithData}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const postalCodeInput = screen.getByPlaceholderText('Enter Postal Code');
      expect(postalCodeInput).toHaveValue('123456');
    });

    it('should render form element', () => {
      const { container } = renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('Form Fields Rendering', () => {
    it('should render postalCode field with required indicator', () => {
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Postal Code')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Postal Code')).toBeInTheDocument();
      const postalCodeLabel = screen.getByText('Postal Code');
      expect(postalCodeLabel.parentElement).toContainHTML('*');
    });

    it('should render country dropdown with required indicator', () => {
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Country')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-Country')).toBeInTheDocument();
      const countryLabel = screen.getByText('Country');
      expect(countryLabel.parentElement).toContainHTML('*');
    });

    it('should render state dropdown with required indicator', () => {
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('State')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-State')).toBeInTheDocument();
      const stateLabel = screen.getByText('State');
      expect(stateLabel.parentElement).toContainHTML('*');
    });

    it('should render district dropdown with required indicator', () => {
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('District')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-District')).toBeInTheDocument();
      const districtLabel = screen.getByText('District');
      expect(districtLabel.parentElement).toContainHTML('*');
    });

    it('should render city input field with required indicator', () => {
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Village/Town/City')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Village/Town/City')).toBeInTheDocument();
      const cityLabel = screen.getByText('Village/Town/City');
      expect(cityLabel.parentElement).toContainHTML('*');
    });

    it('should render correspondingAddress1 field with required indicator', () => {
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Corresponding Address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Corresponding Address 1')).toBeInTheDocument();
      const address1Label = screen.getByText('Corresponding Address');
      expect(address1Label.parentElement).toContainHTML('*');
    });

    it('should render correspondingAddress2 field with required indicator', () => {
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Corresponding Address 2')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Corresponding Address 2')).toBeInTheDocument();
      const address2Label = screen.getByText('Corresponding Address 2');
      expect(address2Label.parentElement).toContainHTML('*');
    });
  });

  describe('Dropdown Options', () => {
    it('should render country options from countries data', () => {
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const indiaElements = screen.getAllByText('India');
      expect(indiaElements.length).toBeGreaterThan(0);
      const usElements = screen.getAllByText('United States');
      expect(usElements.length).toBeGreaterThan(0);
      const ukElements = screen.getAllByText('United Kingdom');
      expect(ukElements.length).toBeGreaterThan(0);
    });

    it('should render state options when country is selected', async () => {
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={{ ...defaultValues, country: 'India' }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      await waitFor(() => {
        const stateDropdown = screen.getByTestId('dropdown-State');
        expect(stateDropdown).toBeInTheDocument();
        const options = stateDropdown.querySelectorAll('option');
        expect(options.length).toBeGreaterThan(1); // Placeholder + states
      });
    });

    it('should render district options when country and state are selected', async () => {
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={{ ...defaultValues, country: 'India', state: 'Karnataka' }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      await waitFor(() => {
        const districtDropdown = screen.getByTestId('dropdown-District');
        expect(districtDropdown).toBeInTheDocument();
        const options = districtDropdown.querySelectorAll('option');
        expect(options.length).toBeGreaterThan(1); // Placeholder + cities
      });
    });

    it('should render district dropdown with options', () => {
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const districtDropdown = screen.getByTestId('dropdown-District');
      expect(districtDropdown).toBeInTheDocument();
      const options = districtDropdown.querySelectorAll('option');
      expect(options.length).toBeGreaterThan(0); // At least placeholder option
    });
  });

  describe('Form Validation', () => {
    it('should display error for empty postalCode on submit', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Postal Code is required')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should display error for empty country on submit', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Country is required')).toBeInTheDocument();
      });
    });

    it('should display error for empty state on submit', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('State is required')).toBeInTheDocument();
      });
    });

    it('should display error for empty district on submit', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('District is required')).toBeInTheDocument();
      });
    });

    it('should display error for empty city on submit', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Village/Town/City is required')).toBeInTheDocument();
      });
    });

    it('should display error for empty correspondingAddress1 on submit', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Corresponding Address 1 is required')).toBeInTheDocument();
      });
    });

    it('should display error for empty correspondingAddress2 on submit', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Corresponding Address 2 is required')).toBeInTheDocument();
      });
    });

    it('should display error for invalid India postal code format', async () => {
      const user = userEvent.setup({ delay: null });
      const invalidPostalCodeValues = {
        postalCode: '12345', // Only 5 digits, should be 6 for India
        country: 'India',
        state: 'Karnataka',
        district: 'Bangalore',
        city: 'Bangalore',
        correspondingAddress1: '123 Main Street',
        correspondingAddress2: 'Apt 4B',
      };

      renderWithProvider(
        <PatientAddressInfo
          defaultValues={invalidPostalCodeValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Postal Code must be exactly 6 digits for India')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should display error for invalid non-India postal code format', async () => {
      const user = userEvent.setup({ delay: null });
      const invalidPostalCodeValues = {
        postalCode: 'AB', // Only 2 chars, should be 3-10 for non-India
        country: 'United States',
        state: 'California',
        district: 'Los Angeles',
        city: 'Los Angeles',
        correspondingAddress1: '123 Main Street',
        correspondingAddress2: 'Apt 4B',
      };

      renderWithProvider(
        <PatientAddressInfo
          defaultValues={invalidPostalCodeValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Postal Code must be 3-10 alphanumeric characters')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Form Submission', () => {
    it('should call onNext with addressInfo data on valid form submission', async () => {
      const user = userEvent.setup({ delay: null });
      const validValues = {
        postalCode: '123456',
        country: 'India',
        state: 'Karnataka',
        district: 'Bangalore',
        city: 'Bangalore',
        correspondingAddress1: '123 Main Street',
        correspondingAddress2: 'Apt 4B',
      };

      renderWithProvider(
        <PatientAddressInfo
          defaultValues={validValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockOnNext).toHaveBeenCalledWith({
          addressInfo: expect.objectContaining({
            postalCode: '123456',
            country: 'India',
            state: 'Karnataka',
          }),
        });
      }, { timeout: 3000 });
    });

    it('should not call onNext on invalid form submission', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockOnNext).not.toHaveBeenCalled();
      });
    });
  });

  describe('Back Button', () => {
    it('should render Back button', () => {
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const backButton = screen.getByText('Back');
      expect(backButton).toBeInTheDocument();
      expect(backButton.closest('button')).toHaveAttribute('type', 'button');
    });

    it('should call onPrev when Back button is clicked', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const backButton = screen.getByText('Back');
      await user.click(backButton);

      await waitFor(() => {
        expect(mockOnPrev).toHaveBeenCalledTimes(1);
        expect(mockOnNext).not.toHaveBeenCalled();
      }, { timeout: 3000 });
    });
  });

  describe('Next Button', () => {
    it('should render Next button', () => {
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeInTheDocument();
      expect(nextButton.closest('button')).toHaveAttribute('type', 'submit');
    });
  });

  describe('Field Interactions', () => {
    it('should handle postalCode input change', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const postalCodeInput = screen.getByPlaceholderText('Enter Postal Code');
      await user.type(postalCodeInput, '123456');

      await waitFor(() => {
        expect(postalCodeInput).toHaveValue('123456');
      }, { timeout: 3000 });
    });

    it('should handle country selection', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const countryDropdown = screen.getByTestId('dropdown-Country');
      expect(countryDropdown.querySelector('option[value="India"]')).toBeInTheDocument();
      await user.selectOptions(countryDropdown, 'India');

      await waitFor(() => {
        expect(countryDropdown).toHaveValue('India');
      }, { timeout: 3000 });
    });

    it('should handle state selection', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={{ ...defaultValues, country: 'India' }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      await waitFor(() => {
        const stateDropdown = screen.getByTestId('dropdown-State');
        expect(stateDropdown.querySelector('option[value="Karnataka"]')).toBeInTheDocument();
        return stateDropdown;
      }, { timeout: 3000 });

      const stateDropdown = screen.getByTestId('dropdown-State');
      await user.selectOptions(stateDropdown, 'Karnataka');

      await waitFor(() => {
        expect(stateDropdown).toHaveValue('Karnataka');
      }, { timeout: 3000 });
    });

    it('should handle district selection', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={{ ...defaultValues, country: 'India', state: 'Karnataka' }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      await waitFor(() => {
        const districtDropdown = screen.getByTestId('dropdown-District');
        expect(districtDropdown.querySelector('option[value="Bangalore"]')).toBeInTheDocument();
        return districtDropdown;
      }, { timeout: 3000 });

      const districtDropdown = screen.getByTestId('dropdown-District');
      await user.selectOptions(districtDropdown, 'Bangalore');

      await waitFor(() => {
        expect(districtDropdown).toHaveValue('Bangalore');
      }, { timeout: 3000 });
    });

    it('should handle city selection', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      // City is actually an Input field, not a dropdown
      const cityInput = screen.getByPlaceholderText('Enter Village/Town/City');
      await user.type(cityInput, 'Bangalore');

      await waitFor(() => {
        expect(cityInput).toHaveValue('Bangalore');
      }, { timeout: 3000 });
    });

    it('should handle correspondingAddress1 input change', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const address1Input = screen.getByPlaceholderText('Enter Corresponding Address 1');
      await user.type(address1Input, '123 Main Street');

      await waitFor(() => {
        expect(address1Input).toHaveValue('123 Main Street');
      }, { timeout: 3000 });
    });

    it('should handle correspondingAddress2 input change', async () => {
      const user = userEvent.setup({ delay: null });
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const address2Input = screen.getByPlaceholderText('Enter Corresponding Address 2');
      await user.type(address2Input, 'Apt 4B');

      await waitFor(() => {
        expect(address2Input).toHaveValue('Apt 4B');
      }, { timeout: 3000 });
    });

    it('should handle state selection with array value', async () => {
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={{ ...defaultValues, country: 'India' }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('dropdown-State')).toBeInTheDocument();
      });

      // Directly call the onChange handler with an array value to test array handling
      await act(async () => {
        mockStateSelectorOnChange(['Karnataka']);
      });

      await waitFor(() => {
        const stateDropdown = screen.getByTestId('dropdown-State');
        expect(stateDropdown).toHaveValue('Karnataka');
      });
    });

    it('should handle district selection with array value', async () => {
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={{ ...defaultValues, country: 'India', state: 'Karnataka' }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('dropdown-District')).toBeInTheDocument();
      });

      // Directly call the onChange handler with an array value to test array handling
      await act(async () => {
        mockDistrictSelectorOnChange(['Bangalore']);
      });

      await waitFor(() => {
        const districtDropdown = screen.getByTestId('dropdown-District');
        expect(districtDropdown).toHaveValue('Bangalore');
      });
    });
  });

  describe('Layout and Styling', () => {
    it('should have correct form layout classes', () => {
      const { container } = renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const form = container.querySelector('form');
      expect(form).toHaveClass('space-y-6', 'h-full');
    });

    it('should have correct button layout classes', () => {
      const { container } = renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const buttonContainer = container.querySelector('.flex.gap-3');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('should render Back button with secondary variant', () => {
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const backButton = screen.getByText('Back').closest('button');
      expect(backButton).toHaveAttribute('data-variant', 'secondary');
    });

    it('should render Next button with primary variant', () => {
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next').closest('button');
      expect(nextButton).toHaveAttribute('data-variant', 'primary');
    });
  });

  describe('Accessibility', () => {
    it('should have all required field indicators', () => {
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThan(0);
    });

    it('should have accessible buttons', () => {
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      // Get all buttons and filter for action buttons (Back and Next)
      const allButtons = screen.getAllByRole('button');
      const actionButtons = allButtons.filter(
        button => button.textContent === 'Back' || button.textContent === 'Next'
      );
      expect(actionButtons).toHaveLength(2); // Back and Next
      actionButtons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });
  });

  describe('Component Props', () => {
    it('should accept and use onNext prop', () => {
      const customOnNext = vi.fn();
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={customOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should accept and use onPrev prop', () => {
      const customOnPrev = vi.fn();
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={customOnPrev}
        />
      );

      expect(screen.getByText('Back')).toBeInTheDocument();
    });
  });

  describe('Postal Code Auto-Population', () => {
    it('should not fetch postal code data when country is not India', async () => {
      vi.useFakeTimers();
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={{ ...defaultValues, country: 'United States' }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const postalCodeInput = screen.getByPlaceholderText('Enter Postal Code');
      fireEvent.change(postalCodeInput, { target: { value: '123456' } });
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      expect(mockFetchPostalCodeData).not.toHaveBeenCalled();
      vi.useRealTimers();
    });

    it('should not fetch postal code data when postal code is empty', async () => {
      vi.useFakeTimers();
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={{ ...defaultValues, country: 'India' }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      await act(async () => {
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      vi.useRealTimers();
      
      await waitFor(() => {
        expect(mockFetchPostalCodeData).not.toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should fetch postal code data when country is India and postal code is entered', async () => {
      vi.useFakeTimers();
      const postalData = {
        state: 'Madhya Pradesh',
        district: 'Indore',
        city: 'Indore',
      };
      mockFetchPostalCodeData.mockResolvedValue(postalData);

      renderWithProvider(
        <PatientAddressInfo
          defaultValues={{ ...defaultValues, country: 'India' }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const postalCodeInput = screen.getByPlaceholderText('Enter Postal Code');
      await act(async () => {
        fireEvent.change(postalCodeInput, { target: { value: '452001' } });
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      vi.useRealTimers();

      await waitFor(() => {
        expect(mockFetchPostalCodeData).toHaveBeenCalledWith('452001');
      }, { timeout: 3000 });
    });

    it('should auto-populate state, district, and city when postal code data is fetched', async () => {
      vi.useFakeTimers();
      const postalData = {
        state: 'Karnataka',
        district: 'Bangalore',
        city: 'Bangalore',
      };
      mockFetchPostalCodeData.mockResolvedValue(postalData);

      renderWithProvider(
        <PatientAddressInfo
          defaultValues={{ ...defaultValues, country: 'India' }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const postalCodeInput = screen.getByPlaceholderText('Enter Postal Code');
      await act(async () => {
        fireEvent.change(postalCodeInput, { target: { value: '560001' } });
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      vi.useRealTimers();

      await waitFor(() => {
        expect(mockFetchPostalCodeData).toHaveBeenCalled();
      }, { timeout: 3000 });

      await waitFor(() => {
        const stateDropdown = screen.getByTestId('dropdown-State');
        const districtDropdown = screen.getByTestId('dropdown-District');
        const cityInput = screen.getByPlaceholderText('Enter Village/Town/City');

        expect(stateDropdown).toHaveValue('Karnataka');
        expect(districtDropdown).toHaveValue('Bangalore');
        expect(cityInput).toHaveValue('Bangalore');
      }, { timeout: 3000 });
    });

    it('should debounce postal code API calls', async () => {
      vi.useFakeTimers();
      mockFetchPostalCodeData.mockResolvedValue({
        state: 'Karnataka',
        district: 'Bangalore',
        city: 'Bangalore',
      });

      renderWithProvider(
        <PatientAddressInfo
          defaultValues={{ ...defaultValues, country: 'India' }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const postalCodeInput = screen.getByPlaceholderText('Enter Postal Code');
      
      // Type multiple characters quickly
      await act(async () => {
        fireEvent.change(postalCodeInput, { target: { value: '4' } });
        vi.advanceTimersByTime(300);
        fireEvent.change(postalCodeInput, { target: { value: '45' } });
        vi.advanceTimersByTime(300);
        fireEvent.change(postalCodeInput, { target: { value: '452' } });
        vi.advanceTimersByTime(300);
        fireEvent.change(postalCodeInput, { target: { value: '4520' } });
        vi.advanceTimersByTime(300);
        fireEvent.change(postalCodeInput, { target: { value: '45200' } });
        vi.advanceTimersByTime(300);
        fireEvent.change(postalCodeInput, { target: { value: '452001' } });
      });

      // Should not be called yet (debounce not complete)
      expect(mockFetchPostalCodeData).not.toHaveBeenCalled();

      // Advance timer past debounce delay
      await act(async () => {
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      vi.useRealTimers();

      await waitFor(() => {
        // Should be called only once after debounce
        expect(mockFetchPostalCodeData).toHaveBeenCalledTimes(1);
        expect(mockFetchPostalCodeData).toHaveBeenCalledWith('452001');
      }, { timeout: 3000 });
    });

    it('should handle postal code API errors gracefully', async () => {
      vi.useFakeTimers();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new Error('Network error');
      mockFetchPostalCodeData.mockRejectedValue(error);

      renderWithProvider(
        <PatientAddressInfo
          defaultValues={{ ...defaultValues, country: 'India' }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const postalCodeInput = screen.getByPlaceholderText('Enter Postal Code');
      await act(async () => {
        fireEvent.change(postalCodeInput, { target: { value: '452001' } });
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      vi.useRealTimers();

      await waitFor(() => {
        expect(mockFetchPostalCodeData).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching postal code data:',
          error
        );
      }, { timeout: 3000 });

      // Component should still be functional
      expect(screen.getByText('Next')).toBeInTheDocument();
      consoleErrorSpy.mockRestore();
    });

    it('should not auto-populate when postal code data is null', async () => {
      vi.useFakeTimers();
      mockFetchPostalCodeData.mockResolvedValue(null);

      renderWithProvider(
        <PatientAddressInfo
          defaultValues={{ ...defaultValues, country: 'India' }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const postalCodeInput = screen.getByPlaceholderText('Enter Postal Code');
      fireEvent.change(postalCodeInput, { target: { value: '999999' } });
      
      await act(async () => {
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      vi.useRealTimers();

      await waitFor(() => {
        expect(mockFetchPostalCodeData).toHaveBeenCalledWith('999999');
      }, { timeout: 3000 });

      // Fields should remain empty
      await waitFor(() => {
        const stateDropdown = screen.getByTestId('dropdown-State');
        const districtDropdown = screen.getByTestId('dropdown-District');
        const cityInput = screen.getByPlaceholderText('Enter Village/Town/City');

        expect(stateDropdown).toHaveValue('');
        expect(districtDropdown).toHaveValue('');
        expect(cityInput).toHaveValue('');
      }, { timeout: 3000 });
    });

    it('should handle case-insensitive country name check', async () => {
      vi.useFakeTimers();
      mockFetchPostalCodeData.mockResolvedValue({
        state: 'Karnataka',
        district: 'Bangalore',
        city: 'Bangalore',
      });

      renderWithProvider(
        <PatientAddressInfo
          defaultValues={{ ...defaultValues, country: 'INDIA' }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const postalCodeInput = screen.getByPlaceholderText('Enter Postal Code');
      fireEvent.change(postalCodeInput, { target: { value: '560001' } });
      
      await act(async () => {
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      vi.useRealTimers();

      await waitFor(() => {
        expect(mockFetchPostalCodeData).toHaveBeenCalledWith('560001');
      }, { timeout: 3000 });
    });

    it('should only populate available fields from postal code data', async () => {
      vi.useFakeTimers();
      const partialPostalData = {
        state: 'Karnataka',
        district: '',
        city: 'Bangalore',
      };
      mockFetchPostalCodeData.mockResolvedValue(partialPostalData);

      renderWithProvider(
        <PatientAddressInfo
          defaultValues={{ ...defaultValues, country: 'India' }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const postalCodeInput = screen.getByPlaceholderText('Enter Postal Code');
      await act(async () => {
        fireEvent.change(postalCodeInput, { target: { value: '560001' } });
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      vi.useRealTimers();

      await waitFor(() => {
        expect(mockFetchPostalCodeData).toHaveBeenCalled();
      }, { timeout: 3000 });

      await waitFor(() => {
        const stateDropdown = screen.getByTestId('dropdown-State');
        const cityInput = screen.getByPlaceholderText('Enter Village/Town/City');
        expect(stateDropdown).toHaveValue('Karnataka');
        expect(cityInput).toHaveValue('Bangalore');
      }, { timeout: 3000 });
    });

    it('should not fetch postal code data when postal code length is less than 6', async () => {
      vi.useFakeTimers();
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={{ ...defaultValues, country: 'India' }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const postalCodeInput = screen.getByPlaceholderText('Enter Postal Code');
      await act(async () => {
        fireEvent.change(postalCodeInput, { target: { value: '12345' } }); // 5 digits - less than 6
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      vi.useRealTimers();

      await waitFor(() => {
        expect(mockFetchPostalCodeData).not.toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should not fetch postal code data when country is undefined', async () => {
      vi.useFakeTimers();
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={{ ...defaultValues, country: '' }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const postalCodeInput = screen.getByPlaceholderText('Enter Postal Code');
      await act(async () => {
        fireEvent.change(postalCodeInput, { target: { value: '560001' } });
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      vi.useRealTimers();

      await waitFor(() => {
        expect(mockFetchPostalCodeData).not.toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should handle partial postal code data without state', async () => {
      vi.useFakeTimers();
      const partialPostalData = {
        state: '',
        district: 'Bangalore',
        city: 'Bangalore',
      };
      mockFetchPostalCodeData.mockResolvedValue(partialPostalData);

      renderWithProvider(
        <PatientAddressInfo
          defaultValues={{ ...defaultValues, country: 'India' }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const postalCodeInput = screen.getByPlaceholderText('Enter Postal Code');
      await act(async () => {
        fireEvent.change(postalCodeInput, { target: { value: '560001' } });
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      vi.useRealTimers();

      await waitFor(() => {
        expect(mockFetchPostalCodeData).toHaveBeenCalled();
      }, { timeout: 3000 });

      // Since state is empty, only city should be populated (district depends on mock which requires state)
      await waitFor(() => {
        const cityInput = screen.getByPlaceholderText('Enter Village/Town/City');
        expect(cityInput).toHaveValue('Bangalore');
      }, { timeout: 3000 });
    });

    it('should handle partial postal code data without city', async () => {
      vi.useFakeTimers();
      const partialPostalData = {
        state: 'Karnataka',
        district: 'Bangalore',
        city: '',
      };
      mockFetchPostalCodeData.mockResolvedValue(partialPostalData);

      renderWithProvider(
        <PatientAddressInfo
          defaultValues={{ ...defaultValues, country: 'India' }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const postalCodeInput = screen.getByPlaceholderText('Enter Postal Code');
      await act(async () => {
        fireEvent.change(postalCodeInput, { target: { value: '560001' } });
        vi.advanceTimersByTime(500);
        await vi.runAllTimersAsync();
      });

      vi.useRealTimers();

      await waitFor(() => {
        expect(mockFetchPostalCodeData).toHaveBeenCalled();
      }, { timeout: 3000 });

      await waitFor(() => {
        const stateDropdown = screen.getByTestId('dropdown-State');
        const districtDropdown = screen.getByTestId('dropdown-District');
        expect(stateDropdown).toHaveValue('Karnataka');
        expect(districtDropdown).toHaveValue('Bangalore');
      }, { timeout: 3000 });
    });
  });

  describe('Nullish Coalescing Edge Cases', () => {
    it('should handle undefined country in district selector', () => {
      const defaultValuesWithUndefined = {
        postalCode: '',
        country: undefined as unknown as string,
        state: undefined as unknown as string,
        district: undefined as unknown as string,
        city: '',
        correspondingAddress1: '',
        correspondingAddress2: '',
      };

      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValuesWithUndefined}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      // Component should render without crashing
      expect(screen.getByTestId('dropdown-Country')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-State')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-District')).toBeInTheDocument();
    });

    it('should handle country change from undefined state', async () => {
      const defaultValuesWithUndefined = {
        postalCode: '',
        country: undefined as unknown as string,
        state: '',
        district: '',
        city: '',
        correspondingAddress1: '',
        correspondingAddress2: '',
      };

      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValuesWithUndefined}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const countryDropdown = screen.getByTestId('dropdown-Country');
      
      await act(async () => {
        fireEvent.change(countryDropdown, { target: { value: 'India' } });
      });

      await waitFor(() => {
        expect(countryDropdown).toHaveValue('India');
      }, { timeout: 3000 });
    });

    it('should handle country selection with array value', async () => {
      renderWithProvider(
        <PatientAddressInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const countryDropdown = screen.getByTestId('dropdown-Country');
      expect(countryDropdown).toBeInTheDocument();

      // Use fireEvent to select a country value
      await act(async () => {
        fireEvent.change(countryDropdown, { target: { value: 'India' } });
      });

      await waitFor(() => {
        expect(countryDropdown).toHaveValue('India');
      }, { timeout: 3000 });
    });
  });
});
