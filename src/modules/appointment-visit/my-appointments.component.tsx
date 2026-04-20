import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import iconFilter from '../../assets/icons/appointment/icon-apm-filter.svg';
import iconSortFilter from '../../assets/icons/appointment/icon-apm-sortasd-filter.svg';
import iconsvioletFieldAppointmentDetails from '../../assets/icons/appointment/violet-field-apm-appointment-details-icon.svg';
import iconSearch from '../../assets/icons/icon-search.svg';
import iconClock from '../../assets/icons/appointment/icon-apm-clocktime.svg';
import iconPatientPhoto from '../../assets/icons/appointment/icon-patient-image.svg';
import iconAngleSmallRight from '../../assets/icons/appointment/icon-angle-small-right.svg';
import iconsPatientRecevied from '../../assets/icons/appointment/icons-patient-recevied.svg';
import { appointmentsListData } from '../../assets/data/appointments.data';

export default function MyAppointments() {
  const [activeTab, setActiveTab] = useState('past');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const filteredAppointments = useMemo(() => {
    return appointmentsListData.filter(item => {
      const matchTab = item.type === activeTab;
      const matchSearch = item.patientName
        .toLowerCase()
        .includes(search.toLowerCase());
      /* c8 ignore next */
      const matchStatus = statusFilter ? item.status === statusFilter : true;
      return matchTab && matchSearch && matchStatus;
    });
  }, [activeTab, search, statusFilter]);

  const upcomingCount = useMemo(
    () =>
      appointmentsListData.filter(a => {
        const matchSearch = a.patientName
          .toLowerCase()
          .includes(search.toLowerCase());
        /* c8 ignore next */
        const matchStatus = statusFilter ? a.status === statusFilter : true;
        return a.type === 'upcoming' && matchSearch && matchStatus;
      }).length,
    [search, statusFilter]
  );

  const pastCount = useMemo(
    () =>
      appointmentsListData.filter(a => {
        const matchSearch = a.patientName
          .toLowerCase()
          .includes(search.toLowerCase());
        /* c8 ignore next */
        const matchStatus = statusFilter ? a.status === statusFilter : true;
        return a.type === 'past' && matchSearch && matchStatus;
      }).length,
    [search, statusFilter]
  );

  /* c8 ignore next */
  const clearStatusFilter = () => setStatusFilter('');

  const statusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'COMPLETED')
      return 'bg-green-50 text-green-600 border border-green-100';
    if (s === 'PRIORITY') return 'bg-red-50 text-red-500 border border-red-100';
    return 'bg-indigo-50 text-indigo-600 border border-indigo-100';
  };

  return (
    <div className="w-full bg-white rounded-xl p-4 md:p-5">
      {/* Header */}
      <div className="hidden md:flex items-center gap-3">
        <img src={iconsvioletFieldAppointmentDetails} alt="appointments" />
        <span className="text-base font-semibold tracking-wide">
          My appointments
        </span>
      </div>

      <hr className="hidden md:block border-t border-gray-200 mt-2 mb-4" />

      {/* Tabs row */}
      <div className="mb-3">
        <div className="inline-flex gap-[10px] text-sm font-medium border-b border-gray-200">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 border-b-2 text-center transition ${
              activeTab === 'upcoming'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-[#FBE9E9] text-gray-400 hover:text-indigo-600'
            }`}
          >
            <img
              src={iconsPatientRecevied}
              alt="received"
              className="inline w-4 mr-1"
            />
            Upcoming ({upcomingCount})
          </button>

          <button
            onClick={() => setActiveTab('past')}
            className={`pb-3 border-b-2 text-center transition ${
              activeTab === 'past'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-[#FBE9E9] text-gray-400 hover:text-indigo-600'
            }`}
          >
            <img
              src={iconsPatientRecevied}
              alt="received"
              className="inline w-4 mr-1"
            />
            Past ({pastCount})
          </button>
        </div>
      </div>

      {/* Search + Icons — all screen sizes, right-aligned on desktop */}
      <div className="flex items-center gap-3 mb-3 md:justify-end">
        <div className="relative flex items-center flex-1 md:flex-none">
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
            className="w-full md:w-[247px] h-[37px] border border-gray-300 rounded-lg pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <img
          src={iconFilter}
          alt="filter"
          className="w-5 h-5 cursor-pointer hover:opacity-70 transition"
        />
        <img
          src={iconSortFilter}
          alt="sort"
          className="w-5 h-5 cursor-pointer hover:opacity-70 transition"
        />
      </div>

      {/* Active filter badge */}
      {
        /* c8 ignore start */
        statusFilter && (
          <div className="mb-4">
            <span className="flex items-center gap-2 bg-indigo-50 text-indigo-600 text-sm px-4 py-1.5 rounded-full w-fit">
              {statusFilter}
              <span
                onClick={clearStatusFilter}
                className="cursor-pointer font-bold"
              >
                ×
              </span>
            </span>
          </div>
        )
        /* c8 ignore stop */
      }

      {/* Mobile View */}
      <div className="space-y-3 md:hidden">
        {filteredAppointments.map(item => (
          <div
            key={item.id}
            onClick={() => navigate(`/my-appointments/${item.id}`)}
            className="border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:bg-gray-50 transition cursor-pointer shadow-sm"
          >
            <div className="flex gap-3">
              <img
                src={iconPatientPhoto}
                alt="patient"
                className="w-10 h-10 rounded-full shrink-0"
              />
              <div>
                <div className="text-sm font-semibold">
                  {item.patientName} ({item.gender}) {item.age}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {item.dateTime}
                </div>
                <span
                  className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-md border ${statusBadge(item.status)}`}
                >
                  {item.status}
                </span>
              </div>
            </div>
            <img
              src={iconAngleSmallRight}
              alt=">"
              className="w-5 h-5 shrink-0"
            />
          </div>
        ))}
      </div>

      {/* Desktop / Tablet View */}
      <div className="hidden md:block w-full">
        <div className="space-y-2">
          {filteredAppointments.map(item => (
            <div
              key={item.id}
              onClick={() => navigate(`/my-appointments/${item.id}`)}
              className="grid md:grid-cols-[2fr_0.8fr_1fr_1.2fr_1.5fr_1fr_1.5fr_auto] items-center gap-4 border border-gray-200 rounded-xl px-4 h-[56px] bg-white cursor-pointer hover:shadow-sm transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={iconPatientPhoto}
                  alt="patient"
                  className="w-9 h-9 rounded-full shrink-0"
                />
                <div className="text-sm font-semibold text-gray-800 truncate">
                  {item.patientName} ({item.gender})
                </div>
              </div>

              <div className="text-sm text-gray-500">{item.age}</div>
              <div className="text-sm text-gray-600 truncate">
                {item.clinic}
              </div>
              <div className="text-sm text-gray-600 truncate">
                {item.symptom}
              </div>
              <div className="text-sm text-gray-600">{item.dateTime}</div>

              <div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-md border ${statusBadge(item.status)}`}
                >
                  {item.status}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-green-600">
                {item.timeUntil && (
                  <>
                    <img
                      src={iconClock}
                      alt="clock"
                      className="w-3.5 h-3.5 shrink-0"
                    />
                    <span>{item.timeUntil}</span>
                  </>
                )}
              </div>

              <img
                src={iconAngleSmallRight}
                alt=">"
                className="w-5 h-5 shrink-0"
              />
            </div>
          ))}
        </div>
      </div>

      {filteredAppointments.length === 0 && (
        <div className="text-center text-gray-500 text-sm py-10">
          No appointments found
        </div>
      )}
    </div>
  );
}
