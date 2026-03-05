import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import iconSearch from '../../../assets/icons/icon-search.svg';
import { useProfileContext } from '../../../context/ProfileContext';
import type { RecentPatient } from '../../../services/patient.service';
import { patientService } from '../../../services/patient.service';
import { Input } from '../../common';
import PatientSearchModal from '../../modal/patient-search.modal';
import { usePatientSearch } from './patient-search.hook';

const PatientSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentError, setRecentError] = useState<string | null>(null);

  const { patients: livePatients, loading: liveLoading } =
    usePatientSearch(searchTerm);

  const { profile } = useProfileContext();
  const hwId = profile?.id;
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (modalOpen && hwId && recentPatients.length === 0) {
      setRecentLoading(true);
      setRecentError(null);
      patientService
        .getRecentPatients(hwId)
        .then(data => {
          setRecentPatients(data);
          setRecentLoading(false);
        })
        .catch(() => {
          setRecentError('Failed to fetch recent patients');
          setRecentLoading(false);
        });
    }
  }, [modalOpen, hwId]);

  const handleSelect = (patient: RecentPatient) => {
    setModalOpen(false);
    setSearchTerm('');
    navigate(`/visit/${patient.visitUuid}`);
  };

  const handleClose = () => {
    setModalOpen(false);
    setSearchTerm('');
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <Input
        placeholder="Patient Search"
        size="wide"
        variant="default"
        value=""
        readOnly
        onFocus={() => setModalOpen(true)}
        leftIcon={<img src={iconSearch} alt="search" className="w-6 h-6" />}
        role="combobox"
        aria-expanded={modalOpen}
        aria-autocomplete="list"
      />
      <PatientSearchModal
        open={modalOpen}
        recentPatients={recentPatients}
        recentLoading={recentLoading}
        recentError={recentError}
        onSelectRecent={handleSelect}
        livePatients={livePatients}
        liveLoading={liveLoading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClose={handleClose}
      />
    </div>
  );
};

export default PatientSearch;
