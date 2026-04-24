import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';



const h = vi.hoisted(() => ({
  mockGetPatient: vi.fn(),
  mockGetPatientVisits: vi.fn(),
}));

vi.mock('../../../../modules/patient/add/add-patient.service', () => ({
  patientService: {
    getPatient: (...args: unknown[]) => h.mockGetPatient(...args),
    getPatientVisits: (...args: unknown[]) => h.mockGetPatientVisits(...args),
  },
}));

vi.mock('../../../../assets/data/openmrs_uuids', () => ({
  patientAttributes: {
    telephoneNumber: 'tel-uuid',
    emergencyContactType: 'ect-uuid',
    emergencyContactName: 'ecn-uuid',
    emergencyContactNumber: 'ecnum-uuid',
    occupation: 'occ-uuid',
    caste: 'caste-uuid',
    education: 'edu-uuid',
    economicStatus: 'eco-uuid',
  },
}));

import {
  getVisitTitle,
  maskVisitId,
  usePatientProfile,
} from '../../../../modules/patient/profile/patient-profile.hooks';



const buildPatient = (overrides: {
  gender?: string | null;
  age?: number | null;
  birthdate?: string | null;
  preferredName?: { givenName: string; middleName: string | null; familyName: string } | null;
  identifiers?: { identifier: string; preferred: boolean }[];
  attributes?: { value: string; attributeType: { uuid: string; display: string } }[];
} = {}) => ({
  uuid: 'patient-uuid',
  identifiers: overrides.identifiers ?? [{ identifier: 'PAT001', preferred: true }],
  person: {
    uuid: 'person-uuid',
    gender: overrides.gender !== undefined ? overrides.gender : 'M',
    age: overrides.age !== undefined ? overrides.age : 30,
    birthdate:
      overrides.birthdate !== undefined
        ? overrides.birthdate
        : '1994-01-15T00:00:00.000+0000',
    preferredName:
      overrides.preferredName !== undefined
        ? overrides.preferredName
        : { givenName: 'John', middleName: 'K', familyName: 'Doe' },
    preferredAddress: {
      address1: '123 Main St',
      address2: 'Apt 4',
      cityVillage: 'Mumbai',
      stateProvince: 'Maharashtra',
      country: 'India',
      postalCode: '400001',
      countyDistrict: 'Mumbai Urban',
    },
    attributes: overrides.attributes ?? [
      { value: '+911234567890', attributeType: { uuid: 'tel-uuid', display: 'Phone' } },
      { value: 'Spouse', attributeType: { uuid: 'ect-uuid', display: 'ECT' } },
      { value: 'Jane', attributeType: { uuid: 'ecn-uuid', display: 'ECN' } },
      { value: '+9198', attributeType: { uuid: 'ecnum-uuid', display: 'ECNum' } },
      { value: 'Engineer', attributeType: { uuid: 'occ-uuid', display: 'Occ' } },
      { value: 'General', attributeType: { uuid: 'caste-uuid', display: 'Caste' } },
      { value: 'Graduate', attributeType: { uuid: 'edu-uuid', display: 'Edu' } },
      { value: 'Middle', attributeType: { uuid: 'eco-uuid', display: 'Eco' } },
    ],
  },
});

const emptyVisits = { results: [] };
const singleVisit = {
  results: [
    {
      uuid: 'visit-uuid-1234abcd',
      startDatetime: '2025-09-12T20:14:36.000+0000',
      visitType: { display: 'OPD Visit' },
      encounters: [{ encounterType: { display: 'ADULTINITIAL' } }],
    },
  ],
};



describe('maskVisitId', () => {
  it('returns XXXX + last 4 chars of UUID without dashes', () => {
    expect(maskVisitId('39feb1f7-a62e-4b06-9687-35561fa2fe46')).toBe('XXXXfe46');
  });

  it('handles a UUID-like string without dashes', () => {
    expect(maskVisitId('abcd1234')).toBe('XXXX1234');
  });
});



describe('getVisitTitle', () => {
  it('returns visitType.display when present', () => {
    expect(
      getVisitTitle({ visitType: { display: 'OPD Visit' }, encounters: [] })
    ).toBe('OPD Visit');
  });

  it('returns first encounterType.display when visitType is null', () => {
    expect(
      getVisitTitle({
        visitType: null,
        encounters: [{ encounterType: { display: 'ADULTINITIAL' } }],
      })
    ).toBe('ADULTINITIAL');
  });

  it('returns empty string when both visitType and encounters are absent', () => {
    expect(getVisitTitle({ visitType: null, encounters: [] })).toBe('');
  });
});



