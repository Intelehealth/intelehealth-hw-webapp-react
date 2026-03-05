import React from 'react';
import iconSearch from '../../assets/icons/icon-search.svg';
import DefaultUserImage from '../../assets/images/default-user-img.svg';
import type { RecentPatient } from '../../services/patient.service';
import { Input } from '../common';
import type { Patient } from '../navbar/patient-search/patient-search.hook';

interface PatientSearchModalProps {
  open: boolean;

  recentPatients: RecentPatient[];
  recentLoading?: boolean;
  recentError?: string | null;
  onSelectRecent: (patient: RecentPatient) => void;

  livePatients: Patient[];
  liveLoading?: boolean;

  searchTerm: string;
  onSearchChange: (term: string) => void;
  onClose: () => void;
}

const PatientSearchModal: React.FC<PatientSearchModalProps> = ({
  open,
  recentPatients,
  recentLoading,
  recentError,
  onSelectRecent,
  livePatients,
  liveLoading,
  searchTerm,
  onSearchChange,
  onClose,
}) => {
  if (!open) return null;

  const isSearching = searchTerm.trim().length > 0;
  const loading = isSearching ? liveLoading : recentLoading;

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

        {/* Search input inside modal */}
        <Input
          placeholder="Search by name or visit ID"
          value={searchTerm}
          onChange={e => onSearchChange(e.target.value)}
          leftIcon={<img src={iconSearch} alt="search" className="w-5 h-5" />}
          autoFocus
        />

        <div className="flex flex-col gap-3">
          <span className="text-xs text-gray-400 uppercase tracking-wide">
            {isSearching ? 'Search results' : 'Recent patients'}
          </span>

          {loading && (
            <div className="text-center text-gray-500">Loading...</div>
          )}

          {!loading && recentError && !isSearching && (
            <div className="text-center text-red-500">{recentError}</div>
          )}

          {/* Recent patients */}
          {!loading &&
            !isSearching &&
            (recentPatients.length === 0 ? (
              <div className="text-center text-gray-500">
                No recent patients.
              </div>
            ) : (
              recentPatients.map(patient => (
                <button
                  key={patient.visitUuid}
                  type="button"
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 cursor-pointer hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-left"
                  onClick={() => onSelectRecent(patient)}
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
              ))
            ))}

          {/* Live OpenMRS search results */}
          {!loading &&
            isSearching &&
            (livePatients.length === 0 ? (
              <div className="text-center text-gray-500">
                No patients found.
              </div>
            ) : (
              livePatients.map(patient => (
                <button
                  key={patient.uuid}
                  type="button"
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 cursor-pointer hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full text-left"
                  onClick={() =>
                    onSelectRecent({
                      visitUuid: patient.uuid,
                      patientName: patient.person.display,
                      gender: patient.person.gender,
                      age: patient.person.age,
                      visitCreatedDate: '',
                      clinicName: '',
                      uploadTimestamp: '',
                    })
                  }
                >
                  <img
                    src={DefaultUserImage}
                    alt="User"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {patient.person.display}
                    </span>
                    <span className="text-sm text-gray-500">
                      {patient.person.gender} • {patient.person.age} yrs
                    </span>
                    {patient.identifiers[0] && (
                      <span className="text-xs text-gray-400">
                        {patient.identifiers[0].identifierType.name}:{' '}
                        {patient.identifiers[0].identifier}
                      </span>
                    )}
                  </div>
                </button>
              ))
            ))}
        </div>
      </div>
    </div>
  );
};

export default PatientSearchModal;
