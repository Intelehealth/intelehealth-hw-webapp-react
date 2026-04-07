import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FollowupVisitsComponent } from '../../../modules/dashboard/followup-visits.component';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUseFollowupVisits = vi.fn();

vi.mock('../../../hooks/useFollowupVisits', () => ({
  useFollowupVisits: () => mockUseFollowupVisits(),
}));

const mockData = [
  {
    visitUuid: 'v-1',
    patientName: 'Ravi Kumar',
    gender: 'M',
    age: 35,
    visitCreatedDate: '2025-04-21',
    clinicName: 'TM Clinic 1',
  },
  {
    visitUuid: 'v-2',
    patientName: 'Priya Singh',
    gender: 'F',
    age: 28,
    visitCreatedDate: '2025-04-20',
    clinicName: 'TM Clinic 2',
  },
];

const renderComponent = (props = {}) =>
  render(
    <MemoryRouter>
      <FollowupVisitsComponent {...props} />
    </MemoryRouter>
  );

describe('FollowupVisitsComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFollowupVisits.mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
    });
  });

  it('renders without crashing', () => {
    expect(() => renderComponent()).not.toThrow();
  });

  it('renders the Follow-up Visits heading', () => {
    renderComponent();
    expect(screen.getByText('Follow-up Visits')).toBeInTheDocument();
  });

  it('renders search input with placeholder', () => {
    renderComponent();
    expect(screen.getByPlaceholderText('Find patient')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    renderComponent();
    expect(screen.getAllByText('Patient').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Age').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Visit created').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Clinic').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gender').length).toBeGreaterThan(0);
  });


  it('renders all patient rows', () => {
    renderComponent();
   
    expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Priya Singh').length).toBeGreaterThanOrEqual(1);
  });


  it('filters patients by search', () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Find patient');
    fireEvent.change(input, { target: { value: 'Priya' } });
   
    expect(screen.getAllByText('Priya Singh').length).toBeGreaterThanOrEqual(1);
   
    expect(screen.queryAllByText('Ravi Kumar').length).toBe(0);
  });

  it('shows loading state', () => {
    mockUseFollowupVisits.mockReturnValue({ data: [], loading: true, error: null });
    renderComponent();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseFollowupVisits.mockReturnValue({ data: [], loading: false, error: 'Failed' });
    renderComponent();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    mockUseFollowupVisits.mockReturnValue({ data: [], loading: false, error: null });
    renderComponent();
    expect(screen.getByText('No follow-up visits found.')).toBeInTheDocument();
  });


  it('navigates to visit details on row click', () => {
    renderComponent();
  
    const raviNodes = screen.getAllByText('Ravi Kumar');
  
    const clickable = raviNodes[0].closest('tr') || raviNodes[0].closest('div[role="row"]') || raviNodes[0].closest('div');
    if (clickable) fireEvent.click(clickable);
    expect(mockNavigate).toHaveBeenCalledWith('/visit-details/v-1');
  });
});
