import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import iconPhoneRounded from '../../assets/icons/appointment/green-field-apm-phone-icon.svg';
import iconWatsappsRounded from '../../assets/icons/appointment/green-field-apm-wattsapps.svg';
import iconAngleSmallRight from '../../assets/icons/appointment/icon-angle-small-right.svg';
import iconsApmArrowRight from '../../assets/icons/appointment/icon-apm-arrow-right.svg';
import iconCalendar from '../../assets/icons/appointment/icon-apm-calendar.svg';
import iconClock from '../../assets/icons/appointment/icon-apm-clock-time.svg';
import icongreenClock from '../../assets/icons/appointment/icon-apm-clocktime.svg';
import iconPatientPhoto from '../../assets/icons/appointment/icon-patient-image.svg';
import iconEdit from '../../assets/icons/appointment/icons-apm-edit.svg';
import iconsvioletFieldAppointmentDetails from '../../assets/icons/appointment/violet-field-apm-appointment-details-icon.svg';
import iconGeneralphysician from '../../assets/icons/appointment/violet-field-apm-general-physician.svg';
import iconVisitsummary from '../../assets/icons/appointment/violet-field-apm-visit-summary.svg';
import { useProfileContext } from '../../context/ProfileContext';
import { useAppointmentDetail } from '../../hooks/useAppointmentDetail';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import ROUTES from '../../routes/paths';
import {
  appointmentService,
  mapBookedAppointment,
} from './appointment.service';

