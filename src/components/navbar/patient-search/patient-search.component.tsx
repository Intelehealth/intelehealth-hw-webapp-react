import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import iconSearch from '../../../assets/icons/icon-search.svg';
import { Input } from '../../common';
import PatientSearchDropdown from './patient-search-dropdown.component';
import { type Patient, usePatientSearch } from './patient-search.hook';

const PatientSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const navigate = useNavigate();
  const { patients, loading } = usePatientSearch(searchTerm);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (patient: Patient) => {
    setShowDropdown(false);
    setSearchTerm('');
    setActiveIndex(-1);
    navigate(`/patient/${patient.uuid}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setActiveIndex(-1);
        return; // stop here
    }

    // For other keys, require dropdown + patients
    if (!showDropdown || !patients.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev < patients.length - 1 ? prev + 1 : 0));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : patients.length - 1));
        break;

      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0) {
          handleSelect(patients[activeIndex]);
        }
        break;
    }
  };
  //As discussed with Zeeshan commenting the search modal related changes
  // const [modalOpen, setModalOpen] = useState(false);
  // const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  // const [recentLoading, setRecentLoading] = useState(false);
  // const [recentError, setRecentError] = useState<string | null>(null);

  // const { patients: livePatients, loading: liveLoading } =
  //   usePatientSearch(searchTerm);

  // const { profile } = useProfileContext();
  // const hwId = profile?.id;
  // const navigate = useNavigate();
  // const wrapperRef = useRef<HTMLDivElement>(null);

  // useEffect(() => {
  //   if (modalOpen && hwId && recentPatients.length === 0) {
  //     setRecentLoading(true);
  //     setRecentError(null);
  //     patientService
  //       .getRecentPatients(hwId)
  //       .then(data => {
  //         setRecentPatients(data);
  //         setRecentLoading(false);
  //       })
  //       .catch(() => {
  //         setRecentError('Failed to fetch recent patients');
  //         setRecentLoading(false);
  //       });
  //   }
  // }, [modalOpen, hwId]);

  // const handleSelect = (patient: RecentPatient) => {
  //   setModalOpen(false);
  //   setSearchTerm('');
  //   navigate(`/visit/${patient.visitUuid}`);
  // };

  // const handleClose = () => {
  //   setModalOpen(false);
  //   setSearchTerm('');
  // };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <Input
        placeholder="Patient Search"
        size="wide"
        variant="default"
        value={searchTerm}
        onChange={e => {
          setSearchTerm(e.target.value);
          setShowDropdown(true);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          setShowDropdown(true);
        }}
        onKeyDown={handleKeyDown}
        leftIcon={<img src={iconSearch} alt="search" className="w-6 h-6" />}
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls="patient-search-list"
        aria-autocomplete="list"
      />

      {showDropdown && searchTerm && (
        <PatientSearchDropdown
          patients={patients}
          loading={loading}
          activeIndex={activeIndex}
          setActiveIndex={setActiveIndex}
          onSelect={handleSelect}
        />
      )}
    </div>
  );
  // <div ref={wrapperRef} className="relative w-full">
  //   <Input
  //     placeholder="Patient Search"
  //     size="wide"
  //     variant="default"
  //     value=""
  //     readOnly
  //     onFocus={() => setModalOpen(true)}
  //     leftIcon={<img src={iconSearch} alt="search" className="w-6 h-6" />}
  //     role="combobox"
  //     aria-expanded={modalOpen}
  //     aria-autocomplete="list"
  //   />
  //   <PatientSearchModal
  //     open={modalOpen}
  //     recentPatients={recentPatients}
  //     recentLoading={recentLoading}
  //     recentError={recentError}
  //     onSelectRecent={handleSelect}
  //     livePatients={livePatients}
  //     liveLoading={liveLoading}
  //     searchTerm={searchTerm}
  //     onSearchChange={setSearchTerm}
  //     onClose={handleClose}
  //   />
  // </div>
};

export default PatientSearch;
