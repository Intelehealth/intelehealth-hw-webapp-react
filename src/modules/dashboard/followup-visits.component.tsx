import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import iconPatientImage from '../../assets/icons/appointment/icon-patient-image.svg';
import iconsvioletFieldAppointmentDetails from '../../assets/icons/appointment/violet-field-apm-appointment-details-icon.svg';
import iconSearch from '../../assets/icons/icon-search.svg';
import iconFilter from '../../assets/icons/icon-filter.svg';
import { ReusableGridTable } from '../../components/common/reusable-grid-table.component';
import {
  useFollowupVisits,
  type FollowupVisit,
} from '../../hooks/useFollowupVisits';
import { useColumnSort } from '../../hooks/useColumnSort';
import { useSortByName } from '../../hooks/useSortByName';

interface FollowupVisitsProps {
  initialRowCount?: number;
}

export const FollowupVisitsComponent = ({
  initialRowCount,
}: FollowupVisitsProps = {}) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { sortKey, sortOrder, toggleSort, applySort } = useColumnSort();
  const { applySort: applyNameSort } = useSortByName();
  const { data, loading, error } = useFollowupVisits();

  const filtered = useMemo(() => {
    const result = data.filter((p: FollowupVisit) =>
      p.patientName.toLowerCase().includes(search.toLowerCase())
    );
    return applySort(applyNameSort(result));
  }, [data, search, applySort, applyNameSort]);

  const columns: {
    header: string;
    accessor: keyof FollowupVisit;
    render?: (row: FollowupVisit) => React.ReactNode;
  }[] = [
    {
      header: 'Patient',
      accessor: 'patientName',
      render: (row: FollowupVisit) => (
        <div className="flex items-center gap-3">
          <img src={iconPatientImage} alt="" className="w-8 h-8" />
          <p className="font-semibold text-gray-800">{row.patientName}</p>
        </div>
      ),
    },
    { header: 'Age', accessor: 'age' },
    { header: 'Visit created', accessor: 'visitCreatedDate' },
    { header: 'Clinic', accessor: 'clinicName' },
    { header: 'Gender', accessor: 'gender' },
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
                    className="w-8.5 h-8.5"
                    src={iconsvioletFieldAppointmentDetails}
                    alt=""
                  />
                </div>
                <h2 className="font-semibold lg:text-[14px] sm:text-[18px]">
                  Follow-up Visits
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 shrink-0">
                  <img
                    src={iconFilter}
                    alt="filter"
                    className="w-5 h-5 cursor-pointer hover:opacity-70 transition"
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
                    className="w-full sm:w-61.75 h-9.25 border border-gray-300 rounded-lg pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
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
                No follow-up visits found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FollowupVisitsComponent;
