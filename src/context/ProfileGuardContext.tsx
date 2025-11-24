import React, { createContext, useContext, useEffect, useState } from 'react';
import { startLoading, stopLoading } from '../reducers/loader.reducer';
import { useDispatch } from 'react-redux';
import { storage } from '../utils/storage';
import profileService from '../modules/profile/profile.service';

const PROFILE_LOADER_ID = 'profile-guard';

interface ProfileGuardContextType {
  isProfileComplete: boolean;
  profileState: 'not-started' | 'incomplete' | 'complete';
  refreshProfileStatus: () => Promise<void>;
}

const ProfileGuardContext = createContext<ProfileGuardContextType | null>(null);

// OpenMRS Person API response type
interface PersonResponse {
  preferredName?: {
    givenName: string;
    middleName?: string;
    familyName: string;
  };
  gender?: string;
  birthdate?: string;
  attributes?: Array<{
    attributeType: { display: string };
    value: string;
  }>;
}

// OpenMRS Provider API response type
interface ProviderResponse {
  attributes?: Array<{
    attributeType: { display: string; name?: string };
    value: string;
  }>;
}
const getProfileState = (
  person: PersonResponse | null,
  provider: ProviderResponse | null
): 'not-started' | 'incomplete' | 'complete' => {
  if (!person) return 'not-started';

  const firstName = person.preferredName?.givenName;
  const lastName = person.preferredName?.familyName;
  const gender = person.gender;
  const birthdate = person.birthdate;
  const emailAttr = provider?.attributes?.find(
    attr =>
      attr.attributeType.display === 'emailId' ||
      attr.attributeType.name === 'emailId' ||
      attr.attributeType.display === 'Email' ||
      attr.attributeType.display === 'email'
  );
  const phoneAttr = provider?.attributes?.find(
    attr =>
      attr.attributeType.display === 'phoneNumber' ||
      attr.attributeType.name === 'phoneNumber' ||
      attr.attributeType.display === 'Telephone Number' ||
      attr.attributeType.display === 'phoneNumber'
  );

  const email = emailAttr?.value;
  const phone = phoneAttr?.value;

  // Check if profile has any data
  const hasAnyData =
    firstName || lastName || gender || birthdate || email || phone;
  if (!hasAnyData) return 'not-started';

  // Check if all required fields are filled
  const hasAllRequired =
    firstName &&
    lastName &&
    gender &&
    birthdate &&
    email &&
    phone &&
    firstName.trim() !== '' &&
    lastName.trim() !== '' &&
    gender.trim() !== '' &&
    birthdate.trim() !== '' &&
    email.trim() !== '' &&
    phone.trim() !== '';

  return hasAllRequired ? 'complete' : 'incomplete';
};

export const ProfileGuardProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const dispatch = useDispatch();
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [profileState, setProfileState] = useState<
    'not-started' | 'incomplete' | 'complete'
  >('not-started');

  const refreshProfileStatus = async () => {
    try {
      dispatch(startLoading(PROFILE_LOADER_ID));
      // Avoid real network calls during tests (prevents jsdom XHR AggregateError)
      // Allow bypassing test mode check via VITE_SKIP_TEST_MODE env var
      if (
        import.meta &&
        import.meta.env &&
        import.meta.env.MODE === 'test' &&
        !import.meta.env.VITE_SKIP_TEST_MODE
      ) {
        setIsProfileComplete(false);
        setProfileState('not-started');
        return;
      }

      // Get user data from storage
      const userData = storage.getUser();
      if (!userData) {
        setIsProfileComplete(false);
        setProfileState('not-started');
        return;
      }

      const user = JSON.parse(userData);
      const personUuid = user.person?.uuid;

      if (!personUuid) {
        setIsProfileComplete(false);
        setProfileState('not-started');
        return;
      }

      // Get person data from OpenMRS API
      const person = (await profileService.getPersonByUuid(
        personUuid
      )) as PersonResponse;
      // Get provider data to access email and phone attributes
      let provider: ProviderResponse | null = null;
      try {
        const providerData = (await profileService.getProvider(user.uuid)) as {
          results?: Array<{ uuid: string }>;
        };
        if (providerData?.results?.[0]) {
          provider = (await profileService.getProviderByUuid(
            providerData.results[0].uuid
          )) as ProviderResponse;
        }
      } catch (providerError) {
        console.warn(
          '[ProfileGuard] Could not fetch provider data:',
          providerError
        );
      }

      const state = getProfileState(person || null, provider);
      setProfileState(state);
      setIsProfileComplete(state === 'complete');
    } catch (error) {
      console.error('[ProfileGuard] Error fetching profile:', error);
      setIsProfileComplete(false);
      setProfileState('not-started');
    } finally {
      dispatch(stopLoading(PROFILE_LOADER_ID));
    }
  };

  useEffect(() => {
    refreshProfileStatus();
  }, []);

  return (
    <ProfileGuardContext.Provider
      value={{ isProfileComplete, profileState, refreshProfileStatus }}
    >
      {children}
    </ProfileGuardContext.Provider>
  );
};

export const useProfileGuard = () => {
  const context = useContext(ProfileGuardContext);
  if (!context) {
    throw new Error('useProfileGuard must be used within ProfileGuardProvider');
  }
  return context;
};
