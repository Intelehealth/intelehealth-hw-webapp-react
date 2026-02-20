import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AppointmentScheduleComponent from '../../../modules/appointmentVisit/scheduleAppointment.component';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderComponent = () => render(<AppointmentScheduleComponent />);

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

describe('AppointmentScheduleComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
  });

  describe('Date count based on screen size', () => {
    it('shows 5 date buttons on mobile (innerWidth=500)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 500, writable: true, configurable: true });
      renderComponent();
      const dateArea = document.querySelector('.flex.gap-\\[8px\\]');
      expect(dateArea).toBeInTheDocument();
      const buttons = dateArea!.querySelectorAll('button');
      expect(buttons.length).toBe(5);
    });

    it('shows 10 date buttons on tablet (innerWidth=800)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 800, writable: true, configurable: true });
      renderComponent();
      const dateArea = document.querySelector('.flex.gap-\\[8px\\]');
      const buttons = dateArea!.querySelectorAll('button');
      expect(buttons.length).toBe(10);
    });

    it('shows 13 date buttons on desktop (innerWidth=1200)', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true, configurable: true });
      renderComponent();
      const dateArea = document.querySelector('.flex.gap-\\[8px\\]');
      const buttons = dateArea!.querySelectorAll('button');
      expect(buttons.length).toBe(13);
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
        const dateArea = document.querySelector('.flex.gap-\\[8px\\]');
        const buttons = dateArea!.querySelectorAll('button');
        expect(buttons.length).toBe(13);
      });
    });

    it('clears debounce timer on rapid resize (only applies last)', async () => {
      vi.useFakeTimers();
      renderComponent();

      act(() => {
        // First resize to tablet
        Object.defineProperty(window, 'innerWidth', { value: 800, writable: true, configurable: true });
        fireEvent(window, new Event('resize'));
        // Second resize to desktop before debounce fires
        Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true, configurable: true });
        fireEvent(window, new Event('resize'));
        vi.advanceTimersByTime(200);
      });

      vi.useRealTimers();
      await waitFor(() => {
        const dateArea = document.querySelector('.flex.gap-\\[8px\\]');
        const buttons = dateArea!.querySelectorAll('button');
        expect(buttons.length).toBe(13);
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

      // Trigger resize to start the debounce timer
      act(() => {
        fireEvent(window, new Event('resize'));
      });

      // Unmount before debounce completes — should clear the timer
      const { unmount } = render(<AppointmentScheduleComponent />);
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
      // Click prev on current month — should stay
      fireEvent.click(screen.getByAltText('prev').closest('button')!);
      expect(screen.getByText(expected)).toBeInTheDocument();
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
      const dateArea = document.querySelector('.flex.gap-\\[8px\\]');
      const buttons = dateArea!.querySelectorAll('button');
      // Second date should not be selected
      expect(buttons[1]).toHaveClass('bg-white');
    });

    it('clicking a date resets selected time', () => {
      renderComponent();
      const todayBtn = screen.getByText('Today').closest('button')!;
      fireEvent.click(todayBtn);
      const timeBtn = screen.getByText('09:00 am');
      fireEvent.click(timeBtn);
      expect(timeBtn).toHaveClass('bg-[#3F2E9C]');
      // Click same date again — resets time selection
      fireEvent.click(todayBtn);
      expect(timeBtn).not.toHaveClass('bg-[#3F2E9C]');
    });

    it('today button shows "Today" text with purple color when not selected', () => {
      renderComponent();
      // Today is selected by default; click another date to deselect it
      const dateArea = document.querySelector('.flex.gap-\\[8px\\]');
      const secondBtn = dateArea!.querySelectorAll('button')[1];
      fireEvent.click(secondBtn);
      const todayLabel = screen.getByText('Today');
      expect(todayLabel).toHaveClass('text-[#2E1E91]');
      expect(todayLabel).toHaveClass('font-medium');
    });

    it('today button shows white text when selected (default state)', () => {
      renderComponent();
      // Today is selected by default
      const todayLabel = screen.getByText('Today');
      expect(todayLabel).toHaveClass('text-white');
    });

    it('non-today dates display short day name', () => {
      renderComponent();
      const dateArea = document.querySelector('.flex.gap-\\[8px\\]');
      const buttons = dateArea!.querySelectorAll('button');
      // Second date should show a day name (Mon, Tue, etc.)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const expectedDay = tomorrow.toLocaleDateString('en-US', { weekday: 'short' });
      expect(buttons[1].textContent).toContain(expectedDay);
    });

    it('displays correct day number for each date', () => {
      renderComponent();
      const todayNumber = new Date().toLocaleDateString('en-CA').split('-')[2];
      const dateArea = document.querySelector('.flex.gap-\\[8px\\]');
      const firstBtn = dateArea!.querySelector('button')!;
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

    it('clicking Book shows confirm modal', () => {
      renderComponent();
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      expect(screen.getByText('Confirm appointment?')).toBeInTheDocument();
    });

    it('confirm modal shows formatted date and time', () => {
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

    it('clicking confirm modal backdrop dismisses it', () => {
      renderComponent();
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      expect(screen.getByText('Confirm appointment?')).toBeInTheDocument();
      const backdrop = document.querySelector('.bg-black\\/50');
      fireEvent.click(backdrop!);
      expect(screen.queryByText('Confirm appointment?')).not.toBeInTheDocument();
    });

    it('clicking Yes confirms booking and shows success modal', () => {
      renderComponent();
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
      expect(screen.getByText('Appointment booked successfully!')).toBeInTheDocument();
    });

    it('success modal auto-dismisses and navigates after 2 seconds', () => {
      vi.useFakeTimers();
      renderComponent();
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
      expect(screen.getByText('Appointment booked successfully!')).toBeInTheDocument();
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(mockNavigate).toHaveBeenCalledWith('/my-appointments');
    });

    it('clicking success modal backdrop navigates to my-appointments', () => {
      renderComponent();
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
      expect(screen.getByText('Appointment booked successfully!')).toBeInTheDocument();
      const backdrops = document.querySelectorAll('.bg-black\\/50');
      fireEvent.click(backdrops[0]);
      expect(mockNavigate).toHaveBeenCalledWith('/my-appointments');
    });

    it('booked slot becomes disabled with gray styling', () => {
      renderComponent();
      const todayBtn = screen.getByText('Today').closest('button')!;
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      fireEvent.click(screen.getByRole('button', { name: 'Yes' }));

      // Re-select today to check the slot
      fireEvent.click(todayBtn);
      const slot = screen.getByText('09:00 am');
      expect(slot).toBeDisabled();
      expect(slot).toHaveClass('bg-gray-200');
      expect(slot).toHaveClass('text-gray-400');
      expect(slot).toHaveClass('cursor-not-allowed');
    });

    it('clicking Book does nothing when no time selected', () => {
      renderComponent();
      const btn = screen.getByRole('button', { name: 'Book Appointment' });
      fireEvent.click(btn);
      expect(screen.queryByText('Confirm appointment?')).not.toBeInTheDocument();
    });

    it('confirm modal shows ordinal "st" suffix for the 1st', () => {
      renderComponent();
      fireEvent.click(screen.getByAltText('next').closest('button')!);
      const dateArea = document.querySelector('.flex.gap-\\[8px\\]');
      fireEvent.click(dateArea!.querySelector('button')!);
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      expect(screen.getByText(/1st \w+ at 09:00 am\?/)).toBeInTheDocument();
    });

    it('confirm modal shows ordinal "nd" suffix for the 2nd', () => {
      renderComponent();
      fireEvent.click(screen.getByAltText('next').closest('button')!);
      const dateArea = document.querySelector('.flex.gap-\\[8px\\]');
      fireEvent.click(dateArea!.querySelectorAll('button')[1]);
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      expect(screen.getByText(/2nd \w+ at 09:00 am\?/)).toBeInTheDocument();
    });

    it('confirm modal shows ordinal "rd" suffix for the 3rd', () => {
      renderComponent();
      fireEvent.click(screen.getByAltText('next').closest('button')!);
      const dateArea = document.querySelector('.flex.gap-\\[8px\\]');
      fireEvent.click(dateArea!.querySelectorAll('button')[2]);
      fireEvent.click(screen.getByText('09:00 am'));
      fireEvent.click(screen.getByRole('button', { name: 'Book Appointment' }));
      expect(screen.getByText(/3rd \w+ at 09:00 am\?/)).toBeInTheDocument();
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
      const dateArea = document.querySelector('.flex.gap-\\[8px\\]');
      const firstBtn = dateArea!.querySelector('button')!;
      expect(firstBtn.textContent).toContain('01');
    });

    it('spans into next month when current month runs short', () => {
      // On desktop with 13 dates, starting late in the month may span into next month
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true, configurable: true });
      renderComponent();
      const dateArea = document.querySelector('.flex.gap-\\[8px\\]');
      const buttons = dateArea!.querySelectorAll('button');
      expect(buttons.length).toBe(13);
    });
  });
});
