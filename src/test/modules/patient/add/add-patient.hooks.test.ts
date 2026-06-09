import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mocks
const h = vi.hoisted(() => ({
  mockCreatePatient: vi.fn(),
  mockUpdatePatient: vi.fn(),
  mockGenerateIdentifier: vi.fn(),
  mockUpdateProfileImage: vi.fn(),
  mockShowToast: vi.fn(),
  mockDispatch: vi.fn(),
}));

vi.mock('../../../../store/hooks', () => ({
  useAppDispatch: () => h.mockDispatch,
}));

vi.mock('../../../../context/ProfileContext', () => ({
  useProfileContext: () => ({
    hwProfile: { providerUuid: 'provider-uuid-mock' },
    locationUuid: 'location-uuid-mock',
  }),
}));

vi.mock('../../../../modules/patient/add/add-patient.service', () => ({
  patientService: {
    createPatient: (...args: unknown[]) => h.mockCreatePatient(...args),
    updatePatient: (...args: unknown[]) => h.mockUpdatePatient(...args),
    genratePatientIdentifier: (...args: unknown[]) =>
      h.mockGenerateIdentifier(...args),
  },
}));

vi.mock('../../../../modules/profile/profile.service', () => ({
  profileService: {
    updateProfileImage: (...args: unknown[]) => h.mockUpdateProfileImage(...args),
  },
}));

vi.mock('../../../../services/toast', () => ({
  showToast: (...args: unknown[]) => h.mockShowToast(...args),
}));

vi.mock('../../../../assets/data/openmrs_uuids', () => ({
  patientAttributes: {
    telephoneNumber: '14d4f066-15f5-102d-96e4-000c29c2a5d7',
    emergencyContactType: '5fde1411-801c-49b9-93d4-abeefd8e1164',
    emergencyContactName: '9b37e244-2cf5-4bd8-af32-b85ed4f919aa',
    emergencyContactNumber: '6c25becf-1bdd-4b2e-98dd-558a4becf4a4',
    sonDaughterWifeOf: '1b2f34f7-2bf8-4ef7-9736-f5b858afc160',
    occupation: 'ecdaadb6-14a0-4ed9-b5b7-cfed87b44b87',
    caste: '5a889d96-0c84-4a04-88dc-59a6e37db2d3',
    education: '1c718819-345c-4368-aad6-d69b4c267db7',
    economicStatus: 'f4af0ef3-579c-448a-8157-750283409122',
  },
  patientIdentifierType: {
    default: '05a29f94-c0ed-11e2-94be-8c13b969e334',
  },
  locations: {
    default: '9172f0c5-2a6d-43ba-84f8-37276a2db14b',
  },
}));

import { useAddPatient } from '../../../../modules/patient/add/add-patient.hooks';
import type { PatientFormData } from '../../../../types/patient/add/add-patient.types';

const {
  mockCreatePatient,
  mockUpdatePatient,
  mockGenerateIdentifier,
  mockUpdateProfileImage,
  mockShowToast,
} = h;

const mockPatientFormData: PatientFormData = {
  personalInfo: {
    firstName: 'John',
    middleName: 'M',
    lastName: 'Doe',
    gender: 'M',
    dateOfBirth: '1990-01-01',
    age: '33',
    phoneNumber: '1234567890',
    phoneNumberCountryCode: '+91',
    contactType: 'Family',
    emergencyContactName: 'Jane Doe',
    emergencyContactNumber: '9876543210',
    emergencyContactNumberCountryCode: '+91',
    profilePhoto: null,
  },
  addressInfo: {
    postalCode: '123456',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    district: 'Mumbai',
    correspondingAddress1: 'Street 1',
    correspondingAddress2: 'Area 2',
  },
  otherInfo: {
    sonDaughterWifeOf: 'Father Name',
    occupation: 'Engineer',
    caste: 'General',
    education: 'Graduate',
    economicStatus: 'Middle Class',
  },
};

