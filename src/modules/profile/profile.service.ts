import {
  MindmapAuthGatewayApi,
  MindmapPortalApi,
} from '../../services/mindmap';
import { OpenMRSApi } from '../../services/openmrs';

// API endpoints from Angular hw-profile component
export const API_ENDPOINTS = {
  GET_PROVIDER: '/auth/provider',
  VALIDATE_ATTRIBUTE: '/auth/validateProviderAttribute',
  PROVIDER_ATTRIBUTE_TYPE: '/providerattributetype',
  PERSON: '/person',
  PERSON_IMAGE: '/personimage',
  PROVIDER: '/provider',
  USER: '/user',
} as const;

// Profile API functions - using only APIs from Angular hw-profile component
export const profileService = {
  // GET /auth/provider/{userId} - Get provider details (from auth.service.ts)
  getProvider: (userId: string) =>
    MindmapAuthGatewayApi.get(`${API_ENDPOINTS.GET_PROVIDER}/${userId}`),

  // GET /provider/{uuid}?v=full - Get full provider details with attributes
  getProviderByUuid: (providerUuid: string) =>
    OpenMRSApi.get(`${API_ENDPOINTS.PROVIDER}/${providerUuid}?v=full`),

  // GET /person/{uuid}?v=full - Get full person details
  getPersonByUuid: (personUuid: string) =>
    OpenMRSApi.get(`${API_ENDPOINTS.PERSON}/${personUuid}?v=full`),

  // GET /user/{uuid}?v=full - Get full user details with roles and privileges
  getUserByUuid: (userUuid: string) =>
    OpenMRSApi.get(`${API_ENDPOINTS.USER}/${userUuid}?v=full`),

  // GET /providerattributetype - Get provider attribute types
  getProviderAttributeTypes: () =>
    OpenMRSApi.get(API_ENDPOINTS.PROVIDER_ATTRIBUTE_TYPE),

  // POST /person/{uuid} - Update person (gender, age, birthdate)
  updatePerson: (
    personUuid: string,
    data: { gender: string; age: number; birthdate: string }
  ) => OpenMRSApi.post(`${API_ENDPOINTS.PERSON}/${personUuid}`, data),

  // POST /person/{uuid}/name - Create person name
  createPersonName: (
    personUuid: string,
    data: { givenName: string; middleName: string; familyName: string }
  ) =>
    OpenMRSApi.post(`${API_ENDPOINTS.PERSON}/${personUuid}/name`, {
      ...data,
      preferred: true,
      prefix: null,
    }),

  // POST /person/{uuid}/name/{nameUuid} - Update person name
  updatePersonName: (
    personUuid: string,
    nameUuid: string,
    data: { givenName: string; middleName: string; familyName: string }
  ) =>
    OpenMRSApi.post(`${API_ENDPOINTS.PERSON}/${personUuid}/name/${nameUuid}`, {
      ...data,
      preferred: true,
      prefix: null,
    }),

  // POST /provider/{uuid}/attribute or /provider/{uuid}/attribute/{attrUuid} - Add/Update provider attribute
  addOrUpdateProviderAttribute: (
    providerUuid: string,
    attrUuid: string | null,
    attributeTypeUuid: string,
    value: string
  ) => {
    if (!value) return Promise.resolve(null);
    if (attrUuid) {
      // Update existing attribute
      return OpenMRSApi.post(
        `/provider/${providerUuid}/attribute/${attrUuid}`,
        {
          value,
        }
      );
    } else {
      // Add new attribute
      return OpenMRSApi.post(`/provider/${providerUuid}/attribute`, {
        attributeType: attributeTypeUuid,
        value,
      });
    }
  },

  // GET /personimage/{personUuid} - Get profile image (OpenMRS personimage endpoint)
  getProfileImage: (personUuid: string) =>
    OpenMRSApi.get(`${API_ENDPOINTS.PERSON_IMAGE}/${personUuid}`, {
      responseType: 'blob', // Image is returned as binary data
    }),

  // POST /personimage - Update profile image (from profile.service.ts)
  updateProfileImage: (data: { person: string; base64EncodedImage: string }) =>
    OpenMRSApi.post(API_ENDPOINTS.PERSON_IMAGE, data),

  // POST /auth/validateProviderAttribute - Validate provider attribute (from auth.service.ts)
  validateProviderAttribute: (data: {
    attributeType: string;
    attributeValue: string;
    providerUuid: string;
  }) => MindmapPortalApi.post(API_ENDPOINTS.VALIDATE_ATTRIBUTE, data),

  // Execute multiple requests in parallel
  requestDataFromMultipleSources: <T>(requests: Promise<T>[]) =>
    Promise.all(requests),
};

export default profileService;
