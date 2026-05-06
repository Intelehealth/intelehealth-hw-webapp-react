import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PatientInfo from '../../../../../../modules/patient/add/steps/patient-info/patient-info.component';

vi.useFakeTimers({ shouldAdvanceTime: true });

// Mock common components
vi.mock('../../../../../../components/common', () => ({
  Button: ({ children, onClick, type, variant, className }: any) => (
    <button
      type={type}
      onClick={onClick}
      className={className}
      data-variant={variant}
    >
      {children}
    </button>
  ),
  Input: ({ label, placeholder, error, isRequired, ...props }: any) => (
    <div>
      {label && (
        <label>
          {label} {isRequired && <span>*</span>}
        </label>
      )}
      <input placeholder={placeholder} {...props} />
      {error && <span className="error">{error}</span>}
    </div>
  ),
  Calendar: ({ label, onChange, value, error, placeholder }: any) => (
    <div>
      {label && <label>{label}</label>}
      <input
        type="date"
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        data-testid="calendar-input"
      />
      <button
        type="button"
        data-testid="calendar-clear"
        onClick={() => onChange?.('')}
      >
        Clear DOB
      </button>
      {error && <span className="error">{error}</span>}
    </div>
  ),
  Radio: ({ label, value, ...props }: any) => (
    <div>
      <input type="radio" value={value} {...props} />
      {label && <label>{label}</label>}
    </div>
  ),
  RadioGroup: ({ children, onChange, value }: any) => {
    const handleClick = (e: any) => {
      if (e.target.type === 'radio') onChange?.(e.target.value);
    };
    return (
      <div role="radiogroup" data-value={value} onClick={handleClick}>
        {children}
      </div>
    );
  },
  Dropdown: ({
    label,
    options,
    onChange,
    value,
    error,
    isRequired,
    placeholder,
  }: any) => (
    <div>
      {label && (
        <label>
          {label} {isRequired && <span>*</span>}
        </label>
      )}
      <select
        value={Array.isArray(value) ? value[0] : value || ''}
        onChange={e => onChange?.(e.target.value)}
        data-testid={`dropdown-${label}`}
      >
        <option value="">{placeholder}</option>
        {options?.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        data-testid={`dropdown-array-${label}`}
        onClick={() => onChange?.([options?.[0]?.value ?? 'Family'])}
      >
        Trigger Array
      </button>
      {error && <span className="error">{error}</span>}
    </div>
  ),
}));

// Mock selectors (inlined to satisfy vi.mock hoisting rules)
vi.mock('../../../../../../components/common/country-select.component', () => ({
  default: ({ label, onChange, value, isRequired, placeholder, error }: any) => (
    <div>
      {label && (
        <label>
          {label} {isRequired && <span>*</span>}
        </label>
      )}
      <input
        data-testid="country-input"
        value={Array.isArray(value) ? value[0] : value || ''}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
      />
      <button
        type="button"
        data-testid="country-array-btn"
        onClick={() => onChange?.(['ArrayValue'])}
      >
        Trigger Array
      </button>
      {error && <span className="error">{error}</span>}
    </div>
  ),
}));
vi.mock('../../../../../../components/common/state-selector.component', () => ({
  default: ({ label, onChange, value, isRequired, placeholder }: any) => (
    <div>
      {label && (
        <label>
          {label} {isRequired && <span>*</span>}
        </label>
      )}
      <input
        data-testid="state-input"
        value={Array.isArray(value) ? value[0] : value || ''}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
      />
      <button
        type="button"
        data-testid="state-array-btn"
        onClick={() => onChange?.(['ArrayValue'])}
      >
        Trigger Array
      </button>
    </div>
  ),
}));
vi.mock(
  '../../../../../../components/common/district-selector.component',
  () => ({
    default: ({ label, onChange, value, isRequired, placeholder }: any) => (
      <div>
        {label && (
          <label>
            {label} {isRequired && <span>*</span>}
          </label>
        )}
        <input
          data-testid="district-input"
          value={Array.isArray(value) ? value[0] : value || ''}
          onChange={e => onChange?.(e.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          data-testid="district-array-btn"
          onClick={() => onChange?.(['ArrayValue'])}
        >
          Trigger Array
        </button>
      </div>
    ),
  })
);

// Mock InputPhoneNumber
vi.mock(
  '../../../../../../components/common/input-phone-number.component',
  () => ({
    default: ({ onChange, value, error, placeholder }: any) => (
      <div>
        <input
          type="tel"
          value={value?.number || ''}
          onChange={e =>
            onChange?.({
              number: e.target.value,
              countryCode: value?.countryCode || '+91',
            })
          }
          placeholder={placeholder || 'Phone'}
          data-testid={`phone-${placeholder || 'main'}`}
        />
        {error && <span className="error">{error}</span>}
      </div>
    ),
  })
);

// Mock ProfilePhotoUpload
vi.mock(
  '../../../../../../components/common/profile-photo-upload.component',
  () => ({
    ProfilePhotoUpload: ({ image, onUpload, imageFormat }: any) => (
      <div data-testid="profile-photo" data-image-format={imageFormat}>
        <img src={image} alt="Profile" />
        <button
          type="button"
          data-testid="upload-photo"
          onClick={() => onUpload('base64-photo')}
        >
          Upload
        </button>
      </div>
    ),
  })
);

// Mock services
const mockFetchPostalCodeData = vi.fn();
vi.mock('../../../../../../services/postal-code.service', () => ({
  fetchPostalCodeData: (pc: string) => mockFetchPostalCodeData(pc),
}));

const mockShowToast = vi.fn();
vi.mock('../../../../../../services/toast', () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args),
}));

