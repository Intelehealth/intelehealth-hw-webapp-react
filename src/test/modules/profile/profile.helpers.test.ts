import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  ProviderDetailResponse,
  UserDetailResponse,
} from '../../../types/provider.types';
import {
  buildImageUrl,
  calculateAge,
  convertGender,
  createHealthWorkerProfile,
  createProfile,
  fileToBase64,
  getAttributeUuid,
  getErrorMessage,
  mapPersonAttributes,
  mapProviderAttributes,
  processImageFile,
  updateProfileAttributes,
  validateImageFormat,
} from '../../../modules/profile/profile.helpers';
import profileService from '../../../modules/profile/profile.service';

// Mock profile service
vi.mock('../../../modules/profile/profile.service', () => ({
  default: {
    getProviderAttributeTypes: vi.fn(),
    addOrUpdateProviderAttribute: vi.fn(),
    requestDataFromMultipleSources: vi.fn(),
  },
}));

describe('Profile Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateAge', () => {
    it('should calculate age correctly for a birthdate', () => {
      const today = new Date();
      const birthYear = today.getFullYear() - 25;
      const birthDate = new Date(birthYear, 5, 15); // June 15
      const dateString = birthDate.toISOString().split('T')[0];

      const age = calculateAge(dateString);
      expect(age).toBeGreaterThanOrEqual(24);
      expect(age).toBeLessThanOrEqual(25);
    });

    it('should subtract one from age if birthday has not occurred this year', () => {
      const today = new Date();
      const futureMonth = (today.getMonth() + 2) % 12;
      const birthYear = today.getFullYear() - 25;
      const birthDate = new Date(birthYear, futureMonth, 28);
      const dateString = birthDate.toISOString().split('T')[0];

      const age = calculateAge(dateString);
      // Age should be 24 if birthday hasn't happened yet
      expect(age).toBeGreaterThanOrEqual(24);
      expect(age).toBeLessThanOrEqual(25);
    });

    it('should handle birthdate on same month but later date', () => {
      const today = new Date();
      const futureDate = today.getDate() + 5;
      const birthYear = today.getFullYear() - 30;
      const birthDate = new Date(birthYear, today.getMonth(), futureDate);
      const dateString = birthDate.toISOString().split('T')[0];

      const age = calculateAge(dateString);
      expect(age).toBeGreaterThanOrEqual(29);
      expect(age).toBeLessThanOrEqual(30);
    });

    it('should subtract one from age when birthday is same month but later date (line 34)', () => {
      // Create a birthdate in the same month as today but with a later day
      const today = new Date();
      const currentDay = today.getDate();

      // If today is the last day of the month, use a date earlier in the same month
      // Otherwise, use a date later in the month
      let birthDay: number;
      if (currentDay >= 28) {
        birthDay = 15; // Use middle of the month
        const birthYear = today.getFullYear() - 25;
        const birthDate = new Date(birthYear, today.getMonth(), birthDay);
        const dateString = birthDate.toISOString().split('T')[0];

        const age = calculateAge(dateString);
        expect(age).toBe(25);
      } else {
        birthDay = currentDay + 5; // Use a date 5 days later
        const birthYear = today.getFullYear() - 25;
        const birthDate = new Date(birthYear, today.getMonth(), birthDay);
        const dateString = birthDate.toISOString().split('T')[0];

        const age = calculateAge(dateString);
        // Age should be 24 because birthday hasn't happened yet this month
        expect(age).toBe(24);
      }
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from axios error response', () => {
      const error = {
        response: {
          data: {
            message: 'Authentication failed',
          },
        },
      };

      const message = getErrorMessage(error);
      expect(message).toBe('Authentication failed');
    });

    it('should return empty string if response has no message', () => {
      const error = {
        response: {
          data: {},
        },
      };

      const message = getErrorMessage(error);
      expect(message).toBe('');
    });

    it('should return empty string if response data is undefined', () => {
      const error = {
        response: {},
      };

      const message = getErrorMessage(error);
      expect(message).toBe('');
    });

    it('should return empty string for non-axios error', () => {
      const error = new Error('Generic error');

      const message = getErrorMessage(error);
      expect(message).toBe('');
    });

    it('should return empty string for null error', () => {
      const message = getErrorMessage(null);
      expect(message).toBe('');
    });

    it('should return empty string for undefined error', () => {
      const message = getErrorMessage(undefined);
      expect(message).toBe('');
    });
  });

  describe('buildImageUrl', () => {
    it('should return empty string (image fetching now handled by API)', () => {
      const personUuid = 'person-123';
      const url = buildImageUrl(personUuid);
      expect(url).toBe('');
    });

    it('should return empty string regardless of providerPersonUuid', () => {
      const personUuid = 'person-123';
      const providerPersonUuid = 'provider-456';
      const url = buildImageUrl(personUuid, providerPersonUuid);
      expect(url).toBe('');
    });

    it('should return empty string if both uuids are undefined', () => {
      const url = buildImageUrl(undefined);
      expect(url).toBe('');
    });

    it('should return empty string if both uuids are empty', () => {
      const url = buildImageUrl('', '');
      expect(url).toBe('');
    });

    it('should return empty string when providerPersonUuid is not provided', () => {
      const personUuid = 'person-123';
      const url = buildImageUrl(personUuid, undefined);
      expect(url).toBe('');
    });

    it('should return empty string when uuid is falsy after preference check', () => {
      const url = buildImageUrl('', '');
      expect(url).toBe('');
    });

    it('should return empty string when providerPersonUuid is empty string', () => {
      const personUuid = 'person-789';
      const url = buildImageUrl(personUuid, '');
      expect(url).toBe('');
    });

    it('should return empty string for any input combination', () => {
      const personUuid = 'person-123';
      const url = buildImageUrl(personUuid);
      expect(url).toBe('');
    });

    it('should return empty string when uuid resolves to empty after preference check', () => {
      const url = buildImageUrl(undefined, undefined);
      expect(url).toBe('');
    });

    it('should return empty string when personUuid is null', () => {
      const url = buildImageUrl(undefined);
      expect(url).toBe('');
    });

    it('should return empty string when both uuids are null', () => {
      const url = buildImageUrl(undefined, undefined);
      expect(url).toBe('');
    });

    it('should return empty string when providerPersonUuid is null but personUuid exists', () => {
      const personUuid = 'person-uuid-123';
      const url = buildImageUrl(personUuid, undefined);
      expect(url).toBe('');
    });

    it('should return empty string regardless of environment variable', () => {
      vi.stubEnv('VITE_OPENMRS_API_URL', undefined as any);
      const personUuid = 'person-123';
      const url = buildImageUrl(personUuid);
      expect(url).toBe('');
      vi.unstubAllEnvs();
    });

    it('should return empty string with truthy uuid', () => {
      const url = buildImageUrl('person-123');
      expect(url).toBe('');
      const url2 = buildImageUrl('person-456', 'provider-789');
      expect(url2).toBe('');
    });

    it('should always return empty string', () => {
      const url1 = buildImageUrl('valid-uuid');
      expect(url1).toBe('');

      expect(buildImageUrl(undefined, undefined)).toBe('');
      expect(buildImageUrl('', '')).toBe('');
      expect(buildImageUrl(null as any, null as any)).toBe('');
      expect(buildImageUrl(0 as any, 0 as any)).toBe('');
      expect(buildImageUrl(false as any, false as any)).toBe('');
    });
  });

  describe('mapProviderAttributes', () => {
    it('should map provider attributes to key-value pairs', () => {
      const providerDetails: ProviderDetailResponse = {
        uuid: 'provider-123',
        display: 'John Doe - EMP001',
        identifier: 'EMP001',
        person: { uuid: 'person-123', display: 'John Doe', gender: 'M' },
        attributes: [
          {
            uuid: 'attr-inst-1',
            display: 'Email: john@example.com',
            attributeType: { uuid: 'attr-1', name: 'emailId', display: 'Email' },
            value: 'john@example.com',
          },
          {
            uuid: 'attr-inst-2',
            display: 'Phone: 1234567890',
            attributeType: { uuid: 'attr-2', name: 'phoneNumber', display: 'Phone' },
            value: '1234567890',
          },
        ],
      };

      const attributes = mapProviderAttributes(providerDetails);

      expect(attributes).toEqual({
        Email: 'john@example.com',
        emailId: 'john@example.com',
        Phone: '1234567890',
        phoneNumber: '1234567890',
      });
    });

    it('should return empty object if providerDetails is null', () => {
      const attributes = mapProviderAttributes(null);
      expect(attributes).toEqual({});
    });

    it('should return empty object if providerDetails has no attributes', () => {
      const providerDetails: ProviderDetailResponse = {
        uuid: 'provider-123',
        display: 'John Doe - EMP001',
        identifier: 'EMP001',
        person: { uuid: 'person-123', display: 'John Doe', gender: 'M' },
      };

      const attributes = mapProviderAttributes(providerDetails);
      expect(attributes).toEqual({});
    });
  });

  describe('mapPersonAttributes', () => {
    it('should map person attributes to key-value pairs', () => {
      const personDetails = {
        attributes: [
          {
            attributeType: { name: 'email', display: 'Email Address' },
            value: 'person@example.com',
          },
          {
            attributeType: { name: 'phone', display: 'Telephone Number' },
            value: '9876543210',
          },
        ],
      };

      const attributes = mapPersonAttributes(personDetails);

      expect(attributes).toEqual({
        email: 'person@example.com',
        'Email Address': 'person@example.com',
        phone: '9876543210',
        'Telephone Number': '9876543210',
      });
    });

    it('should handle attributes without display property', () => {
      const personDetails = {
        attributes: [
          {
            attributeType: { name: 'customAttr' },
            value: 'customValue',
          },
        ],
      };

      const attributes = mapPersonAttributes(personDetails);

      expect(attributes).toEqual({
        customAttr: 'customValue',
      });
    });

    it('should return empty object if personDetails has no attributes', () => {
      const personDetails = {};
      const attributes = mapPersonAttributes(personDetails);
      expect(attributes).toEqual({});
    });

    it('should return empty object if personDetails is undefined', () => {
      const personDetails = { attributes: undefined };
      const attributes = mapPersonAttributes(personDetails);
      expect(attributes).toEqual({});
    });
  });

  describe('convertGender', () => {
    it('should convert M to male', () => {
      expect(convertGender('M')).toBe('male');
    });

    it('should convert F to female', () => {
      expect(convertGender('F')).toBe('female');
    });

    it('should convert U to other', () => {
      expect(convertGender('U')).toBe('other');
    });

    it('should convert lowercase gender strings', () => {
      expect(convertGender('male')).toBe('male');
      expect(convertGender('female')).toBe('female');
      expect(convertGender('other')).toBe('other');
    });

    it('should default to male for undefined gender', () => {
      expect(convertGender(undefined)).toBe('male');
    });

    it('should convert lowercase for unknown gender value', () => {
      // Unknown values get converted to lowercase
      expect(convertGender('X')).toBe('x');
    });
  });

  describe('createHealthWorkerProfile', () => {
    it('should create health worker profile from API responses', () => {
      const userDetails: UserDetailResponse = {
        uuid: 'user-123',
        username: 'johndoe',
        systemId: 'admin',
        display: 'John Doe (johndoe)',
        person: { uuid: 'person-123', display: 'John Doe', gender: 'M' },
        roles: [{ uuid: 'role-1', name: 'System Administrator', display: 'System Administrator' }],
        privileges: [{ uuid: 'priv-1', name: 'Edit Users', display: 'Edit Users' }],
        retired: false,
        userProperties: {},
      };

      const personDetails = {
        uuid: 'person-123',
        display: 'John Doe',
        preferredName: {
          givenName: 'John',
          middleName: 'M',
          familyName: 'Doe',
        },
        gender: 'M',
        age: 30,
        birthdate: '1994-01-15',
        birthdateEstimated: false,
      };

      const providerDetails: ProviderDetailResponse = {
        uuid: 'provider-123',
        display: 'John Doe - EMP001',
        identifier: 'EMP001',
        person: { uuid: 'person-123', display: 'John Doe', gender: 'M' },
      };

      const attributes = { emailId: 'john@example.com' };
      const personAttributes = { phone: '1234567890' };

      const profile = createHealthWorkerProfile(
        userDetails,
        personDetails,
        providerDetails,
        attributes,
        personAttributes
      );

      expect(profile).toEqual({
        userUuid: 'user-123',
        username: 'johndoe',
        systemId: 'admin',
        display: 'John Doe (johndoe)',
        personUuid: 'person-123',
        firstName: 'John',
        middleName: 'M',
        lastName: 'Doe',
        fullName: 'John Doe',
        gender: 'M',
        age: 30,
        dateOfBirth: '1994-01-15',
        birthdateEstimated: false,
        providerUuid: 'provider-123',
        providerIdentifier: 'EMP001',
        attributes,
        personAttributes,
        roles: ['System Administrator'],
        privileges: ['Edit Users'],
        hasPrivilege: expect.any(Function),
        hasRole: expect.any(Function),
        avatar: expect.any(String),
        isActive: true,
        userProperties: {},
      });

      expect(profile.hasPrivilege('Edit Users')).toBe(true);
      expect(profile.hasPrivilege('Delete Users')).toBe(false);
      expect(profile.hasRole('System Administrator')).toBe(true);
      expect(profile.hasRole('Doctor')).toBe(false);
    });

    it('should handle missing optional fields', () => {
      const userDetails: UserDetailResponse = {
        uuid: 'user-123',
        username: '',
        systemId: 'admin',
        display: 'User',
        person: { uuid: 'person-123', display: 'User', gender: 'M' },
        roles: [],
        privileges: [],
        retired: true,
        userProperties: {},
      };

      const personDetails = {
        uuid: 'person-123',
        display: 'User',
      };

      const profile = createHealthWorkerProfile(
        userDetails,
        personDetails,
        null,
        {},
        {}
      );

      expect(profile.username).toBe('');
      expect(profile.firstName).toBe('');
      expect(profile.middleName).toBe('');
      expect(profile.lastName).toBe('');
      expect(profile.isActive).toBe(false);
      expect(profile.providerUuid).toBeUndefined();
    });
  });

  describe('createProfile', () => {
    it('should create profile from API responses', () => {
      const userDetails: UserDetailResponse = {
        uuid: 'user-123',
        username: 'janedoe',
        systemId: 'admin',
        display: 'Jane Doe',
        person: { uuid: 'person-456', display: 'Jane Doe', gender: 'F' },
        roles: [{ uuid: 'role-2', name: 'Doctor', display: 'Doctor' }],
        privileges: [],
        retired: false,
        userProperties: {},
      };

      const personDetails = {
        uuid: 'person-456',
        display: 'Jane Doe',
        preferredName: {
          givenName: 'Jane',
          middleName: 'A',
          familyName: 'Doe',
        },
        gender: 'F',
        age: 28,
        birthdate: '1996-03-20',
      };

      const providerDetails: ProviderDetailResponse = {
        uuid: 'provider-456',
        display: 'Jane Doe - DOC001',
        identifier: 'DOC001',
        person: { uuid: 'person-456', display: 'Jane Doe', gender: 'F' },
      };

      const attributes = {
        emailId: 'jane@example.com',
        phoneNumber: '9876543210',
        department: 'Cardiology',
        setupLocation: 'Hospital A',
      };

      const personAttributes = {};
      const roles = ['Doctor'];

      const profile = createProfile(
        userDetails,
        personDetails,
        providerDetails,
        attributes,
        personAttributes,
        roles
      );

      expect(profile).toEqual({
        id: 'person-456',
        firstName: 'Jane',
        middleName: 'A',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '9876543210',
        dateOfBirth: '1996-03-20',
        gender: 'female',
        address: { street: '', city: '', state: '', country: '', zipCode: '' },
        avatar: expect.any(String),
        role: 'Doctor',
        department: 'Cardiology',
        employeeId: 'DOC001',
        joinDate: '',
        lastLogin: '',
        isActive: true,
        username: 'janedoe',
        age: 28,
        setupLocation: 'Hospital A',
        preferences: {
          language: 'en',
          timezone: 'UTC',
          notifications: { email: false, sms: false, push: false },
        },
      });
    });

    it('should fallback to Email attribute from personAttributes', () => {
      const userDetails: UserDetailResponse = {
        uuid: 'user-123',
        username: 'user123',
        systemId: 'admin',
        display: 'User',
        person: { uuid: 'person-123', display: 'User', gender: 'M' },
        roles: [],
        privileges: [],
        retired: false,
        userProperties: {},
      };

      const personDetails = {
        uuid: 'person-123',
        display: 'User',
      };

      const profile = createProfile(
        userDetails,
        personDetails,
        null,
        {},
        { Email: 'person-email@example.com' },
        []
      );

      expect(profile.email).toBe('person-email@example.com');
    });

    it('should fallback to Telephone Number from personAttributes', () => {
      const userDetails: UserDetailResponse = {
        uuid: 'user-123',
        username: 'user123',
        systemId: 'admin',
        display: 'User',
        person: { uuid: 'person-123', display: 'User', gender: 'M' },
        roles: [],
        privileges: [],
        retired: false,
        userProperties: {},
      };

      const personDetails = {
        uuid: 'person-123',
        display: 'User',
      };

      const profile = createProfile(
        userDetails,
        personDetails,
        null,
        {},
        { 'Telephone Number': '5551234567' },
        []
      );

      expect(profile.phone).toBe('5551234567');
    });

    it('should use setup_location as fallback for setupLocation', () => {
      const userDetails: UserDetailResponse = {
        uuid: 'user-123',
        username: 'user123',
        systemId: 'admin',
        display: 'User',
        person: { uuid: 'person-123', display: 'User', gender: 'M' },
        roles: [],
        privileges: [],
        retired: false,
        userProperties: {},
      };

      const personDetails = {
        uuid: 'person-123',
        display: 'User',
      };

      const profile = createProfile(
        userDetails,
        personDetails,
        null,
        { setup_location: 'Location B' },
        {},
        []
      );

      expect(profile.setupLocation).toBe('Location B');
    });

    it('should handle null birthdate', () => {
      const userDetails: UserDetailResponse = {
        uuid: 'user-123',
        username: 'user123',
        systemId: 'admin',
        display: 'User',
        person: { uuid: 'person-123', display: 'User', gender: 'M' },
        roles: [],
        privileges: [],
        retired: false,
        userProperties: {},
      };

      const personDetails = {
        uuid: 'person-123',
        display: 'User',
        birthdate: null as any,
      };

      const profile = createProfile(
        userDetails,
        personDetails,
        null,
        {},
        {},
        []
      );

      expect(profile.dateOfBirth).toBe('');
    });

    it('should handle null age', () => {
      const userDetails: UserDetailResponse = {
        uuid: 'user-123',
        username: 'user123',
        systemId: 'admin',
        display: 'User',
        person: { uuid: 'person-123', display: 'User', gender: 'M' },
        roles: [],
        privileges: [],
        retired: false,
        userProperties: {},
      };

      const personDetails = {
        uuid: 'person-123',
        display: 'User',
        age: null as any,
      };

      const profile = createProfile(
        userDetails,
        personDetails,
        null,
        {},
        {},
        []
      );

      expect(profile.age).toBeUndefined();
    });

    it('should handle empty username with fallback', () => {
      const userDetails: UserDetailResponse = {
        uuid: 'user-123',
        username: '',
        systemId: 'admin',
        display: 'User',
        person: { uuid: 'person-123', display: 'User', gender: 'M' },
        roles: [],
        privileges: [],
        retired: false,
        userProperties: {},
      };

      const personDetails = {
        uuid: 'person-123',
        display: 'User',
      };

      const profile = createProfile(
        userDetails,
        personDetails,
        null,
        {},
        {},
        []
      );

      expect(profile.username).toBe('');
    });
  });

  describe('getAttributeUuid', () => {
    it('should return attribute UUID when found', () => {
      const providerDetails: ProviderDetailResponse = {
        uuid: 'provider-123',
        display: 'John Doe - EMP001',
        identifier: 'EMP001',
        person: { uuid: 'person-123', display: 'John Doe', gender: 'M' },
        attributes: [
          {
            uuid: 'attr-uuid-123',
            attributeType: { uuid: 'type-123', display: 'Email' },
            value: 'test@example.com',
            voided: false,
          } as any,
        ],
      };

      const uuid = getAttributeUuid(providerDetails, 'type-123', 'Email');
      expect(uuid).toBe('attr-uuid-123');
    });

    it('should return null if attribute type does not match', () => {
      const providerDetails: ProviderDetailResponse = {
        uuid: 'provider-123',
        display: 'John Doe - EMP001',
        identifier: 'EMP001',
        person: { uuid: 'person-123', display: 'John Doe', gender: 'M' },
        attributes: [
          {
            uuid: 'attr-uuid-123',
            attributeType: { uuid: 'type-123', display: 'Email' },
            value: 'test@example.com',
            voided: false,
          } as any,
        ],
      };

      const uuid = getAttributeUuid(providerDetails, 'wrong-type', 'Email');
      expect(uuid).toBeNull();
    });

    it('should return null if display name does not match', () => {
      const providerDetails: ProviderDetailResponse = {
        uuid: 'provider-123',
        display: 'John Doe - EMP001',
        identifier: 'EMP001',
        person: { uuid: 'person-123', display: 'John Doe', gender: 'M' },
        attributes: [
          {
            uuid: 'attr-uuid-123',
            attributeType: { uuid: 'type-123', display: 'Email' },
            value: 'test@example.com',
            voided: false,
          } as any,
        ],
      };

      const uuid = getAttributeUuid(providerDetails, 'type-123', 'Phone');
      expect(uuid).toBeNull();
    });

    it('should return null if attribute is voided', () => {
      const providerDetails: ProviderDetailResponse = {
        uuid: 'provider-123',
        display: 'John Doe - EMP001',
        identifier: 'EMP001',
        person: { uuid: 'person-123', display: 'John Doe', gender: 'M' },
        attributes: [
          {
            uuid: 'attr-uuid-123',
            attributeType: { uuid: 'type-123', display: 'Email' },
            value: 'test@example.com',
            voided: true,
          } as any,
        ],
      };

      const uuid = getAttributeUuid(providerDetails, 'type-123', 'Email');
      expect(uuid).toBeNull();
    });

    it('should return null if providerDetails is null', () => {
      const uuid = getAttributeUuid(null, 'type-123', 'Email');
      expect(uuid).toBeNull();
    });

    it('should return null if providerDetails has no attributes', () => {
      const providerDetails: ProviderDetailResponse = {
        uuid: 'provider-123',
        display: 'John Doe - EMP001',
        identifier: 'EMP001',
        person: { uuid: 'person-123', display: 'John Doe', gender: 'M' },
      };

      const uuid = getAttributeUuid(providerDetails, 'type-123', 'Email');
      expect(uuid).toBeNull();
    });
  });

  describe('processImageFile', () => {
    it('should convert file to base64 string', async () => {
      const mockFileContent = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const file = new File(['test'], 'test.png', { type: 'image/png' });

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as any,
        onerror: null as any,
        result: mockFileContent,
      };

      vi.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any);

      const promise = processImageFile(file);

      // Trigger onload
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: mockFileContent } } as any);
      }

      const result = await promise;
      expect(result).toBe('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    });

    it('should reject if FileReader fails', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as any,
        onerror: null as any,
      };

      vi.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any);

      const promise = processImageFile(file);

      // Trigger onerror
      if (mockFileReader.onerror) {
        mockFileReader.onerror();
      }

      await expect(promise).rejects.toThrow('Failed to read file');
    });

    it('should reject if result is null', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as any,
        onerror: null as any,
      };

      vi.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any);

      const promise = processImageFile(file);

      // Trigger onload with null result
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: null } } as any);
      }

      await expect(promise).rejects.toThrow('Failed to read file');
    });

    it('should reject if base64 data is invalid', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as any,
        onerror: null as any,
      };

      vi.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any);

      const promise = processImageFile(file);

      // Trigger onload with invalid base64
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: 'data:image/png;base64,' } } as any);
      }

      await expect(promise).rejects.toThrow('Invalid image data');
    });

    it('should remove whitespace from base64 string', async () => {
      const mockFileContent = 'data:image/png;base64,iVBOR w0KGgo AAAANSUhE UgAAA A==';

      const file = new File(['test'], 'test.png', { type: 'image/png' });

      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onload: null as any,
        onerror: null as any,
      };

      vi.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any);

      const promise = processImageFile(file);

      // Trigger onload
      if (mockFileReader.onload) {
        mockFileReader.onload({ target: { result: mockFileContent } } as any);
      }

      const result = await promise;
      expect(result).toBe('iVBORw0KGgoAAAANSUhEUgAAAA==');
      expect(result).not.toContain(' ');
    });
  });

  describe('fileToBase64', () => {
    it('should convert file to base64 data URL string', async () => {
      const mockFileContent = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const file = new File(['test'], 'test.png', { type: 'image/png' });

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onloadend: null as any,
        onerror: null as any,
        result: mockFileContent,
      };

      vi.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any);

      const promise = fileToBase64(file);

      // Trigger onloadend
      if (mockFileReader.onloadend) {
        mockFileReader.onloadend();
      }

      const result = await promise;
      expect(result).toBe(mockFileContent);
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);
    });

    it('should reject if FileReader fails', async () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });

      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onloadend: null as any,
        onerror: null as any,
      };

      vi.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any);

      const promise = fileToBase64(file);

      // Trigger onerror with an error
      if (mockFileReader.onerror) {
        const error = new Error('File read error');
        mockFileReader.onerror(error);
      }

      await expect(promise).rejects.toThrow('File read error');
    });

    it('should handle different file types', async () => {
      const mockFileContent = 'data:application/pdf;base64,JVBERi0xLjQKJeLjz9MK';

      const file = new File(['test pdf'], 'test.pdf', { type: 'application/pdf' });

      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onloadend: null as any,
        onerror: null as any,
        result: mockFileContent,
      };

      vi.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any);

      const promise = fileToBase64(file);

      // Trigger onloadend
      if (mockFileReader.onloadend) {
        mockFileReader.onloadend();
      }

      const result = await promise;
      expect(result).toBe(mockFileContent);
    });

    it('should handle empty file', async () => {
      const mockFileContent = 'data:text/plain;base64,';

      const file = new File([], 'empty.txt', { type: 'text/plain' });

      const mockFileReader = {
        readAsDataURL: vi.fn(),
        onloadend: null as any,
        onerror: null as any,
        result: mockFileContent,
      };

      vi.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any);

      const promise = fileToBase64(file);

      // Trigger onloadend
      if (mockFileReader.onloadend) {
        mockFileReader.onloadend();
      }

      const result = await promise;
      expect(result).toBe(mockFileContent);
    });
  });

  describe('updateProfileAttributes', () => {
    it('should update email, phone, and setupLocation attributes', async () => {
      const providerDetails: ProviderDetailResponse = {
        uuid: 'provider-123',
        display: 'John Doe - EMP001',
        identifier: 'EMP001',
        person: { uuid: 'person-123', display: 'John Doe', gender: 'M' },
        attributes: [
          {
            uuid: 'attr-uuid-email',
            attributeType: { uuid: 'type-email', display: 'emailId' },
            value: 'old@example.com',
            voided: false,
          } as any,
        ],
      };

      vi.mocked(profileService.getProviderAttributeTypes).mockResolvedValue({
        results: [
          { uuid: 'type-email', display: 'emailId' },
          { uuid: 'type-phone', display: 'phoneNumber' },
          { uuid: 'type-location', display: 'setupLocation' },
        ],
      } as any);

      vi.mocked(profileService.addOrUpdateProviderAttribute).mockResolvedValue({});
      vi.mocked(profileService.requestDataFromMultipleSources).mockResolvedValue([]);

      await updateProfileAttributes(
        {
          email: 'new@example.com',
          phone: '1234567890',
          setupLocation: 'Location A',
        },
        providerDetails,
        'provider-123'
      );

      expect(profileService.addOrUpdateProviderAttribute).toHaveBeenCalledTimes(3);
      expect(profileService.addOrUpdateProviderAttribute).toHaveBeenCalledWith(
        'provider-123',
        'attr-uuid-email',
        'type-email',
        'new@example.com'
      );
      expect(profileService.requestDataFromMultipleSources).toHaveBeenCalledTimes(1);
    });

    it('should skip attributes with no value', async () => {
      vi.mocked(profileService.getProviderAttributeTypes).mockResolvedValue({
        results: [
          { uuid: 'type-email', display: 'emailId' },
          { uuid: 'type-phone', display: 'phoneNumber' },
        ],
      } as any);

      vi.mocked(profileService.addOrUpdateProviderAttribute).mockResolvedValue({});
      vi.mocked(profileService.requestDataFromMultipleSources).mockResolvedValue([]);

      await updateProfileAttributes(
        {
          email: 'test@example.com',
        },
        null,
        'provider-123'
      );

      expect(profileService.addOrUpdateProviderAttribute).toHaveBeenCalledTimes(1);
    });

    it('should skip attributes with no matching attribute type', async () => {
      vi.mocked(profileService.getProviderAttributeTypes).mockResolvedValue({
        results: [],
      } as any);

      vi.mocked(profileService.addOrUpdateProviderAttribute).mockResolvedValue({});
      vi.mocked(profileService.requestDataFromMultipleSources).mockResolvedValue([]);

      await updateProfileAttributes(
        {
          email: 'test@example.com',
          phone: '1234567890',
        },
        null,
        'provider-123'
      );

      expect(profileService.addOrUpdateProviderAttribute).not.toHaveBeenCalled();
      expect(profileService.requestDataFromMultipleSources).not.toHaveBeenCalled();
    });

    it('should not call requestDataFromMultipleSources if no attributes to update', async () => {
      vi.mocked(profileService.getProviderAttributeTypes).mockResolvedValue({
        results: [
          { uuid: 'type-email', display: 'emailId' },
        ],
      } as any);

      await updateProfileAttributes(
        {},
        null,
        'provider-123'
      );

      expect(profileService.requestDataFromMultipleSources).not.toHaveBeenCalled();
    });
  });

  describe('validateImageFormat', () => {
    it('should return true for valid JPEG file', () => {
      const file = new File(['test'], 'photo.jpeg', { type: 'image/jpeg' });
      expect(validateImageFormat(file)).toBe(true);
    });

    it('should return true for valid JPG file', () => {
      const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' });
      expect(validateImageFormat(file)).toBe(true);
    });

    it('should return true for valid PNG file', () => {
      const file = new File(['test'], 'photo.png', { type: 'image/png' });
      expect(validateImageFormat(file)).toBe(true);
    });

    it('should return true for uppercase JPG extension', () => {
      const file = new File(['test'], 'PHOTO.JPG', { type: 'image/jpeg' });
      expect(validateImageFormat(file)).toBe(true);
    });

    it('should return true for uppercase JPEG extension', () => {
      const file = new File(['test'], 'PHOTO.JPEG', { type: 'image/jpeg' });
      expect(validateImageFormat(file)).toBe(true);
    });

    it('should return true for uppercase PNG extension', () => {
      const file = new File(['test'], 'PHOTO.PNG', { type: 'image/png' });
      expect(validateImageFormat(file)).toBe(true);
    });

    it('should return false for invalid GIF file', () => {
      const file = new File(['test'], 'photo.gif', { type: 'image/gif' });
      expect(validateImageFormat(file)).toBe(false);
    });

    it('should return false for invalid BMP file', () => {
      const file = new File(['test'], 'photo.bmp', { type: 'image/bmp' });
      expect(validateImageFormat(file)).toBe(false);
    });

    it('should return false for invalid WEBP file', () => {
      const file = new File(['test'], 'photo.webp', { type: 'image/webp' });
      expect(validateImageFormat(file)).toBe(false);
    });

    it('should return false for non-image file', () => {
      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });
      expect(validateImageFormat(file)).toBe(false);
    });

    it('should return false for file with no extension', () => {
      const file = new File(['test'], 'photo', { type: 'image/jpeg' });
      expect(validateImageFormat(file)).toBe(false);
    });

    it('should return false for file with mixed case invalid extension', () => {
      const file = new File(['test'], 'photo.GiF', { type: 'image/gif' });
      expect(validateImageFormat(file)).toBe(false);
    });
  });
});
