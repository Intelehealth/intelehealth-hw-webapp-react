import { OpenMRSApi } from '../../services/openmrs';
import type {
  VisitDetailsResponse,
  VisitDetailsEncounter,
  VisitDetailsPatient,
} from '../visit-details/visit-details.types';
import type {
  VisitData,
  Detail,
  GeneralExam,
} from '../../assets/data/visit-summary.data';
import {
  CONCEPT_UUIDS,
  VISIT_SUMMARY_CUSTOM_REP,
} from '../../assets/data/visit-summary.data';

export { CONCEPT_UUIDS, VISIT_SUMMARY_CUSTOM_REP };

export const API_ENDPOINTS = {
  VISIT: '/visit',
} as const;
interface CloseVisitPayload {
  stopDatetime: string;
}

export function getObsNumericValue(
  encounters: VisitDetailsEncounter[],
  conceptUuid: string
): number | null {
  for (const encounter of encounters) {
    for (const obs of encounter.obs) {
      if (obs.concept?.uuid === conceptUuid) {
        const raw =
          typeof obs.value === 'string' ? obs.value : obs.value?.display;
        if (raw == null) return null;
        const val = parseFloat(String(raw));
        return isNaN(val) ? null : val;
      }
    }
  }
  return null;
}

function extractNameFromHtml(html: string): string {
  const match = html.match(/<b>([^<]+)<\/b>/);
  return match ? match[1] : html.replace(/<[^>]*>/g, '').trim();
}

function parseChiefComplaintValue(value: string): {
  name: string;
  html: string;
} {
  try {
    const parsed = JSON.parse(value);
    const html = parsed.en || parsed['l-en'] || '';
    const name = extractNameFromHtml(html) || value;
    return { name, html: html || value };
  } catch {
    const name = extractNameFromHtml(value) || value;
    return { name, html: value };
  }
}

export function extractDetailsFromHtml(html: string): Detail[] {
  const details: Detail[] = [];
  const bulletRegex = /[•►]\s*([^-<]+?)\s*-\s*([^<.]+)/g;
  let match;
  while ((match = bulletRegex.exec(html)) !== null) {
    details.push({
      label: match[1].trim(),
      value: match[2].trim(),
    });
  }
  return details;
}

export function extractChiefComplaints(encounters: VisitDetailsEncounter[]): {
  chiefComplaints: string[];
  details: Detail[];
} {
  const complaints: string[] = [];
  const details: Detail[] = [];

  for (const encounter of encounters) {
    for (const obs of encounter.obs) {
      if (obs.concept?.uuid === CONCEPT_UUIDS.CHIEF_COMPLAINT) {
        const raw =
          typeof obs.value === 'string'
            ? obs.value
            : (obs.value?.display ?? '');
        const parsed = parseChiefComplaintValue(raw);
        if (parsed.name && !complaints.includes(parsed.name)) {
          complaints.push(parsed.name);
        }
        details.push(...extractDetailsFromHtml(parsed.html));
      }
    }
  }

  return {
    chiefComplaints: complaints.length > 0 ? complaints : ['No information'],
    details,
  };
}

export function extractPhysicalExamination(
  encounters: VisitDetailsEncounter[]
): { generalExams: GeneralExam[] } {
  const generalExams: GeneralExam[] = [];

  for (const encounter of encounters) {
    for (const obs of encounter.obs) {
      if (obs.concept?.uuid === CONCEPT_UUIDS.PHYSICAL_EXAMINATION) {
        const raw =
          typeof obs.value === 'string'
            ? obs.value
            : (obs.value?.display ?? '');
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed === 'object' && parsed !== null) {
            for (const [key, val] of Object.entries(parsed)) {
              generalExams.push({ label: key, value: String(val) });
            }
          }
        } catch {
          if (raw) {
            generalExams.push({
              label: obs.concept?.display ?? 'Exam',
              value: raw,
            });
          }
        }
      }
    }
  }

  return {
    generalExams:
      generalExams.length > 0
        ? generalExams
        : [{ label: 'No information', value: 'No physical examination data' }],
  };
}

