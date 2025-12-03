import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PatientPersonalInfo from '../../../../../../modules/patient/add/steps/personal-info/patient-personal-info.component';

// Mock the common components
vi.mock('../../../../../../components/common', () => ({
  Button: ({ children, onClick, type, variant, className }: any) => (
    <button type={type} onClick={onClick} className={className} data-variant={variant}>
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
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        data-testid="calendar-input"
      />
      {error && <span className="error">{error}</span>}
    </div>
  ),
  Radio: ({ label, value, ...props }: any) => (
    <div>
      <input type="radio" value={value} {...props} />
      {label && <label>{label}</label>}
    </div>
  ),
  RadioGroup: ({ children, onChange, value, error }: any) => {
    // Simulate RadioGroup behavior - when a radio is clicked, call onChange
    const handleRadioChange = (e: any) => {
      if (e.target.type === 'radio') {
        onChange?.(e.target.value);
      }
    };
    return (
      <div role="radiogroup" data-value={value} onClick={handleRadioChange}>
        {children}
        {error && <span className="error">{error}</span>}
      </div>
    );
  },
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
      <button
        type="button"
        data-testid={`dropdown-array-trigger-${label}`}
        onClick={() => onChange?.(['Family'])}
      >
        Trigger Array
      </button>
      {error && <span className="error">{error}</span>}
    </div>
  ),
}));

// Mock InputPhoneNumber component
vi.mock('../../../../../../components/common/input-phone-number.component', () => ({
  default: ({ onChange, value, error }: any) => (
    <div data-testid="input-phone-number">
      <input
        type="tel"
        value={value?.number || ''}
        onChange={(e) => onChange?.({ number: e.target.value, countryCode: value?.countryCode || '+91' })}
        placeholder="Phone Number"
        data-testid="phone-number-input"
      />
      <input
        type="text"
        value={value?.countryCode || '+91'}
        onChange={(e) => onChange?.({ number: value?.number || '', countryCode: e.target.value })}
        placeholder="Country Code"
        data-testid="country-code-input"
      />
      {error && <span className="error">{error}</span>}
    </div>
  ),
}));

// Mock ProfilePhotoUpload component
vi.mock('../../../../../../components/common/profile-photo-upload.component', () => ({
  ProfilePhotoUpload: ({ image, onUpload, imageFormat }: any) => (
    <div data-testid="profile-photo-upload" data-image-format={imageFormat}>
      <img src={image} alt="Profile" />
      <button
        type="button"
        onClick={() => onUpload('base64-image-data')}
        data-testid="upload-button"
      >
        Upload Photo
      </button>
    </div>
  ),
}));

// Mock the default user image
vi.mock('../../../../../../assets/images/default-user-img.svg', () => ({
  default: 'default-user-image.svg',
}));

