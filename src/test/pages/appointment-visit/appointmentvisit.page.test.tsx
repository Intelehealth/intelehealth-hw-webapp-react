import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AppointmentVisitPage from '../../../pages/appointment-visit/appointmentvisit.page';

vi.mock(
  '../../../modules/appointmentVisit/appointmentVisit.component',
  () => ({
    default: () => (
      <div data-testid="appointment-visit-component">
        AppointmentVisitComponent
      </div>
    ),
  })
);

describe('AppointmentVisitPage', () => {
  it('renders without crashing', () => {
    expect(() => render(<AppointmentVisitPage />)).not.toThrow();
  });

  it('renders AppointmentVisitComponent', () => {
    render(<AppointmentVisitPage />);
    expect(
      screen.getByTestId('appointment-visit-component')
    ).toBeInTheDocument();
  });
});
