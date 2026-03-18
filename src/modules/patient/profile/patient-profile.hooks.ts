import { useCallback, useEffect, useState } from 'react';
import { patientAttributes } from '../../../assets/data/openmrs_uuids';
import type {
  OpenMRSPatient,
  OpenMRSVisit,
  PatientDisplayData,
  UsePatientProfileReturn,
} from '../../../types/patient/profile/patient-profile.types';
import { patientService } from '../add/add-patient.service';

function getAttr(
  attributes: { attributeType: { uuid: string }; value: string }[],
  typeUuid: string
): string {
  return attributes?.find(a => a.attributeType?.uuid === typeUuid)?.value ?? '';
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

export const usePatientProfile = (
  uuid: string | undefined
): UsePatientProfileReturn => {
  const [patientData, setPatientData] = useState<PatientDisplayData | null>(
    null
  );
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
          setPatientData(mapPatientDisplayData(p as OpenMRSPatient));
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

  return { patientData, visits, loading, refreshing, error, refresh };
};
