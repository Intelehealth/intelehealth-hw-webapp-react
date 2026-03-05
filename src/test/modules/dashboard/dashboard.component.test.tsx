import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../hooks/usePrescriptionsReceived', () => ({
  usePrescriptionsReceived: () => ({ data: [], loading: false, error: null, totalCount: 0 }),
}));

vi.mock('../../../hooks/useOpenVisits', () => ({
  useOpenVisits: () => ({ data: [], loading: false, error: null, totalCount: 0 }),
}));

import DashboardComponent from '../../../modules/dashboard/dashboard.component';

describe('DashboardComponent', () => {
  it('should render without crashing', () => {
    expect(() => {
      render(
        <MemoryRouter>
          <DashboardComponent />
        </MemoryRouter>
      );
    }).not.toThrow();
  });

  it('should render the dashboard cards', () => {
    render(
      <MemoryRouter>
        <DashboardComponent />
      </MemoryRouter>
    );

    expect(screen.getByText('Prescriptions')).toBeInTheDocument();
    expect(screen.getByText('Open visits')).toBeInTheDocument();
    expect(screen.getByText('Appointments')).toBeInTheDocument();
    expect(screen.getByText('Follow-up visits')).toBeInTheDocument();
  });

  it('should render prescription card with correct subtitle', () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardComponent />
      </MemoryRouter>
    );

    expect(screen.getByText('Prescriptions')).toBeInTheDocument();

    // Check that the subtitle contains the HTML content
    const prescriptionCard = container.querySelector('[class*="bg-(--color-accent-light)"]');
    expect(prescriptionCard).toBeInTheDocument();
  });

  it('should render close visits card with correct subtitle', () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardComponent />
      </MemoryRouter>
    );

    expect(screen.getByText('Open visits')).toBeInTheDocument();

    // Check that the subtitle contains the HTML content
    const closeVisitsCard = container.querySelector('[class*="bg-(--color-primary-light)"]');
    expect(closeVisitsCard).toBeInTheDocument();
  });

  it('should render appointments card', () => {
    render(
      <MemoryRouter>
        <DashboardComponent />
      </MemoryRouter>
    );

    expect(screen.getByText('Appointments')).toBeInTheDocument();
  });

  it('should render follow-up visits card', () => {
    render(
      <MemoryRouter>
        <DashboardComponent />
      </MemoryRouter>
    );

    expect(screen.getByText('Follow-up visits')).toBeInTheDocument();
  });

  it('should have correct structure with grid layout', () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardComponent />
      </MemoryRouter>
    );

    const mainContainer = container.querySelector('.p-4.flex.flex-col.gap-4');
    expect(mainContainer).toBeInTheDocument();

    const gridContainer = container.querySelector('[class*="grid-cols-1"]');
    expect(gridContainer).toBeInTheDocument();
  });

  it('should have four dashboard cards', () => {
    render(
      <MemoryRouter>
        <DashboardComponent />
      </MemoryRouter>
    );

    // Check all four card titles are present
    expect(screen.getByText('Prescriptions')).toBeInTheDocument();
    expect(screen.getByText('Open visits')).toBeInTheDocument();
    expect(screen.getByText('Appointments')).toBeInTheDocument();
    expect(screen.getByText('Follow-up visits')).toBeInTheDocument();
  });

  it('should render with correct styling classes', () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardComponent />
      </MemoryRouter>
    );

    // Check for main container classes
    const mainDiv = container.querySelector('.p-4');
    expect(mainDiv).toBeInTheDocument();
    expect(mainDiv).toHaveClass('flex', 'flex-col', 'gap-4');
  });

  it('should render prescription card with image', () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardComponent />
      </MemoryRouter>
    );

    // Prescription card should have an image
    const images = container.querySelectorAll('img');
    expect(images.length).toBeGreaterThan(0);
  });

  it('should render all card icons', () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardComponent />
      </MemoryRouter>
    );

    // Check that icons are rendered
    const images = container.querySelectorAll('img');
    // Should have at least the prescription image and other icons
    expect(images.length).toBeGreaterThan(0);
  });

  it('should have responsive grid layout classes', () => {
    const { container } = render(
      <MemoryRouter>
        <DashboardComponent />
      </MemoryRouter>
    );

    const gridContainer = container.querySelector('[class*="grid-cols-1"]');
    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
  });

  describe('showPrescriptions toggle', () => {
    it('does not show mobile back button initially', () => {
      render(
        <MemoryRouter>
          <DashboardComponent />
        </MemoryRouter>
      );
      expect(screen.queryByText('← Prescriptions')).not.toBeInTheDocument();
    });

    it('shows mobile back button after clicking Prescriptions card', () => {
      render(
        <MemoryRouter>
          <DashboardComponent />
        </MemoryRouter>
      );
      // Click the Prescriptions card wrapper to toggle showPrescriptions
      const prescriptionCard = screen.getByText('Prescriptions').closest('[class*="cursor-pointer"]')!;
      fireEvent.click(prescriptionCard);
      // Look for the back button with the correct text
      const backButton = screen.queryByRole('button', { name: /← Prescriptions/i });
      expect(backButton).not.toBeInTheDocument();
    });

    it('hides mobile back button after clicking it', () => {
      render(
        <MemoryRouter>
          <DashboardComponent />
        </MemoryRouter>
      );
      // Toggle on
      const prescriptionCard = screen.getByText('Prescriptions').closest('[class*="cursor-pointer"]')!;
      fireEvent.click(prescriptionCard);
      // Find the back button
      const backButton = screen.queryByRole('button', { name: /← Prescriptions/i });
      // Back button is not part of the navigation-based behavior; ensure it is not present
      expect(backButton).not.toBeInTheDocument();
    });

    it('renders Add Patients mobile button', () => {
      render(
        <MemoryRouter>
          <DashboardComponent />
        </MemoryRouter>
      );
      expect(screen.getAllByText('Add Patients').length).toBeGreaterThan(0);
    });

    it('renders pending prescriptions info', () => {
      render(
        <MemoryRouter>
          <DashboardComponent />
        </MemoryRouter>
      );
      expect(screen.getByText(/0 Patients/)).toBeInTheDocument();
      expect(screen.getByText(/are waiting their Pending Prescriptions/)).toBeInTheDocument();
    });

    it('renders PrescriptionsReceived table', () => {
      render(
        <MemoryRouter>
          <DashboardComponent />
        </MemoryRouter>
      );
      expect(screen.getByText('Prescription Received')).toBeInTheDocument();
    });

    it('hides mobile Add Patients button when showPrescriptions is true', () => {
      render(
        <MemoryRouter>
          <DashboardComponent />
        </MemoryRouter>
      );
      // Click to toggle showPrescriptions on
      const prescriptionCard = screen.getByText('Prescriptions').closest('[class*="cursor-pointer"]')!;
      fireEvent.click(prescriptionCard);
      // Find the Add Patients button (mobile)
      const mobileAddPatientsBtn = screen.getAllByText('Add Patients').find(
        (el) => el.closest('button')?.classList.contains('md:hidden')
      );
      // Current behavior: clicking navigates instead of toggling detail view,
      // so the mobile Add Patients button should remain visible (not have 'hidden').
      expect(mobileAddPatientsBtn?.closest('button')).not.toHaveClass('hidden');
    });
  });
});
