import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import iconFilter from '../../assets/icons/appointment/icon-apm-filter.svg';
import iconSearch from '../../assets/icons/icon-search.svg';

import type { AppointmentListItem } from '../../assets/data/appointments.data';
import iconPatientImage from '../../assets/icons/appointment/icon-patient-image.svg';
import iconClock from '../../assets/icons/appointment/icon-apm-clocktime.svg';
import iconsPatientRecevied from '../../assets/icons/appointment/icons-patient-recevied.svg';
import iconsvioletFieldAppointmentDetails from '../../assets/icons/appointment/violet-field-apm-appointment-details-icon.svg';
import { ReusableGridTable } from '../../components/common/reusable-grid-table.component';
import FilterModule from '../../components/common/filter-module.component';
import { useAppointmentList } from '../../hooks/useAppointmentList';
import type { FilterValue } from '../../utils/date-filter';
import { isDateInFilterRange } from '../../utils/date-filter';

interface Column {
  header: string;
  accessor: keyof AppointmentListItem;
  render?: (row: AppointmentListItem) => React.ReactNode;
}

interface AppointmentListProps {
  initialRowCount?: number;
}

const statusBadge = (status: string) => {
  const s = status.toUpperCase();
  if (s === 'COMPLETED')
    return 'bg-green-50 text-green-600 border border-green-100';
  if (s === 'PRIORITY') return 'bg-red-50 text-red-500 border border-red-100';
  return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
};

export const AppointmentListComponent = ({
  initialRowCount,
}: AppointmentListProps = {}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [showFilter, setShowFilter] = useState(false);
  const [dateFilter, setDateFilter] = useState<FilterValue | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const { data, loading, error } = useAppointmentList();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setShowFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterApply = (value: FilterValue) => {
    setDateFilter(value);
    setShowFilter(false);
  };

  const filtered = useMemo(() => {
    return data.filter(
      p =>
        p.type === activeTab &&
        p.patientName.toLowerCase().includes(search.toLowerCase()) &&
        isDateInFilterRange(p.dateTime, dateFilter)
    );
  }, [data, activeTab, search, dateFilter]);

  const upcomingCount = useMemo(
    () => data.filter(a => a.type === 'upcoming').length,
    [data]
  );
  const pastCount = useMemo(
    () => data.filter(a => a.type === 'past').length,
    [data]
  );

  const columns: Column[] = [
    {
      header: 'Patient',
      accessor: 'patientName',
      render: (row: AppointmentListItem) => (
        <div className="flex items-center gap-3">
          <img src={iconPatientImage} alt="" className="w-[32px] h-[32px]" />
          <div>
            <p className="font-semibold text-gray-800">{row.patientName}</p>
            <p className="text-xs text-gray-500">
              {row.gender} | {row.age} | {row.openMrsId}
            </p>
          </div>
        </div>
      ),
    },
    { header: 'Date & Time', accessor: 'dateTime' },
    { header: 'Speciality', accessor: 'speciality' },
    { header: 'Doctor', accessor: 'drName' },
    { header: 'Reason', accessor: 'symptom' },
    {
      header: 'Status',
      accessor: 'status',
      render: (row: AppointmentListItem) => (
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-md border ${statusBadge(row.status)}`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: 'Time Until',
      accessor: 'timeUntil',
      render: (row: AppointmentListItem) =>
        row.timeUntil ? (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <img src={iconClock} alt="" className="w-3.5 h-3.5 shrink-0" />
            {row.timeUntil}
          </span>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="mx-auto flex flex-col flex-1 min-h-0 w-full">
          {/* Main Card */}
          <div className="rounded-2xl bg-white shadow-sm flex flex-col flex-1 min-h-0">
            {/* Header */}
            <div className="flex flex-col gap-4 rounded-t-2xl border border-[#ECEEFF] p-4 lg:p-3 lg:flex-row lg:items-center lg:justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <img
                    className="w-[34px] h-[34px]"
                    src={iconsvioletFieldAppointmentDetails}
                    alt=""
                  />
                </div>
                <h2 className="font-semibold lg:text-[14px] sm:text-[18px]">
                  Appointment List
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div
                  ref={filterRef}
                  className="relative flex items-center gap-3 shrink-0"
                >
                  <img
                    src={iconFilter}
                    alt="filter"
                    className="w-5 h-5 cursor-pointer hover:opacity-70 transition"
                    onClick={() => setShowFilter(prev => !prev)}
                  />
                  {showFilter && (
                    <div className="absolute right-0 top-full mt-2 z-50">
                      <FilterModule onApply={handleFilterApply} />
                    </div>
                  )}
                </div>
                <div className="relative flex items-center w-full sm:w-auto">
                  <img
                    src={iconSearch}
                    alt="search"
                    className="absolute left-3 w-4 h-4 pointer-events-none"
                  />
                  <input
                    type="text"
                    placeholder="Find patient"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full sm:w-[247px] h-[37px] border border-gray-300 rounded-lg pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-2 py-0.5 shrink-0">
              <div className="inline-flex gap-[10px] text-sm font-medium border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className={`p-3 lg:px-3 lg:py-2 border-b-2 transition font-semibold flex items-center gap-1 whitespace-nowrap ${
                    activeTab === 'upcoming'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-[#2E1E91] hover:text-indigo-600'
                  }`}
                >
                  <img src={iconsPatientRecevied} alt="" />
                  Upcoming ({upcomingCount})
                </button>

                <button
                  onClick={() => setActiveTab('past')}
                  className={`p-3 lg:px-3 lg:py-2 border-b-2 transition font-semibold flex items-center gap-1 whitespace-nowrap ${
                    activeTab === 'past'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-[#2E1E91] hover:text-indigo-600'
                  }`}
                >
                  <img src={iconsPatientRecevied} alt="" />
                  Past ({pastCount})
                </button>
              </div>
            </div>

            <ReusableGridTable
              columns={columns}
              data={loading ? [] : filtered}
              initialRowCount={initialRowCount}
              onRowClick={row => navigate(`/my-appointments/${row.id}`)}
            />
            {loading && (
              <p className="text-center text-gray-400 py-4">Loading...</p>
            )}
            {!loading && error && (
              <p className="text-center text-red-500 py-4">{error}</p>
            )}
            {!loading && !error && filtered.length === 0 && (
              <p className="text-center text-gray-400 py-4">
                No appointments found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
