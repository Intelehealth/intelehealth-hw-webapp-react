import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MyAppointments from '../../../modules/appointmentVisit/myappointments.component';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderComponent = () => render(<MyAppointments />);

describe('MyAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial render', () => {
    it('renders without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('renders header text', () => {
      renderComponent();
      expect(screen.getByText('My appointments')).toBeInTheDocument();
    });

    it('renders header icon', () => {
      renderComponent();
      expect(screen.getByAltText('appointments')).toBeInTheDocument();
    });

    it('renders upcoming and past tab buttons with counts', () => {
      renderComponent();
      expect(screen.getByText(/Upcoming \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/Past \(2\)/)).toBeInTheDocument();
    });

    it('defaults to past tab showing past appointments', () => {
      renderComponent();
      expect(screen.getAllByText(/Vimla Jadhav/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Shantaram Rathod/).length).toBeGreaterThan(0);
    });

    it('renders search input with placeholder', () => {
      renderComponent();
      expect(screen.getByPlaceholderText('Find patient')).toBeInTheDocument();
    });

    it('renders filter and sort icons', () => {
      renderComponent();
      expect(screen.getByAltText('filter')).toBeInTheDocument();
      expect(screen.getByAltText('sort')).toBeInTheDocument();
    });

    it('renders search icon', () => {
      renderComponent();
      expect(screen.getByAltText('search')).toBeInTheDocument();
    });
  });

  describe('Tab switching', () => {
    it('switches to upcoming tab and shows upcoming appointments', () => {
      renderComponent();
      fireEvent.click(screen.getByText(/Upcoming/));
      expect(screen.getAllByText(/Bapu Mali/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Ramesh Patil/).length).toBeGreaterThan(0);
    });

    it('hides past appointments when on upcoming tab', () => {
      renderComponent();
      fireEvent.click(screen.getByText(/Upcoming/));
      expect(screen.queryByText('Vimla Jadhav')).not.toBeInTheDocument();
    });

    it('switches back to past tab', () => {
      renderComponent();
      fireEvent.click(screen.getByText(/Upcoming/));
      fireEvent.click(screen.getByText(/Past/));
      expect(screen.getAllByText(/Vimla Jadhav/).length).toBeGreaterThan(0);
    });

    it('applies active styling to selected tab', () => {
      renderComponent();
      const pastTab = screen.getByText(/Past/).closest('button')!;
      expect(pastTab).toHaveClass('border-indigo-600');
      expect(pastTab).toHaveClass('text-indigo-600');
    });

    it('applies inactive styling to non-selected tab', () => {
      renderComponent();
      const upcomingTab = screen.getByText(/Upcoming/).closest('button')!;
      expect(upcomingTab).toHaveClass('border-[#FBE9E9]');
    });
  });

  describe('Search filtering', () => {
    it('filters past appointments by patient name', () => {
      renderComponent();
      fireEvent.change(screen.getByPlaceholderText('Find patient'), {
        target: { value: 'Vimla' },
      });
      expect(screen.getAllByText(/Vimla Jadhav/).length).toBeGreaterThan(0);
      expect(screen.queryByText('Shantaram Rathod')).not.toBeInTheDocument();
    });

    it('is case-insensitive', () => {
      renderComponent();
      fireEvent.change(screen.getByPlaceholderText('Find patient'), {
        target: { value: 'vimla' },
      });
      expect(screen.getAllByText(/Vimla Jadhav/).length).toBeGreaterThan(0);
    });

    it('updates both tab counts based on search', () => {
      renderComponent();
      fireEvent.change(screen.getByPlaceholderText('Find patient'), {
        target: { value: 'Bapu' },
      });
      expect(screen.getByText(/Upcoming \(1\)/)).toBeInTheDocument();
      expect(screen.getByText(/Past \(0\)/)).toBeInTheDocument();
    });

    it('shows empty state when no results match', () => {
      renderComponent();
      fireEvent.change(screen.getByPlaceholderText('Find patient'), {
        target: { value: 'NonExistentXYZ' },
      });
      expect(screen.getByText('No appointments found')).toBeInTheDocument();
    });

    it('shows all results when search is cleared', () => {
      renderComponent();
      const input = screen.getByPlaceholderText('Find patient');
      fireEvent.change(input, { target: { value: 'Vimla' } });
      fireEvent.change(input, { target: { value: '' } });
      expect(screen.getAllByText(/Vimla Jadhav/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Shantaram Rathod/).length).toBeGreaterThan(0);
    });

    it('shows all upcoming results when search is cleared after filtering', () => {
      renderComponent();
      const input = screen.getByPlaceholderText('Find patient');
      fireEvent.change(input, { target: { value: 'Bapu' } });
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.click(screen.getByText(/Upcoming/));
      expect(screen.getAllByText(/Bapu Mali/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Ramesh Patil/).length).toBeGreaterThan(0);
    });
  });

  describe('statusBadge styling', () => {
    it('applies green badge for Completed status (toUpperCase → COMPLETED)', () => {
      renderComponent();
      const badges = screen.getAllByText('Completed');
      expect(badges[0]).toHaveClass('bg-green-50');
      expect(badges[0]).toHaveClass('text-green-600');
      expect(badges[0]).toHaveClass('border-green-100');
    });

    it('applies red badge for PRIORITY status', () => {
      renderComponent();
      fireEvent.click(screen.getByText(/Upcoming/));
      const badges = screen.getAllByText('PRIORITY');
      expect(badges[0]).toHaveClass('bg-red-50');
      expect(badges[0]).toHaveClass('text-red-500');
      expect(badges[0]).toHaveClass('border-red-100');
    });

    it('applies indigo badge for default status (Scheduled)', () => {
      renderComponent();
      fireEvent.click(screen.getByText(/Upcoming/));
      const badges = screen.getAllByText('Scheduled');
      expect(badges[0]).toHaveClass('bg-indigo-50');
      expect(badges[0]).toHaveClass('text-indigo-600');
      expect(badges[0]).toHaveClass('border-indigo-100');
    });
  });

  describe('Navigation', () => {
    it('navigates to appointment detail on mobile card click (past tab)', () => {
      renderComponent();
      // Mobile view cards in space-y-3 div
      const mobileContainer = document.querySelector('.space-y-3');
      expect(mobileContainer).not.toBeNull();
      const cards = mobileContainer!.querySelectorAll('[class*="cursor-pointer"]');
      expect(cards.length).toBeGreaterThan(0);
      fireEvent.click(cards[0]);
      expect(mockNavigate).toHaveBeenCalledWith('/my-appointments/2');
    });

    it('navigates to appointment detail on desktop row click (past tab)', () => {
      renderComponent();
      // Desktop rows have unique h-[56px] class
      const desktopRows = document.querySelectorAll('[class*="h-[56px]"]');
      expect(desktopRows.length).toBeGreaterThan(0);
      fireEvent.click(desktopRows[0]);
      expect(mockNavigate).toHaveBeenCalledWith('/my-appointments/2');
    });

    it('navigates to correct appointment on upcoming tab (mobile)', () => {
      renderComponent();
      fireEvent.click(screen.getByText(/Upcoming/));
      const mobileContainer = document.querySelector('.space-y-3');
      expect(mobileContainer).not.toBeNull();
      const cards = mobileContainer!.querySelectorAll('[class*="cursor-pointer"]');
      expect(cards.length).toBeGreaterThan(0);
      fireEvent.click(cards[0]);
      expect(mockNavigate).toHaveBeenCalledWith('/my-appointments/1');
    });

    it('navigates to correct appointment on upcoming tab (desktop)', () => {
      renderComponent();
      fireEvent.click(screen.getByText(/Upcoming/));
      const desktopRows = document.querySelectorAll('[class*="h-[56px]"]');
      expect(desktopRows.length).toBeGreaterThan(0);
      fireEvent.click(desktopRows[0]);
      expect(mockNavigate).toHaveBeenCalledWith('/my-appointments/1');
    });
  });

  describe('timeUntil display', () => {
    it('shows timeUntil text for upcoming appointments with values', () => {
      renderComponent();
      fireEvent.click(screen.getByText(/Upcoming/));
      expect(
        screen.getAllByText('in 4 Hours 54 min at 10:00 am').length
      ).toBeGreaterThan(0);
    });

    it('shows timeUntil for Ramesh Patil', () => {
      renderComponent();
      fireEvent.click(screen.getByText(/Upcoming/));
      expect(
        screen.getAllByText('in 2 Days at 10:30 am').length
      ).toBeGreaterThan(0);
    });

    it('shows clock icon for upcoming appointments with timeUntil', () => {
      renderComponent();
      fireEvent.click(screen.getByText(/Upcoming/));
      const clockImgs = document.querySelectorAll('img[alt="clock"]');
      expect(clockImgs.length).toBeGreaterThan(0);
    });

    it('does not show clock icon for past appointments with empty timeUntil', () => {
      renderComponent();
      // In past tab, all timeUntil are empty strings so no clock icon
      const clockImgs = document.querySelectorAll('img[alt="clock"]');
      expect(clockImgs.length).toBe(0);
    });
  });

  describe('Data display', () => {
    it('renders patient name with gender in mobile view', () => {
      renderComponent();
      expect(screen.getAllByText(/Vimla Jadhav/).length).toBeGreaterThan(0);
    });

    it('renders dateTime column', () => {
      renderComponent();
      expect(
        screen.getAllByText('24 May 2025, at 3:15 pm').length
      ).toBeGreaterThan(0);
    });

    it('renders clinic column in desktop view', () => {
      renderComponent();
      expect(screen.getAllByText('TM Clinic 2').length).toBeGreaterThan(0);
    });

    it('renders symptom column', () => {
      renderComponent();
      expect(screen.getAllByText('Cough').length).toBeGreaterThan(0);
    });

    it('renders age column', () => {
      renderComponent();
      expect(screen.getAllByText('75y 2m').length).toBeGreaterThan(0);
    });

    it('renders patient photo images', () => {
      renderComponent();
      const patientImgs = document.querySelectorAll('img[alt="patient"]');
      expect(patientImgs.length).toBeGreaterThan(0);
    });

    it('renders right angle icon for each appointment', () => {
      renderComponent();
      const angleIcons = document.querySelectorAll('img[alt=">"]');
      expect(angleIcons.length).toBeGreaterThan(0);
    });
  });
});
