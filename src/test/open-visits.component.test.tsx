import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenVisitsComponent } from '../modules/dashboard/open-visits.component';

const mockUseOpenVisits = vi.fn();

vi.mock('../hooks/useOpenVisits', () => ({
  useOpenVisits: () => mockUseOpenVisits(),
}));

const mockData = [
  {
    visitUuid: 'v-1',
    patientName: 'Ravi Kumar',
    gender: 'M',
    age: 35,
    visitCreatedDate: '2025-04-21',
    clinicName: 'TM Clinic 1',
    uploadTimestamp: '1 hr ago',
  },
  {
    visitUuid: 'v-2',
    patientName: 'Priya Singh',
    gender: 'F',
    age: 28,
    visitCreatedDate: '2025-04-20',
    clinicName: 'TM Clinic 2',
    uploadTimestamp: '3 hr ago',
  },
];

describe('OpenVisitsComponent', () => {
  beforeEach(() => {
    mockUseOpenVisits.mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      totalCount: 2,
    });
  });

  it('renders without crashing', () => {
    expect(() => render(<OpenVisitsComponent />)).not.toThrow();
  });

  it('renders the Open Visits heading', () => {
    render(<OpenVisitsComponent />);
    expect(screen.getByText('Open Visits')).toBeInTheDocument();
  });

  it('renders search input with placeholder', () => {
    render(<OpenVisitsComponent />);
    expect(screen.getByPlaceholderText('Find patient')).toBeInTheDocument();
  });

  it('does NOT render Unclosed or Closed tabs', () => {
    render(<OpenVisitsComponent />);
    expect(screen.queryByText('Unclosed')).not.toBeInTheDocument();
    expect(screen.queryByText('Closed')).not.toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<OpenVisitsComponent />);
    expect(screen.getAllByText('Patient').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Age').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Visit created').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Clinic').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gender').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Uploaded').length).toBeGreaterThan(0);
  });

  it('renders patient data from API', () => {
    render(<OpenVisitsComponent />);
    expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Priya Singh').length).toBeGreaterThan(0);
  });

  it('renders upload timestamps', () => {
    render(<OpenVisitsComponent />);
    expect(screen.getAllByText('1 hr ago').length).toBeGreaterThan(0);
    expect(screen.getAllByText('3 hr ago').length).toBeGreaterThan(0);
  });

  it('filters patients by search input', () => {
    render(<OpenVisitsComponent />);
    const input = screen.getByPlaceholderText('Find patient');
    fireEvent.change(input, { target: { value: 'Ravi' } });
    expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThan(0);
    expect(screen.queryByText('Priya Singh')).not.toBeInTheDocument();
  });

  it('shows loading indicator when loading', () => {
    mockUseOpenVisits.mockReturnValue({ data: [], loading: true, error: null, totalCount: 0 });
    render(<OpenVisitsComponent />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error message when error occurs', () => {
    mockUseOpenVisits.mockReturnValue({ data: [], loading: false, error: 'Failed to fetch open visits', totalCount: 0 });
    render(<OpenVisitsComponent />);
    expect(screen.getByText('Failed to fetch open visits')).toBeInTheDocument();
  });

  it('shows empty message when no data', () => {
    mockUseOpenVisits.mockReturnValue({ data: [], loading: false, error: null, totalCount: 0 });
    render(<OpenVisitsComponent />);
    expect(screen.getByText('No open visits found.')).toBeInTheDocument();
  });

  it('shows Show all footer link', () => {
    render(<OpenVisitsComponent />);
    expect(screen.getByText('Show all →')).toBeInTheDocument();
  });
});
