import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProfile } from '../../../modules/profile/profile.hooks';

// Hoisted mocks to avoid Vitest hoisting issues
const h = vi.hoisted(() => ({
  mockGetProfile: vi.fn(),
  mockUpdateProfile: vi.fn(),
  mockChangePassword: vi.fn(),
  mockUploadPhoto: vi.fn(),
  mockShowToast: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock('../../../modules/profile/profile.service', () => ({
  default: {
    getProfile: h.mockGetProfile,
    updateProfile: h.mockUpdateProfile,
    changePassword: h.mockChangePassword,
    uploadPhoto: h.mockUploadPhoto,
  },
}));

vi.mock('../../../services/toast', () => ({
  showToast: (...args: any[]) => h.mockShowToast(...args),
}));

vi.mock('../../../utils/storage', () => ({
  storage: {
    getUser: h.mockGetUser,
  },
}));

describe('useProfile', () => {
  const mockProfile = {
    firstName: 'John',
    middleName: 'M',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '1234567890',
    dateOfBirth: '1990-01-01',
    gender: 'male' as const,
    setupLocation: 'sf-clinic',
  };

  const mockUser = {
    uuid: 'test-uuid',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    h.mockGetUser.mockReturnValue(JSON.stringify(mockUser));
    h.mockGetProfile.mockResolvedValue(mockProfile);
  });

  it('should initialize with default values', async () => {
    // Mock getUser to return null so loadProfile doesn't run
    h.mockGetUser.mockReturnValueOnce(null);
    const { result } = renderHook(() => useProfile());

    // Wait for useEffect to run
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Initial values - loadProfile doesn't run if no userData
    expect(result.current.profile).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.age).toBeNull();
  });

  it('should load profile on mount', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(h.mockGetUser).toHaveBeenCalled();
    expect(h.mockGetProfile).toHaveBeenCalledWith('test-uuid');
    expect(result.current.profile).toEqual({
      ...mockProfile,
      gender: 'male', // Default gender
    });
  });

  it('should handle loadProfile error', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    h.mockGetProfile.mockRejectedValue(new Error('Network error'));

    renderHook(() => useProfile());

    await waitFor(() => {
      expect(h.mockShowToast).toHaveBeenCalledWith('Error', 'Failed to load profile data', 'error');
    });

    consoleErrorSpy.mockRestore();
  });

  it('should not load profile if userData is not available', async () => {
    h.mockGetUser.mockReturnValue(null);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(h.mockGetProfile).not.toHaveBeenCalled();
    expect(result.current.profile).toBeNull();
  });

  it('should set default gender as male if not provided', async () => {
    const profileWithoutGender = { ...mockProfile };
    delete (profileWithoutGender as any).gender;
    h.mockGetProfile.mockResolvedValue(profileWithoutGender);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile?.gender).toBe('male');
    });
  });

  it('should calculate age correctly', () => {
    const { result } = renderHook(() => useProfile());

    // Test with a birth date that results in age calculation
    const today = new Date();
    const birthYear = today.getFullYear() - 30;
    const birthDate = `${birthYear}-01-01`;
    
    const age = result.current.calculateAge(birthDate);
    expect(age).toBe(30);
  });

  it('should calculate age correctly when birthday has not occurred this year', () => {
    const { result } = renderHook(() => useProfile());

    const today = new Date();
    const birthYear = today.getFullYear() - 30;
    // Use a future month so birthday hasn't occurred
    const futureMonth = String(today.getMonth() + 2).padStart(2, '0');
    const birthDate = `${birthYear}-${futureMonth}-15`;
    
    const age = result.current.calculateAge(birthDate);
    expect(age).toBe(29); // One year less because birthday hasn't occurred
  });

  it('should calculate age correctly when birthday is same month but later date', () => {
    const { result } = renderHook(() => useProfile());

    const today = new Date();
    const birthYear = today.getFullYear() - 30;
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    // Use a future day in the current month
    const futureDay = String(today.getDate() + 5).padStart(2, '0');
    const birthDate = `${birthYear}-${currentMonth}-${futureDay}`;
    
    const age = result.current.calculateAge(birthDate);
    expect(age).toBe(29); // One year less because birthday hasn't occurred
  });

  it('should update age when profile dateOfBirth changes', async () => {
    const profileWithDate = {
      ...mockProfile,
      dateOfBirth: '1995-06-15',
    };
    h.mockGetProfile.mockResolvedValue(profileWithDate);

    const { result } = renderHook(() => useProfile());

    // Wait for profile to load
    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
      expect(result.current.profile?.dateOfBirth).toBe('1995-06-15');
    });

    // Age should be calculated automatically
    await waitFor(() => {
      expect(result.current.age).toBeGreaterThan(0);
      expect(result.current.age).toBe(result.current.calculateAge('1995-06-15'));
    });
  });

  it('should set age to null when profile has no dateOfBirth', async () => {
    const profileWithoutDate = { ...mockProfile };
    delete (profileWithoutDate as any).dateOfBirth;
    h.mockGetProfile.mockResolvedValue(profileWithoutDate);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
      expect(result.current.age).toBeNull();
    });
  });

  it('should update age for a given date using updateAgeForDate', () => {
    const { result } = renderHook(() => useProfile());

    const today = new Date();
    const birthYear = today.getFullYear() - 35;
    const dateOfBirth = `${birthYear}-06-15`;

    act(() => {
      result.current.updateAgeForDate(dateOfBirth);
    });

    expect(result.current.age).toBe(35);
  });

  it('should set age to null when updateAgeForDate receives empty string', () => {
    const { result } = renderHook(() => useProfile());

    // First set an age
    act(() => {
      result.current.updateAgeForDate('1990-01-01');
    });

    expect(result.current.age).not.toBeNull();

    // Then clear it
    act(() => {
      result.current.updateAgeForDate('');
    });

    expect(result.current.age).toBeNull();
  });

  it('should set age to null when updateAgeForDate receives whitespace-only string', () => {
    const { result } = renderHook(() => useProfile());

    act(() => {
      result.current.updateAgeForDate('   ');
    });

    expect(result.current.age).toBeNull();
  });

  it('should update profile successfully', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updateData = {
      firstName: 'Jane',
      lastName: 'Smith',
    };

    const updatedProfile = { ...mockProfile, ...updateData };
    h.mockUpdateProfile.mockResolvedValue(updatedProfile);

    await act(async () => {
      await result.current.updateProfile(updateData);
    });

    expect(h.mockUpdateProfile).toHaveBeenCalledWith(updateData);
    expect(result.current.profile).toEqual(updatedProfile);
    expect(h.mockShowToast).toHaveBeenCalledWith('Success', 'Profile updated successfully', 'success');
    expect(result.current.loading).toBe(false);
  });

  it('should handle updateProfile error', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const error = new Error('Update failed');
    h.mockUpdateProfile.mockRejectedValue(error);

    await act(async () => {
      await result.current.updateProfile({ firstName: 'Jane' });
    });

    expect(h.mockShowToast).toHaveBeenCalledWith('Error', 'Failed to update profile', 'error');
    expect(result.current.loading).toBe(false);
  });

  it('should handle updateProfile error with axios error message', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const axiosError = {
      response: {
        data: {
          message: 'Validation failed',
        },
      },
    };
    h.mockUpdateProfile.mockRejectedValue(axiosError);

    await act(async () => {
      await result.current.updateProfile({ firstName: 'Jane' });
    });

    expect(h.mockShowToast).toHaveBeenCalledWith('Error', 'Validation failed', 'error');
  });

  it('should handle updateProfile error with axios error but no message', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const axiosError = {
      response: {
        data: {},
      },
    };
    h.mockUpdateProfile.mockRejectedValue(axiosError);

    await act(async () => {
      await result.current.updateProfile({ firstName: 'Jane' });
    });

    expect(h.mockShowToast).toHaveBeenCalledWith('Error', 'Failed to update profile', 'error');
  });

  it('should handle updateProfile error with axios error but no response.data', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const axiosError = {
      response: {},
    };
    h.mockUpdateProfile.mockRejectedValue(axiosError);

    await act(async () => {
      await result.current.updateProfile({ firstName: 'Jane' });
    });

    expect(h.mockShowToast).toHaveBeenCalledWith('Error', 'Failed to update profile', 'error');
  });

  it('should change password successfully', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const passwordData = {
      currentPassword: 'oldpass',
      newPassword: 'newpass',
      confirmPassword: 'newpass',
    };

    h.mockChangePassword.mockResolvedValue(undefined);

    await act(async () => {
      return await result.current.changePassword(passwordData);
    });

    expect(h.mockChangePassword).toHaveBeenCalledWith(passwordData);
    expect(h.mockShowToast).toHaveBeenCalledWith('Success', 'Password changed successfully', 'success');
    expect(result.current.loading).toBe(false);
  });

  it('should handle changePassword error', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const error = new Error('Password change failed');
    h.mockChangePassword.mockRejectedValue(error);

    await act(async () => {
      return await result.current.changePassword({
        currentPassword: 'oldpass',
        newPassword: 'newpass',
        confirmPassword: ''
      });
    });

    expect(h.mockShowToast).toHaveBeenCalledWith('Error', 'Failed to change password', 'error');
    expect(result.current.loading).toBe(false);
  });

  it('should handle changePassword error with axios error message', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const axiosError = {
      response: {
        data: {
          message: 'Current password is incorrect',
        },
      },
    };
    h.mockChangePassword.mockRejectedValue(axiosError);

    await act(async () => {
      return await result.current.changePassword({
        currentPassword: 'wrongpass',
        newPassword: 'newpass',
        confirmPassword: ''
      });
    });

    expect(h.mockShowToast).toHaveBeenCalledWith('Error', 'Current password is incorrect', 'error');
  });

  it('should handle changePassword error with axios error but no message', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const axiosError = {
      response: {
        data: {},
      },
    };
    h.mockChangePassword.mockRejectedValue(axiosError);

    await act(async () => {
      return await result.current.changePassword({
        currentPassword: 'oldpass',
        newPassword: 'newpass',
        confirmPassword: ''
      });
    });

    expect(h.mockShowToast).toHaveBeenCalledWith('Error', 'Failed to change password', 'error');
  });

  it('should upload photo successfully', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
    const updatedProfile = { ...mockProfile, photoUrl: 'http://example.com/photo.jpg' };
    h.mockUploadPhoto.mockResolvedValue(updatedProfile);

    await act(async () => {
      await result.current.uploadPhoto(file);
    });

    expect(h.mockUploadPhoto).toHaveBeenCalled();
    expect(result.current.profile).toEqual(updatedProfile);
    expect(h.mockShowToast).toHaveBeenCalledWith('Success', 'Photo uploaded successfully', 'success');
    expect(result.current.loading).toBe(false);
  });

  it('should handle uploadPhoto error', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
    const error = new Error('Upload failed');
    h.mockUploadPhoto.mockRejectedValue(error);

    await act(async () => {
      await result.current.uploadPhoto(file);
    });

    expect(h.mockShowToast).toHaveBeenCalledWith('Error', 'Failed to upload photo', 'error');
    expect(result.current.loading).toBe(false);
  });

  it('should handle uploadPhoto error with axios error message', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
    const axiosError = {
      response: {
        data: {
          message: 'File size too large',
        },
      },
    };
    h.mockUploadPhoto.mockRejectedValue(axiosError);

    await act(async () => {
      await result.current.uploadPhoto(file);
    });

    expect(h.mockShowToast).toHaveBeenCalledWith('Error', 'File size too large', 'error');
  });

  it('should handle uploadPhoto error with axios error but no message', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
    const axiosError = {
      response: {
        data: {},
      },
    };
    h.mockUploadPhoto.mockRejectedValue(axiosError);

    await act(async () => {
      await result.current.uploadPhoto(file);
    });

    expect(h.mockShowToast).toHaveBeenCalledWith('Error', 'Failed to upload photo', 'error');
  });

  it('should call takePhoto and show info toast', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.takePhoto();
    });

    expect(h.mockShowToast).toHaveBeenCalledWith('Info', 'Camera functionality not implemented yet', 'info');
    expect(result.current.loading).toBe(false);
  });

  it('should handle takePhoto and set loading state correctly', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // TakePhoto shows info toast and sets loading
    // Since setLoading is now outside try block, it should be set immediately
    await act(async () => {
      result.current.takePhoto();
    });
    
    // After act completes, loading should have been set to true and then back to false
    // We can verify the toast was called, which means the function executed
    expect(h.mockShowToast).toHaveBeenCalledWith('Info', 'Camera functionality not implemented yet', 'info');
    expect(result.current.loading).toBe(false);
  });

  it('should handle takePhoto error catch block', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Make showToast throw an error to trigger the catch block (line 182)
    h.mockShowToast.mockImplementationOnce(() => {
      throw new Error('Toast error');
    });

    await act(async () => {
      await result.current.takePhoto();
    });

    // Verify the catch block executed and showed the error toast
    expect(h.mockShowToast).toHaveBeenCalledWith('Error', 'Failed to take photo', 'error');
    expect(result.current.loading).toBe(false);
  });

  it('should set loading state correctly during operations', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Test loading state during updateProfile
    // Create a manually controlled promise so we can test loading state mid-operation
    let resolveUpdate: ((value: any) => void) | undefined;
    const delayedPromise = new Promise<any>((resolve) => {
      resolveUpdate = resolve;
    });
    h.mockUpdateProfile.mockReturnValue(delayedPromise);
    
    // Start the update operation - call it inside act to properly trigger React updates
    let updatePromise: Promise<void>;
    await act(async () => {
      updatePromise = result.current.updateProfile({ firstName: 'Jane' });
    });

    // Wait for React to process setLoading(true) - setLoading is called synchronously before try block
    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    }, { timeout: 500 });

    // Now resolve the promise and wait for completion
    await act(async () => {
      resolveUpdate!(mockProfile);
      await updatePromise!;
    });

    // Loading should be false after completion
    expect(result.current.loading).toBe(false);
  });
});

