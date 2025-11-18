import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProfile } from '../../../modules/profile/profile.hooks';

// Hoisted mocks to avoid Vitest hoisting issues
const h = vi.hoisted(() => ({
  mockGetUserByUuid: vi.fn(),
  mockGetProvider: vi.fn(),
  mockGetProviderByUuid: vi.fn(),
  mockGetPersonByUuid: vi.fn(),
  mockUpdatePerson: vi.fn(),
  mockUpdatePersonName: vi.fn(),
  mockCreatePersonName: vi.fn(),
  mockUpdateProfileImage: vi.fn(),
  mockGetProviderAttributeTypes: vi.fn(),
  mockAddOrUpdateProviderAttribute: vi.fn(),
  mockRequestDataFromMultipleSources: vi.fn(),
  mockShowToast: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock('../../../modules/profile/profile.service', () => ({
  default: {
    getUserByUuid: h.mockGetUserByUuid,
    getProvider: h.mockGetProvider,
    getProviderByUuid: h.mockGetProviderByUuid,
    getPersonByUuid: h.mockGetPersonByUuid,
    updatePerson: h.mockUpdatePerson,
    updatePersonName: h.mockUpdatePersonName,
    createPersonName: h.mockCreatePersonName,
    updateProfileImage: h.mockUpdateProfileImage,
    getProviderAttributeTypes: h.mockGetProviderAttributeTypes,
    addOrUpdateProviderAttribute: h.mockAddOrUpdateProviderAttribute,
    requestDataFromMultipleSources: h.mockRequestDataFromMultipleSources,
  },
}));

vi.mock('../../../services/toast', () => ({
  showToast: (...args: any[]) => h.mockShowToast(...args),
}));

vi.mock('../../../utils/storage', () => ({
  storage: {
    getUser: h.mockGetUser,
  },
}));

describe('useProfile', () => {
  const mockUser = {
    uuid: 'user-uuid-123',
    person: {
      uuid: 'person-uuid-123',
    },
  };

  const mockUserDetails = {
    uuid: 'user-uuid-123',
    person: {
      uuid: 'person-uuid-123',
    },
    roles: [
      { name: 'Provider', uuid: 'role-uuid-1' },
      { name: 'Health Worker', uuid: 'role-uuid-2' },
    ],
    privileges: [
      { name: 'View Patients', uuid: 'priv-uuid-1' },
      { name: 'Edit Patients', uuid: 'priv-uuid-2' },
    ],
    username: 'johndoe',
    systemId: 'system-123',
    display: 'John Doe (johndoe)',
  };

  const mockProviderData = {
    results: [
      {
        uuid: 'provider-uuid-123',
      },
    ],
  };

  const mockProviderDetails = {
    uuid: 'provider-uuid-123',
    person: {
      uuid: 'person-uuid-123',
    },
    attributes: [
      { attributeType: { uuid: 'phone-attr-uuid' }, value: '1234567890' },
      {
        attributeType: { uuid: 'email-attr-uuid' },
        value: 'john.doe@example.com',
      },
    ],
  };

  const mockPersonDetails = {
    uuid: 'person-uuid-123',
    display: 'John M Doe',
    gender: 'M',
    birthdate: '1990-01-01',
    preferredName: {
      uuid: 'name-uuid-123',
      givenName: 'John',
      middleName: 'M',
      familyName: 'Doe',
    },
    attributes: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    h.mockGetUser.mockReturnValue(JSON.stringify(mockUser));
    h.mockGetUserByUuid.mockResolvedValue(mockUserDetails);
    h.mockGetProvider.mockResolvedValue(mockProviderData);
    h.mockGetProviderByUuid.mockResolvedValue(mockProviderDetails);
    h.mockGetPersonByUuid.mockResolvedValue(mockPersonDetails);
    h.mockGetProviderAttributeTypes.mockResolvedValue({ results: [] });
    h.mockAddOrUpdateProviderAttribute.mockResolvedValue({});
    h.mockRequestDataFromMultipleSources.mockResolvedValue([]);
  });

  it('should initialize with default values', async () => {
    // Mock getUser to return null so loadProfile doesn't run
    h.mockGetUser.mockReturnValueOnce(null);
    const { result } = renderHook(() => useProfile());

    // Wait for useEffect to run
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Initial values - loadProfile doesn't run if no userData
    expect(result.current.profile).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.age).toBeNull();
  });

  it('should load profile on mount', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(h.mockGetUser).toHaveBeenCalled();
    expect(h.mockGetUserByUuid).toHaveBeenCalledWith('user-uuid-123');
    expect(h.mockGetProvider).toHaveBeenCalledWith('user-uuid-123');
    expect(h.mockGetProviderByUuid).toHaveBeenCalledWith('provider-uuid-123');
    expect(h.mockGetPersonByUuid).toHaveBeenCalledWith('person-uuid-123');
    expect(result.current.profile).not.toBeNull();
    expect(result.current.profile?.firstName).toBe('John');
    expect(result.current.profile?.lastName).toBe('Doe');
  });

  it('should handle loadProfile error', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    h.mockGetUserByUuid.mockRejectedValue(new Error('Network error'));

    renderHook(() => useProfile());

    await waitFor(() => {
      expect(h.mockShowToast).toHaveBeenCalledWith(
        'Error',
        'Failed to load profile data',
        'error'
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it('should not load profile if userData is not available', async () => {
    h.mockGetUser.mockReturnValue(null);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(h.mockGetUserByUuid).not.toHaveBeenCalled();
    expect(result.current.profile).toBeNull();
  });

  it('should set default gender as male if not provided', async () => {
    const personWithoutGender = { ...mockPersonDetails };
    delete (personWithoutGender as any).gender;
    h.mockGetPersonByUuid.mockResolvedValue(personWithoutGender);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile?.gender).toBe('male');
    });
  });

  it('should calculate age correctly', () => {
    const { result } = renderHook(() => useProfile());

    // Test with a birth date that results in age calculation
    const today = new Date();
    const birthYear = today.getFullYear() - 30;
    const birthDate = `${birthYear}-01-01`;

    const age = result.current.calculateAge(birthDate);
    expect(age).toBe(30);
  });

  it('should calculate age correctly when birthday has not occurred this year', () => {
    const { result } = renderHook(() => useProfile());

    const today = new Date();
    const birthYear = today.getFullYear() - 30;
    // Use a future month so birthday hasn't occurred
    const futureMonth = String(today.getMonth() + 2).padStart(2, '0');
    const birthDate = `${birthYear}-${futureMonth}-15`;

    const age = result.current.calculateAge(birthDate);
    expect(age).toBe(29); // One year less because birthday hasn't occurred
  });

  it('should calculate age correctly when birthday is same month but later date', () => {
    const { result } = renderHook(() => useProfile());

    const today = new Date();
    const birthYear = today.getFullYear() - 30;
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0');
    // Use a future day in the current month
    const futureDay = String(today.getDate() + 5).padStart(2, '0');
    const birthDate = `${birthYear}-${currentMonth}-${futureDay}`;

    const age = result.current.calculateAge(birthDate);
    expect(age).toBe(29); // One year less because birthday hasn't occurred
  });

  it('should update age when profile dateOfBirth changes', async () => {
    const personWithDate = {
      ...mockPersonDetails,
      birthdate: '1995-06-15',
    };
    h.mockGetPersonByUuid.mockResolvedValue(personWithDate);

    const { result } = renderHook(() => useProfile());

    // Wait for profile to load
    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
      expect(result.current.profile?.dateOfBirth).toBe('1995-06-15');
    });

    // Age should be calculated automatically
    await waitFor(() => {
      expect(result.current.age).toBeGreaterThan(0);
      expect(result.current.age).toBe(
        result.current.calculateAge('1995-06-15')
      );
    });
  });

  it('should set age to null when profile has no dateOfBirth', async () => {
    const personWithoutDate = { ...mockPersonDetails };
    delete (personWithoutDate as any).birthdate;
    h.mockGetPersonByUuid.mockResolvedValue(personWithoutDate);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.profile).not.toBeNull();
      expect(result.current.age).toBeNull();
    });
  });

  it('should update age for a given date using updateAgeForDate', () => {
    const { result } = renderHook(() => useProfile());

    const today = new Date();
    const birthYear = today.getFullYear() - 35;
    const dateOfBirth = `${birthYear}-06-15`;

    act(() => {
      result.current.updateAgeForDate(dateOfBirth);
    });

    expect(result.current.age).toBe(35);
  });

  it('should set age to null when updateAgeForDate receives empty string', () => {
    const { result } = renderHook(() => useProfile());

    // First set an age
    act(() => {
      result.current.updateAgeForDate('1990-01-01');
    });

    expect(result.current.age).not.toBeNull();

    // Then clear it
    act(() => {
      result.current.updateAgeForDate('');
    });

    expect(result.current.age).toBeNull();
  });

  it('should set age to null when updateAgeForDate receives whitespace-only string', () => {
    const { result } = renderHook(() => useProfile());

    act(() => {
      result.current.updateAgeForDate('   ');
    });

    expect(result.current.age).toBeNull();
  });

  it('should update profile successfully', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.profile).not.toBeNull();
    });

    const updateData = {
      firstName: 'Jane',
      lastName: 'Smith',
    };

    h.mockUpdatePersonName.mockResolvedValue({});
    h.mockGetPersonByUuid.mockResolvedValueOnce({
      ...mockPersonDetails,
      preferredName: { uuid: 'name-uuid-123' },
    });

    await act(async () => {
      await result.current.updateProfile(updateData);
    });

    expect(h.mockUpdatePersonName).toHaveBeenCalled();
    expect(h.mockShowToast).toHaveBeenCalledWith(
      'Success',
      'Profile has been updated successfully',
      'success'
    );
    expect(result.current.loading).toBe(false);
  });

  it('should handle updateProfile error', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.profile).not.toBeNull();
    });

    const error = new Error('Update failed');
    h.mockGetPersonByUuid.mockRejectedValueOnce(error);

    await act(async () => {
      try {
        await result.current.updateProfile({ firstName: 'Jane' });
      } catch (e) {
        // Expected to throw
      }
    });

    expect(h.mockShowToast).toHaveBeenCalledWith(
      'Error',
      'Failed to update profile',
      'error'
    );
    expect(result.current.loading).toBe(false);
  });

  it('should upload photo successfully', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
    h.mockUpdateProfileImage.mockResolvedValue({});

    await act(async () => {
      await result.current.uploadPhoto(file);
    });

    expect(h.mockUpdateProfileImage).toHaveBeenCalled();
    expect(h.mockShowToast).toHaveBeenCalledWith(
      'Success',
      'Profile picture uploaded successfully!',
      'success'
    );
    expect(result.current.loading).toBe(false);
  });

  it('should handle uploadPhoto error', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
    const error = new Error('Upload failed');
    h.mockUpdateProfileImage.mockRejectedValue(error);

    await act(async () => {
      await result.current.uploadPhoto(file);
    });

    expect(h.mockShowToast).toHaveBeenCalledWith(
      'Error',
      'Upload failed',
      'error'
    );
    expect(result.current.loading).toBe(false);
  });

  it('should reject non-JPG/JPEG files', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const file = new File(['photo'], 'photo.png', { type: 'image/png' });

    await act(async () => {
      await result.current.uploadPhoto(file);
    });

    expect(h.mockShowToast).toHaveBeenCalledWith(
      'Warning',
      'Upload JPG/JPEG format image only.',
      'warning'
    );
    expect(h.mockUpdateProfileImage).not.toHaveBeenCalled();
  });

  it('should call takePhoto and show info toast', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.takePhoto();
    });

    expect(h.mockShowToast).toHaveBeenCalledWith(
      'Info',
      'Camera functionality not implemented yet',
      'info'
    );
    expect(result.current.loading).toBe(false);
  });

  it('should handle takePhoto error catch block', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Make showToast throw an error to trigger the catch block
    h.mockShowToast.mockImplementationOnce(() => {
      throw new Error('Toast error');
    });

    await act(async () => {
      await result.current.takePhoto();
    });

    // Verify the catch block executed and showed the error toast
    expect(h.mockShowToast).toHaveBeenCalledWith(
      'Error',
      'Failed to take photo',
      'error'
    );
    expect(result.current.loading).toBe(false);
  });

  it('should call refreshProfile', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear the initial calls
    vi.clearAllMocks();

    await act(async () => {
      await result.current.refreshProfile();
    });

    expect(h.mockGetUserByUuid).toHaveBeenCalled();
  });

  // Test for missing UUID in user data (lines 94-98)
  it('should throw error when user UUID is missing', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const userWithoutUuid = {
      person: { uuid: 'person-123' },
    };
    h.mockGetUser.mockReturnValue(JSON.stringify(userWithoutUuid));

    renderHook(() => useProfile());

    await waitFor(() => {
      expect(h.mockShowToast).toHaveBeenCalledWith(
        'Error',
        'Failed to load profile data',
        'error'
      );
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  // Test for JSON parse error (lines 102-109)
  it('should handle JSON parse error', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    h.mockGetUser.mockReturnValue('invalid json {');

    renderHook(() => useProfile());

    await waitFor(() => {
      expect(h.mockShowToast).toHaveBeenCalledWith(
        'Error',
        'Failed to load profile data',
        'error'
      );
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  // Test for provider fetch failure (lines 138-144)
  it('should handle provider fetch failure', async () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    h.mockGetProvider.mockRejectedValue(new Error('Provider not found'));

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.profile).not.toBeNull();
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to fetch provider details (may not be a provider):',
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore();
  });

  // Test for missing person UUID (lines 148-150)
  it('should throw error when person UUID is missing', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const userDetailsWithoutPerson = {
      ...mockUserDetails,
      person: undefined,
    };
    h.mockGetUserByUuid.mockResolvedValue(userDetailsWithoutPerson);
    h.mockGetUser.mockReturnValue(
      JSON.stringify({ uuid: 'user-123', person: undefined })
    );

    renderHook(() => useProfile());

    await waitFor(() => {
      expect(h.mockShowToast).toHaveBeenCalledWith(
        'Error',
        'Failed to load profile data',
        'error'
      );
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  // Test for person details fetch failure (lines 159-161)
  it('should handle person details fetch failure', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    h.mockGetPersonByUuid.mockRejectedValue(new Error('Person not found'));

    renderHook(() => useProfile());

    await waitFor(() => {
      expect(h.mockShowToast).toHaveBeenCalledWith(
        'Error',
        'Failed to load profile data',
        'error'
      );
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  // Test updateProfile without loaded profile (lines 205-207)
  it('should throw error when updating profile without loaded profile', async () => {
    h.mockGetUser.mockReturnValue(null);
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      try {
        await result.current.updateProfile({ firstName: 'Jane' });
      } catch (error) {
        expect((error as Error).message).toBe('Profile not loaded or provider not found');
      }
    });
  });

  // Test updateProfile with gender and birthdate (lines 221-227)
  it('should update person with gender, age, and birthdate', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.profile).not.toBeNull();
    });

    const updateData = {
      gender: 'female' as const,
      dateOfBirth: '1995-06-15',
    };

    h.mockUpdatePerson.mockResolvedValue({});
    h.mockGetPersonByUuid.mockResolvedValueOnce({
      ...mockPersonDetails,
      preferredName: { uuid: 'name-uuid-123' },
    });

    await act(async () => {
      await result.current.updateProfile(updateData);
    });

    expect(h.mockUpdatePerson).toHaveBeenCalledWith('person-uuid-123', {
      gender: 'F',
      age: expect.any(Number),
      birthdate: '1995-06-15',
    });
  });

  // Test createPersonName when preferredName doesn't exist (lines 246-247)
  it('should create person name when preferredName does not exist', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.profile).not.toBeNull();
    });

    const updateData = {
      firstName: 'Jane',
      lastName: 'Smith',
      middleName: 'Marie',
    };

    h.mockCreatePersonName.mockResolvedValue({});
    h.mockGetPersonByUuid.mockResolvedValueOnce({
      ...mockPersonDetails,
      preferredName: undefined,
    });

    await act(async () => {
      await result.current.updateProfile(updateData);
    });

    expect(h.mockCreatePersonName).toHaveBeenCalledWith('person-uuid-123', {
      givenName: 'Jane',
      middleName: 'Marie',
      familyName: 'Smith',
    });
  });

  // Test uploadPhoto FileReader error (lines 283, 293-295)
  it('should handle FileReader error in uploadPhoto', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });

    // Mock FileReader to trigger error
    const originalFileReader = global.FileReader;
    global.FileReader = class MockFileReader {
      readAsDataURL() {
        // Trigger error immediately
        if (this.onerror) {
          (this.onerror as any)();
        }
      }
      onerror: any = null;
      onload: any = null;
    } as any;

    await act(async () => {
      await result.current.uploadPhoto(file);
    });

    expect(h.mockShowToast).toHaveBeenCalledWith(
      'Error',
      'Failed to read file',
      'error'
    );

    global.FileReader = originalFileReader;
  });

  // Test uploadPhoto with missing person UUID (line 296)
  it('should handle missing person UUID in uploadPhoto', async () => {
    h.mockGetUser.mockReturnValue(
      JSON.stringify({ uuid: 'user-123', person: undefined })
    );
    h.mockGetUserByUuid.mockResolvedValue({
      ...mockUserDetails,
      person: undefined,
    });
    h.mockGetProvider.mockResolvedValue({ results: [] });

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });

    await act(async () => {
      await result.current.uploadPhoto(file);
    });

    expect(h.mockShowToast).toHaveBeenCalledWith(
      'Error',
      'Person UUID not found',
      'error'
    );
  });

  // Test updateProfile with email, phone, setupLocation (line 250-254)
  it('should update provider attributes', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.profile).not.toBeNull();
    });

    const updateData = {
      email: 'newemail@example.com',
      phone: '+919876543210',
      setupLocation: 'New Location',
    };

    h.mockGetProviderAttributeTypes.mockResolvedValue({
      results: [
        { uuid: 'email-attr-type-uuid', display: 'emailId' },
        { uuid: 'phone-attr-type-uuid', display: 'phoneNumber' },
        { uuid: 'location-attr-type-uuid', display: 'setupLocation' },
      ],
    });
    h.mockGetPersonByUuid.mockResolvedValueOnce({
      ...mockPersonDetails,
      preferredName: { uuid: 'name-uuid-123' },
    });

    await act(async () => {
      await result.current.updateProfile(updateData);
    });

    expect(h.mockGetProviderAttributeTypes).toHaveBeenCalled();
    expect(h.mockAddOrUpdateProviderAttribute).toHaveBeenCalled();
  });

  // Test uploadPhoto with jpeg file extension (case-insensitive)
  it('should accept JPEG files with uppercase extension', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const file = new File(['photo'], 'photo.JPEG', { type: 'image/jpeg' });
    h.mockUpdateProfileImage.mockResolvedValue({});

    await act(async () => {
      await result.current.uploadPhoto(file);
    });

    expect(h.mockUpdateProfileImage).toHaveBeenCalled();
    expect(h.mockShowToast).toHaveBeenCalledWith(
      'Success',
      'Profile picture uploaded successfully!',
      'success'
    );
  });

  // Test getUserByUuid failure (line 118-120)
  it('should handle getUserByUuid failure', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    h.mockGetUserByUuid.mockRejectedValue(new Error('User fetch failed'));

    renderHook(() => useProfile());

    await waitFor(() => {
      expect(h.mockShowToast).toHaveBeenCalledWith(
        'Error',
        'Failed to load profile data',
        'error'
      );
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    consoleErrorSpy.mockRestore();
  });

  // Test without middleName in updateProfile
  it('should handle update without middleName', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.profile).not.toBeNull();
    });

    const updateData = {
      firstName: 'Jane',
      lastName: 'Smith',
      // middleName intentionally omitted
    };

    h.mockUpdatePersonName.mockResolvedValue({});
    h.mockGetPersonByUuid.mockResolvedValueOnce({
      ...mockPersonDetails,
      preferredName: { uuid: 'name-uuid-123' },
    });

    await act(async () => {
      await result.current.updateProfile(updateData);
    });

    expect(h.mockUpdatePersonName).toHaveBeenCalledWith(
      'person-uuid-123',
      'name-uuid-123',
      {
        givenName: 'Jane',
        middleName: 'M', // Should use existing middleName from profile
        familyName: 'Smith',
      }
    );
  });

  // Test uploadPhoto with providedDetails person UUID (line 292-294)
  it('should use providerDetails person UUID in uploadPhoto', async () => {
    const mockProviderWithPerson = {
      ...mockProviderDetails,
      person: { uuid: 'provider-person-uuid-456' },
    };
    h.mockGetProviderByUuid.mockResolvedValue(mockProviderWithPerson);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
    h.mockUpdateProfileImage.mockResolvedValue({});

    await act(async () => {
      await result.current.uploadPhoto(file);
    });

    expect(h.mockUpdateProfileImage).toHaveBeenCalledWith({
      person: 'provider-person-uuid-456',
      base64EncodedImage: expect.any(String),
    });
  });

  // Test uploadPhoto with .jpg extension (lowercase)
  it('should accept .jpg files with lowercase extension', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
    h.mockUpdateProfileImage.mockResolvedValue({});

    await act(async () => {
      await result.current.uploadPhoto(file);
    });

    expect(h.mockUpdateProfileImage).toHaveBeenCalled();
    expect(h.mockShowToast).toHaveBeenCalledWith(
      'Success',
      'Profile picture uploaded successfully!',
      'success'
    );
  });

  // Test uploadPhoto when hwProfile has personUuid (line 294)
  it('should fallback to profile.id when providerDetails person UUID not available', async () => {
    h.mockGetProvider.mockResolvedValue({ results: [] }); // No provider

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
    h.mockUpdateProfileImage.mockResolvedValue({});

    await act(async () => {
      await result.current.uploadPhoto(file);
    });

    expect(h.mockUpdateProfileImage).toHaveBeenCalledWith({
      person: 'person-uuid-123',
      base64EncodedImage: expect.any(String),
    });
  });

  // Test uploadPhoto with generic Error (not instance of Error) - line 314
  it('should handle non-Error upload failure', async () => {
    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const file = new File(['photo'], 'photo.jpg', { type: 'image/jpeg' });
    h.mockUpdateProfileImage.mockRejectedValue('String error');

    await act(async () => {
      await result.current.uploadPhoto(file);
    });

    expect(h.mockShowToast).toHaveBeenCalledWith(
      'Error',
      'Failed to upload photo',
      'error'
    );
  });
});
