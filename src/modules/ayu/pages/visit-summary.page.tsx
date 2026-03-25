import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  CheckupReason,
  PhysicalExamination,
  Vitals,
} from '../../../assets/data/visit-summary.data';
import iconChevronDown from '../../../assets/icons/icon-chevron-down.svg';
import iconPhysicalExam from '../../../assets/icons/icon-physical-examination.svg';
import iconVisitSummary from '../../../assets/icons/icon-visit-summery.svg';
import iconVisitReason from '../../../assets/icons/visit-reason.svg';
import iconVitals from '../../../assets/icons/vitals.svg';
import { useProfileContext } from '../../../context/ProfileContext';
import { showToast } from '../../../services/toast';
import { storage } from '../../../utils/storage';
import CollapsedComponent from '../../visit-summary/visit-summary-collapsed.component';
import { useStartVisitData } from '../context/start-visit.context';
import { PHYSICAL_EXAM_QUESTIONS } from '../data/physical-exam.data';
import { ConfirmationModal } from '../../../components/modal/confirmation.modal';
import type { ModalSectionItem } from '../../../components/modal/global-modal-context';
import type { MedicalHistorySummary } from '../context/start-visit.context';
import {
  buildFamilyHistoryData,
  buildMedicalHistoryData,
  buildPhysicalExamData,
  buildVisitReasonHtml,
  buildVisitUploadPayload,
  uploadVisit,
} from '../services/visit-upload.service';
import type { VitalsFormValues } from '../types/vitals.types';
import { ITEM_TYPES } from '../utils/ayu.constants';

const PRIMARY_COLOR = '#0fd197';

/* ── Reusable row (same as visit-summary.component.tsx) ─────────────────── */

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

/* ── Data mappers ───────────────────────────────────────────────────────── */

const mapVitals = (formValues: VitalsFormValues): Vitals => {
  const v = (val?: number) => ({
    value: val ?? null,
    note: val == null ? 'No information' : undefined,
  });

  return {
    height: v(formValues.height_cm),
    weight: v(formValues.weight_kg),
    bmi: { value: formValues.bmi ?? 0 },
    bp: {
      systolic: formValues.bp_systolic ?? 0,
      diastolic: formValues.bp_diastolic ?? 0,
    },
    pulse: v(formValues.pulse_bpm),
    temperature: v(formValues.temprature_f),
    spo2: v(formValues.spo2),
    respiratoryRate: v(formValues.respiratory_rate),
  };
};

const mapPhysicalExam = (
  answers: Record<string, string[]>
): PhysicalExamination => {
  const generalExams = PHYSICAL_EXAM_QUESTIONS.filter(
    q => (answers[q.id] ?? []).length > 0
  ).map(q => {
    const selectedTexts = (answers[q.id] ?? [])
      .map(id => q.options.find(o => o.id === id)?.text)
      .filter(Boolean);
    return { label: q.categoryLabel, value: selectedTexts.join(', ') };
  });

  return { generalExams };
};

/* ── Section renderers (same UI as visit-summary.component.tsx) ─────────── */

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
      label: 'SpO\u2082(%)',
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
    <div>
      {checkupReason.details.map(({ label, value }) => (
        <LabelValueRow key={label} label={label} value={value} />
      ))}
    </div>
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

const MedicalHistorySection: React.FC<{
  sections: MedicalHistorySummary[];
}> = ({ sections }) => (
  <div>
    {sections.map((section, sIdx) => (
      <div key={sIdx}>
        {section.items.map((item: ModalSectionItem, iIdx: number) => {
          if (item.type === ITEM_TYPES.LABEL_VALUE) {
            return (
              <LabelValueRow
                key={iIdx}
                label={item.label}
                value={String(item.value ?? 'No information')}
              />
            );
          }
          if (item.type === ITEM_TYPES.SUBHEADING) {
            return (
              <p
                key={iIdx}
                className="text-sm font-semibold text-gray-500 mt-3 mb-1"
              >
                {item.heading}
              </p>
            );
          }
          return null;
        })}
      </div>
    ))}
  </div>
);

/* ── Page ────────────────────────────────────────────────────────────────── */

