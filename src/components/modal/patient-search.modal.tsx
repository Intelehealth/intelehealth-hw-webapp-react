import React from 'react';
import DefaultUserImage from '../../assets/images/default-user-img.svg';
import type { RecentPatient } from '../../services/patient.service';

interface PatientSearchModalProps {
  open: boolean;
  patients: RecentPatient[];
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSelect: (patient: RecentPatient) => void;
}

const PatientSearchModal: React.FC<PatientSearchModalProps> = ({
  open,
  patients,
  loading,
  error,
  onClose,
  onSelect,
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-center items-center">
      <div className="bg-white w-[90vw] sm:w-112.5 lg:w-140 max-h-[80vh] overflow-y-auto p-5 sm:p-6 rounded-2xl flex flex-col gap-4 relative">
        <h2 className="text-center font-semibold text-black-800 mb-2">
          Patient Search
        </h2>
        <button
          className="absolute top-4 right-6 text-gray-500"
          onClick={onClose}
        >
          ✕
        </button>
        <div className="flex flex-col gap-3">
          {loading && (
            <div className="text-center text-gray-500">Loading...</div>
          )}
          {!loading && error && (
            <div className="text-center text-red-500">{error}</div>
          )}
          {!loading && !error && patients.length === 0 && (
            <div className="text-center text-gray-500">No patients found.</div>
          )}
          {!loading &&
            !error &&
            patients.length > 0 &&
            patients.map(patient => (
              <button
                key={patient.visitUuid}
                type="button"
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 cursor-pointer hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-left"
                onClick={() => onSelect(patient)}
              >
                <img
                  src={DefaultUserImage}
                  alt="User"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex flex-col">
                  <span className="font-semibold">{patient.patientName}</span>
                  <span className="text-sm text-gray-500">
                    {patient.gender} • {patient.age ?? ''} •{' '}
                    {patient.clinicName}
                  </span>
                  <span className="text-xs text-gray-400">
                    Visit: {patient.visitCreatedDate}
                  </span>
                </div>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PatientSearchModal;
