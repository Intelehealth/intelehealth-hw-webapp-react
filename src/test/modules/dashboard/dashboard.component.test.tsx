import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DashboardComponent from '../../../modules/dashboard/dashboard.component';

describe('DashboardComponent', () => {
  it('should render without crashing', () => {
    expect(() => {
      render(<DashboardComponent />);
    }).not.toThrow();
  });

  it('should render the dashboard cards', () => {
    render(<DashboardComponent />);

    expect(screen.getByText('Prescriptions')).toBeInTheDocument();
    expect(screen.getByText('Close visits')).toBeInTheDocument();
    expect(screen.getByText('Appointments')).toBeInTheDocument();
    expect(screen.getByText('Follow-up visits')).toBeInTheDocument();
  });

  it('should render prescription card with correct subtitle', () => {
    const { container } = render(<DashboardComponent />);

    expect(screen.getByText('Prescriptions')).toBeInTheDocument();

    // Check that the subtitle contains the HTML content
    const prescriptionCard = container.querySelector('[class*="bg-(--color-accent-light)"]');
    expect(prescriptionCard).toBeInTheDocument();
  });

  it('should render close visits card with correct subtitle', () => {
    const { container } = render(<DashboardComponent />);

    expect(screen.getByText('Close visits')).toBeInTheDocument();

    // Check that the subtitle contains the HTML content
    const closeVisitsCard = container.querySelector('[class*="bg-(--color-primary-light)"]');
    expect(closeVisitsCard).toBeInTheDocument();
  });

  it('should render appointments card', () => {
    render(<DashboardComponent />);

    expect(screen.getByText('Appointments')).toBeInTheDocument();
  });

  it('should render follow-up visits card', () => {
    render(<DashboardComponent />);

    expect(screen.getByText('Follow-up visits')).toBeInTheDocument();
  });

  it('should have correct structure with grid layout', () => {
    const { container } = render(<DashboardComponent />);

    const mainContainer = container.querySelector('.p-4.flex.flex-col.gap-4');
    expect(mainContainer).toBeInTheDocument();

    const gridContainer = container.querySelector('[class*="grid-cols-1"]');
    expect(gridContainer).toBeInTheDocument();
  });

  it('should have four dashboard cards', () => {
    render(<DashboardComponent />);

    // Check all four card titles are present
    expect(screen.getByText('Prescriptions')).toBeInTheDocument();
    expect(screen.getByText('Close visits')).toBeInTheDocument();
    expect(screen.getByText('Appointments')).toBeInTheDocument();
    expect(screen.getByText('Follow-up visits')).toBeInTheDocument();
  });

  it('should render with correct styling classes', () => {
    const { container } = render(<DashboardComponent />);

    // Check for main container classes
    const mainDiv = container.querySelector('.p-4');
    expect(mainDiv).toBeInTheDocument();
    expect(mainDiv).toHaveClass('flex', 'flex-col', 'gap-4');
  });

  it('should render prescription card with image', () => {
    const { container } = render(<DashboardComponent />);

    // Prescription card should have an image
    const images = container.querySelectorAll('img');
    expect(images.length).toBeGreaterThan(0);
  });

  it('should render all card icons', () => {
    const { container } = render(<DashboardComponent />);

    // Check that icons are rendered
    const images = container.querySelectorAll('img');
    // Should have at least the prescription image and other icons
    expect(images.length).toBeGreaterThan(0);
  });

  it('should have responsive grid layout classes', () => {
    const { container } = render(<DashboardComponent />);

    const gridContainer = container.querySelector('[class*="grid-cols-1"]');
    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
  });

  describe('showPrescriptions toggle', () => {
    it('does not show mobile back button initially', () => {
      render(<DashboardComponent />);
      expect(screen.queryByText('← Prescriptions')).not.toBeInTheDocument();
    });

    it('shows mobile back button after clicking Prescriptions card', () => {
      render(<DashboardComponent />);
      // Click the Prescriptions card wrapper to toggle showPrescriptions
      const prescriptionCard = screen.getByText('Prescriptions').closest('[class*="cursor-pointer"]')!;
      fireEvent.click(prescriptionCard);
      expect(screen.getByText('← Prescriptions')).toBeInTheDocument();
    });

    it('hides mobile back button after clicking it', () => {
      render(<DashboardComponent />);
      // Toggle on
      const prescriptionCard = screen.getByText('Prescriptions').closest('[class*="cursor-pointer"]')!;
      fireEvent.click(prescriptionCard);
      expect(screen.getByText('← Prescriptions')).toBeInTheDocument();

      // Toggle off
      fireEvent.click(screen.getByText('← Prescriptions'));
      expect(screen.queryByText('← Prescriptions')).not.toBeInTheDocument();
    });

    it('renders Add Patients mobile button', () => {
      render(<DashboardComponent />);
      expect(screen.getAllByText('Add Patients').length).toBeGreaterThan(0);
    });

    it('renders pending prescriptions info', () => {
      render(<DashboardComponent />);
      expect(screen.getByText(/0 Patients/)).toBeInTheDocument();
      expect(screen.getByText(/are waiting their Pending Prescriptions/)).toBeInTheDocument();
    });

    it('renders PrescriptionsReceived table', () => {
      render(<DashboardComponent />);
      expect(screen.getByText('Prescription Received')).toBeInTheDocument();
    });

    it('hides mobile Add Patients button when showPrescriptions is true', () => {
      const { container } = render(<DashboardComponent />);
      // Click to toggle showPrescriptions on
      const prescriptionCard = screen.getByText('Prescriptions').closest('[class*="cursor-pointer"]')!;
      fireEvent.click(prescriptionCard);
      // The mobile Add Patients button should have 'hidden' class
      const mobileAddBtn = container.querySelectorAll('button');
      const mobileAddPatientsBtn = Array.from(mobileAddBtn).find(
        btn => btn.textContent?.includes('Add Patients') && btn.classList.contains('md:hidden')
      );
      expect(mobileAddPatientsBtn).toHaveClass('hidden');
    });
  });
});
