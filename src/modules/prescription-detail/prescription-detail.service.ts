import type {
  Medication,
  PrescriptionData,
} from '../../assets/data/prescription-detail.data';
import { OpenMRSApi } from '../../services/openmrs';
import type { VisitDetailsResponse } from '../visit-details/visit-details.types';

export const API_ENDPOINTS = {
  VISIT: '/visit',
} as const;

const CONCEPT_UUIDS = {
  FOLLOW_UP_DATE: 'e8caffd6-5571-11e7-907b-a6006ad3dba0',
} as const;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  const datePart = date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
}

function matchesConcept(
  display: string | undefined,
  keywords: string[]
): boolean {
  if (!display) return false;
  const lower = display.toLowerCase();
  return keywords.some(kw => lower.includes(kw));
}

function getPatientIdentifier(
  patient: VisitDetailsResponse['patient']
): string {
  const identifier = patient.identifiers?.[0];
  return identifier?.identifier ?? '';
}

function getDoctorInfo(encounters: VisitDetailsResponse['encounters']): {
  name: string;
  qualification: string;
} {
  for (const encounter of encounters) {
    const provider = encounter.encounterProviders?.[0]?.provider;
    if (provider) {
      const qualAttr = provider.attributes?.find(attr =>
        matchesConcept(attr.attributeType?.display, [
          'qualification',
          'special',
        ])
      );
      return {
        name: provider.person?.display ?? provider.display ?? '',
        qualification: qualAttr?.value ?? '',
      };
    }
  }
  return { name: '', qualification: '' };
}

function getObsValue(obs: {
  value: string | number | { uuid: string; display: string };
}): string {
  if (typeof obs.value === 'string') return obs.value;
  if (typeof obs.value === 'number') return String(obs.value);
  return obs.value?.display ?? '';
}

function parseDiagnosisValue(raw: string): string {
  // Try JSON format: {"en": "...", "l-en": "..."}
  try {
    const parsed = JSON.parse(raw);
    return parsed.en || parsed['l-en'] || raw;
  } catch {
    // Not JSON
  }
  // Handle structured format: "NA::PEURPERAL FEVER:Primary & Provisional"
  // Extract the disease name between :: and the next :type qualifier
  const structuredRegex =
    /::(.*?)(?::(?:Primary|Provisional|Confirmed|Secondary).*)?$/i;
  const structuredMatch = structuredRegex.exec(raw);
  if (structuredMatch?.[1]) {
    return structuredMatch[1].trim();
  }
  return raw;
}

function getDiagnosis(encounters: VisitDetailsResponse['encounters']): string {
  for (const encounter of encounters) {
    for (const obs of encounter.obs) {
      if (matchesConcept(obs.concept?.display, ['diagnosis'])) {
        const raw = getObsValue(obs);
        return parseDiagnosisValue(raw);
      }
    }
  }
  return '';
}

function parseMedications(raw: string): Medication[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((med: Record<string, string>) => ({
        name: med.drug || med.name || med.medicine || '',
        strength: med.strength || med.dose || '',
        frequency: med.frequency || med.timing || '',
        duration: med.duration || '',
      }));
    }
    // Single medication object
    if (parsed && typeof parsed === 'object') {
      return [
        {
          name: parsed.drug || parsed.name || parsed.medicine || '',
          strength: parsed.strength || parsed.dose || '',
          frequency: parsed.frequency || parsed.timing || '',
          duration: parsed.duration || '',
        },
      ];
    }
  } catch {
    // Not JSON - return as single medication name
    if (raw.trim()) {
      return [{ name: raw.trim(), strength: '', frequency: '', duration: '' }];
    }
  }
  return [];
}

function getMedications(
  encounters: VisitDetailsResponse['encounters']
): Medication[] {
  const medications: Medication[] = [];
  for (const encounter of encounters) {
    for (const obs of encounter.obs) {
      if (
        matchesConcept(obs.concept?.display, [
          'medication',
          'drug order',
          'prescribed',
        ])
      ) {
        const raw = getObsValue(obs);
        medications.push(...parseMedications(raw));
      }
    }
  }
  return medications;
}

