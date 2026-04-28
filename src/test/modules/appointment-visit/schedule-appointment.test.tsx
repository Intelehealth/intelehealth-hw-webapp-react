import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GlobalModalProvider } from '../../../components/modal/global-modal-context';
import AppointmentScheduleComponent from '../../../modules/appointment-visit/schedule-appointment.component';

const mockNavigate = vi.fn();
let mockLocationState: { speciality?: string } | null = { speciality: 'General Physician' };
let mockVisitUuid: string | undefined = 'test-visit-uuid';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ visitUuid: mockVisitUuid }),
    useLocation: () => ({ state: mockLocationState, pathname: '/appointment-schedule/test-visit-uuid', search: '', hash: '', key: 'default' }),
  };
});

// Generate mock slots for a given date
const morningTimes = ['09:00 am', '09:30 am', '10:00 am', '10:30 am', '11:00 am', '11:30 am'];
const afternoonTimes = ['12:00 pm', '12:30 pm', '01:00 pm', '01:30 pm', '02:00 pm', '02:30 pm', '03:00 pm', '03:30 pm', '04:00 pm', '04:30 pm', '05:00 pm', '05:30 pm', '06:00 pm'];
const eveningTimes = ['06:30 pm', '07:00 pm', '07:30 pm', '08:00 pm', '08:30 pm', '09:00 pm', '09:30 pm', '10:00 pm', '10:30 pm', '11:00 pm'];

const buildSlotsForDate = (date: string, allAvailable = true) => [
  ...morningTimes.map(time => ({ slotId: `${date}-${time.replace(/\s+/g, '-')}`, date, time, isAvailable: allAvailable, period: 'Morning' as const, speciality: 'General Physician' })),
  ...afternoonTimes.map(time => ({ slotId: `${date}-${time.replace(/\s+/g, '-')}`, date, time, isAvailable: true, period: 'Afternoon' as const, speciality: 'General Physician' })),
  ...eveningTimes.map(time => ({ slotId: `${date}-${time.replace(/\s+/g, '-')}`, date, time, isAvailable: true, period: 'Evening' as const, speciality: 'General Physician' })),
];

// Generate slots for today and next 90 days to cover future-month navigation tests
const defaultSlots: ReturnType<typeof buildSlotsForDate> = [];
{
  const cursor = new Date();
  for (let i = 0; i < 90; i++) {
    defaultSlots.push(...buildSlotsForDate(cursor.toLocaleDateString('en-CA')));
    cursor.setDate(cursor.getDate() + 1);
  }
}

// Configurable mock return value
let mockSlotsReturn: { data: typeof defaultSlots; loading: boolean; error: string | null } = {
  data: defaultSlots,
  loading: false,
  error: null,
};

vi.mock('../../../hooks/useAppointmentSlots', () => ({
  useAppointmentSlots: () => mockSlotsReturn,
}));

// Mock appointment service
const mockBookAppointment = vi.fn();
vi.mock('../../../modules/appointment-visit/appointment.service', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('../../../modules/appointment-visit/appointment.service');
  const originalService = actual.appointmentService as Record<string, unknown>;
  return {
    ...actual,
    appointmentService: {
      ...originalService,
      bookAppointment: (...args: unknown[]) => mockBookAppointment(...args),
    },
  };
});

const renderComponent = () =>
  render(
    <GlobalModalProvider>
      <AppointmentScheduleComponent />
    </GlobalModalProvider>
  );

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Remaining days in the current month (including today) */
const remainingDaysInMonth = (() => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate() + 1;
})();

/** Helper: get the date-buttons container (inner flex with gap-[8px]) */
const getDateArea = () => document.querySelector('.flex.gap-\\[8px\\]')!;

/** Helper: how many dates remain from today through end-of-month (inclusive). */
const remainingDaysInCurrentMonth = () => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate() + 1;
};

