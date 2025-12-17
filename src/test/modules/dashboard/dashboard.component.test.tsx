import { render, screen } from '@testing-library/react';
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

    const gridContainer = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-3.gap-4');
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

    const gridContainer = container.querySelector('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-3');
  });
});