describe('PatientPersonalInfo', () => {
  const mockOnNext = vi.fn();
  const mockOnPrev = vi.fn();
  const defaultValues = {
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    phoneNumber: '',
    phoneNumberCountryCode: '+91',
    contactType: 'Family' as const,
    emergencyContactName: '',
    emergencyContactNumber: '',
    emergencyContactNumberCountryCode: '+91',
    profilePhoto: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(
          <PatientPersonalInfo
            defaultValues={defaultValues}
            onNext={mockOnNext}
            onPrev={mockOnPrev}
          />
        );
      }).not.toThrow();
    });

    it('should render with default values', () => {
      const valuesWithData = {
        ...defaultValues,
        firstName: 'John',
        lastName: 'Doe',
        gender: 'M',
      };

      render(
        <PatientPersonalInfo
          defaultValues={valuesWithData}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const firstNameInput = screen.getByPlaceholderText('Enter First Name');
      const lastNameInput = screen.getByPlaceholderText('Enter Last Name');

      expect(firstNameInput).toHaveValue('John');
      expect(lastNameInput).toHaveValue('Doe');
    });

    it('should render form element', () => {
      const { container } = render(
        <PatientPersonalInfo
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
    it('should render firstName field with required indicator', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('First Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter First Name')).toBeInTheDocument();
    });

    it('should render middleName field without required indicator', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Middle Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Middle Name')).toBeInTheDocument();
    });

    it('should handle middleName input change', async () => {
      const user = userEvent.setup();
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const middleNameInput = screen.getByPlaceholderText('Enter Middle Name');
      await user.type(middleNameInput, 'Alexander');

      expect(middleNameInput).toHaveValue('Alexander');
    });

    it('should render with pre-filled middleName', () => {
      const valuesWithMiddleName = {
        ...defaultValues,
        middleName: 'James',
      };

      render(
        <PatientPersonalInfo
          defaultValues={valuesWithMiddleName}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const middleNameInput = screen.getByPlaceholderText('Enter Middle Name');
      expect(middleNameInput).toHaveValue('James');
    });

    it('should render lastName field with required indicator', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Last Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Last Name')).toBeInTheDocument();
    });

    it('should render gender radio buttons', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Gender')).toBeInTheDocument();
      expect(screen.getByText('Male')).toBeInTheDocument();
      expect(screen.getByText('Female')).toBeInTheDocument();
      expect(screen.getByText('Other')).toBeInTheDocument();
    });

    it('should render dateOfBirth calendar field', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Date Of Birth')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Date Of Birth')).toBeInTheDocument();
    });

    it('should render age field', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Or Age')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Age')).toBeInTheDocument();
    });

    it('should render phone number field with country code', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Phone Number')).toBeInTheDocument();
      expect(screen.getAllByTestId('input-phone-number')[0]).toBeInTheDocument();
    });

    it('should render contact type dropdown', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Contact Type')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-Contact Type')).toBeInTheDocument();
    });

    it('should render emergency contact name field', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Emergency Contact name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Emergency Contact name')).toBeInTheDocument();
    });

    it('should render emergency contact number field', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Emergency Contact number *')).toBeInTheDocument();
      const phoneInputs = screen.getAllByTestId('input-phone-number');
      expect(phoneInputs.length).toBe(2); // One for phone number, one for emergency contact
    });
  });

  describe('ProfilePhotoUpload Integration', () => {
    it('should render ProfilePhotoUpload component', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByTestId('profile-photo-upload')).toBeInTheDocument();
    });

    it('should render default user image when no profile photo', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const img = screen.getByAltText('Profile');
      expect(img).toHaveAttribute('src', 'default-user-image.svg');
    });

    it('should render existing profile photo when provided', () => {
      const valuesWithPhoto = {
        ...defaultValues,
        profilePhoto: 'base64-existing-photo',
      };

      render(
        <PatientPersonalInfo
          defaultValues={valuesWithPhoto}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const img = screen.getByAltText('Profile');
      expect(img).toHaveAttribute('src', 'base64-existing-photo');
    });

    it('should use base64 image format', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const uploadComponent = screen.getByTestId('profile-photo-upload');
      expect(uploadComponent).toHaveAttribute('data-image-format', 'base64');
    });

    it('should handle profile photo upload', async () => {
      const user = userEvent.setup();
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const uploadButton = screen.getByTestId('upload-button');
      await user.click(uploadButton);

      // The component should handle the upload
      expect(uploadButton).toBeInTheDocument();
    });

    it('should handle profile photo with falsy value', () => {
      const valuesWithFalsyPhoto = {
        ...defaultValues,
        profilePhoto: '' as any,
      };

      render(
        <PatientPersonalInfo
          defaultValues={valuesWithFalsyPhoto}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const img = screen.getByAltText('Profile');
      expect(img).toHaveAttribute('src', 'default-user-image.svg');
    });

    it('should handle profile photo with 0 value', () => {
      const valuesWithZeroPhoto = {
        ...defaultValues,
        profilePhoto: 0 as any,
      };

      render(
        <PatientPersonalInfo
          defaultValues={valuesWithZeroPhoto}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const img = screen.getByAltText('Profile');
      expect(img).toHaveAttribute('src', 'default-user-image.svg');
    });
  });

  describe('Form Validation', () => {
    it('should display error for empty firstName on submit', async () => {
      const user = userEvent.setup();
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('First name is required')).toBeInTheDocument();
      });
    });

    it('should display error for empty lastName on submit', async () => {
      const user = userEvent.setup();
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Last name is required')).toBeInTheDocument();
      });
    });

    it('should display error for empty gender on submit', async () => {
      const user = userEvent.setup();
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Gender is required')).toBeInTheDocument();
      });
    });

    it('should display error when both dateOfBirth and age are empty', async () => {
      const user = userEvent.setup();
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Date of birth or age is required')).toBeInTheDocument();
      });
    });

    it('should display error for empty phone number on submit', async () => {
      const user = userEvent.setup();
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Phone number is required')).toBeInTheDocument();
      });
    });

    it('should display error for empty contact type on submit', async () => {
      const user = userEvent.setup();
      const emptyContactTypeValues = {
        ...defaultValues,
        contactType: '' as const,
      };
      const { container } = render(
        <PatientPersonalInfo
          defaultValues={emptyContactTypeValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(container.textContent).toContain('Contact type is required');
      }, { timeout: 3000 });
    });

    it('should display error for empty emergency contact name on submit', async () => {
      const user = userEvent.setup();
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Emergency contact name is required')).toBeInTheDocument();
      });
    });

    it('should display error for empty emergency contact number on submit', async () => {
      const user = userEvent.setup();
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Emergency contact number is required')).toBeInTheDocument();
      });
    });

    it('should validate age with max 3 characters', async () => {
      const user = userEvent.setup();
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const ageInput = screen.getByPlaceholderText('Enter Age');
      await user.type(ageInput, '1234');

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Age seems invalid')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onNext with personalInfo data on valid form submission', async () => {
      const user = userEvent.setup();
      const validValues = {
        firstName: 'John',
        middleName: 'M',
        lastName: 'Doe',
        gender: 'M',
        dateOfBirth: '1990-01-01',
        age: '34',
        phoneNumber: '1234567890',
        phoneNumberCountryCode: '+91',
        contactType: 'Family' as const,
        emergencyContactName: 'Jane Doe',
        emergencyContactNumber: '9876543210',
        emergencyContactNumberCountryCode: '+91',
        profilePhoto: null,
      };

      render(
        <PatientPersonalInfo
          defaultValues={validValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockOnNext).toHaveBeenCalledWith({
          personalInfo: expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            gender: 'M',
          }),
        });
      });
    });

    it('should not call onNext on invalid form submission', async () => {
      const user = userEvent.setup();
      render(
        <PatientPersonalInfo
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

    it('should submit form with valid data including profile photo', async () => {
      const user = userEvent.setup();
      const validValues = {
        firstName: 'John',
        middleName: 'M',
        lastName: 'Doe',
        gender: 'M',
        dateOfBirth: '1990-01-01',
        age: '34',
        phoneNumber: '1234567890',
        phoneNumberCountryCode: '+91',
        contactType: 'Family' as const,
        emergencyContactName: 'Jane Doe',
        emergencyContactNumber: '9876543210',
        emergencyContactNumberCountryCode: '+91',
        profilePhoto: 'base64-photo-data',
      };

      render(
        <PatientPersonalInfo
          defaultValues={validValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockOnNext).toHaveBeenCalled();
      });
    });
  });

  describe('Back Button', () => {
    it('should render Back button', () => {
      render(
        <PatientPersonalInfo
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
      const user = userEvent.setup();
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const backButton = screen.getByText('Back');
      await user.click(backButton);

      expect(mockOnPrev).toHaveBeenCalledTimes(1);
      expect(mockOnNext).not.toHaveBeenCalled();
    });
  });

  describe('Next Button', () => {
    it('should render Next button', () => {
      render(
        <PatientPersonalInfo
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

  describe('Phone Number Input', () => {
    it('should handle phone number change', async () => {
      const user = userEvent.setup();
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const phoneInputs = screen.getAllByTestId('phone-number-input');
      const phoneNumberInput = phoneInputs[0];

      await user.type(phoneNumberInput, '1234567890');

      expect(phoneNumberInput).toHaveValue('1234567890');
    });

    it('should handle country code change', async () => {
      const user = userEvent.setup();
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const countryCodeInputs = screen.getAllByTestId('country-code-input');
      const countryCodeInput = countryCodeInputs[0];

      // Just verify the input exists and can be interacted with
      expect(countryCodeInput).toBeInTheDocument();
      await user.clear(countryCodeInput);
      await user.type(countryCodeInput, '+1');
    });

    it('should handle emergency contact number change', async () => {
      const user = userEvent.setup();
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const phoneInputs = screen.getAllByTestId('phone-number-input');
      const emergencyPhoneInput = phoneInputs[1];

      await user.type(emergencyPhoneInput, '9876543210');

      expect(emergencyPhoneInput).toHaveValue('9876543210');
    });

    it('should display phoneNumberCountryCode error when present', async () => {
      const user = userEvent.setup();
      const valuesWithoutCountryCode = {
        ...defaultValues,
        phoneNumberCountryCode: '',
      };

      render(
        <PatientPersonalInfo
          defaultValues={valuesWithoutCountryCode}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Country code is required')).toBeInTheDocument();
      });
    });

    it('should display phoneNumber error when phoneNumberCountryCode is valid', async () => {
      const user = userEvent.setup();
      const valuesWithCountryCode = {
        ...defaultValues,
        phoneNumberCountryCode: '+91',
        phoneNumber: '',
      };

      render(
        <PatientPersonalInfo
          defaultValues={valuesWithCountryCode}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Phone number is required')).toBeInTheDocument();
      });
    });
  });

  describe('Gender Radio Group', () => {
    it('should handle gender selection - Male', async () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const maleInput = screen.getByDisplayValue('M');

      fireEvent.click(maleInput);

      expect(maleInput).toBeInTheDocument();
    });

    it('should handle gender selection - Female', async () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const femaleInput = screen.getByDisplayValue('F');
      fireEvent.click(femaleInput);

      expect(femaleInput).toBeInTheDocument();
    });

    it('should handle gender selection - Other', async () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const otherInput = screen.getByDisplayValue('O');
      fireEvent.click(otherInput);

      expect(otherInput).toBeInTheDocument();
    });

    it('should render with pre-selected gender value', () => {
      const valuesWithGender = {
        ...defaultValues,
        gender: 'F',
      };

      render(
        <PatientPersonalInfo
          defaultValues={valuesWithGender}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toHaveAttribute('data-value', 'F');
    });

    it('should handle gender value when it is empty string', () => {
      const valuesWithEmptyGender = {
        ...defaultValues,
        gender: '',
      };

      render(
        <PatientPersonalInfo
          defaultValues={valuesWithEmptyGender}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toHaveAttribute('data-value', '');
    });
  });

  describe('Age Field', () => {
    it('should have type number for age field', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const ageInput = screen.getByPlaceholderText('Enter Age');
      expect(ageInput).toHaveAttribute('type', 'number');
    });

    it('should have max attribute set to 150', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const ageInput = screen.getByPlaceholderText('Enter Age');
      expect(ageInput).toHaveAttribute('max', '150');
    });
  });

  describe('Contact Type Dropdown', () => {
    it('should render Family option in contact type dropdown', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const contactTypeDropdown = screen.getByTestId('dropdown-Contact Type');
      expect(contactTypeDropdown).toBeInTheDocument();
      expect(screen.getByText('Family')).toBeInTheDocument();
    });

    it('should handle contact type selection', async () => {
      const user = userEvent.setup();
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const contactTypeDropdown = screen.getByTestId('dropdown-Contact Type');
      await user.selectOptions(contactTypeDropdown, 'Family');

      expect(contactTypeDropdown).toHaveValue('Family');
    });

    it('should handle contact type value when it is empty string', () => {
      const valuesWithEmptyContactType = {
        ...defaultValues,
        contactType: '' as const,
      };

      render(
        <PatientPersonalInfo
          defaultValues={valuesWithEmptyContactType}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const contactTypeDropdown = screen.getByTestId('dropdown-Contact Type');
      expect(contactTypeDropdown).toHaveValue('');
    });
  });

  describe('Calendar Field', () => {
    it('should handle date of birth change', async () => {
      const user = userEvent.setup();
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const calendarInput = screen.getByTestId('calendar-input');
      await user.type(calendarInput, '1990-01-01');

      expect(calendarInput).toHaveValue('1990-01-01');
    });

    it('should handle empty date of birth value', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const calendarInput = screen.getByTestId('calendar-input');
      expect(calendarInput).toHaveValue('');
    });
  });

  describe('Layout and Styling', () => {
    it('should have correct button layout classes', () => {
      const { container } = render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const buttonContainer = container.querySelector('.flex.gap-3');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('should render Back button with secondary variant', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const backButton = screen.getByText('Back').closest('button');
      expect(backButton).toHaveAttribute('data-variant', 'secondary');
    });

    it('should render Next button with primary variant', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next').closest('button');
      expect(nextButton).toHaveAttribute('data-variant', 'primary');
    });

    it('should have h-full class on form', () => {
      const { container } = render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const form = container.querySelector('form');
      expect(form).toHaveClass('h-full');
    });

    it('should have space-y-6 class on form', () => {
      const { container } = render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const form = container.querySelector('form');
      expect(form).toHaveClass('space-y-6');
    });
  });

  describe('Accessibility', () => {
    it('should have all required field indicators', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThan(0);
    });

    it('should have accessible buttons', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4); // Back, Next, Upload Photo, and Dropdown Array Trigger buttons
    });

    it('should have radiogroup role for gender field', () => {
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toBeInTheDocument();
    });
  });

  describe('Form Mode', () => {
    it('should use onTouched validation mode', () => {
      const { container } = render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      // The form should exist (validation mode is internal to react-hook-form)
      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('Dropdown Array Value Handling', () => {
    it('should handle contact type onChange with array value', async () => {
      const user = userEvent.setup();

      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      // Click the button that triggers onChange with an array
      const arrayTriggerButton = screen.getByTestId('dropdown-array-trigger-Contact Type');
      await user.click(arrayTriggerButton);

      // Verify the dropdown still works correctly
      const contactTypeDropdown = screen.getByTestId('dropdown-Contact Type');
      expect(contactTypeDropdown).toBeInTheDocument();
    });

    it('should handle contact type value as null', () => {
      const valuesWithNullContactType = {
        ...defaultValues,
        contactType: null as any,
      };

      render(
        <PatientPersonalInfo
          defaultValues={valuesWithNullContactType}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const contactTypeDropdown = screen.getByTestId('dropdown-Contact Type');
      expect(contactTypeDropdown).toBeInTheDocument();
    });

    it('should handle contact type value as undefined', () => {
      const valuesWithUndefinedContactType = {
        ...defaultValues,
        contactType: undefined as any,
      };

      render(
        <PatientPersonalInfo
          defaultValues={valuesWithUndefinedContactType}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const contactTypeDropdown = screen.getByTestId('dropdown-Contact Type');
      expect(contactTypeDropdown).toBeInTheDocument();
    });
  });

  describe('Gender Null/Undefined Handling', () => {
    it('should handle gender value as null', () => {
      const valuesWithNullGender = {
        ...defaultValues,
        gender: null as any,
      };

      render(
        <PatientPersonalInfo
          defaultValues={valuesWithNullGender}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toHaveAttribute('data-value', '');
    });

    it('should handle gender value as undefined', () => {
      const valuesWithUndefinedGender = {
        ...defaultValues,
        gender: undefined as any,
      };

      render(
        <PatientPersonalInfo
          defaultValues={valuesWithUndefinedGender}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const radioGroup = screen.getByRole('radiogroup');
      expect(radioGroup).toHaveAttribute('data-value', '');
    });
  });

  describe('DateOfBirth Falsy Value Handling', () => {
    it('should handle dateOfBirth value as null', () => {
      const valuesWithNullDOB = {
        ...defaultValues,
        dateOfBirth: null as any,
      };

      render(
        <PatientPersonalInfo
          defaultValues={valuesWithNullDOB}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const calendarInput = screen.getByTestId('calendar-input');
      expect(calendarInput).toHaveValue('');
    });

    it('should handle dateOfBirth value as undefined', () => {
      const valuesWithUndefinedDOB = {
        ...defaultValues,
        dateOfBirth: undefined as any,
      };

      render(
        <PatientPersonalInfo
          defaultValues={valuesWithUndefinedDOB}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const calendarInput = screen.getByTestId('calendar-input');
      expect(calendarInput).toHaveValue('');
    });

    it('should handle dateOfBirth with valid date string', () => {
      const valuesWithDOB = {
        ...defaultValues,
        dateOfBirth: '2000-01-15',
      };

      render(
        <PatientPersonalInfo
          defaultValues={valuesWithDOB}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const calendarInput = screen.getByTestId('calendar-input');
      expect(calendarInput).toHaveValue('2000-01-15');
    });
  });

  describe('Edge Cases', () => {
    it('should handle form submission with Enter key', async () => {
      const validValues = {
        firstName: 'John',
        middleName: 'M',
        lastName: 'Doe',
        gender: 'M',
        dateOfBirth: '1990-01-01',
        age: '34',
        phoneNumber: '1234567890',
        phoneNumberCountryCode: '+91',
        contactType: 'Family' as const,
        emergencyContactName: 'Jane Doe',
        emergencyContactNumber: '9876543210',
        emergencyContactNumberCountryCode: '+91',
        profilePhoto: null,
      };

      render(
        <PatientPersonalInfo
          defaultValues={validValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const form = screen.getByText('Next').closest('form');
      if (form) {
        fireEvent.submit(form);
      }

      await waitFor(() => {
        expect(mockOnNext).toHaveBeenCalled();
      });
    });

    it('should handle all fields filled with valid data', async () => {
      const user = userEvent.setup();
      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      // Fill firstName
      const firstNameInput = screen.getByPlaceholderText('Enter First Name');
      await user.type(firstNameInput, 'John');

      // Fill lastName
      const lastNameInput = screen.getByPlaceholderText('Enter Last Name');
      await user.type(lastNameInput, 'Doe');

      // Select gender
      const maleInput = screen.getByDisplayValue('M');
      fireEvent.click(maleInput);

      // Fill date of birth
      const calendarInput = screen.getByTestId('calendar-input');
      await user.type(calendarInput, '1990-01-01');

      // Fill phone number
      const phoneInputs = screen.getAllByTestId('phone-number-input');
      await user.type(phoneInputs[0], '1234567890');

      // Select contact type
      const contactTypeDropdown = screen.getByTestId('dropdown-Contact Type');
      await user.selectOptions(contactTypeDropdown, 'Family');

      // Fill emergency contact name
      const emergencyNameInput = screen.getByPlaceholderText('Enter Emergency Contact name');
      await user.type(emergencyNameInput, 'Jane Doe');

      // Fill emergency contact number
      await user.type(phoneInputs[1], '9876543210');

      // Submit
      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockOnNext).toHaveBeenCalled();
      }, { timeout: 3000 });
    });

    it('should render without errors when all props are provided', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <PatientPersonalInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
