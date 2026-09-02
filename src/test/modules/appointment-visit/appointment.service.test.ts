import { beforeEach, describe, expect, it, vi } from 'vitest';

type InterceptorFn = (config: { headers: Record<string, string> }) => { headers: Record<string, string> };

const {
  mockGet,
  mockPost,
  mockPortalPost,
  mockOpenMRSGet,
  interceptorHolder,
  tokenHolder,
  clinicHolder,
} = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPortalPost: vi.fn(),
  mockOpenMRSGet: vi.fn(),
  interceptorHolder: { fn: null as InterceptorFn | null },
  tokenHolder: { value: null as string | null },
  clinicHolder: { value: 'Telemedicine Clinic 1' as string | null },
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
    post: (...args: unknown[]) => mockPortalPost(...args),
  })),
}));

vi.mock('../../../utils/storage', () => ({
  storage: {
    getAuthToken: () => tokenHolder.value,
    getLocationName: () => clinicHolder.value,
  },
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
  mapBookedAppointment,
} from '../../../modules/appointment-visit/appointment.service';
import type { RawBookedAppointment } from '../../../assets/data/appointments.data';

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
    clinicHolder.value = 'Telemedicine Clinic 1';
  });

  describe('getAppointmentSlots', () => {
    it('calls the API with correct URL converting YYYY-MM-DD to DD/MM/YYYY and speciality', async () => {
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
      expect(result[0].period).toBe('Morning');
    });

    it('classifies Afternoon period correctly (12:00 PM to 6:00 PM inclusive)', async () => {
      mockGet.mockResolvedValue(mockApiResponse);
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-08',
        '2026-04-09',
        'General Physician'
      );
      expect(result[1].period).toBe('Afternoon');
      expect(result[3].period).toBe('Afternoon');
    });

    it('classifies Evening period correctly (after 6:00 PM)', async () => {
      mockGet.mockResolvedValue(mockApiResponse);
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-08',
        '2026-04-09',
        'General Physician'
      );
      expect(result[2].period).toBe('Evening');
    });

    it('sets isAvailable to true when no booked appointments', async () => {
      mockGet.mockResolvedValue(mockApiResponse);
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-08',
        '2026-04-09',
        'General Physician'
      );
      expect(result.every(s => s.isAvailable)).toBe(true);
    });

    it('marks booked appointment slots as unavailable', async () => {
      mockGet.mockResolvedValue({
        ...mockApiResponse,
        bookedAppointments: [
          {
            appointmentId: 1,
            slotDay: 'Wednesday',
            slotDate: '08/04/2026',
            slotDuration: 30,
            slotDurationUnit: 'minutes',
            slotTime: '9:00 AM',
            speciality: 'General Physician',
            userUuid: 'uuid-1',
            drName: 'Dr Test',
            visitUuid: 'v-1',
            patientName: 'Test',
            openMrsId: '100',
            patientId: 'p-1',
            locationUuid: 'loc-1',
            hwUUID: 'hw-1',
            reason: null,
            voided: null,
            syncd: true,
            patientGender: 'M',
            patientAge: '30',
            hwName: 'HW',
            hwAge: '25',
            hwGender: 'F',
          },
        ],
      });
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-08',
        '2026-04-09',
        'General Physician'
      );
      // 9:00 AM slot should be unavailable
      expect(result[0].isAvailable).toBe(false);
      // Other slots should still be available
      expect(result[1].isAvailable).toBe(true);
      expect(result[2].isAvailable).toBe(true);
      expect(result[3].isAvailable).toBe(true);
    });

    it('marks rescheduled appointment slots as unavailable', async () => {
      mockGet.mockResolvedValue({
        ...mockApiResponse,
        rescheduledAppointments: [
          {
            appointmentId: 2,
            slotDay: 'Wednesday',
            slotDate: '08/04/2026',
            slotDuration: 30,
            slotDurationUnit: 'minutes',
            slotTime: '2:00 PM',
            speciality: 'General Physician',
            userUuid: 'uuid-1',
            drName: 'Dr Test',
            visitUuid: 'v-2',
            patientName: 'Test2',
            openMrsId: '101',
            patientId: 'p-2',
            locationUuid: 'loc-1',
            hwUUID: 'hw-1',
            reason: null,
            voided: null,
            syncd: true,
            patientGender: 'F',
            patientAge: '40',
            hwName: 'HW',
            hwAge: '25',
            hwGender: 'F',
          },
        ],
      });
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-08',
        '2026-04-09',
        'General Physician'
      );
      // 2:00 PM slot should be unavailable
      expect(result[0].isAvailable).toBe(true);
      expect(result[1].isAvailable).toBe(false);
      expect(result[2].isAvailable).toBe(true);
      expect(result[3].isAvailable).toBe(true);
    });

    it('marks slots as unavailable from both booked and rescheduled', async () => {
      mockGet.mockResolvedValue({
        ...mockApiResponse,
        bookedAppointments: [
          {
            appointmentId: 1,
            slotDay: 'Wednesday',
            slotDate: '08/04/2026',
            slotDuration: 30,
            slotDurationUnit: 'minutes',
            slotTime: '9:00 AM',
            speciality: 'General Physician',
            userUuid: 'uuid-1',
            drName: 'Dr Test',
            visitUuid: 'v-1',
            patientName: 'Test',
            openMrsId: '100',
            patientId: 'p-1',
            locationUuid: 'loc-1',
            hwUUID: 'hw-1',
            reason: null,
            voided: null,
            syncd: true,
            patientGender: 'M',
            patientAge: '30',
            hwName: 'HW',
            hwAge: '25',
            hwGender: 'F',
          },
        ],
        rescheduledAppointments: [
          {
            appointmentId: 2,
            slotDay: 'Wednesday',
            slotDate: '08/04/2026',
            slotDuration: 30,
            slotDurationUnit: 'minutes',
            slotTime: '7:00 PM',
            speciality: 'General Physician',
            userUuid: 'uuid-1',
            drName: 'Dr Test',
            visitUuid: 'v-2',
            patientName: 'Test2',
            openMrsId: '101',
            patientId: 'p-2',
            locationUuid: 'loc-1',
            hwUUID: 'hw-1',
            reason: null,
            voided: null,
            syncd: true,
            patientGender: 'F',
            patientAge: '40',
            hwName: 'HW',
            hwAge: '25',
            hwGender: 'F',
          },
        ],
      });
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-08',
        '2026-04-09',
        'General Physician'
      );
      // 9:00 AM (booked) and 7:00 PM (rescheduled) should be unavailable
      expect(result[0].isAvailable).toBe(false);
      expect(result[1].isAvailable).toBe(true);
      expect(result[2].isAvailable).toBe(false);
      expect(result[3].isAvailable).toBe(true);
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

    it('handles undefined bookedAppointments and rescheduledAppointments gracefully', async () => {
      mockGet.mockResolvedValue({
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
        ],
      });
      const result = await appointmentService.getAppointmentSlots(
        '2026-04-08',
        '2026-04-09',
        'General Physician'
      );
      expect(result).toHaveLength(1);
      expect(result[0].isAvailable).toBe(true);
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
    const bookingVisit = {
      uuid: 'visit-uuid-1',
      location: { uuid: 'location-uuid-1' },
      patient: {
        uuid: 'patient-uuid-1',
        identifiers: [{ identifier: '167JM-8' }],
        person: { display: 'Nagen Biswal', gender: 'M', age: 37 },
      },
    };
    const slot = {
      slotId: 's1',
      date: '2026-09-01',
      time: '5:00 pm',
      isAvailable: true,
      period: 'Evening' as const,
      speciality: 'General Physician',
      slotDay: 'Tuesday',
      slotDate: '01/09/2026',
      slotTime: '5:00 PM',
      slotDuration: 30,
      slotDurationUnit: 'minutes',
      userUuid: 'doctor-uuid-1',
      drName: 'Doctor One',
    };
    const hw = {
      hwUUID: 'hw-uuid-1',
      hwName: 'Jane Test Smith',
      hwAge: '28',
      hwGender: 'F',
    };

    it('sends a populated appointments[] and empty sync arrays', async () => {
      mockOpenMRSGet.mockResolvedValue(bookingVisit);
      mockPost.mockResolvedValue({ status: 'OK' });

      await appointmentService.bookAppointment('visit-uuid-1', slot, hw);

      expect(mockOpenMRSGet).toHaveBeenCalledWith(
        expect.stringContaining('/visit/visit-uuid-1?v=custom:')
      );
      const [url, payload] = mockPost.mock.calls[0];
      expect(url).toBe('/push/pushdata');
      expect(payload.appointments).toHaveLength(1);
      expect(payload.encounters).toEqual([]);
      expect(payload.visits).toEqual([]);
      expect(payload.patients).toEqual([]);
      expect(payload.persons).toEqual([]);
      expect(payload.providers).toEqual([]);
    });

    it('maps visit, slot and health worker onto the appointment', async () => {
      mockOpenMRSGet.mockResolvedValue(bookingVisit);
      mockPost.mockResolvedValue({ status: 'OK' });

      await appointmentService.bookAppointment('visit-uuid-1', slot, hw);

      const appt = mockPost.mock.calls[0][1].appointments[0];
      expect(appt.appointmentId).toBe(0);
      expect(appt.sync).toBe('0');
      expect(appt.uuid).toEqual(expect.any(String));
      expect(appt.visitUuid).toBe('visit-uuid-1');
      expect(appt.patientId).toBe('patient-uuid-1');
      expect(appt.openMrsId).toBe('167JM-8');
      expect(appt.patientName).toBe('Nagen Biswal');
      expect(appt.patientAge).toBe('37');
      expect(appt.patientGender).toBe('M');
      expect(appt.locationUuid).toBe('location-uuid-1');
      expect(appt.slotDate).toBe('01/09/2026');
      expect(appt.slotTime).toBe('5:00 PM');
      expect(appt.slotDay).toBe('Tuesday');
      expect(appt.slotDuration).toBe(30);
      expect(appt.speciality).toBe('General Physician');
      expect(appt.userUuid).toBe('doctor-uuid-1');
      expect(appt.drName).toBe('Doctor One');
      expect(appt.hwUUID).toBe('hw-uuid-1');
      expect(appt.hwName).toBe('Jane Test Smith');
    });

    it('passes appointmentId and reason through for a reschedule', async () => {
      mockOpenMRSGet.mockResolvedValue(bookingVisit);
      mockPost.mockResolvedValue({ status: 'OK' });

      await appointmentService.bookAppointment('visit-uuid-1', slot, hw, {
        appointmentId: 9,
        reason: 'Doctor is not available',
      });

      const appt = mockPost.mock.calls[0][1].appointments[0];
      expect(appt.appointmentId).toBe(9);
      expect(appt.reason).toBe('Doctor is not available');
    });

    it('omits reason for a plain booking', async () => {
      mockOpenMRSGet.mockResolvedValue(bookingVisit);
      mockPost.mockResolvedValue({ status: 'OK' });

      await appointmentService.bookAppointment('visit-uuid-1', slot, hw);

      expect(mockPost.mock.calls[0][1].appointments[0].reason).toBeUndefined();
    });

    it('throws when the middleware reports a non-OK status', async () => {
      mockOpenMRSGet.mockResolvedValue(bookingVisit);
      mockPost.mockResolvedValue({ status: 'ERROR', message: 'Slot taken' });

      await expect(
        appointmentService.bookAppointment('visit-uuid-1', slot, hw)
      ).rejects.toThrow('Slot taken');
    });

    it('throws when the visit fetch fails', async () => {
      mockOpenMRSGet.mockRejectedValue(new Error('Visit not found'));

      await expect(
        appointmentService.bookAppointment('visit-uuid-1', slot, hw)
      ).rejects.toThrow('Visit not found');
    });

    it('throws when the post fails', async () => {
      mockOpenMRSGet.mockResolvedValue(bookingVisit);
      mockPost.mockRejectedValue(new Error('Server error'));

      await expect(
        appointmentService.bookAppointment('visit-uuid-1', slot, hw)
      ).rejects.toThrow('Server error');
    });
  });


  describe('request interceptor', () => {
    it('sets Authorization header when auth token exists', () => {
      tokenHolder.value = 'my-token';
      const config = { headers: {} as Record<string, string> };
      const result = interceptorHolder.fn!(config);
      expect(result.headers.Authorization).toBe('Bearer my-token');
      tokenHolder.value = null;
    });

    it('does not set Authorization header when no auth token', () => {
      tokenHolder.value = null;
      const config = { headers: {} as Record<string, string> };
      const result = interceptorHolder.fn!(config);
      expect(result.headers.Authorization).toBeUndefined();
    });

    it('does not set Cache-Control header to avoid CORS preflight rejection', () => {
      tokenHolder.value = 'my-token';
      const config = { headers: {} as Record<string, string> };
      const result = interceptorHolder.fn!(config);
      expect(result.headers['Cache-Control']).toBeUndefined();
      tokenHolder.value = null;
    });
  });

  describe('mapBookedAppointment', () => {
    const now = new Date('2026-08-31T10:00:00.000Z');

    const rawAppointment: RawBookedAppointment = {
      id: 42,
      patientName: 'Nagen Biswal',
      patientAge: '34',
      patientGender: 'M',
      slotDate: '05/09/2026',
      slotTime: '4:00 PM',
      slotDuration: 30,
      slotDurationUnit: 'minutes',
      patientId: 'patient-uuid-1',
      locationUuid: 'loc-1',
      reason: null,
      type: 'appointment',
      createdAt: '2026-09-01T07:41:32.000Z',
      status: 'booked',
      slotDay: 'Saturday',
      slotJsDate: '2026-09-05T16:00:00.000Z',
      visitUuid: 'visit-uuid-1',
      openMrsId: '100GL-1',
      speciality: 'General Physician',
      userUuid: 'doctor-uuid-1',
      drName: 'Doctor One',
      hwUUID: 'hw-uuid-1',
      hwName: 'Nurse One',
    };

    it('maps API fields onto the list item shape', () => {
      const item = mapBookedAppointment(rawAppointment, now);
      expect(item.id).toBe(42);
      expect(item.patientName).toBe('Nagen Biswal');
      expect(item.gender).toBe('M');
      expect(item.age).toBe('34');
      expect(item.visitId).toBe('visit-uuid-1');
      expect(item.openMrsId).toBe('100GL-1');
      expect(item.symptom).toBe('General Physician');
      expect(item.drName).toBe('Doctor One');
      expect(item.hwName).toBe('Nurse One');
    });

    it('uppercases status for the badge styling', () => {
      expect(mapBookedAppointment(rawAppointment, now).status).toBe('BOOKED');
    });

    it('formats the date/time for display', () => {
      expect(mapBookedAppointment(rawAppointment, now).dateTime).toBe(
        '5 Sep 2026, at 4:00 pm'
      );
    });

    it('marks a future slot as upcoming with a time-until label', () => {
      const item = mapBookedAppointment(rawAppointment, now);
      expect(item.type).toBe('upcoming');
      expect(item.timeUntil).toMatch(/^in \d+ Day/);
    });

    it('treats a future cancelled appointment as past', () => {
      const item = mapBookedAppointment(
        { ...rawAppointment, status: 'cancelled' },
        now
      );
      expect(item.type).toBe('past');
      expect(item.timeUntil).toBe('');
    });

    it('treats a future completed appointment as past', () => {
      expect(
        mapBookedAppointment({ ...rawAppointment, status: 'completed' }, now)
          .type
      ).toBe('past');
    });

    it('marks a past slot as past with no time-until label', () => {
      const item = mapBookedAppointment(
        { ...rawAppointment, slotJsDate: '2026-08-24T20:30:00.000Z' },
        now
      );
      expect(item.type).toBe('past');
      expect(item.timeUntil).toBe('');
    });

    it('treats a missing or unparseable slot date as past', () => {
      expect(
        mapBookedAppointment({ ...rawAppointment, slotJsDate: '' }, now).type
      ).toBe('past');
      expect(
        mapBookedAppointment(
          { ...rawAppointment, slotJsDate: 'not-a-date' },
          now
        ).type
      ).toBe('past');
    });

    it('falls back to empty strings for null fields', () => {
      const item = mapBookedAppointment(
        {
          ...rawAppointment,
          patientGender: null,
          patientAge: null,
          hwName: null,
          speciality: '',
          status: '',
          slotDate: '',
        },
        now
      );
      expect(item.gender).toBe('');
      expect(item.age).toBe('');
      expect(item.hwName).toBe('');
      expect(item.symptom).toBe('');
      expect(item.status).toBe('');
      expect(item.dateTime).toBe('');
    });

    it('renders hours and minutes for a slot less than a day away', () => {
      const item = mapBookedAppointment(
        { ...rawAppointment, slotJsDate: '2026-08-31T14:30:00.000Z' },
        now
      );
      expect(item.timeUntil).toBe('in 4 Hours 30 min');
    });
  });

  describe('getBookedAppointments', () => {
    it('requests getSlots with date range and location', async () => {
      mockGet.mockResolvedValueOnce({ data: [], cancelledAppointments: [] });
      await appointmentService.getBookedAppointments(
        'loc-1',
        '2026-03-01',
        '2026-09-01'
      );
      const url: string = mockGet.mock.calls[0][0];
      expect(url).toContain('/appointment/getSlots');
      expect(url).toContain('fromDate=01%2F03%2F2026');
      expect(url).toContain('toDate=01%2F09%2F2026');
      expect(url).toContain('locationUuid=loc-1');
    });

    it('maps booked rows into list items', async () => {
      mockGet.mockResolvedValueOnce({
        data: [
          {
            id: 7,
            patientName: 'Nagen Biswal',
            patientAge: '37',
            patientGender: 'M',
            slotDay: 'Tuesday',
            slotDate: '01/09/2026',
            slotJsDate: '2026-09-01T11:30:00.000Z',
            slotTime: '5:00 PM',
            speciality: 'General Physician',
            userUuid: 'doc-1',
            drName: 'Doctor One',
            visitUuid: 'visit-1',
            openMrsId: '165WF-4',
            status: 'booked',
            hwName: 'Jane Test Smith',
          },
        ],
        cancelledAppointments: [],
      });
      const result = await appointmentService.getBookedAppointments(
        'loc-1',
        '2026-03-01',
        '2026-09-01'
      );
      expect(result).toHaveLength(1);
      expect(result[0].patientName).toBe('Nagen Biswal');
      expect(result[0].status).toBe('BOOKED');
      expect(result[0].openMrsId).toBe('165WF-4');
      expect(result[0].clinic).toBe('Telemedicine Clinic 1');
    });

    it('includes cancelled appointments in the list', async () => {
      mockGet.mockResolvedValueOnce({
        data: [],
        cancelledAppointments: [
          {
            id: 8,
            patientName: 'Cancelled Patient',
            slotDate: '01/09/2026',
            slotTime: '5:00 PM',
            slotJsDate: '2026-09-01T11:30:00.000Z',
            status: 'cancelled',
          },
        ],
      });
      const result = await appointmentService.getBookedAppointments(
        'loc-1',
        '2026-03-01',
        '2026-09-01'
      );
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('CANCELLED');
    });

    it('does not duplicate rows repeated in cancelledAppointments', async () => {
      const cancelled = {
        id: 5,
        patientName: 'Testshan Test',
        slotDate: '16/06/2026',
        slotTime: '4:00 PM',
        slotJsDate: '2026-06-16T10:30:00.000Z',
        status: 'cancelled',
      };
      mockGet.mockResolvedValueOnce({
        data: [cancelled],
        cancelledAppointments: [cancelled],
      });
      const result = await appointmentService.getBookedAppointments(
        'loc-1',
        '2026-03-01',
        '2026-09-01'
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(5);
    });

    it('returns an empty list when the API omits data', async () => {
      mockGet.mockResolvedValueOnce({});
      await expect(
        appointmentService.getBookedAppointments(
          'loc-1',
          '2026-03-01',
          '2026-09-01'
        )
      ).resolves.toEqual([]);
    });
  });

  describe('getAppointmentById', () => {
    const row = {
      id: 11,
      slotDate: '02/09/2026',
      slotTime: '9:30 PM',
      slotJsDate: '2026-09-02T16:00:00.000Z',
      status: 'booked',
      patientName: 'ClaudeTest',
    };

    it('returns the matching row', async () => {
      mockGet.mockResolvedValueOnce({ data: [row], cancelledAppointments: [] });
      const result = await appointmentService.getAppointmentById(
        'loc-1',
        11,
        '2026-03-01',
        '2026-09-01'
      );
      expect(result?.id).toBe(11);
    });

    it('returns null when the id is not present', async () => {
      mockGet.mockResolvedValueOnce({ data: [row], cancelledAppointments: [] });
      await expect(
        appointmentService.getAppointmentById(
          'loc-1',
          99,
          '2026-03-01',
          '2026-09-01'
        )
      ).resolves.toBeNull();
    });
  });

  describe('cancelAppointment', () => {
    const params = {
      id: 12,
      visitUuid: 'visit-1',
      hwUUID: 'hw-1',
      reason: 'Patient is not available',
    };

    it('posts to the cancel endpoint', async () => {
      mockPortalPost.mockResolvedValueOnce({ status: true });
      await appointmentService.cancelAppointment(params);
      expect(mockPortalPost).toHaveBeenCalledWith(
        '/appointment/cancelAppointment',
        params
      );
    });

    it('throws with the API message when it reports failure', async () => {
      mockPortalPost.mockResolvedValueOnce({
        status: false,
        message: 'Already cancelled',
      });
      await expect(
        appointmentService.cancelAppointment(params)
      ).rejects.toThrow('Already cancelled');
    });

    it('throws a default message when none is supplied', async () => {
      mockPortalPost.mockResolvedValueOnce({ status: false });
      await expect(
        appointmentService.cancelAppointment(params)
      ).rejects.toThrow('Appointment was not cancelled');
    });
  });

  describe('mapping edge cases', () => {
    const now = new Date('2026-08-31T10:00:00.000Z');
    const base = {
      id: 1,
      slotDay: 'Monday',
      slotDate: '31/08/2026',
      slotJsDate: '2026-08-31T12:00:00.000Z',
      slotDuration: 30,
      slotDurationUnit: 'minutes',
      slotTime: '5:30 PM',
      speciality: 'General Physician',
      userUuid: 'doc-1',
      drName: 'Doctor One',
      visitUuid: 'visit-1',
      patientId: 'patient-1',
      locationUuid: 'loc-1',
      hwUUID: 'hw-1',
      patientName: 'Test Patient',
      openMrsId: '100GL-1',
      status: 'booked',
      reason: null,
      patientAge: '30',
      patientGender: 'M',
      hwName: 'Nurse One',
      type: 'appointment',
      createdAt: '2026-08-31T09:00:00.000Z',
    };

    it('renders a minutes-only countdown', () => {
      const item = mapBookedAppointment(
        { ...base, slotJsDate: '2026-08-31T10:45:00.000Z' },
        now
      );
      expect(item.timeUntil).toBe('in 45 min');
    });

    it('uses the singular Day label for a one-day gap', () => {
      const item = mapBookedAppointment(
        { ...base, slotJsDate: '2026-09-01T12:00:00.000Z' },
        now
      );
      expect(item.timeUntil).toMatch(/^in 1 Day /);
    });

    it('returns no countdown when the slot is exactly now', () => {
      const item = mapBookedAppointment(
        { ...base, slotJsDate: now.toISOString() },
        now
      );
      expect(item.type).toBe('upcoming');
      expect(item.timeUntil).toBe('');
    });

    it('falls back to the raw month when it is out of range', () => {
      const item = mapBookedAppointment({ ...base, slotDate: '05/13/2026' }, now);
      expect(item.dateTime).toBe('5 13 2026, at 5:30 pm');
    });

    it('omits the time when the slot time is empty', () => {
      const item = mapBookedAppointment({ ...base, slotTime: '' }, now);
      expect(item.dateTime).toBe('31 Aug 2026');
    });

    it('uses an empty clinic name when none is stored', async () => {
      clinicHolder.value = null;
      mockGet.mockResolvedValueOnce({ data: [base], cancelledAppointments: [] });
      const result = await appointmentService.getBookedAppointments(
        'loc-1',
        '2026-03-01',
        '2026-09-01'
      );
      expect(result[0].clinic).toBe('');
    });
  });

  describe('buildBookingPayload fallbacks', () => {
    const slot = {
      slotId: 's1',
      date: '2026-09-01',
      time: '5:00 pm',
      isAvailable: true,
      period: 'Evening' as const,
      slotDay: 'Tuesday',
      slotDate: '01/09/2026',
      slotTime: '5:00 PM',
      slotDuration: 30,
      slotDurationUnit: 'minutes',
      userUuid: 'doc-1',
      drName: 'Doctor One',
    };
    const hw = {
      hwUUID: 'hw-1',
      hwName: 'Nurse One',
      hwAge: '28',
      hwGender: 'F',
    };

    it('defaults missing identifier, age, gender and speciality', async () => {
      mockOpenMRSGet.mockResolvedValue({
        uuid: 'visit-1',
        location: { uuid: 'loc-1' },
        patient: {
          uuid: 'patient-1',
          identifiers: [],
          person: { display: 'Test Patient', gender: null, age: null },
        },
      });
      mockPost.mockResolvedValue({ status: 'OK' });

      await appointmentService.bookAppointment('visit-1', slot, hw);

      const appt = mockPost.mock.calls[0][1].appointments[0];
      expect(appt.openMrsId).toBe('');
      expect(appt.patientAge).toBe('');
      expect(appt.patientGender).toBe('');
      expect(appt.speciality).toBe('');
    });

    it('accepts a response without a status field', async () => {
      mockOpenMRSGet.mockResolvedValue({
        uuid: 'visit-1',
        location: { uuid: 'loc-1' },
        patient: {
          uuid: 'patient-1',
          identifiers: [{ identifier: '100GL-1' }],
          person: { display: 'Test Patient', gender: 'M', age: 30 },
        },
      });
      mockPost.mockResolvedValue({});
      await expect(
        appointmentService.bookAppointment('visit-1', slot, hw)
      ).resolves.toEqual({});
    });

    it('throws a default message when the middleware omits one', async () => {
      mockOpenMRSGet.mockResolvedValue({
        uuid: 'visit-1',
        location: { uuid: 'loc-1' },
        patient: {
          uuid: 'patient-1',
          identifiers: [{ identifier: '100GL-1' }],
          person: { display: 'Test Patient', gender: 'M', age: 30 },
        },
      });
      mockPost.mockResolvedValue({ status: 'ERROR' });
      await expect(
        appointmentService.bookAppointment('visit-1', slot, hw)
      ).rejects.toThrow('Appointment was not saved');
    });
  });
});
