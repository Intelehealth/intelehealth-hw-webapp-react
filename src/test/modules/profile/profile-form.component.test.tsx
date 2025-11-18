import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileForm from '../../../modules/profile/profile-form.component';

// Mock the useProfile hook
const mockProfile = {
  username: 'johndoe',
  firstName: 'John',
  middleName: 'M',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '1234567890',
  dateOfBirth: '1990-01-01',
  gender: 'male' as const,
  setupLocation: 'sf-clinic',
};

const mockUpdateProfile = vi.fn();
const mockUploadPhoto = vi.fn();
const mockTakePhoto = vi.fn();

const mockUseProfile = vi.fn();

vi.mock('../../../modules/profile/profile.hooks', () => ({
  useProfile: (...args: any[]) => mockUseProfile(...args),
}));

// Mock react-hook-form
const mockRegister = vi.fn((name) => ({
  name,
  onChange: vi.fn(),
  onBlur: vi.fn(),
  ref: vi.fn(),
}));

const mockHandleSubmit = vi.fn((callback) => (e: React.FormEvent) => {
  e.preventDefault();
  return callback({
    username: 'johndoe',
    firstName: 'John',
    middleName: 'M',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '1234567890',
    dateOfBirth: '1990-01-01',
    gender: 'male' as const,
    setupLocation: 'sf-clinic',
  });
});

const mockSetValue = vi.fn();
const mockWatch = vi.fn();
const mockReset = vi.fn();
const mockTrigger = vi.fn();

const mockUseForm = vi.fn(() => ({
  register: mockRegister,
  handleSubmit: mockHandleSubmit,
  formState: {
    errors: {},
    isSubmitting: false,
  },
  setValue: mockSetValue,
  watch: mockWatch,
  reset: mockReset,
  trigger: mockTrigger,
}));

vi.mock('react-hook-form', () => ({
  useForm: (...args: any[]) => (mockUseForm as (...args: any[]) => any)(...args),
  yupResolver: vi.fn(),
}));

// Mock child components
vi.mock('../../../components/common', () => ({
  Button: ({ children, onClick, type, isLoading, loadingText, ...props }: any) => (
    <button
      type={type || 'button'}
      onClick={onClick}
      disabled={isLoading}
      data-testid="save-button"
      {...props}
    >
      {isLoading ? loadingText : children}
    </button>
  ),
  PhotoUploadModal: ({ isOpen, onClose, onTakePhoto, onUploadPhoto }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="photo-upload-modal">
        <button data-testid="modal-close" onClick={onClose}>
          Close
        </button>
        <button data-testid="modal-take-photo" onClick={onTakePhoto}>
          Take Photo
        </button>
        <input
          data-testid="modal-upload-photo"
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onUploadPhoto(file);
            }
          }}
        />
      </div>
    );
  },
  Card: ({ children, className, contentClassName, ...props }: any) => (
    <div data-testid="card" className={className} data-content-class={contentClassName} {...props}>
      {children}
    </div>
  ),
}));

vi.mock('../../../components/common/card.component', () => ({
  default: ({ children, className, contentClassName, ...props }: any) => (
    <div data-testid="card" className={className} data-content-class={contentClassName} {...props}>
      {children}
    </div>
  ),
}));

vi.mock('../../../modules/profile/profile-header.component', () => ({
  default: ({ notificationsEnabled, onNotificationsChange }: any) => (
    <div data-testid="profile-header">
      <input
        type="checkbox"
        checked={notificationsEnabled}
        onChange={(e) => onNotificationsChange(e.target.checked)}
        data-testid="notifications-toggle"
      />
    </div>
  ),
}));

vi.mock('../../../modules/profile/profile-form-fields.component', () => ({
  default: ({ onPhotoModalOpen, onCountryChange }: any) => (
    <div data-testid="profile-form-fields">
      <button data-testid="open-photo-modal" onClick={onPhotoModalOpen}>
        Open Photo Modal
      </button>
      <button data-testid="country-change" onClick={() => onCountryChange({ name: 'India', code: 'in', dial_code: '+91' })}>
        Change Country
      </button>
    </div>
  ),
}));

