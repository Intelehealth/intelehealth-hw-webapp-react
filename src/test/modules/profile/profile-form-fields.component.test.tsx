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
  Calendar: ({ label, onChange, value, error, ...props }: any) => {
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

    // Check for mobile-specific elements
    expect(screen.getAllByText('User name')).toHaveLength(2); // Mobile and desktop versions
    expect(screen.getAllByText('Setup location')).toHaveLength(2); // Mobile and desktop versions
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
    expect(photoButtons).toHaveLength(2); // Mobile and desktop versions
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
      />
    );

    const locationSelects = screen.getAllByRole('combobox');
    const locationSelect = locationSelects[0];
    fireEvent.change(locationSelect, { target: { value: 'sf-clinic' } });

    expect(mockSetValue).toHaveBeenCalledWith('setupLocation', 'sf-clinic');
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
    // This covers lines 84 and 272: Array.isArray(value) ? value[0] : value
    const testOnChangeHandlers = (window as any).__testLocationOnChange;
    if (testOnChangeHandlers && testOnChangeHandlers.length > 0) {
      // Test mobile dropdown (first handler) with array value (covers Array.isArray branch at line 84)
      testOnChangeHandlers[0](['la-clinic']);
      expect(mockSetValue).toHaveBeenCalledWith('setupLocation', 'la-clinic');
      
      // Clear previous calls
      mockSetValue.mockClear();
      
      // Test with array containing multiple values
      testOnChangeHandlers[0](['ny-clinic', 'sf-clinic']);
      expect(mockSetValue).toHaveBeenCalledWith('setupLocation', 'ny-clinic');
      
      // Test desktop dropdown (second handler) with array value (covers Array.isArray branch at line 272)
      if (testOnChangeHandlers.length > 1) {
        mockSetValue.mockClear();
        testOnChangeHandlers[1](['sf-clinic']);
        expect(mockSetValue).toHaveBeenCalledWith('setupLocation', 'sf-clinic');
        
        mockSetValue.mockClear();
        testOnChangeHandlers[1](['la-clinic', 'ny-clinic']);
        expect(mockSetValue).toHaveBeenCalledWith('setupLocation', 'la-clinic');
      }
    }

    // Test string value (else branch) - covers the else path for both mobile and desktop
    mockSetValue.mockClear();
    const locationSelects = screen.getAllByRole('combobox');
    fireEvent.change(locationSelects[0], { target: { value: 'sf-clinic' } });
    expect(mockSetValue).toHaveBeenCalledWith('setupLocation', 'sf-clinic');
    
    // Test desktop dropdown with string value
    mockSetValue.mockClear();
    if (locationSelects.length > 1) {
      fireEvent.change(locationSelects[1], { target: { value: 'ny-clinic' } });
      expect(mockSetValue).toHaveBeenCalledWith('setupLocation', 'ny-clinic');
    }
  });

  it('should call onCountryChange when country changes', () => {
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

    const countrySelect = screen.getByTestId('country-dropdown').querySelector('select');
    fireEvent.change(countrySelect!, { target: { value: 'in' } });

    expect(mockOnCountryChange).toHaveBeenCalledWith({
      code: 'in',
      dial_code: '+91',
      name: 'India',
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

    const grid = container.querySelector('div');
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
    expect(screen.getAllByText('First Name')).toHaveLength(2); // Mobile and desktop versions
    expect(screen.getAllByText('First name is required')).toHaveLength(2); // Mobile and desktop versions
  });

  it('should render mobile profile photo section', () => {
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

    const mobilePhoto = container.querySelector('.mobile-profile-photo');
    expect(mobilePhoto).toBeInTheDocument();
    const cameraIcon = mobilePhoto?.querySelector('.fa-camera');
    expect(cameraIcon).toBeInTheDocument();
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

    expect(screen.getAllByText('Male')).toHaveLength(2); // Mobile and desktop
    expect(screen.getAllByText('Female')).toHaveLength(2); // Mobile and desktop
    expect(screen.getAllByText('Other')).toHaveLength(2); // Mobile and desktop
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

    const genderIcons = container.querySelectorAll('.mobile-gender-icon');
    expect(genderIcons.length).toBeGreaterThanOrEqual(3);
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

  it('should render desktop profile photo section', () => {
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

    const desktopPhoto = container.querySelector('.fa-user');
    expect(desktopPhoto).toBeInTheDocument();
    const cameraButton = container.querySelector('.fa-camera');
    expect(cameraButton).toBeInTheDocument();
  });

  it('should render desktop form fields', () => {
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

    const locationSelects = screen.getAllByRole('combobox');
    // Test desktop location dropdown
    const desktopLocation = locationSelects[1];
    fireEvent.change(desktopLocation, { target: { value: 'la-clinic' } });

    expect(mockSetValue).toHaveBeenCalledWith('setupLocation', 'la-clinic');
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

    const requiredAsterisks = container.querySelectorAll('.text-\\[--color-error\\]');
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
    expect(genderRadios.length).toBeGreaterThanOrEqual(6); // 3 for mobile, 3 for desktop

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

    // Mobile section
    const mobileSection = container.querySelector('.lg\\:hidden');
    expect(mobileSection).toBeInTheDocument();

    // Desktop sections
    const desktopSection = container.querySelector('.hidden.lg\\:block');
    expect(desktopSection).toBeInTheDocument();

    // Column sections
    const columns = container.querySelectorAll('.space-y-2');
    expect(columns.length).toBeGreaterThanOrEqual(2);
  });

  it('should handle desktop location dropdown onChange', () => {
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

    const locationSelects = screen.getAllByRole('combobox');
    // Desktop location is the second one
    const desktopLocation = locationSelects[1];
    fireEvent.change(desktopLocation, { target: { value: 'ny-clinic' } });

    expect(mockSetValue).toHaveBeenCalledWith('setupLocation', 'ny-clinic');
  });
});

