import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { visitSummaryData } from '../../assets/data/visit-summary.data';
import { visitSummaryService } from './visit-summary.service';
import type {
  VisitData,
  Patient,
  Vitals,
  CheckupReason,
  PhysicalExamination,
  HistorySection,
} from '../../assets/data/visit-summary.data';
import CollapsedComponent from './visit-summary-collapsed.component';
import iconPatientImage from '../../assets/icons/appointment/icon-patient-image.svg';
import iconVisitSummary from '../../assets/icons/icon-visit-summery.svg';
import iconPhysicalExam from '../../assets/icons/icon-physical-examination.svg';
import iconVitals from '../../assets/icons/vitals.svg';
import iconVisitReason from '../../assets/icons/visit-reason.svg';
import iconSync from '../../assets/icons/icon-sync.svg';
import iconThreeDot from '../../assets/icons/icon-more-horizontal.svg';
import iconChevronDown from '../../assets/icons/icon-chevron-down.svg';
import iconInfo from '../../assets/icons/icon-info.svg';
import Dropdown from '../../components/common/dropdown.component';
import Toggle from '../../components/common/toggle.component';

const LabelValueRow: React.FC<{
  label: string;
  value: string;
  compact?: boolean;
}> = ({ label, value, compact = false }) => (
  <div className={`flex items-center text-sm ${compact ? '' : 'py-1'}`}>
    <span className="text-[#7F7B92] w-1/2 shrink-0">{label}</span>
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
      <div className="md:hidden space-y-1">
        <LabelValueRow label="CHW worker" value={patient.chwWorker} compact />
        <LabelValueRow label="Visit ID" value={patient.visitId} compact />
      </div>

      <div className="hidden md:block lg:hidden space-y-1">
        {desktopItems.map(({ label, value }) => (
          <LabelValueRow key={label} label={label} value={value} compact />
        ))}
      </div>

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
      <div className="md:hidden">
        {items.map(({ label, value }) => (
          <LabelValueRow key={label} label={label} value={value} />
        ))}
      </div>

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
          className="inline-flex items-center justify-center min-w-[105px] h-[26px] bg-[#2E1E91] text-white text-xs font-semibold rounded-[4px] mr-2 gap-1 py-1 px-2 whitespace-nowrap"
        >
          {complaint}
        </span>
      ))}
    </div>
    {checkupReason.details.length > 0 && (
      <div>
        {checkupReason.details.map(({ label, value }) => (
          <LabelValueRow key={label} label={label} value={value} />
        ))}
      </div>
    )}
    {checkupReason.associatedSymptoms &&
      checkupReason.associatedSymptoms.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-bold text-gray-800 mb-2">
            Associated symptoms
          </p>
          {checkupReason.associatedSymptoms.map((symptom, idx) => (
            <div key={idx} className="ml-1 mb-2">
              <p className="text-sm text-gray-600 font-medium">
                {symptom.heading}:
              </p>
              <div className="ml-3 mt-1 space-y-1">
                {symptom.values.map((val, vIdx) => (
                  <div key={vIdx} className="flex items-start gap-2 text-sm">
                    <span className="text-gray-500 font-bold mt-0.5">
                      &#8226;
                    </span>
                    <span className="text-gray-900">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
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

const MedicalHistorySection: React.FC<{ sections: HistorySection[] }> = ({
  sections,
}) => (
  <div>
    {sections.map((section, sIdx) => (
      <div key={sIdx} className={sIdx > 0 ? 'mt-3' : ''}>
        <p className="text-sm font-bold text-gray-800 mb-2">{section.title}</p>
        {section.details.map(({ label, value }, idx) => (
          <LabelValueRow key={idx} label={label} value={value} />
        ))}
      </div>
    ))}
  </div>
);

const VisitSummaryComponent: React.FC = () => {
  const { visitId } = useParams<{ visitId: string }>();
  const [allOpen, setAllOpen] = useState(true);
  const [data, setData] = useState<VisitData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visitId) {
      setData(visitSummaryData[0] ?? null);
      return;
    }

    setLoading(true);
    setError(null);

    visitSummaryService
      .getVisitSummary(visitId)
      .then(setData)
      .catch(() => setError('Failed to load visit summary'))
      .finally(() => setLoading(false));
  }, [visitId]);

  const toggleAll = useCallback(() => setAllOpen(prev => !prev), []);

  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading visit summary...
      </div>
    );
  }

  if (error) {
    return <div className="p-10 text-center text-gray-500">{error}</div>;
  }

  if (!data) {
    return (
      <div className="p-10 text-center text-gray-500">
        No visit summary data found
      </div>
    );
  }

  const {
    patient,
    vitals,
    checkupReason,
    physicalExamination,
    medicalHistory,
    speciality,
    priorityVisit,
  } = data;

  return (
    <div className="w-full bg-white md:rounded-xl md:p-4">
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

      <div className="hidden md:flex items-center gap-3 mb-2">
        <img src={iconVisitSummary} alt="icon" />
        <span className="text-sm font-medium text-[#2E1E91]">
          Visit Summary
        </span>
      </div>
      <hr className="hidden md:block border-t border-gray-200 mt-2 mb-3 md:-mx-4" />

      <div className="px-4 md:px-0">
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

          <div className="md:col-span-2">
            <CollapsedComponent
              icon={iconVitals}
              title="Vitals"
              contentLabel="Details"
              defaultOpen={allOpen}
              key={`vitals-${allOpen}`}
            >
              <VitalsSection vitals={vitals} />
            </CollapsedComponent>
          </div>

          <CollapsedComponent
            icon={iconVisitReason}
            title="Check-up reason"
            defaultOpen={allOpen}
            key={`checkup-${allOpen}`}
          >
            {checkupReason.chiefComplaints.length > 0 &&
            checkupReason.chiefComplaints[0] !== 'No information' ? (
              <CheckupReasonSection checkupReason={checkupReason} />
            ) : (
              <p className="text-gray-400 italic text-sm">
                No visit reason recorded
              </p>
            )}
          </CollapsedComponent>

          <CollapsedComponent
            icon={iconPhysicalExam}
            title="Physical examination"
            contentLabel="General exams"
            defaultOpen={allOpen}
            key={`physical-${allOpen}`}
          >
            <PhysicalExaminationSection
              physicalExamination={physicalExamination}
            />
          </CollapsedComponent>

          {/* Medical History — full width */}
          <div className="md:col-span-2">
            <CollapsedComponent
              icon={iconVisitSummary}
              title="Medical History"
              defaultOpen={allOpen}
              key={`medical-${allOpen}`}
            >
              {medicalHistory && medicalHistory.length > 0 ? (
                <MedicalHistorySection sections={medicalHistory} />
              ) : (
                <p className="text-gray-400 italic text-sm">
                  No medical history recorded
                </p>
              )}
            </CollapsedComponent>
          </div>
        </div>
      </div>

      {/* Doctor's Specialty & Priority Visit — view only (disabled) */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 mt-4 px-4 mb-4 md:px-0">
        <div className="w-full md:w-1/2 border border-gray-200 rounded-xl p-4 md:border-0 md:p-0 md:rounded-none">
          <p className="text-sm font-semibold text-[#2E1E91] mb-1.5">
            Doctor&apos;s specialty
          </p>
          <Dropdown
            options={
              speciality ? [{ value: speciality, label: speciality }] : []
            }
            value={speciality || ''}
            placeholder="General physician"
            size="sm"
            disabled
          />
        </div>

        <div className="w-full md:w-1/2 flex items-center justify-between gap-2 border border-gray-200 rounded-xl p-4 md:border-0 md:p-0 md:rounded-none md:mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#2E1E91]">
              Priority Visit
            </span>
            <img src={iconInfo} alt="info" className="w-4 h-4 opacity-40" />
          </div>
          <div className="w-12">
            <Toggle checked={!!priorityVisit} size="md" disabled />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitSummaryComponent;
