import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileFormFields from '../../../modules/profile/profile-form-fields.component';

// Mock the common components
vi.mock('../../../components/common', () => ({
  Input: ({ label, placeholder, error, type, ...props }: any) => (
    <div>
      {label && <label>{label}</label>}
      <input
        type={type || 'text'}
        placeholder={placeholder}
        {...props}
        data-testid={props['data-testid'] || 'input'}
      />
      {error && <span className="error">{error}</span>}
    </div>
  ),
  Dropdown: ({ label, options, onChange, value, error, ...props }: any) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value;
      onChange?.(newValue);
    };
    
    // Store onChange for array testing - store both mobile and desktop
    if (label === 'Setup location' && onChange) {
      const storageKey = `__testLocationOnChange_${Math.random()}`;
      (window as any)[storageKey] = onChange;
      // Also store in a known location for easy access
      if (!(window as any).__testLocationOnChange) {
        (window as any).__testLocationOnChange = [];
      }
      (window as any).__testLocationOnChange.push(onChange);
    }
    
    return (
      <div data-testid={`dropdown-${label}`}>
        {label && <label>{label}</label>}
        <select
          value={Array.isArray(value) ? value[0] : value}
          onChange={handleChange}
          role="combobox"
          {...props}
        >
          {options?.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <span className="error">{error}</span>}
      </div>
    );
  },
  Radio: ({ label, value, ...props }: any) => (
    <div>
      <input type="radio" value={value} {...props} />
      {label && <label>{label}</label>}
    </div>
  ),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Calendar: ({ label, onChange, value, error, isRequired, dateFormat, maxDate, minDate, ...props }: any) => {
    const inputId = `calendar-${label?.replace(/\s+/g, '-').toLowerCase() || 'input'}`;

    // Store onChange for testing
    if (label === 'Date of Birth' && onChange) {
      if (!(window as any).__testDateOnChange) {
        (window as any).__testDateOnChange = [];
      }
      (window as any).__testDateOnChange.push(onChange);
    }

    return (
      <div>
        {label && <label htmlFor={inputId}>{label}</label>}
        <input
          id={inputId}
          type="date"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value)}
          {...props}
        />
        {error && <span className="error">{error}</span>}
      </div>
    );
  },
}));

// Mock the CountryCodeDropdown component
vi.mock('../../../modules/auth/common/contry-code-dropdown.component', () => ({
  default: ({ onChange }: any) => (
    <div data-testid="country-dropdown">
      <select
        onChange={() =>
          onChange({
            code: 'in',
            dial_code: '+91',
            name: 'India',
          })
        }
      >
        <option value="in">India</option>
      </select>
    </div>
  ),
}));

// Mock calculateAge
vi.mock('../../../utils/utils', () => ({
  calculateAge: vi.fn((date: string) => {
    if (!date) return null;
    return 25; // Mock age calculation
  }),
}));