const VisitSummaryPage = () => {
  const navigate = useNavigate();
  const { data, patientUuid: ctxPatientUuid } = useStartVisitData();
  const { hwProfile } = useProfileContext();
  const [allOpen, setAllOpen] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const toggleAll = useCallback(() => setAllOpen(prev => !prev), []);

  const handleUploadVisit = useCallback(async () => {
    if (
      !data.vitals ||
      !data.visitReason ||
      !data.physicalExam ||
      !data.medicalHistory
    ) {
      showToast(
        'Error',
        'Please complete all sections before uploading',
        'error'
      );
      return;
    }

    const patientUuid = ctxPatientUuid || storage.get('patientUuid');
    const locationUuid = storage.getLocationUuid();
    const providerUuid = hwProfile?.providerUuid;

    if (!patientUuid || !locationUuid || !providerUuid) {
      showToast(
        'Error',
        'Missing patient, location, or provider information',
        'error'
      );
      return;
    }

    setIsUploading(true);
    try {
      const visitReason = buildVisitReasonHtml(
        data.visitReason.details,
        data.visitReason.reasonNames
      );

      const physicalExam = buildPhysicalExamData(
        data.physicalExam.answers,
        PHYSICAL_EXAM_QUESTIONS
      );

      const medicalHistory = buildMedicalHistoryData(
        data.medicalHistory.patHistSummary
      );
      const familyHistory = buildFamilyHistoryData(
        data.medicalHistory.famHistSummary
      );

      const payload = buildVisitUploadPayload({
        patientUuid,
        providerUuid,
        locationUuid,
        vitalsFormValues: data.vitals.formValues,
        vitalsConfig: data.vitals.config,
        visitReason,
        physicalExam,
        medicalHistory,
        familyHistory,
      });

      await uploadVisit(payload);
      showToast('Success', 'Visit uploaded successfully', 'success');
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to upload visit:', error);
      showToast('Error', 'Failed to upload visit. Please try again.', 'error');
    } finally {
      setIsUploading(false);
    }
  }, [data, hwProfile, navigate, ctxPatientUuid]);

  const confirmAndUpload = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const vitals = useMemo(
    () => (data.vitals ? mapVitals(data.vitals.formValues) : null),
    [data.vitals]
  );

  const checkupReason = useMemo(
    (): CheckupReason | null =>
      data.visitReason
        ? {
            chiefComplaints: data.visitReason.reasonNames,
            details: data.visitReason.details,
          }
        : null,
    [data.visitReason]
  );

  const physicalExamination = useMemo(
    () =>
      data.physicalExam ? mapPhysicalExam(data.physicalExam.answers) : null,
    [data.physicalExam]
  );

  return (
    <div className="w-full bg-white md:rounded-xl md:p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <img src={iconVisitSummary} alt="icon" />
        <span className="text-sm font-medium text-[#2E1E91]">
          Visit Summary
        </span>
      </div>
      <hr className="border-t border-gray-200 mt-2 mb-3 md:-mx-4" />

      <div className="px-4 md:px-0">
        {/* Toggle all */}
        <div className="flex justify-end py-2">
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
          {/* Vitals — full width */}
          <div className="md:col-span-2">
            <CollapsedComponent
              icon={iconVitals}
              title="Vitals"
              contentLabel="Details"
              defaultOpen={allOpen}
              key={`vitals-${allOpen}`}
            >
              {vitals ? (
                <VitalsSection vitals={vitals} />
              ) : (
                <p className="text-gray-400 italic text-sm">
                  No vitals recorded
                </p>
              )}
            </CollapsedComponent>
          </div>

          {/* Check-up reason */}
          <CollapsedComponent
            icon={iconVisitReason}
            title="Check-up reason"
            defaultOpen={allOpen}
            key={`checkup-${allOpen}`}
          >
            {checkupReason ? (
              <CheckupReasonSection checkupReason={checkupReason} />
            ) : (
              <p className="text-gray-400 italic text-sm">
                No visit reason recorded
              </p>
            )}
          </CollapsedComponent>

          {/* Physical examination */}
          <CollapsedComponent
            icon={iconPhysicalExam}
            title="Physical examination"
            contentLabel="General exams"
            defaultOpen={allOpen}
            key={`physical-${allOpen}`}
          >
            {physicalExamination ? (
              <PhysicalExaminationSection
                physicalExamination={physicalExamination}
              />
            ) : (
              <p className="text-gray-400 italic text-sm">
                No physical exam recorded
              </p>
            )}
          </CollapsedComponent>

          {/* Medical History — full width */}
          <div className="md:col-span-2">
            <CollapsedComponent
              icon={iconVisitSummary}
              title="Medical History"
              contentLabel="Family History"
              defaultOpen={allOpen}
              key={`medical-${allOpen}`}
            >
              {data.medicalHistory ? (
                <MedicalHistorySection
                  sections={[
                    ...data.medicalHistory.patHistSummary,
                    ...data.medicalHistory.famHistSummary,
                  ]}
                />
              ) : (
                <p className="text-gray-400 italic text-sm">
                  No medical history recorded
                </p>
              )}
            </CollapsedComponent>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between gap-3 mt-6 px-4 md:px-0 pb-4">
        <button
          type="button"
          onClick={() => navigate('/ayu')}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Edit
        </button>
        <button
          type="button"
          onClick={confirmAndUpload}
          disabled={isUploading}
          className="rounded-lg px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: PRIMARY_COLOR }}
        >
          {isUploading ? 'Uploading...' : 'Upload Visit'}
        </button>
      </div>

      {/* Send Visit confirmation */}
      {showConfirm && (
        <ConfirmationModal
          open={showConfirm}
          type="confirm"
          title="Send Visit"
          description="Are you sure you want to upload this visit?"
          confirmText="Yes"
          cancelText="No"
          onClose={() => setShowConfirm(false)}
          onConfirm={() => {
            setShowConfirm(false);
            handleUploadVisit();
          }}
        />
      )}
    </div>
  );
};

export default VisitSummaryPage;
