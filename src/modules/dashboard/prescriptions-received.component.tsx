import { useState } from 'react';
import iconFilter from '../../assets/icons/appiontment/icon-apm-filter.svg';
import iconSearch from '../../assets/icons/icon-search.svg';

import iconPatientImage from '../../assets/icons/appiontment/icon-patient-image.svg';
import iconSummaryList from '../../assets/icons/appiontment/icon-summary-list.svg';
import iconPatientRecevied from '../../assets/icons/appiontment/icons-patient-recevied.svg';
import iconsvioletFieldAppiontmentDetails from '../../assets/icons/appiontment/violet-field-apm-appiontment-details-icon.svg';
import { ReusableGridTable } from '../../components/common/reusable-grid-table.component';
import { type Patient, patientsData } from '../../assets/data/patients.data';

interface Column {
  header: string;
  accessor: keyof Patient;
  render?: (row: Patient) => React.ReactNode;
}
export const PrescriptionsReceived = () => {
  const [activeTab, setActiveTab] = useState('received');
  const columns: Column[] = [
    {
      header: 'Patient',
      accessor: 'name',
      render: (row: Patient) => (
        <div className="flex items-center gap-3">
          <img src={iconPatientImage} className="w-[32px] h-[32px]" />
          <p className="font-semibold text-gray-800">{row.name}</p>
        </div>
      ),
    },
    { header: 'Age', accessor: 'age' },
    { header: 'Visit created', accessor: 'date' },
    { header: 'Clinic', accessor: 'clinic' },
    { header: 'Chief complaint', accessor: 'complaint' },
    {
      header: 'Prescription',
      accessor: 'time',
      render: (row: Patient) => (
        <div className="flex items-center justify-center">
          <img src={iconSummaryList} className="w-[22px] h-[22px]" />
          <p className="text-green-600 ml-1">{row.time}</p>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div>
        <div className="mx-auto flex flex-col gap-4 ">
          {/* Top Section max-w-7xl space-y-6 */}

          {/* Main Card */}
          <div className="rounded-2xl bg-white shadow-sm">
            {/* Header */}
            <div className="flex flex-col gap-4 rounded-t-2xl border border-[#ECEEFF] p-4 lg:p-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <img
                    className="w-[34px] h-[34px]"
                    src={iconsvioletFieldAppiontmentDetails}
                  />
                </div>
                <h2 className="font-semibold lg:text-[14px] sm:text-[18px]">
                  Prescription Received
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
                    // value={search}
                    //onChange={e => setSearch(e.target.value)}
                    className="w-full sm:w-[247px] h-[37px] border border-gray-300 rounded-lg pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-2 py-0.5">
              <div className="inline-flex gap-[10px] text-sm font-medium border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('Received')}
                  className={`p-3 lg:px-3 lg:py-2 border-b-2 transition font-semibold flex gap-1 ${
                    activeTab === 'Received'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-[#2E1E91] hover:text-indigo-600'
                  }`}
                >
                  <img src={iconPatientRecevied} />
                  Received
                </button>

                <button
                  onClick={() => setActiveTab('Pendings')}
                  className={`p-3 lg:px-3 lg:py-2 border-b-2 transition font-semibold flex gap-1 ${
                    activeTab === 'Pendings'
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-[#2E1E91] hover:text-indigo-600'
                  }`}
                >
                  <img src={iconPatientRecevied} />
                  Pendings
                </button>
              </div>
            </div>

            <ReusableGridTable columns={columns} data={patientsData} />
          </div>
        </div>
      </div>
    </div>
  );
};
