import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppointmentDetails from '../../../modules/appointment-visit/appointment-details.component';
import { BreadcrumbProvider } from '../../../context/BreadcrumbContext';
import type { RawBookedAppointment } from '../../../assets/data/appointments.data';

const mockUseParams = vi.fn(() => ({ id: '11' }));
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useNavigate: () => mockNavigate,
  };
});

const { mockGetAppointmentById, mockCancelAppointment, locationHolder } =
  vi.hoisted(() => ({
    mockGetAppointmentById: vi.fn(),
    mockCancelAppointment: vi.fn(),
    locationHolder: { value: 'location-uuid-1' as string | null },
  }));

let mockHwProfile: { userUuid: string } | null = { userUuid: 'hw-uuid-1' };

vi.mock('../../../context/ProfileContext', () => ({
  useProfileContext: () => ({ hwProfile: mockHwProfile }),
}));

vi.mock('../../../utils/storage', () => ({
  storage: {
    getLocationUuid: () => locationHolder.value,
    getLocationName: () => 'Telemedicine Clinic 1',
    getAuthToken: () => null,
  },
}));

vi.mock('../../../modules/appointment-visit/appointment.service', async () => {
  const actual = await vi.importActual<Record<string, unknown>>(
    '../../../modules/appointment-visit/appointment.service'
  );
  return {
    ...actual,
    appointmentService: {
      getAppointmentById: (...args: unknown[]) =>
        mockGetAppointmentById(...args),
      cancelAppointment: (...args: unknown[]) => mockCancelAppointment(...args),
    },
  };
});

const futureSlot = () => {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d;
};

const buildAppointment = (
  overrides: Partial<RawBookedAppointment> = {}
): RawBookedAppointment => {
  const slot = futureSlot();
  const dd = String(slot.getDate()).padStart(2, '0');
  const mm = String(slot.getMonth() + 1).padStart(2, '0');
  return {
    id: 11,
    slotDay: 'Wednesday',
    slotDate: `${dd}/${mm}/${slot.getFullYear()}`,
    slotJsDate: slot.toISOString(),
    slotDuration: 30,
    slotDurationUnit: 'minutes',
    slotTime: '9:30 PM',
    speciality: 'General Physician',
    userUuid: 'doctor-uuid-1',
    drName: 'Doctor One',
    visitUuid: 'visit-uuid-1',
    patientId: 'patient-uuid-1',
    locationUuid: 'location-uuid-1',
    hwUUID: 'hw-uuid-1',
    patientName: 'ClaudeTest Test Appointment',
    openMrsId: '167JM-8',
    status: 'booked',
    reason: null,
    patientAge: '30',
    patientGender: 'M',
    hwName: null,
    type: 'appointment',
    createdAt: '2026-09-02T05:33:02.000Z',
    rescheduledAppointments: [],
    ...overrides,
  };
};

const renderComponent = () =>
  render(
    <BreadcrumbProvider>
      <AppointmentDetails />
    </BreadcrumbProvider>
  );

