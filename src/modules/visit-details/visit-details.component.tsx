import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGlobalModal } from '../../components/modal/global-modal-context';
import { visitDetailsService } from './visit-details.service';
import type { TransformedVisitDetails } from './visit-details.types';
import iconPatientPhoto from '../../assets/icons/appiontment/icon-patient-image.svg';
import iconPhone from '../../assets/icons/appiontment/green-field-apm-phone-icon.svg';
import iconCalendar from '../../assets/icons/appiontment/icon-apm-calendar.svg';
import iconClock from '../../assets/icons/appiontment/icon-apm-clock-time.svg';
import iconGeneralPhysician from '../../assets/icons/appiontment/violet-field-apm-general-physician.svg';
import iconVisitSummary from '../../assets/icons/appiontment/violet-field-apm-visit-summary.svg';
import iconAngleRight from '../../assets/icons/appiontment/icon-apm-angle-small-right.svg';
import iconPrescription from '../../assets/icons/appiontment/violet-field-apm-prescription.svg';
import iconPrescriptionPlain from '../../assets/icons/appiontment/icons-patient-recevied.svg';
import iconVisitSummaryIcon from '../../assets/icons/icon-visit-summery.svg';
import iconPrint from '../../assets/icons/icon-print.svg';
import iconShare from '../../assets/icons/icon-share.svg';
import iconChat from '../../assets/icons/icon-chat.svg';
import Button from '../../components/common/button.component';

const PatientInfoCard: React.FC<{
  data: TransformedVisitDetails;
}> = ({ data }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img
          src={iconPatientPhoto}
          alt="patient"
          className="w-12 h-12 rounded-full shrink-0"
        />
        <div>
          <p className="font-semibold text-gray-800">
            {data.patientName}
            <span className="ml-2 text-sm font-normal text-gray-500">
              {data.gender}, {data.age} years
            </span>
          </p>
          <p className="text-xs text-gray-500">ID: {data.patientIdentifier}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="p-1 cursor-pointer"
          onClick={() => {
            /* TODO: Implement phone action */
          }}
          aria-label="Call patient"
        >
          <img src={iconPhone} alt="phone" className="w-7 h-7" />
        </button>
        <button
          className="p-1 cursor-pointer"
          onClick={() => {
            /* TODO: Implement chat action */
          }}
          aria-label="Message patient"
        >
          <img src={iconChat} alt="chat" className="w-7 h-7" />
        </button>
      </div>
    </div>
  </div>
);

const ChiefComplaintSection: React.FC<{
  data: TransformedVisitDetails;
}> = ({ data }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
    <h3 className="text-base font-semibold text-gray-800">
      Chief Complaint: {data.chiefComplaint}
    </h3>
    <p className="text-xs text-gray-400 mt-1">Visit ID: {data.visitId}</p>

    <div className="flex items-center gap-6 mt-3 text-sm text-gray-600">
      <span className="flex items-center gap-1.5">
        <img src={iconCalendar} alt="" className="w-4 h-4" />
        Date:{' '}
        <span className="font-semibold text-gray-800">{data.visitDate}</span>
      </span>
      <span className="text-gray-300">|</span>
      <span className="flex items-center gap-1.5">
        <img src={iconClock} alt="" className="w-4 h-4" />
        Time:{' '}
        <span className="font-semibold text-gray-800">{data.visitTime}</span>
      </span>
    </div>

    <div className="flex items-center gap-3 mt-4 bg-[#F5F5FA] rounded-lg p-3">
      <img src={iconGeneralPhysician} alt="" className="w-10 h-10 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-gray-800">
          {data.doctorSpeciality}
        </p>
        <p className="text-xs text-gray-400">Doctor's speciality</p>
      </div>
    </div>
  </div>
);

const NavigableRow: React.FC<{
  icon: string;
  title: string;
  subtitle?: string;
  subtitleColor?: string;
  onClick?: () => void;
}> = ({ icon, title, subtitle, subtitleColor = 'text-green-500', onClick }) => (
  <button
    type="button"
    className="w-full bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
    onClick={onClick}
  >
    <div className="flex items-center gap-3">
      <img src={icon} alt="" className="w-8 h-8 shrink-0" />
      <div className="text-left">
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        {subtitle && <p className={`text-xs ${subtitleColor}`}>{subtitle}</p>}
      </div>
    </div>
    <img src={iconAngleRight} alt=">" className="w-5 h-5" />
  </button>
);