vi.mock('../../../modules/profile/password-section.component', () => ({
  default: ({ passwordData, onPasswordChange, onGeneratePassword }: any) => (
    <div data-testid="password-section">
      <button data-testid="generate-password" onClick={onGeneratePassword}>
        Generate Password
      </button>
      <input
        data-testid="current-password"
        type="password"
        value={passwordData.currentPassword}
        onChange={(e) =>
          onPasswordChange({
            ...passwordData,
            currentPassword: e.target.value,
          })
        }
      />
      <input
        data-testid="new-password"
        type="password"
        value={passwordData.newPassword}
        onChange={(e) =>
          onPasswordChange({
            ...passwordData,
            newPassword: e.target.value,
          })
        }
      />
      <input
        data-testid="confirm-password"
        type="password"
        value={passwordData.confirmPassword}
        onChange={(e) =>
          onPasswordChange({
            ...passwordData,
            confirmPassword: e.target.value,
          })
        }
      />
    </div>
  ),
}));

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateProfile.mockResolvedValue(undefined);
    mockUploadPhoto.mockResolvedValue(undefined);
    mockTakePhoto.mockResolvedValue(undefined);
    mockWatch.mockImplementation((field?: string) => {
      if (field) return mockProfile[field as keyof typeof mockProfile];
      return mockProfile;
    });
    // Set default mock implementation
    mockUseProfile.mockReturnValue({
      profile: mockProfile,
      loading: false,
      updateProfile: mockUpdateProfile,
      uploadPhoto: mockUploadPhoto,
      takePhoto: mockTakePhoto,
    });
  });

  it('should render without crashing', () => {
    expect(() => {
      render(<ProfileForm />);
    }).not.toThrow();
  });

  it('should render loading state when profile is null and loading is true', () => {
    mockUseProfile.mockReturnValueOnce({
      profile: null,
      loading: true,
      updateProfile: mockUpdateProfile,
      uploadPhoto: mockUploadPhoto,
      takePhoto: mockTakePhoto,
    });

    render(<ProfileForm />);

    expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    const spinner = screen.getByText('Loading profile...').previousElementSibling;
    expect(spinner).toHaveClass('animate-spin');
  });

  it('should render form when profile is loaded', () => {
    mockUseProfile.mockReturnValueOnce({
      profile: mockProfile,
      loading: false,
      updateProfile: mockUpdateProfile,
      uploadPhoto: mockUploadPhoto,
      takePhoto: mockTakePhoto,
    });

    render(<ProfileForm />);

    expect(screen.getByTestId('profile-header')).toBeInTheDocument();
    expect(screen.getByTestId('profile-form-fields')).toBeInTheDocument();
    expect(screen.getByTestId('password-section')).toBeInTheDocument();
    expect(screen.getByTestId('save-button')).toBeInTheDocument();
  });

  it('should apply className prop', () => {
    render(<ProfileForm className="custom-class" />);

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('custom-class');
  });

  it('should handle form submission', async () => {
    mockUseProfile.mockReturnValueOnce({
      profile: mockProfile,
      loading: false,
      updateProfile: mockUpdateProfile,
      uploadPhoto: mockUploadPhoto,
      takePhoto: mockTakePhoto,
    });

    render(<ProfileForm />);

    const form = screen.getByTestId('card').querySelector('form');
    expect(form).toBeInTheDocument();

    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockHandleSubmit).toHaveBeenCalled();
    });
  });

  it('should call updateProfile on successful form submission', async () => {
    mockUseProfile.mockReturnValueOnce({
      profile: mockProfile,
      loading: false,
      updateProfile: mockUpdateProfile,
      uploadPhoto: mockUploadPhoto,
      takePhoto: mockTakePhoto,
    });

    // Mock handleSubmit to call the callback
    const submitCallback = vi.fn((callback: any) => (e: React.FormEvent) => {
      e.preventDefault();
      callback({
        username: 'johndoe',
        firstName: 'John',
        middleName: 'M',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male' as const,
        setupLocation: 'sf-clinic',
      });
    });

    mockUseForm.mockReturnValueOnce({
      register: mockRegister,
      handleSubmit: submitCallback,
      formState: {
        errors: {},
        isSubmitting: false,
      },
      setValue: mockSetValue,
      watch: mockWatch,
      reset: mockReset,
      trigger: mockTrigger,
    });

    render(<ProfileForm />);

    const form = screen.getByTestId('card').querySelector('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        username: 'johndoe',
        firstName: 'John',
        middleName: 'M',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        setupLocation: 'sf-clinic',
      });
    });
  });

  it('should handle form submission error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const errorMock = new Error('Update failed');
    const errorUpdateProfile = vi.fn().mockRejectedValue(errorMock);
    
    mockUseProfile.mockReturnValueOnce({
      profile: mockProfile,
      loading: false,
      updateProfile: errorUpdateProfile,
      uploadPhoto: mockUploadPhoto,
      takePhoto: mockTakePhoto,
    });

    // Mock handleSubmit to call the callback
    const submitCallback = vi.fn((callback: any) => (e: React.FormEvent) => {
      e.preventDefault();
      callback({
        username: 'johndoe',
        firstName: 'John',
        middleName: 'M',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male' as const,
        setupLocation: 'sf-clinic',
      });
    });

    mockUseForm.mockReturnValueOnce({
      register: mockRegister,
      handleSubmit: submitCallback,
      formState: {
        errors: {},
        isSubmitting: false,
      },
      setValue: mockSetValue,
      watch: mockWatch,
      reset: mockReset,
      trigger: mockTrigger,
    });

    render(<ProfileForm />);

    const form = screen.getByTestId('card').querySelector('form');
    fireEvent.submit(form!);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save profile:', errorMock);
    });

    consoleErrorSpy.mockRestore();
  });

  it('should reset form when profile changes', async () => {
    // First render with initial profile
    const { rerender } = render(<ProfileForm />);
    mockReset.mockClear();

    // Change profile - mock should return new profile
    const newProfile = { ...mockProfile, firstName: 'Jane' };
    mockUseProfile.mockReturnValue({
      profile: newProfile,
      loading: false,
      updateProfile: mockUpdateProfile,
      uploadPhoto: mockUploadPhoto,
      takePhoto: mockTakePhoto,
    });

    // Rerender with new profile - this should trigger useEffect
    rerender(<ProfileForm />);

    // The useEffect should call reset when profile changes
    // Wait for the effect to run
    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith({
        username: 'johndoe',
        firstName: 'Jane',
        middleName: 'M',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        setupLocation: 'sf-clinic',
      });
    });
  });

  it('should reset form with empty strings when profile fields are falsy', async () => {
    // First render with initial profile
    const { rerender } = render(<ProfileForm />);
    mockReset.mockClear();

    // Change profile with falsy values to test the || '' branches
    const profileWithFalsyValues = {
      username: null as any,
      firstName: '',
      middleName: null as any,
      lastName: undefined as any,
      email: '',
      phone: null as any,
      dateOfBirth: undefined as any,
      gender: null as any,
      setupLocation: '',
    };

    mockUseProfile.mockReturnValue({
      profile: profileWithFalsyValues,
      loading: false,
      updateProfile: mockUpdateProfile,
      uploadPhoto: mockUploadPhoto,
      takePhoto: mockTakePhoto,
    });

    // Rerender with new profile - this should trigger useEffect
    rerender(<ProfileForm />);

    // The useEffect should call reset with empty strings for falsy values
    // Wait for the effect to run
    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith({
        username: '',
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: 'male', // default value when falsy
        setupLocation: '',
      });
    });
  });

  it('should handle password generation', () => {
    render(<ProfileForm />);

    const generateButton = screen.getByTestId('generate-password');
    fireEvent.click(generateButton);

    const newPasswordInput = screen.getByTestId('new-password') as HTMLInputElement;
    const confirmPasswordInput = screen.getByTestId('confirm-password') as HTMLInputElement;

    expect(newPasswordInput.value).toBe('GeneratedPassword123!');
    expect(confirmPasswordInput.value).toBe('GeneratedPassword123!');
  });

  it('should handle password data changes', () => {
    render(<ProfileForm />);

    const currentPasswordInput = screen.getByTestId('current-password') as HTMLInputElement;
    fireEvent.change(currentPasswordInput, { target: { value: 'oldpassword' } });

    expect(currentPasswordInput.value).toBe('oldpassword');

    const newPasswordInput = screen.getByTestId('new-password') as HTMLInputElement;
    fireEvent.change(newPasswordInput, { target: { value: 'newpassword' } });

    expect(newPasswordInput.value).toBe('newpassword');
  });

  it('should open photo modal when button is clicked', () => {
    render(<ProfileForm />);

    expect(screen.queryByTestId('photo-upload-modal')).not.toBeInTheDocument();

    const openPhotoButton = screen.getByTestId('open-photo-modal');
    fireEvent.click(openPhotoButton);

    expect(screen.getByTestId('photo-upload-modal')).toBeInTheDocument();
  });

  it('should close photo modal when close button is clicked', () => {
    render(<ProfileForm />);

    const openPhotoButton = screen.getByTestId('open-photo-modal');
    fireEvent.click(openPhotoButton);

    expect(screen.getByTestId('photo-upload-modal')).toBeInTheDocument();

    const closeButton = screen.getByTestId('modal-close');
    fireEvent.click(closeButton);

    expect(screen.queryByTestId('photo-upload-modal')).not.toBeInTheDocument();
  });

  it('should handle take photo', async () => {
    render(<ProfileForm />);

    const openPhotoButton = screen.getByTestId('open-photo-modal');
    fireEvent.click(openPhotoButton);

    const takePhotoButton = screen.getByTestId('modal-take-photo');
    fireEvent.click(takePhotoButton);

    await waitFor(() => {
      expect(mockTakePhoto).toHaveBeenCalled();
      expect(screen.queryByTestId('photo-upload-modal')).not.toBeInTheDocument();
    });
  });

  it('should handle upload photo', async () => {
    render(<ProfileForm />);

    const openPhotoButton = screen.getByTestId('open-photo-modal');
    fireEvent.click(openPhotoButton);

    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
    const uploadInput = screen.getByTestId('modal-upload-photo') as HTMLInputElement;

    fireEvent.change(uploadInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockUploadPhoto).toHaveBeenCalledWith(file);
      expect(screen.queryByTestId('photo-upload-modal')).not.toBeInTheDocument();
    });
  });

  it('should toggle notifications', () => {
    render(<ProfileForm />);

    const notificationsToggle = screen.getByTestId('notifications-toggle') as HTMLInputElement;
    expect(notificationsToggle.checked).toBe(true);

    fireEvent.change(notificationsToggle, { target: { checked: false } });

    expect(notificationsToggle.checked).toBe(false);
  });

  it('should show loading state on save button when isSubmitting is true', () => {
    mockUseForm.mockReturnValueOnce({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: {
        errors: {},
        isSubmitting: true,
      },
      setValue: mockSetValue,
      watch: mockWatch,
      reset: mockReset,
      trigger: mockTrigger,
    });

    render(<ProfileForm />);

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton).toHaveTextContent('Saving...');
    expect(saveButton).toBeDisabled();
  });

  it('should show loading state on save button when loading is true', () => {
    mockUseProfile.mockReturnValueOnce({
      profile: mockProfile,
      loading: true,
      updateProfile: mockUpdateProfile,
      uploadPhoto: mockUploadPhoto,
      takePhoto: mockTakePhoto,
    });

    render(<ProfileForm />);

    const saveButton = screen.getByTestId('save-button');
    expect(saveButton).toHaveTextContent('Saving...');
    expect(saveButton).toBeDisabled();
  });

  it('should initialize form with profile default values', () => {
    mockUseForm.mockClear();
    render(<ProfileForm />);

    expect(mockUseForm).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultValues: {
          username: 'johndoe',
          firstName: 'John',
          middleName: 'M',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '1234567890',
          dateOfBirth: '1990-01-01',
          gender: 'male',
          setupLocation: 'sf-clinic',
        },
      })
    );
  });

  it('should initialize form with empty values when profile is null', () => {
    mockUseProfile.mockReturnValueOnce({
      profile: null,
      loading: false,
      updateProfile: mockUpdateProfile,
      uploadPhoto: mockUploadPhoto,
      takePhoto: mockTakePhoto,
    });

    mockUseForm.mockClear();

    render(<ProfileForm />);

    expect(mockUseForm).toHaveBeenCalledWith(
      expect.objectContaining({
        defaultValues: {
          username: '',
          firstName: '',
          middleName: '',
          lastName: '',
          email: '',
          phone: '',
          dateOfBirth: '',
          gender: 'male',
          setupLocation: '',
        },
      })
    );
  });

  it('should handle country change', () => {
    render(<ProfileForm />);

    const countryChangeButton = screen.getByTestId('country-change');
    fireEvent.click(countryChangeButton);

    // The onCountryChange is an empty function, so we just verify it doesn't throw
    expect(countryChangeButton).toBeInTheDocument();
  });

  it('should render Card with correct className and contentClassName', () => {
    render(<ProfileForm className="custom-class" />);

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('custom-class');
    expect(card).toHaveAttribute('data-content-class', 'p-4 md:p-4 lg:p-6');
  });

  it('should not reset form when profile is null', () => {
    mockUseProfile.mockReturnValueOnce({
      profile: null,
      loading: false,
      updateProfile: mockUpdateProfile,
      uploadPhoto: mockUploadPhoto,
      takePhoto: mockTakePhoto,
    });

    mockReset.mockClear();
    render(<ProfileForm />);

    // reset should not be called if profile is null
    expect(mockReset).not.toHaveBeenCalled();
  });

  it('should handle profile with missing fields', () => {
    const incompleteProfile = {
      firstName: 'John',
      // Other fields are undefined
    } as any;

    mockUseProfile.mockReturnValueOnce({
      profile: incompleteProfile,
      loading: false,
      updateProfile: mockUpdateProfile,
      uploadPhoto: mockUploadPhoto,
      takePhoto: mockTakePhoto,
    });

    expect(() => {
      render(<ProfileForm />);
    }).not.toThrow();
  });
});

