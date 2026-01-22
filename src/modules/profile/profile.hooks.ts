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
  age: number | null;
  uploadPhoto: (file: File) => Promise<void>;
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

interface ProviderSearchResponse {
  results?: Array<{
    uuid: string;
  }>;
}

export const useProfile = (): UseProfileReturn => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hwProfile, setHwProfile] = useState<HealthWorkerProfile | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [providerDetails, setProviderDetails] =
    useState<ProviderDetailResponse | null>(null);

  useEffect(() => {
    setAge(profile?.dateOfBirth ? calculateAge(profile.dateOfBirth) : null);
  }, [profile?.dateOfBirth]);

  const updateAgeForDate = (dateOfBirth: string) => {
    setAge(dateOfBirth?.trim() ? calculateAge(dateOfBirth) : null);
  };

  const loadProfile = async () => {
    try {
      const userData = storage.getUser();
      if (!userData) throw new Error('User data not found');

      const user = JSON.parse(userData) as {
        uuid?: string;
        person?: { uuid?: string };
      };
      if (!user.uuid) throw new Error('User UUID not found');

      const userDetails = (await profileService.getUserByUuid(
        user.uuid
      )) as UserDetailResponse;

      // Fetch provider details
      let providerDetailsLocal: ProviderDetailResponse | null = null;

      try {
        const providerSearch = (await profileService.getProvider(
          user.uuid
        )) as ProviderSearchResponse;

        const providerUuid = providerSearch?.results?.[0]?.uuid;

        if (providerUuid) {
          providerDetailsLocal = (await profileService.getProviderByUuid(
            providerUuid
          )) as ProviderDetailResponse;
        }
      } catch {
        providerDetailsLocal = null;
      }

      setProviderDetails(prev =>
        prev?.uuid === providerDetailsLocal?.uuid ? prev : providerDetailsLocal
      );

      // Get person details
      const finalPersonUuid = userDetails.person?.uuid || user.person?.uuid;

      if (!finalPersonUuid) {
        throw new Error('Person UUID not found');
      }

      const personDetails = (await profileService.getPersonByUuid(
        finalPersonUuid
      )) as PersonDetailsType;

      // Build profile objects
      const attributes = mapProviderAttributes(providerDetailsLocal);
      const personAttributes = mapPersonAttributes(personDetails);
      const roles = userDetails.roles.map(r => r.name);

      const baseUrl =
        import.meta.env.VITE_OPENMRS_API_URL?.replace('/ws/rest/v1', '') || '';

      const avatarUrl = `${baseUrl}/personimage/${finalPersonUuid}`;

      const nextHwProfile = createHealthWorkerProfile(
        userDetails,
        personDetails,
        providerDetailsLocal,
        attributes,
        personAttributes
      );

      const nextProfile = createProfile(
        userDetails,
        personDetails,
        providerDetailsLocal,
        attributes,
        personAttributes,
        roles
      );

      nextHwProfile.avatar = avatarUrl;
      nextProfile.avatar = avatarUrl;

      // Update state only if changed
      setHwProfile(prev => {
        const shouldUpdate =
          prev?.providerUuid !== nextHwProfile.providerUuid ||
          prev?.avatar !== nextHwProfile.avatar;
        return shouldUpdate ? nextHwProfile : prev;
      });

      setProfile(prev => {
        const shouldUpdate =
          prev?.id !== nextProfile.id || prev?.avatar !== nextProfile.avatar;
        return shouldUpdate ? nextProfile : prev;
      });
    } catch (error) {
      showToast('Error', 'Failed to load profile data', 'error');
      console.error('Profile loading error:', error);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

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
      )) as {
        preferredName?: { uuid: string };
      };

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
      await loadProfile();
      showToast('Success', 'Profile has been updated successfully', 'success');
    } catch (error) {
      showToast(
        'Error',
        getErrorMessage(error) || 'Failed to update profile',
        'error'
      );
      throw error;
    }
  };

  const uploadPhoto = async (file: File) => {
    if (!/\.jpe?g$|\.png$/i.test(file.name)) {
      showToast('Warning', 'Upload JPG/JPEG/PNG format image only.', 'warning');
      return;
    }

    try {
      const cleanedBase64 = await processImageFile(file);

      const personUuid =
        providerDetails?.person?.uuid || hwProfile?.personUuid || profile?.id;

      if (!personUuid) throw new Error('Person UUID not found');

      await profileService.updateProfileImage({
        person: personUuid,
        base64EncodedImage: cleanedBase64,
      });

      const baseUrl =
        import.meta.env.VITE_OPENMRS_API_URL?.replace('/ws/rest/v1', '') || '';

      const avatarUrl = `${baseUrl}/personimage/${personUuid}`;

      setHwProfile(prev => (prev ? { ...prev, avatar: avatarUrl } : prev));
      setProfile(prev => (prev ? { ...prev, avatar: avatarUrl } : prev));

      showToast('Success', 'Profile picture uploaded successfully!', 'success');
    } catch (error) {
      showToast(
        'Error',
        error instanceof Error ? error.message : 'Failed to upload photo',
        'error'
      );
    }
  };

  return {
    profile,
    hwProfile,
    age,
    uploadPhoto,
    calculateAge,
    updateAgeForDate,
    refreshProfile: loadProfile,
    updateProfile,
  };
};
