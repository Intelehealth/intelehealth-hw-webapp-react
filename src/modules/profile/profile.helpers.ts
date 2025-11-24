import type { Profile } from '../../types/profile.types';
import type {
  HealthWorkerProfile,
  ProviderDetailResponse,
  UserDetailResponse,
} from '../../types/provider.types';
import profileService from './profile.service';

export type PersonDetailsType = {
  uuid: string;
  display: string;
  preferredName?: {
    givenName?: string;
    middleName?: string;
    familyName?: string;
  };
  gender?: string;
  age?: number;
  birthdate?: string;
  birthdateEstimated?: boolean;
  attributes?: Array<{
    attributeType: { name: string; display?: string };
    value: string;
  }>;
};

export const calculateAge = (dateOfBirth: string): number => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

export const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || '';
  }
  return '';
};

export const buildImageUrl = (
  _personUuid?: string | undefined,
  _providerPersonUuid?: string
): string => {
  return '';
};

export const mapProviderAttributes = (
  providerDetails: ProviderDetailResponse | null
): { [key: string]: string } => {
  const attributes: { [key: string]: string } = {};
  if (providerDetails?.attributes) {
    providerDetails.attributes.forEach(attr => {
      const displayName = attr.attributeType.display;
      attributes[displayName] = attr.value;
      attributes[attr.attributeType.name] = attr.value;
    });
  }
  return attributes;
};

export const mapPersonAttributes = (personDetails: {
  attributes?: Array<{
    attributeType: { name: string; display?: string };
    value: string;
  }>;
}): { [key: string]: string } => {
  const personAttributes: { [key: string]: string } = {};
  if (personDetails?.attributes) {
    personDetails.attributes.forEach(attr => {
      personAttributes[attr.attributeType.name] = attr.value;
      if (attr.attributeType.display) {
        personAttributes[attr.attributeType.display] = attr.value;
      }
    });
  }
  return personAttributes;
};

export const convertGender = (gender?: string): 'male' | 'female' | 'other' => {
  if (gender === 'M') return 'male';
  if (gender === 'F') return 'female';
  if (gender === 'U') return 'other';
  return (gender?.toLowerCase() as 'male' | 'female' | 'other') || 'male';
};

export const createHealthWorkerProfile = (
  userDetails: UserDetailResponse,
  personDetails: {
    uuid: string;
    display: string;
    preferredName?: {
      givenName?: string;
      middleName?: string;
      familyName?: string;
    };
    gender?: string;
    age?: number;
    birthdate?: string;
    birthdateEstimated?: boolean;
  },
  providerDetails: ProviderDetailResponse | null,
  attributes: { [key: string]: string },
  personAttributes: { [key: string]: string }
): HealthWorkerProfile => {
  const roles = userDetails.roles.map(r => r.name);
  const privileges = userDetails.privileges.map(p => p.name);
  return {
    userUuid: userDetails.uuid,
    username: userDetails.username || '',
    systemId: userDetails.systemId,
    display: userDetails.display,
    personUuid: personDetails.uuid,
    firstName: personDetails.preferredName?.givenName || '',
    middleName: personDetails.preferredName?.middleName || '',
    lastName: personDetails.preferredName?.familyName || '',
    fullName: personDetails.display,
    gender: providerDetails?.person?.gender || personDetails.gender || '',
    age: personDetails.age,
    dateOfBirth: personDetails.birthdate,
    birthdateEstimated: personDetails.birthdateEstimated,
    providerUuid: providerDetails?.uuid,
    providerIdentifier: providerDetails?.identifier,
    attributes,
    personAttributes,
    roles,
    privileges,
    hasPrivilege: (name: string) => privileges.includes(name),
    hasRole: (name: string) => roles.includes(name),
    avatar: buildImageUrl(personDetails.uuid, providerDetails?.person?.uuid),
    isActive: !userDetails.retired,
    userProperties: userDetails.userProperties,
  };
};