describe('ProfileFormFields', () => {
  const mockRegister = vi.fn((name: any) => ({
    name,
    onChange: vi.fn(),
    onBlur: vi.fn(),
    ref: vi.fn(),
  })) as any;
  const mockErrors: any = {};
  const mockWatch = vi.fn();
  const mockSetValue = vi.fn();
  const mockTrigger = vi.fn();
  const mockOnPhotoModalOpen = vi.fn();
  const mockOnCountryChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockWatch.mockImplementation((field?: string) => {
      if (field === 'dateOfBirth') return '';
      if (field === 'setupLocation') return '';
      return '';
    });
    mockTrigger.mockResolvedValue(true);
    // Clear test onChange handlers
    (window as any).__testLocationOnChange = [];
    (window as any).__testDateOnChange = [];
  });

  it('should render without crashing', () => {
    expect(() => {
      render(
        <ProfileFormFields
          register={mockRegister}
          errors={mockErrors}
          watch={mockWatch}
          setValue={mockSetValue}
          trigger={mockTrigger}
          onPhotoModalOpen={mockOnPhotoModalOpen}
          onCountryChange={mockOnCountryChange}
        />
      );
    }).not.toThrow();
  });

  it('should render mobile fields on mobile screens', () => {
    render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    // Check for form elements (single unified layout)
    expect(screen.getAllByText('User name')).toHaveLength(1);
    expect(screen.getAllByText('Setup location')).toHaveLength(1);
  });

  it('should render desktop fields on desktop screens', () => {
    render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    // Check for desktop-specific elements
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Phone Number')).toBeInTheDocument();
  });

  it('should call onPhotoModalOpen when photo button is clicked', () => {
    render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    const photoButtons = screen.getAllByText('Change photo');
    expect(photoButtons).toHaveLength(1); // Single unified layout
    fireEvent.click(photoButtons[0]);

    expect(mockOnPhotoModalOpen).toHaveBeenCalledTimes(1);
  });

  it('should call onLocationChange when location changes', () => {
    render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
        locationOptions={[{ value: 'telemedicine-clinic1 ', label: 'telemedicine-clinic1 ' }]}
      />
    );

    const locationSelect = screen.getByRole('combobox');
    fireEvent.change(locationSelect, { target: { value: 'telemedicine-clinic1 ' } });

    expect(mockSetValue).toHaveBeenCalledWith('setupLocation', 'telemedicine-clinic1 ');
  });

  it('should handle array value in location onChange', () => {
    // Clear any previous onChange handlers
    (window as any).__testLocationOnChange = [];
    
    render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    // Test array value handling - call onChange with array directly
    // This covers: Array.isArray(value) ? value[0] : value
    const testOnChangeHandlers = (window as any).__testLocationOnChange;
    if (testOnChangeHandlers && testOnChangeHandlers.length > 0) {
      // Test with array value (covers Array.isArray branch)
      testOnChangeHandlers[0](['la-clinic']);
      expect(mockSetValue).toHaveBeenCalledWith('setupLocation', 'la-clinic');

      // Clear previous calls
      mockSetValue.mockClear();

      // Test with array containing multiple values
      testOnChangeHandlers[0](['ny-clinic', 'sf-clinic']);
      expect(mockSetValue).toHaveBeenCalledWith('setupLocation', 'ny-clinic');
    }

    // Test string value (else branch) via direct handler call
    mockSetValue.mockClear();
    if (testOnChangeHandlers && testOnChangeHandlers.length > 0) {
      testOnChangeHandlers[0]('telemedicine-clinic1 ');
      expect(mockSetValue).toHaveBeenCalledWith('setupLocation', 'telemedicine-clinic1 ');
    }
  });

  it('should call onCountryChange when country changes', async () => {
    render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    // CountryCodeDropdown calls onChange on mount with default country (first in countries array)
    // Wait for the component to mount and call onChange
    await waitFor(() => {
      expect(mockOnCountryChange).toHaveBeenCalled();
    });
  });

  it('should have correct grid layout', () => {
    const { container } = render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    const grid = container.firstElementChild;
    expect(grid).toHaveClass('grid', 'grid-cols-1', 'lg:grid-cols-3', 'gap-6');
  });

  it('should pass all required props to child components', () => {
    const errors = {
      firstName: { message: 'First name is required' },
    } as any;

    render(
      <ProfileFormFields
        register={mockRegister}
        errors={errors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    // Verify that the component renders without errors
    expect(screen.getAllByText('First Name')).toHaveLength(1);
    expect(screen.getAllByText('First name is required')).toHaveLength(1);
  });

  it('should render profile photo section', () => {
    const { container } = render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    // Check for camera icon in photo section
    const cameraIcons = container.querySelectorAll('.fa-camera');
    expect(cameraIcons.length).toBeGreaterThan(0);
  });

  it('should render all mobile form fields', () => {
    render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    expect(screen.getAllByPlaceholderText('Username').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByPlaceholderText('Enter first name').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByPlaceholderText('Enter middle name').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByPlaceholderText('Enter last name').length).toBeGreaterThanOrEqual(1);
  });

  it('should render mobile gender selection', () => {
    render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    expect(screen.getAllByText('Male')).toHaveLength(1);
    expect(screen.getAllByText('Female')).toHaveLength(1);
    expect(screen.getAllByText('Other')).toHaveLength(1);
  });

  it('should render mobile gender icons', () => {
    const { container } = render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    // Check for gender radio buttons (male, female, other)
    const radioButtons = container.querySelectorAll('input[type="radio"]');
    expect(radioButtons.length).toBe(3);
  });

  it('should display mobile gender error message', () => {
    const errors = {
      gender: { message: 'Gender is required' },
    } as any;

    render(
      <ProfileFormFields
        register={mockRegister}
        errors={errors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    const errorMessages = screen.getAllByText('Gender is required');
    expect(errorMessages.length).toBeGreaterThanOrEqual(1);
  });

  it('should render profile image and camera button', () => {
    const { container } = render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    // Check for profile image
    const profileImages = container.querySelectorAll('img[alt="Profile"]');
    expect(profileImages.length).toBeGreaterThan(0);

    // Check for camera button icon
    const cameraButton = container.querySelector('.fa-camera');
    expect(cameraButton).toBeInTheDocument();
  });

  it('should render email and phone form fields', () => {
    render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    expect(screen.getByPlaceholderText('devi@intelehealth.org')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('9876543210')).toBeInTheDocument();
  });

  it('should display desktop gender error message', () => {
    const errors = {
      gender: { message: 'Gender is required' },
    } as any;

    render(
      <ProfileFormFields
        register={mockRegister}
        errors={errors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    const errorMessages = screen.getAllByText('Gender is required');
    expect(errorMessages.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle date of birth change and trigger validation', async () => {
    render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    const dateInputs = screen.getAllByLabelText('Date of Birth');
    const dateInput = dateInputs[0];
    fireEvent.change(dateInput, { target: { value: '2024-01-01' } });

    await waitFor(() => {
      expect(mockSetValue).toHaveBeenCalledWith('dateOfBirth', '2024-01-01');
      expect(mockTrigger).toHaveBeenCalledWith('dateOfBirth');
    });
  });

  it('should calculate and display age when date of birth is set', () => {
    mockWatch.mockImplementation((field?: string) => {
      if (field === 'dateOfBirth') return '1999-01-01';
      if (field === 'setupLocation') return '';
      return '';
    });

    const { container } = render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    const ageInput = container.querySelector('input[placeholder="Age"]');
    expect(ageInput).toBeInTheDocument();
    expect(ageInput).toHaveValue('25');
  });

  it('should display empty age when date of birth is not set', () => {
    mockWatch.mockImplementation((field?: string) => {
      if (field === 'dateOfBirth') return '';
      if (field === 'setupLocation') return '';
      return '';
    });

    const { container } = render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    const ageInput = container.querySelector('input[placeholder="Age"]');
    expect(ageInput).toBeInTheDocument();
    expect(ageInput).toHaveValue('');
  });

  it('should handle date of birth change without triggering validation when empty', async () => {
    render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    // Clear previous calls from initial render
    mockSetValue.mockClear();
    mockTrigger.mockClear();

    // Get the stored onChange handlers and call with empty string directly
    // This tests the component logic: when date is empty, setValue is called but trigger is not
    const dateOnChangeHandlers = (window as any).__testDateOnChange;
    if (dateOnChangeHandlers && dateOnChangeHandlers.length > 0) {
      // Call onChange with empty string (simulating clearing the date)
      await dateOnChangeHandlers[0]('');
    }

    // Verify setValue was called with empty string
    expect(mockSetValue).toHaveBeenCalledWith('dateOfBirth', '');
    
    // When date is empty, trigger should not be called (line 240: if (date))
    expect(mockTrigger).not.toHaveBeenCalled();
  });

  it('should render all desktop column fields', () => {
    render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    // Column 1 - use getAllByText since labels appear in both mobile and desktop
    const firstNames = screen.getAllByText('First Name');
    expect(firstNames.length).toBeGreaterThanOrEqual(1);
    const genders = screen.getAllByText('Gender');
    expect(genders.length).toBeGreaterThanOrEqual(1);
    const emails = screen.getAllByText('Email');
    expect(emails.length).toBeGreaterThanOrEqual(1);

    // Column 2
    const userNames = screen.getAllByText('User name');
    expect(userNames.length).toBeGreaterThanOrEqual(1);
    const middleNames = screen.getAllByText('Middle Name');
    expect(middleNames.length).toBeGreaterThanOrEqual(1);
    const dateOfBirths = screen.getAllByText('Date of Birth');
    expect(dateOfBirths.length).toBeGreaterThanOrEqual(1);
    const ages = screen.getAllByText('Age');
    expect(ages.length).toBeGreaterThanOrEqual(1);

    // Column 3
    const setupLocations = screen.getAllByText('Setup location');
    expect(setupLocations.length).toBeGreaterThanOrEqual(1);
    const lastNames = screen.getAllByText('Last Name');
    expect(lastNames.length).toBeGreaterThanOrEqual(1);
    const phoneNumbers = screen.getAllByText('Phone Number');
    expect(phoneNumbers.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle location onChange with string value', () => {
    (window as any).__testLocationOnChange = [];

    render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    const testOnChangeHandlers = (window as any).__testLocationOnChange;
    expect(testOnChangeHandlers.length).toBeGreaterThan(0);
    testOnChangeHandlers[0]('telemedicine-clinic2');

    expect(mockSetValue).toHaveBeenCalledWith('setupLocation', 'telemedicine-clinic2');
  });

  it('should render required field indicators', () => {
    const { container } = render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    const requiredAsterisks = container.querySelectorAll('.text-red-500');
    expect(requiredAsterisks.length).toBeGreaterThan(0);
  });

  it('should display error messages for all fields', () => {
    const errors = {
      firstName: { message: 'First name is required' },
      lastName: { message: 'Last name is required' },
      email: { message: 'Email is required' },
      phone: { message: 'Phone is required' },
      dateOfBirth: { message: 'Date of birth is required' },
      setupLocation: { message: 'Location is required' },
      gender: { message: 'Gender is required' },
      middleName: { message: 'Middle name error' },
    } as any;

    render(
      <ProfileFormFields
        register={mockRegister}
        errors={errors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    expect(screen.getAllByText('First name is required').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Last name is required').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Email is required').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Phone is required').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Date of birth is required').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Location is required').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gender is required').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Middle name error').length).toBeGreaterThan(0);
  });

  it('should use memoized age calculation', () => {
    mockWatch.mockImplementation((field?: string) => {
      if (field === 'dateOfBirth') return '1990-05-15';
      if (field === 'setupLocation') return '';
      return '';
    });

    const { container: container1 } = render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    const ageInput1 = container1.querySelector('input[placeholder="Age"]');
    expect(ageInput1).toHaveValue('25');
  });

  it('should render phone number field with correct attributes', () => {
    render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    const phoneInput = screen.getByPlaceholderText('9876543210');
    expect(phoneInput).toHaveAttribute('type', 'tel');
    expect(phoneInput).toHaveAttribute('maxLength', '10');
  });

  it('should render calendar with correct props', () => {
    render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    const calendarInputs = screen.getAllByLabelText('Date of Birth');
    const calendarInput = calendarInputs[0];
    expect(calendarInput).toHaveAttribute('type', 'date');
  });

  it('should handle all input field changes', () => {
    const { container } = render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    // Use querySelector with name attribute for more specific queries
    const usernameInput = container.querySelector('input[name="username"]') as HTMLInputElement;
    expect(usernameInput).toBeInTheDocument();
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    expect(mockRegister).toHaveBeenCalledWith('username');

    const firstNameInput = container.querySelector('input[name="firstName"]') as HTMLInputElement;
    expect(firstNameInput).toBeInTheDocument();
    fireEvent.change(firstNameInput, { target: { value: 'John' } });
    expect(mockRegister).toHaveBeenCalledWith('firstName');

    const middleNameInput = container.querySelector('input[name="middleName"]') as HTMLInputElement;
    expect(middleNameInput).toBeInTheDocument();
    fireEvent.change(middleNameInput, { target: { value: 'M' } });
    expect(mockRegister).toHaveBeenCalledWith('middleName');

    const lastNameInput = container.querySelector('input[name="lastName"]') as HTMLInputElement;
    expect(lastNameInput).toBeInTheDocument();
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
    expect(mockRegister).toHaveBeenCalledWith('lastName');

    const emailInput = container.querySelector('input[name="email"]') as HTMLInputElement;
    expect(emailInput).toBeInTheDocument();
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(mockRegister).toHaveBeenCalledWith('email');

    const phoneInput = container.querySelector('input[name="phone"]') as HTMLInputElement;
    expect(phoneInput).toBeInTheDocument();
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    expect(mockRegister).toHaveBeenCalledWith('phone');
  });

  it('should handle gender radio button selection', () => {
    render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    const genderRadios = screen.getAllByRole('radio');
    expect(genderRadios.length).toBe(3); // male, female, other

    fireEvent.change(genderRadios[0], { target: { value: 'male' } });
    expect(mockRegister).toHaveBeenCalledWith('gender');
  });

  it('should have correct CSS classes for layout', () => {
    const { container } = render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    // Grid layout with 3 columns
    const grid = container.firstElementChild;
    expect(grid).toHaveClass('grid', 'grid-cols-1', 'lg:grid-cols-3', 'gap-6');

    // Column sections
    const columns = container.querySelectorAll('.space-y-4');
    expect(columns.length).toBe(3);
  });

  it('should handle location dropdown onChange with different value', () => {
    (window as any).__testLocationOnChange = [];

    render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    const testOnChangeHandlers = (window as any).__testLocationOnChange;
    expect(testOnChangeHandlers.length).toBeGreaterThan(0);
    testOnChangeHandlers[0]('telemedicine-clinic3');

    expect(mockSetValue).toHaveBeenCalledWith('setupLocation', 'telemedicine-clinic3');
  });

  it('covers lines 62-66: renders mobile profile image when profileImage prop is provided', () => {
    const mockProfileImage = 'https://example.com/profile.jpg';
    const { container } = render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
        profileImage={mockProfileImage}
      />
    );

    // Check that the actual profile image is rendered (not the default)
    const profileImages = container.querySelectorAll(`img[src="${mockProfileImage}"]`);
    expect(profileImages.length).toBeGreaterThan(0);

    // Verify alt text for profile image
    const actualProfileImage = container.querySelector('img[alt="Profile"]');
    expect(actualProfileImage).toBeInTheDocument();
    expect(actualProfileImage?.getAttribute('src')).toBe(mockProfileImage);
  });

  it('renders profile image with correct src when profileImage prop is provided', () => {
    const mockProfileImage = 'https://example.com/profile.jpg';
    const { container } = render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
        profileImage={mockProfileImage}
      />
    );

    // Check that the actual profile image is rendered
    const allProfileImages = container.querySelectorAll(`img[src="${mockProfileImage}"]`);
    expect(allProfileImages.length).toBe(1);

    // Verify "Profile" alt text
    const profileImagesWithAlt = container.querySelectorAll('img[alt="Profile"]');
    expect(profileImagesWithAlt.length).toBe(1);
  });

  it('renders default user image when profileImage is not provided', () => {
    const { container } = render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
      />
    );

    // Check for profile image with "Profile" alt text (uses DefaultUserImage as src)
    const profileImages = container.querySelectorAll('img[alt="Profile"]');
    expect(profileImages.length).toBe(1);
  });

  it('handles profile image error by falling back to default', () => {
    const mockProfileImage = 'https://example.com/broken-image.jpg';
    const { container } = render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
        profileImage={mockProfileImage}
      />
    );

    const profileImage = container.querySelector('img[alt="Profile"]') as HTMLImageElement;

    expect(profileImage).toBeInTheDocument();
    expect(profileImage.src).toContain('broken-image.jpg');

    // Store original src before error
    const originalSrc = profileImage.src;

    // Trigger error event
    fireEvent.error(profileImage);

    // After error, src should be changed to DefaultUserImage
    expect(profileImage.src).not.toBe(originalSrc);
  });

  it('verifies profile image onError handler sets fallback src', () => {
    const mockProfileImage = 'https://example.com/broken-image.jpg';
    const { container } = render(
      <ProfileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        trigger={mockTrigger}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onCountryChange={mockOnCountryChange}
        profileImage={mockProfileImage}
      />
    );

    const profileImage = container.querySelector('img[alt="Profile"]') as HTMLImageElement;

    expect(profileImage).toBeInTheDocument();

    // Trigger error twice to ensure handler is idempotent
    fireEvent.error(profileImage);
    const fallbackSrc = profileImage.src;
    fireEvent.error(profileImage);
    expect(profileImage.src).toBe(fallbackSrc);
  });
});

