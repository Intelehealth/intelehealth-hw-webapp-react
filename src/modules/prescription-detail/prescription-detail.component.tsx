import React from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  Medication,
  PrescriptionData,
} from '../../assets/data/prescription-detail.data';
import { DUMMY_PRESCRIPTION } from '../../assets/data/prescription-detail.data';
import iconPatientPhoto from '../../assets/icons/appiontment/icon-patient-image.svg';
import iconAdvice from '../../assets/icons/icon-advice.svg';
import iconDownload from '../../assets/icons/icon-download.svg';
import iconFollowUp from '../../assets/icons/icon-followup-circle.svg';
import iconMedications from '../../assets/icons/icon-medications-circle.svg';
import iconPrintWhite from '../../assets/icons/icon-print-white.svg';
import iconReferral from '../../assets/icons/icon-referral-circle.svg';
import iconShareWhite from '../../assets/icons/icon-share-white.svg';
import iconBackArrow from '../../assets/icons/icon-back-arrow.svg';
import iconDiagnosis from '../../assets/icons/visit-reason.svg';
import iconTests from '../../assets/icons/vitals.svg';
import Button from '../../components/common/button.component';

/* ── Sub-components ── */

const PrescriptionHeader: React.FC<{ data: PrescriptionData }> = ({ data }) => (
  <div className="pb-3">
    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
      {/* Patient & Doctor info */}
      <div className="flex items-start gap-4">
        <img
          src={iconPatientPhoto}
          alt="patient"
          className="w-11 h-11 rounded-full shrink-0 mt-0.5"
        />
        <div className="text-sm">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-gray-500 font-medium">Patient:</span>
            <span className="font-semibold text-gray-800">
              {data.patientName}
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">Age: {data.age}</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">{data.gender}</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">ID: {data.patientIdentifier}</span>
          </div>
          {data.doctorName && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
              <span className="text-gray-500 font-medium">Doctor:</span>
              <span className="font-semibold text-gray-800">
                Dr. {data.doctorName}
              </span>
              {data.doctorQualification && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500">
                    Qualification: {data.doctorQualification}
                  </span>
                </>
              )}
            </div>
          )}
          <p className="text-xs text-gray-400 mt-2">Visit: {data.visitDate}</p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 shrink-0">
        <Button
          variant="primary"
          size="sm"
          leftIcon={<img src={iconPrintWhite} alt="" className="w-4 h-4" />}
          onClick={() => {
            /* TODO: Implement print */
          }}
        >
          Print
        </Button>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<img src={iconShareWhite} alt="" className="w-4 h-4" />}
          onClick={() => {
            /* TODO: Implement share */
          }}
        >
          Share
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="!border-[var(--color-primary)]"
          leftIcon={<img src={iconDownload} alt="" className="w-4 h-4" />}
          onClick={() => {
            /* TODO: Implement PDF download */
          }}
        >
          Download PDF
        </Button>
      </div>
    </div>
  </div>
);

const SectionWrapper: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}> = ({ icon, title, children }) => (
  <div className="py-5">
    <div className="flex items-center gap-2.5 mb-3">
      <span className="shrink-0">{icon}</span>
      <h3 className="text-base font-bold text-gray-800">{title}</h3>
    </div>
    <div className="pl-10">{children}</div>
  </div>
);

const DiagnosisSection: React.FC<{ diagnosis: string }> = ({ diagnosis }) => {
  if (!diagnosis) return null;
  return (
    <SectionWrapper
      icon={<img src={iconDiagnosis} alt="" className="w-7 h-7" />}
      title="Diagnosis"
    >
      <p className="text-sm text-gray-700">{diagnosis}</p>
    </SectionWrapper>
  );
};