function getChwWorker(encounters: VisitDetailsEncounter[]): string {
  for (const encounter of encounters) {
    const provider = encounter.encounterProviders?.[0]?.provider;
    if (provider) {
      return provider.person?.display ?? provider.display ?? 'Unknown';
    }
  }
  return 'Unknown';
}

function getPhoneNumber(patient: VisitDetailsPatient): string {
  const attrs = patient.person?.attributes ?? [];
  const phoneAttr = attrs.find(
    attr =>
      attr.attributeType?.display?.toLowerCase().includes('telephone') ||
      attr.attributeType?.display?.toLowerCase().includes('phone')
  );
  return phoneAttr?.value ?? '';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function transformVisitSummaryResponse(
  response: VisitDetailsResponse
): VisitData {
  const { patient, encounters } = response;

  const patientName = patient.person?.preferredName
    ? `${patient.person.preferredName.givenName} ${patient.person.preferredName.familyName}`
    : (patient.display ?? '');

  const gender = patient.person?.gender === 'M' ? 'Male' : 'Female';
  const age = patient.person?.age ?? 0;
  const birthdate = patient.person?.birthdate
    ? formatDate(patient.person.birthdate)
    : 'Unknown';
  const identifier = patient.identifiers?.[0]?.identifier ?? '';
  const phoneNumber = getPhoneNumber(patient);
  const chwWorker = getChwWorker(encounters);

  const height = getObsNumericValue(encounters, CONCEPT_UUIDS.HEIGHT);
  const weight = getObsNumericValue(encounters, CONCEPT_UUIDS.WEIGHT);
  const bmi = getObsNumericValue(encounters, CONCEPT_UUIDS.BMI);
  const systolic = getObsNumericValue(encounters, CONCEPT_UUIDS.BP_SYSTOLIC);
  const diastolic = getObsNumericValue(encounters, CONCEPT_UUIDS.BP_DIASTOLIC);
  const pulse = getObsNumericValue(encounters, CONCEPT_UUIDS.PULSE);
  const temperature = getObsNumericValue(encounters, CONCEPT_UUIDS.TEMPERATURE);
  const spo2 = getObsNumericValue(encounters, CONCEPT_UUIDS.SPO2);
  const respiratoryRate = getObsNumericValue(
    encounters,
    CONCEPT_UUIDS.RESPIRATORY_RATE
  );

  const chiefComplaintData = extractChiefComplaints(encounters);
  const physicalExamination = extractPhysicalExamination(encounters);

  return {
    visitUuid: response.uuid,
    patient: {
      name: patientName,
      gender,
      id: identifier,
      patientUuid: patient.uuid,
      dateOfBirth: birthdate,
      age: `${age} Years`,
      chwWorker,
      visitId: response.uuid.substring(response.uuid.length - 8),
      phoneNumber: phoneNumber ? `+91 ${phoneNumber}` : 'No information',
    },
    vitals: {
      height: { value: height, unit: 'cm' },
      weight: { value: weight, unit: 'kg' },
      bmi: { value: bmi ?? 0 },
      bp: { systolic: systolic ?? 0, diastolic: diastolic ?? 0 },
      pulse: { value: pulse, unit: 'bpm' },
      temperature: { value: temperature, unit: 'F' },
      spo2: {
        value: spo2,
        unit: '%',
        ...(spo2 === null ? { note: 'No information' } : {}),
      },
      respiratoryRate: {
        value: respiratoryRate,
        unit: 'breaths/min',
        ...(respiratoryRate === null ? { note: 'No information' } : {}),
      },
    },
    checkupReason: chiefComplaintData,
    physicalExamination,
  };
}

export const visitSummaryService = {
  getVisitSummary: async (visitUuid: string): Promise<VisitData> => {
    const response = await OpenMRSApi.get<VisitDetailsResponse>(
      `${API_ENDPOINTS.VISIT}/${visitUuid}?v=${VISIT_SUMMARY_CUSTOM_REP}`
    );
    return transformVisitSummaryResponse(response);
  },

  closeVisit: async (visitUuid: string) => {
    const payload: CloseVisitPayload = {
      stopDatetime: new Date().toISOString(),
    };
    return OpenMRSApi.post(`${API_ENDPOINTS.VISIT}/${visitUuid}`, payload);
  },
};

export default visitSummaryService;
