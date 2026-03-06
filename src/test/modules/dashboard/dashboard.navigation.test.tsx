import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../hooks/usePrescriptionsReceived', () => ({
  usePrescriptionsReceived: () => ({ data: [], loading: false, error: null, totalCount: 0 }),
}));

vi.mock('../../../hooks/useOpenVisits', () => ({
  useOpenVisits: () => ({ data: [], loading: false, error: null, totalCount: 0 }),
}));

// We'll mock useNavigate to assert it's called with correct routes
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

import DashboardComponent from '../../../modules/dashboard/dashboard.component';
import ROUTES from '../../../routes/paths';

describe('DashboardComponent navigation', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('navigates to prescriptions when Prescriptions card is clicked', () => {
    render(<DashboardComponent />);
    const prescriptionCard = screen.getByText('Prescriptions').closest('[class*="cursor-pointer"]');
    expect(prescriptionCard).toBeTruthy();
    if (prescriptionCard) fireEvent.click(prescriptionCard);
    expect(navigateMock).toHaveBeenCalledWith(ROUTES.PRESCRIPTIONS);
  });

  it('navigates to open visits when Open visits card is clicked', () => {
    render(<DashboardComponent />);
    const openVisitsCard = screen.getByText('Open visits').closest('[class*="cursor-pointer"]');
    expect(openVisitsCard).toBeTruthy();
    if (openVisitsCard) fireEvent.click(openVisitsCard);
    expect(navigateMock).toHaveBeenCalledWith(ROUTES.OPEN_VISITS);
  });
});