const MedicationsTable: React.FC<{ medications: Medication[] }> = ({
  medications,
}) => {
  /* c8 ignore next */
  if (medications.length === 0) return null;
  return (
    <SectionWrapper
      icon={<img src={iconMedications} alt="" className="w-7 h-7" />}
      title="Prescribed Medications"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="pb-2 pr-6 font-medium w-[45%]">Medicine</th>
              <th className="pb-2 pr-6 font-medium w-[20%]">Strength</th>
              <th className="pb-2 pr-6 font-medium w-[20%]">Frequency</th>
              <th className="pb-2 font-medium w-[15%]">Duration</th>
            </tr>
          </thead>
          <tbody>
            {medications.map((med, idx) => (
              <tr key={idx} className="border-b border-gray-50 last:border-0">
                <td className="py-3 pr-6 text-gray-800">{med.name}</td>
                <td className="py-3 pr-6 text-gray-600">
                  {med.strength || '—'}
                </td>
                <td className="py-3 pr-6 text-gray-600">
                  {med.frequency || '—'}
                </td>
                <td className="py-3 text-gray-600">{med.duration || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionWrapper>
  );
};

const AdviceSection: React.FC<{ advice: string[] }> = ({ advice }) => {
  /* c8 ignore next */
  if (advice.length === 0) return null;
  return (
    <SectionWrapper
      icon={<img src={iconAdvice} alt="" className="w-7 h-7" />}
      title="Advice"
    >
      <ul className="space-y-1.5">
        {advice.map((item, idx) => (
          <li
            key={idx}
            className="text-sm text-[#06C270] flex items-start gap-2"
          >
            <span className="mt-0.5">&#8226;</span>
            {item}
          </li>
        ))}
      </ul>
    </SectionWrapper>
  );
};

const TestsSection: React.FC<{ tests: string[] }> = ({ tests }) => {
  /* c8 ignore next */
  if (tests.length === 0) return null;
  return (
    <SectionWrapper
      icon={<img src={iconTests} alt="" className="w-7 h-7" />}
      title="Tests Recommended"
    >
      <ul className="space-y-1.5">
        {tests.map((item, idx) => (
          <li
            key={idx}
            className="text-sm text-gray-700 flex items-start gap-2"
          >
            <span className="text-gray-400 mt-0.5">&#8226;</span>
            {item}
          </li>
        ))}
      </ul>
    </SectionWrapper>
  );
};

const ReferredSpecialistSection: React.FC<{ specialist: string | null }> = ({
  specialist,
}) => {
  /* c8 ignore next */
  if (!specialist) return null;
  return (
    <SectionWrapper
      icon={<img src={iconReferral} alt="" className="w-7 h-7" />}
      title="Referred Specialist"
    >
      <p className="text-sm text-gray-700">{specialist}</p>
    </SectionWrapper>
  );
};

const FollowUpSection: React.FC<{ followUpDate: string | null }> = ({
  followUpDate,
}) => {
  /* c8 ignore next */
  if (!followUpDate) return null;
  return (
    <SectionWrapper
      icon={<img src={iconFollowUp} alt="" className="w-7 h-7" />}
      title="Follow-up"
    >
      <p className="text-sm text-gray-700">{followUpDate}</p>
    </SectionWrapper>
  );
};

/* ── Main Component ── */

const PrescriptionDetail: React.FC = () => {
  const navigate = useNavigate();

  // TODO: Replace with API call using visitId from useParams
  const data = DUMMY_PRESCRIPTION;

  const hasSections =
    data.diagnosis ||
    data.medications.length > 0 ||
    data.advice.length > 0 ||
    data.testsRecommended.length > 0 ||
    data.referredSpecialist ||
    data.followUpDate;

  return (
    <div className="bg-[#F5F5FA] p-4 md:p-5">
      {/* Back navigation – in gray area outside the card */}
      <button
        className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer hover:text-gray-800 transition-colors mb-4"
        onClick={() => navigate(-1)}
      >
        <img src={iconBackArrow} alt="" className="w-4 h-4 shrink-0" />
        Back to Dashboard
      </button>
      <div className=" max-w-4xl mx-auto">
        {/* White card */}
        <div className="bg-white rounded-xl border border-gray-200 px-8 py-6">
          <PrescriptionHeader data={data} />

          <hr className="border-t border-gray-200 mt-3 mb-1" />
          <DiagnosisSection diagnosis={data.diagnosis} />

          {data.medications.length > 0 && (
            <>
              <hr className="border-t border-gray-200 my-1" />
              <MedicationsTable medications={data.medications} />
            </>
          )}

          {data.advice.length > 0 && (
            <>
              <hr className="border-t border-gray-200 my-1" />
              <AdviceSection advice={data.advice} />
            </>
          )}

          {data.testsRecommended.length > 0 && (
            <>
              <hr className="border-t border-gray-200 my-1" />
              <TestsSection tests={data.testsRecommended} />
            </>
          )}

          {data.referredSpecialist && (
            <>
              <hr className="border-t border-gray-200 my-1" />
              <ReferredSpecialistSection specialist={data.referredSpecialist} />
            </>
          )}

          {data.followUpDate && (
            <>
              <hr className="border-t border-gray-200 my-1" />
              <FollowUpSection followUpDate={data.followUpDate} />
            </>
          )}

          {!hasSections && (
            <div className="py-8 text-center text-gray-400 text-sm">
              No prescription data available for this visit.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionDetail;
