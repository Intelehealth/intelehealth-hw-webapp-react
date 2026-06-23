import type { ModalSectionItem } from '../../../components/modal/global-modal-context';
import { EmrMiddlewareApi } from '../../../services/patient.service';
import {
  ADULT_INITIAL_CONCEPTS,
  ENCOUNTER_ROLE,
  ENCOUNTER_TYPES,
  VISIT_ATTRIBUTE_TYPES,
  VISIT_TYPE,
} from '../constants/visit-upload.constants';
import type { MedicalHistorySummary } from '../context/start-visit.context';
import type {
  PhysicalExamAnswers,
  PhysicalExamOption,
  PhysicalExamQuestion,
} from '../types/physical-exam.types';
import type {
  EncounterObs,
  EncounterPayload,
  VisitUploadPayload,
  VisitUploadResponse,
} from '../types/visit-upload.types';
import type { VitalField, VitalsFormValues } from '../types/vitals.types';
import { ITEM_TYPES, PE_PICTURE_TAKEN_LABEL } from '../utils/ayu.constants';

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

export interface VisitReasonSection {
  title: string;
  items: ModalSectionItem[];
}

function sectionItemToLabelValue(item: ModalSectionItem): {
  label: string;
  value: string;
} {
  if (item.type === 'subheading') {
    return { label: item.heading, value: item.values.join(', ') };
  }
  return { label: item.label, value: String(item.value ?? '') };
}

export function buildVisitReasonHtml(
  details: Array<{ label: string; value: string }>,
  reasonNames: string[],
  detailsSections?: VisitReasonSection[]
): VisitReasonData {
  const sections = (detailsSections ?? []).filter(s => s.items.length > 0);
  if (sections.length > 1) {
    let displayHtml = '';
    let rawHtml = '';
    for (const section of sections) {
      displayHtml += `►<b>${section.title}</b>: <br/>`;
      rawHtml += `►${section.title}::`;
      for (const item of section.items) {
        const { label, value } = sectionItemToLabelValue(item);
        displayHtml += `• ${label} - ${value}.<br/>`;
        rawHtml += `● ${label}<br/>•${value}<br/>`;
      }
    }
    return {
      obsValue: JSON.stringify({
        en: displayHtml.trim(),
        'l-en': rawHtml.trim(),
      }),
    };
  }

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

  const pictureTag = `[${PE_PICTURE_TAKEN_LABEL}]`;

  for (const question of questions) {
    const selectedIds = answers[question.id] ?? [];
    if (selectedIds.length === 0) continue;

    const selectedOptions = selectedIds
      .map(id => question.options.find(o => o.id === id))
      .filter((o): o is PhysicalExamOption => Boolean(o));

    // "Picture Taken" is an annotation on the finding, not an answer of its
    // own — e.g. selecting "Yes" + capturing a photo reads "yes [Picture
    // Taken]" rather than listing "picture taken" as a separate answer.
    const answerTexts = selectedOptions
      .filter(o => !o.isCamera)
      .map(o => o.text)
      .filter(Boolean);
    const hasPicture = selectedOptions.some(o => o.isCamera);

    if (answerTexts.length === 0 && !hasPicture) continue;

    if (question.sectionLabel && question.sectionLabel !== currentSection) {
      currentSection = question.sectionLabel;
      const sectionName = currentSection.replace(/:$/, '');
      displayHtml += `<br/>►<b>${sectionName}: </b><br/>`;
      rawHtml += `►<b>${sectionName}: </b><br/>`;
    }

    const baseText = answerTexts.join(', ').toLowerCase();
    const answerText = hasPicture
      ? `${baseText ? `${baseText} ` : ''}${pictureTag}`
      : baseText;
    displayHtml += `• ${question.categoryLabel}-${answerText}. <br/>`;

    rawHtml += `• ${question.categoryLabel}-● ${question.questionText}${question.isRequired ? '*' : ''}<br/>`;
    if (answerTexts.length === 0) {
      // Picture-only finding.
      rawHtml += `•${pictureTag}-<br/>`;
    } else {
      answerTexts.forEach((text, idx) => {
        const isLast = idx === answerTexts.length - 1;
        const suffix = hasPicture && isLast ? ` ${pictureTag}` : '';
        rawHtml += `•${text}${suffix}-<br/>`;
      });
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
            value: params.speciality ?? '',
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
