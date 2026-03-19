import { EmrMiddlewareApi } from '../../../services/patient.service';
import {
  ADULT_INITIAL_CONCEPTS,
  ENCOUNTER_ROLE,
  ENCOUNTER_TYPES,
  VISIT_ATTRIBUTE_TYPES,
  VISIT_TYPE,
} from '../constants/visit-upload.constants';
import type {
  PhysicalExamAnswers,
  PhysicalExamQuestion,
} from '../data/physical-exam.data';
import type { VitalField } from '../types/vitals.types';
import type { VitalsFormValues } from '../types/vitals.types';
import type {
  EncounterObs,
  EncounterPayload,
  VisitUploadPayload,
} from '../types/visit-upload.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a Date to ISO string with timezone offset (e.g. +0530) */
function formatDatetime(date: Date): string {
  return date.toISOString().replace('Z', '+0000');
}

function makeObs(concept: string, value: string): EncounterObs {
  return { comments: '', concept, value };
}

// ─── Vitals Encounter Builder ─────────────────────────────────────────────────

/**
 * Build obs array for the Vitals encounter from form values and config.
 * Only includes vitals that have a non-empty value.
 */
function buildVitalsObs(
  formValues: VitalsFormValues,
  vitalsConfig: VitalField[]
): EncounterObs[] {
  const obs: EncounterObs[] = [];

  for (const field of vitalsConfig) {
    const value = formValues[field.key as keyof VitalsFormValues];
    if (value != null && value !== '') {
      obs.push(makeObs(field.uuid, String(value)));
    }
  }

  return obs;
}

// ─── Visit Reason HTML Builder ────────────────────────────────────────────────

export interface VisitReasonData {
  displayHtml: string;
  rawJson: string;
}

// ─── Physical Exam HTML Builder ───────────────────────────────────────────────

export interface PhysicalExamData {
  displayHtml: string;
  rawJson: string;
}

/**
 * Build physical exam display HTML and raw JSON from answers.
 *
 * Display format example:
 *   <b>General exams: </b><br/>• Eyes: Jaundice-no jaundice seen. <br/>
 *
 * Raw format example:
 *   ►<b>General exams: </b><br/>• Eyes: Jaundice-● Is there jaundice?*<br/>•No-<br/>
 */
export function buildPhysicalExamData(
  answers: PhysicalExamAnswers,
  questions: PhysicalExamQuestion[]
): PhysicalExamData {
  let displayHtml = '';
  let rawHtml = '';
  let currentSection = '';

  for (const question of questions) {
    const selectedIds = answers[question.id] ?? [];
    if (selectedIds.length === 0) continue;

    const selectedTexts = selectedIds
      .map(id => question.options.find(o => o.id === id)?.text)
      .filter(Boolean);

    if (!selectedTexts.length) continue;

    // Add section header if new section
    if (question.sectionLabel && question.sectionLabel !== currentSection) {
      currentSection = question.sectionLabel;
      const sectionName = currentSection.replace(/:$/, '');
      displayHtml += `►<b>${sectionName}: </b><br/>`;
      rawHtml += `►<b>${sectionName}: </b><br/>`;
    }

    // Display format: • Category-answer text.
    const answerText = selectedTexts.join(', ').toLowerCase();
    displayHtml += `• ${question.categoryLabel}-${answerText}. <br/>`;

    // Raw format: • Category-● QuestionText*<br/>•Answer-<br/>
    rawHtml += `• ${question.categoryLabel}-● ${question.questionText}${question.isRequired ? '*' : ''}<br/>`;
    for (const text of selectedTexts) {
      rawHtml += `•${text}-<br/>`;
    }
  }

  return {
    displayHtml: displayHtml.trim(),
    rawJson: JSON.stringify({ text_en: rawHtml.trim() }),
  };
}

// ─── Medical History HTML Builder ─────────────────────────────────────────────

export interface MedicalHistoryCondition {
  name: string;
  hasCondition: string | null;
}

export function buildMedicalHistoryData(
  conditions: MedicalHistoryCondition[]
): { displayHtml: string; rawJson: string } {
  const lines: string[] = [];
  const rawLines: string[] = [];

  // For now, create a summary of conditions
  const yesConditions = conditions.filter(c => c.hasCondition === 'Yes');
  const medicalHistory =
    yesConditions.length > 0
      ? yesConditions.map(c => c.name).join(', ')
      : 'None';

  lines.push(`• Medical History - ${medicalHistory}.<br/>`);
  rawLines.push(
    `● Do you have a history of any of the following?*<br/>•${medicalHistory}<br/>`
  );

  const displayHtml = lines.join('');
  const rawJson = JSON.stringify({ text_en: rawLines.join('') });

  return { displayHtml, rawJson };
}

// ─── Family History HTML Builder ──────────────────────────────────────────────

export interface FamilyHistoryCondition {
  name: string;
  hasCondition: string | null;
  relation?: string;
  describeRelation?: string;
}

export function buildFamilyHistoryData(
  conditions: FamilyHistoryCondition[]
): { displayHtml: string; rawJson: string } {
  const yesConditions = conditions.filter(c => c.hasCondition === 'Yes');
  const parts =
    yesConditions.length > 0
      ? yesConditions
          .map(c => {
            const relation = c.relation
              ? c.relation === 'Other' && c.describeRelation
                ? ` (${c.describeRelation})`
                : ` (${c.relation})`
              : '';
            return `${c.name}${relation}`;
          })
          .join(', ')
      : 'None';

  const displayHtml = `•Do you have a family history of any of the following?* : • ${parts}.<br/>`;
  const rawJson = JSON.stringify({
    text_en: `•Do you have a family history of any of the following?* : •${parts}.<br/>`,
  });

  return { displayHtml, rawJson };
}

