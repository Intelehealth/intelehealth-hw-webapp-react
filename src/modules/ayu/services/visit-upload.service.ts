import type { ModalSectionItem } from '../../../components/modal/global-modal-context';
import { EmrMiddlewareApi } from '../../../services/patient.service';
import type { MedicalHistorySummary } from '../context/start-visit.context';
import { ITEM_TYPES } from '../utils/ayu.constants';
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
import type {
  EncounterObs,
  EncounterPayload,
  VisitUploadPayload,
  VisitUploadResponse,
} from '../types/visit-upload.types';
import type { VitalField, VitalsFormValues } from '../types/vitals.types';

function formatDatetime(date: Date): string {
  return date.toISOString().replace('Z', '+0000');
}

function makeObs(concept: string, value: string): EncounterObs {
  return { comments: '', concept, value };
}

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

export interface VisitReasonData {
  obsValue: string;
}

export function buildVisitReasonHtml(
  details: Array<{ label: string; value: string }>,
  reasonNames: string[]
): VisitReasonData {
  const complaint = reasonNames.join(', ');
  let displayHtml = '';
  let rawHtml = '';

  for (const { label, value } of details) {
    displayHtml += `• ${label} - ${value}.<br/>`;
    rawHtml += `● ${label}<br/>•${value}<br/>`;
  }

  return {
    obsValue: JSON.stringify({
      en: `►<b>${complaint}</b>: <br/>${displayHtml}`.trim(),
      'l-en': `►${complaint}::${rawHtml}`.trim(),
    }),
  };
}

export interface PhysicalExamData {
  obsValue: string;
}

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

    if (question.sectionLabel && question.sectionLabel !== currentSection) {
      currentSection = question.sectionLabel;
      const sectionName = currentSection.replace(/:$/, '');
      displayHtml += `<br/>►<b>${sectionName}: </b><br/>`;
      rawHtml += `►<b>${sectionName}: </b><br/>`;
    }

    const answerText = selectedTexts.join(', ').toLowerCase();
    displayHtml += `• ${question.categoryLabel}-${answerText}. <br/>`;

    rawHtml += `• ${question.categoryLabel}-● ${question.questionText}${question.isRequired ? '*' : ''}<br/>`;
    for (const text of selectedTexts) {
      rawHtml += `•${text}-<br/>`;
    }
  }

  return {
    obsValue: JSON.stringify({
      en: displayHtml.trim(),
      'l-en': rawHtml.trim(),
    }),
  };
}

export function buildMedicalHistoryData(sections: MedicalHistorySummary[]): {
  obsValue: string;
} {
  const items = sections.flatMap(s => s.items);
  let displayHtml = '';
  let rawHtml = '';

  for (const item of items) {
    if (item.type === ITEM_TYPES.LABEL_VALUE) {
      const val = String(item.value ?? 'None');
      displayHtml += `• ${item.label} - ${val}.<br/>`;
      rawHtml += `● ${item.label}<br/>•${val}<br/>`;
    }
  }

  if (!displayHtml) {
    displayHtml = '• Medical History - None.<br/>';
    rawHtml =
      '● Do you have a history of any of the following?*<br/>•None<br/>';
  }

  return {
    obsValue: JSON.stringify({
      en: displayHtml.trim(),
      'l-en': rawHtml.trim(),
    }),
  };
}

export function buildFamilyHistoryData(sections: MedicalHistorySummary[]): {
  obsValue: string;
} {
  const items = sections.flatMap(s => s.items);
  const parts = items
    .filter(
      (i): i is Extract<ModalSectionItem, { type: 'labelValue' }> =>
        i.type === ITEM_TYPES.LABEL_VALUE
    )
    .map(i => {
      const relation = i.value ? ` (${i.value})` : '';
      return `${i.label}${relation}`;
    });

  const summary = parts.length > 0 ? parts.join(', ') : 'None';
  const displayHtml = `Do you have a family history of any of the following? : • ${summary}.<br/>`;
  const rawHtml = `Do you have a family history of any of the following? : •${summary}.<br/>`;

  return {
    obsValue: JSON.stringify({
      en: displayHtml.trim(),
      'l-en': rawHtml.trim(),
    }),
  };
}

interface AdultInitialData {
  visitReason: VisitReasonData;
  physicalExam: PhysicalExamData;
  medicalHistory: { obsValue: string };
  familyHistory: { obsValue: string };
}

function buildAdultInitialObs(data: AdultInitialData): EncounterObs[] {
  return [
    makeObs(
      ADULT_INITIAL_CONCEPTS.VISIT_REASON_DISPLAY,
      data.visitReason.obsValue
    ),
    makeObs(
      ADULT_INITIAL_CONCEPTS.PHYSICAL_EXAM_DISPLAY,
      data.physicalExam.obsValue
    ),
    makeObs(
      ADULT_INITIAL_CONCEPTS.MEDICAL_HISTORY_DISPLAY,
      data.medicalHistory.obsValue
    ),
    makeObs(
      ADULT_INITIAL_CONCEPTS.FAMILY_HISTORY_DISPLAY,
      data.familyHistory.obsValue
    ),
  ];
}

export interface BuildVisitUploadParams {
  patientUuid: string;
  providerUuid: string;
  locationUuid: string;
  vitalsFormValues: VitalsFormValues;
  vitalsConfig: VitalField[];
  visitReason: VisitReasonData;
  physicalExam: PhysicalExamData;
  medicalHistory: { obsValue: string };
  familyHistory: { obsValue: string };
  speciality?: string;
  priorityVisit?: boolean;
  doctorNotes?: string;
}

export function buildVisitUploadPayload(
  params: BuildVisitUploadParams
): VisitUploadPayload {
  const now = new Date();
  const encounterDatetime = formatDatetime(now);
  const visitCompleteDatetime = formatDatetime(new Date(now.getTime() + 1000));

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

  const vitalsEncounter: EncounterPayload = {
    ...baseEncounter,
    encounterDatetime,
    encounterType: ENCOUNTER_TYPES.VITALS,
    obs: buildVitalsObs(params.vitalsFormValues, params.vitalsConfig),
  };

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

  const visitPriorityEncounter: EncounterPayload = {
    ...baseEncounter,
    encounterDatetime: visitCompleteDatetime,
    encounterType: ENCOUNTER_TYPES.VISIT_PRIORITY,
  };

  return {
    encounters: params.priorityVisit
      ? [vitalsEncounter, adultInitialEncounter, visitPriorityEncounter]
      : [vitalsEncounter, adultInitialEncounter],
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
            value: params.doctorNotes || 'No notes added for Doctor.',
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

const VISIT_UPLOAD_ENDPOINT = '/push/visit-encounters';

export async function uploadVisit(
  payload: VisitUploadPayload
): Promise<VisitUploadResponse> {
  return EmrMiddlewareApi.post<VisitUploadResponse>(
    VISIT_UPLOAD_ENDPOINT,
    payload
  );
}