export const createProfile = (
  userDetails: UserDetailResponse,
  personDetails: {
    uuid: string;
    display: string;
    preferredName?: {
      givenName?: string;
      middleName?: string;
      familyName?: string;
    };
    gender?: string;
    age?: number;
    birthdate?: string;
  },
  providerDetails: ProviderDetailResponse | null,
  attributes: { [key: string]: string },
  personAttributes: { [key: string]: string },
  roles: string[]
): Profile => {
  const genderValue =
    providerDetails?.person?.gender || personDetails.gender || 'M';
  return {
    id: personDetails.uuid,
    firstName: personDetails.preferredName?.givenName || '',
    middleName: personDetails.preferredName?.middleName || '',
    lastName: personDetails.preferredName?.familyName || '',
    email:
      attributes['emailId'] ||
      attributes['Email'] ||
      personAttributes['Email'] ||
      '',
    phone:
      attributes['phoneNumber'] ||
      attributes['Telephone Number'] ||
      personAttributes['Telephone Number'] ||
      '',
    dateOfBirth: personDetails.birthdate ?? '',
    gender: convertGender(genderValue),
    address: { street: '', city: '', state: '', country: '', zipCode: '' },
    avatar: buildImageUrl(personDetails.uuid, providerDetails?.person?.uuid),
    role: roles[0] || '',
    department: attributes['department'] || '',
    employeeId: providerDetails?.identifier || '',
    joinDate: '',
    lastLogin: '',
    isActive: !userDetails.retired,
    username: userDetails.username || '',
    age: personDetails.age ?? undefined,
    setupLocation:
      attributes['setupLocation'] || attributes['setup_location'] || '',
    preferences: {
      language: 'en',
      timezone: 'UTC',
      notifications: { email: false, sms: false, push: false },
    },
  };
};

export const getAttributeUuid = (
  providerDetails: ProviderDetailResponse | null,
  attrTypeUuid: string,
  displayName: string
): string | null => {
  if (!providerDetails?.attributes) return null;
  const attr = providerDetails.attributes.find(
    a =>
      (
        a as unknown as {
          attributeType?: { uuid: string; display: string };
          voided?: boolean;
        }
      ).attributeType?.uuid === attrTypeUuid &&
      (a as unknown as { attributeType?: { uuid: string; display: string } })
        .attributeType?.display === displayName &&
      !(a as unknown as { voided?: boolean }).voided
  );
  return (attr as unknown as { uuid: string })?.uuid || null;
};

export const processImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const result = e.target?.result as string;
      if (!result) {
        reject(new Error('Failed to read file'));
        return;
      }
      const base64Image = result.split(',')[1];
      if (!base64Image?.trim()) {
        reject(new Error('Invalid image data'));
        return;
      }
      resolve(base64Image.replace(/\s/g, ''));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

export const updateProfileAttributes = async (
  data: { email?: string; phone?: string; setupLocation?: string },
  providerDetails: ProviderDetailResponse | null,
  providerUuid: string
): Promise<void> => {
  const providerAttributeTypes =
    (await profileService.getProviderAttributeTypes()) as {
      results?: Array<{ uuid: string; display: string }>;
    };
  const attributeTypeMap: Record<string, string> = {};
  providerAttributeTypes.results?.forEach(attrType => {
    attributeTypeMap[attrType.display] = attrType.uuid;
  });
  const attributeRequests: Promise<unknown>[] = [];
  ['emailId', 'phoneNumber', 'setupLocation'].forEach(key => {
    const value =
      data[
        key === 'emailId'
          ? 'email'
          : key === 'phoneNumber'
            ? 'phone'
            : ('setupLocation' as keyof typeof data)
      ];
    const attrTypeUuid = attributeTypeMap[key];
    if (value && attrTypeUuid) {
      const attrUuid = getAttributeUuid(providerDetails, attrTypeUuid, key);
      attributeRequests.push(
        profileService.addOrUpdateProviderAttribute(
          providerUuid,
          attrUuid,
          attrTypeUuid,
          value as string
        )
      );
    }
  });
  if (attributeRequests.length > 0) {
    await profileService.requestDataFromMultipleSources(attributeRequests);
  }
};
