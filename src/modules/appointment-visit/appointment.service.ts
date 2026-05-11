import { HttpService } from '../../services/http';
import { EmrMiddlewareApi } from '../../services/patient.service';
import { OpenMRSApi } from '../../services/openmrs';
import { storage } from '../../utils/storage';
import type {
  AppointmentListItem,
  AppointmentSlot,
  AppointmentSlotsApiResponse,
  RawUserAppointment,
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
export type {
  SlotPeriod,
  AppointmentSlot,
  AppointmentListItem,
  RawVisitResponse,
};

// ─── Date / time helpers ─────────────────────────────────────────────────────

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

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Converts YYYY-MM-DD → DD/MM/YYYY (API query param format, zero-padded) */
function toApiDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

/** Parses a slot date from the API response using slotDate (DD/MM/YYYY) + slotTime */
function parseSlotDate(raw: RawUserAppointment): Date {
  const isoDate = fromApiDate(raw.slotDate);
  const timePart = raw.slotTime || '12:00 PM';
  return new Date(`${isoDate} ${timePart}`);
}

/** Formats "DD/MM/YYYY" + "5:00 PM" → "10 Oct 2025, at 5:00 pm" */
function formatDateTime(slotDate: string, slotTime: string): string {
  const [day, month, year] = slotDate.split('/');
  const monthIdx = parseInt(month, 10) - 1;
  const monthName = MONTH_NAMES[monthIdx] || month;
  const time = slotTime.toLowerCase();
  return `${parseInt(day, 10)} ${monthName} ${year}, at ${time}`;
}

/** Calculates a human-readable time-until string for upcoming appointments */
function formatTimeUntil(slotDate: Date, now: Date, slotTime: string): string {
  const diff = slotDate.getTime() - now.getTime();
  if (diff <= 0) return '';

  const totalMinutes = Math.floor(diff / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const time = slotTime.toLowerCase();

  if (days > 0) return `in ${days} Day${days > 1 ? 's' : ''} at ${time}`;
  if (hours > 0)
    return `in ${hours} Hour${hours > 1 ? 's' : ''} ${minutes} min at ${time}`;
  return `in ${minutes} min at ${time}`;
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
    const url = `/appointment/getAppointmentSlots?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&speciality=${encodeURIComponent(speciality)}`;
    const res = await AppointmentApi.get<AppointmentSlotsApiResponse>(url);
    console.warn('[getAppointmentSlots] url:', url, 'response:', res);
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

  async getUserAppointments(
    fromDate: string,
    toDate: string
  ): Promise<AppointmentListItem[]> {
    const apiFrom = toApiDate(fromDate);
    const apiTo = toApiDate(toDate);
    const speciality = 'General Physician';
    const url = `/appointment/getAppointmentSlots?fromDate=${encodeURIComponent(apiFrom)}&toDate=${encodeURIComponent(apiTo)}&speciality=${encodeURIComponent(speciality)}`;
    const res = await AppointmentApi.get<AppointmentSlotsApiResponse>(url);
    console.warn('[getUserAppointments] url:', url, 'response:', res);
    const appointments = res.bookedAppointments ?? [];
    console.warn(
      '[getUserAppointments] appointments count:',
      appointments.length
    );
    const now = new Date();
    return appointments.map((raw, index) => {
      const slotDate = parseSlotDate(raw);
      const isPast = slotDate.getTime() <= now.getTime();
      return {
        id: raw.appointmentId ?? index + 1,
        patientName: raw.patientName,
        gender: raw.patientGender,
        age: raw.patientAge,
        visitId: raw.visitUuid,
        openMrsId: raw.openMrsId,
        symptom: raw.reason || '',
        dateTime: formatDateTime(raw.slotDate, raw.slotTime),
        slotDay: raw.slotDay,
        clinic: '',
        prescription: false,
        status: raw.syncd ? 'Completed' : 'Scheduled',
        speciality: raw.speciality,
        drName: raw.drName,
        hwName: raw.hwName,
        type: isPast ? 'past' : 'upcoming',
        timeUntil: isPast ? '' : formatTimeUntil(slotDate, now, raw.slotTime),
      };
    });
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
