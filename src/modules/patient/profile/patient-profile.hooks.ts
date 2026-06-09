import { useCallback, useEffect, useState } from 'react';
import { patientAttributes } from '../../../assets/data/openmrs_uuids';
import type { PatientFormData } from '../../../types/patient/add/add-patient.types';
import type {
  OpenMRSPatient,
  OpenMRSVisit,
  PatientDisplayData,
  UsePatientProfileReturn,
} from '../../../types/patient/profile/patient-profile.types';
import { getCountryCode } from '../../../utils/countries';
import { patientService } from '../add/add-patient.service';

function getAttr(
  attributes: { attributeType: { uuid: string }; value: string }[],
  typeUuid: string
): string {
  return attributes?.find(a => a.attributeType?.uuid === typeUuid)?.value ?? '';
}

function splitPhone(
  fullPhone: string,
  fallbackCode = '+91'
): { countryCode: string; number: string } {
  if (!fullPhone) return { countryCode: fallbackCode, number: '' };
  const raw = fullPhone.startsWith('+') ? fullPhone.slice(1) : fullPhone;
  const code = getCountryCode(raw);
  if (code) {
    return { countryCode: '+' + code, number: raw.slice(code.length) };
  }
  return { countryCode: fallbackCode, number: fullPhone };
}

function mapGender(code: string): string {
  if (code === 'M') return 'Male';
  if (code === 'F') return 'Female';
  return code ?? '';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function maskVisitId(uuid: string): string {
  return 'XXXX' + uuid.replaceAll('-', '').slice(-4);
}

export function getVisitTitle(
  visit: Pick<OpenMRSVisit, 'visitType' | 'encounters'>
): string {
  if (visit.visitType?.display) return visit.visitType.display;
  return visit.encounters?.[0]?.encounterType?.display ?? '';
}

function mapPatientDisplayData(patient: OpenMRSPatient): PatientDisplayData {
  const pName = patient.person.preferredName;
  const attrs = patient.person.attributes ?? [];

  return {
    fullName: [pName?.givenName, pName?.middleName, pName?.familyName]
      .filter(Boolean)
      .join(' '),
    patientId:
      patient.identifiers.find(i => i.preferred)?.identifier ??
      patient.identifiers[0]?.identifier ??
      '',
    gender: mapGender(patient.person.gender),
    dob: patient.person.birthdate ? formatDate(patient.person.birthdate) : '',
    age:
      patient.person.age !== null && patient.person.age !== undefined
        ? `${patient.person.age} years`
        : '',
    phone: getAttr(attrs, patientAttributes.telephoneNumber),
    contactType: getAttr(attrs, patientAttributes.emergencyContactType),
    emergencyName: getAttr(attrs, patientAttributes.emergencyContactName),
    emergencyNumber: getAttr(attrs, patientAttributes.emergencyContactNumber),
    occupation: getAttr(attrs, patientAttributes.occupation),
    caste: getAttr(attrs, patientAttributes.caste),
    education: getAttr(attrs, patientAttributes.education),
    economicStatus: getAttr(attrs, patientAttributes.economicStatus),
    address: patient.person.preferredAddress,
  };
}

export function mapRawPatientToFormData(
  patient: OpenMRSPatient
): PatientFormData {
  const pName = patient.person.preferredName;
  const addr = patient.person.preferredAddress;
  const attrs = patient.person.attributes ?? [];

  const phoneParts = splitPhone(
    getAttr(attrs, patientAttributes.telephoneNumber)
  );
  const emergencyPhoneParts = splitPhone(
    getAttr(attrs, patientAttributes.emergencyContactNumber)
  );

  const attributeUuids: Record<string, string> = {};
  for (const attr of attrs) {
    if (attr.uuid && attr.attributeType?.uuid) {
      attributeUuids[attr.attributeType.uuid] = attr.uuid;
    }
  }

  return {
    personalInfo: {
      firstName: pName?.givenName ?? '',
      middleName: pName?.middleName ?? '',
      lastName: pName?.familyName ?? '',
      gender: patient.person.gender ?? '',
      dateOfBirth: patient.person.birthdate
        ? patient.person.birthdate.split('T')[0]
        : '',
      age: patient.person.age != null ? String(patient.person.age) : '',
      phoneNumber: phoneParts.number,
      phoneNumberCountryCode: phoneParts.countryCode,
      contactType: getAttr(attrs, patientAttributes.emergencyContactType),
      emergencyContactName: getAttr(
        attrs,
        patientAttributes.emergencyContactName
      ),
      emergencyContactNumber: emergencyPhoneParts.number,
      emergencyContactNumberCountryCode: emergencyPhoneParts.countryCode,
      profilePhoto: patient.person?.uuid
        ? `${import.meta.env.VITE_OPENMRS_API_URL}/personimage/${patient.person.uuid}`
        : null,
    },
    addressInfo: {
      postalCode: addr?.postalCode ?? '',
      city: addr?.cityVillage ?? '',
      state: addr?.stateProvince ?? '',
      country: addr?.country ?? '',
      district: addr?.countyDistrict ?? '',
      correspondingAddress1: addr?.address1 ?? '',
      correspondingAddress2: addr?.address2 ?? '',
    },
    otherInfo: {
      sonDaughterWifeOf: getAttr(attrs, patientAttributes.sonDaughterWifeOf),
      occupation: getAttr(attrs, patientAttributes.occupation),
      caste: getAttr(attrs, patientAttributes.caste),
      education: getAttr(attrs, patientAttributes.education),
      economicStatus: getAttr(attrs, patientAttributes.economicStatus),
    },
    attributeUuids,
  };
}

export const usePatientProfile = (
  uuid: string | undefined
): UsePatientProfileReturn => {
  const [patientData, setPatientData] = useState<PatientDisplayData | null>(
    null
  );
  const [rawPatient, setRawPatient] = useState<OpenMRSPatient | null>(null);
  const [visits, setVisits] = useState<OpenMRSVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    (showSpinner = true) => {
      if (!uuid) return;
      if (showSpinner) setLoading(true);
      else setRefreshing(true);
      setError(null);

      Promise.all([
        patientService.getPatient(uuid),
        patientService.getPatientVisits(uuid),
      ])
        .then(([p, v]) => {
          const patient = p as OpenMRSPatient;
          setRawPatient(patient);
          setPatientData(mapPatientDisplayData(patient));
          setVisits(
            ((v as Record<string, unknown>)?.results as OpenMRSVisit[]) ?? []
          );
        })
        .catch(() =>
          setError('Failed to load patient details. Please try again.')
        )
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [uuid]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => fetchData(false), [fetchData]);

  return {
    patientData,
    rawPatient,
    visits,
    loading,
    refreshing,
    error,
    refresh,
  };
};
