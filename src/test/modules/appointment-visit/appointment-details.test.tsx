import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppointmentDetails from '../../../modules/appointment-visit/appointment-details.component';

const mockUseParams = vi.fn(() => ({ id: '1' }));
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => mockUseParams(),
    useNavigate: () => mockNavigate,
  };
});

const renderComponent = () => render(<AppointmentDetails />);

describe('AppointmentDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ id: '1' });
  });

  describe('Initial render (upcoming tab, id=1)', () => {
    it('renders without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('renders My appointments header', () => {
      renderComponent();
      expect(screen.getByText('My appointments')).toBeInTheDocument();
    });

    it('renders header icon', () => {
      renderComponent();
      expect(screen.getByAltText('appointments')).toBeInTheDocument();
    });

    it('renders Upcoming and Past tab buttons with counts', () => {
      renderComponent();
      expect(screen.getByText(/Upcoming \(2\)/)).toBeInTheDocument();
      expect(screen.getByText(/Past \(2\)/)).toBeInTheDocument();
    });

    it('renders patient name for id=1 (Bapu Mali)', () => {
      renderComponent();
      expect(screen.getByText('Bapu Mali')).toBeInTheDocument();
    });

    it('renders patient visit ID in info section', () => {
      renderComponent();
      expect(screen.getAllByText(/987654JK/).length).toBeGreaterThan(0);
    });

    it('renders symptom', () => {
      renderComponent();
      expect(screen.getByText('Headache and body pain')).toBeInTheDocument();
    });

    it('renders appointment date and time', () => {
      renderComponent();
      expect(screen.getByText('10 Oct 2025')).toBeInTheDocument();
      expect(screen.getByText('10:00 am')).toBeInTheDocument();
    });

    it('shows "Starts in 2 minutes" on upcoming tab', () => {
      renderComponent();
      expect(screen.getByText('Starts in 2 minutes')).toBeInTheDocument();
    });

    it('renders Cancel and Reschedule buttons on upcoming tab', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reschedule' })).toBeInTheDocument();
    });

    it('renders doctor speciality label', () => {
      renderComponent();
      expect(screen.getByText("Doctor's speciality")).toBeInTheDocument();
    });

    it('renders doctor speciality value', () => {
      renderComponent();
      expect(screen.getAllByText('General physician').length).toBeGreaterThan(0);
    });

    it('renders Visit summary section', () => {
      renderComponent();
      expect(screen.getByText('Visit summary')).toBeInTheDocument();
    });

    it('renders patient photo', () => {
      renderComponent();
      expect(screen.getByAltText('patient')).toBeInTheDocument();
    });

    it('renders back arrow icon', () => {
      renderComponent();
      expect(screen.getByAltText('back')).toBeInTheDocument();
    });

    it('renders edit icon', () => {
      renderComponent();
      expect(screen.getByAltText('edit')).toBeInTheDocument();
    });

    it('renders phone and WhatsApp icons', () => {
      const { container } = renderComponent();
      const images = container.querySelectorAll('img');
      expect(images.length).toBeGreaterThan(5);
    });

    it('renders Visit ID in appointment card', () => {
      renderComponent();
      expect(screen.getByText(/Visit ID: 987654JK/)).toBeInTheDocument();
    });
  });

  describe('getStatusStyle', () => {
    it('applies red badge for PRIORITY status (id=1, upcoming)', () => {
      mockUseParams.mockReturnValue({ id: '1' });
      renderComponent();
      const badge = screen.getByText('PRIORITY');
      expect(badge).toHaveClass('bg-red-100');
      expect(badge).toHaveClass('text-red-600');
    });

    it('applies green badge for COMPLETED status (id=2, past)', () => {
      mockUseParams.mockReturnValue({ id: '2' });
      renderComponent();
      fireEvent.click(screen.getByText(/Past/));
      const badge = screen.getByText('COMPLETED');
      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-600');
    });

    it('applies gray badge for Scheduled status (id=4, upcoming - default case)', () => {
      mockUseParams.mockReturnValue({ id: '4' });
      renderComponent();
      const badge = screen.getByText('Scheduled');
      expect(badge).toHaveClass('bg-gray-100');
      expect(badge).toHaveClass('text-gray-600');
    });

    it('applies gray badge for Completed (lowercase, id=3 - default case)', () => {
      mockUseParams.mockReturnValue({ id: '3' });
      renderComponent();
      fireEvent.click(screen.getByText(/Past/));
      const badge = screen.getByText('Completed');
      expect(badge).toHaveClass('bg-gray-100');
      expect(badge).toHaveClass('text-gray-600');
    });
  });

  describe('Tab switching', () => {
    it('switches to past tab and hides action buttons', () => {
      renderComponent();
      fireEvent.click(screen.getByText(/Past/));
      expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Reschedule' })).not.toBeInTheDocument();
    });

    it('hides "Starts in 2 minutes" on past tab', () => {
      renderComponent();
      fireEvent.click(screen.getByText(/Past/));
      expect(screen.queryByText('Starts in 2 minutes')).not.toBeInTheDocument();
    });

    it('shows past appointment data after switching to past tab', () => {
      mockUseParams.mockReturnValue({ id: '2' });
      renderComponent();
      fireEvent.click(screen.getByText(/Past/));
      expect(screen.getByText('Vimla Jadhav')).toBeInTheDocument();
      expect(screen.getByText('Cough')).toBeInTheDocument();
    });

    it('switches back to upcoming tab and shows buttons again', () => {
      renderComponent();
      fireEvent.click(screen.getByText(/Past/));
      fireEvent.click(screen.getByText(/Upcoming/));
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reschedule' })).toBeInTheDocument();
    });

    it('applies active styling to selected tab', () => {
      renderComponent();
      const upcomingTab = screen.getByText(/Upcoming/).closest('button')!;
      expect(upcomingTab).toHaveClass('border-indigo-600');
    });

    it('applies inactive styling to non-selected tab', () => {
      renderComponent();
      const pastTab = screen.getByText(/Past/).closest('button')!;
      expect(pastTab).toHaveClass('border-[#FBE9E9]');
    });

    it('shows "Starts in 2 minutes" when switching back to upcoming', () => {
      renderComponent();
      fireEvent.click(screen.getByText(/Past/));
      fireEvent.click(screen.getByText(/Upcoming/));
      expect(screen.getByText('Starts in 2 minutes')).toBeInTheDocument();
    });
  });

  describe('Appointment lookup', () => {
    it('displays the appointment matching the id param', () => {
      mockUseParams.mockReturnValue({ id: '4' });
      renderComponent();
      expect(screen.getByText('Ramesh Patil')).toBeInTheDocument();
      expect(screen.getByText('Headache')).toBeInTheDocument();
    });

    it('falls back to first appointment when id does not match', () => {
      mockUseParams.mockReturnValue({ id: '9999' });
      renderComponent();
      expect(screen.getByText('Bapu Mali')).toBeInTheDocument();
    });

    it('renders correctly when id is empty string (fallback)', () => {
      mockUseParams.mockReturnValue({ id: '' });
      renderComponent();
      expect(screen.getByText('Bapu Mali')).toBeInTheDocument();
    });

    it('falls back to first past appointment when switching tabs with non-matching id', () => {
      mockUseParams.mockReturnValue({ id: '9999' });
      renderComponent();
      fireEvent.click(screen.getByText(/Past/));
      expect(screen.getByText('Vimla Jadhav')).toBeInTheDocument();
    });
  });

  describe('Patient info section', () => {
    it('renders patient gender and age', () => {
      renderComponent();
      // "M 73" in the gender/age span
      const genderAge = screen.getByText((_, element) => {
        return element?.tagName === 'SPAN' && element.textContent?.trim() === 'M 73';
      });
      expect(genderAge).toBeInTheDocument();
    });

    it('renders patient ID with prefix', () => {
      renderComponent();
      expect(screen.getByText(/ID - 987654JK/)).toBeInTheDocument();
    });
  });

  describe('Appointment card details', () => {
    it('renders calendar icon for date', () => {
      const { container } = renderComponent();
      const imgs = container.querySelectorAll('img');
      // Multiple icons present
      expect(imgs.length).toBeGreaterThan(5);
    });

    it('renders horizontal rule divider', () => {
      const { container } = renderComponent();
      const hrs = container.querySelectorAll('hr');
      expect(hrs.length).toBeGreaterThan(0);
    });

    it('renders visit summary with angle icon', () => {
      renderComponent();
      const angleIcons = document.querySelectorAll('img[alt=">"]');
      expect(angleIcons.length).toBeGreaterThan(0);
    });
  });

  describe('Back navigation', () => {
    it('clicking back arrow navigates to previous page', () => {
      renderComponent();
      const backIcon = screen.getByAltText('back');
      fireEvent.click(backIcon);
      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('Tab icons', () => {
    it('renders patient received icons in tab buttons', () => {
      renderComponent();
      const receivedIcons = screen.getAllByAltText('received');
      expect(receivedIcons.length).toBe(2);
    });
  });
});
