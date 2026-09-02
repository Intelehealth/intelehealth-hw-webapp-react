import type {
  AppointmentListItem,
  AppointmentSlot,
  AppointmentSlotsApiResponse,
  BookingHealthWorker,
  BookingVisitResponse,
  GetSlotsApiResponse,
  PushAppointment,
  RawBookedAppointment,
  RawVisitResponse,
  SlotPeriod,
} from '../../assets/data/appointments.data';
import {
  APPOINTMENT_SCHEDULE_ATTR_TYPE,
  BOOKING_VISIT_REP,
  CANCEL_APPOINTMENT_ENDPOINT,
  GET_SLOTS_ENDPOINT,
  PUSH_DATA_ENDPOINT,
  PUSHDATA_CUSTOM_REP,
} from '../../assets/data/appointments.data';
import { HttpService } from '../../services/http';
import { OpenMRSApi } from '../../services/openmrs';
import { EmrMiddlewareApi } from '../../services/patient.service';
import { storage } from '../../utils/storage';

const APPOINTMENT_BASE_URL = import.meta.env.VITE_PORTAL_API_URL;

class AppointmentApiService extends HttpService {
  constructor() {
    super({ baseURL: APPOINTMENT_BASE_URL });

    this.axiosInstance.interceptors.request.use(config => {
      const token = storage.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }
}

const AppointmentApi = new AppointmentApiService();

export type { AppointmentSlot, RawVisitResponse, SlotPeriod };

function fromApiDate(ddmmyyyy: string): string {
  const [day, month, year] = ddmmyyyy.split('/');
  return `${year}-${month}-${day}`;
}

function toApiDate(yyyymmdd: string): string {
  const [year, month, day] = yyyymmdd.split('-');
  return `${day}/${month}/${year}`;
}

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

const MONTHS = [
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

function formatDateTime(slotDate: string | null, slotTime: string | null) {
  if (!slotDate) return '';
  const [day, month, year] = slotDate.split('/');
  const monthName = MONTHS[Number.parseInt(month, 10) - 1] ?? month;
  const datePart = `${Number.parseInt(day, 10)} ${monthName} ${year}`;
  return slotTime ? `${datePart}, at ${slotTime.toLowerCase()}` : datePart;
}

function formatTimeUntil(slot: Date, now: Date) {
  const diffMs = slot.getTime() - now.getTime();
  if (diffMs <= 0) return '';

  const totalMinutes = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `in ${days} Day${days > 1 ? 's' : ''} ${hours} Hours`;
  if (hours > 0) return `in ${hours} Hours ${minutes} min`;
  return `in ${minutes} min`;
}

export function mapBookedAppointment(
  raw: RawBookedAppointment,
  now: Date = new Date(),
  clinicName = ''
): AppointmentListItem {
  const slot = raw.slotJsDate ? new Date(raw.slotJsDate) : null;
  const status = raw.status.toUpperCase();
  const isValid = !!slot && !Number.isNaN(slot.getTime());

  const isUpcoming =
    isValid && slot.getTime() >= now.getTime() && status === 'BOOKED';

  return {
    id: raw.id,
    patientName: raw.patientName,
    gender: raw.patientGender ?? '',
    age: raw.patientAge ?? '',
    visitId: raw.visitUuid,
    openMrsId: raw.openMrsId,
    symptom: raw.speciality,
    dateTime: formatDateTime(raw.slotDate, raw.slotTime),
    slotDay: raw.slotDay,
    clinic: clinicName,
    prescription: false,
    status,
    speciality: raw.speciality,
    drName: raw.drName,
    hwName: raw.hwName ?? '',
    type: isUpcoming ? 'upcoming' : 'past',
    timeUntil: isUpcoming ? formatTimeUntil(slot, now) : '',
  };
}

export function buildBookingPayload(
  visit: BookingVisitResponse,
  slot: AppointmentSlot,
  hw: BookingHealthWorker,
  uuid: string,
  appointmentId = 0,
  reason?: string
) {
  const appointment: PushAppointment = {
    appointmentId,
    uuid,
    visitUuid: visit.uuid,
    patientId: visit.patient.uuid,
    openMrsId: visit.patient.identifiers?.[0]?.identifier ?? '',
    patientName: visit.patient.person.display,
    patientAge: String(visit.patient.person.age ?? ''),
    patientGender: visit.patient.person.gender ?? '',
    patientPic: '',
    hwUUID: hw.hwUUID,
    hwName: hw.hwName,
    hwAge: hw.hwAge,
    hwGender: hw.hwGender,
    userUuid: slot.userUuid,
    drName: slot.drName,
    locationUuid: visit.location.uuid,
    slotDay: slot.slotDay,
    slotDate: slot.slotDate,
    slotTime: slot.slotTime,
    slotDuration: slot.slotDuration,
    slotDurationUnit: slot.slotDurationUnit,
    speciality: slot.speciality ?? '',
    sync: '0',
  };
  if (reason) appointment.reason = reason;

  return {
    appointments: [appointment],
    encounters: [],
    patients: [],
    persons: [],
    providers: [],
    visits: [],
  };
}

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

export const appointmentService = {
  async getAppointmentSlots(
    fromDate: string,
    toDate: string,
    speciality: string
  ): Promise<AppointmentSlot[]> {
    const apiFromDate = toApiDate(fromDate);
    const apiToDate = toApiDate(toDate);
    const url = `/appointment/getAppointmentSlots?fromDate=${encodeURIComponent(apiFromDate)}&toDate=${encodeURIComponent(apiToDate)}&speciality=${encodeURIComponent(speciality)}`;
    const res = await AppointmentApi.get<AppointmentSlotsApiResponse>(url);

    const bookedKeys = new Set<string>();
    for (const appt of res.bookedAppointments ?? []) {
      bookedKeys.add(`${appt.slotDate}-${appt.slotTime}`);
    }
    for (const appt of res.rescheduledAppointments ?? []) {
      bookedKeys.add(`${appt.slotDate}-${appt.slotTime}`);
    }

    return (res.dates ?? []).map(slot => ({
      slotId: `${slot.slotDate}-${slot.slotTime.replace(/\s+/g, '-')}`,
      date: fromApiDate(slot.slotDate),
      time: slot.slotTime.toLowerCase(),
      isAvailable: !bookedKeys.has(`${slot.slotDate}-${slot.slotTime}`),
      period: getPeriod(slot.slotTime),
      speciality: slot.speciality,
      slotDay: slot.slotDay,
      slotDate: slot.slotDate,
      slotTime: slot.slotTime,
      slotDuration: slot.slotDuration,
      slotDurationUnit: slot.slotDurationUnit,
      userUuid: slot.userUuid,
      drName: slot.drName,
    }));
  },

  async getBookedAppointments(
    locationUuid: string,
    fromDate: string,
    toDate: string
  ): Promise<AppointmentListItem[]> {
    const rows = await this.getRawBookedAppointments(
      locationUuid,
      fromDate,
      toDate
    );
    const now = new Date();
    const clinicName = storage.getLocationName() ?? '';
    return rows.map(item => mapBookedAppointment(item, now, clinicName));
  },

  async getRawBookedAppointments(
    locationUuid: string,
    fromDate: string,
    toDate: string
  ): Promise<RawBookedAppointment[]> {
    const url = `${GET_SLOTS_ENDPOINT}?fromDate=${encodeURIComponent(
      toApiDate(fromDate)
    )}&toDate=${encodeURIComponent(
      toApiDate(toDate)
    )}&locationUuid=${encodeURIComponent(locationUuid)}`;
    const res = await AppointmentApi.get<GetSlotsApiResponse>(url);

    const byId = new Map<number, RawBookedAppointment>();
    for (const item of [
      ...(res.data ?? []),
      ...(res.cancelledAppointments ?? []),
    ]) {
      if (!byId.has(item.id)) byId.set(item.id, item);
    }
    return [...byId.values()];
  },

  async getAppointmentById(
    locationUuid: string,
    id: number,
    fromDate: string,
    toDate: string
  ): Promise<RawBookedAppointment | null> {
    const rows = await this.getRawBookedAppointments(
      locationUuid,
      fromDate,
      toDate
    );
    return rows.find(row => row.id === id) ?? null;
  },

  async cancelAppointment(params: {
    id: number;
    visitUuid: string;
    hwUUID: string;
    reason: string;
  }): Promise<unknown> {
    const res = await AppointmentApi.post<{
      status?: boolean;
      message?: string;
    }>(CANCEL_APPOINTMENT_ENDPOINT, params);
    if (res?.status === false) {
      throw new Error(res.message || 'Appointment was not cancelled');
    }
    return res;
  },

  async getVisitForPushData(visitUuid: string): Promise<RawVisitResponse> {
    return OpenMRSApi.get<RawVisitResponse>(
      `/visit/${visitUuid}?v=${PUSHDATA_CUSTOM_REP}`
    );
  },

  async getVisitForBooking(visitUuid: string): Promise<BookingVisitResponse> {
    return OpenMRSApi.get<BookingVisitResponse>(
      `/visit/${visitUuid}?v=${BOOKING_VISIT_REP}`
    );
  },

  async bookAppointment(
    visitUuid: string,
    slot: AppointmentSlot,
    hw: BookingHealthWorker,
    options: { appointmentId?: number; reason?: string } = {}
  ): Promise<unknown> {
    const visit = await this.getVisitForBooking(visitUuid);
    const payload = buildBookingPayload(
      visit,
      slot,
      hw,
      crypto.randomUUID(),
      options.appointmentId ?? 0,
      options.reason
    );
    const result = await EmrMiddlewareApi.post<{
      status?: string;
      message?: string;
    }>(PUSH_DATA_ENDPOINT, payload);

    if (result?.status && result.status !== 'OK') {
      throw new Error(result.message || 'Appointment was not saved');
    }
    return result;
  },
};
