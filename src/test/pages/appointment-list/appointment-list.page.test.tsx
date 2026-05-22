import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AppointmentListPage from '../../../pages/appointment-list/appointment-list.page';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('AppointmentListPage', () => {
  it('renders without crashing', () => {
    expect(() => render(<AppointmentListPage />)).not.toThrow();
  });

  it('renders the AppointmentListComponent inside', () => {
    render(<AppointmentListPage />);
    expect(screen.getByText('Appointment List')).toBeInTheDocument();
  });

  it('passes initialRowCount=10 to AppointmentListComponent', () => {
    const { container } = render(<AppointmentListPage />);
    expect(container.querySelector('.p-4')).toBeInTheDocument();
  });
});
