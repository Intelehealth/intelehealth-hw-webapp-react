import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { showToast } from '../services/toast';
import type { Profile } from '../types/profile.types';
import type {
  HealthWorkerProfile,
  ProviderDetailResponse,
  UserDetailResponse,
} from '../types/provider.types';
import { storage } from '../utils/storage';
import {
  calculateAge,
  createHealthWorkerProfile,
  createProfile,
  getErrorMessage,
  mapPersonAttributes,
  mapProviderAttributes,
  processImageFile,
  updateProfileAttributes,
  validateImageFormat,
  type PersonDetailsType,
} from '../modules/profile/profile.helpers';
import profileService from '../modules/profile/profile.service';

export interface LocationOption {
  value: string;
  label: string;
}

type ProfileUpdateData = {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  setupLocation?: string;
};

interface ProfileContextType {
  profile: Profile | null;
  hwProfile: HealthWorkerProfile | null;
  age: number | null;
  locations: LocationOption[];
  uploadPhoto: (file: File) => Promise<void>;
  calculateAge: (dob: string) => number;
  updateAgeForDate: (dob: string) => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

const GENDER_MAP: Record<string, string> = {
  male: 'M',
  female: 'F',
  other: 'U',
};
const BASE_URL = () => import.meta.env.VITE_OPENMRS_API_URL || '';

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [hwProfile, setHwProfile] = useState<HealthWorkerProfile | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const providerRef = useRef<ProviderDetailResponse | null>(null);
  const avatarTsRef = useRef(Date.now());

  useEffect(() => {
    setAge(profile?.dateOfBirth ? calculateAge(profile.dateOfBirth) : null);
  }, [profile?.dateOfBirth]);

  const updateAgeForDate = useCallback((dob: string) => {
    setAge(dob?.trim() ? calculateAge(dob) : null);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = (await profileService.getLocations()) as {
          results?: Array<{
            uuid: string;
            display: string;
            attributes?: Array<{
              value?: string;
              attributeType?: { display?: string };
            }>;
          }>;
        };
        setLocations(
          res?.results?.map(loc => ({
            value: loc.display,
            label: loc.display,
          })) || []
        );
      } catch (e) {
        console.error('Failed to load locations:', e);
      }
    })();
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const userData = storage.getUser();
      if (!userData) throw new Error('User data not found');
      const user = JSON.parse(userData) as {
        uuid?: string;
        person?: { uuid?: string };
      };
      if (!user.uuid) throw new Error('User UUID not found');

      const [userDetails, provSearch] = await Promise.all([
        profileService.getUserByUuid(user.uuid) as Promise<UserDetailResponse>,
        profileService.getProvider(user.uuid).catch(() => null) as Promise<{
          results?: Array<{ uuid: string }>;
        } | null>,
      ]);

      const provUuid = provSearch?.results?.[0]?.uuid;
      const prov = provUuid
        ? ((await profileService.getProviderByUuid(
            provUuid
          )) as ProviderDetailResponse)
        : null;
      providerRef.current = prov;

      const personUuid = userDetails.person?.uuid || user.person?.uuid;
      if (!personUuid) throw new Error('Person UUID not found');

      const person = (await profileService.getPersonByUuid(
        personUuid
      )) as PersonDetailsType;
      const attrs = mapProviderAttributes(prov);
      const personAttrs = mapPersonAttributes(person);
      const roles = userDetails.roles.map(r => r.name);
      const avatar = `${BASE_URL()}/personimage/${personUuid}?t=${avatarTsRef.current}`;

      const nextHw = createHealthWorkerProfile(
        userDetails,
        person,
        prov,
        attrs,
        personAttrs
      );
      const nextProfile = createProfile(
        userDetails,
        person,
        prov,
        attrs,
        personAttrs,
        roles
      );
      nextHw.avatar = avatar;
      nextProfile.avatar = avatar;
      setHwProfile(nextHw);
      setProfile(nextProfile);
    } catch (error) {
      showToast('Error', 'Failed to load profile data', 'error');
      console.error('Profile loading error:', error);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = useCallback(
    async (data: ProfileUpdateData) => {
      if (!profile || !hwProfile?.providerUuid) {
        throw new Error('Profile not loaded or provider not found');
      }
      try {
        const gender = data.gender ? GENDER_MAP[data.gender] : undefined;
        const ageVal = data.dateOfBirth
          ? calculateAge(data.dateOfBirth)
          : profile.age;
        const hasNameChange =
          data.firstName || data.middleName || data.lastName;

        const [, personDetails] = await Promise.all([
          gender && ageVal && data.dateOfBirth
            ? profileService.updatePerson(hwProfile.personUuid, {
                gender,
                age: ageVal,
                birthdate: data.dateOfBirth,
              })
            : null,
          hasNameChange
            ? (profileService.getPersonByUuid(hwProfile.personUuid) as Promise<{
                preferredName?: { uuid: string };
              }>)
            : null,
        ]);

        if (hasNameChange && personDetails) {
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
            await profileService.createPersonName(
              hwProfile.personUuid,
              nameData
            );
          }
        }

        await updateProfileAttributes(
          data,
          providerRef.current,
          hwProfile.providerUuid
        );
        if (data.setupLocation) storage.setLocationName(data.setupLocation);

        await loadProfile();
        showToast(
          'Success',
          'Profile has been updated successfully',
          'success'
        );
      } catch (error) {
        showToast(
          'Error',
          getErrorMessage(error) || 'Failed to update profile',
          'error'
        );
        throw error;
      }
    },
    [profile, hwProfile, loadProfile]
  );

  const uploadPhoto = useCallback(
    async (file: File) => {
      if (!validateImageFormat(file)) {
        showToast(
          'Upload error!',
          'Upload JPG, JPEG or PNG format image only.',
          'warning'
        );
        return;
      }
      try {
        const base64 = await processImageFile(file);
        const personUuid =
          providerRef.current?.person?.uuid ||
          hwProfile?.personUuid ||
          profile?.id;
        if (!personUuid) throw new Error('Person UUID not found');

        await profileService.updateProfileImage({
          person: personUuid,
          base64EncodedImage: base64,
        });
        const avatar = `${BASE_URL()}/personimage/${personUuid}?t=${Date.now()}`;
        setHwProfile(prev => (prev ? { ...prev, avatar } : prev));
        setProfile(prev => (prev ? { ...prev, avatar } : prev));
        showToast(
          'Success',
          'Profile picture uploaded successfully!',
          'success'
        );
      } catch (error) {
        showToast(
          'Error',
          error instanceof Error ? error.message : 'Failed to upload photo',
          'error'
        );
      }
    },
    [hwProfile?.personUuid, profile?.id]
  );

  const value: ProfileContextType = {
    profile,
    hwProfile,
    age,
    locations,
    uploadPhoto,
    calculateAge,
    updateAgeForDate,
    refreshProfile: loadProfile,
    updateProfile,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
};

export const useProfileContext = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfileContext must be used within a ProfileProvider');
  }
  return context;
};
