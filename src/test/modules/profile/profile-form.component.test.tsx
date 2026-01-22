import { configureStore } from '@reduxjs/toolkit';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProfileForm from '../../../modules/profile/profile-form.component';

// --- Mocks ---
const mockUseProfile = vi.fn();

vi.mock('../../../modules/profile/profile.hooks', () => ({
  useProfile: (...args: any[]) => mockUseProfile(...args),
}));

vi.mock('../../../components/common/photo-upload-modal.component', () => ({
  default: ({ isOpen, onClose, onTakePhoto, onUploadPhoto }: any) => {
    return isOpen ? (
      <div data-testid="photo-modal">
        <button onClick={onTakePhoto}>take-photo</button>
        <button onClick={() => onUploadPhoto(new File(['test'], 'test.png'))}>
          upload-photo
        </button>
        <button onClick={onClose}>close-modal</button>
      </div>
    ) : null;
  },
}));

// Dummy reducer for loader sections
const mockStore = (loaderValue = 0) =>
  configureStore({
    reducer: {
      loader: () => ({ sections: { 'profile-save': loaderValue } }),
    },
  });

describe('ProfileForm Component', () => {
  const mockUpdateProfile = vi.fn();
  const mockUploadPhoto = vi.fn();
  const mockTakePhoto = vi.fn();
  const mockCalculateAge = vi.fn(() => 35);
  const mockUpdateAgeForDate = vi.fn();
  const mockRefreshProfile = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseProfile.mockReturnValue({
      profile: {
        id: '123',
        username: 'john',
        firstName: 'John',
        middleName: '',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '9876543210',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        setupLocation: 'India',
        address: {
          street: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          zipCode: '400001',
        },
        role: 'doctor',
        department: 'General Medicine',
        employeeId: 'EMP001',
        joinDate: '2020-01-01',
        lastLogin: '2025-01-01',
        isActive: true,
        preferences: {
          language: 'en',
          timezone: 'Asia/Kolkata',
          notifications: {
            email: true,
            sms: true,
            push: true,
          },
        },
      },
      hwProfile: null,
      age: 35,
      updateProfile: mockUpdateProfile,
      uploadPhoto: mockUploadPhoto,
      takePhoto: mockTakePhoto,
      calculateAge: mockCalculateAge,
      updateAgeForDate: mockUpdateAgeForDate,
      refreshProfile: mockRefreshProfile,
    });
  });

  const setup = (loaderValue = 0) =>
    render(
      <Provider store={mockStore(loaderValue)}>
        <ProfileForm />
      </Provider>
    );

  // --------------------------------------------------------
  it('renders form with profile data', () => {
    setup();

    // Use getAllByDisplayValue since there are duplicate inputs (mobile + desktop)
    const usernameInputs = screen.getAllByDisplayValue('john');
    expect(usernameInputs.length).toBeGreaterThan(0);
    
    const firstNameInputs = screen.getAllByDisplayValue('John');
    expect(firstNameInputs.length).toBeGreaterThan(0);
    
    expect(
      screen.getByRole('button', { name: /save/i })
    ).toBeInTheDocument();
  });

  // --------------------------------------------------------
  it('submits form and calls updateProfile', async () => {
    setup();

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------
  it('disables save button when saving is true', () => {
    setup(2); // loader.sections['profile-save'] > 0

    // When saving, the button text changes to "Saving..."
    const btn = screen.getByRole('button', { name: /saving/i });
    expect(btn).toBeDisabled();
  });

  // --------------------------------------------------------
  it('opens photo modal on trigger', () => {
    setup();

    // Use getAllByRole since there are duplicate buttons (mobile + desktop)
    const photoButtons = screen.getAllByRole('button', { name: /change photo/i });
    fireEvent.click(photoButtons[0]); // Click the first one

    expect(screen.getByTestId('photo-modal')).toBeInTheDocument();
  });

  // --------------------------------------------------------
  it('handles photo upload callback', async () => {
    setup();

    const photoButtons = screen.getAllByRole('button', { name: /change photo/i });
    fireEvent.click(photoButtons[0]); // Click the first one
    fireEvent.click(screen.getByText('upload-photo'));

    expect(mockUploadPhoto).toHaveBeenCalled();
  });

  it('should show loading state when profile is null (lines 109-119)', () => {
    // Override the beforeEach mock to return null profile
    mockUseProfile.mockReturnValue({
      profile: null,
      hwProfile: null,
      age: null,
      updateProfile: mockUpdateProfile,
      uploadPhoto: mockUploadPhoto,
      takePhoto: mockTakePhoto,
      calculateAge: mockCalculateAge,
      updateAgeForDate: mockUpdateAgeForDate,
      refreshProfile: mockRefreshProfile,
    });

    const { container } = render(
      <Provider store={mockStore()}>
        <ProfileForm />
      </Provider>
    );

    // Verify the loading state - when profile is null, form returns null
    // 1. The form (save button) is NOT shown - this confirms we're in loading state
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument();

    // 2. Verify that nothing is rendered (form returns null when profile is null)
    // This verifies line 107 is executed (return profile ? ... : null)
    const html = container.innerHTML;
    expect(html).toBe('');

    // 3. Verify no form elements are present
    expect(container.querySelector('form')).toBeNull();
   
  });

  // --------------------------------------------------------
  it('should reset form when profile changes (lines 76-84)', async () => {
    const { rerender } = setup();

    // Verify initial values are set (use getAllByDisplayValue since there are duplicates)
    expect(screen.getAllByDisplayValue('john').length).toBeGreaterThan(0);
    expect(screen.getAllByDisplayValue('John').length).toBeGreaterThan(0);

    // Update profile to trigger useEffect
    mockUseProfile.mockReturnValue({
      profile: {
        id: '123',
        username: 'newuser',
        firstName: 'Jane',
        middleName: 'Marie',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '1234567890',
        dateOfBirth: '1995-01-01',
        gender: 'female',
        setupLocation: 'USA',
        address: {
          street: '456 Oak St',
          city: 'New York',
          state: 'NY',
          country: 'USA',
          zipCode: '10001',
        },
        role: 'nurse',
        department: 'Emergency',
        employeeId: 'EMP002',
        joinDate: '2021-01-01',
        lastLogin: '2025-01-15',
        isActive: true,
        preferences: {
          language: 'en',
          timezone: 'America/New_York',
          notifications: {
            email: true,
            sms: true,
            push: true,
          },
        },
      },
      hwProfile: null,
      age: 30,
      updateProfile: mockUpdateProfile,
      uploadPhoto: mockUploadPhoto,
      takePhoto: mockTakePhoto,
      calculateAge: mockCalculateAge,
      updateAgeForDate: mockUpdateAgeForDate,
      refreshProfile: mockRefreshProfile,
    });

    // Rerender with new profile to trigger useEffect
    rerender(
      <Provider store={mockStore()}>
        <ProfileForm />
      </Provider>
    );

    // Wait for form to be reset with new values (use getAllByDisplayValue for duplicates)
    await waitFor(() => {
      expect(screen.getAllByDisplayValue('newuser').length).toBeGreaterThan(0);
      expect(screen.getAllByDisplayValue('Jane').length).toBeGreaterThan(0);
      expect(screen.getAllByDisplayValue('Smith').length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------
  it('should handle profile with undefined/null values in reset (lines 76-84)', () => {
    mockUseProfile.mockReturnValue({
      profile: {
        id: '123',
        username: undefined,
        firstName: null,
        middleName: undefined,
        lastName: '',
        email: null,
        phone: undefined,
        dateOfBirth: null,
        gender: undefined,
        setupLocation: null,
        address: {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: '',
        },
        role: '',
        department: '',
        employeeId: '',
        joinDate: '',
        lastLogin: '',
        isActive: true,
        preferences: {
          language: 'en',
          timezone: 'UTC',
          notifications: {
            email: false,
            sms: false,
            push: false,
          },
        },
      },
      hwProfile: null,
      age: null,
      updateProfile: mockUpdateProfile,
      uploadPhoto: mockUploadPhoto,
      takePhoto: mockTakePhoto,
      calculateAge: mockCalculateAge,
      updateAgeForDate: mockUpdateAgeForDate,
      refreshProfile: mockRefreshProfile,
    });

    setup();

    // Verify form renders with empty values (fallbacks applied from lines 76-84)
    const emptyInputs = screen.getAllByDisplayValue('');
    expect(emptyInputs.length).toBeGreaterThan(0);
    
    // Verify gender defaults to 'male' when undefined (line 83)
    const genderInputs = screen.getAllByDisplayValue('male');
    expect(genderInputs.length).toBeGreaterThan(0);
  });

  // --------------------------------------------------------
  it('should handle form submission error (lines 67-68)', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('Update failed');
    
    mockUpdateProfile.mockRejectedValue(error);

    setup();

    fireEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled();
    });

    // Wait for error to be logged
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save profile:', error);
    }, { timeout: 1000 });

    consoleErrorSpy.mockRestore();
  });

  // --------------------------------------------------------
  it('should close photo modal when close button is clicked', () => {
    setup();

    const photoButtons = screen.getAllByRole('button', { name: /change photo/i });
    fireEvent.click(photoButtons[0]);

    expect(screen.getByTestId('photo-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByText('close-modal'));

    expect(screen.queryByTestId('photo-modal')).not.toBeInTheDocument();
  });

  // --------------------------------------------------------
  it('should generate password when generate button is clicked (lines 90-96)', () => {
    setup();

    // Find the generate password button
    const generateButton = screen.getByRole('button', { name: /generate a new password/i });

    // Get the password input fields (they appear twice - mobile and desktop)
    const newPasswordInputs = screen.getAllByPlaceholderText('Enter new password');
    const confirmPasswordInputs = screen.getAllByPlaceholderText('Confirm new password');

    // Verify initial state (empty)
    expect(newPasswordInputs[0]).toHaveValue('');
    expect(confirmPasswordInputs[0]).toHaveValue('');

    // Click generate button
    fireEvent.click(generateButton);

    // Verify both fields are populated with the generated password
    expect(newPasswordInputs[0]).toHaveValue('GeneratedPassword123!');
    expect(confirmPasswordInputs[0]).toHaveValue('GeneratedPassword123!');
  });
});