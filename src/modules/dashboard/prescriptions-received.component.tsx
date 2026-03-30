import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import iconFilter from '../../assets/icons/appiontment/icon-apm-filter.svg';
import iconSearch from '../../assets/icons/icon-search.svg';

import iconPatientImage from '../../assets/icons/appiontment/icon-patient-image.svg';
import iconSummaryList from '../../assets/icons/appiontment/icon-summary-list.svg';
import iconPatientRecevied from '../../assets/icons/appiontment/icons-patient-recevied.svg';
import iconsvioletFieldAppiontmentDetails from '../../assets/icons/appiontment/violet-field-apm-appiontment-details-icon.svg';
import { PRESCRIPTION_TABS } from '../../assets/data/prescription-detail.data';
import { ReusableGridTable } from '../../components/common/reusable-grid-table.component';
import { usePrescriptionsPending } from '../../hooks/usePrescriptionsPending';
import { usePrescriptionsReceived } from '../../hooks/usePrescriptionsReceived';
import type {
  PrescriptionPendingVisit,
  PrescriptionReceivedVisit,
} from '../../services/patient.service';

interface PrescriptionsReceivedProps {
  onCountLoaded?: (count: number) => void;
  initialRowCount?: number;
}

export const PrescriptionsReceived = ({
  onCountLoaded,
  initialRowCount,
}: PrescriptionsReceivedProps = {}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(
    PRESCRIPTION_TABS.RECEIVED
  );
  const [search, setSearch] = useState('');

  const {
    data: receivedData,
    loading: receivedLoading,
    error: receivedError,
    totalCount: receivedCount,
  } = usePrescriptionsReceived();

  const {
    data: pendingData,
    loading: pendingLoading,
    error: pendingError,
  } = usePrescriptionsPending();

  useEffect(() => {
    if (onCountLoaded) onCountLoaded(receivedCount);
  }, [receivedCount, onCountLoaded]);

  const filteredReceived = receivedData.filter(p =>
    p.patientName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPending = pendingData.filter(p =>
    p.patientName.toLowerCase().includes(search.toLowerCase())
  );

  const receivedColumns: {
    header: string;
    accessor: keyof PrescriptionReceivedVisit;
    render?: (row: PrescriptionReceivedVisit) => React.ReactNode;
  }[] = [
    {
      header: 'Patient',
      accessor: 'patientName',
      render: (row: PrescriptionReceivedVisit) => (
        <div className="flex items-center gap-3">
          <img src={iconPatientImage} className="w-[32px] h-[32px]" />
          <p className="font-semibold text-gray-800">{row.patientName}</p>
        </div>
      ),
    },
    { header: 'Age', accessor: 'age' },
    { header: 'Visit created', accessor: 'visitCreatedDate' },
    { header: 'Clinic', accessor: 'clinicName' },
    { header: 'Gender', accessor: 'gender' },
    {
      header: 'Prescription',
      accessor: 'prescriptionReceivedTimestamp',
      render: (row: PrescriptionReceivedVisit) => (
        <div className="flex items-center justify-center">
          <img src={iconSummaryList} className="w-[22px] h-[22px]" />
          <p className="text-green-600 ml-1 text-xs truncate">
            {row.prescriptionReceivedTimestamp}
          </p>
        </div>
      ),
    },
  ];

  const pendingColumns: {
    header: string;
    accessor: keyof PrescriptionPendingVisit;
    render?: (row: PrescriptionPendingVisit) => React.ReactNode;
  }[] = [
    {
      header: 'Patient',
      accessor: 'patientName',
      render: (row: PrescriptionPendingVisit) => (
        <div className="flex items-center gap-3">
          <img src={iconPatientImage} className="w-[32px] h-[32px]" />
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
      render: (row: PrescriptionPendingVisit) => (
        <div className="flex items-center justify-center">
          <img src={iconSummaryList} className="w-[22px] h-[22px]" />
          <p className="text-orange-500 ml-1 text-xs truncate">
            {row.uploadTimestamp}
          </p>
        </div>
      ),
    },
  ];

  const isReceived = activeTab === PRESCRIPTION_TABS.RECEIVED;
  const loading = isReceived ? receivedLoading : pendingLoading;
  const error = isReceived ? receivedError : pendingError;
  const emptyMessage = isReceived
    ? 'No prescriptions found.'
    : 'No pending prescriptions found.';

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
                    src={iconsvioletFieldAppiontmentDetails}
                  />
                </div>
                <h2 className="font-semibold lg:text-[14px] sm:text-[18px]">
                  Prescriptions
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

            {/* Tabs */}
            <div className="px-2 py-0.5 shrink-0">
              <div className="inline-flex gap-[10px] text-sm font-medium border-b border-gray-200">
                <button
                  onClick={() => setActiveTab(PRESCRIPTION_TABS.RECEIVED)}
                  className={`p-3 lg:px-3 lg:py-2 border-b-2 transition font-semibold flex gap-1 ${
                    activeTab === PRESCRIPTION_TABS.RECEIVED
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-[#2E1E91] hover:text-indigo-600'
                  }`}
                >
                  <img src={iconPatientRecevied} />
                  {PRESCRIPTION_TABS.RECEIVED}
                </button>

                <button
                  onClick={() => setActiveTab(PRESCRIPTION_TABS.PENDING)}
                  className={`p-3 lg:px-3 lg:py-2 border-b-2 transition font-semibold flex gap-1 ${
                    activeTab === PRESCRIPTION_TABS.PENDING
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-[#2E1E91] hover:text-indigo-600'
                  }`}
                >
                  <img src={iconPatientRecevied} />
                  {PRESCRIPTION_TABS.PENDING}
                </button>
              </div>
            </div>

            {isReceived ? (
              <ReusableGridTable
                columns={receivedColumns}
                data={loading ? [] : filteredReceived}
                initialRowCount={initialRowCount}
                onRowClick={row => navigate(`/visit-details/${row.visitUuid}`)}
              />
            ) : (
              <ReusableGridTable
                columns={pendingColumns}
                data={loading ? [] : filteredPending}
                initialRowCount={initialRowCount}
                onRowClick={row => navigate(`/visit-details/${row.visitUuid}`)}
              />
            )}
            {loading && (
              <p className="text-center text-gray-400 py-4">Loading...</p>
            )}
            {!loading && error && (
              <p className="text-center text-red-500 py-4">{error}</p>
            )}
            {!loading &&
              !error &&
              (isReceived ? filteredReceived : filteredPending).length ===
                0 && (
                <p className="text-center text-gray-400 py-4">{emptyMessage}</p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};