describe('usePatientProfile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not fetch and keeps loading true when uuid is undefined', () => {
    const { result } = renderHook(() => usePatientProfile(undefined));
    expect(result.current.loading).toBe(true);
    expect(h.mockGetPatient).not.toHaveBeenCalled();
  });


  it('maps M gender to "Male"', async () => {
    h.mockGetPatient.mockResolvedValue(buildPatient({ gender: 'M' }));
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.patientData?.gender).toBe('Male');
  });

  it('maps F gender to "Female"', async () => {
    h.mockGetPatient.mockResolvedValue(buildPatient({ gender: 'F' }));
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.patientData?.gender).toBe('Female');
  });

  it('passes unknown gender code through as-is', async () => {
    h.mockGetPatient.mockResolvedValue(buildPatient({ gender: 'O' }));
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.patientData?.gender).toBe('O');
  });

  it('returns empty string for null gender via ?? fallback', async () => {
    h.mockGetPatient.mockResolvedValue(
      buildPatient({ gender: null as unknown as string })
    );
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.patientData?.gender).toBe('');
  });

  

  it('formats birthdate correctly', async () => {
    h.mockGetPatient.mockResolvedValue(
      buildPatient({ birthdate: '1994-01-15T00:00:00.000+0000' })
    );
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.patientData?.dob).toBeTruthy();
  });

  it('returns empty dob when birthdate is null', async () => {
    h.mockGetPatient.mockResolvedValue(buildPatient({ birthdate: null }));
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.patientData?.dob).toBe('');
  });

  it('falls back to raw iso string when toLocaleDateString throws', async () => {
    const spy = vi
      .spyOn(Date.prototype, 'toLocaleDateString')
      .mockImplementationOnce(() => {
        throw new Error('locale error');
      });

    h.mockGetPatient.mockResolvedValue(
      buildPatient({ birthdate: '1994-01-15T00:00:00.000+0000' })
    );
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.patientData?.dob).toBe('1994-01-15T00:00:00.000+0000');
    spy.mockRestore();
  });

 

  it('formats age as "N years" when age is a number', async () => {
    h.mockGetPatient.mockResolvedValue(buildPatient({ age: 30 }));
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.patientData?.age).toBe('30 years');
  });

  it('returns empty age when age is null', async () => {
    h.mockGetPatient.mockResolvedValue(buildPatient({ age: null }));
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.patientData?.age).toBe('');
  });

  it('returns empty age when age is undefined', async () => {
    const patient = buildPatient();
   
    (patient.person as any).age = undefined;
    h.mockGetPatient.mockResolvedValue(patient);
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.patientData?.age).toBe('');
  });

 

  it('joins givenName, middleName, familyName into fullName', async () => {
    h.mockGetPatient.mockResolvedValue(
      buildPatient({
        preferredName: { givenName: 'John', middleName: 'K', familyName: 'Doe' },
      })
    );
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.patientData?.fullName).toBe('John K Doe');
  });

  it('filters out null middleName from fullName', async () => {
    h.mockGetPatient.mockResolvedValue(
      buildPatient({
        preferredName: { givenName: 'John', middleName: null, familyName: 'Doe' },
      })
    );
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.patientData?.fullName).toBe('John Doe');
  });

  it('returns empty fullName when preferredName is null', async () => {
    h.mockGetPatient.mockResolvedValue(buildPatient({ preferredName: null }));
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.patientData?.fullName).toBe('');
  });

 

  it('uses preferred identifier', async () => {
    h.mockGetPatient.mockResolvedValue(
      buildPatient({
        identifiers: [
          { identifier: 'A001', preferred: false },
          { identifier: 'B002', preferred: true },
        ],
      })
    );
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.patientData?.patientId).toBe('B002');
  });

  it('falls back to first identifier when none is preferred', async () => {
    h.mockGetPatient.mockResolvedValue(
      buildPatient({
        identifiers: [
          { identifier: 'A001', preferred: false },
          { identifier: 'B002', preferred: false },
        ],
      })
    );
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.patientData?.patientId).toBe('A001');
  });

  it('returns empty string when identifiers array is empty', async () => {
    h.mockGetPatient.mockResolvedValue(buildPatient({ identifiers: [] }));
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.patientData?.patientId).toBe('');
  });

 

  it('reads all patient attributes correctly', async () => {
    h.mockGetPatient.mockResolvedValue(buildPatient());
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.patientData?.phone).toBe('+911234567890');
    expect(result.current.patientData?.contactType).toBe('Spouse');
    expect(result.current.patientData?.emergencyName).toBe('Jane');
    expect(result.current.patientData?.emergencyNumber).toBe('+9198');
    expect(result.current.patientData?.occupation).toBe('Engineer');
    expect(result.current.patientData?.caste).toBe('General');
    expect(result.current.patientData?.education).toBe('Graduate');
    expect(result.current.patientData?.economicStatus).toBe('Middle');
  });

  it('returns empty strings for missing attributes', async () => {
    h.mockGetPatient.mockResolvedValue(buildPatient({ attributes: [] }));
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.patientData?.phone).toBe('');
    expect(result.current.patientData?.occupation).toBe('');
  });

  it('falls back to empty array when person.attributes is null/undefined', async () => {
    const patient = buildPatient();

    (patient.person as any).attributes = null;
    h.mockGetPatient.mockResolvedValue(patient);
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.patientData?.phone).toBe('');
  });

 

  it('sets visits from response results', async () => {
    h.mockGetPatient.mockResolvedValue(buildPatient());
    h.mockGetPatientVisits.mockResolvedValue(singleVisit);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.visits).toHaveLength(1);
    expect(result.current.visits[0].uuid).toBe('visit-uuid-1234abcd');
  });

  it('defaults visits to empty array when results key is absent', async () => {
    h.mockGetPatient.mockResolvedValue(buildPatient());
    h.mockGetPatientVisits.mockResolvedValue({});

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.visits).toEqual([]);
  });



  it('sets error message when fetch fails', async () => {
    h.mockGetPatient.mockRejectedValue(new Error('Network error'));
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    expect(result.current.error).toBe(
      'Failed to load patient details. Please try again.'
    );
    expect(result.current.patientData).toBeNull();
  });

  

  it('re-fetches data via refresh() without triggering full-page loading', async () => {
    h.mockGetPatient.mockResolvedValue(buildPatient({ gender: 'M' }));
    h.mockGetPatientVisits.mockResolvedValue(emptyVisits);

    const { result } = renderHook(() => usePatientProfile('uuid'));
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });


    h.mockGetPatient.mockResolvedValue(buildPatient({ gender: 'F' }));
    h.mockGetPatientVisits.mockResolvedValue(singleVisit);

    act(() => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.patientData?.gender).toBe('Female'));

    expect(result.current.loading).toBe(false);
    expect(result.current.visits).toHaveLength(1);
    expect(h.mockGetPatient).toHaveBeenCalledTimes(2);
  });
});