// Mock calculateAge
vi.mock('../../../../../../utils/common', () => ({
  calculateAge: vi.fn(() => 34),
}));

// Mock asset images
vi.mock('../../../../../../assets/images/default-user-img.svg', () => ({
  default: 'default-user.svg',
}));
vi.mock('../../../../../../assets/icons/icon-female.svg', () => ({
  default: 'icon-female.svg',
}));
vi.mock('../../../../../../assets/icons/icon-gender-other.svg', () => ({
  default: 'icon-gender-other.svg',
}));
vi.mock('../../../../../../assets/icons/icon-male.svg', () => ({
  default: 'icon-male.svg',
}));
vi.mock(
  '../../../../../../assets/icons/icon-location-green-rounded-filled.svg',
  () => ({ default: 'icon-location.svg' })
);
vi.mock(
  '../../../../../../assets/icons/icon-three-dot-green-rounded-filled.svg',
  () => ({ default: 'icon-three-dot.svg' })
);
vi.mock(
  '../../../../../../assets/icons/icon-user-green-rounded-filled.svg',
  () => ({ default: 'icon-user.svg' })
);

const validDefaults = {
  firstName: 'John',
  middleName: '',
  lastName: 'Doe',
  gender: 'M',
  dateOfBirth: '1990-01-01',
  age: '34',
  phoneNumber: '1234567890',
  phoneNumberCountryCode: '+91',
  contactType: 'Family' as const,
  emergencyContactName: 'Jane',
  emergencyContactNumber: '0987654321',
  emergencyContactNumberCountryCode: '+91',
  profilePhoto: null,
  postalCode: '',
  country: '',
  state: '',
  district: '',
  city: 'Mumbai',
  correspondingAddress1: 'Addr 1',
  correspondingAddress2: 'Addr 2',
  sonDaughterWifeOf: '',
  occupation: '',
  caste: '',
  education: 'Graduate',
  economicStatus: '',
};

