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
  AssociatedSymptom,
  HistorySection,
} from '../../assets/data/visit-summary.data';
import {
  CONCEPT_UUIDS,
  VISIT_SUMMARY_CUSTOM_REP,
} from '../../assets/data/visit-summary.data';

/** Visit attribute type UUID for specialty */
const VISIT_ATTR_SPECIALITY = '3f296939-c6d3-4d2e-b8ca-d7f4bfd42c2d';

/** Encounter type UUID indicating a priority visit */
const ENCOUNTER_TYPE_PRIORITY = 'ca5f5dc3-4f0b-4097-9cae-5cf2eb44a09c';

/** Concept UUIDs for medical / family history observations */
const MEDICAL_HISTORY_CONCEPT = '62bff84b-795a-45ad-aae1-80e7f5163a82';
const FAMILY_HISTORY_CONCEPT = 'd63ae965-47fb-40e8-8f08-1f46a8a60b2b';

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
        if (typeof obs.value === 'number') return obs.value;
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

  // First pass: try the original bullet regex (handles • and ► with dash separator)
  const bulletRegex = /[•►]\s*([^-<]+?)\s*-\s*([^<.]+)/g;
  let match;
  while ((match = bulletRegex.exec(html)) !== null) {
    details.push({
      label: match[1].trim(),
      value: match[2].trim(),
    });
  }
  if (details.length > 0) return details;

  // Fallback: line-by-line parsing for other bullet/separator formats
  // Only activate when the HTML has <br> tags (structured multi-line content)
  if (!/<br\s*\/?>/i.test(html)) return details;

  const lines = html.split(/<br\s*\/?>/gi);
  for (const line of lines) {
    const clean = line.replace(/<[^>]*>/g, '').trim();
    if (!clean) continue;

    // Strip leading non-word characters (bullets like ?, •, ►, ●, *, etc.)
    const stripped = clean.replace(/^[^\w]+/, '').trim();
    if (!stripped) continue;

    // Skip header lines that end with colon only (e.g. "General exams:")
    if (/^[^:]+:\s*$/.test(stripped)) continue;

    // Try "Label: Value" pattern (colon separator)
    const colonMatch = stripped.match(/^([^:]+?):\s+(.+)$/);
    if (colonMatch) {
      const value = colonMatch[2].replace(/[-.\s]+$/, '').trim();
      details.push({
        label: colonMatch[1].trim(),
        value: value || 'No information',
      });
      continue;
    }

    // Try "Label - Value" or "Label-Value" pattern (dash separator)
    const dashMatch = stripped.match(/^(.+?)\s*-\s*(.*)$/);
    if (dashMatch) {
      const value = dashMatch[2].replace(/[-.\s]+$/, '').trim();
      details.push({
        label: dashMatch[1].trim(),
        value: value || 'No information',
      });
      continue;
    }

    // Single value with no separator — use as label
    const singleValue = stripped.replace(/[-.\s]+$/, '').trim();
    if (singleValue) {
      details.push({ label: singleValue, value: 'No information' });
    }
  }
  return details;
}

const ASSOCIATED_SYMPTOM_LABELS = ['Patient reports', 'Patient denies'];

export function extractChiefComplaints(encounters: VisitDetailsEncounter[]): {
  chiefComplaints: string[];
  details: Detail[];
  associatedSymptoms?: AssociatedSymptom[];
} {
  const complaints: string[] = [];
  const allDetails: Detail[] = [];

  for (const encounter of encounters) {
    for (const obs of encounter.obs) {
      if (obs.concept?.uuid === CONCEPT_UUIDS.CHIEF_COMPLAINT) {
        const raw =
          typeof obs.value === 'string'
            ? obs.value
            : typeof obs.value === 'number'
              ? String(obs.value)
              : (obs.value?.display ?? '');
        const parsed = parseChiefComplaintValue(raw);
        if (parsed.name && !complaints.includes(parsed.name)) {
          complaints.push(parsed.name);
        }
        allDetails.push(...extractDetailsFromHtml(parsed.html));
      }
    }
  }

  const details = allDetails.filter(
    d => !ASSOCIATED_SYMPTOM_LABELS.includes(d.label)
  );
  const symptomDetails = allDetails.filter(d =>
    ASSOCIATED_SYMPTOM_LABELS.includes(d.label)
  );
  const associatedSymptoms: AssociatedSymptom[] = symptomDetails.map(d => ({
    heading: d.label,
    values: [d.value],
  }));

  return {
    chiefComplaints: complaints.length > 0 ? complaints : ['No information'],
    details,
    ...(associatedSymptoms.length > 0 ? { associatedSymptoms } : {}),
  };
}

