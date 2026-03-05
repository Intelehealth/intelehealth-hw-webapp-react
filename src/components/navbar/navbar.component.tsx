import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import iconLocation from '../../assets/icons/icon-location.svg';
import iconNotification from '../../assets/icons/icon-notification.svg';
import iconSearch from '../../assets/icons/icon-search.svg';
import iconSync from '../../assets/icons/icon-sync.svg';
import DefaultUserImage from '../../assets/images/default-user-img.svg';
import { useProfileContext } from '../../context/ProfileContext';
import ROUTES from '../../routes/paths';
import type { RecentPatient } from '../../services/patient.service';
import { patientService } from '../../services/patient.service';
import { storage } from '../../utils/storage';
import { Input } from '../common';
import PatientSearchModal from '../modal/patient-search.modal';

const Navbar = () => {
  const { profile } = useProfileContext();
  const locationName =
    storage.getLocationName() || profile?.setupLocation || '';
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<RecentPatient[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get HW ID from profile context
  const hwId = profile?.id;

  React.useEffect(() => {
    if (searchModalOpen && hwId) {
      setLoading(true);
      patientService
        .getRecentPatients(hwId)
        .then(data => {
          setSearchResults(data);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to fetch patients');
          setLoading(false);
        });
    }
  }, [searchModalOpen, hwId]);

  // Filter patients by name or visitUuid
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    setSearchResults(prev =>
      prev.filter(
        p =>
          p.patientName.toLowerCase().includes(value.toLowerCase()) ||
          p.visitUuid.toLowerCase().includes(value.toLowerCase())
      )
    );
  };

  const handlePatientSelect = () => {
    setSearchModalOpen(false);
  };

  return (
    <header className="bg-white shadow-md flex flex-col justify-between gap-4 items-center p-4 rounded-lg">
      {/* Desktop */}
      <div className="flex justify-between items-center w-full gap-4">
        <div className="items-center space-x-2 w-4/12 hidden md:flex">
          <Input
            placeholder="Patient Search"
            size="lg"
            className="w-full cursor-pointer"
            leftIcon={<img src={iconSearch} alt="search" className="w-6 h-6" />}
            value={searchValue}
            onChange={handleSearchChange}
            onFocus={() => setSearchModalOpen(true)}
            readOnly={false}
          />
        </div>
        <div className="flex flex-col w-8/12 md:w-6/12 pl-12 md:pl-4">
          <div className="flex gap-2">
            <img src={iconLocation} alt="Location" className="w-6 h-6" />
            <span className="text-(--color-muted)">{locationName}</span>
          </div>
          {/* <span className="text-(--color-muted)">
            Last sync: 12:30 pm, 12 May 2022
          </span> */}
        </div>
        <div className="flex items-center space-x-2 ml-auto gap-4">
          <img src={iconSync} alt="Sync" className="w-6 h-6" />
          <img src={iconNotification} alt="Notification" className="w-6 h-6" />
          <Link
            to={ROUTES.PROFILE}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img
              src={profile?.avatar || DefaultUserImage}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
              onError={e => {
                e.currentTarget.src = DefaultUserImage;
              }}
            />
          </Link>
        </div>
      </div>

      <div className="w-full md:hidden">
        <Input
          placeholder="Patient Search"
          leftIcon={<img src={iconSearch} alt="search" className="w-6 h-6" />}
          value={searchValue}
          onChange={handleSearchChange}
          onFocus={() => setSearchModalOpen(true)}
          readOnly={false}
        />
      </div>

      {/* Patient Search Modal */}
      <PatientSearchModal
        open={searchModalOpen}
        patients={searchResults}
        loading={loading}
        error={error}
        onClose={() => setSearchModalOpen(false)}
        onSelect={handlePatientSelect}
      />
    </header>
  );
};

export default Navbar;
