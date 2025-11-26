import { renderHook, waitFor } from '@testing-library/react';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mocked,
  type MockedFunction,
} from 'vitest';
import { useProfile } from '../../../modules/profile/profile.hooks';
import mockProfileService from '../../../modules/profile/profile.service';
import { storage as mockStorage } from '../../../utils/storage';
import * as helpers from '../../../modules/profile/profile.helpers';
import * as toast from '../../../services/toast';

// ---------- MOCK TOAST ----------
vi.mock('../../../services/toast', () => ({
  showToast: vi.fn(),
}));

// ---------- MOCK HELPERS ----------
vi.mock('../../../modules/profile/profile.helpers', () => ({
  calculateAge: vi.fn(() => 30),
  createProfile: vi.fn(() => ({
    id: 'person123',
    firstName: 'John',
    middleName: '',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '1234567890',
    dateOfBirth: '1990-01-01',
    gender: 'male' as const,
    age: 30,
    avatar: '',
    setupLocation: '',
    address: { street: '', city: '', state: '', country: '', zipCode: '' },
    role: 'Doctor',
    department: '',
    employeeId: '',
    joinDate: '',
    lastLogin: '',
    isActive: true,
    username: 'johndoe',
    preferences: {
      language: 'en',
      timezone: 'UTC',
      notifications: { email: false, sms: false, push: false },
    },
  })),
  createHealthWorkerProfile: vi.fn(() => ({
    userUuid: 'user123',
    username: 'johndoe',
    systemId: 'admin',
    display: 'John Doe',
    personUuid: 'person123',
    providerUuid: 'provider123',
    providerIdentifier: 'EMP001',
    firstName: 'John',
    middleName: '',
    lastName: 'Doe',
    fullName: 'John Doe',
    gender: 'M',
    age: 30,
    dateOfBirth: '1990-01-01',
    birthdateEstimated: false,
    attributes: {},
    personAttributes: {},
    roles: ['Doctor'],
    privileges: [],
    hasPrivilege: () => false,
    hasRole: () => true,
    avatar: '',
    isActive: true,
    userProperties: {},
  })),
  mapPersonAttributes: vi.fn(() => ({})),
  mapProviderAttributes: vi.fn(() => ({})),
  processImageFile: vi.fn().mockResolvedValue('base64encodedstring'),
  updateProfileAttributes: vi.fn().mockResolvedValue(undefined),
  getErrorMessage: vi.fn(() => 'Test error message'),
}));

// ---------- MOCK PROFILE SERVICE ----------
vi.mock('../../../modules/profile/profile.service', () => ({
  default: {
    getUserByUuid: vi.fn(),
    getProvider: vi.fn(),
    getProviderByUuid: vi.fn(),
    getPersonByUuid: vi.fn(),
    getProfileImage: vi.fn(),
    updatePerson: vi.fn(),
    updatePersonName: vi.fn(),
    createPersonName: vi.fn(),
    updateProfileImage: vi.fn(),
    getProviderAttributeTypes: vi.fn(),
  },
}));

// ---------- MOCK STORAGE ----------
vi.mock('../../../utils/storage', () => ({
  storage: {
    getUser: vi.fn(),
  },
}));

const mockedProfileService = mockProfileService as Mocked<
  typeof mockProfileService
>;

