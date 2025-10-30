import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MobileFormFields from '../../../modules/profile/profile-mobile-fields.component';

// Mock the common components
vi.mock('../../../components/common', () => ({
  Input: ({ label, placeholder, error, ...props }: any) => (
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
}));

describe('MobileFormFields', () => {
  const mockRegister = vi.fn();
  const mockErrors = {};
  const mockWatch = vi.fn();
  const mockSetValue = vi.fn();
  const mockOnPhotoModalOpen = vi.fn();
  const mockOnLocationChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockWatch.mockReturnValue('');
  });

  it('should render without crashing', () => {
    expect(() => {
      render(
        <MobileFormFields
          register={mockRegister}
          errors={mockErrors}
          watch={mockWatch}
          setValue={mockSetValue}
          onPhotoModalOpen={mockOnPhotoModalOpen}
          onLocationChange={mockOnLocationChange}
        />
      );
    }).not.toThrow();
  });

  it('should render profile photo section', () => {
    render(
      <MobileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onLocationChange={mockOnLocationChange}
      />
    );

    expect(screen.getByText('Change photo')).toBeInTheDocument();
  });

  it('should render all form fields', () => {
    render(
      <MobileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onLocationChange={mockOnLocationChange}
      />
    );

    expect(screen.getByText('User name')).toBeInTheDocument();
    expect(screen.getByText('Setup location')).toBeInTheDocument();
    expect(screen.getByText('First Name')).toBeInTheDocument();
    expect(screen.getByText('Middle Name')).toBeInTheDocument();
    expect(screen.getByText('Last Name')).toBeInTheDocument();
    expect(screen.getByText('Gender')).toBeInTheDocument();
  });

  it('should render gender radio buttons', () => {
    render(
      <MobileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onLocationChange={mockOnLocationChange}
      />
    );

    expect(screen.getByText('Male')).toBeInTheDocument();
    expect(screen.getByText('Female')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('should call onPhotoModalOpen when change photo is clicked', () => {
    render(
      <MobileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onLocationChange={mockOnLocationChange}
      />
    );

    const changePhotoButton = screen.getByText('Change photo');
    fireEvent.click(changePhotoButton);

    expect(mockOnPhotoModalOpen).toHaveBeenCalledTimes(1);
  });

  it('should call onLocationChange when location changes', () => {
    render(
      <MobileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onLocationChange={mockOnLocationChange}
      />
    );

    const locationSelect = screen.getByDisplayValue('');
    fireEvent.change(locationSelect, { target: { value: 'sf-clinic' } });

    expect(mockOnLocationChange).toHaveBeenCalledWith('sf-clinic');
  });

  it('should render required field indicators', () => {
    render(
      <MobileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onLocationChange={mockOnLocationChange}
      />
    );

    const requiredAsterisks = screen.getAllByText('*');
    expect(requiredAsterisks.length).toBeGreaterThan(0);
  });

  it('should display error messages when provided', () => {
    const errors = {
      firstName: { message: 'First name is required' },
      setupLocation: { message: 'Location is required' },
    };

    render(
      <MobileFormFields
        register={mockRegister}
        errors={errors}
        watch={mockWatch}
        setValue={mockSetValue}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onLocationChange={mockOnLocationChange}
      />
    );

    expect(screen.getByText('First name is required')).toBeInTheDocument();
    expect(screen.getByText('Location is required')).toBeInTheDocument();
  });

  it('should have correct mobile-specific classes', () => {
    const { container } = render(
      <MobileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onLocationChange={mockOnLocationChange}
      />
    );

    const mobileContainer = container.querySelector('div');
    expect(mobileContainer).toHaveClass('lg:hidden', 'space-y-4');
  });

  it('should render gender icons', () => {
    render(
      <MobileFormFields
        register={mockRegister}
        errors={mockErrors}
        watch={mockWatch}
        setValue={mockSetValue}
        onPhotoModalOpen={mockOnPhotoModalOpen}
        onLocationChange={mockOnLocationChange}
      />
    );

    // Check for gender icons (assuming they use FontAwesome classes)
    const genderIcons = container.querySelectorAll('.fa-mars, .fa-venus, .fa-transgender');
    expect(genderIcons.length).toBe(3);
  });
});