describe('AppointmentScheduleComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBookAppointment.mockResolvedValue({ success: true });
    mockSlotsReturn = { data: defaultSlots, loading: false, error: null };
    mockVisitUuid = 'test-visit-uuid';
    mockLocationState = { speciality: 'General Physician' };
    Object.defineProperty(window, 'innerWidth', {
      value: 500,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial render', () => {
    it('renders without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('renders Schedule appointment header', () => {
      renderComponent();
      expect(screen.getByText('Schedule appointment')).toBeInTheDocument();
    });

    it('renders current month and year', () => {
      renderComponent();
      const now = new Date();
      const expected = `${MONTHS[now.getMonth()]}, ${now.getFullYear()}`;
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('renders "Pick a time slot" label', () => {
      renderComponent();
      expect(screen.getByText('Pick a time slot')).toBeInTheDocument();
    });

    it('renders all time period labels', () => {
      renderComponent();
      expect(screen.getByText('Morning')).toBeInTheDocument();
      expect(screen.getByText('Afternoon')).toBeInTheDocument();
      expect(screen.getByText('Evening')).toBeInTheDocument();
    });

    it('renders Book Appointment button initially disabled', () => {
      renderComponent();
      const btn = screen.getByRole('button', { name: 'Book Appointment' });
      expect(btn).toBeDisabled();
    });

    it('renders "Today" label on the first visible date', () => {
      renderComponent();
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('renders the schedule appointment icon', () => {
      renderComponent();
      const icon = screen.getByAltText('icon');
      expect(icon).toBeInTheDocument();
    });

    it('renders a horizontal rule separator', () => {
      const { container } = renderComponent();
      const hr = container.querySelector('hr');
      expect(hr).toBeInTheDocument();
    });

    it('renders without crashing when speciality is not provided (uses fallback)', () => {
      mockLocationState = null;
      expect(() => renderComponent()).not.toThrow();
    });
  });

  describe('Date count based on screen size', () => {
    it('shows 5 date buttons on mobile (innerWidth=500)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500, writable: true, configurable: true });
      renderComponent();
      const buttons = getDateArea().querySelectorAll('button');
      expect(buttons.length).toBe(Math.min(5, remainingDaysInMonth));
    });

    it('shows 10 date buttons on tablet (innerWidth=800)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true, configurable: true });
      renderComponent();
      const buttons = getDateArea().querySelectorAll('button');
      // `allDates` starts from today — if today is late in the month fewer dates remain.
      expect(buttons.length).toBe(Math.min(10, remainingDaysInCurrentMonth()));
    });

    it('shows 13 date buttons on desktop (innerWidth=1200)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true, configurable: true });
      renderComponent();
      const buttons = getDateArea().querySelectorAll('button');
      expect(buttons.length).toBe(Math.min(13, remainingDaysInCurrentMonth()));
    });
  });

  describe('Resize handler', () => {
    it('updates datesToShow on window resize with debounce', async () => {
      vi.useFakeTimers();
      renderComponent();

      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true, configurable: true });
        fireEvent(window, new Event('resize'));
        vi.advanceTimersByTime(200);
      });

      vi.useRealTimers();
      await waitFor(() => {
        const buttons = getDateArea().querySelectorAll('button');
        expect(buttons.length).toBe(Math.min(13, remainingDaysInCurrentMonth()));
      });
    });

    it('clears debounce timer on rapid resize (only applies last)', async () => {
      vi.useFakeTimers();
      renderComponent();

      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 800, writable: true, configurable: true });
        fireEvent(window, new Event('resize'));
        Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true, configurable: true });
        fireEvent(window, new Event('resize'));
        vi.advanceTimersByTime(200);
      });

      vi.useRealTimers();
      await waitFor(() => {
        const buttons = getDateArea().querySelectorAll('button');
        expect(buttons.length).toBe(Math.min(13, remainingDaysInCurrentMonth()));
      });
    });

    it('cleans up event listener on unmount', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderComponent();
      unmount();
      expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('clears active debounce timer on unmount', () => {
      vi.useFakeTimers();
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      renderComponent();

      act(() => {
        fireEvent(window, new Event('resize'));
      });

      const { unmount } = render(
        <GlobalModalProvider>
          <AppointmentScheduleComponent />
        </GlobalModalProvider>
      );
      act(() => {
        fireEvent(window, new Event('resize'));
      });
      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('Month navigation', () => {
    it('renders prev and next navigation buttons', () => {
      renderComponent();
      expect(screen.getByAltText('prev')).toBeInTheDocument();
      expect(screen.getByAltText('next')).toBeInTheDocument();
    });

    it('prev button is disabled on current month', () => {
      renderComponent();
      const prevBtn = screen.getByAltText('prev').closest('button')!;
      expect(prevBtn).toBeDisabled();
    });

    it('navigates to next month on next button click', () => {
      renderComponent();
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const expected = `${MONTHS[nextMonth.getMonth()]}, ${nextMonth.getFullYear()}`;
      fireEvent.click(screen.getByAltText('next').closest('button')!);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('prev button is enabled after navigating to next month', () => {
      renderComponent();
      fireEvent.click(screen.getByAltText('next').closest('button')!);
      const prevBtn = screen.getByAltText('prev').closest('button')!;
      expect(prevBtn).not.toBeDisabled();
    });

    it('navigates back to current month after going forward then back', () => {
      renderComponent();
      const now = new Date();
      const expected = `${MONTHS[now.getMonth()]}, ${now.getFullYear()}`;
      fireEvent.click(screen.getByAltText('next').closest('button')!);
      fireEvent.click(screen.getByAltText('prev').closest('button')!);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('shows dates starting from 1st for future month', () => {
      renderComponent();
      fireEvent.click(screen.getByAltText('next').closest('button')!);
      expect(screen.getAllByText('01').length).toBeGreaterThan(0);
    });

    it('does not navigate before current month when clicking prev on current month', () => {
      renderComponent();
      const now = new Date();
      const expected = `${MONTHS[now.getMonth()]}, ${now.getFullYear()}`;
      fireEvent.click(screen.getByAltText('prev').closest('button')!);
      expect(screen.getByText(expected)).toBeInTheDocument();
    });

    it('resets date offset when navigating to next month', () => {
      renderComponent();
      // Slide dates forward first
      const nextDatesBtn = screen.getByAltText('next-dates').closest('button')!;
      fireEvent.click(nextDatesBtn);
      // Now navigate to next month — should reset to 1st
      fireEvent.click(screen.getByAltText('next').closest('button')!);
      const firstBtn = getDateArea().querySelector('button')!;
      expect(firstBtn.textContent).toContain('01');
    });

    it('resets date offset when navigating back to previous month', () => {
      renderComponent();
      // Go to next month, slide dates, then go back
      fireEvent.click(screen.getByAltText('next').closest('button')!);
      const nextDatesBtn = screen.getByAltText('next-dates').closest('button')!;
      fireEvent.click(nextDatesBtn);
      fireEvent.click(screen.getByAltText('prev').closest('button')!);
      // Should show today again
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('navigating back from 2 months ahead lands on a future (non-current) month', () => {
      renderComponent();
      const nextBtn = screen.getByAltText('next').closest('button')!;
      // Go forward 2 months
      fireEvent.click(nextBtn);
      fireEvent.click(nextBtn);
      // Go back 1 month (still a future month, not current)
      fireEvent.click(screen.getByAltText('prev').closest('button')!);
      const now = new Date();
      const expectedMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const expected = `${MONTHS[expectedMonth.getMonth()]}, ${expectedMonth.getFullYear()}`;
      expect(screen.getByText(expected)).toBeInTheDocument();
      // First visible date should be 1st (not today, since it's a future month)
      const firstBtn = getDateArea().querySelector('button')!;
      expect(firstBtn.textContent).toContain('01');
    });
  });

  describe('Date slider navigation', () => {
    it('renders prev-dates and next-dates arrow buttons', () => {
      renderComponent();
      expect(screen.getByAltText('prev-dates')).toBeInTheDocument();
      expect(screen.getByAltText('next-dates')).toBeInTheDocument();
    });

    it('prev-dates is disabled at initial offset (start of dates)', () => {
      renderComponent();
      const prevDatesBtn = screen.getByAltText('prev-dates').closest('button')!;
      expect(prevDatesBtn).toBeDisabled();
    });

    it('next-dates slides to next page of dates', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500, writable: true, configurable: true });
      renderComponent();
      // Navigate to next month to ensure enough dates for sliding
      fireEvent.click(screen.getByAltText('next').closest('button')!);
      const firstDateBefore = getDateArea().querySelector('button')!.textContent;
      fireEvent.click(screen.getByAltText('next-dates').closest('button')!);
      const firstDateAfter = getDateArea().querySelector('button')!.textContent;
      expect(firstDateAfter).not.toBe(firstDateBefore);
    });

    it('prev-dates becomes enabled after sliding forward', () => {
      renderComponent();
      // Navigate to next month to ensure enough dates for sliding
      fireEvent.click(screen.getByAltText('next').closest('button')!);
      fireEvent.click(screen.getByAltText('next-dates').closest('button')!);
      const prevDatesBtn = screen.getByAltText('prev-dates').closest('button')!;
      expect(prevDatesBtn).not.toBeDisabled();
    });

    it('prev-dates slides back to previous page of dates', () => {
      renderComponent();
      // Navigate to next month to ensure enough dates for sliding
      fireEvent.click(screen.getByAltText('next').closest('button')!);
      const firstDateOriginal = getDateArea().querySelector('button')!.textContent;
      fireEvent.click(screen.getByAltText('next-dates').closest('button')!);
      fireEvent.click(screen.getByAltText('prev-dates').closest('button')!);
      const firstDateBack = getDateArea().querySelector('button')!.textContent;
      expect(firstDateBack).toBe(firstDateOriginal);
    });

    it('next-dates is disabled when at the end of month dates', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true, configurable: true });
      renderComponent();
      // Navigate to next month (full 30/31 days) and click next-dates until disabled
      fireEvent.click(screen.getByAltText('next').closest('button')!);
      const nextDatesBtn = screen.getByAltText('next-dates').closest('button')!;
      // Click multiple times to reach end
      for (let i = 0; i < 5; i++) {
        if (nextDatesBtn.disabled) break;
        fireEvent.click(nextDatesBtn);
      }
      // At some point it should be disabled
      expect(nextDatesBtn).toBeDisabled();
    });
  });

  describe('Date selection', () => {
    it('clicking a date selects it (applies selected class)', () => {
      renderComponent();
      const todayBtn = screen.getByText('Today').closest('button')!;
      fireEvent.click(todayBtn);
      expect(todayBtn).toHaveClass('bg-[#3F2E9C]');
      expect(todayBtn).toHaveClass('text-white');
    });

    it('non-selected date has default class', () => {
      renderComponent();
      const buttons = getDateArea().querySelectorAll('button');
      expect(buttons[1]).toHaveClass('bg-white');
    });

    it('clicking a date resets selected time', () => {
      renderComponent();
      const todayBtn = screen.getByText('Today').closest('button')!;
      fireEvent.click(todayBtn);
      const timeBtn = screen.getByText('09:00 am');
      fireEvent.click(timeBtn);
      expect(timeBtn).toHaveClass('bg-[#3F2E9C]');
      fireEvent.click(todayBtn);
      expect(timeBtn).not.toHaveClass('bg-[#3F2E9C]');
    });

    it('today button shows "Today" text with purple color when not selected', () => {
      renderComponent();
      const secondBtn = getDateArea().querySelectorAll('button')[1];
      fireEvent.click(secondBtn);
      const todayLabel = screen.getByText('Today');
      expect(todayLabel).toHaveClass('text-[#2E1E91]');
      expect(todayLabel).toHaveClass('font-medium');
    });

    it('today button shows white text when selected (default state)', () => {
      renderComponent();
      const todayLabel = screen.getByText('Today');
      expect(todayLabel).toHaveClass('text-white');
    });

    it('non-today dates display short day name', () => {
      renderComponent();
      const buttons = getDateArea().querySelectorAll('button');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const expectedDay = tomorrow.toLocaleDateString('en-US', { weekday: 'short' });
      expect(buttons[1].textContent).toContain(expectedDay);
    });

    it('displays correct day number for each date', () => {
      renderComponent();
      const todayNumber = new Date().toLocaleDateString('en-CA').split('-')[2];
      const firstBtn = getDateArea().querySelector('button')!;
      expect(firstBtn.textContent).toContain(todayNumber);
    });
  });

  describe('Time slot selection', () => {
    it('time slots are enabled by default since today is auto-selected', () => {
      renderComponent();
      expect(screen.getByText('09:00 am')).not.toBeDisabled();
    });

    it('time slots remain enabled after re-selecting a date', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Today').closest('button')!);
      expect(screen.getByText('09:00 am')).not.toBeDisabled();
    });

    it('clicking a time slot selects it (purple styling)', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Today').closest('button')!);
      const slot = screen.getByText('09:00 am');
      fireEvent.click(slot);
      expect(slot).toHaveClass('bg-[#3F2E9C]');
      expect(slot).toHaveClass('text-white');
    });

    it('clicking a selected time slot deselects it', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Today').closest('button')!);
      const slot = screen.getByText('09:00 am');
      fireEvent.click(slot);
      fireEvent.click(slot);
      expect(slot).not.toHaveClass('bg-[#3F2E9C]');
      expect(slot).toHaveClass('bg-[#F3F1FB]');
    });

    it('unselected available slot has default light purple styling', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Today').closest('button')!);
      const slot = screen.getByText('10:00 am');
      expect(slot).toHaveClass('bg-[#F3F1FB]');
      expect(slot).toHaveClass('border-[#E0DDF5]');
    });

    it('renders morning time slots', () => {
      renderComponent();
      expect(screen.getByText('09:00 am')).toBeInTheDocument();
      expect(screen.getByText('09:30 am')).toBeInTheDocument();
      expect(screen.getByText('10:00 am')).toBeInTheDocument();
      expect(screen.getByText('10:30 am')).toBeInTheDocument();
      expect(screen.getByText('11:00 am')).toBeInTheDocument();
      expect(screen.getByText('11:30 am')).toBeInTheDocument();
    });

    it('renders afternoon time slots', () => {
      renderComponent();
      expect(screen.getByText('12:00 pm')).toBeInTheDocument();
      expect(screen.getByText('06:00 pm')).toBeInTheDocument();
    });

    it('renders evening time slots', () => {
      renderComponent();
      expect(screen.getByText('06:30 pm')).toBeInTheDocument();
      expect(screen.getByText('11:00 pm')).toBeInTheDocument();
    });

    it('unavailable slot shows disabled gray styling', () => {
      const todayDate = new Date().toLocaleDateString('en-CA');
      const slotsWithBooked = defaultSlots.map(s =>
        s.date === todayDate && s.time === '10:00 am' ? { ...s, isAvailable: false } : s
      );
      mockSlotsReturn = { data: slotsWithBooked, loading: false, error: null };
      renderComponent();
      const slot = screen.getByText('10:00 am');
      expect(slot).toBeDisabled();
      expect(slot).toHaveClass('bg-gray-200');
      expect(slot).toHaveClass('text-gray-400');
      expect(slot).toHaveClass('cursor-not-allowed');
    });
  });

  describe('Loading and error states', () => {
    it('shows loading text when slots are loading', () => {
      mockSlotsReturn = { data: [], loading: true, error: null };
      renderComponent();
      expect(screen.getByText('Loading slots...')).toBeInTheDocument();
    });

    it('shows error message when slots fail to load', () => {
      mockSlotsReturn = { data: [], loading: false, error: 'Failed to fetch appointment slots' };
      renderComponent();
      expect(screen.getByText('Failed to fetch appointment slots')).toBeInTheDocument();
    });

    it('does not show time periods when loading', () => {
      mockSlotsReturn = { data: [], loading: true, error: null };
      renderComponent();
      expect(screen.queryByText('Morning')).not.toBeInTheDocument();
    });
  });

  describe('Book Appointment', () => {
    it('Book button remains disabled when only date is selected', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Today').closest('button')!);
      const btn = screen.getByRole('button', { name: 'Book Appointment' });
      expect(btn).toBeDisabled();
    });

    it('Book button becomes enabled when both date and time are selected', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Today').closest('button')!);
      fireEvent.click(screen.getByText('09:00 am'));
      const btn = screen.getByRole('button', { name: 'Book Appointment' });
      expect(btn).not.toBeDisabled();
    });

    it('Book button has active styling when enabled', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Today').closest('button')!);
      fireEvent.click(screen.getByText('09:00 am'));
      const btn = screen.getByRole('button', { name: 'Book Appointment' });
      expect(btn).toHaveClass('bg-[#3F2E9C]');
    });

    it('Book button has disabled styling when not enabled', () => {
      renderComponent();
      const btn = screen.getByRole('button', { name: 'Book Appointment' });
      expect(btn).toHaveClass('bg-[#3F2E9C]');
      expect(btn).toHaveClass('opacity-50');
      expect(btn).toHaveClass('cursor-not-allowed');
    });

    it('clicking Book shows confirm modal via global modal', () => {
      renderComponent();
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      expect(screen.getByText('Confirm appointment?')).toBeInTheDocument();
    });

    it('confirm modal shows formatted date and time in description', () => {
      renderComponent();
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      expect(screen.getByText(/at 09:00 am\?/)).toBeInTheDocument();
    });

    it('clicking No dismisses confirm modal', () => {
      renderComponent();
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      expect(screen.getByText('Confirm appointment?')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'No' }));
      expect(screen.queryByText('Confirm appointment?')).not.toBeInTheDocument();
    });

    it('clicking Yes calls bookAppointment API and shows success modal', async () => {
      vi.useFakeTimers();
      renderComponent();
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

      await act(async () => { await vi.runAllTimersAsync(); });
      vi.useRealTimers();

      await waitFor(() => {
        expect(mockBookAppointment).toHaveBeenCalledWith(
          'test-visit-uuid',
          expect.stringMatching(/^\d{4}-\d{2}-\d{2}T09:00:00\.000\+0530$/)
        );
        expect(screen.getByText('Appointment booked successfully!')).toBeInTheDocument();
      });
    });

    it('clicking Ok on success modal navigates to my-appointments', async () => {
      vi.useFakeTimers();
      renderComponent();
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
      await act(async () => { await vi.runAllTimersAsync(); });
      vi.useRealTimers();
      await waitFor(() => {
        expect(screen.getByText('Appointment booked successfully!')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: 'Ok' }));
      expect(mockNavigate).toHaveBeenCalledWith('/my-appointments');
    });

    it('clicking Close on success modal dismisses it without navigating', async () => {
      vi.useFakeTimers();
      renderComponent();
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
      await act(async () => { await vi.runAllTimersAsync(); });
      vi.useRealTimers();
      await waitFor(() => {
        expect(screen.getByText('Appointment booked successfully!')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: 'Close' }));
      expect(screen.queryByText('Appointment booked successfully!')).not.toBeInTheDocument();
    });

    it('correctly converts PM time when booking (hour += 12 for non-12 PM)', async () => {
      vi.useFakeTimers();
      renderComponent();
      fireEvent.click(screen.getByText('01:00 pm'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
      await act(async () => { await vi.runAllTimersAsync(); });
      vi.useRealTimers();
      await waitFor(() => {
        expect(mockBookAppointment).toHaveBeenCalledWith(
          'test-visit-uuid',
          expect.stringMatching(/^\d{4}-\d{2}-\d{2}T13:00:00\.000\+0530$/)
        );
      });
    });

    it('correctly handles 12:00 PM (noon) without adding 12', async () => {
      vi.useFakeTimers();
      renderComponent();
      fireEvent.click(screen.getByText('12:00 pm'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
      await act(async () => { await vi.runAllTimersAsync(); });
      vi.useRealTimers();
      await waitFor(() => {
        expect(mockBookAppointment).toHaveBeenCalledWith(
          'test-visit-uuid',
          expect.stringMatching(/^\d{4}-\d{2}-\d{2}T12:00:00\.000\+0530$/)
        );
      });
    });

    it('clicking Book does nothing when no time selected', () => {
      renderComponent();
      const btn = screen.getByRole('button', { name: 'Book Appointment' });
      fireEvent.click(btn);
      expect(screen.queryByText('Confirm appointment?')).not.toBeInTheDocument();
    });

    it('shows error modal when API call fails', async () => {
      mockBookAppointment.mockRejectedValue(new Error('Network error'));
      vi.useFakeTimers();
      renderComponent();
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
      await act(async () => { await vi.runAllTimersAsync(); });
      vi.useRealTimers();
      await waitFor(() => {
        expect(screen.getByText('Booking failed')).toBeInTheDocument();
      });
    });

    it('shows "Visit information is missing" modal when visitUuid is absent', async () => {
      mockVisitUuid = undefined;
      vi.useFakeTimers();
      renderComponent();
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
      await act(async () => { await vi.runAllTimersAsync(); });
      vi.useRealTimers();
      await waitFor(() => {
        expect(screen.getByText('Visit information is missing. Please go back and try again.')).toBeInTheDocument();
      });
      expect(mockBookAppointment).not.toHaveBeenCalled();
    });

    it('confirm modal shows ordinal "st" suffix for the 1st', () => {
      renderComponent();
      fireEvent.click(screen.getByAltText('next').closest('button')!);
      fireEvent.click(getDateArea().querySelector('button')!);
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      expect(screen.getByText(/1st \w+ at 09:00 am\?/)).toBeInTheDocument();
    });

    it('confirm modal shows ordinal "nd" suffix for the 2nd', () => {
      renderComponent();
      fireEvent.click(screen.getByAltText('next').closest('button')!);
      fireEvent.click(getDateArea().querySelectorAll('button')[1]);
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      expect(screen.getByText(/2nd \w+ at 09:00 am\?/)).toBeInTheDocument();
    });

    it('confirm modal shows ordinal "rd" suffix for the 3rd', () => {
      renderComponent();
      fireEvent.click(screen.getByAltText('next').closest('button')!);
      fireEvent.click(getDateArea().querySelectorAll('button')[2]);
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      expect(screen.getByText(/3rd \w+ at 09:00 am\?/)).toBeInTheDocument();
    });

    it('confirm modal shows ordinal "th" suffix for dates like 4th-20th, 24th-30th', () => {
      renderComponent();
      const nextBtn = screen.getByAltText('next').closest('button')!;
      fireEvent.click(nextBtn);
      fireEvent.click(nextBtn);
      const dateButtons = getDateArea().querySelectorAll('button');
      let targetButton: Element | null = null;
      dateButtons.forEach(btn => {
        const dayNum = parseInt(btn.textContent?.match(/\d+/)?.[0] || '0');
        if (
          (dayNum >= 4 && dayNum <= 20) ||
          (dayNum >= 24 && dayNum <= 30)
        ) {
          if (!targetButton) targetButton = btn;
        }
      });
      if (!targetButton) targetButton = dateButtons[3];
      fireEvent.click(targetButton!);
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      expect(screen.getByText(/\d+th \w+ at 09:00 am\?/)).toBeInTheDocument();
    });
  });

  describe('Time period icons', () => {
    it('renders sunrise icon for Morning', () => {
      renderComponent();
      expect(screen.getByAltText('Morning')).toBeInTheDocument();
    });

    it('renders afternoon icon for Afternoon', () => {
      renderComponent();
      expect(screen.getByAltText('Afternoon')).toBeInTheDocument();
    });

    it('renders sunset icon for Evening', () => {
      renderComponent();
      expect(screen.getByAltText('Evening')).toBeInTheDocument();
    });
  });

  describe('Visible dates generation', () => {
    it('generates dates starting from today for current month', () => {
      renderComponent();
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('generates dates starting from 1st for future month', () => {
      renderComponent();
      fireEvent.click(screen.getByAltText('next').closest('button')!);
      const firstBtn = getDateArea().querySelector('button')!;
      expect(firstBtn.textContent).toContain('01');
    });

    it('shows remaining days of current month on desktop', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true, configurable: true });
      renderComponent();
      const buttons = getDateArea().querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
      expect(buttons.length).toBeLessThanOrEqual(31);
    });
  });
});
