import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { visitSummaryData } from '../../assets/data/visit-summary.data';
import { visitSummaryService } from './visit-summary.service';
import { useGlobalModal } from '../../components/modal/global-modal-context';
import ROUTES from '../../routes/paths';
import type {
  Patient,
  Vitals,
  CheckupReason,
  PhysicalExamination,
} from '../../assets/data/visit-summary.data';
import CollapsedComponent from './visit-summary-collapsed.component';
import iconPatientImage from '../../assets/icons/appiontment/icon-patient-image.svg';
import iconVisitSummary from '../../assets/icons/icon-visit-summery.svg';
import iconPhysicalExam from '../../assets/icons/icon-physical-examination.svg';
import iconVitals from '../../assets/icons/vitals.svg';
import iconVisitReason from '../../assets/icons/visit-reason.svg';
import iconSync from '../../assets/icons/icon-sync.svg';
import iconThreeDot from '../../assets/icons/icon-more-horizontal.svg';
import iconChevronDown from '../../assets/icons/icon-chevron-down.svg';
import iconEdit from '../../assets/icons/edit.svg';
import iconSendVisit from '../../assets/icons/icon-send-visit.svg';

const LabelValueRow: React.FC<{
  label: string;
  value: string;
  compact?: boolean;
}> = ({ label, value, compact = false }) => (
  <div className={`flex items-center text-sm ${compact ? '' : 'py-1'}`}>
    <span className="text-[#7F7B92] flex items-center gap-2 w-1/2 shrink-0">
      <span className="w-1 h-1 rounded-full bg-[#E5E5E9] shrink-0" />
      {label}
    </span>
    <span
      className={`font-medium ${value === 'No information' ? 'text-gray-400 italic' : 'text-gray-800'}`}
    >
      {value}
    </span>
  </div>
);

