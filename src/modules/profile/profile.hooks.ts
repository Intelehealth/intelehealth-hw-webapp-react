import { useEffect, useRef, useState } from 'react';
import { showToast } from '../../services/toast';
import type {
  PasswordChangeRequest,
  Profile,
  ProfileUpdateRequest,
} from '../../types/profile.types';
import { storage } from '../../utils/storage';
// @ts-ignore
import profileService from './profile.service';

interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  age: number | null;
  updateProfile: (data: ProfileUpdateRequest) => Promise<void>;
  changePassword: (data: PasswordChangeRequest) => Promise<void>;
  uploadPhoto: (file: File) => Promise<void>;
  takePhoto: () => Promise<void>;
  calculateAge: (dateOfBirth: string) => number;
  updateAgeForDate: (dateOfBirth: string) => void;
}

export const useProfile = (): UseProfileReturn => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [age, setAge] = useState<number | null>(null);
  const hasLoadedRef = useRef(false);
  const errorShownRef = useRef(false);

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      calculatedAge--;
    }

    return calculatedAge;
  };

  // Update age when profile changes
  useEffect(() => {
    if (profile?.dateOfBirth) {
      const calculatedAge = calculateAge(profile.dateOfBirth);
      setAge(calculatedAge);
    } else {
      setAge(null);
    }
  }, [profile?.dateOfBirth]);

  // Function to update age for a given date of birth
  const updateAgeForDate = (dateOfBirth: string) => {
    if (dateOfBirth && dateOfBirth.trim() !== '') {
      const calculatedAge = calculateAge(dateOfBirth);
      setAge(calculatedAge);
    } else {
      setAge(null);
    }
  };

  // Load profile data on mount
  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      errorShownRef.current = false; // Reset error flag on new attempt
      const userData = storage.getUser();
      if (userData) {
        const user = JSON.parse(userData);
        const profileData = await profileService.getProfile(user.uuid);
        // Set default gender as male if not provided
        const profileWithDefaults = {
          ...profileData,
          gender: profileData.gender || 'male',
        };
        setProfile(profileWithDefaults);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Only show error toast once
      if (!errorShownRef.current) {
        errorShownRef.current = true;
        showToast('Error', 'Failed to load profile data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: ProfileUpdateRequest) => {
    // Set loading immediately before async operation
    setLoading(true);
    try {
      const updatedProfile = await profileService.updateProfile(data);
      setProfile(updatedProfile);
      showToast('Success', 'Profile updated successfully', 'success');
    } catch (error: unknown) {
      let message = 'Failed to update profile';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        if (
          axiosError.response &&
          axiosError.response.data &&
          axiosError.response.data.message
        ) {
          message = axiosError.response.data.message;
        }
      }
      showToast('Error', message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (data: PasswordChangeRequest) => {
    // Ensure loading starts before await
    setLoading(true);
    try {
      await profileService.changePassword(data);
      showToast('Success', 'Password changed successfully', 'success');
    } catch (error: unknown) {
      let message = 'Failed to change password';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        if (
          axiosError.response &&
          axiosError.response.data &&
          axiosError.response.data.message
        ) {
          message = axiosError.response.data.message;
        }
      }
      showToast('Error', message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (file: File) => {
    // Start loading first
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const updatedProfile = await profileService.uploadPhoto(formData);
      setProfile(updatedProfile);
      showToast('Success', 'Photo uploaded successfully', 'success');
    } catch (error: unknown) {
      let message = 'Failed to upload photo';
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        if (
          axiosError.response &&
          axiosError.response.data &&
          axiosError.response.data.message
        ) {
          message = axiosError.response.data.message;
        }
      }
      showToast('Error', message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    // Mark loading true before showing toast
    setLoading(true);
    try {
      // TODO: Implement camera functionality
      showToast('Info', 'Camera functionality not implemented yet', 'info');
    } catch {
      showToast('Error', 'Failed to take photo', 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    loading,
    age,
    updateProfile,
    changePassword,
    uploadPhoto,
    takePhoto,
    calculateAge,
    updateAgeForDate,
  };
};
