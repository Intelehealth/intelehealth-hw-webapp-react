import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import iconSunset from '../../assets/icons/appointment/icon-apmsc-sunset.svg';
import iconAfternoon from '../../assets/icons/appointment/icon-apmsc-afternoon.svg';
import iconSunrise from '../../assets/icons/appointment/icon-apmsc-sunrise.svg';
import iconChevronLeft from '../../assets/icons/appointment/icon-apm-chevron_1.svg';
import iconChevronRight from '../../assets/icons/appointment/icon-apm-chevron_2.svg';
import iconsvioletFieldAppointmentDetails from '../../assets/icons/appointment/violet-field-apm-appointment-details-icon.svg';
import iconCalendar from '../../assets/icons/appointment/icon-apm-calendar.svg';
import { useGlobalModal } from '../../components/modal/global-modal-context';
import { useAppointmentSlots } from '../../hooks/useAppointmentSlots';
import { appointmentService } from './appointment.service';
import type { SlotPeriod } from './appointment.service';

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

const today = new Date().toLocaleDateString('en-CA');

export default function AppointmentScheduleComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { visitUuid: visitUuidParam } = useParams<{ visitUuid: string }>();
  const { showConfirmModal } = useGlobalModal();
  const locationState = location.state as { speciality?: string } | null;
  const visitUuid = visitUuidParam;
  const speciality = locationState?.speciality ?? 'General Physician';

  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [booking, setBooking] = useState(false);
  const [dateOffset, setDateOffset] = useState(0);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const getDateCount = () => {
    if (window.innerWidth >= 1024) return 13;
    if (window.innerWidth >= 768) return 10;
    return 5;
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

  const handlePrevMonth = () => {
    const now = new Date();
    if (
      year > now.getFullYear() ||
      (year === now.getFullYear() && month > now.getMonth())
    ) {
      const prevMonth = new Date(year, month - 1, 1);
      setCurrentMonth(prevMonth);
      const isCurrentMonth =
        prevMonth.getFullYear() === now.getFullYear() &&
        prevMonth.getMonth() === now.getMonth();
      setSelectedDate(
        isCurrentMonth ? today : prevMonth.toLocaleDateString('en-CA')
      );
      setSelectedTime(null);
      setDateOffset(0);
    }
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(year, month + 1, 1);
    setCurrentMonth(nextMonth);
    setSelectedDate(nextMonth.toLocaleDateString('en-CA'));
    setSelectedTime(null);
    setDateOffset(0);
  };

  const allDates = useMemo(() => {
    const now = new Date(`${today}T00:00:00`);
    const isCurrentMonth =
      year === now.getFullYear() && month === now.getMonth();
    const startDate = isCurrentMonth ? new Date(now) : new Date(year, month, 1);
    const dates: string[] = [];
    const cursor = new Date(startDate);
    while (cursor.getMonth() === month || dates.length === 0) {
      dates.push(cursor.toLocaleDateString('en-CA'));
      cursor.setDate(cursor.getDate() + 1);
    }
    return dates;
  }, [year, month]);

  const visibleDates = useMemo(() => {
    return allDates.slice(dateOffset, dateOffset + datesToShow);
  }, [allDates, dateOffset, datesToShow]);

  const canSlidePrev = dateOffset > 0;
  const canSlideNext = dateOffset + datesToShow < allDates.length;

  const handleDatePrev = () => {
    setDateOffset(prev => Math.max(0, prev - datesToShow));
  };

  const handleDateNext = () => {
    setDateOffset(prev =>
      Math.min(allDates.length - datesToShow, prev + datesToShow)
    );
  };

  const fromDate = selectedDate;
  const toDate = useMemo(() => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-CA');
  }, [selectedDate]);
  const {
    data: apiSlots,
    loading: slotsLoading,
    error: slotsError,
  } = useAppointmentSlots(fromDate, toDate, speciality);

  const displaySlots: Record<
    SlotPeriod,
    { time: string; available: boolean; passed: boolean }[]
  > = useMemo(() => {
    const now = new Date();
    const isToday = selectedDate === today;
    const grouped: Record<
      SlotPeriod,
      { time: string; available: boolean; passed: boolean }[]
    > = {
      Morning: [],
      Afternoon: [],
      Evening: [],
    };
    const slotsForDate = apiSlots.filter(s => s.date === selectedDate);
    for (const slot of slotsForDate) {
      let passed = false;
      if (isToday) {
        const [time, meridiem] = slot.time.split(' ');
        const [hourStr, minStr] = time.split(':');
        let hour = parseInt(hourStr, 10);
        const min = parseInt(minStr, 10);
        if (meridiem === 'pm' && hour !== 12) hour += 12;
        if (meridiem === 'am' && hour === 12) hour = 0;
        const slotMinutes = hour * 60 + min;
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        passed = slotMinutes < nowMinutes;
      }
      if (grouped[slot.period]) {
        grouped[slot.period].push({
          time: slot.time,
          available: slot.isAvailable,
          passed,
        });
      }
    }
    return grouped;
  }, [apiSlots, selectedDate]);

  const getDayName = (date: string) =>
    new Date(date).toLocaleDateString('en-US', { weekday: 'short' });

  const confirmBooking = async () => {
    if (!visitUuid) {
      setTimeout(() => {
        showConfirmModal({
          icon: iconCalendar,
          title: 'Booking failed',
          description:
            'Visit information is missing. Please go back and try again.',
          confirmText: 'Ok',
          cancelText: 'Close',
          type: 'confirm',
          open: true,
        });
      }, 0);
      return;
    }

    setBooking(true);
    const [time, meridiem] = selectedTime!.split(' ');
    const [hourStr, min] = time.split(':');
    let hour = parseInt(hourStr, 10);
    if (meridiem.toLowerCase() === 'pm' && hour !== 12) hour += 12;
    if (meridiem.toLowerCase() === 'am' && hour === 12) hour = 0;
    const appointmentDatetime = `${selectedDate}T${String(hour).padStart(2, '0')}:${min}:00.000+0530`;

    try {
      await appointmentService.bookAppointment(visitUuid!, appointmentDatetime);

      setTimeout(() => {
        showConfirmModal({
          icon: iconCalendar,
          title: 'Appointment booked successfully!',
          confirmText: 'Ok',
          cancelText: 'Close',
          type: 'confirm',
          open: true,
          onConfirm: () => {
            navigate('/dashboard');
          },
        });
      }, 0);
    } catch (error) {
      console.error('Failed to book appointment:', error);
      setTimeout(() => {
        showConfirmModal({
          icon: iconCalendar,
          title: 'Booking failed',
          description: 'Failed to book the appointment. Please try again.',
          confirmText: 'Ok',
          cancelText: 'Close',
          type: 'confirm',
          open: true,
        });
      }, 0);
    } finally {
      setBooking(false);
    }
  };

  const bookAppointment = () => {
    showConfirmModal({
      icon: iconCalendar,
      title: 'Confirm appointment?',
      description: `Are you sure, patient want to book the appointment on\n${formatConfirmDate(selectedDate)} at ${selectedTime}?`,
      confirmText: 'Yes',
      cancelText: 'No',
      type: 'confirm',
      open: true,
      onConfirm: () => {
        confirmBooking();
      },
    });
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
    }
  };

  return (
    <div className="w-full bg-white rounded-xl p-4 md:p-5">
      <div className="hidden md:flex items-center gap-3 mb-2">
        <img src={iconsvioletFieldAppointmentDetails} alt="icon" />
        <span className="text-sm font-medium text-[#2E1E91]">
          Schedule appointment
        </span>
      </div>
      <hr className="hidden md:block border-t border-gray-200 mt-2 mb-4" />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-semibold text-gray-800">
          {MONTHS[month]}, {year}
        </h2>
        <div className="flex gap-2">
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

      <div className="flex items-center gap-1 mb-4">
        <button
          onClick={handleDatePrev}
          disabled={!canSlidePrev}
          aria-label="prev-dates"
          className="w-8 h-8 shrink-0 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <img src={iconChevronRight} className="w-4 h-4" alt="prev-dates" />
        </button>

        <div className="flex gap-[8px] overflow-hidden">
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

        <button
          onClick={handleDateNext}
          disabled={!canSlideNext}
          aria-label="next-dates"
          className="w-8 h-8 shrink-0 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <img src={iconChevronLeft} className="w-4 h-4" alt="next-dates" />
        </button>
      </div>

      <p className="hidden md:block text-[14px] font-medium text-[#7F7B92] mb-3">
        Pick a time slot
      </p>

      {slotsLoading && (
        <p className="text-center text-gray-400 py-4">Loading slots...</p>
      )}
      {!slotsLoading && slotsError && (
        <p className="text-center text-red-500 py-2 text-sm">{slotsError}</p>
      )}

      {!slotsLoading &&
        (Object.keys(displaySlots) as SlotPeriod[]).map(period => {
          const slots = displaySlots[period];
          if (slots.length === 0) return null;
          return (
            <div key={period} className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <img src={getTimeIcon(period)} alt={period} />
                <span className="text-[14px] font-medium text-gray-800">
                  {period}
                </span>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-6 lg:flex lg:flex-wrap gap-3">
                {slots.map(({ time, available, passed }) => {
                  const selected = selectedTime === time;
                  const disabled = !available || passed;

                  return (
                    <button
                      key={time}
                      disabled={!selectedDate || disabled}
                      onClick={() => setSelectedTime(selected ? null : time)}
                      className={`h-[37px] min-w-[97px] rounded-lg text-xs font-medium border transition
                        ${
                          selected
                            ? 'bg-[#3F2E9C] text-white border-[#3F2E9C]'
                            : disabled
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
          );
        })}

      <div className="flex justify-end mt-4">
        <button
          disabled={!selectedDate || !selectedTime || booking}
          onClick={bookAppointment}
          className={`px-6 h-10 rounded-lg text-sm font-semibold transition
            ${
              selectedDate && selectedTime && !booking
                ? 'bg-[#3F2E9C] text-white hover:bg-[#35258A]'
                : 'bg-[#3F2E9C] text-white opacity-50 cursor-not-allowed'
            }`}
        >
          {booking ? 'Booking...' : 'Book Appointment'}
        </button>
      </div>
    </div>
  );
}
