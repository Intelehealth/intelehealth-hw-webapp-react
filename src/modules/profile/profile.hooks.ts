import { useEffect, useState } from 'react';
import { showToast } from '../../services/toast';
import type { Profile } from '../../types/profile.types';
import type {
  HealthWorkerProfile,
  ProviderDetailResponse,
  UserDetailResponse,
} from '../../types/provider.types';
import { storage } from '../../utils/storage';
import {
  calculateAge,
  createHealthWorkerProfile,
  createProfile,
  getErrorMessage,
  mapPersonAttributes,
  mapProviderAttributes,
  processImageFile,
  updateProfileAttributes,
  type PersonDetailsType,
} from './profile.helpers';
import profileService from './profile.service';

interface UseProfileReturn {
  profile: Profile | null;
  hwProfile: HealthWorkerProfile | null;
  loading: boolean;
  age: number | null;
  uploadPhoto: (file: File) => Promise<void>;
  takePhoto: () => Promise<void>;
  calculateAge: (dateOfBirth: string) => number;
  updateAgeForDate: (dateOfBirth: string) => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    setupLocation?: string;
  }) => Promise<void>;
}

export const useProfile = (): UseProfileReturn => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hwProfile, setHwProfile] = useState<HealthWorkerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [age, setAge] = useState<number | null>(null);
  // Store providerDetails for use in updateProfile
  const [providerDetails, setProviderDetails] =
    useState<ProviderDetailResponse | null>(null);

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

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      // Get user data from storage
      const userData = storage.getUser();
      if (!userData) {
        throw new Error('User data not found. Please log in again.');
      }

      let userUuid: string;
      let personUuid: string | undefined;

      try {
        const user = JSON.parse(userData);
        if (!user.uuid) {
          throw new Error(
            'User UUID not found in user data. Please log in again.'
          );
        }
        userUuid = user.uuid;
        personUuid = user.person?.uuid;
      } catch (parseError) {
        if (
          parseError instanceof Error &&
          parseError.message.includes('User')
        ) {
          throw parseError;
        }
        throw new Error('Failed to parse user data. Please log in again.');
      }

      // Fetch complete user details with roles and privileges
      let userDetails: UserDetailResponse;
      try {
        userDetails = (await profileService.getUserByUuid(
          userUuid
        )) as UserDetailResponse;
      } catch (error) {
        console.error('Failed to fetch user details:', error);
        throw new Error('Failed to load user information');
      }

      // Fetch provider details using the user UUID (optional - may not exist)
      let providerDetails: ProviderDetailResponse | null = null;
      try {
        const providerData = (await profileService.getProvider(userUuid)) as {
          results?: Array<{ uuid: string }>;
        };
        if (providerData?.results?.[0]) {
          const providerUuid = providerData.results[0].uuid;
          // Fetch full provider details with attributes
          providerDetails = (await profileService.getProviderByUuid(
            providerUuid
          )) as ProviderDetailResponse;
          // Store providerDetails for use in updateProfile
          setProviderDetails(providerDetails);
        }
      } catch (error) {
        console.warn(
          'Failed to fetch provider details (may not be a provider):',
          error
        );
        // Continue without provider details
        setProviderDetails(null);
      }

      // Use person UUID from user details or from stored user data
      const finalPersonUuid = userDetails.person?.uuid || personUuid;
      if (!finalPersonUuid) {
        throw new Error('Person UUID not found. Please log in again.');
      }

      // Fetch person details
      let personDetails: PersonDetailsType;
      try {
        personDetails = (await profileService.getPersonByUuid(
          finalPersonUuid
        )) as PersonDetailsType;
      } catch (error) {
        console.error('Failed to fetch person details:', error);
        throw new Error('Failed to load person information');
      }

      const attributes = mapProviderAttributes(providerDetails);
      const personAttributes = mapPersonAttributes(personDetails);
      const roles = userDetails.roles.map(r => r.name);

      setHwProfile(
        createHealthWorkerProfile(
          userDetails,
          personDetails,
          providerDetails,
          attributes,
          personAttributes
        )
      );
      setProfile(
        createProfile(
          userDetails,
          personDetails,
          providerDetails,
          attributes,
          personAttributes,
          roles
        )
      );
    } catch (error) {
      const message = getErrorMessage(error) || 'Failed to load profile data';
      showToast('Error', message, 'error');
      console.error('Profile loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    setupLocation?: string;
  }) => {
    if (!profile || !hwProfile || !hwProfile.providerUuid) {
      throw new Error('Profile not loaded or provider not found');
    }

    setLoading(true);
    try {
      const genderMap: Record<string, string> = {
        male: 'M',
        female: 'F',
        other: 'U',
      };
      const openMRSGender = data.gender ? genderMap[data.gender] : undefined;
      const age = data.dateOfBirth
        ? calculateAge(data.dateOfBirth)
        : profile.age;

      if (openMRSGender && age && data.dateOfBirth) {
        await profileService.updatePerson(hwProfile.personUuid, {
          gender: openMRSGender,
          age,
          birthdate: data.dateOfBirth,
        });
      }

      const personDetails = (await profileService.getPersonByUuid(
        hwProfile.personUuid
      )) as { preferredName?: { uuid: string } };

      if (data.firstName || data.middleName || data.lastName) {
        const nameData = {
          givenName: data.firstName || profile.firstName,
          middleName: data.middleName || profile.middleName || '',
          familyName: data.lastName || profile.lastName,
        };
        if (personDetails.preferredName?.uuid) {
          await profileService.updatePersonName(
            hwProfile.personUuid,
            personDetails.preferredName.uuid,
            nameData
          );
        } else {
          await profileService.createPersonName(hwProfile.personUuid, nameData);
        }
      }

      await updateProfileAttributes(
        data,
        providerDetails,
        hwProfile.providerUuid
      );

      // Reload profile to get updated data - matches Angular line 441
      await loadProfile();

      showToast('Success', 'Profile has been updated successfully', 'success');
    } catch (error) {
      const message = getErrorMessage(error) || 'Failed to update profile';
      showToast('Error', message, 'error');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const uploadPhoto = async (file: File) => {
    if (
      !file.name.toLowerCase().endsWith('.jpg') &&
      !file.name.toLowerCase().endsWith('.jpeg')
    ) {
      showToast('Warning', 'Upload JPG/JPEG format image only.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target?.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      if (profile) setProfile({ ...profile, avatar: dataUrl });
      if (hwProfile) setHwProfile({ ...hwProfile, avatar: dataUrl });

      const cleanedBase64 = await processImageFile(file);
      const personUuid =
        providerDetails?.person?.uuid ||
        hwProfile?.personUuid ||
        profile?.id ||
        '';
      if (!personUuid) throw new Error('Person UUID not found');

      await profileService.updateProfileImage({
        person: personUuid,
        base64EncodedImage: cleanedBase64,
      });

      const baseUrl =
        import.meta.env.VITE_OPENMRS_API_URL?.replace('/ws/rest/v1', '') || '';
      const imageUrl = `${baseUrl}/personimage/${personUuid}?t=${Date.now()}`;
      if (profile) setProfile({ ...profile, avatar: imageUrl });
      if (hwProfile) setHwProfile({ ...hwProfile, avatar: imageUrl });

      await loadProfile();
      showToast('Success', 'Profile picture uploaded successfully!', 'success');
    } catch (error: unknown) {
      showToast(
        'Error',
        error instanceof Error ? error.message : 'Failed to upload photo',
        'error'
      );
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
    hwProfile,
    loading,
    age,
    uploadPhoto,
    takePhoto,
    calculateAge,
    updateAgeForDate,
    refreshProfile: loadProfile,
    updateProfile,
  };
};
