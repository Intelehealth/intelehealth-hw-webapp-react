import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AppointmentVisitComponent from '../../../modules/appointment-visit/appointment-visit.component';

vi.mock('../../../modules/appointment-visit/schedule-appointment.component', () => ({
  default: () => (
    <div data-testid="schedule-appointment">Schedule Appointment</div>
  ),
}));

describe('AppointmentVisitComponent', () => {
  it('renders without crashing', () => {
    expect(() => render(<AppointmentVisitComponent />)).not.toThrow();
  });

  it('renders the AppointmentScheduleComponent inside', () => {
    render(<AppointmentVisitComponent />);
    expect(screen.getByTestId('schedule-appointment')).toBeInTheDocument();
  });

  it('renders a wrapper div', () => {
    const { container } = render(<AppointmentVisitComponent />);
    expect(container.querySelector('div')).toBeInTheDocument();
  });
});
