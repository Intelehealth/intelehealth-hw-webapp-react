import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileFormFields from '../../../modules/profile/profile-form-fields.component';

// Mock the common components
vi.mock('../../../components/common', () => ({
  Input: ({ label, placeholder, error, isRequired, size, ...props }: any) => (
    <div>
      <label>{label}</label>
      <input placeholder={placeholder} {...props} />
      {error && <span className="error">{error}</span>}
    </div>
  ),
  Dropdown: ({ label, options, onChange, value, ...props }: any) => (
    <div>
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange?.(e.target.value)} {...props}>
        {options?.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  ),
  Radio: ({ label, value, ...props }: any) => (
    <div>
      <input type="radio" value={value} {...props} />
      <label>{label}</label>
    </div>
  ),
  Calendar: ({ label, onChange, value, dateFormat, maxDate, minDate, ...props }: any) => (
    <div>
      <label>{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      />
    </div>
  ),
}));

// Mock the CountryCodeDropdown component
vi.mock('../../../modules/auth/common/contry-code-dropdown.component', () => ({
  default: ({ onChange }: any) => (
    <div data-testid="country-dropdown">
      <select onChange={() => onChange({ code: 'in', dial_code: '+91', name: 'India' })}>
        <option value="in">India</option>
      </select>
    </div>
  ),
}));

describe('ProfileFormFields', () => {
  const mockRegister = vi.fn();
  const mockErrors = {};
  const mockWatch = vi.fn();
  const mockSetValue = vi.fn();
  const mockTrigger = vi.fn();
  const mockOnPhotoModalOpen = vi.fn();
  const mockOnCountryChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockWatch.mockReturnValue('');
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

    // Check for mobile-specific elements - use getAllByText since there are multiple instances
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
    const locationSelect = locationSelects.find(select => 
      select.closest('div')?.querySelector('label')?.textContent === 'Setup location'
    );
    fireEvent.change(locationSelect!, { target: { value: 'sf-clinic' } });

    expect(mockSetValue).toHaveBeenCalledWith('setupLocation', 'sf-clinic');
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

    expect(mockOnCountryChange).toHaveBeenCalledWith({ code: 'in', dial_code: '+91', name: 'India' });
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
});
