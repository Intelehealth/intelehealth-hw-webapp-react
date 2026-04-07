import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockOpenMRSGet = vi.fn();

vi.mock('../../../services/http', () => ({
  HttpService: vi.fn().mockImplementation(() => ({
    axiosInstance: { interceptors: { request: { use: vi.fn() } } },
    get: (...args: unknown[]) => mockGet(...args),
  })),
}));

vi.mock('../../../utils/storage', () => ({
  storage: { getAuthToken: () => null },
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

describe('appointmentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAppointmentSlots', () => {
    it('returns dummy slots with the provided fromDate when USE_DUMMY_DATA is true', async () => {
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-01',
        '2026-04-13',
        'location-uuid-123'
      );

      expect(result).toHaveLength(20);
      expect(result[0].date).toBe('2026-04-01');
      expect(result[0].slotId).toBe('slot-001');
      expect(mockGet).not.toHaveBeenCalled();
    });

    it('returns slots covering Morning, Afternoon, and Evening periods', async () => {
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-01',
        '2026-04-13',
        'location-uuid-123'
      );

      const periods = new Set(result.map(s => s.period));
      expect(periods).toEqual(new Set(['Morning', 'Afternoon', 'Evening']));
    });

    it('includes both available and unavailable slots', async () => {
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-01',
        '2026-04-13',
        'location-uuid-123'
      );

      const available = result.filter(s => s.isAvailable);
      const unavailable = result.filter(s => !s.isAvailable);
      expect(available.length).toBeGreaterThan(0);
      expect(unavailable.length).toBeGreaterThan(0);
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
