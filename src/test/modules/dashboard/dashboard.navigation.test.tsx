import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../hooks/usePrescriptionsReceived', () => ({
  usePrescriptionsReceived: () => ({ data: [], loading: false, error: null, totalCount: 0 }),
}));

vi.mock('../../../hooks/usePrescriptionsPending', () => ({
  usePrescriptionsPending: () => ({ data: [], loading: false, error: null, totalCount: 0 }),
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
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null, key: 'default' }),
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
    const prescriptionCard = screen.getAllByText('Prescriptions')[0].closest('[class*="cursor-pointer"]');
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

  it('navigates to add patient when desktop Add Patients button is clicked', () => {
    render(<DashboardComponent />);
    const desktopAddBtn = screen.getAllByText('Add Patients')
      .map(el => el.closest('button'))
      .find(btn => btn?.classList.contains('md:flex'));
    expect(desktopAddBtn).toBeTruthy();
    if (desktopAddBtn) fireEvent.click(desktopAddBtn);
    expect(navigateMock).toHaveBeenCalledWith(
      ROUTES.PATIENT.BASE + '/' + ROUTES.PATIENT.ADD_PATIENT
    );
  });

  it('navigates to follow-up visits when Follow-up visits card is clicked', () => {
    render(<DashboardComponent />);
    const followUpCard = screen.getByText('Follow-up visits').closest('[class*="cursor-pointer"]');
    expect(followUpCard).toBeTruthy();
    if (followUpCard) fireEvent.click(followUpCard);
    expect(navigateMock).toHaveBeenCalledWith('/followup-visits');
  });

  it('navigates to follow-up visits via keyboard on Follow-up visits card', () => {
    render(<DashboardComponent />);
    const followUpCard = screen.getByText('Follow-up visits').closest('[class*="cursor-pointer"]');
    expect(followUpCard).toBeTruthy();
    if (followUpCard) fireEvent.keyDown(followUpCard, { key: 'Enter' });
    expect(navigateMock).toHaveBeenCalledWith('/followup-visits');
  });

  it('hides mobile back button and shows it when showPrescriptions is true', () => {
    render(<DashboardComponent initialShowPrescriptions={true} />);
    const backButton = screen.getByText('← Prescriptions');
    expect(backButton).toBeInTheDocument();
    fireEvent.click(backButton);
    expect(screen.queryByText('← Prescriptions')).not.toBeInTheDocument();
  });
});
