import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AppointmentListPage from '../../../pages/appointment-list/appointment-list.page';
import { BreadcrumbProvider } from '../../../context/BreadcrumbContext';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('AppointmentListPage', () => {
  it('renders without crashing', () => {
    expect(() => render(<BreadcrumbProvider><AppointmentListPage /></BreadcrumbProvider>)).not.toThrow();
  });

  it('renders the AppointmentListComponent inside', () => {
    render(<BreadcrumbProvider><AppointmentListPage /></BreadcrumbProvider>);
    expect(screen.getByText('Appointment List')).toBeInTheDocument();
  });

  it('passes initialRowCount=10 to AppointmentListComponent', () => {
    const { container } = render(<BreadcrumbProvider><AppointmentListPage /></BreadcrumbProvider>);
    expect(container.querySelector('.p-4')).toBeInTheDocument();
  });
});
