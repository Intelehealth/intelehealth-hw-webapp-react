import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../hooks/usePrescriptionsReceived', () => ({
  usePrescriptionsReceived: () => ({ data: [], loading: false, error: null, totalCount: 0 }),
}));

vi.mock('../../../hooks/usePrescriptionsPending', () => ({
  usePrescriptionsPending: () => ({ data: [], loading: false, error: null, totalCount: 0 }),
}));

import DashboardComponent from '../../../modules/dashboard/dashboard.component';

describe('DashboardComponent (showPrescriptions)', () => {
  it('renders back button and hides mobile Add Patients when initialShowPrescriptions is true', () => {
    render(
      <MemoryRouter>
        <DashboardComponent initialShowPrescriptions={true} />
      </MemoryRouter>
    );

    // Back button should be visible on mobile branch
    const backButton = screen.getByText(/← Prescriptions/i);
    expect(backButton).toBeInTheDocument();

    // Mobile Add Patients top button should be hidden (class contains 'hidden')
    const addPatientButtons = screen.getAllByText('Add Patients');
    const mobileBtn = addPatientButtons.find((el) => el.closest('button')?.classList.contains('md:hidden'));
    expect(mobileBtn?.closest('button')).toHaveClass('hidden');

    // Clicking back button should hide back button again
    fireEvent.click(backButton);
    expect(screen.queryByText(/← Prescriptions/i)).not.toBeInTheDocument();
  });
});