// ─── Adult Initial Encounter Builder ──────────────────────────────────────────

interface AdultInitialData {
  visitReason: VisitReasonData;
  physicalExam: PhysicalExamData;
  medicalHistory: { displayHtml: string; rawJson: string };
  familyHistory: { displayHtml: string; rawJson: string };
}

function buildAdultInitialObs(data: AdultInitialData): EncounterObs[] {
  return [
    makeObs(
      ADULT_INITIAL_CONCEPTS.VISIT_REASON_DISPLAY,
      data.visitReason.displayHtml
    ),
    makeObs(
      ADULT_INITIAL_CONCEPTS.VISIT_REASON_RAW,
      data.visitReason.rawJson
    ),
    makeObs(
      ADULT_INITIAL_CONCEPTS.PHYSICAL_EXAM_DISPLAY,
      data.physicalExam.displayHtml
    ),
    makeObs(
      ADULT_INITIAL_CONCEPTS.PHYSICAL_EXAM_RAW,
      data.physicalExam.rawJson
    ),
    makeObs(
      ADULT_INITIAL_CONCEPTS.MEDICAL_HISTORY_DISPLAY,
      data.medicalHistory.displayHtml
    ),
    makeObs(
      ADULT_INITIAL_CONCEPTS.MEDICAL_HISTORY_RAW,
      data.medicalHistory.rawJson
    ),
    makeObs(
      ADULT_INITIAL_CONCEPTS.FAMILY_HISTORY_DISPLAY,
      data.familyHistory.displayHtml
    ),
    makeObs(
      ADULT_INITIAL_CONCEPTS.FAMILY_HISTORY_RAW,
      data.familyHistory.rawJson
    ),
  ];
}

// ─── Full Payload Builder ─────────────────────────────────────────────────────

export interface BuildVisitUploadParams {
  patientUuid: string;
  providerUuid: string;
  locationUuid: string;
  vitalsFormValues: VitalsFormValues;
  vitalsConfig: VitalField[];
  visitReason: VisitReasonData;
  physicalExam: PhysicalExamData;
  medicalHistory: { displayHtml: string; rawJson: string };
  familyHistory: { displayHtml: string; rawJson: string };
  speciality?: string;
}

/**
 * Builds the complete visit upload payload matching the OpenMRS API format.
 *
 * Structure:
 * - encounters[0]: Vitals encounter (encounterType: VITALS)
 * - encounters[1]: Adult Initial encounter (encounterType: ADULT_INITIAL) with HTML obs
 * - encounters[2]: Visit Complete encounter (encounterType: VISIT_COMPLETE)
 * - visits[0]: Visit with attributes (speciality, datetime, doctor notes)
 */
export function buildVisitUploadPayload(
  params: BuildVisitUploadParams
): VisitUploadPayload {
  const now = new Date();
  const encounterDatetime = formatDatetime(now);
  const visitCompleteDatetime = formatDatetime(
    new Date(now.getTime() + 1000)
  );

  const encounterProviders = [
    {
      encounterRole: ENCOUNTER_ROLE,
      provider: params.providerUuid,
    },
  ];

  const baseEncounter = {
    encounterProviders,
    location: params.locationUuid,
    patient: params.patientUuid,
    voided: 0,
  };

  // Encounter 1: Vitals
  const vitalsEncounter: EncounterPayload = {
    ...baseEncounter,
    encounterDatetime,
    encounterType: ENCOUNTER_TYPES.VITALS,
    obs: buildVitalsObs(params.vitalsFormValues, params.vitalsConfig),
  };

  // Encounter 2: Adult Initial (visit reason + physical exam + medical history + family history)
  const adultInitialEncounter: EncounterPayload = {
    ...baseEncounter,
    encounterDatetime,
    encounterType: ENCOUNTER_TYPES.ADULT_INITIAL,
    obs: buildAdultInitialObs({
      visitReason: params.visitReason,
      physicalExam: params.physicalExam,
      medicalHistory: params.medicalHistory,
      familyHistory: params.familyHistory,
    }),
  };

  // Encounter 3: Visit Complete
  const visitCompleteEncounter: EncounterPayload = {
    ...baseEncounter,
    encounterDatetime: visitCompleteDatetime,
    encounterType: ENCOUNTER_TYPES.VISIT_COMPLETE,
  };

  return {
    encounters: [vitalsEncounter, adultInitialEncounter, visitCompleteEncounter],
    visits: [
      {
        attributes: [
          {
            attributeType: VISIT_ATTRIBUTE_TYPES.SPECIALITY,
            value: params.speciality ?? 'General Physician',
          },
          {
            attributeType: VISIT_ATTRIBUTE_TYPES.VISIT_COMPLETE_DATETIME,
            value: visitCompleteDatetime,
          },
          {
            attributeType: VISIT_ATTRIBUTE_TYPES.DOCTOR_NOTES,
            value: 'No notes added for Doctor.',
          },
        ],
        location: params.locationUuid,
        patient: params.patientUuid,
        startDatetime: encounterDatetime,
        visitType: VISIT_TYPE,
      },
    ],
  };
}

// ─── API Call ─────────────────────────────────────────────────────────────────

const VISIT_UPLOAD_ENDPOINT = '/push/visit-encounters';

/**
 * Upload the complete visit payload via the EMR Middleware.
 */
export async function uploadVisit(
  payload: VisitUploadPayload
): Promise<unknown> {
  return EmrMiddlewareApi.post(VISIT_UPLOAD_ENDPOINT, payload);
}
