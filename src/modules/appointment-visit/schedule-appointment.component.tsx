import { useEffect, useMemo, useRef, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import iconSunset from '../../assets/icons/appiontment/icon-apmsc-sunset.svg';
import iconAfternoon from '../../assets/icons/appiontment/icon-apmsc-afternoon.svg';
import iconSunrise from '../../assets/icons/appiontment/icon-apmsc-sunrise.svg';
import iconChevronLeft from '../../assets/icons/appiontment/icon-apm-chevron_1.svg';
import iconChevronRight from '../../assets/icons/appiontment/icon-apm-chevron_2.svg';
import iconsvioletFieldAppiontmentDetails from '../../assets/icons/appiontment/violet-field-apm-appiontment-details-icon.svg';
import iconCalendar from '../../assets/icons/appiontment/icon-apm-calendar.svg';

type SlotPeriod = 'Morning' | 'Afternoon' | 'Evening';

interface Appointment {
  id: number;
  date: string;
  time: string;
}

const TIME_SLOTS: Record<SlotPeriod, string[]> = {
  Morning: [
    '09:00 am',
    '09:30 am',
    '10:00 am',
    '10:30 am',
    '11:00 am',
    '11:30 am',
  ],
  Afternoon: [
    '12:00 pm',
    '12:30 pm',
    '01:00 pm',
    '01:30 pm',
    '02:00 pm',
    '02:30 pm',
    '03:00 pm',
    '03:30 pm',
    '04:00 pm',
    '04:30 pm',
    '05:00 pm',
    '05:30 pm',
    '06:00 pm',
  ],
  Evening: [
    '06:30 pm',
    '07:00 pm',
    '07:30 pm',
    '08:00 pm',
    '08:30 pm',
    '09:00 pm',
    '09:30 pm',
    '10:00 pm',
    '10:30 pm',
    '11:00 pm',
  ],
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// Computed once at module load using local time (not UTC)
const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

export default function AppointmentScheduleComponent() {
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  /* ================= DATES TO SHOW ================= */
  const getDateCount = () => {
    if (window.innerWidth >= 1024) return 13; // desktop
    if (window.innerWidth >= 768) return 10; // tablet
    return 5; // mobile
  };

  const [datesToShow, setDatesToShow] = useState(getDateCount);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        setDatesToShow(getDateCount());
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  /* ================= AUTO-DISMISS SUCCESS POPUP ================= */
  useEffect(() => {
    if (!showSuccessModal) return;
    const timer = setTimeout(() => {
      setShowSuccessModal(false);
      navigate('/my-appointments');
    }, 2000);
    return () => clearTimeout(timer);
  }, [showSuccessModal, navigate]);

  /* ================= MONTH NAVIGATION ================= */

  const handlePrevMonth = () => {
    const now = new Date();
    /* c8 ignore next 5 */
    if (
      year > now.getFullYear() ||
      (year === now.getFullYear() && month > now.getMonth())
    ) {
      setCurrentMonth(new Date(year, month - 1, 1));
    }
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  /* ================= DATE GENERATION ================= */

  // Always generates exactly `datesToShow` dates.
  // For the current month starts from today; for future months starts from the 1st.
  // Spans into the next month when the current month runs short.
  const visibleDates = useMemo(() => {
    const now = new Date(`${today}T00:00:00`);
    const isCurrentMonth =
      year === now.getFullYear() && month === now.getMonth();
    const cursor = isCurrentMonth ? new Date(now) : new Date(year, month, 1);
    const dates: string[] = [];
    while (dates.length < datesToShow) {
      dates.push(cursor.toLocaleDateString('en-CA'));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  }, [year, month, datesToShow]);

  const getDayName = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { weekday: 'short' });

  const isSlotBooked = (date: string, time: string) =>
    appointments.some(a => a.date === date && a.time === time);

  const bookAppointment = () => {
    /* c8 ignore next */
    if (!selectedDate || !selectedTime) return;
    setShowConfirmModal(true);
  };

  const confirmBooking = () => {
    setAppointments(prev => [
      ...prev,
      { id: Date.now(), date: selectedDate, time: selectedTime! },
    ]);
    setShowConfirmModal(false);
    setShowSuccessModal(true);
  };

  const formatConfirmDate = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00`);
    const day = d.getDate();
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });
    const suffix =
      day === 1 || day === 21 || day === 31
        ? 'st'
        : day === 2 || day === 22
          ? 'nd'
          : day === 3 || day === 23
            ? 'rd'
            : 'th';
    return `${day}${suffix} ${monthName}`;
  };

  const getTimeIcon = (period: SlotPeriod) => {
    switch (period) {
      case 'Morning':
        return iconSunrise;
      case 'Afternoon':
        return iconAfternoon;
      case 'Evening':
        return iconSunset;
      /* c8 ignore next 2 */
      default:
        return iconSunrise;
    }
  };

  return (
    <div className="w-full bg-white rounded-xl p-4 md:p-5">
      {/* Header */}
      <div className="hidden md:flex items-center gap-3 mb-2">
        <img src={iconsvioletFieldAppiontmentDetails} alt="icon" />
        <span className="text-sm font-medium text-[#2E1E91]">
          Schedule appointment
        </span>
      </div>
      <hr className="hidden md:block border-t border-gray-200 mt-2 mb-4" />

      {/* Month Row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-semibold text-gray-800">
          {MONTHS[month]}, {year}
        </h2>
        <div className="flex gap-2">
          {/* Prev: disabled on current month */}
          <button
            onClick={handlePrevMonth}
            disabled={
              year === new Date().getFullYear() &&
              month === new Date().getMonth()
            }
            className="w-8 h-8 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <img src={iconChevronRight} className="w-4 h-4" alt="prev" />
          </button>
          <button
            onClick={handleNextMonth}
            className="w-8 h-8 flex items-center justify-center"
          >
            <img src={iconChevronLeft} className="w-4 h-4" alt="next" />
          </button>
        </div>
      </div>

      {/* Date Selection */}
      <div className="flex gap-[8px] mb-4 overflow-x-auto pb-1">
        {visibleDates.map(date => {
          const isSelected = selectedDate === date;
          const isToday = date === today;
          const dayNumber = date.split('-')[2];

          return (
            <button
              key={date}
              onClick={() => {
                setSelectedDate(date);
                setSelectedTime(null);
              }}
              className={`w-[50px] h-[60px] shrink-0 rounded-xl border flex flex-col items-center justify-center text-xs transition
                ${
                  isSelected
                    ? 'bg-[#3F2E9C] text-white border-[#3F2E9C]'
                    : 'bg-white text-gray-700 border-[#E5E7EB] hover:border-[#3F2E9C]'
                }`}
            >
              <div
                className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-[#2E1E91]'}`}
              >
                {dayNumber}
              </div>
              <div
                className={`text-[14px] mt-1 ${isSelected ? 'text-white' : 'text-[#2E1E91]'} ${isToday && !isSelected ? 'font-medium' : ''}`}
              >
                {isToday ? 'Today' : getDayName(date)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Pick a time slot — desktop/tablet only */}
      <p className="hidden md:block text-[14px] font-medium text-[#7F7B92] mb-3">
        Pick a time slot
      </p>

      {/* Time Slots */}
      {(Object.keys(TIME_SLOTS) as SlotPeriod[]).map(period => (
        <div key={period} className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <img src={getTimeIcon(period)} alt={period} />
            <span className="text-[14px] font-medium text-gray-800">
              {period}
            </span>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-6 lg:flex lg:flex-wrap gap-3">
            {TIME_SLOTS[period].map(time => {
              const selected = selectedTime === time;
              const booked = !!selectedDate && isSlotBooked(selectedDate, time);

              return (
                <button
                  key={time}
                  disabled={!selectedDate || booked}
                  onClick={() => setSelectedTime(selected ? null : time)}
                  className={`h-[37px] min-w-[97px] rounded-lg text-xs font-medium border transition
                    ${
                      selected
                        ? 'bg-[#3F2E9C] text-white border-[#3F2E9C]'
                        : booked
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-[#F3F1FB] text-gray-700 border-[#E0DDF5]'
                    }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Book Button */}
      <div className="flex justify-end mt-4">
        <button
          disabled={!selectedDate || !selectedTime}
          onClick={bookAppointment}
          className={`px-6 h-10 rounded-lg text-sm font-semibold transition
            ${
              selectedDate && selectedTime
                ? 'bg-[#3F2E9C] text-white hover:bg-[#35258A]'
                : 'bg-[#3F2E9C] text-white opacity-50 cursor-not-allowed'
            }`}
        >
          Book Appointment
        </button>
      </div>

      {/* Confirm Booking Popup */}
      {showConfirmModal && selectedDate && selectedTime && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowConfirmModal(false)}
          />
          <div className="relative bg-white w-[312px] pt-8 pr-6 pb-8 pl-6 rounded-[16px] z-10 flex flex-col items-center gap-6 text-center">
            <div className="w-14 h-14 rounded-full bg-[#E6F9F1] flex items-center justify-center">
              <img src={iconCalendar} alt="calendar" className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1B163A] mb-2">
                Confirm appointment?
              </h3>
              <p className="text-sm text-[#7F7B92]">
                Are you sure, patient want to book the appointment on
              </p>
              <p className="text-sm font-bold text-[#1B163A]">
                {formatConfirmDate(selectedDate)} at {selectedTime}?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-6 h-10 rounded-lg text-sm font-semibold text-[#2F1E91] bg-[#E1DCFF] hover:bg-[#d3ccf7] transition"
              >
                No
              </button>
              <button
                onClick={confirmBooking}
                className="px-6 h-10 rounded-lg text-sm font-semibold bg-[#3F2E9C] text-white hover:bg-[#35258A] transition"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => {
              setShowSuccessModal(false);
              navigate('/my-appointments');
            }}
          />
          <div className="relative bg-white w-[312px] h-[214px] pt-8 pr-6 pb-8 pl-6 rounded-[16px] flex flex-col items-center justify-center z-10">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-5">
              <img src={iconCalendar} alt="calendar" className="w-6 h-6" />
            </div>
            <p
              className="font-bold text-[20px] leading-[150%] text-center text-gray-900"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Appointment booked successfully!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