const PatientHeader: React.FC<{ patient: Patient }> = ({ patient }) => {
  const desktopItems = [
    { label: 'Gender', value: patient.gender },
    { label: 'CHW worker', value: patient.chwWorker },
    { label: 'Age', value: patient.age },
    { label: 'Date of birth', value: patient.dateOfBirth },
    { label: 'Visit ID', value: patient.visitId },
    { label: 'Phone number', value: patient.phoneNumber },
  ];
  const columns = [
    desktopItems.slice(0, 2),
    desktopItems.slice(2, 4),
    desktopItems.slice(4, 6),
  ];

  return (
    <>
      {/* Mobile: bullet-style list with only CHW worker & Visit ID */}
      <div className="md:hidden space-y-1">
        <LabelValueRow label="CHW worker" value={patient.chwWorker} compact />
        <LabelValueRow label="Visit ID" value={patient.visitId} compact />
      </div>

      {/* Tablet: single column */}
      <div className="hidden md:block lg:hidden space-y-1">
        {desktopItems.map(({ label, value }) => (
          <LabelValueRow key={label} label={label} value={value} compact />
        ))}
      </div>

      {/* Desktop: 3-column layout with vertical dividers */}
      <div className="hidden lg:flex text-sm">
        {columns.map((col, idx) => (
          <React.Fragment key={idx}>
            {idx > 0 && <div className="w-px bg-gray-200 mx-4" />}
            <div className="flex-1 space-y-2">
              {col.map(({ label, value }) => (
                <LabelValueRow
                  key={label}
                  label={label}
                  value={value}
                  compact
                />
              ))}
            </div>
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

const VitalsSection: React.FC<{ vitals: Vitals }> = ({ vitals }) => {
  const getVitalDisplay = (val: number | null, note?: string) =>
    val?.toString() ?? note ?? 'No information';

  const items = [
    {
      label: 'Height(cm)',
      value: getVitalDisplay(vitals.height.value, vitals.height.note),
    },
    {
      label: 'Weight(kg)',
      value: getVitalDisplay(vitals.weight.value, vitals.weight.note),
    },
    { label: 'BMI', value: vitals.bmi.value.toString() },
    { label: 'BP', value: `${vitals.bp.systolic}/${vitals.bp.diastolic}` },
    {
      label: 'Pulse',
      value: getVitalDisplay(vitals.pulse.value, vitals.pulse.note),
    },
    {
      label: 'Temperature(F)',
      value: getVitalDisplay(vitals.temperature.value, vitals.temperature.note),
    },
    {
      label: 'SpO₂(%)',
      value: getVitalDisplay(vitals.spo2.value, vitals.spo2.note),
    },
    {
      label: 'Respiratory rate',
      value: getVitalDisplay(
        vitals.respiratoryRate.value,
        vitals.respiratoryRate.note
      ),
    },
  ];

  const leftItems = items.slice(0, 4);
  const rightItems = items.slice(4);

  return (
    <>
      {/* Mobile: single column */}
      <div className="md:hidden">
        {items.map(({ label, value }) => (
          <LabelValueRow key={label} label={label} value={value} />
        ))}
      </div>

      {/* Desktop: two columns */}
      <div className="hidden md:grid grid-cols-2 gap-x-10">
        {[leftItems, rightItems].map((column, colIdx) => (
          <div key={colIdx}>
            {column.map(({ label, value }) => (
              <LabelValueRow key={label} label={label} value={value} />
            ))}
          </div>
        ))}
      </div>
    </>
  );
};

const CheckupReasonSection: React.FC<{ checkupReason: CheckupReason }> = ({
  checkupReason,
}) => (
  <>
    <p className="text-sm font-semibold text-gray-500 mb-2 text-center">
      Chief complaint(s)
    </p>
    <div className="mb-2">
      {checkupReason.chiefComplaints.map(complaint => (
        <span
          key={complaint}
          className="inline-flex items-center justify-center w-[105px] h-[26px] bg-[#2E1E91] text-white text-xs font-semibold rounded-[4px] mr-2 gap-1 py-1 px-2 whitespace-nowrap"
        >
          {complaint}
        </span>
      ))}
    </div>
    {checkupReason.chiefComplaints.map(complaint => (
      <div key={complaint}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-bold text-gray-800">{complaint}</span>
          <span
            role="button"
            tabIndex={0}
            className="flex items-center gap-1.5 text-xs text-[#2F1E91] font-medium cursor-pointer border border-[#E1DCFF] rounded-md px-3 py-1 hover:bg-[#E1DCFF] transition-colors"
          >
            <img src={iconEdit} alt="" className="w-3.5 h-3.5" />
            Change
          </span>
        </div>
        <div>
          {checkupReason.details.map(({ label, value }) => (
            <LabelValueRow key={label} label={label} value={value} />
          ))}
        </div>
      </div>
    ))}
  </>
);

const PhysicalExaminationSection: React.FC<{
  physicalExamination: PhysicalExamination;
}> = ({ physicalExamination }) => (
  <div>
    {physicalExamination.generalExams.map(({ label, value }, idx) => (
      <LabelValueRow key={idx} label={label} value={value} />
    ))}
  </div>
);

const VisitSummaryComponent: React.FC = () => {
  const { action } = useParams<{ action: string }>();
  const navigate = useNavigate();
  const { showConfirmModal } = useGlobalModal();
  const isCloseVisit = action === 'close';
  const [allOpen, setAllOpen] = useState(true);
  const data = visitSummaryData[0];

  const toggleAll = useCallback(() => setAllOpen(prev => !prev), []);

  const handleCloseVisit = useCallback(async (visitUuid: string) => {
    try {
      await visitSummaryService.closeVisit(visitUuid);
    } catch (error) {
      console.error('Failed to close visit:', error);
    }
  }, []);

  const handleAppointment = useCallback(() => {
    showConfirmModal({
      icon: iconVisitSummary,
      title: 'Book appointment?',
      description:
        'Are you sure you want to book an appointment for this patient?',
      confirmText: 'Yes',
      cancelText: 'No',
      type: 'confirm',
      open: true,
      onConfirm: () => {
        navigate(ROUTES.APPOINTMENT_VISIT_SHEDULE);
      },
    });
  }, [showConfirmModal, navigate]);

  const handleSendVisit = useCallback(() => {
    showConfirmModal({
      icon: iconSendVisit,
      title: 'Send visit',
      description: 'Are you sure you want to send the visit to the doctor?',
      confirmText: 'Yes',
      cancelText: 'No',
      type: 'confirm',
      open: true,
      onConfirm: () => {
        // TODO: Add send visit API call
      },
    });
  }, [showConfirmModal]);

  if (!data) {
    return (
      <div className="p-10 text-center text-gray-500">
        No visit summary data found
      </div>
    );
  }

  const { patient, vitals, checkupReason, physicalExamination } = data;

  return (
    <div className="w-full bg-white md:rounded-xl md:p-4">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 sticky top-0 bg-white z-10">
        <div className="flex items-center gap-3">
          <button className="p-1">
            <i className="fa-solid fa-arrow-left text-gray-600 text-lg" />
          </button>
          <h2 className="text-base font-bold text-gray-900">Visit summary</h2>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-1">
            <img src={iconSync} alt="sync" className="w-5 h-5" />
          </button>
          <button className="p-1">
            <img src={iconThreeDot} alt="menu" className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center gap-3 mb-2">
        <img src={iconVisitSummary} alt="icon" />
        <span className="text-sm font-medium text-[#2E1E91]">
          Visit Summary
        </span>
      </div>
      <hr className="hidden md:block border-t border-gray-200 mt-2 mb-3 md:-mx-4" />

      <div className="px-4 md:px-0">
        {/* Mobile "Close all / Open all" toggle */}
        <div className="md:hidden flex justify-end py-2">
          <button
            className="flex items-center gap-1 text-xs text-gray-500"
            onClick={toggleAll}
          >
            {allOpen ? 'Close all' : 'Open all'}
            <img
              src={iconChevronDown}
              alt=""
              className={`w-3.5 h-3.5 transition-transform ${allOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
          {/* Patient Info — full width */}
          <div className="md:col-span-2">
            <CollapsedComponent
              icon={iconPatientImage}
              title={`${patient.name}  M ${patient.age.replace(' Years', '')}`}
              subtitle={`ID: ${patient.id}`}
              defaultOpen={allOpen}
              key={`patient-${allOpen}`}
            >
              <PatientHeader patient={patient} />
            </CollapsedComponent>
          </div>

          {/* Vitals — full width */}
          <div className="md:col-span-2">
            <CollapsedComponent
              icon={iconVitals}
              title="Vitals"
              contentLabel="Details"
              onChangeClick={() => {}}
              defaultOpen={allOpen}
              key={`vitals-${allOpen}`}
            >
              <VitalsSection vitals={vitals} />
            </CollapsedComponent>
          </div>

          {/* Check-up reason */}
          <CollapsedComponent
            icon={iconVisitReason}
            title="Check-up reason"
            defaultOpen={allOpen}
            key={`checkup-${allOpen}`}
          >
            <CheckupReasonSection checkupReason={checkupReason} />
          </CollapsedComponent>

          {/* Physical examination */}
          <CollapsedComponent
            icon={iconPhysicalExam}
            title="Physical examination"
            contentLabel="General exams"
            onChangeClick={() => {}}
            defaultOpen={allOpen}
            key={`physical-${allOpen}`}
          >
            <PhysicalExaminationSection
              physicalExamination={physicalExamination}
            />
          </CollapsedComponent>
        </div>
      </div>

      {/* Action Buttons — desktop */}
      <div className="hidden md:flex justify-end gap-3 mt-3">
        {isCloseVisit ? (
          <button
            className="rounded-lg bg-[#2E1E91] px-5 py-2 text-sm font-medium text-white hover:bg-gray-100"
            onClick={() => handleCloseVisit(patient.visitId)}
          >
            Close visit
          </button>
        ) : (
          <>
            <button
              className="rounded-lg bg-[#2E1E91] px-5 py-2 text-sm font-medium text-white hover:bg-gray-100"
              onClick={handleAppointment}
            >
              Appointment
            </button>
            <button
              className="rounded-lg bg-[#2E1E91] px-5 py-2 text-sm font-medium text-white hover:bg-[#241878]"
              onClick={handleSendVisit}
            >
              Send visit
            </button>
          </>
        )}
      </div>

      {/* Action Buttons — mobile fixed above DownMenu */}
      <div className="fixed bottom-[70px] left-0 right-0 z-50 flex gap-3 bg-white border-t border-gray-200 px-4 py-3 md:hidden">
        {isCloseVisit ? (
          <button
            className="w-1/2 h-[48px] rounded-[8px] bg-[#2E1E91] text-sm font-semibold text-white"
            onClick={() => handleCloseVisit(patient.visitId)}
          >
            Close visit
          </button>
        ) : (
          <>
            <button
              className="flex-1 h-[48px] rounded-[8px] border border-[#2E1E91] bg-[#2E1E91]  text-sm font-semibold text-white"
              onClick={handleAppointment}
            >
              Appointment
            </button>
            <button
              className="flex-1 h-[48px] rounded-[8px] bg-[#2E1E91] text-sm font-semibold text-white"
              onClick={handleSendVisit}
            >
              Send visit
            </button>
          </>
        )}
      </div>

      {/* Spacer for fixed bottom bar + DownMenu on mobile */}
      <div className="h-36 md:hidden" />
    </div>
  );
};

export default VisitSummaryComponent;
