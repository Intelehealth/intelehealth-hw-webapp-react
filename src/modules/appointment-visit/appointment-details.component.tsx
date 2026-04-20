import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import iconPhoneRounded from '../../assets/icons/appointment/green-field-apm-phone-icon.svg';
import iconWatsappsRounded from '../../assets/icons/appointment/green-field-apm-wattsapps.svg';
import iconCalendar from '../../assets/icons/appointment/icon-apm-calendar.svg';
import iconClock from '../../assets/icons/appointment/icon-apm-clock-time.svg';
import icongreenClock from '../../assets/icons/appointment/icon-apm-clocktime.svg';
import iconsvioletFieldAppointmentDetails from '../../assets/icons/appointment/violet-field-apm-appointment-details-icon.svg';
import iconGeneralphysician from '../../assets/icons/appointment/violet-field-apm-general-physician.svg';
import iconVisitsummary from '../../assets/icons/appointment/violet-field-apm-visit-summary.svg';
import iconPatientPhoto from '../../assets/icons/appointment/icon-patient-image.svg';
import iconEdit from '../../assets/icons/appointment/icons-apm-edit.svg';
import iconAngleSmallRight from '../../assets/icons/appointment/icon-angle-small-right.svg';
import iconsPatientRecevied from '../../assets/icons/appointment/icons-patient-recevied.svg';
import iconsApmArrowRight from '../../assets/icons/appointment/icon-apm-arrow-right.svg';
import { appointmentsDetailData } from '../../assets/data/appointments.data';

export default function AppointmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  const filteredAppointments = appointmentsDetailData.filter(
    item => item.type === activeTab
  );

  const appointment =
    filteredAppointments.find(item => item.id === Number(id)) ||
    filteredAppointments[0];

  /* c8 ignore next 7 */
  if (!appointment) {
    return (
      <div className="p-10 text-center text-gray-500">
        No appointments found
      </div>
    );
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'PRIORITY':
        return 'bg-red-100 text-red-600';
      case 'COMPLETED':
        return 'bg-green-100 text-green-600';
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

        {/* Tabs (Border limited to container only) */}
        <div className="mb-4">
          <div className="inline-flex gap-[10px] text-sm font-medium border-b border-gray-200">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`pb-3 border-b-2 text-center transition ${
                activeTab === 'upcoming'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-[#FBE9E9] text-gray-400 hover:text-indigo-600'
              }`}
            >
              <img
                src={iconsPatientRecevied}
                alt="received"
                className="inline w-4 mr-1"
              />
              Upcoming (
              {appointmentsDetailData.filter(a => a.type === 'upcoming').length}
              )
            </button>

            <button
              onClick={() => setActiveTab('past')}
              className={`pb-3 border-b-2 text-center transition ${
                activeTab === 'past'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-[#FBE9E9] text-gray-400 hover:text-indigo-600'
              }`}
            >
              <img
                src={iconsPatientRecevied}
                alt="received"
                className="inline w-4 mr-1"
              />
              Past (
              {appointmentsDetailData.filter(a => a.type === 'past').length})
            </button>
          </div>
        </div>

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
                  ID - {appointment.visitId}
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
                {appointment.symptom}
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Visit ID: {appointment.visitId}
              </p>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-600">
                <span className="flex gap-1 items-center">
                  <img src={iconCalendar} />
                  {appointment.date}
                </span>
                <span className="flex gap-1 items-center">
                  <img src={iconClock} />
                  {appointment.time}
                </span>
              </div>

              {activeTab === 'upcoming' && (
                <p className="mt-2 flex gap-1 text-sm text-[#34CC8B] font-medium">
                  <img src={icongreenClock} />
                  Starts in 2 minutes
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
              </div>
            </div>

            <div className="hidden sm:block h-10 w-px bg-gray-200 shrink-0"></div>

            <div className="flex items-center gap-3 flex-1 ">
              <img src={iconVisitsummary} className="w-8 h-8 shrink-0" />
              <p className="text-sm font-semibold text-gray-800 flex-1">
                Visit summary
              </p>
              <img src={iconAngleSmallRight} alt=">" className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {activeTab === 'upcoming' && (
          <div className="mt-4 flex flex-col sm:flex-row sm:justify-end gap-3">
            <button className="rounded-lg bg-[#E1DCFF] px-5 py-2 text-sm font-medium text-[#2F1E91] hover:bg-gray-100">
              Cancel
            </button>
            <button className="rounded-lg bg-[#E1DCFF] px-5 py-2 text-sm font-medium text-[#2F1E91] hover:bg-indigo-900 transition">
              Reschedule
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