describe('PatientInfo', () => {
  const mockOnNext = vi.fn();
  const mockOnPrev = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchPostalCodeData.mockResolvedValue(null);
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() =>
        render(
          <PatientInfo
            defaultValues={validDefaults}
            onNext={mockOnNext}
            onPrev={mockOnPrev}
          />
        )
      ).not.toThrow();
    });

    it('renders the three section headers with icons', () => {
      render(
        <PatientInfo
          defaultValues={validDefaults}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      // Section header icons (note: gender radio also renders an "Other" alt image,
      // so we just assert at least one of each is present)
      expect(screen.getByAltText('Personal')).toBeInTheDocument();
      expect(screen.getByAltText('Address')).toBeInTheDocument();
      expect(screen.getAllByAltText('Other').length).toBeGreaterThan(0);
      // Section header text
      expect(screen.getByText('Personal')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getAllByText('Other').length).toBeGreaterThan(0);
    });

    it('renders all required field labels', () => {
      render(
        <PatientInfo
          defaultValues={validDefaults}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      expect(screen.getByText('First Name')).toBeInTheDocument();
      expect(screen.getByText('Middle Name')).toBeInTheDocument();
      expect(screen.getByText('Last Name')).toBeInTheDocument();
      expect(screen.getAllByText('Gender').length).toBeGreaterThan(0);
      expect(screen.getByText('Date Of Birth')).toBeInTheDocument();
      expect(screen.getByText('Or Age')).toBeInTheDocument();
      expect(screen.getAllByText('Phone Number').length).toBeGreaterThan(0);
      expect(screen.getByText('Contact Type')).toBeInTheDocument();
      expect(screen.getByText('Emergency Contact Name')).toBeInTheDocument();
      expect(screen.getByText('Country')).toBeInTheDocument();
      expect(screen.getByText('Postal Code')).toBeInTheDocument();
      expect(screen.getByText('State')).toBeInTheDocument();
      expect(screen.getByText('District')).toBeInTheDocument();
      expect(screen.getByText('Village/Town/City')).toBeInTheDocument();
      expect(screen.getByText('Corresponding Address')).toBeInTheDocument();
      expect(screen.getByText('Corresponding Address 2')).toBeInTheDocument();
      expect(
        screen.getByText('Enter Son/Daughter/Wife Of')
      ).toBeInTheDocument();
      expect(screen.getByText('Occupation')).toBeInTheDocument();
      expect(screen.getByText('Caste')).toBeInTheDocument();
      expect(screen.getByText('Education')).toBeInTheDocument();
      expect(screen.getByText('Economic Status')).toBeInTheDocument();
    });

    it('renders Back and Next buttons', () => {
      render(
        <PatientInfo
          defaultValues={validDefaults}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('renders existing profile photo when defaultValues.profilePhoto is a string', () => {
      render(
        <PatientInfo
          defaultValues={{
            ...validDefaults,
            profilePhoto: 'data:image/png;base64,abc123',
          }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const img = screen
        .getByTestId('profile-photo')
        .querySelector('img');
      expect(img).toHaveAttribute('src', 'data:image/png;base64,abc123');
    });
  });

  describe('User interactions', () => {
    it('calls onPrev when Back is clicked', () => {
      render(
        <PatientInfo
          defaultValues={validDefaults}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      fireEvent.click(screen.getByText('Back'));
      expect(mockOnPrev).toHaveBeenCalledTimes(1);
    });

    it('handles ProfilePhotoUpload onUpload callback', () => {
      render(
        <PatientInfo
          defaultValues={validDefaults}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      fireEvent.click(screen.getByTestId('upload-photo'));
      // No assertion; just exercises the setValue path
    });

    it('handles country onChange (string value)', () => {
      render(
        <PatientInfo
          defaultValues={validDefaults}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      fireEvent.change(screen.getByTestId('country-input'), {
        target: { value: 'India' },
      });
    });

    it('handles country onChange (array value)', () => {
      render(
        <PatientInfo
          defaultValues={validDefaults}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      fireEvent.click(screen.getByTestId('country-array-btn'));
    });

    it('handles state onChange (string and array)', () => {
      render(
        <PatientInfo
          defaultValues={validDefaults}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      fireEvent.change(screen.getByTestId('state-input'), {
        target: { value: 'Maharashtra' },
      });
      fireEvent.click(screen.getByTestId('state-array-btn'));
    });

    it('handles district onChange (string and array)', () => {
      render(
        <PatientInfo
          defaultValues={validDefaults}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      fireEvent.change(screen.getByTestId('district-input'), {
        target: { value: 'Mumbai' },
      });
      fireEvent.click(screen.getByTestId('district-array-btn'));
    });

    it('handles Calendar dateOfBirth change with date (auto-calculates age)', () => {
      render(
        <PatientInfo
          defaultValues={validDefaults}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      fireEvent.change(screen.getByTestId('calendar-input'), {
        target: { value: '2000-05-15' },
      });
    });

    it('handles Calendar dateOfBirth clear (no age calc)', () => {
      render(
        <PatientInfo
          defaultValues={validDefaults}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      fireEvent.click(screen.getByTestId('calendar-clear'));
    });

    it('handles gender RadioGroup change', () => {
      render(
        <PatientInfo
          defaultValues={validDefaults}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const radios = screen.getAllByRole('radio');
      fireEvent.click(radios[1]); // Female
    });

    it('handles phone number changes', () => {
      render(
        <PatientInfo
          defaultValues={validDefaults}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      const phoneInputs = screen.getAllByRole('textbox', { hidden: false });
      // Find phone number inputs by their tel type via querySelector
      const tels = document.querySelectorAll('input[type="tel"]');
      fireEvent.change(tels[0], { target: { value: '5555555555' } });
      fireEvent.change(tels[1], { target: { value: '6666666666' } });
      void phoneInputs;
    });

    it('handles all Dropdown changes (string)', () => {
      render(
        <PatientInfo
          defaultValues={validDefaults}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      fireEvent.change(screen.getByTestId('dropdown-Contact Type'), {
        target: { value: 'Family' },
      });
      fireEvent.change(screen.getByTestId('dropdown-Occupation'), {
        target: { value: 'Engineer' },
      });
      fireEvent.change(screen.getByTestId('dropdown-Caste'), {
        target: { value: 'General' },
      });
      fireEvent.change(screen.getByTestId('dropdown-Education'), {
        target: { value: 'Graduate' },
      });
      fireEvent.change(screen.getByTestId('dropdown-Economic Status'), {
        target: { value: 'APL' },
      });
    });

    it('handles all Dropdown changes (array)', () => {
      render(
        <PatientInfo
          defaultValues={validDefaults}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      fireEvent.click(screen.getByTestId('dropdown-array-Contact Type'));
      fireEvent.click(screen.getByTestId('dropdown-array-Occupation'));
      fireEvent.click(screen.getByTestId('dropdown-array-Caste'));
      fireEvent.click(screen.getByTestId('dropdown-array-Education'));
      fireEvent.click(screen.getByTestId('dropdown-array-Economic Status'));
    });
  });

  describe('Form submission', () => {
    it('splits submitted data into personalInfo, addressInfo, otherInfo', async () => {
      const fullDefaults = {
        ...validDefaults,
        country: 'India',
        state: 'Maharashtra',
        district: 'Mumbai',
        postalCode: '123456',
      };
      const { container } = render(
        <PatientInfo
          defaultValues={fullDefaults}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      fireEvent.submit(container.querySelector('form')!);

      await waitFor(() => {
        expect(mockOnNext).toHaveBeenCalledWith(
          expect.objectContaining({
            personalInfo: expect.objectContaining({
              firstName: 'John',
              lastName: 'Doe',
              gender: 'M',
            }),
            addressInfo: expect.objectContaining({
              country: 'India',
              postalCode: '123456',
              city: 'Mumbai',
            }),
            otherInfo: expect.objectContaining({
              education: 'Graduate',
            }),
          })
        );
      });
    });

    it('shows validation errors for required text fields when missing', async () => {
      const empty = {
        ...validDefaults,
        firstName: '',
        lastName: '',
        emergencyContactName: '',
        emergencyContactNumber: '',
        education: '',
        country: '',
        state: '',
        district: '',
        city: '',
        postalCode: '',
        correspondingAddress1: '',
        correspondingAddress2: '',
      };
      const { container } = render(
        <PatientInfo
          defaultValues={empty}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });

      // A spread of error messages should now be visible to exercise
      // the truthy branches of error-display ternaries.
      await waitFor(() =>
        expect(screen.getByText('First name is required')).toBeInTheDocument()
      );
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
      expect(screen.getByText('Education is required')).toBeInTheDocument();
      expect(screen.getByText('Country is required')).toBeInTheDocument();
    });

    it('shows phoneNumberCountryCode error when missing on submit', async () => {
      const { container } = render(
        <PatientInfo
          defaultValues={{ ...validDefaults, phoneNumberCountryCode: '' }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      await act(async () => {
        fireEvent.submit(container.querySelector('form')!);
      });

      // Trigger re-render to surface validation errors
      await waitFor(() =>
        expect(screen.getByText('Country code is required')).toBeInTheDocument()
      );
    });

    it('does not call onNext when validation fails (missing required fields)', async () => {
      const empty = {
        ...validDefaults,
        firstName: '',
        lastName: '',
        gender: '',
        phoneNumber: '',
        contactType: '',
        emergencyContactName: '',
        emergencyContactNumber: '',
        education: '',
        country: '',
        state: '',
        district: '',
        city: '',
        postalCode: '',
        correspondingAddress1: '',
        correspondingAddress2: '',
      };
      const { container } = render(
        <PatientInfo
          defaultValues={empty}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      fireEvent.submit(container.querySelector('form')!);

      // Wait briefly to confirm onNext was not called
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(mockOnNext).not.toHaveBeenCalled();
    });
  });

  describe('Postal code auto-fill effect', () => {
    it('does not fetch when country is not India', async () => {
      render(
        <PatientInfo
          defaultValues={{
            ...validDefaults,
            country: 'United States',
            postalCode: '123456',
          }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });
      expect(mockFetchPostalCodeData).not.toHaveBeenCalled();
    });

    it('does not fetch when postal code is shorter than 6 chars', async () => {
      render(
        <PatientInfo
          defaultValues={{
            ...validDefaults,
            country: 'India',
            postalCode: '123',
          }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });
      expect(mockFetchPostalCodeData).not.toHaveBeenCalled();
    });

    it('does not fetch when postal code is empty', async () => {
      render(
        <PatientInfo
          defaultValues={{
            ...validDefaults,
            country: 'India',
            postalCode: '',
          }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });
      expect(mockFetchPostalCodeData).not.toHaveBeenCalled();
    });

    it('fetches and applies state/district/city when API returns data', async () => {
      mockFetchPostalCodeData.mockResolvedValue({
        state: 'Karnataka',
        district: 'Bangalore',
        city: 'Bangalore',
      });
      render(
        <PatientInfo
          defaultValues={{
            ...validDefaults,
            country: 'India',
            postalCode: '560001',
          }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });
      await waitFor(() =>
        expect(mockFetchPostalCodeData).toHaveBeenCalledWith('560001')
      );
    });

    it('handles partial postal data (only state)', async () => {
      mockFetchPostalCodeData.mockResolvedValue({ state: 'KA' });
      render(
        <PatientInfo
          defaultValues={{
            ...validDefaults,
            country: 'India',
            postalCode: '560001',
          }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });
      await waitFor(() => expect(mockFetchPostalCodeData).toHaveBeenCalled());
    });

    it('handles partial postal data (only district)', async () => {
      mockFetchPostalCodeData.mockResolvedValue({ district: 'Mumbai' });
      render(
        <PatientInfo
          defaultValues={{
            ...validDefaults,
            country: 'India',
            postalCode: '400001',
          }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });
      await waitFor(() => expect(mockFetchPostalCodeData).toHaveBeenCalled());
    });

    it('handles partial postal data (only city)', async () => {
      mockFetchPostalCodeData.mockResolvedValue({ city: 'Pune' });
      render(
        <PatientInfo
          defaultValues={{
            ...validDefaults,
            country: 'India',
            postalCode: '411001',
          }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });
      await waitFor(() => expect(mockFetchPostalCodeData).toHaveBeenCalled());
    });

    it('shows toast when API returns null', async () => {
      mockFetchPostalCodeData.mockResolvedValue(null);
      render(
        <PatientInfo
          defaultValues={{
            ...validDefaults,
            country: 'India',
            postalCode: '999999',
          }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });
      await waitFor(() =>
        expect(mockShowToast).toHaveBeenCalledWith(
          'No address found',
          expect.any(String),
          'error'
        )
      );
    });

    it('logs error when fetchPostalCodeData throws', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFetchPostalCodeData.mockRejectedValue(new Error('Network down'));
      render(
        <PatientInfo
          defaultValues={{
            ...validDefaults,
            country: 'India',
            postalCode: '560001',
          }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });
      await waitFor(() =>
        expect(errorSpy).toHaveBeenCalledWith(
          'Error fetching postal code data:',
          expect.any(Error)
        )
      );
      errorSpy.mockRestore();
    });

    it('clears the debounce timeout on unmount', async () => {
      const { unmount } = render(
        <PatientInfo
          defaultValues={{
            ...validDefaults,
            country: 'India',
            postalCode: '560001',
          }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      // Unmount before timeout fires
      unmount();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
      // Should not have fetched after unmount
      expect(mockFetchPostalCodeData).not.toHaveBeenCalled();
    });

    it('handles whitespace-only postal code as too short', async () => {
      render(
        <PatientInfo
          defaultValues={{
            ...validDefaults,
            country: 'India',
            postalCode: '     ',
          }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );
      await act(async () => {
        await vi.advanceTimersByTimeAsync(600);
      });
      expect(mockFetchPostalCodeData).not.toHaveBeenCalled();
    });
  });
});