export function extractPhysicalExamination(
  encounters: VisitDetailsEncounter[]
): { generalExams: GeneralExam[] } {
  const generalExams: GeneralExam[] = [];
  const physicalExamConcepts: string[] = [
    CONCEPT_UUIDS.PHYSICAL_EXAM_DISPLAY,
    CONCEPT_UUIDS.PHYSICAL_EXAMINATION,
  ];

  for (const encounter of encounters) {
    for (const obs of encounter.obs) {
      if (
        obs.concept?.uuid &&
        physicalExamConcepts.includes(obs.concept.uuid)
      ) {
        const raw =
          typeof obs.value === 'string'
            ? obs.value
            : typeof obs.value === 'number'
              ? String(obs.value)
              : (obs.value?.display ?? '');
        try {
          const parsed = JSON.parse(raw);
          if (typeof parsed === 'object' && parsed !== null) {
            // Handle ayu format: { en: "<html>", "l-en": "<html>" }
            const html = parsed.en || parsed['l-en'];
            if (html) {
              const details = extractDetailsFromHtml(html);
              for (const detail of details) {
                generalExams.push({ label: detail.label, value: detail.value });
              }
            } else {
              for (const [key, val] of Object.entries(parsed)) {
                generalExams.push({ label: key, value: String(val) });
              }
            }
          }
        } catch {
          // Not valid JSON — try extracting from raw HTML/text
          const details = extractDetailsFromHtml(raw);
          if (details.length > 0) {
            for (const detail of details) {
              generalExams.push({ label: detail.label, value: detail.value });
            }
          } else if (raw) {
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

/**
 * Extract HTML content from an obs value, handling JSON wrapper format.
 * OpenMRS obs values for history may be stored as JSON: {"en":"<html>","l-en":"<html>"}
 */
function resolveObsHtml(obsValue: string): string {
  try {
    const parsed = JSON.parse(obsValue);
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed.en || parsed['l-en'] || obsValue;
    }
  } catch {
    // Not JSON, use as-is
  }
  return obsValue;
}

/**
 * Parse family history format: "Do you have a family history...? : • Item1 (Relation), Item2 (Relation)."
 */
function extractFamilyHistoryItems(html: string): Detail[] {
  const text = html.replace(/<[^>]*>/g, '').trim();

  // Find content after a bullet character (•, ►, ●)
  const bulletIdx = text.search(/[•►●]/);
  if (bulletIdx < 0) return [];

  const content = text
    .substring(bulletIdx + 1)
    .replace(/[.\s]+$/, '')
    .trim();
  if (!content || content.toLowerCase() === 'none') return [];

  // Split by comma for multiple items: "Diabetes (Father), Hypertension (Mother)"
  return content
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(item => {
      const match = item.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      if (match) return { label: match[1].trim(), value: match[2].trim() };
      return { label: item, value: '' };
    });
}

export function extractMedicalHistory(
  encounters: VisitDetailsEncounter[]
): HistorySection[] {
  const patientHistoryDetails: Detail[] = [];
  const familyHistoryDetails: Detail[] = [];

  for (const encounter of encounters) {
    for (const obs of encounter.obs) {
      const rawValue =
        typeof obs.value === 'string'
          ? obs.value
          : typeof obs.value === 'number'
            ? String(obs.value)
            : (obs.value?.display ?? '');

      const html = resolveObsHtml(rawValue);

      if (obs.concept?.uuid === MEDICAL_HISTORY_CONCEPT) {
        const details = extractDetailsFromHtml(html);
        // Filter out generic "None" entries (e.g. "Medical History - None")
        patientHistoryDetails.push(
          ...details.filter(d => d.value.toLowerCase() !== 'none')
        );
      } else if (obs.concept?.uuid === FAMILY_HISTORY_CONCEPT) {
        // Try standard bullet format first, then family-specific format
        const details = extractDetailsFromHtml(html);
        const filtered = details.filter(d => d.value.toLowerCase() !== 'none');
        if (filtered.length > 0) {
          familyHistoryDetails.push(...filtered);
        } else {
          familyHistoryDetails.push(...extractFamilyHistoryItems(html));
        }
      }
    }
  }

  const sections: HistorySection[] = [];
  if (patientHistoryDetails.length > 0) {
    sections.push({ title: 'Patient History', details: patientHistoryDetails });
  }
  if (familyHistoryDetails.length > 0) {
    sections.push({ title: 'Family History', details: familyHistoryDetails });
  }
  return sections;
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
  const medicalHistory = extractMedicalHistory(encounters);

  // Extract specialty from visit attributes
  const specialityAttr = response.attributes?.find(
    attr => attr.attributeType?.uuid === VISIT_ATTR_SPECIALITY
  );
  const speciality = specialityAttr?.value ?? undefined;

  // Check if a priority-visit encounter exists
  const priorityVisit = encounters.some(
    enc => enc.encounterType?.uuid === ENCOUNTER_TYPE_PRIORITY
  );

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
    medicalHistory: medicalHistory.length > 0 ? medicalHistory : undefined,
    speciality,
    priorityVisit,
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