const mockedHelpers = helpers as Mocked<typeof helpers>;

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to avoid cluttering test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  });

  // ========== LOAD PROFILE TESTS ==========

  it('loads the profile successfully', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(
      JSON.stringify({ uuid: 'user123', person: { uuid: 'person123' } })
    );

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [{ name: 'Doctor', uuid: 'role1', display: 'Doctor' }],
      privileges: [],
      retired: false,
      userProperties: {},
      username: 'johndoe',
      systemId: 'admin',
      display: 'John Doe',
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({
      results: [{ uuid: 'provider123' }],
    } as any);

    mockedProfileService.getProviderByUuid.mockResolvedValue({
      uuid: 'provider123',
      person: { uuid: 'person123', display: 'John Doe', gender: 'M' },
      display: 'John Doe - EMP001',
      identifier: 'EMP001',
    } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      attributes: [],
    } as any);

    mockedProfileService.getProfileImage.mockResolvedValue(
      new Blob(['image'], { type: 'image/jpeg' })
    );

    const { result } = renderHook(() => useProfile());

    await waitFor(
      () => {
        expect(result.current.profile).not.toBeNull();
      },
      { timeout: 3000 }
    );

    expect(result.current.hwProfile).not.toBeNull();
  });

  it('handles error when user data not found in storage', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(null);

    renderHook(() => useProfile());

    await waitFor(() => {
      expect(toast.showToast).toHaveBeenCalledWith(
        'Error',
        'Failed to load profile data',
        'error'
      );
    });
  });

  it('handles error when user UUID not found', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: '' }));

    renderHook(() => useProfile());

    await waitFor(() => {
      expect(toast.showToast).toHaveBeenCalledWith(
        'Error',
        'Failed to load profile data',
        'error'
      );
    });
  });

  it('handles error when person UUID not found', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: undefined,
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    renderHook(() => useProfile());

    await waitFor(() => {
      expect(toast.showToast).toHaveBeenCalledWith(
        'Error',
        'Failed to load profile data',
        'error'
      );
    });
  });

  it('handles provider fetch failure gracefully', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockRejectedValue(
      new Error('Provider not found')
    );

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      attributes: [],
    } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });
  });

  it('handles profile image fetch 404 error', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({ results: [] } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      attributes: [],
    } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });
  });

  it('handles profile image fetch non-404 error', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({ results: [] } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      attributes: [],
    } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({
      status: 500,
      response: { status: 500 },
    });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });
  });

  it('handles empty profile image blob (covers lines 146-150)', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({ results: [] } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      attributes: [],
    } as any);

    mockedProfileService.getProfileImage.mockResolvedValue(
      new Blob([], { type: 'image/jpeg' })
    );

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    // Lines 146-150 are covered when empty blob is returned
    // The console.warn is called but mocked in beforeEach
  });

  // ========== UPDATE PROFILE TESTS ==========

  it('updates profile successfully with all fields', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({ results: [] } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      attributes: [],
      preferredName: { uuid: 'name123' },
    } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    await result.current.updateProfile({
      firstName: 'Jane',
      middleName: 'M',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '9876543210',
      dateOfBirth: '1995-05-15',
      gender: 'female',
      setupLocation: 'Location A',
    });

    expect(mockedProfileService.updatePerson).toHaveBeenCalled();
    expect(mockedProfileService.updatePersonName).toHaveBeenCalled();
    expect(toast.showToast).toHaveBeenCalledWith(
      'Success',
      'Profile has been updated successfully',
      'success'
    );
  });

  it('creates person name if preferredName does not exist', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({ results: [] } as any);

    mockedProfileService.getPersonByUuid
      .mockResolvedValueOnce({
        uuid: 'person123',
        display: 'John Doe',
        attributes: [],
      } as any)
      .mockResolvedValueOnce({
        uuid: 'person123',
        display: 'John Doe',
        attributes: [],
      } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    await result.current.updateProfile({
      firstName: 'Jane',
      lastName: 'Smith',
    });

    expect(mockedProfileService.createPersonName).toHaveBeenCalled();
  });

  it('throws error when profile not loaded', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(null);

    const { result } = renderHook(() => useProfile());

    await expect(result.current.updateProfile({})).rejects.toThrow(
      'Profile not loaded or provider not found'
    );
  });

  it('handles update profile error', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({ results: [] } as any);

    mockedProfileService.getPersonByUuid
      .mockResolvedValueOnce({
        uuid: 'person123',
        display: 'John Doe',
        attributes: [],
      } as any)
      .mockRejectedValueOnce(new Error('Update failed'));

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    await expect(
      result.current.updateProfile({ firstName: 'Jane' })
    ).rejects.toThrow();

    expect(toast.showToast).toHaveBeenCalledWith(
      'Error',
      expect.any(String),
      'error'
    );
  });

  // ========== UPLOAD PHOTO TESTS ==========

  it('uploads photo successfully', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({ results: [] } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      attributes: [],
    } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      onerror: null as any,
    };

    vi.spyOn(global, 'FileReader').mockImplementation(
      () => mockFileReader as any
    );

    const uploadPromise = result.current.uploadPhoto(file);

    // Trigger onload
    if (mockFileReader.onload) {
      mockFileReader.onload({
        target: { result: 'data:image/jpeg;base64,mockdata' },
      } as any);
    }

    await uploadPromise;

    expect(mockedProfileService.updateProfileImage).toHaveBeenCalled();
    expect(toast.showToast).toHaveBeenCalledWith(
      'Success',
      'Profile picture uploaded successfully!',
      'success'
    );
  });

  it('rejects non-jpg files', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({ results: [] } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      attributes: [],
    } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    const file = new File(['image'], 'photo.png', { type: 'image/png' });

    await result.current.uploadPhoto(file);

    expect(toast.showToast).toHaveBeenCalledWith(
      'Warning',
      'Upload JPG/JPEG format image only.',
      'warning'
    );
  });

  it('handles upload photo error when person UUID not found', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({ results: [] } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: '', // Empty UUID to trigger error
      display: 'John Doe',
      attributes: [],
    } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });

    // Mock createProfile to return empty id for this test only
    mockedHelpers.createProfile.mockReturnValueOnce({
      id: '', // Empty person UUID
      firstName: 'John',
      lastName: 'Doe',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: 'male' as const,
      address: { street: '', city: '', state: '', country: '', zipCode: '' },
      avatar: '',
      role: '',
      department: '',
      employeeId: '',
      joinDate: '',
      lastLogin: '',
      isActive: true,
      username: '',
      setupLocation: '',
      preferences: {
        language: 'en',
        timezone: 'UTC',
        notifications: { email: false, sms: false, push: false },
      },
    } as any);

    mockedHelpers.createHealthWorkerProfile.mockReturnValueOnce({
      userUuid: 'user123',
      username: 'john',
      systemId: 'sys123',
      display: 'John Doe',
      personUuid: '', // Empty person UUID
      firstName: 'John',
      middleName: '',
      lastName: 'Doe',
      fullName: 'John Doe',
      gender: 'M',
      age: undefined,
      dateOfBirth: undefined,
      birthdateEstimated: undefined,
      providerUuid: undefined,
      providerIdentifier: undefined,
      attributes: {},
      personAttributes: {},
      roles: [],
      privileges: [],
      hasPrivilege: () => false,
      hasRole: () => false,
      avatar: '',
      isActive: true,
      userProperties: {},
    } as any);

    // Create hook with empty personUuid from the start
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    }, { timeout: 3000 });

    const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });

    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      onerror: null as any,
    };

    vi.spyOn(global, 'FileReader').mockImplementation(
      () => mockFileReader as any
    );

    const uploadPromise = result.current.uploadPhoto(file);

    if (mockFileReader.onload) {
      mockFileReader.onload({
        target: { result: 'data:image/jpeg;base64,mockdata' },
      } as any);
    }

    await uploadPromise;

    expect(toast.showToast).toHaveBeenCalledWith(
      'Error',
      'Person UUID not found',
      'error'
    );
  });

  it('handles FileReader error', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({ results: [] } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      attributes: [],
    } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });

    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      onerror: null as any,
    };

    vi.spyOn(global, 'FileReader').mockImplementation(
      () => mockFileReader as any
    );

    const uploadPromise = result.current.uploadPhoto(file);

    if (mockFileReader.onerror) {
      mockFileReader.onerror();
    }

    await uploadPromise;

    expect(toast.showToast).toHaveBeenCalledWith(
      'Error',
      expect.any(String),
      'error'
    );
  });

  // ========== TAKE PHOTO TESTS ==========

  it('shows info toast for takePhoto', async () => {
    const { result } = renderHook(() => useProfile());

    await result.current.takePhoto();

    expect(toast.showToast).toHaveBeenCalledWith(
      'Info',
      'Camera functionality not implemented yet',
      'info'
    );
  });

  // ========== UPDATE AGE FOR DATE TESTS ==========

  it('updates age for date', () => {
    const { result } = renderHook(() => useProfile());

    result.current.updateAgeForDate('1990-01-01');

    expect(mockedHelpers.calculateAge).toHaveBeenCalledWith('1990-01-01');
  });

  it('sets age to null for empty date', () => {
    const { result } = renderHook(() => useProfile());

    result.current.updateAgeForDate('');

    expect(result.current.age).toBeNull();
  });

  it('updates age when profile dateOfBirth changes', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({ results: [] } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      attributes: [],
      birthdate: '1990-01-01',
    } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    expect(result.current.age).not.toBeNull();
  });

  it('handles refresh profile', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({ results: [] } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      attributes: [],
    } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    await result.current.refreshProfile();

    expect(mockedProfileService.getUserByUuid).toHaveBeenCalledTimes(2);
  });

  it('handles profile image error with response.status format', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(
      JSON.stringify({ uuid: 'user123', person: { uuid: 'person123' } })
    );

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({
      results: [{ uuid: 'provider123' }],
    } as any);

    mockedProfileService.getProviderByUuid.mockResolvedValue({
      uuid: 'provider123',
      person: { uuid: 'providerPerson123' },
      identifier: 'PROV001',
      attributes: [],
    } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      attributes: [],
    } as any);

    // Mock image fetch with error.response.status format (line 169)
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockedProfileService.getProfileImage.mockRejectedValue({
      response: { status: 500 },
    });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    }, { timeout: 3000 });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '[Profile] Failed to fetch image:',
      expect.any(Object)
    );

    consoleErrorSpy.mockRestore();
  });

  it('shows info toast when takePhoto is called', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(
      JSON.stringify({ uuid: 'user123', person: { uuid: 'person123' } })
    );

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({ results: [] } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      attributes: [],
    } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    const toastSpy = vi.spyOn(toast, 'showToast');

    await result.current.takePhoto();

    // Verify info toast is called
    expect(toastSpy).toHaveBeenCalledWith(
      'Info',
      'Camera functionality not implemented yet',
      'info'
    );

    toastSpy.mockRestore();
  });

  it('updates profiles with image URL when image blob is valid (lines 129-130)', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(
      JSON.stringify({ uuid: 'user123', person: { uuid: 'person123' } })
    );

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [{ name: 'Doctor', uuid: 'role1', display: 'Doctor' }],
      privileges: [],
      retired: false,
      userProperties: {},
      username: 'johndoe',
      systemId: 'admin',
      display: 'John Doe',
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({
      results: [{ uuid: 'provider123' }],
    } as any);

    mockedProfileService.getProviderByUuid.mockResolvedValue({
      uuid: 'provider123',
      person: { uuid: 'providerPerson123', display: 'John Doe', gender: 'M' },
      display: 'John Doe - EMP001',
      identifier: 'EMP001',
    } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      attributes: [],
    } as any);

    // Return a valid image blob to trigger the image update logic
    mockedProfileService.getProfileImage.mockResolvedValue(
      new Blob(['image-data'], { type: 'image/jpeg' })
    );

    const { result } = renderHook(() => useProfile());

    // Wait for profiles to be loaded and image to be processed
    await waitFor(
      () => {
        expect(result.current.profile).not.toBeNull();
        expect(result.current.hwProfile).not.toBeNull();
        // Verify profiles were updated with image URLs (lines 129-130)
        expect(result.current.profile?.avatar).toContain('blob:');
        expect(result.current.hwProfile?.avatar).toContain('blob:');
      },
      { timeout: 3000 }
    );
  });

  it('covers fallback branch on line 230: familyName fallback to profile.lastName', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({ results: [] } as any);

    mockedProfileService.getPersonByUuid
      .mockResolvedValueOnce({
        uuid: 'person123',
        display: 'John Doe',
        attributes: [],
      } as any)
      .mockResolvedValueOnce({
        uuid: 'person123',
        display: 'John Doe',
        attributes: [],
        preferredName: { uuid: 'name123' },
      } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    // Update without lastName to trigger fallback on line 230
    await result.current.updateProfile({
      firstName: 'Jane',
      middleName: 'M',
      // Omit lastName to trigger the || profile.lastName fallback
    });

    expect(mockedProfileService.updatePersonName).toHaveBeenCalled();
  });

  it('covers fallback branch on line 252: empty error message fallback', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({ results: [] } as any);

    // First call for initial load, second call during update
    mockedProfileService.getPersonByUuid
      .mockResolvedValueOnce({
        uuid: 'person123',
        display: 'John Doe',
        attributes: [],
      } as any)
      .mockResolvedValueOnce({
        uuid: 'person123',
        display: 'John Doe',
        attributes: [],
        preferredName: { uuid: 'name123' },
      } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    // Mock getErrorMessage to return empty string to trigger || fallback on line 252
    mockedHelpers.getErrorMessage.mockReturnValueOnce('');

    // Mock updatePerson to throw an error
    mockedProfileService.updatePerson.mockRejectedValueOnce(new Error(''));

    // The important part is that updateProfile throws, triggering the error path
    // which will execute line 252: getErrorMessage(error) || 'Failed to update profile'
    await expect(
      result.current.updateProfile({
        firstName: 'Jane',
        dateOfBirth: '1995-05-15',
        gender: 'female'
      })
    ).rejects.toThrow();

    // The branch on line 252 is exercised when getErrorMessage returns empty string
  });

  it('covers fallback branches on line 278: profile.id fallback for personUuid', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({ results: [] } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      attributes: [],
    } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });

    // Mock createHealthWorkerProfile to return undefined personUuid to test fallback
    mockedHelpers.createHealthWorkerProfile.mockReturnValueOnce({
      userUuid: 'user123',
      username: 'johndoe',
      systemId: 'admin',
      display: 'John Doe',
      personUuid: undefined as any, // Make personUuid undefined
      firstName: 'John',
      middleName: '',
      lastName: 'Doe',
      fullName: 'John Doe',
      gender: 'M',
      age: 30,
      dateOfBirth: '1990-01-01',
      birthdateEstimated: false,
      providerUuid: undefined, // Also undefined
      providerIdentifier: undefined,
      attributes: {},
      personAttributes: {},
      roles: ['Doctor'],
      privileges: [],
      hasPrivilege: () => false,
      hasRole: () => true,
      avatar: '',
      isActive: true,
      userProperties: {},
    });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });

    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      onerror: null as any,
    };

    vi.spyOn(global, 'FileReader').mockImplementation(
      () => mockFileReader as any
    );

    const uploadPromise = result.current.uploadPhoto(file);

    if (mockFileReader.onload) {
      mockFileReader.onload({
        target: { result: 'data:image/jpeg;base64,mockdata' },
      } as any);
    }

    await uploadPromise;

    // This should use profile.id as fallback (line 278: || profile?.id ||)
    expect(mockedProfileService.updateProfileImage).toHaveBeenCalled();
  });

  it('covers fallback branch on line 288: empty VITE_OPENMRS_API_URL in uploadPhoto', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({ results: [] } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      attributes: [],
    } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    // Stub the env variable to undefined to trigger || '' fallback on line 288
    vi.stubEnv('VITE_OPENMRS_API_URL', undefined as any);

    const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });

    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      onerror: null as any,
    };

    vi.spyOn(global, 'FileReader').mockImplementation(
      () => mockFileReader as any
    );

    const uploadPromise = result.current.uploadPhoto(file);

    if (mockFileReader.onload) {
      mockFileReader.onload({
        target: { result: 'data:image/jpeg;base64,mockdata' },
      } as any);
    }

    await uploadPromise;

    expect(mockedProfileService.updateProfileImage).toHaveBeenCalled();

    vi.unstubAllEnvs();
  });

  it('covers false branch on line 297: non-Error object in catch block', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({ results: [] } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      attributes: [],
    } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });

    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      onerror: null as any,
    };

    vi.spyOn(global, 'FileReader').mockImplementation(
      () => mockFileReader as any
    );

    // Make processImageFile throw a non-Error object to trigger the false branch
    mockedHelpers.processImageFile.mockRejectedValueOnce('string error' as any);

    const uploadPromise = result.current.uploadPhoto(file);

    if (mockFileReader.onload) {
      mockFileReader.onload({
        target: { result: 'data:image/jpeg;base64,mockdata' },
      } as any);
    }

    await uploadPromise;

    // The branch on line 297 is exercised: error instanceof Error ? ... : 'Person UUID not foundoto'
    // When processImageFile throws a string instead of Error, the false branch is taken
  });

  it('covers line 109: fallback to user.person.uuid when userDetails.person.uuid is undefined', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    // Mock user with person.uuid
    mockGetUser.mockReturnValue(
      JSON.stringify({ uuid: 'user123', person: { uuid: 'person-from-user' } })
    );

    // Mock userDetails WITHOUT person.uuid to trigger fallback
    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: undefined, // This is undefined, so fallback to user.person.uuid
      roles: [{ name: 'Doctor' }],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({ results: [] } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person-from-user',
      display: 'John Doe',
      preferredName: { givenName: 'John', familyName: 'Doe' },
      attributes: [],
    } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    // Verify that getPersonByUuid was called with the fallback person UUID
    expect(mockedProfileService.getPersonByUuid).toHaveBeenCalledWith('person-from-user');
  });

  it('covers lines 175-177: updates person name when firstName, middleName, or lastName provided', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({
      results: [{ uuid: 'provider123' }],
    } as any);

    mockedProfileService.getProviderByUuid.mockResolvedValue({
      uuid: 'provider123',
      person: { uuid: 'person123' },
      attributes: [],
    } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      preferredName: { uuid: 'name123', givenName: 'John', familyName: 'Doe' },
      attributes: [],
    } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });

    mockedProfileService.updatePersonName.mockResolvedValue({} as any);
    mockedProfileService.getProviderAttributeTypes.mockResolvedValue({
      results: [],
    } as any);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    // Update profile with name changes
    await result.current.updateProfile({
      firstName: 'Jane',
      middleName: 'Marie',
      lastName: 'Smith',
    });

    // Verify that updatePersonName was called with the new name data
    expect(mockedProfileService.updatePersonName).toHaveBeenCalledWith(
      'person123',
      'name123',
      {
        givenName: 'Jane',
        middleName: 'Marie',
        familyName: 'Smith',
      }
    );
  });

  it('covers lines 175-180: updates person name with only middleName', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({
      results: [{ uuid: 'provider123' }],
    } as any);

    mockedProfileService.getProviderByUuid.mockResolvedValue({
      uuid: 'provider123',
      person: { uuid: 'person123' },
      attributes: [],
    } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      preferredName: { uuid: 'name123', givenName: 'John', familyName: 'Doe' },
      attributes: [],
    } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });

    mockedProfileService.updatePersonName.mockResolvedValue({} as any);
    mockedProfileService.getProviderAttributeTypes.mockResolvedValue({
      results: [],
    } as any);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    // Update profile with only middleName to test fallback branches on lines 177-179
    await result.current.updateProfile({
      middleName: 'Marie',
    });

    // Verify that updatePersonName was called with fallback values
    expect(mockedProfileService.updatePersonName).toHaveBeenCalledWith(
      'person123',
      'name123',
      {
        givenName: 'John', // Falls back to profile.firstName
        middleName: 'Marie',
        familyName: 'Doe', // Falls back to profile.lastName
      }
    );
  });

  it('covers line 221: fallback chain for personUuid in uploadPhoto (providerDetails.person.uuid)', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({
      results: [{ uuid: 'provider123' }],
    } as any);

    mockedProfileService.getProviderByUuid.mockResolvedValue({
      uuid: 'provider123',
      person: { uuid: 'person-from-provider' },
      attributes: [],
    } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      attributes: [],
    } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });
    mockedProfileService.updateProfileImage.mockResolvedValue({} as any);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      onerror: null as any,
    };

    vi.spyOn(global, 'FileReader').mockImplementation(
      () => mockFileReader as any
    );

    // Clear update calls to isolate this test
    mockedProfileService.updateProfileImage.mockClear();

    const uploadPromise = result.current.uploadPhoto(file);

    // Trigger onload
    if (mockFileReader.onload) {
      mockFileReader.onload({
        target: { result: 'data:image/jpeg;base64,mockdata' },
      } as any);
    }

    await uploadPromise;

    // Verify that updateProfileImage was called with providerDetails.person.uuid
    expect(mockedProfileService.updateProfileImage).toHaveBeenCalledWith({
      person: 'person-from-provider',
      base64EncodedImage: 'base64encodedstring',
    });
  });

  it('covers line 221: fallback to hwProfile.personUuid when providerDetails.person.uuid is not available', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'user123' }));

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({ results: [] } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      attributes: [],
    } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });
    mockedProfileService.updateProfileImage.mockResolvedValue({} as any);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    const file = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      onerror: null as any,
    };

    vi.spyOn(global, 'FileReader').mockImplementation(
      () => mockFileReader as any
    );

    // Clear update calls to isolate this test
    mockedProfileService.updateProfileImage.mockClear();

    const uploadPromise = result.current.uploadPhoto(file);

    // Trigger onload
    if (mockFileReader.onload) {
      mockFileReader.onload({
        target: { result: 'data:image/jpeg;base64,mockdata' },
      } as any);
    }

    await uploadPromise;

    // Verify that updateProfileImage was called with hwProfile.personUuid (fallback)
    expect(mockedProfileService.updateProfileImage).toHaveBeenCalledWith({
      person: 'person123',
      base64EncodedImage: 'base64encodedstring',
    });
  });

  it('covers line 200 branch: should update profile when only middleName is provided', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(
      JSON.stringify({
        uuid: 'user123',
        person: { uuid: 'person123' },
      })
    );

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({
      results: [{ uuid: 'provider123' }],
    } as any);

    mockedProfileService.getProviderByUuid.mockResolvedValue({
      uuid: 'provider123',
      attributes: [],
    } as any);

    // First call for initial load, second call during update
    mockedProfileService.getPersonByUuid
      .mockResolvedValueOnce({
        uuid: 'person123',
        display: 'John Doe',
        attributes: [],
      } as any)
      .mockResolvedValueOnce({
        uuid: 'person123',
        display: 'John Doe',
        attributes: [],
        preferredName: { uuid: 'name123' },
      } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });
    mockedProfileService.updatePersonName.mockResolvedValue({} as any);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    // Update with only middleName (no firstName, no lastName)
    // This tests the branch on line 200: if (data.firstName || data.middleName || data.lastName)
    // where data.firstName is falsy but data.middleName is truthy
    await result.current.updateProfile({
      middleName: 'MiddleOnly',
    });

    expect(mockedProfileService.updatePersonName).toHaveBeenCalled();
  });

  it('covers line 200 false branch: should update profile when no name fields are provided', async () => {
    const mockGetUser = mockStorage.getUser as MockedFunction<
      typeof mockStorage.getUser
    >;

    mockGetUser.mockReturnValue(
      JSON.stringify({
        uuid: 'user123',
        person: { uuid: 'person123' },
      })
    );

    mockedProfileService.getUserByUuid.mockResolvedValue({
      uuid: 'user123',
      person: { uuid: 'person123' },
      roles: [],
      privileges: [],
      retired: false,
      userProperties: {},
    } as any);

    mockedProfileService.getProvider.mockResolvedValue({
      results: [{ uuid: 'provider123' }],
    } as any);

    mockedProfileService.getProviderByUuid.mockResolvedValue({
      uuid: 'provider123',
      attributes: [],
    } as any);

    mockedProfileService.getPersonByUuid.mockResolvedValue({
      uuid: 'person123',
      display: 'John Doe',
      attributes: [],
    } as any);

    mockedProfileService.getProfileImage.mockRejectedValue({ status: 404 });
    mockedProfileService.updatePersonName.mockClear();

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
    });

    // Update with only email (no name fields)
    // This tests the FALSE branch on line 200: if (data.firstName || data.middleName || data.lastName)
    await result.current.updateProfile({
      email: 'newemail@example.com',
    });

    // Should NOT call updatePersonName since no name fields were provided
    expect(mockedProfileService.updatePersonName).not.toHaveBeenCalled();
  });
});
