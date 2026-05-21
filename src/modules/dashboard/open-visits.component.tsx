import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import iconSearch from '../../assets/icons/icon-search.svg';
import iconAscSorted from '../../assets/icons/icon-asc-sorted.svg';
import iconDescSorted from '../../assets/icons/icon-desc-sorted.svg';

import iconPatientImage from '../../assets/icons/appointment/icon-patient-image.svg';
import iconSummaryList from '../../assets/icons/appointment/icon-summary-list.svg';
import iconPatientRecevied from '../../assets/icons/appointment/icons-patient-recevied.svg';
import iconsvioletFieldAppointmentDetails from '../../assets/icons/appointment/violet-field-apm-appointment-details-icon.svg';
import { ReusableGridTable } from '../../components/common/reusable-grid-table.component';
import { useOpenVisits } from '../../hooks/useOpenVisits';
import { useColumnSort } from '../../hooks/useColumnSort';
import { useSortByName } from '../../hooks/useSortByName';
import type { OpenVisit } from '../../services/patient.service';

export const OPEN_VISITS_TABS = {
  OPEN: 'Open Visits',
  PRIORITY: 'Priority Visits',
} as const;

type OpenVisitsTab = (typeof OPEN_VISITS_TABS)[keyof typeof OPEN_VISITS_TABS];

interface Column {
  header: string;
  accessor: keyof OpenVisit;
  render?: (row: OpenVisit) => React.ReactNode;
}

interface OpenVisitsProps {
  initialRowCount?: number;
}

export const OpenVisitsComponent = ({
  initialRowCount,
}: OpenVisitsProps = {}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<OpenVisitsTab>(
    OPEN_VISITS_TABS.OPEN
  );
  const [search, setSearch] = useState('');
  const { sortKey, sortOrder, toggleSort, applySort } = useColumnSort();
  const {
    sortOrder: nameSortOrder,
    toggleSort: toggleNameSort,
    applySort: applyNameSort,
  } = useSortByName();
  const { data, loading, error } = useOpenVisits();

  const isPriorityTab = activeTab === OPEN_VISITS_TABS.PRIORITY;

  const filtered = useMemo(() => {
    const byTab = isPriorityTab
      ? data.filter(p => p.isPriority === true)
      : data;
    const result = byTab.filter(p =>
      p.patientName.toLowerCase().includes(search.toLowerCase())
    );
    return applySort(applyNameSort(result));
  }, [data, isPriorityTab, search, applySort, applyNameSort]);

  const columns: Column[] = [
    {
      header: 'Patient',
      accessor: 'patientName',
      render: (row: OpenVisit) => (
        <div className="flex items-center gap-3">
          <img src={iconPatientImage} alt="" className="w-[32px] h-[32px]" />
          <p className="font-semibold text-gray-800">{row.patientName}</p>
        </div>
      ),
    },
    { header: 'Age', accessor: 'age' },
    { header: 'Visit created', accessor: 'visitCreatedDate' },
    { header: 'Clinic', accessor: 'clinicName' },
    { header: 'Gender', accessor: 'gender' },
    {
      header: 'Uploaded',
      /* Backend only emits visitCreatedDate; uploadTimestamp is never
       * populated. Surface the same date here so the Uploaded column is not
       * blank. */
      accessor: 'visitCreatedDate',
      render: (row: OpenVisit) => (
        <div className="flex items-center justify-center">
          <img src={iconSummaryList} alt="" className="w-[22px] h-[22px]" />
          <p className="text-orange-500 ml-1 text-xs truncate">
            {row.visitCreatedDate}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="mx-auto flex flex-col flex-1 min-h-0 w-full">
          {/* Main Card */}
          <div className="rounded-2xl bg-white shadow-sm flex flex-col flex-1 min-h-0">
            {/* Header */}
            <div className="flex flex-col gap-4 rounded-t-2xl border border-[#ECEEFF] p-4 lg:flex-row lg:items-center lg:justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <img
                    className="w-[34px] h-[34px]"
                    src={iconsvioletFieldAppointmentDetails}
                    alt=""
                  />
                </div>
                <h2 className="font-semibold lg:text-[14px] sm:text-[18px]">
                  Open Visits
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="flex items-center gap-0.5 cursor-pointer"
                  onClick={toggleNameSort}
                >
                  <img
                    src={iconAscSorted}
                    alt="sort-asc"
                    className={`transition ${nameSortOrder === 'asc' ? 'opacity-100' : 'opacity-70'}`}
                  />
                  <img
                    src={iconDescSorted}
                    alt="sort-desc"
                    className={`transition ${nameSortOrder === 'desc' ? 'opacity-100' : 'opacity-70'}`}
                  />
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
                  onClick={() => setActiveTab(OPEN_VISITS_TABS.OPEN)}
                  className={`p-3 lg:px-4 lg:py-2 border-b-2 transition font-semibold flex gap-1 whitespace-nowrap ${
                    activeTab === OPEN_VISITS_TABS.OPEN
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-[#2E1E91] hover:text-indigo-600'
                  }`}
                >
                  <img src={iconPatientRecevied} alt="" />
                  {OPEN_VISITS_TABS.OPEN}
                </button>

                <button
                  onClick={() => setActiveTab(OPEN_VISITS_TABS.PRIORITY)}
                  className={`p-3 lg:px-4 lg:py-2 border-b-2 transition font-semibold flex gap-1 whitespace-nowrap ${
                    activeTab === OPEN_VISITS_TABS.PRIORITY
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-[#2E1E91] hover:text-indigo-600'
                  }`}
                >
                  <img src={iconPatientRecevied} alt="" />
                  {OPEN_VISITS_TABS.PRIORITY}
                </button>
              </div>
            </div>

            <ReusableGridTable
              columns={columns}
              data={loading ? [] : filtered}
              initialRowCount={initialRowCount}
              onRowClick={row => navigate(`/visit-details/${row.visitUuid}`)}
              sortKey={sortKey}
              sortOrder={sortOrder}
              onSort={toggleSort}
            />
            {loading && (
              <p className="text-center text-gray-400 py-4">Loading...</p>
            )}
            {!loading && error && (
              <p className="text-center text-red-500 py-4">{error}</p>
            )}
            {!loading && !error && filtered.length === 0 && (
              <p className="text-center text-gray-400 py-4">
                {isPriorityTab
                  ? 'No priority visits found.'
                  : 'No open visits found.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
