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
  const [providerDetails, setProviderDetails] =
    useState<ProviderDetailResponse | null>(null);

  useEffect(() => {
    setAge(profile?.dateOfBirth ? calculateAge(profile.dateOfBirth) : null);
  }, [profile?.dateOfBirth]);

  const updateAgeForDate = (dateOfBirth: string) => {
    setAge(dateOfBirth?.trim() ? calculateAge(dateOfBirth) : null);
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userData = storage.getUser();
      if (!userData)
        throw new Error('User data not found. Please log in again.');

      const user = JSON.parse(userData);
      if (!user.uuid)
        throw new Error('User UUID not found. Please log in again.');

      const userDetails = (await profileService.getUserByUuid(
        user.uuid
      )) as UserDetailResponse;

      let providerDetails: ProviderDetailResponse | null = null;
      try {
        const providerData = (await profileService.getProvider(user.uuid)) as {
          results?: Array<{ uuid: string }>;
        };
        if (providerData?.results?.[0]) {
          providerDetails = (await profileService.getProviderByUuid(
            providerData.results[0].uuid
          )) as ProviderDetailResponse;
          setProviderDetails(providerDetails);
        }
      } catch {
        setProviderDetails(null);
      }

      const finalPersonUuid = userDetails.person?.uuid || user.person?.uuid;
      if (!finalPersonUuid)
        throw new Error('Person UUID not found. Please log in again.');

      const personDetails = (await profileService.getPersonByUuid(
        finalPersonUuid
      )) as PersonDetailsType;

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
      showToast(
        'Error',
        getErrorMessage(error) || 'Failed to load profile data',
        'error'
      );
      console.error('Profile loading error:', error);
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
    setLoading(true);
    try {
      showToast('Info', 'Camera functionality not implemented yet', 'info');
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
    if (!profile || !hwProfile?.providerUuid) {
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

      await loadProfile();
      showToast('Success', 'Profile has been updated successfully', 'success');
    } catch (error) {
      showToast(
        'Error',
        getErrorMessage(error) || 'Failed to update profile',
        'error'
      );
      throw error;
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
