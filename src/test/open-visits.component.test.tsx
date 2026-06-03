import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { OpenVisitsComponent } from '../modules/dashboard/open-visits.component';
import { BreadcrumbProvider } from '../context/BreadcrumbContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUseOpenVisits = vi.fn();
const mockUsePriorityVisits = vi.fn();

vi.mock('../hooks/useOpenVisits', () => ({
  useOpenVisits: () => mockUseOpenVisits(),
}));

vi.mock('../hooks/usePriorityVisits', () => ({
  usePriorityVisits: () => mockUsePriorityVisits(),
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

const renderComponent = (props = {}) =>
  render(
    <MemoryRouter>
      <BreadcrumbProvider>
        <OpenVisitsComponent {...props} />
      </BreadcrumbProvider>
    </MemoryRouter>
  );

describe('OpenVisitsComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOpenVisits.mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
      totalCount: 2,
    });
    mockUsePriorityVisits.mockReturnValue({
      data: [],
      loading: false,
      error: null,
      totalCount: 0,
    });
  });

  it('renders without crashing', () => {
    expect(() => renderComponent()).not.toThrow();
  });

  it('renders the Open Visits heading', () => {
    renderComponent();
    expect(
      screen.getByRole('heading', { name: 'Open Visits' })
    ).toBeInTheDocument();
  });

  it('renders search input with placeholder', () => {
    renderComponent();
    expect(screen.getByPlaceholderText('Find patient')).toBeInTheDocument();
  });

  it('does NOT render Unclosed or Closed tabs', () => {
    renderComponent();
    expect(screen.queryByText('Unclosed')).not.toBeInTheDocument();
    expect(screen.queryByText('Closed')).not.toBeInTheDocument();
  });

  it('renders column headers', () => {
    renderComponent();
    expect(screen.getAllByText('Patient').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Age').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Visit created').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Clinic').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gender').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Uploaded').length).toBeGreaterThan(0);
  });

  it('renders patient data from API', () => {
    renderComponent();
    expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Priya Singh').length).toBeGreaterThan(0);
  });

  it('renders the visit date in the Uploaded column (backend only emits visitCreatedDate)', () => {
    renderComponent();
    // The Uploaded column now sources its value from visitCreatedDate, so the
    // dates appear in both the Visit created and Uploaded cells.
    expect(screen.getAllByText('2025-04-21').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('2025-04-20').length).toBeGreaterThanOrEqual(2);
  });

  it('filters patients by search input', () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Find patient');
    fireEvent.change(input, { target: { value: 'Ravi' } });
    expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThan(0);
    expect(screen.queryByText('Priya Singh')).not.toBeInTheDocument();
  });

  it('shows loading indicator when loading', () => {
    mockUseOpenVisits.mockReturnValue({ data: [], loading: true, error: null, totalCount: 0 });
    renderComponent();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error message when error occurs', () => {
    mockUseOpenVisits.mockReturnValue({ data: [], loading: false, error: 'Failed to fetch open visits', totalCount: 0 });
    renderComponent();
    expect(screen.getByText('Failed to fetch open visits')).toBeInTheDocument();
  });

  it('shows empty message when no data', () => {
    mockUseOpenVisits.mockReturnValue({ data: [], loading: false, error: null, totalCount: 0 });
    renderComponent();
    expect(screen.getByText('No open visits found.')).toBeInTheDocument();
  });

  it('does not show Show all footer when data has 6 or fewer rows', () => {
    renderComponent();
    expect(screen.queryByText('Show all →')).not.toBeInTheDocument();
  });

  it('renders sort icons next to search', () => {
    renderComponent();
    expect(screen.getAllByAltText('sort-asc').length).toBeGreaterThan(0);
    expect(screen.getAllByAltText('sort-desc').length).toBeGreaterThan(0);
  });

  it('renders search icon', () => {
    renderComponent();
    expect(screen.getByAltText('search')).toBeInTheDocument();
  });

  describe('initialRowCount prop', () => {
    it('limits visible rows when initialRowCount is provided', () => {
      const bigData = Array.from({ length: 8 }, (_, i) => ({
        visitUuid: `v-${i}`,
        patientName: `Patient ${i}`,
        gender: 'M',
        age: 30 + i,
        visitCreatedDate: '2025-04-21',
        clinicName: 'TM Clinic 1',
        uploadTimestamp: `${i} hr ago`,
      }));
      mockUseOpenVisits.mockReturnValue({ data: bigData, loading: false, error: null, totalCount: 8 });
      renderComponent({ initialRowCount: 3 });
      expect(screen.getByText('Show all →')).toBeInTheDocument();
    });

    it('uses default row count when initialRowCount is not provided', () => {
      renderComponent();
      // 2 rows < default 6, no footer
      expect(screen.queryByText('Show all →')).not.toBeInTheDocument();
    });
  });

  describe('Search filtering edge cases', () => {
    it('shows empty message when search has no matches', () => {
      renderComponent();
      const input = screen.getByPlaceholderText('Find patient');
      fireEvent.change(input, { target: { value: 'nonexistent' } });
      expect(screen.getByText('No open visits found.')).toBeInTheDocument();
    });

    it('search is case insensitive', () => {
      renderComponent();
      const input = screen.getByPlaceholderText('Find patient');
      fireEvent.change(input, { target: { value: 'ravi' } });
      expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThan(0);
    });
  });

  describe('Layout structure', () => {
    it('renders with flex layout for height chain', () => {
      const { container } = renderComponent();
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveClass('flex', 'flex-col', 'flex-1', 'min-h-0');
    });

    it('renders header with shrink-0 class', () => {
      const { container } = renderComponent();
      const header = container.querySelector('.shrink-0');
      expect(header).toBeInTheDocument();
    });
  });

  describe('Row click navigation', () => {
    it('navigates to visit-details on row click', () => {
      renderComponent();
      const patientNames = screen.getAllByText('Ravi Kumar');
      const row = patientNames[0].closest('.rounded-xl');
      fireEvent.click(row!);
      expect(mockNavigate).toHaveBeenCalledWith('/visit-details/v-1', { state: { fromLabel: 'Open Visits', fromPath: '/open-visits' } });
    });
  });
});