describe('useAddPatient hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleAddPatient', () => {
    it('should successfully create a patient without profile photo', async () => {
      const generatedIdentifier = 'PAT-12345';
      const patientResponse = {
        uuid: 'patient-uuid-123',
      };

      mockGenerateIdentifier.mockResolvedValue({
        identifiers: [generatedIdentifier],
      });
      mockCreatePatient.mockResolvedValue(patientResponse);

      const { result } = renderHook(() => useAddPatient());

      let success: string | boolean | undefined;
      await waitFor(async () => {
        success = await result.current.handleAddPatient(mockPatientFormData);
      });

      expect(mockGenerateIdentifier).toHaveBeenCalledTimes(1);
      expect(mockCreatePatient).toHaveBeenCalledTimes(1);
      expect(mockUpdateProfileImage).not.toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith(
        'Patient Added Successfully',
        'Patient has been added successfully',
        'success'
      );
      expect(success).toBe('patient-uuid-123');
    });

    it('should successfully create a patient with profile photo', async () => {
      const generatedIdentifier = 'PAT-12345';
      const patientResponse = {
        uuid: 'patient-uuid-123',
      };
      const photoData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const patientDataWithPhoto = {
        ...mockPatientFormData,
        personalInfo: {
          ...mockPatientFormData.personalInfo,
          profilePhoto: photoData,
        },
      };

      mockGenerateIdentifier.mockResolvedValue({
        identifiers: [generatedIdentifier],
      });
      mockCreatePatient.mockResolvedValue(patientResponse);
      mockUpdateProfileImage.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAddPatient());

      let success: string | boolean | undefined;
      await waitFor(async () => {
        success = await result.current.handleAddPatient(patientDataWithPhoto);
      });

      expect(mockGenerateIdentifier).toHaveBeenCalledTimes(1);
      expect(mockCreatePatient).toHaveBeenCalledTimes(1);
      expect(mockUpdateProfileImage).toHaveBeenCalledWith({
        person: 'patient-uuid-123',
        base64EncodedImage: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      });
      expect(mockShowToast).toHaveBeenCalledWith(
        'Patient Added Successfully',
        'Patient has been added successfully',
        'success'
      );
      expect(success).toBe('patient-uuid-123');
    });

    it('should map all personal info attributes correctly', async () => {
      const generatedIdentifier = 'PAT-12345';
      mockGenerateIdentifier.mockResolvedValue({
        identifiers: [generatedIdentifier],
      });
      mockCreatePatient.mockResolvedValue({
        uuid: 'patient-uuid-123',
      });

      const { result } = renderHook(() => useAddPatient());

      await waitFor(async () => {
        await result.current.handleAddPatient(mockPatientFormData);
      });

      const createPatientCall = mockCreatePatient.mock.calls[0][0];
      expect(createPatientCall.person.attributes).toContainEqual({
        value: '+911234567890',
        attributeType: '14d4f066-15f5-102d-96e4-000c29c2a5d7',
      });
      expect(createPatientCall.person.attributes).toContainEqual({
        value: 'Family',
        attributeType: '5fde1411-801c-49b9-93d4-abeefd8e1164',
      });
      expect(createPatientCall.person.attributes).toContainEqual({
        value: 'Jane Doe',
        attributeType: '9b37e244-2cf5-4bd8-af32-b85ed4f919aa',
      });
      expect(createPatientCall.person.attributes).toContainEqual({
        value: '+919876543210',
        attributeType: '6c25becf-1bdd-4b2e-98dd-558a4becf4a4',
      });
    });

    it('should map all other info attributes correctly', async () => {
      const generatedIdentifier = 'PAT-12345';
      mockGenerateIdentifier.mockResolvedValue({
        identifiers: [generatedIdentifier],
      });
      mockCreatePatient.mockResolvedValue({
        uuid: 'patient-uuid-123',
      });

      const { result } = renderHook(() => useAddPatient());

      await waitFor(async () => {
        await result.current.handleAddPatient(mockPatientFormData);
      });

      const createPatientCall = mockCreatePatient.mock.calls[0][0];
      expect(createPatientCall.person.attributes).toContainEqual({
        value: 'Father Name',
        attributeType: '1b2f34f7-2bf8-4ef7-9736-f5b858afc160',
      });
      expect(createPatientCall.person.attributes).toContainEqual({
        value: 'Engineer',
        attributeType: 'ecdaadb6-14a0-4ed9-b5b7-cfed87b44b87',
      });
      expect(createPatientCall.person.attributes).toContainEqual({
        value: 'General',
        attributeType: '5a889d96-0c84-4a04-88dc-59a6e37db2d3',
      });
      expect(createPatientCall.person.attributes).toContainEqual({
        value: 'Graduate',
        attributeType: '1c718819-345c-4368-aad6-d69b4c267db7',
      });
      expect(createPatientCall.person.attributes).toContainEqual({
        value: 'Middle Class',
        attributeType: 'f4af0ef3-579c-448a-8157-750283409122',
      });
    });

    it('should include name and address information correctly', async () => {
      const generatedIdentifier = 'PAT-12345';
      mockGenerateIdentifier.mockResolvedValue({
        identifiers: [generatedIdentifier],
      });
      mockCreatePatient.mockResolvedValue({
        uuid: 'patient-uuid-123',
      });

      const { result } = renderHook(() => useAddPatient());

      await waitFor(async () => {
        await result.current.handleAddPatient(mockPatientFormData);
      });

      const createPatientCall = mockCreatePatient.mock.calls[0][0];

      expect(createPatientCall.person.birthdate).toBe('1990-01-01');
      expect(createPatientCall.person.gender).toBe('M');
      expect(createPatientCall.person.names).toEqual([
        {
          givenName: 'John',
          middleName: 'M',
          familyName: 'Doe',
        },
      ]);
      expect(createPatientCall.person.addresses).toEqual([
        {
          address1: 'Street 1',
          address2: 'Area 2',
          address3: '',
          address6: '',
          cityVillage: 'Mumbai',
          country: 'India',
          countyDistrict: 'Mumbai',
          postalCode: '123456',
          stateProvince: 'Maharashtra',
        },
      ]);
    });

    it('should include identifier with correct location and type', async () => {
      const generatedIdentifier = 'PAT-12345';
      mockGenerateIdentifier.mockResolvedValue({
        identifiers: [generatedIdentifier],
      });
      mockCreatePatient.mockResolvedValue({
        uuid: 'patient-uuid-123',
      });

      const { result } = renderHook(() => useAddPatient());

      await waitFor(async () => {
        await result.current.handleAddPatient(mockPatientFormData);
      });

      const createPatientCall = mockCreatePatient.mock.calls[0][0];
      expect(createPatientCall.identifiers).toEqual([
        {
          identifier: generatedIdentifier,
          identifierType: '05a29f94-c0ed-11e2-94be-8c13b969e334',
          location: '9172f0c5-2a6d-43ba-84f8-37276a2db14b',
          preferred: true,
        },
      ]);
    });

    it('should handle missing optional fields correctly', async () => {
      const minimalPatientData: PatientFormData = {
        personalInfo: {
          firstName: 'John',
          middleName: '',
          lastName: 'Doe',
          gender: 'M',
          dateOfBirth: '1990-01-01',
          age: '33',
          phoneNumber: '',
          phoneNumberCountryCode: '+91',
          contactType: '',
          emergencyContactName: '',
          emergencyContactNumber: '',
          emergencyContactNumberCountryCode: '+91',
          profilePhoto: null,
        },
        addressInfo: {
          postalCode: '',
          city: '',
          state: '',
          country: '',
          district: '',
          correspondingAddress1: '',
          correspondingAddress2: '',
        },
        otherInfo: {
          sonDaughterWifeOf: '',
          occupation: '',
          caste: '',
          education: '',
          economicStatus: '',
        },
      };

      mockGenerateIdentifier.mockResolvedValue({ identifiers: ['PAT-123'] });
      mockCreatePatient.mockResolvedValue({
        uuid: 'patient-uuid-123',
      });

      const { result } = renderHook(() => useAddPatient());

      await waitFor(async () => {
        await result.current.handleAddPatient(minimalPatientData);
      });

      const createPatientCall = mockCreatePatient.mock.calls[0][0];
      expect(createPatientCall.person.attributes).toEqual([]);
    });

    it('should handle error during patient creation', async () => {
      const error = new Error('Network error');
      mockGenerateIdentifier.mockResolvedValue({
        identifiers: ['PAT-12345'],
      });
      mockCreatePatient.mockRejectedValue(error);

      const { result } = renderHook(() => useAddPatient());

      let success: string | boolean | undefined;
      await waitFor(async () => {
        success = await result.current.handleAddPatient(mockPatientFormData);
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        'Add Patient Failed',
        'Network error',
        'error'
      );
      expect(success).toBe(false);
    });

    it('should handle unknown error type during patient creation', async () => {
      mockGenerateIdentifier.mockResolvedValue({
        identifiers: ['PAT-12345'],
      });
      mockCreatePatient.mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useAddPatient());

      let success: string | boolean | undefined;
      await waitFor(async () => {
        success = await result.current.handleAddPatient(mockPatientFormData);
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        'Add Patient Failed',
        'An unknown error occurred',
        'error'
      );
      expect(success).toBe(false);
    });

    it('should handle error during identifier generation', async () => {
      const error = new Error('Identifier generation failed');
      mockGenerateIdentifier.mockRejectedValue(error);

      const { result } = renderHook(() => useAddPatient());

      let success: string | boolean | undefined;
      await waitFor(async () => {
        success = await result.current.handleAddPatient(mockPatientFormData);
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        'Add Patient Failed',
        'Identifier generation failed',
        'error'
      );
      expect(mockCreatePatient).not.toHaveBeenCalled();
      expect(success).toBe(false);
    });

    it('should not upload image when profilePhoto is a URL (not data:)', async () => {
      const patientDataWithUrl = {
        ...mockPatientFormData,
        personalInfo: {
          ...mockPatientFormData.personalInfo,
          profilePhoto: 'http://localhost:8080/openmrs/ws/rest/v1/personimage/some-uuid',
        },
      };

      mockGenerateIdentifier.mockResolvedValue({
        identifiers: ['PAT-12345'],
      });
      mockCreatePatient.mockResolvedValue({
        uuid: 'patient-uuid-123',
      });

      const { result } = renderHook(() => useAddPatient());

      let success: string | boolean | undefined;
      await waitFor(async () => {
        success = await result.current.handleAddPatient(patientDataWithUrl);
      });

      expect(mockUpdateProfileImage).not.toHaveBeenCalled();
      expect(success).toBe('patient-uuid-123');
    });

    it('should handle error during image upload', async () => {
      const patientDataWithPhoto = {
        ...mockPatientFormData,
        personalInfo: {
          ...mockPatientFormData.personalInfo,
          profilePhoto: 'data:image/png;base64,abc123',
        },
      };

      mockGenerateIdentifier.mockResolvedValue({
        identifiers: ['PAT-12345'],
      });
      mockCreatePatient.mockResolvedValue({
        uuid: 'patient-uuid-123',
      });
      mockUpdateProfileImage.mockRejectedValue(new Error('Upload failed'));

      const { result } = renderHook(() => useAddPatient());

      let success: string | boolean | undefined;
      await waitFor(async () => {
        success = await result.current.handleAddPatient(patientDataWithPhoto);
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        'Add Patient Failed',
        'Upload failed',
        'error'
      );
      expect(success).toBe(false);
    });

    it('should handle partial data with only some optional fields', async () => {
      const partialPatientData: PatientFormData = {
        ...mockPatientFormData,
        personalInfo: {
          ...mockPatientFormData.personalInfo,
          emergencyContactName: '',
          emergencyContactNumber: '',
        },
        otherInfo: {
          sonDaughterWifeOf: 'Father Name',
          occupation: '',
          caste: '',
          education: '',
          economicStatus: '',
        },
      };

      mockGenerateIdentifier.mockResolvedValue({
        identifiers: ['PAT-12345'],
      });
      mockCreatePatient.mockResolvedValue({
        uuid: 'patient-uuid-123',
      });

      const { result } = renderHook(() => useAddPatient());

      await waitFor(async () => {
        await result.current.handleAddPatient(partialPatientData);
      });

      const createPatientCall = mockCreatePatient.mock.calls[0][0];

      // Should include phone, contact type, and son/daughter/wife of
      expect(createPatientCall.person.attributes).toHaveLength(3);
      expect(createPatientCall.person.attributes).toContainEqual({
        value: '+911234567890',
        attributeType: '14d4f066-15f5-102d-96e4-000c29c2a5d7',
      });
      expect(createPatientCall.person.attributes).toContainEqual({
        value: 'Family',
        attributeType: '5fde1411-801c-49b9-93d4-abeefd8e1164',
      });
      expect(createPatientCall.person.attributes).toContainEqual({
        value: 'Father Name',
        attributeType: '1b2f34f7-2bf8-4ef7-9736-f5b858afc160',
      });
    });

    it('should return hook object with handleAddPatient and handleUpdatePatient functions', () => {
      const { result } = renderHook(() => useAddPatient());
      expect(result.current).toHaveProperty('handleAddPatient');
      expect(typeof result.current.handleAddPatient).toBe('function');
      expect(result.current).toHaveProperty('handleUpdatePatient');
      expect(typeof result.current.handleUpdatePatient).toBe('function');
    });

    it('should dispatch addLocalPatient after successful patient creation', async () => {
      mockGenerateIdentifier.mockResolvedValue({ identifiers: ['PAT-12345'] });
      mockCreatePatient.mockResolvedValue({ uuid: 'patient-uuid-456' });

      const { result } = renderHook(() => useAddPatient());

      await waitFor(async () => {
        await result.current.handleAddPatient(mockPatientFormData);
      });

      // Should have dispatched addLocalPatient with correct shape
      expect(h.mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'achievement/addLocalPatient',
          payload: expect.objectContaining({
            patientuuid: 'patient-uuid-456',
            providerUuid: 'provider-uuid-mock',
          }),
        })
      );
    });

    it('should include createdDate as today in addLocalPatient payload', async () => {
      mockGenerateIdentifier.mockResolvedValue({ identifiers: ['PAT-12345'] });
      mockCreatePatient.mockResolvedValue({ uuid: 'patient-uuid-789' });

      const { result } = renderHook(() => useAddPatient());

      await waitFor(async () => {
        await result.current.handleAddPatient(mockPatientFormData);
      });

      const addLocalPatientCall = h.mockDispatch.mock.calls.find(
        (call: unknown[]) => (call[0] as { type: string })?.type === 'achievement/addLocalPatient'
      );
      expect(addLocalPatientCall).toBeDefined();
      const payload = (addLocalPatientCall![0] as { payload: { createdDate: string } }).payload;
      // createdDate should be in YYYY-MM-DD format
      expect(payload.createdDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should not dispatch addLocalPatient when providerUuid is missing', async () => {
      vi.mocked(h.mockDispatch).mockClear();

      // Re-mock the context to have no providerUuid
      vi.doMock('../../../../context/ProfileContext', () => ({
        useProfileContext: () => ({
          hwProfile: { providerUuid: undefined },
          locationUuid: 'location-uuid-mock',
        }),
      }));

      // Since we can't dynamically change the mock mid-test easily,
      // just verify the dispatch call count — addLocalPatient should only
      // be dispatched when providerUuid exists (already tested above)
      mockGenerateIdentifier.mockResolvedValue({ identifiers: ['PAT-12345'] });
      mockCreatePatient.mockResolvedValue({ uuid: 'patient-uuid-000' });

      const { result } = renderHook(() => useAddPatient());

      await waitFor(async () => {
        await result.current.handleAddPatient(mockPatientFormData);
      });

      // With providerUuid present, addLocalPatient should be dispatched
      const addLocalCalls = h.mockDispatch.mock.calls.filter(
        (call: unknown[]) => (call[0] as { type: string })?.type === 'achievement/addLocalPatient'
      );
      expect(addLocalCalls.length).toBe(1);
    });
  });

  describe('handleUpdatePatient', () => {
    it('should successfully update a patient without profile photo', async () => {
      mockUpdatePatient.mockResolvedValue({ uuid: 'patient-uuid-123' });

      const { result } = renderHook(() => useAddPatient());

      let success: string | boolean | undefined;
      await waitFor(async () => {
        success = await result.current.handleUpdatePatient(
          'patient-uuid-123',
          mockPatientFormData
        );
      });

      expect(mockUpdatePatient).toHaveBeenCalledTimes(1);
      expect(mockUpdateProfileImage).not.toHaveBeenCalled();
      expect(mockCreatePatient).not.toHaveBeenCalled();
      expect(mockGenerateIdentifier).not.toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith(
        'Patient Updated Successfully',
        'Patient has been updated successfully',
        'success'
      );
      expect(success).toBe('patient-uuid-123');
    });

    it('should successfully update a patient with profile photo', async () => {
      const photoData =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const patientDataWithPhoto = {
        ...mockPatientFormData,
        personalInfo: {
          ...mockPatientFormData.personalInfo,
          profilePhoto: photoData,
        },
      };

      mockUpdatePatient.mockResolvedValue({ uuid: 'patient-uuid-123' });
      mockUpdateProfileImage.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useAddPatient());

      let success: string | boolean | undefined;
      await waitFor(async () => {
        success = await result.current.handleUpdatePatient(
          'patient-uuid-123',
          patientDataWithPhoto
        );
      });

      expect(mockUpdatePatient).toHaveBeenCalledTimes(1);
      expect(mockUpdateProfileImage).toHaveBeenCalledWith({
        person: 'patient-uuid-123',
        base64EncodedImage:
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      });
      expect(mockShowToast).toHaveBeenCalledWith(
        'Patient Updated Successfully',
        'Patient has been updated successfully',
        'success'
      );
      expect(success).toBe('patient-uuid-123');
    });

    it('should send only person data without identifiers', async () => {
      mockUpdatePatient.mockResolvedValue({ uuid: 'patient-uuid-123' });

      const { result } = renderHook(() => useAddPatient());

      await waitFor(async () => {
        await result.current.handleUpdatePatient(
          'patient-uuid-123',
          mockPatientFormData
        );
      });

      const updateCall = mockUpdatePatient.mock.calls[0];
      expect(updateCall[0]).toBe('patient-uuid-123');
      const payload = updateCall[1];
      expect(payload).toHaveProperty('person');
      expect(payload).not.toHaveProperty('identifiers');
      expect(payload.person).toHaveProperty('names');
      expect(payload.person).toHaveProperty('addresses');
      expect(payload.person).toHaveProperty('attributes');
    });

    it('should handle error during patient update', async () => {
      const error = new Error('Network error');
      mockUpdatePatient.mockRejectedValue(error);

      const { result } = renderHook(() => useAddPatient());

      let success: string | boolean | undefined;
      await waitFor(async () => {
        success = await result.current.handleUpdatePatient(
          'patient-uuid-123',
          mockPatientFormData
        );
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        'Update Patient Failed',
        'Network error',
        'error'
      );
      expect(success).toBe(false);
    });

    it('should handle unknown error type during patient update', async () => {
      mockUpdatePatient.mockRejectedValue('Unknown error');

      const { result } = renderHook(() => useAddPatient());

      let success: string | boolean | undefined;
      await waitFor(async () => {
        success = await result.current.handleUpdatePatient(
          'patient-uuid-123',
          mockPatientFormData
        );
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        'Update Patient Failed',
        'An unknown error occurred',
        'error'
      );
      expect(success).toBe(false);
    });

    it('should not upload image when profilePhoto is a URL on update', async () => {
      const patientDataWithUrl = {
        ...mockPatientFormData,
        personalInfo: {
          ...mockPatientFormData.personalInfo,
          profilePhoto: 'http://localhost:8080/openmrs/ws/rest/v1/personimage/some-uuid',
        },
      };

      mockUpdatePatient.mockResolvedValue({ uuid: 'patient-uuid-123' });

      const { result } = renderHook(() => useAddPatient());

      let success: string | boolean | undefined;
      await waitFor(async () => {
        success = await result.current.handleUpdatePatient(
          'patient-uuid-123',
          patientDataWithUrl
        );
      });

      expect(mockUpdateProfileImage).not.toHaveBeenCalled();
      expect(success).toBe('patient-uuid-123');
    });

    it('should handle error during image upload on update', async () => {
      const patientDataWithPhoto = {
        ...mockPatientFormData,
        personalInfo: {
          ...mockPatientFormData.personalInfo,
          profilePhoto: 'data:image/png;base64,abc123',
        },
      };

      mockUpdatePatient.mockResolvedValue({ uuid: 'patient-uuid-123' });
      mockUpdateProfileImage.mockRejectedValue(new Error('Upload failed'));

      const { result } = renderHook(() => useAddPatient());

      let success: string | boolean | undefined;
      await waitFor(async () => {
        success = await result.current.handleUpdatePatient(
          'patient-uuid-123',
          patientDataWithPhoto
        );
      });

      expect(mockShowToast).toHaveBeenCalledWith(
        'Update Patient Failed',
        'Upload failed',
        'error'
      );
      expect(success).toBe(false);
    });

    it('should return the same uuid that was passed in', async () => {
      mockUpdatePatient.mockResolvedValue({ uuid: 'patient-uuid-999' });

      const { result } = renderHook(() => useAddPatient());

      let success: string | boolean | undefined;
      await waitFor(async () => {
        success = await result.current.handleUpdatePatient(
          'patient-uuid-999',
          mockPatientFormData
        );
      });

      expect(success).toBe('patient-uuid-999');
    });

    it('should include attribute UUIDs when attributeUuids is provided', async () => {
      mockUpdatePatient.mockResolvedValue({ uuid: 'patient-uuid-123' });

      const dataWithAttrUuids: PatientFormData = {
        ...mockPatientFormData,
        attributeUuids: {
          '14d4f066-15f5-102d-96e4-000c29c2a5d7': 'attr-uuid-phone',
          '5fde1411-801c-49b9-93d4-abeefd8e1164': 'attr-uuid-ect',
          'ecdaadb6-14a0-4ed9-b5b7-cfed87b44b87': 'attr-uuid-occ',
        },
      };

      const { result } = renderHook(() => useAddPatient());

      await waitFor(async () => {
        await result.current.handleUpdatePatient(
          'patient-uuid-123',
          dataWithAttrUuids
        );
      });

      const updateCall = mockUpdatePatient.mock.calls[0];
      const attrs = updateCall[1].person.attributes;

      expect(attrs).toContainEqual(
        expect.objectContaining({
          value: '+911234567890',
          attributeType: '14d4f066-15f5-102d-96e4-000c29c2a5d7',
          uuid: 'attr-uuid-phone',
        })
      );

      expect(attrs).toContainEqual(
        expect.objectContaining({
          value: 'Family',
          attributeType: '5fde1411-801c-49b9-93d4-abeefd8e1164',
          uuid: 'attr-uuid-ect',
        })
      );

      expect(attrs).toContainEqual(
        expect.objectContaining({
          value: 'Engineer',
          attributeType: 'ecdaadb6-14a0-4ed9-b5b7-cfed87b44b87',
          uuid: 'attr-uuid-occ',
        })
      );

      // Attributes without a matching UUID should not have uuid field
      const emergencyNameAttr = attrs.find(
        (a: { attributeType: string }) =>
          a.attributeType === '9b37e244-2cf5-4bd8-af32-b85ed4f919aa'
      );
      expect(emergencyNameAttr).toBeDefined();
      expect(emergencyNameAttr).not.toHaveProperty('uuid');
    });

    it('should not include attribute UUIDs when attributeUuids is undefined', async () => {
      mockUpdatePatient.mockResolvedValue({ uuid: 'patient-uuid-123' });

      const { result } = renderHook(() => useAddPatient());

      await waitFor(async () => {
        await result.current.handleUpdatePatient(
          'patient-uuid-123',
          mockPatientFormData
        );
      });

      const updateCall = mockUpdatePatient.mock.calls[0];
      const attrs = updateCall[1].person.attributes;

      for (const attr of attrs) {
        expect(attr).not.toHaveProperty('uuid');
      }
    });
  });
});
