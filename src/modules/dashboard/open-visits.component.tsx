import { useState } from 'react';
import iconFilter from '../../assets/icons/appiontment/icon-apm-filter.svg';
import iconSearch from '../../assets/icons/icon-search.svg';

import iconPatientImage from '../../assets/icons/appiontment/icon-patient-image.svg';
import iconSummaryList from '../../assets/icons/appiontment/icon-summary-list.svg';
import iconsvioletFieldAppiontmentDetails from '../../assets/icons/appiontment/violet-field-apm-appiontment-details-icon.svg';
import { ReusableGridTable } from '../../components/common/reusable-grid-table.component';
import { useOpenVisits } from '../../hooks/useOpenVisits';
import type { OpenVisit } from '../../services/patient.service';

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
  const [search, setSearch] = useState('');
  const { data, loading, error } = useOpenVisits();

  const filtered = data.filter(p =>
    p.patientName.toLowerCase().includes(search.toLowerCase())
  );

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
      accessor: 'uploadTimestamp',
      render: (row: OpenVisit) => (
        <div className="flex items-center justify-center">
          <img src={iconSummaryList} alt="" className="w-[22px] h-[22px]" />
          <p className="text-orange-500 ml-1 text-xs truncate">
            {row.uploadTimestamp}
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
                    src={iconsvioletFieldAppiontmentDetails}
                    alt=""
                  />
                </div>
                <h2 className="font-semibold lg:text-[14px] sm:text-[18px]">
                  Open Visits
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
                    className="w-full sm:w-[247px] h-[37px] border border-gray-300 rounded-lg pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>
            </div>

            <ReusableGridTable
              columns={columns}
              data={loading ? [] : filtered}
              initialRowCount={initialRowCount}
            />
            {loading && (
              <p className="text-center text-gray-400 py-4">Loading...</p>
            )}
            {!loading && error && (
              <p className="text-center text-red-500 py-4">{error}</p>
            )}
            {!loading && !error && filtered.length === 0 && (
              <p className="text-center text-gray-400 py-4">
                No open visits found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