export default function AppointmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  useBreadcrumb([
    { label: 'Dashboard', path: ROUTES.DASHBOARD },
    { label: 'My Appointments', path: ROUTES.MY_APPOINTMENTS },
    { label: 'Appointment Details' },
  ]);

  const {
    data: raw,
    loading,
    error,
    refetch,
  } = useAppointmentDetail(Number(id));
  const { hwProfile } = useProfileContext();

  const [pendingAction, setPendingAction] = useState<
    'reschedule' | 'cancel' | null
  >(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const closeReasonModal = () => {
    setPendingAction(null);
    setReason('');
    setActionError(null);
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading appointment...
      </div>
    );
  }

  if (!raw) {
    return <div className="p-10 text-center text-gray-500">{error}</div>;
  }

  const appointment = mapBookedAppointment(raw);
  const isUpcoming = appointment.type === 'upcoming';
  const history = raw.rescheduledAppointments ?? [];

  const submitReason = async () => {
    if (!reason.trim()) {
      setActionError('Please enter a reason.');
      return;
    }
    if (pendingAction === 'reschedule') {
      navigate(`/appointment-schedule/${raw.visitUuid}`, {
        state: {
          speciality: raw.speciality,
          appointmentId: raw.id,
          reason: reason.trim(),
        },
      });
      return;
    }

    setSubmitting(true);
    setActionError(null);
    try {
      await appointmentService.cancelAppointment({
        id: raw.id,
        visitUuid: raw.visitUuid,
        hwUUID: hwProfile?.userUuid ?? raw.hwUUID,
        reason: reason.trim(),
      });
      closeReasonModal();
      await refetch();
    } catch {
      setActionError('Unable to cancel the appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'BOOKED':
        return 'bg-indigo-100 text-indigo-600';
      case 'COMPLETED':
        return 'bg-green-100 text-green-600';
      case 'CANCELLED':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div>
      <div className="w-full bg-white rounded-xl p-4 md:p-5">
        <div className="hidden md:flex items-center gap-3">
          <img src={iconsvioletFieldAppointmentDetails} alt="appointments" />
          <span className="text-base font-semibold tracking-wide">
            My appointments
          </span>
        </div>

        <hr className="hidden md:block border-t border-gray-200 mt-2 mb-4" />

        {/* Patient Info */}
        <div className="border border-[#E5E7EB] rounded-xl p-4 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src={iconsApmArrowRight}
                alt="back"
                className="w-5 h-5 cursor-pointer"
                onClick={() => navigate(-1)}
              />
              <img
                src={iconPatientPhoto}
                alt="patient"
                className="w-12 h-12 rounded-full shrink-0"
              />

              <div>
                <p className="font-semibold flex gap-1 text-gray-800">
                  {appointment.patientName}
                  <span className="ml-2 text-sm text-gray-500">
                    {appointment.gender} {appointment.age}
                  </span>
                  <img src={iconEdit} alt="edit" />
                </p>
                <p className="text-xs text-gray-500">
                  ID - {appointment.openMrsId}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <img src={iconPhoneRounded} className="p-2" />
              <img src={iconWatsappsRounded} className="p-2" />
            </div>
          </div>
        </div>

        {/* Appointment Card */}
        <div className="border border-[#E5E7EB] rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4">
            <div>
              <p className="text-base font-semibold text-gray-800">
                {appointment.speciality}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Visit ID: {appointment.visitId}
              </p>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-600">
                <span className="flex gap-1 items-center">
                  <img src={iconCalendar} />
                  {appointment.dateTime}
                </span>
                <span className="flex gap-1 items-center">
                  <img src={iconClock} />
                  {raw.slotTime}
                </span>
              </div>

              {isUpcoming && appointment.timeUntil && (
                <p className="mt-2 flex gap-1 text-sm text-[#34CC8B] font-medium">
                  <img src={icongreenClock} />
                  Starts {appointment.timeUntil}
                </p>
              )}

              {raw.reason && (
                <p className="mt-2 text-sm text-gray-500">
                  Reason: {raw.reason}
                </p>
              )}
            </div>

            <div>
              <span
                className={`rounded-md px-3 py-1 text-xs font-semibold ${getStatusStyle(
                  appointment.status
                )}`}
              >
                {appointment.status}
              </span>
            </div>
          </div>
          <hr className="my-4 border-gray-200" />
          {/* General Physician Section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <img src={iconGeneralphysician} className="w-8 h-8 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Doctor's speciality</p>
                <p className="text-sm font-semibold text-gray-800">
                  {appointment.speciality}
                </p>
                {appointment.drName && (
                  <p className="text-xs text-gray-500">{appointment.drName}</p>
                )}
              </div>
            </div>

            <div className="hidden sm:block h-10 w-px bg-gray-200 shrink-0"></div>

            <button
              type="button"
              onClick={() =>
                navigate(`/visit-summary/${raw.visitUuid}`, {
                  state: {
                    fromLabel: 'Appointment Details',
                    fromPath: `/my-appointments/${raw.id}`,
                  },
                })
              }
              className="flex items-center gap-3 flex-1 text-left cursor-pointer"
            >
              <img src={iconVisitsummary} className="w-8 h-8 shrink-0" />
              <p className="text-sm font-semibold text-gray-800 flex-1">
                Visit summary
              </p>
              <img src={iconAngleSmallRight} alt=">" className="w-5 h-5" />
            </button>
          </div>

          {appointment.hwName && (
            <>
              <hr className="my-4 border-gray-200" />
              <div>
                <p className="text-xs text-gray-400">Booked by</p>
                <p className="text-sm font-semibold text-gray-800">
                  {appointment.hwName}
                </p>
              </div>
            </>
          )}
        </div>

        {history.length > 0 && (
          <div className="border border-[#E5E7EB] rounded-xl p-4 mt-4">
            <p className="text-sm font-semibold text-gray-800 mb-2">
              Previously scheduled
            </p>
            <div className="space-y-2">
              {history.map(prev => (
                <div
                  key={prev.id}
                  className="flex items-center gap-3 text-sm text-gray-600"
                >
                  <img src={iconCalendar} />
                  <span>
                    {prev.slotDate} at {prev.slotTime}
                  </span>
                  <span className="text-xs text-gray-400">{prev.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isUpcoming && appointment.status === 'BOOKED' && (
          <div className="mt-4 flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              onClick={() => setPendingAction('cancel')}
              className="rounded-lg bg-[#E1DCFF] px-5 py-2 text-sm font-medium text-[#2F1E91] hover:bg-[#CFC7FF] transition"
            >
              Cancel
            </button>
            <button
              onClick={() => setPendingAction('reschedule')}
              className="rounded-lg bg-[#2F1E91] px-5 py-2 text-sm font-medium text-white hover:bg-[#241674] transition"
            >
              Reschedule
            </button>
          </div>
        )}
      </div>

      {pendingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5">
            <p className="text-base font-semibold text-gray-800">
              {pendingAction === 'cancel'
                ? 'Cancel appointment?'
                : 'Reschedule appointment?'}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Please provide a reason. This is required.
            </p>
            <textarea
              aria-label="Reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              className="mt-3 w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Enter a reason"
            />
            {actionError && (
              <p className="mt-2 text-sm text-red-500">{actionError}</p>
            )}
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={closeReasonModal}
                disabled={submitting}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={submitReason}
                disabled={submitting}
                className="rounded-lg bg-[#2F1E91] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {submitting ? 'Please wait...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