function parseListFromObs(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed))
      return parsed.filter((s: unknown) => typeof s === 'string' && s.trim());
    if (typeof parsed === 'string') return parsed.trim() ? [parsed.trim()] : [];
    if (parsed.en) return [parsed.en.replaceAll(/<[^>]*>/g, '').trim()];
  } catch {
    // Plain text
  }
  return raw.trim() ? [raw.trim()] : [];
}

function getAdvice(encounters: VisitDetailsResponse['encounters']): string[] {
  const advice: string[] = [];
  for (const encounter of encounters) {
    for (const obs of encounter.obs) {
      if (matchesConcept(obs.concept?.display, ['advice'])) {
        advice.push(...parseListFromObs(getObsValue(obs)));
      }
    }
  }
  return advice;
}

function getTestsRecommended(
  encounters: VisitDetailsResponse['encounters']
): string[] {
  const tests: string[] = [];
  for (const encounter of encounters) {
    for (const obs of encounter.obs) {
      if (matchesConcept(obs.concept?.display, ['test', 'investigation'])) {
        tests.push(...parseListFromObs(getObsValue(obs)));
      }
    }
  }
  return tests;
}

function getReferredSpecialist(
  encounters: VisitDetailsResponse['encounters']
): string | null {
  for (const encounter of encounters) {
    for (const obs of encounter.obs) {
      if (matchesConcept(obs.concept?.display, ['refer'])) {
        const val = getObsValue(obs);
        return val || null;
      }
    }
  }
  return null;
}

function safeFormatDate(val: string): string | null {
  const date = new Date(val);
  if (Number.isNaN(date.getTime())) return null;
  return formatDate(val);
}

function getFollowUpDate(
  encounters: VisitDetailsResponse['encounters']
): string | null {
  for (const encounter of encounters) {
    for (const obs of encounter.obs) {
      if (
        obs.concept?.uuid === CONCEPT_UUIDS.FOLLOW_UP_DATE ||
        matchesConcept(obs.concept?.display, ['follow'])
      ) {
        const val = getObsValue(obs);
        if (val) {
          return safeFormatDate(val);
        }
        return null;
      }
    }
  }
  return null;
}

function getVisitDate(response: VisitDetailsResponse): string {
  const prescriptionEncounter = response.encounters.find(
    e =>
      e.encounterType?.display?.toLowerCase().includes('prescription') ||
      e.encounterType?.display?.toLowerCase().includes('visit complete')
  );
  const dateStr =
    prescriptionEncounter?.encounterDatetime ?? response.startDatetime;
  return formatDateTime(dateStr);
}

function transformToPrescriptionData(
  response: VisitDetailsResponse
): PrescriptionData {
  const { patient, encounters } = response;
  const doctor = getDoctorInfo(encounters);

  return {
    patientName: patient.person?.preferredName
      ? `${patient.person.preferredName.givenName} ${patient.person.preferredName.familyName}`
      : (patient.display ?? ''),
    age: patient.person?.age ?? 0,
    gender: patient.person?.gender === 'M' ? 'Male' : 'Female',
    patientIdentifier: getPatientIdentifier(patient),
    doctorName: doctor.name,
    doctorQualification: doctor.qualification,
    visitDate: getVisitDate(response),
    diagnosis: getDiagnosis(encounters),
    medications: getMedications(encounters),
    advice: getAdvice(encounters),
    testsRecommended: getTestsRecommended(encounters),
    referredSpecialist: getReferredSpecialist(encounters),
    followUpDate: getFollowUpDate(encounters),
  };
}

const VISIT_CUSTOM_REP =
  'custom:(uuid,display,startDatetime,stopDatetime,' +
  'encounters:(display,uuid,encounterDatetime,' +
  'encounterType:(display),' +
  'obs:(display,uuid,value,concept:(uuid,display)),' +
  'encounterProviders:(display,provider:(uuid,display,attributes:(display,attributeType:(display),value),person:(uuid,display)))),' +
  'patient:(uuid,display,identifiers:(identifier,identifierType:(display)),' +
  'person:(display,gender,age,preferredName:(givenName,familyName))))';

export const prescriptionDetailService = {
  getPrescriptionData: async (visitUuid: string): Promise<PrescriptionData> => {
    const response = await OpenMRSApi.get<VisitDetailsResponse>(
      `${API_ENDPOINTS.VISIT}/${visitUuid}?v=${VISIT_CUSTOM_REP}`
    );
    return transformToPrescriptionData(response);
  },
};

export default prescriptionDetailService;