const FollowUpSection: React.FC<{
  data: TransformedVisitDetails;
  onEndVisit: () => void;
}> = ({ data, onEndVisit }) => {
  if (data.visitStatus === 'Closed') return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      {data.followUpDate && (
        <>
          <h3 className="text-base font-semibold text-gray-800">
            Follow up on {data.followUpDate}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Your follow-up time has arrived. Please end the current visit to
            start your follow-up visit.
          </p>
        </>
      )}
      <div className={data.followUpDate ? 'mt-4' : ''}>
        <Button
          variant="primary"
          size="sm"
          fullWidth
          onClick={onEndVisit}
          className="hover:!bg-[#2b1a92] hover:!text-white hover:!border-[#2b1a92]"
        >
          End visit
        </Button>
      </div>
    </div>
  );
};

const VisitStatusCard: React.FC<{
  status: 'Active' | 'Closed';
}> = ({ status }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
    <h3 className="text-base font-semibold text-gray-800 mb-3">Visit Status</h3>
    <div className="flex items-center gap-2">
      <span
        className={`w-2.5 h-2.5 rounded-full ${
          status === 'Active' ? 'bg-[#06C270]' : 'bg-gray-400'
        }`}
      />
      <span
        className={`text-sm font-medium ${
          status === 'Active' ? 'text-gray-800' : 'text-gray-500'
        }`}
      >
        {status}
      </span>
    </div>
  </div>
);

const QuickActionsCard: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
    <h3 className="text-base font-semibold text-gray-800 mb-3">
      Quick Actions
    </h3>
    <div className="flex flex-col gap-2">
      <Button
        variant="secondary"
        size="sm"
        fullWidth
        className="hover:!bg-[#FAFAFF] hover:!border-[var(--color-primary-light)]"
        leftIcon={
          <img src={iconPrescriptionPlain} alt="" className="w-4 h-4" />
        }
        onClick={() => {
          /* TODO: Implement view prescription */
        }}
      >
        View Prescription
      </Button>
      <Button
        variant="secondary"
        size="sm"
        fullWidth
        className="hover:!bg-[#FAFAFF] hover:!border-[var(--color-primary-light)]"
        leftIcon={<img src={iconPrint} alt="" className="w-4 h-4" />}
        onClick={() => {
          /* TODO: Implement print */
        }}
      >
        Print
      </Button>
      <Button
        variant="secondary"
        size="sm"
        fullWidth
        className="hover:!bg-[#FAFAFF] hover:!border-[var(--color-primary-light)]"
        leftIcon={<img src={iconShare} alt="" className="w-4 h-4" />}
        onClick={() => {
          /* TODO: Implement share */
        }}
      >
        Share
      </Button>
    </div>
  </div>
);

const VisitDetails: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const { showConfirmModal } = useGlobalModal();
  const [data, setData] = useState<TransformedVisitDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visitId) return;

    setLoading(true);
    setError(null);

    visitDetailsService
      .getVisitDetails(visitId)
      .then(setData)
      .catch(() => setError('Failed to load visit details'))
      .finally(() => setLoading(false));
  }, [visitId]);

  const handleEndVisit = useCallback(() => {
    /* c8 ignore next */
    if (!visitId || !data) return;

    showConfirmModal({
      icon: iconVisitSummaryIcon,
      title: 'End visit?',
      description:
        'Are you sure you want to end this visit? This action cannot be undone.',
      confirmText: 'Yes, end visit',
      cancelText: 'Cancel',
      type: 'confirm',
      open: true,
      onConfirm: async () => {
        try {
          await visitDetailsService.endVisit(visitId);
          /* c8 ignore next */
          setData(prev => (prev ? { ...prev, visitStatus: 'Closed' } : prev));
        } catch (err) {
          console.error('Failed to end visit:', err);
        }
      },
    });
  }, [visitId, data, showConfirmModal]);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading visit details...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-10 text-center text-gray-500">
        {error ?? 'Visit not found'}
      </div>
    );
  }

  return (
    <div className="px-4 py-3 md:px-6 md:py-4 min-h-screen bg-[#F5F5FA]">
      {/* Back navigation */}
      <button
        className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer hover:text-gray-800 transition-colors"
        onClick={() => navigate(-1)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to Dashboard
      </button>

      <h1 className="text-xl font-bold text-gray-800 mt-1 mb-4">
        Visit details
      </h1>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* Main content */}
        <div className="flex flex-col gap-4">
          <PatientInfoCard data={data} />
          <ChiefComplaintSection data={data} />

          <NavigableRow
            icon={iconVisitSummary}
            title="Visit summary"
            onClick={() => {
              /* TODO: Navigate to visit summary */
            }}
          />

          <NavigableRow
            icon={iconPrescription}
            title="Prescription"
            subtitle={
              data.prescriptionDate
                ? `Received ${data.prescriptionDate}`
                : undefined
            }
            onClick={() => navigate(`/prescription-detail/${visitId}`)}
          />

          <FollowUpSection data={data} onEndVisit={handleEndVisit} />
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <VisitStatusCard status={data.visitStatus} />
          <QuickActionsCard />
        </div>
      </div>
    </div>
  );
};

export default VisitDetails;
