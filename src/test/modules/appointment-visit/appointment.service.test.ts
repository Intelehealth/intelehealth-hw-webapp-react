import { beforeEach, describe, expect, it, vi } from 'vitest';

type InterceptorFn = (config: { headers: Record<string, string> }) => { headers: Record<string, string> };

const {
  mockGet,
  mockPost,
  mockOpenMRSGet,
  interceptorHolder,
  tokenHolder,
} = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockOpenMRSGet: vi.fn(),
  interceptorHolder: { fn: null as InterceptorFn | null },
  tokenHolder: { value: null as string | null },
}));

vi.mock('../../../services/http', () => ({
  HttpService: vi.fn().mockImplementation(() => ({
    axiosInstance: {
      interceptors: {
        request: {
          use: (fn: InterceptorFn) => {
            interceptorHolder.fn = fn;
          },
        },
      },
    },
    get: (...args: unknown[]) => mockGet(...args),
  })),
}));

vi.mock('../../../utils/storage', () => ({
  storage: { getAuthToken: () => tokenHolder.value },
}));

vi.mock('../../../services/patient.service', () => ({
  EmrMiddlewareApi: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

vi.mock('../../../services/openmrs', () => ({
  OpenMRSApi: {
    get: (...args: unknown[]) => mockOpenMRSGet(...args),
  },
}));

import {
  appointmentService,
  buildPushDataPayload,
} from '../../../modules/appointment-visit/appointment.service';
import type { RawVisitResponse } from '../../../modules/appointment-visit/appointment.service';

const mockRawVisit: RawVisitResponse = {
  uuid: 'visit-uuid-1',
  startDatetime: '2025-10-03T15:36:36.374+0530',
  location: { uuid: 'location-uuid-1' },
  visitType: { uuid: 'visit-type-uuid-1' },
  patient: { uuid: 'patient-uuid-1' },
  attributes: [
    {
      uuid: 'attr-uuid-1',
      attributeType: { uuid: '3f296939-c6d3-4d2e-b8ca-d7f4bfd42c2d' },
      value: 'General Physician',
    },
    {
      uuid: 'attr-uuid-2',
      attributeType: { uuid: 'e76eee5e-9d73-4d07-8f30-16b77e626ccf' },
      value: '2025-10-03T15:38:00.998+0530',
    },
  ],
  encounters: [
    {
      uuid: 'enc-uuid-1',
      encounterDatetime: '2025-10-03T15:36:36.374+0530',
      encounterType: { uuid: 'enc-type-uuid-1' },
      encounterProviders: [
        {
          encounterRole: { uuid: 'role-uuid-1' },
          provider: { uuid: 'provider-uuid-1' },
        },
      ],
      obs: [
        {
          uuid: 'obs-uuid-1',
          concept: { uuid: 'concept-uuid-height' },
          value: '170',
          comment: null,
        },
        {
          uuid: 'obs-uuid-2',
          concept: { uuid: 'concept-uuid-weight' },
          value: { uuid: 'coded-value-uuid', display: '70 kg' },
          comment: 'test comment',
        },
      ],
    },
  ],
};

const mockApiResponse = {
  status: true,
  dates: [
    {
      slotDay: 'Wednesday',
      slotDate: '08/04/2026',
      slotDuration: 30,
      slotDurationUnit: 'minutes',
      slotTime: '9:00 AM',
      speciality: 'General Physician',
      userUuid: 'uuid-1',
      drName: 'Dr Test',
    },
    {
      slotDay: 'Wednesday',
      slotDate: '08/04/2026',
      slotDuration: 30,
      slotDurationUnit: 'minutes',
      slotTime: '2:00 PM',
      speciality: 'General Physician',
      userUuid: 'uuid-1',
      drName: 'Dr Test',
    },
    {
      slotDay: 'Wednesday',
      slotDate: '08/04/2026',
      slotDuration: 30,
      slotDurationUnit: 'minutes',
      slotTime: '7:00 PM',
      speciality: 'General Physician',
      userUuid: 'uuid-1',
      drName: 'Dr Test',
    },
    {
      slotDay: 'Wednesday',
      slotDate: '08/04/2026',
      slotDuration: 30,
      slotDurationUnit: 'minutes',
      slotTime: '6:00 PM',
      speciality: 'General Physician',
      userUuid: 'uuid-1',
      drName: 'Dr Test',
    },
  ],
  bookedAppointments: [],
  rescheduledAppointments: [],
};

describe('appointmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAppointmentSlots', () => {
    it('calls the API with correct URL using DD/MM/YYYY dates and speciality', async () => {
      mockGet.mockResolvedValue(mockApiResponse);
      await appointmentService.getAppointmentSlots(
        '2026-04-08',
        '2026-04-09',
        'General Physician'
      );
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/appointment/getAppointmentSlots')
      );
      const url: string = mockGet.mock.calls[0][0];
      expect(url).toContain('fromDate=08%2F04%2F2026');
      expect(url).toContain('toDate=09%2F04%2F2026');
      expect(url).toContain('speciality=General%20Physician');
    });

    it('maps slotDate from DD/MM/YYYY to YYYY-MM-DD', async () => {
      mockGet.mockResolvedValue(mockApiResponse);
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-08',
        '2026-04-09',
        'General Physician'
      );
      expect(result[0].date).toBe('2026-04-08');
    });

    it('maps slotTime to lowercase', async () => {
      mockGet.mockResolvedValue(mockApiResponse);
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-08',
        '2026-04-09',
        'General Physician'
      );
      expect(result[0].time).toBe('9:00 am');
    });

    it('classifies Morning period correctly (before 12:00 PM)', async () => {
      mockGet.mockResolvedValue(mockApiResponse);
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-08',
        '2026-04-09',
        'General Physician'
      );
      expect(result[0].period).toBe('Morning'); // 9:00 AM
    });

    it('classifies Afternoon period correctly (12:00 PM to 6:00 PM inclusive)', async () => {
      mockGet.mockResolvedValue(mockApiResponse);
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-08',
        '2026-04-09',
        'General Physician'
      );
      expect(result[1].period).toBe('Afternoon'); // 2:00 PM
      expect(result[3].period).toBe('Afternoon'); // 6:00 PM (boundary)
    });

    it('classifies Evening period correctly (after 6:00 PM)', async () => {
      mockGet.mockResolvedValue(mockApiResponse);
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-08',
        '2026-04-09',
        'General Physician'
      );
      expect(result[2].period).toBe('Evening'); // 7:00 PM
    });

    it('sets isAvailable to true for all slots', async () => {
      mockGet.mockResolvedValue(mockApiResponse);
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-08',
        '2026-04-09',
        'General Physician'
      );
      expect(result.every(s => s.isAvailable)).toBe(true);
    });

    it('includes speciality in each slot', async () => {
      mockGet.mockResolvedValue(mockApiResponse);
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-08',
        '2026-04-09',
        'General Physician'
      );
      expect(result[0].speciality).toBe('General Physician');
    });

    it('generates a slotId for each slot', async () => {
      mockGet.mockResolvedValue(mockApiResponse);
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-08',
        '2026-04-09',
        'General Physician'
      );
      expect(result[0].slotId).toBeTruthy();
    });

    it('returns empty array when dates is empty', async () => {
      mockGet.mockResolvedValue({
        status: true,
        dates: [],
        bookedAppointments: [],
        rescheduledAppointments: [],
      });
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-08',
        '2026-04-09',
        'General Physician'
      );
      expect(result).toEqual([]);
    });

    it('returns empty array when dates is undefined', async () => {
      mockGet.mockResolvedValue({
        status: true,
        bookedAppointments: [],
        rescheduledAppointments: [],
      });
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-08',
        '2026-04-09',
        'General Physician'
      );
      expect(result).toEqual([]);
    });

    it('classifies 12:00 AM as Morning (midnight edge case)', async () => {
      mockGet.mockResolvedValue({
        status: true,
        dates: [
          {
            slotDay: 'Wednesday',
            slotDate: '08/04/2026',
            slotDuration: 30,
            slotDurationUnit: 'minutes',
            slotTime: '12:00 AM',
            speciality: 'General Physician',
            userUuid: 'uuid-1',
            drName: 'Dr Test',
          },
        ],
        bookedAppointments: [],
        rescheduledAppointments: [],
      });
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-08',
        '2026-04-09',
        'General Physician'
      );
      expect(result[0].period).toBe('Morning');
    });

    it('returns all slots covering Morning, Afternoon, and Evening periods', async () => {
      mockGet.mockResolvedValue(mockApiResponse);
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-08',
        '2026-04-09',
        'General Physician'
      );
      const periods = new Set(result.map(s => s.period));
      expect(periods.has('Morning')).toBe(true);
      expect(periods.has('Afternoon')).toBe(true);
      expect(periods.has('Evening')).toBe(true);
    });

    it('throws when API call fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));
      await expect(
        appointmentService.getAppointmentSlots(
          '2026-04-08',
          '2026-04-09',
          'General Physician'
        )
      ).rejects.toThrow('Network error');
    });
  });

  describe('bookAppointment', () => {
    it('fetches visit data, builds payload, and posts to /push/pushdata', async () => {
      mockOpenMRSGet.mockResolvedValue(mockRawVisit);
      mockPost.mockResolvedValue({ success: true });

      await appointmentService.bookAppointment(
        'visit-uuid-1',
        '2025-10-05T09:00:00.000+0530'
      );

      expect(mockOpenMRSGet).toHaveBeenCalledWith(
        expect.stringContaining('/visit/visit-uuid-1?v=custom:')
      );
      expect(mockPost).toHaveBeenCalledWith(
        '/push/pushdata',
        expect.objectContaining({
          appointments: [],
          encounters: expect.any(Array),
          patients: [],
          persons: [],
          providers: [],
          visits: expect.any(Array),
        })
      );
    });

    it('updates the appointment schedule attribute with the new datetime', async () => {
      mockOpenMRSGet.mockResolvedValue(mockRawVisit);
      mockPost.mockResolvedValue({ success: true });

      await appointmentService.bookAppointment(
        'visit-uuid-1',
        '2025-10-05T09:00:00.000+0530'
      );

      const payload = mockPost.mock.calls[0][1];
      const scheduleAttr = payload.visits[0].attributes.find(
        (a: { attributeType: string }) =>
          a.attributeType === 'e76eee5e-9d73-4d07-8f30-16b77e626ccf'
      );
      expect(scheduleAttr.value).toBe('2025-10-05T09:00:00.000+0530');
    });

    it('throws when the visit fetch fails', async () => {
      mockOpenMRSGet.mockRejectedValue(new Error('Visit not found'));

      await expect(
        appointmentService.bookAppointment(
          'visit-uuid-1',
          '2025-10-05T09:00:00.000+0530'
        )
      ).rejects.toThrow('Visit not found');
    });

    it('throws when the post fails', async () => {
      mockOpenMRSGet.mockResolvedValue(mockRawVisit);
      mockPost.mockRejectedValue(new Error('Server error'));

      await expect(
        appointmentService.bookAppointment(
          'visit-uuid-1',
          '2025-10-05T09:00:00.000+0530'
        )
      ).rejects.toThrow('Server error');
    });
  });

  describe('request interceptor', () => {
    it('sets Authorization header when auth token exists', () => {
      tokenHolder.value = 'my-token';
      const config = { headers: {} as Record<string, string> };
      const result = interceptorHolder.fn!(config);
      expect(result.headers.Authorization).toBe('Bearer my-token');
      expect(result.headers['Cache-Control']).toBe('no-cache');
      tokenHolder.value = null;
    });

    it('does not set Authorization header when no auth token', () => {
      tokenHolder.value = null;
      const config = { headers: {} as Record<string, string> };
      const result = interceptorHolder.fn!(config);
      expect(result.headers.Authorization).toBeUndefined();
      expect(result.headers['Cache-Control']).toBe('no-cache');
    });
  });

  describe('buildPushDataPayload', () => {
    it('transforms raw visit data into pushdata format', () => {
      const payload = buildPushDataPayload(
        mockRawVisit,
        '2025-10-05T09:00:00.000+0530'
      );

      expect(payload.appointments).toEqual([]);
      expect(payload.patients).toEqual([]);
      expect(payload.persons).toEqual([]);
      expect(payload.providers).toEqual([]);
      expect(payload.encounters).toHaveLength(1);
      expect(payload.visits).toHaveLength(1);
    });

    it('flattens encounter data to UUIDs', () => {
      const payload = buildPushDataPayload(
        mockRawVisit,
        '2025-10-05T09:00:00.000+0530'
      );
      const enc = payload.encounters[0];

      expect(enc.uuid).toBe('enc-uuid-1');
      expect(enc.encounterType).toBe('enc-type-uuid-1');
      expect(enc.location).toBe('location-uuid-1');
      expect(enc.patient).toBe('patient-uuid-1');
      expect(enc.visit).toBe('visit-uuid-1');
      expect(enc.voided).toBe(0);
      expect(enc.encounterProviders[0]).toEqual({
        encounterRole: 'role-uuid-1',
        provider: 'provider-uuid-1',
      });
    });

    it('flattens obs with string values', () => {
      const payload = buildPushDataPayload(
        mockRawVisit,
        '2025-10-05T09:00:00.000+0530'
      );
      const obs0 = payload.encounters[0].obs[0];

      expect(obs0.uuid).toBe('obs-uuid-1');
      expect(obs0.concept).toBe('concept-uuid-height');
      expect(obs0.value).toBe('170');
      expect(obs0.comments).toBe('');
    });

    it('flattens obs with coded (object) values using uuid', () => {
      const payload = buildPushDataPayload(
        mockRawVisit,
        '2025-10-05T09:00:00.000+0530'
      );
      const obs1 = payload.encounters[0].obs[1];

      expect(obs1.value).toBe('coded-value-uuid');
      expect(obs1.comments).toBe('test comment');
    });

    it('sets appointment schedule attribute to the provided datetime', () => {
      const payload = buildPushDataPayload(
        mockRawVisit,
        '2025-10-05T09:00:00.000+0530'
      );
      const scheduleAttr = payload.visits[0].attributes.find(
        a => a.attributeType === 'e76eee5e-9d73-4d07-8f30-16b77e626ccf'
      );

      expect(scheduleAttr).toBeDefined();
      expect(scheduleAttr!.value).toBe('2025-10-05T09:00:00.000+0530');
    });

    it('adds appointment schedule attribute if not present', () => {
      const visitWithoutScheduleAttr: RawVisitResponse = {
        ...mockRawVisit,
        attributes: [
          {
            uuid: 'attr-uuid-1',
            attributeType: { uuid: '3f296939-c6d3-4d2e-b8ca-d7f4bfd42c2d' },
            value: 'General Physician',
          },
        ],
      };

      const payload = buildPushDataPayload(
        visitWithoutScheduleAttr,
        '2025-10-05T09:00:00.000+0530'
      );
      const scheduleAttr = payload.visits[0].attributes.find(
        a => a.attributeType === 'e76eee5e-9d73-4d07-8f30-16b77e626ccf'
      );

      expect(scheduleAttr).toBeDefined();
      expect(scheduleAttr!.value).toBe('2025-10-05T09:00:00.000+0530');
    });

    it('flattens visit data to UUIDs', () => {
      const payload = buildPushDataPayload(
        mockRawVisit,
        '2025-10-05T09:00:00.000+0530'
      );
      const visit = payload.visits[0];

      expect(visit.uuid).toBe('visit-uuid-1');
      expect(visit.location).toBe('location-uuid-1');
      expect(visit.patient).toBe('patient-uuid-1');
      expect(visit.visitType).toBe('visit-type-uuid-1');
      expect(visit.startDatetime).toBe('2025-10-03T15:36:36.374+0530');
    });
  });
});
