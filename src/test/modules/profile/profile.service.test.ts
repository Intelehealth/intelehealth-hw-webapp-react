import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  API_ENDPOINTS,
  profileService,
} from '../../../modules/profile/profile.service';
import {
  MindmapAuthGatewayApi,
  MindmapPortalApi,
} from '../../../services/mindmap';
import { OpenMRSApi } from '../../../services/openmrs';

// Mock the API services
vi.mock('../../../services/mindmap', () => ({
  MindmapAuthGatewayApi: {
    get: vi.fn(),
  },
  MindmapPortalApi: {
    post: vi.fn(),
  },
}));

vi.mock('../../../services/openmrs', () => ({
  OpenMRSApi: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('profileService', () => {
  const mockMindmapAuthGet = vi.mocked(MindmapAuthGatewayApi.get);
  const mockMindmapPortalPost = vi.mocked(MindmapPortalApi.post);
  const mockOpenMRSGet = vi.mocked(OpenMRSApi.get);
  const mockOpenMRSPost = vi.mocked(OpenMRSApi.post);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API_ENDPOINTS', () => {
    it('should have correct endpoint constants', () => {
      expect(API_ENDPOINTS.GET_PROVIDER).toBe('/auth/provider');
      expect(API_ENDPOINTS.VALIDATE_ATTRIBUTE).toBe(
        '/auth/validateProviderAttribute'
      );
      expect(API_ENDPOINTS.PROVIDER_ATTRIBUTE_TYPE).toBe(
        '/providerattributetype'
      );
      expect(API_ENDPOINTS.PERSON).toBe('/person');
      expect(API_ENDPOINTS.PERSON_IMAGE).toBe('/personimage');
      expect(API_ENDPOINTS.PROVIDER).toBe('/provider');
      expect(API_ENDPOINTS.USER).toBe('/user');
    });
  });

  describe('getProvider', () => {
    it('should call MindmapAuthGatewayApi.get with correct URL', async () => {
      const userId = 'test-user-123';
      const mockProviderData = {
        uuid: 'provider-uuid',
        identifier: 'PROV001',
      };

      mockMindmapAuthGet.mockResolvedValue(mockProviderData);

      const result = await profileService.getProvider(userId);

      expect(mockMindmapAuthGet).toHaveBeenCalledWith(
        '/auth/provider/test-user-123'
      );
      expect(result).toEqual(mockProviderData);
    });

    it('should handle API errors', async () => {
      const userId = 'test-user-123';
      const mockError = new Error('Provider not found');

      mockMindmapAuthGet.mockRejectedValue(mockError);

      await expect(profileService.getProvider(userId)).rejects.toThrow(
        'Provider not found'
      );
    });
  });

  describe('getProviderByUuid', () => {
    it('should call OpenMRSApi.get with correct URL and query params', async () => {
      const providerUuid = 'provider-uuid-123';
      const mockProviderData = {
        uuid: providerUuid,
        identifier: 'PROV001',
        person: { uuid: 'person-uuid' },
        attributes: [],
      };

      mockOpenMRSGet.mockResolvedValue(mockProviderData);

      const result = await profileService.getProviderByUuid(providerUuid);

      expect(mockOpenMRSGet).toHaveBeenCalledWith(
        '/provider/provider-uuid-123?v=full'
      );
      expect(result).toEqual(mockProviderData);
    });

    it('should handle API errors', async () => {
      const providerUuid = 'provider-uuid-123';
      const mockError = new Error('Provider retrieval failed');

      mockOpenMRSGet.mockRejectedValue(mockError);

      await expect(
        profileService.getProviderByUuid(providerUuid)
      ).rejects.toThrow('Provider retrieval failed');
    });
  });

  describe('getPersonByUuid', () => {
    it('should call OpenMRSApi.get with correct URL and query params', async () => {
      const personUuid = 'person-uuid-123';
      const mockPersonData = {
        uuid: personUuid,
        gender: 'M',
        age: 30,
        birthdate: '1994-01-01',
        names: [],
      };

      mockOpenMRSGet.mockResolvedValue(mockPersonData);

      const result = await profileService.getPersonByUuid(personUuid);

      expect(mockOpenMRSGet).toHaveBeenCalledWith(
        '/person/person-uuid-123?v=full'
      );
      expect(result).toEqual(mockPersonData);
    });

    it('should handle API errors', async () => {
      const personUuid = 'person-uuid-123';
      const mockError = new Error('Person not found');

      mockOpenMRSGet.mockRejectedValue(mockError);

      await expect(profileService.getPersonByUuid(personUuid)).rejects.toThrow(
        'Person not found'
      );
    });
  });

  describe('getUserByUuid', () => {
    it('should call OpenMRSApi.get with correct URL and query params', async () => {
      const userUuid = 'user-uuid-123';
      const mockUserData = {
        uuid: userUuid,
        username: 'testuser',
        person: { uuid: 'person-uuid' },
        roles: [],
        privileges: [],
      };

      mockOpenMRSGet.mockResolvedValue(mockUserData);

      const result = await profileService.getUserByUuid(userUuid);

      expect(mockOpenMRSGet).toHaveBeenCalledWith('/user/user-uuid-123?v=full');
      expect(result).toEqual(mockUserData);
    });

    it('should handle API errors', async () => {
      const userUuid = 'user-uuid-123';
      const mockError = new Error('User not found');

      mockOpenMRSGet.mockRejectedValue(mockError);

      await expect(profileService.getUserByUuid(userUuid)).rejects.toThrow(
        'User not found'
      );
    });
  });

  describe('getProviderAttributeTypes', () => {
    it('should call OpenMRSApi.get with correct URL', async () => {
      const mockAttributeTypes = [
        { uuid: 'attr-type-1', name: 'Phone Number' },
        { uuid: 'attr-type-2', name: 'Email Address' },
      ];

      mockOpenMRSGet.mockResolvedValue(mockAttributeTypes);

      const result = await profileService.getProviderAttributeTypes();

      expect(mockOpenMRSGet).toHaveBeenCalledWith('/providerattributetype');
      expect(result).toEqual(mockAttributeTypes);
    });

    it('should handle API errors', async () => {
      const mockError = new Error('Failed to fetch attribute types');

      mockOpenMRSGet.mockRejectedValue(mockError);

      await expect(
        profileService.getProviderAttributeTypes()
      ).rejects.toThrow('Failed to fetch attribute types');
    });
  });

  describe('updatePerson', () => {
    it('should call OpenMRSApi.post with correct URL and data', async () => {
      const personUuid = 'person-uuid-123';
      const updateData = {
        gender: 'M',
        age: 30,
        birthdate: '1994-01-01',
      };
      const mockResponse = { uuid: personUuid, ...updateData };

      mockOpenMRSPost.mockResolvedValue(mockResponse);

      const result = await profileService.updatePerson(personUuid, updateData);

      expect(mockOpenMRSPost).toHaveBeenCalledWith(
        '/person/person-uuid-123',
        updateData
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const personUuid = 'person-uuid-123';
      const updateData = {
        gender: 'M',
        age: 30,
        birthdate: '1994-01-01',
      };
      const mockError = new Error('Person update failed');

      mockOpenMRSPost.mockRejectedValue(mockError);

      await expect(
        profileService.updatePerson(personUuid, updateData)
      ).rejects.toThrow('Person update failed');
    });
  });

  describe('createPersonName', () => {
    it('should call OpenMRSApi.post with correct URL and data including default fields', async () => {
      const personUuid = 'person-uuid-123';
      const nameData = {
        givenName: 'John',
        middleName: 'Michael',
        familyName: 'Doe',
      };
      const mockResponse = {
        uuid: 'name-uuid',
        ...nameData,
        preferred: true,
      };

      mockOpenMRSPost.mockResolvedValue(mockResponse);

      const result = await profileService.createPersonName(
        personUuid,
        nameData
      );

      expect(mockOpenMRSPost).toHaveBeenCalledWith(
        '/person/person-uuid-123/name',
        {
          ...nameData,
          preferred: true,
          prefix: null,
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const personUuid = 'person-uuid-123';
      const nameData = {
        givenName: 'John',
        middleName: 'Michael',
        familyName: 'Doe',
      };
      const mockError = new Error('Name creation failed');

      mockOpenMRSPost.mockRejectedValue(mockError);

      await expect(
        profileService.createPersonName(personUuid, nameData)
      ).rejects.toThrow('Name creation failed');
    });
  });

  describe('updatePersonName', () => {
    it('should call OpenMRSApi.post with correct URL and data including default fields', async () => {
      const personUuid = 'person-uuid-123';
      const nameUuid = 'name-uuid-456';
      const nameData = {
        givenName: 'Jane',
        middleName: 'Marie',
        familyName: 'Smith',
      };
      const mockResponse = {
        uuid: nameUuid,
        ...nameData,
        preferred: true,
      };

      mockOpenMRSPost.mockResolvedValue(mockResponse);

      const result = await profileService.updatePersonName(
        personUuid,
        nameUuid,
        nameData
      );

      expect(mockOpenMRSPost).toHaveBeenCalledWith(
        '/person/person-uuid-123/name/name-uuid-456',
        {
          ...nameData,
          preferred: true,
          prefix: null,
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const personUuid = 'person-uuid-123';
      const nameUuid = 'name-uuid-456';
      const nameData = {
        givenName: 'Jane',
        middleName: 'Marie',
        familyName: 'Smith',
      };
      const mockError = new Error('Name update failed');

      mockOpenMRSPost.mockRejectedValue(mockError);

      await expect(
        profileService.updatePersonName(personUuid, nameUuid, nameData)
      ).rejects.toThrow('Name update failed');
    });
  });

  describe('addOrUpdateProviderAttribute', () => {
    it('should return null immediately when value is empty', async () => {
      const providerUuid = 'provider-uuid-123';
      const attrUuid = 'attr-uuid-456';
      const attributeTypeUuid = 'attr-type-uuid';
      const value = '';

      const result = await profileService.addOrUpdateProviderAttribute(
        providerUuid,
        attrUuid,
        attributeTypeUuid,
        value
      );

      expect(mockOpenMRSPost).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null immediately when value is null', async () => {
      const providerUuid = 'provider-uuid-123';
      const attrUuid = 'attr-uuid-456';
      const attributeTypeUuid = 'attr-type-uuid';
      const value = null as any;

      const result = await profileService.addOrUpdateProviderAttribute(
        providerUuid,
        attrUuid,
        attributeTypeUuid,
        value
      );

      expect(mockOpenMRSPost).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null immediately when value is undefined', async () => {
      const providerUuid = 'provider-uuid-123';
      const attrUuid = 'attr-uuid-456';
      const attributeTypeUuid = 'attr-type-uuid';
      const value = undefined as any;

      const result = await profileService.addOrUpdateProviderAttribute(
        providerUuid,
        attrUuid,
        attributeTypeUuid,
        value
      );

      expect(mockOpenMRSPost).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should update existing attribute when attrUuid is provided', async () => {
      const providerUuid = 'provider-uuid-123';
      const attrUuid = 'attr-uuid-456';
      const attributeTypeUuid = 'attr-type-uuid';
      const value = '1234567890';
      const mockResponse = { uuid: attrUuid, value };

      mockOpenMRSPost.mockResolvedValue(mockResponse);

      const result = await profileService.addOrUpdateProviderAttribute(
        providerUuid,
        attrUuid,
        attributeTypeUuid,
        value
      );

      expect(mockOpenMRSPost).toHaveBeenCalledWith(
        '/provider/provider-uuid-123/attribute/attr-uuid-456',
        { value }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create new attribute when attrUuid is null', async () => {
      const providerUuid = 'provider-uuid-123';
      const attrUuid = null;
      const attributeTypeUuid = 'attr-type-uuid';
      const value = 'new-value@example.com';
      const mockResponse = {
        uuid: 'new-attr-uuid',
        attributeType: attributeTypeUuid,
        value,
      };

      mockOpenMRSPost.mockResolvedValue(mockResponse);

      const result = await profileService.addOrUpdateProviderAttribute(
        providerUuid,
        attrUuid,
        attributeTypeUuid,
        value
      );

      expect(mockOpenMRSPost).toHaveBeenCalledWith(
        '/provider/provider-uuid-123/attribute',
        {
          attributeType: attributeTypeUuid,
          value,
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create new attribute when attrUuid is empty string', async () => {
      const providerUuid = 'provider-uuid-123';
      const attrUuid = '';
      const attributeTypeUuid = 'attr-type-uuid';
      const value = 'new-value';
      const mockResponse = {
        uuid: 'new-attr-uuid',
        attributeType: attributeTypeUuid,
        value,
      };

      mockOpenMRSPost.mockResolvedValue(mockResponse);

      const result = await profileService.addOrUpdateProviderAttribute(
        providerUuid,
        attrUuid,
        attributeTypeUuid,
        value
      );

      expect(mockOpenMRSPost).toHaveBeenCalledWith(
        '/provider/provider-uuid-123/attribute',
        {
          attributeType: attributeTypeUuid,
          value,
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors when updating attribute', async () => {
      const providerUuid = 'provider-uuid-123';
      const attrUuid = 'attr-uuid-456';
      const attributeTypeUuid = 'attr-type-uuid';
      const value = '1234567890';
      const mockError = new Error('Attribute update failed');

      mockOpenMRSPost.mockRejectedValue(mockError);

      await expect(
        profileService.addOrUpdateProviderAttribute(
          providerUuid,
          attrUuid,
          attributeTypeUuid,
          value
        )
      ).rejects.toThrow('Attribute update failed');
    });

    it('should handle API errors when creating attribute', async () => {
      const providerUuid = 'provider-uuid-123';
      const attrUuid = null;
      const attributeTypeUuid = 'attr-type-uuid';
      const value = 'new-value';
      const mockError = new Error('Attribute creation failed');

      mockOpenMRSPost.mockRejectedValue(mockError);

      await expect(
        profileService.addOrUpdateProviderAttribute(
          providerUuid,
          attrUuid,
          attributeTypeUuid,
          value
        )
      ).rejects.toThrow('Attribute creation failed');
    });
  });

  describe('getProfileImage', () => {
    it('should call OpenMRSApi.get with correct URL and responseType blob', async () => {
      const personUuid = 'person-uuid-123';
      const mockBlob = new Blob(['image data'], { type: 'image/jpeg' });

      mockOpenMRSGet.mockResolvedValue(mockBlob);

      const result = await profileService.getProfileImage(personUuid);

      expect(mockOpenMRSGet).toHaveBeenCalledWith(
        '/personimage/person-uuid-123',
        {
          responseType: 'blob',
        }
      );
      expect(result).toEqual(mockBlob);
    });

    it('should handle API errors', async () => {
      const personUuid = 'person-uuid-123';
      const mockError = new Error('Image retrieval failed');

      mockOpenMRSGet.mockRejectedValue(mockError);

      await expect(
        profileService.getProfileImage(personUuid)
      ).rejects.toThrow('Image retrieval failed');
    });
  });

  describe('updateProfileImage', () => {
    it('should call OpenMRSApi.post with correct URL and data', async () => {
      const imageData = {
        person: 'person-uuid-123',
        base64EncodedImage: 'base64imagestring',
      };
      const mockResponse = { uuid: 'image-uuid', ...imageData };

      mockOpenMRSPost.mockResolvedValue(mockResponse);

      const result = await profileService.updateProfileImage(imageData);

      expect(mockOpenMRSPost).toHaveBeenCalledWith('/personimage', imageData);
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const imageData = {
        person: 'person-uuid-123',
        base64EncodedImage: 'base64imagestring',
      };
      const mockError = new Error('Image upload failed');

      mockOpenMRSPost.mockRejectedValue(mockError);

      await expect(
        profileService.updateProfileImage(imageData)
      ).rejects.toThrow('Image upload failed');
    });
  });

  describe('validateProviderAttribute', () => {
    it('should call MindmapPortalApi.post with correct URL and data', async () => {
      const validationData = {
        attributeType: 'phone',
        attributeValue: '1234567890',
        providerUuid: 'provider-uuid-123',
      };
      const mockResponse = { valid: true };

      mockMindmapPortalPost.mockResolvedValue(mockResponse);

      const result =
        await profileService.validateProviderAttribute(validationData);

      expect(mockMindmapPortalPost).toHaveBeenCalledWith(
        '/auth/validateProviderAttribute',
        validationData
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const validationData = {
        attributeType: 'email',
        attributeValue: 'test@example.com',
        providerUuid: 'provider-uuid-123',
      };
      const mockError = new Error('Validation failed');

      mockMindmapPortalPost.mockRejectedValue(mockError);

      await expect(
        profileService.validateProviderAttribute(validationData)
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('requestDataFromMultipleSources', () => {
    it('should execute all promises in parallel and return results', async () => {
      const mockData1 = { id: 1, name: 'Data 1' };
      const mockData2 = { id: 2, name: 'Data 2' };
      const mockData3 = { id: 3, name: 'Data 3' };

      const promise1 = Promise.resolve(mockData1);
      const promise2 = Promise.resolve(mockData2);
      const promise3 = Promise.resolve(mockData3);

      const result = await profileService.requestDataFromMultipleSources([
        promise1,
        promise2,
        promise3,
      ]);

      expect(result).toEqual([mockData1, mockData2, mockData3]);
    });

    it('should handle empty array of promises', async () => {
      const result =
        await profileService.requestDataFromMultipleSources<any>([]);

      expect(result).toEqual([]);
    });

    it('should handle single promise', async () => {
      const mockData = { id: 1, name: 'Single Data' };
      const promise = Promise.resolve(mockData);

      const result = await profileService.requestDataFromMultipleSources([
        promise,
      ]);

      expect(result).toEqual([mockData]);
    });

    it('should reject if any promise fails', async () => {
      const mockData1 = { id: 1, name: 'Data 1' };
      const mockError = new Error('Request failed');

      const promise1 = Promise.resolve(mockData1);
      const promise2 = Promise.reject(mockError);
      const promise3 = Promise.resolve({ id: 3, name: 'Data 3' });

      await expect(
        profileService.requestDataFromMultipleSources([
          promise1,
          promise2,
          promise3,
        ])
      ).rejects.toThrow('Request failed');
    });

    it('should handle promises with different types', async () => {
      const stringPromise = Promise.resolve('string data');
      const numberPromise = Promise.resolve(42);
      const objectPromise = Promise.resolve({ key: 'value' });

      const result = await profileService.requestDataFromMultipleSources<any>([
        stringPromise,
        numberPromise,
        objectPromise,
      ]);

      expect(result).toEqual(['string data', 42, { key: 'value' }]);
    });
  });
});