describe('AppointmentDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ id: '11' });
    locationHolder.value = 'location-uuid-1';
    mockGetAppointmentById.mockResolvedValue(buildAppointment());
    mockCancelAppointment.mockResolvedValue({ status: true });
    mockHwProfile = { userUuid: 'hw-uuid-1' };
  });

  describe('Loading and error states', () => {
    it('shows a loading state first', () => {
      renderComponent();
      expect(screen.getByText('Loading appointment...')).toBeInTheDocument();
    });

    it('shows not found when the appointment does not exist', async () => {
      mockGetAppointmentById.mockResolvedValue(null);
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText('Appointment not found.')).toBeInTheDocument()
      );
    });

    it('shows an error when the request fails', async () => {
      mockGetAppointmentById.mockRejectedValue(new Error('network'));
      renderComponent();
      await waitFor(() =>
        expect(
          screen.getByText('Unable to load the appointment. Please try again.')
        ).toBeInTheDocument()
      );
    });

    it('does not fetch when no location is stored', async () => {
      locationHolder.value = null;
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText('Appointment not found.')).toBeInTheDocument()
      );
      expect(mockGetAppointmentById).not.toHaveBeenCalled();
    });
  });

  describe('Rendering real appointment data', () => {
    it('requests the appointment id from the route param', async () => {
      renderComponent();
      await waitFor(() => expect(mockGetAppointmentById).toHaveBeenCalled());
      expect(mockGetAppointmentById).toHaveBeenCalledWith(
        'location-uuid-1',
        11,
        expect.any(String),
        expect.any(String)
      );
    });

    it('renders the patient name and OpenMRS id', async () => {
      renderComponent();
      await waitFor(() =>
        expect(
          screen.getByText('ClaudeTest Test Appointment')
        ).toBeInTheDocument()
      );
      expect(screen.getByText('ID - 167JM-8')).toBeInTheDocument();
    });

    it('renders the visit id and speciality', async () => {
      renderComponent();
      await waitFor(() =>
        expect(
          screen.getByText('Visit ID: visit-uuid-1')
        ).toBeInTheDocument()
      );
      expect(screen.getAllByText('General Physician').length).toBeGreaterThan(0);
    });

    it('renders the doctor name', async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText('Doctor One')).toBeInTheDocument()
      );
    });

    it('renders the status badge from the record', async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText('BOOKED')).toBeInTheDocument()
      );
    });

    it('opens the visit summary for this visit', async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText('Visit summary')).toBeInTheDocument()
      );
      fireEvent.click(screen.getByText('Visit summary'));
      expect(mockNavigate).toHaveBeenCalledWith(
        '/visit-summary/visit-uuid-1',
        {
          state: {
            fromLabel: 'Appointment Details',
            fromPath: '/my-appointments/11',
          },
        }
      );
    });

    it('navigates back when the back arrow is clicked', async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByAltText('back')).toBeInTheDocument()
      );
      fireEvent.click(screen.getByAltText('back'));
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('Health worker section', () => {
    it('is omitted when the middleware dropped hwName', async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText('BOOKED')).toBeInTheDocument()
      );
      expect(screen.queryByText('Booked by')).not.toBeInTheDocument();
    });

    it('is shown when hwName is present', async () => {
      mockGetAppointmentById.mockResolvedValue(
        buildAppointment({ hwName: 'Jane Test Smith' })
      );
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText('Booked by')).toBeInTheDocument()
      );
      expect(screen.getByText('Jane Test Smith')).toBeInTheDocument();
    });
  });

  describe('Reason and history', () => {
    it('shows the cancellation reason when present', async () => {
      mockGetAppointmentById.mockResolvedValue(
        buildAppointment({
          status: 'cancelled',
          reason: "Doctor's change in schedule.",
        })
      );
      renderComponent();
      await waitFor(() =>
        expect(
          screen.getByText("Reason: Doctor's change in schedule.")
        ).toBeInTheDocument()
      );
    });

    it('renders previously scheduled slots from history', async () => {
      mockGetAppointmentById.mockResolvedValue(
        buildAppointment({
          rescheduledAppointments: [
            buildAppointment({
              id: 4,
              slotDate: '15/06/2026',
              slotTime: '3:30 PM',
              status: 'rescheduled',
            }),
          ],
        })
      );
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText('Previously scheduled')).toBeInTheDocument()
      );
      expect(screen.getByText('15/06/2026 at 3:30 PM')).toBeInTheDocument();
      expect(screen.getByText('rescheduled')).toBeInTheDocument();
    });

    it('omits the history block when there is none', async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText('BOOKED')).toBeInTheDocument()
      );
      expect(screen.queryByText('Previously scheduled')).not.toBeInTheDocument();
    });
  });

  describe('Action buttons', () => {
    it('shows Cancel and Reschedule for an upcoming booked appointment', async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText('Reschedule')).toBeInTheDocument()
      );
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('hides the actions for a cancelled appointment', async () => {
      mockGetAppointmentById.mockResolvedValue(
        buildAppointment({ status: 'cancelled' })
      );
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText('CANCELLED')).toBeInTheDocument()
      );
      expect(screen.queryByText('Reschedule')).not.toBeInTheDocument();
    });

    it('hides the actions for a past appointment', async () => {
      const past = new Date();
      past.setDate(past.getDate() - 5);
      mockGetAppointmentById.mockResolvedValue(
        buildAppointment({ slotJsDate: past.toISOString() })
      );
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText('BOOKED')).toBeInTheDocument()
      );
      expect(screen.queryByText('Reschedule')).not.toBeInTheDocument();
    });
  });

  describe('Cancel and reschedule actions', () => {
    const openAction = async (label: string) => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText(label)).toBeInTheDocument()
      );
      fireEvent.click(screen.getByText(label));
    };

    it('requires a reason before cancelling', async () => {
      await openAction('Cancel');
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      await waitFor(() =>
        expect(screen.getByText('Please enter a reason.')).toBeInTheDocument()
      );
      expect(mockCancelAppointment).not.toHaveBeenCalled();
    });

    it('cancels with the entered reason', async () => {
      await openAction('Cancel');
      fireEvent.change(screen.getByLabelText('Reason'), {
        target: { value: 'Patient is not available' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      await waitFor(() =>
        expect(mockCancelAppointment).toHaveBeenCalledWith({
          id: 11,
          visitUuid: 'visit-uuid-1',
          hwUUID: 'hw-uuid-1',
          reason: 'Patient is not available',
        })
      );
    });

    it('shows an error when cancelling fails', async () => {
      mockCancelAppointment.mockRejectedValue(new Error('boom'));
      await openAction('Cancel');
      fireEvent.change(screen.getByLabelText('Reason'), {
        target: { value: 'Patient is not available' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      await waitFor(() =>
        expect(
          screen.getByText('Unable to cancel the appointment. Please try again.')
        ).toBeInTheDocument()
      );
    });

    it('navigates to the slot picker with appointmentId and reason', async () => {
      await openAction('Reschedule');
      fireEvent.change(screen.getByLabelText('Reason'), {
        target: { value: 'Doctor is not available' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith(
          '/appointment-schedule/visit-uuid-1',
          {
            state: {
              speciality: 'General Physician',
              appointmentId: 11,
              reason: 'Doctor is not available',
            },
          }
        )
      );
      expect(mockCancelAppointment).not.toHaveBeenCalled();
    });

    it('closes the reason modal without acting', async () => {
      await openAction('Cancel');
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      await waitFor(() =>
        expect(screen.queryByLabelText('Reason')).not.toBeInTheDocument()
      );
      expect(mockCancelAppointment).not.toHaveBeenCalled();
    });
  });

  describe('Status styling and optional fields', () => {
    it('styles a completed appointment green', async () => {
      mockGetAppointmentById.mockResolvedValue(
        buildAppointment({ status: 'completed' })
      );
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText('COMPLETED')).toBeInTheDocument()
      );
      expect(screen.getByText('COMPLETED')).toHaveClass('bg-green-100');
    });

    it('falls back to neutral styling for an unknown status', async () => {
      mockGetAppointmentById.mockResolvedValue(
        buildAppointment({ status: 'pending' })
      );
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText('PENDING')).toBeInTheDocument()
      );
      expect(screen.getByText('PENDING')).toHaveClass('bg-gray-100');
    });

    it('handles a record with no rescheduledAppointments field', async () => {
      const appointment = buildAppointment();
      delete appointment.rescheduledAppointments;
      mockGetAppointmentById.mockResolvedValue(appointment);
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText('BOOKED')).toBeInTheDocument()
      );
      expect(screen.queryByText('Previously scheduled')).not.toBeInTheDocument();
    });

    it('cancels using the record hwUUID when no profile is loaded', async () => {
      mockHwProfile = null;
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText('Cancel')).toBeInTheDocument()
      );
      fireEvent.click(screen.getByText('Cancel'));
      fireEvent.change(screen.getByLabelText('Reason'), {
        target: { value: 'Patient is not available' },
      });
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      await waitFor(() =>
        expect(mockCancelAppointment).toHaveBeenCalledWith(
          expect.objectContaining({ hwUUID: 'hw-uuid-1' })
        )
      );
    });
  });
});
