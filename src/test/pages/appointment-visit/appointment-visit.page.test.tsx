import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AppointmentVisitPage from '../../../pages/appointment-visit/appointment-visit.page';
import { BreadcrumbProvider } from '../../../context/BreadcrumbContext';

vi.mock(
  '../../../modules/appointment-visit/appointment-visit.component',
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
    expect(() => render(<BreadcrumbProvider><AppointmentVisitPage /></BreadcrumbProvider>)).not.toThrow();
  });

  it('renders AppointmentVisitComponent', () => {
    render(<BreadcrumbProvider><AppointmentVisitPage /></BreadcrumbProvider>);
    expect(
      screen.getByTestId('appointment-visit-component')
    ).toBeInTheDocument();
  });
});
