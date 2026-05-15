import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppointmentListComponent } from '../../../modules/dashboard/appointment-list.component';
import * as useAppointmentListModule from '../../../hooks/useAppointmentList';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderComponent = (props?: { initialRowCount?: number }) =>
  render(<AppointmentListComponent {...props} />);

describe('AppointmentListComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial render', () => {
    it('renders without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('renders Appointment List header', () => {
      renderComponent();
      expect(screen.getByText('Appointment List')).toBeInTheDocument();
    });

    it('renders search input with placeholder', () => {
      renderComponent();
      expect(screen.getByPlaceholderText('Find patient')).toBeInTheDocument();
    });

    it('renders filter icon', () => {
      renderComponent();
      expect(screen.getByAltText('filter')).toBeInTheDocument();
    });

    it('renders search icon', () => {
      renderComponent();
      expect(screen.getByAltText('search')).toBeInTheDocument();
    });

    it('renders upcoming and past tab buttons with counts', () => {
      renderComponent();
      expect(screen.getByText(/Upcoming \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/Past \(2\)/)).toBeInTheDocument();
    });

    it('defaults to upcoming tab', () => {
      renderComponent();
      expect(screen.getAllByText(/Bapu Mali/).length).toBeGreaterThan(0);
    });
  });

  describe('Tab switching', () => {
    it('switches to past tab and shows past appointments', () => {
      renderComponent();
      fireEvent.click(screen.getByText(/Past/));
      expect(screen.getAllByText(/Vimla Jadhav/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Shantaram Rathod/).length).toBeGreaterThan(0);
    });

    it('hides upcoming appointments when on past tab', () => {
      renderComponent();
      fireEvent.click(screen.getByText(/Past/));
      expect(screen.queryByText('Bapu Mali')).not.toBeInTheDocument();
    });

    it('switches back to upcoming tab', () => {
      renderComponent();
      fireEvent.click(screen.getByText(/Past/));
      fireEvent.click(screen.getByText(/Upcoming/));
      expect(screen.getAllByText(/Bapu Mali/).length).toBeGreaterThan(0);
    });

    it('applies active styling to selected tab', () => {
      renderComponent();
      const upcomingTab = screen.getByText(/Upcoming/).closest('button')!;
      expect(upcomingTab).toHaveClass('border-indigo-600');
      expect(upcomingTab).toHaveClass('text-indigo-600');
    });

    it('applies inactive styling to non-selected tab', () => {
      renderComponent();
      const pastTab = screen.getByText(/Past/).closest('button')!;
      expect(pastTab).toHaveClass('border-transparent');
    });
  });

  describe('Search filtering', () => {
    it('filters upcoming appointments by patient name', () => {
      renderComponent();
      fireEvent.change(screen.getByPlaceholderText('Find patient'), {
        target: { value: 'Bapu' },
      });
      expect(screen.getAllByText(/Bapu Mali/).length).toBeGreaterThan(0);
      expect(screen.queryByText('Ramesh Patil')).not.toBeInTheDocument();
    });

    it('is case-insensitive', () => {
      renderComponent();
      fireEvent.change(screen.getByPlaceholderText('Find patient'), {
        target: { value: 'bapu' },
      });
      expect(screen.getAllByText(/Bapu Mali/).length).toBeGreaterThan(0);
    });

    it('shows no appointments found when search has no match', () => {
      renderComponent();
      fireEvent.change(screen.getByPlaceholderText('Find patient'), {
        target: { value: 'NonExistentXYZ' },
      });
      expect(screen.getByText('No appointments found.')).toBeInTheDocument();
    });

    it('shows all results when search is cleared', () => {
      renderComponent();
      const input = screen.getByPlaceholderText('Find patient');
      fireEvent.change(input, { target: { value: 'Bapu' } });
      fireEvent.change(input, { target: { value: '' } });
      expect(screen.getAllByText(/Bapu Mali/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Ramesh Patil/).length).toBeGreaterThan(0);
    });
  });

  describe('statusBadge styling', () => {
    it('applies red badge for PRIORITY status', () => {
      renderComponent();
      const badges = screen.getAllByText('PRIORITY');
      expect(badges[0]).toHaveClass('bg-red-50');
      expect(badges[0]).toHaveClass('text-red-500');
      expect(badges[0]).toHaveClass('border-red-100');
    });

    it('applies indigo badge for Scheduled status', () => {
      renderComponent();
      const badges = screen.getAllByText('Scheduled');
      expect(badges[0]).toHaveClass('bg-indigo-50');
      expect(badges[0]).toHaveClass('text-indigo-600');
      expect(badges[0]).toHaveClass('border-indigo-100');
    });

    it('applies green badge for Completed status on past tab', () => {
      renderComponent();
      fireEvent.click(screen.getByText(/Past/));
      const badges = screen.getAllByText('Completed');
      expect(badges[0]).toHaveClass('bg-green-50');
      expect(badges[0]).toHaveClass('text-green-600');
      expect(badges[0]).toHaveClass('border-green-100');
    });
  });

  describe('Navigation', () => {
    it('navigates to appointment detail on row click', () => {
      renderComponent();
      const rows = document.querySelectorAll('[class*="cursor-pointer"]');
      const clickableRow = Array.from(rows).find(r =>
        r.textContent?.includes('Bapu Mali')
      );
      expect(clickableRow).toBeTruthy();
      fireEvent.click(clickableRow!);
      expect(mockNavigate).toHaveBeenCalledWith('/my-appointments/1');
    });

    it('navigates to correct appointment on past tab', () => {
      renderComponent();
      fireEvent.click(screen.getByText(/Past/));
      const rows = document.querySelectorAll('[class*="cursor-pointer"]');
      const clickableRow = Array.from(rows).find(r =>
        r.textContent?.includes('Vimla Jadhav')
      );
      expect(clickableRow).toBeTruthy();
      fireEvent.click(clickableRow!);
      expect(mockNavigate).toHaveBeenCalledWith('/my-appointments/2');
    });
  });

  describe('Column rendering', () => {
    it('renders patient name with gender, age, and openMrsId', () => {
      renderComponent();
      expect(screen.getAllByText(/M \| 73y \| 100GL-1/).length).toBeGreaterThan(
        0
      );
    });

    it('renders dateTime column', () => {
      renderComponent();
      expect(
        screen.getAllByText('10 Oct 2025, at 10:00 am').length
      ).toBeGreaterThan(0);
    });

    it('renders speciality column', () => {
      renderComponent();
      expect(
        screen.getAllByText('General physician').length
      ).toBeGreaterThan(0);
    });

    it('renders doctor column', () => {
      renderComponent();
      expect(screen.getAllByText('Dr. Sharma').length).toBeGreaterThan(0);
    });

    it('renders symptom/reason column', () => {
      renderComponent();
      expect(
        screen.getAllByText('Headache and body pain').length
      ).toBeGreaterThan(0);
    });

    it('renders patient image icons', () => {
      renderComponent();
      const imgs = document.querySelectorAll('img[src]');
      expect(imgs.length).toBeGreaterThan(0);
    });
  });

  describe('initialRowCount prop', () => {
    it('respects initialRowCount when provided', () => {
      renderComponent({ initialRowCount: 1 });
      const rows = document.querySelectorAll('[class*="rounded-xl border"]');
      expect(rows.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Loading state', () => {
    it('shows loading text when loading is true', () => {
      vi.spyOn(useAppointmentListModule, 'useAppointmentList').mockReturnValue({
        data: [],
        loading: true,
        error: null,
      });
      renderComponent();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    it('shows error message when error is present', () => {
      vi.spyOn(useAppointmentListModule, 'useAppointmentList').mockReturnValue({
        data: [],
        loading: false,
        error: 'Failed to load appointments',
      });
      renderComponent();
      expect(
        screen.getByText('Failed to load appointments')
      ).toBeInTheDocument();
    });
  });
});
