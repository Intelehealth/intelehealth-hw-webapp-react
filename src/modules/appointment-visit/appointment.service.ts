import { HttpService } from '../../services/http';
import { EmrMiddlewareApi } from '../../services/patient.service';
import { OpenMRSApi } from '../../services/openmrs';
import { storage } from '../../utils/storage';

const APPOINTMENT_BASE_URL = 'https://dev.intelehealth.org:3004/api';
//'https://dev.intelehealth.org/api';
//dev.intelehealth.org:3004/api

// TODO: Set to false when real APIs are ready
export const USE_DUMMY_DATA = true;

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

export type SlotPeriod = 'Morning' | 'Afternoon' | 'Evening';

export interface AppointmentSlot {
  slotId: string;
  date: string;
  time: string;
  isAvailable: boolean;
  period: SlotPeriod;
  speciality?: string;
}

interface AppointmentSlotsResponse {
  status: boolean;
  data: AppointmentSlot[];
}

// ─── Dummy Slot Data (used while API returns empty data[]) ───────────────────

const DUMMY_SLOTS: AppointmentSlot[] = [
  // Morning slots
  {
    slotId: 'slot-001',
    date: '',
    time: '09:00 am',
    isAvailable: true,
    period: 'Morning',
  },
  {
    slotId: 'slot-002',
    date: '',
    time: '09:30 am',
    isAvailable: true,
    period: 'Morning',
  },
  {
    slotId: 'slot-003',
    date: '',
    time: '10:00 am',
    isAvailable: false,
    period: 'Morning',
  },
  {
    slotId: 'slot-004',
    date: '',
    time: '10:30 am',
    isAvailable: true,
    period: 'Morning',
  },
  {
    slotId: 'slot-005',
    date: '',
    time: '11:00 am',
    isAvailable: true,
    period: 'Morning',
  },
  {
    slotId: 'slot-006',
    date: '',
    time: '11:30 am',
    isAvailable: false,
    period: 'Morning',
  },
  // Afternoon slots
  {
    slotId: 'slot-007',
    date: '',
    time: '12:00 pm',
    isAvailable: true,
    period: 'Afternoon',
  },
  {
    slotId: 'slot-008',
    date: '',
    time: '12:30 pm',
    isAvailable: true,
    period: 'Afternoon',
  },
  {
    slotId: 'slot-009',
    date: '',
    time: '01:00 pm',
    isAvailable: true,
    period: 'Afternoon',
  },
  {
    slotId: 'slot-010',
    date: '',
    time: '01:30 pm',
    isAvailable: false,
    period: 'Afternoon',
  },
  {
    slotId: 'slot-011',
    date: '',
    time: '02:00 pm',
    isAvailable: true,
    period: 'Afternoon',
  },
  {
    slotId: 'slot-012',
    date: '',
    time: '02:30 pm',
    isAvailable: true,
    period: 'Afternoon',
  },
  {
    slotId: 'slot-013',
    date: '',
    time: '03:00 pm',
    isAvailable: false,
    period: 'Afternoon',
  },
  {
    slotId: 'slot-014',
    date: '',
    time: '03:30 pm',
    isAvailable: true,
    period: 'Afternoon',
  },
  {
    slotId: 'slot-015',
    date: '',
    time: '04:00 pm',
    isAvailable: true,
    period: 'Afternoon',
  },
  // Evening slots
  {
    slotId: 'slot-016',
    date: '',
    time: '06:30 pm',
    isAvailable: true,
    period: 'Evening',
  },
  {
    slotId: 'slot-017',
    date: '',
    time: '07:00 pm',
    isAvailable: true,
    period: 'Evening',
  },
  {
    slotId: 'slot-018',
    date: '',
    time: '07:30 pm',
    isAvailable: false,
    period: 'Evening',
  },
  {
    slotId: 'slot-019',
    date: '',
    time: '08:00 pm',
    isAvailable: true,
    period: 'Evening',
  },
  {
    slotId: 'slot-020',
    date: '',
    time: '08:30 pm',
    isAvailable: true,
    period: 'Evening',
  },
];

// ─── Raw Visit Types for PushData ─────────────────────────────────────────────

interface RawEncounterProvider {
  encounterRole: { uuid: string };
  provider: { uuid: string };
}

interface RawObs {
  uuid: string;
  concept: { uuid: string };
  value: string | { uuid: string; display: string };
  comment: string | null;
}

interface RawEncounter {
  uuid: string;
  encounterDatetime: string;
  encounterType: { uuid: string };
  encounterProviders: RawEncounterProvider[];
  obs: RawObs[];
}

interface RawVisitAttribute {
  uuid: string;
  attributeType: { uuid: string };
  value: string;
}

export interface RawVisitResponse {
  uuid: string;
  startDatetime: string;
  location: { uuid: string };
  visitType: { uuid: string };
  patient: { uuid: string };
  attributes: RawVisitAttribute[];
  encounters: RawEncounter[];
}

// Custom rep that fetches all UUIDs needed for the pushdata payload
const PUSHDATA_CUSTOM_REP =
  'custom:(uuid,startDatetime,' +
  'location:(uuid),' +
  'visitType:(uuid),' +
  'patient:(uuid),' +
  'attributes:(uuid,attributeType:(uuid),value),' +
  'encounters:(uuid,encounterDatetime,' +
  'encounterType:(uuid),' +
  'encounterProviders:(encounterRole:(uuid),provider:(uuid)),' +
  'obs:(uuid,concept:(uuid),value,comment)))';

// Visit attribute type UUID for appointment scheduled datetime
const APPOINTMENT_SCHEDULE_ATTR_TYPE = 'e76eee5e-9d73-4d07-8f30-16b77e626ccf';

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

const PUSH_DATA_ENDPOINT = '/push/pushdata';

export const appointmentService = {
  async getAppointmentSlots(
    fromDate: string,
    toDate: string,
    locationUuid: string
  ): Promise<AppointmentSlot[]> {
    if (USE_DUMMY_DATA) {
      return DUMMY_SLOTS.map(s => ({ ...s, date: fromDate }));
    }
    const url = `/appointment/getSlots?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}&locationUuid=${encodeURIComponent(locationUuid)}`;
    const res = await AppointmentApi.get<AppointmentSlotsResponse>(url);
    return res.data ?? [];
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
