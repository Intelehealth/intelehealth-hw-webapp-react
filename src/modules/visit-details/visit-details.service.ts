import { OpenMRSApi } from '../../services/openmrs';
import type {
  VisitDetailsResponse,
  TransformedVisitDetails,
} from './visit-details.types';

export const API_ENDPOINTS = {
  VISIT: '/visit',
} as const;

const CONCEPT_UUIDS = {
  CHIEF_COMPLAINT: '3edb0e09-9135-481e-b8f0-07a26fa9a5ce',
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

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getPatientIdentifier(
  patient: VisitDetailsResponse['patient']
): string {
  const identifier = patient.identifiers?.[0];
  return identifier?.identifier ?? '';
}

function getPhoneNumber(patient: VisitDetailsResponse['patient']): string {
  const phoneAttr = patient.person?.attributes?.find(
    attr =>
      attr.attributeType?.display?.toLowerCase().includes('telephone') ||
      attr.attributeType?.display?.toLowerCase().includes('phone')
  );
  return phoneAttr?.value ?? '';
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

function getChiefComplaint(encounters: VisitDetailsResponse['encounters']): {
  name: string;
  html: string;
} {
  for (const encounter of encounters) {
    for (const obs of encounter.obs) {
      if (obs.concept?.uuid === CONCEPT_UUIDS.CHIEF_COMPLAINT) {
        const raw =
          typeof obs.value === 'string'
            ? obs.value
            : (obs.value?.display ?? '');
        return parseChiefComplaintValue(raw);
      }
      if (obs.concept?.display?.toLowerCase().includes('chief complaint')) {
        const raw =
          typeof obs.value === 'string'
            ? obs.value
            : (obs.value?.display ?? '');
        return parseChiefComplaintValue(raw);
      }
    }
  }
  return { name: 'Not available', html: '' };
}

function getFollowUpDate(
  encounters: VisitDetailsResponse['encounters']
): string | null {
  for (const encounter of encounters) {
    for (const obs of encounter.obs) {
      if (
        obs.concept?.uuid === CONCEPT_UUIDS.FOLLOW_UP_DATE ||
        obs.concept?.display?.toLowerCase().includes('follow')
      ) {
        const val =
          typeof obs.value === 'string' ? obs.value : obs.value?.display;
        return val ?? null;
      }
    }
  }
  return null;
}

function getDoctorInfo(encounters: VisitDetailsResponse['encounters']): {
  name: string;
  speciality: string;
} {
  for (const encounter of encounters) {
    const provider = encounter.encounterProviders?.[0]?.provider;
    if (provider) {
      const specialityAttr = provider.attributes?.find(
        attr =>
          attr.attributeType?.display?.toLowerCase().includes('special') ||
          attr.attributeType?.display?.toLowerCase().includes('qualification')
      );
      return {
        name: provider.person?.display ?? provider.display ?? '',
        speciality: specialityAttr?.value ?? 'General Physician',
      };
    }
  }
  return { name: '', speciality: 'General Physician' };
}

function getPrescriptionDate(
  encounters: VisitDetailsResponse['encounters']
): string | null {
  const prescriptionEncounter = encounters.find(
    e =>
      e.encounterType?.display?.toLowerCase().includes('prescription') ||
      e.encounterType?.display?.toLowerCase().includes('visit complete')
  );
  return prescriptionEncounter?.encounterDatetime ?? null;
}

function transformVisitResponse(
  response: VisitDetailsResponse
): TransformedVisitDetails {
  const { patient, encounters } = response;
  const doctor = getDoctorInfo(encounters);
  const prescriptionDateRaw = getPrescriptionDate(encounters);
  const followUpDateRaw = getFollowUpDate(encounters);
  const chiefComplaint = getChiefComplaint(encounters);

  return {
    visitUuid: response.uuid,
    visitId: response.uuid.substring(response.uuid.length - 8),
    patientName: patient.person?.preferredName
      ? `${patient.person.preferredName.givenName} ${patient.person.preferredName.familyName}`
      : (patient.display ?? ''),
    patientUuid: patient.uuid,
    gender: patient.person?.gender === 'M' ? 'Male' : 'Female',
    age: patient.person?.age ?? 0,
    patientIdentifier: getPatientIdentifier(patient),
    chiefComplaint: chiefComplaint.name,
    chiefComplaintHtml: chiefComplaint.html,
    visitDate: formatDate(response.startDatetime),
    visitTime: formatTime(response.startDatetime),
    doctorName: doctor.name,
    doctorSpeciality: doctor.speciality,
    visitStatus: response.stopDatetime ? 'Closed' : 'Active',
    prescriptionDate: prescriptionDateRaw
      ? formatDate(prescriptionDateRaw)
      : null,
    followUpDate: followUpDateRaw ? formatDate(followUpDateRaw) : null,
    phoneNumber: getPhoneNumber(patient),
  };
}

export const visitDetailsService = {
  getVisitDetails: async (
    visitUuid: string
  ): Promise<TransformedVisitDetails> => {
    const response = await OpenMRSApi.get<VisitDetailsResponse>(
      `${API_ENDPOINTS.VISIT}/${visitUuid}?v=custom:(location:(display),uuid,display,startDatetime,dateCreated,stopDatetime,encounters:(display,uuid,encounterDatetime,encounterType:(display),obs:(display,uuid,value,concept:(uuid,display)),encounterProviders:(display,provider:(uuid,attributes,person:(uuid,display,gender,age)))),patient:(uuid,identifiers:(identifier,identifierType:(name,uuid,display)),attributes,person:(display,gender,age)),attributes)`
    );
    return transformVisitResponse(response);
  },

  endVisit: async (visitUuid: string) => {
    const payload = {
      stopDatetime: new Date().toISOString(),
    };
    return OpenMRSApi.post(`${API_ENDPOINTS.VISIT}/${visitUuid}`, payload);
  },
};

export default visitDetailsService;
