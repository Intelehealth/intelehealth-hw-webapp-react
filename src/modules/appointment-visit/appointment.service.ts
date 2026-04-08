import { HttpService } from '../../services/http';
import { EmrMiddlewareApi } from '../../services/patient.service';
import { OpenMRSApi } from '../../services/openmrs';
import { storage } from '../../utils/storage';
import type {
  AppointmentSlot,
  AppointmentSlotsApiResponse,
  RawVisitResponse,
  SlotPeriod,
} from '../../assets/data/appointments.data';
import {
  APPOINTMENT_SCHEDULE_ATTR_TYPE,
  PUSH_DATA_ENDPOINT,
  PUSHDATA_CUSTOM_REP,
} from '../../assets/data/appointments.data';

const APPOINTMENT_BASE_URL = import.meta.env.VITE_PORTAL_API_URL;

class AppointmentApiService extends HttpService {
  constructor() {
    super({ baseURL: APPOINTMENT_BASE_URL });

    this.axiosInstance.interceptors.request.use(config => {
      const token = storage.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers['Cache-Control'] = 'no-cache';
      return config;
    });
  }
}

const AppointmentApi = new AppointmentApiService();

// Re-export types for consumers
export type { SlotPeriod, AppointmentSlot, RawVisitResponse };

// ─── Date / time helpers ─────────────────────────────────────────────────────

/** Converts YYYY-MM-DD → DD/MM/YYYY (API format) */
function toApiDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/** Converts DD/MM/YYYY (API format) → YYYY-MM-DD */
function fromApiDate(ddmmyyyy: string): string {
  const [day, month, year] = ddmmyyyy.split('/');
  return `${year}-${month}-${day}`;
}

/** Determines Morning / Afternoon / Evening from a time string like "5:00 PM" */
function getPeriod(slotTime: string): SlotPeriod {
  const lower = slotTime.toLowerCase();
  const [time, meridiem] = lower.split(' ');
  const [hourStr, minStr] = time.split(':');
  let hour = parseInt(hourStr, 10);
  const min = parseInt(minStr, 10);
  if (meridiem === 'pm' && hour !== 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;
  const totalMinutes = hour * 60 + min;
  if (totalMinutes < 12 * 60) return 'Morning';
  if (totalMinutes <= 18 * 60) return 'Afternoon';
  return 'Evening';
}

// ─── Payload Builder ──────────────────────────────────────────────────────────

export function buildPushDataPayload(
  visit: RawVisitResponse,
  appointmentDatetime: string
) {
  const encounters = visit.encounters.map(enc => ({
    encounterDatetime: enc.encounterDatetime,
    encounterProviders: enc.encounterProviders.map(ep => ({
      encounterRole: ep.encounterRole.uuid,
      provider: ep.provider.uuid,
    })),
    encounterType: enc.encounterType.uuid,
    location: visit.location.uuid,
    obs: enc.obs.map(o => ({
      comments: o.comment ?? '',
      concept: o.concept.uuid,
      uuid: o.uuid,
      value: typeof o.value === 'string' ? o.value : o.value.uuid,
    })),
    patient: visit.patient.uuid,
    uuid: enc.uuid,
    visit: visit.uuid,
    voided: 0,
  }));

  const attributes = visit.attributes.map(attr => ({
    attributeType: attr.attributeType.uuid,
    uuid: attr.uuid,
    value:
      attr.attributeType.uuid === APPOINTMENT_SCHEDULE_ATTR_TYPE
        ? appointmentDatetime
        : attr.value,
  }));

  // Add appointment schedule attribute if not already present
  if (
    !attributes.some(a => a.attributeType === APPOINTMENT_SCHEDULE_ATTR_TYPE)
  ) {
    attributes.push({
      attributeType: APPOINTMENT_SCHEDULE_ATTR_TYPE,
      uuid: '',
      value: appointmentDatetime,
    });
  }

  return {
    appointments: [],
    encounters,
    patients: [],
    persons: [],
    providers: [],
    visits: [
      {
        attributes,
        location: visit.location.uuid,
        patient: visit.patient.uuid,
        startDatetime: visit.startDatetime,
        uuid: visit.uuid,
        visitType: visit.visitType.uuid,
      },
    ],
  };
}

// ─── API Endpoints ────────────────────────────────────────────────────────────

export const appointmentService = {
  async getAppointmentSlots(
    fromDate: string,
    toDate: string,
    speciality: string
  ): Promise<AppointmentSlot[]> {
    const apiFrom = toApiDate(fromDate);
    const apiTo = toApiDate(toDate);
    const url = `/appointment/getAppointmentSlots?fromDate=${encodeURIComponent(apiFrom)}&toDate=${encodeURIComponent(apiTo)}&speciality=${encodeURIComponent(speciality)}`;
    const res = await AppointmentApi.get<AppointmentSlotsApiResponse>(url);
    return (res.dates ?? []).map(slot => ({
      slotId: `${slot.slotDate}-${slot.slotTime.replace(/\s+/g, '-')}`,
      date: fromApiDate(slot.slotDate),
      time: slot.slotTime.toLowerCase(),
      isAvailable: true,
      period: getPeriod(slot.slotTime),
      speciality: slot.speciality,
    }));
  },

  async getVisitForPushData(visitUuid: string): Promise<RawVisitResponse> {
    return OpenMRSApi.get<RawVisitResponse>(
      `/visit/${visitUuid}?v=${PUSHDATA_CUSTOM_REP}`
    );
  },

  async bookAppointment(
    visitUuid: string,
    appointmentDatetime: string
  ): Promise<unknown> {
    const visitData = await this.getVisitForPushData(visitUuid);
    const payload = buildPushDataPayload(visitData, appointmentDatetime);
    return EmrMiddlewareApi.post(PUSH_DATA_ENDPOINT, payload);
  },
};
