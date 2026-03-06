import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PatientSearch from '../../../../components/navbar/patient-search/patient-search.component';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock ProfileContext so component renders without a real provider
vi.mock('../../../../context/ProfileContext', () => ({
  useProfileContext: () => ({
    profile: { id: 'hw-001' },
  }),
}));

const mockGetRecentPatients = vi.fn();

vi.mock('../../../../services/patient.service', () => ({
  patientService: {
    getRecentPatients: (...args: unknown[]) => mockGetRecentPatients(...args),
  },
}));

const mockRecentPatients = [
  {
    visitUuid: 'v-1',
    patientName: 'Alice Smith',
    gender: 'F',
    age: 30,
    visitCreatedDate: '2025-01-01',
    clinicName: 'Clinic A',
    uploadTimestamp: '1h',
  },
];

vi.mock(
  '../../../../components/navbar/patient-search/patient-search.hook',
  () => ({
    usePatientSearch: () => ({
      patients: [],
      loading: false,
    }),
  })
);

const renderComponent = () =>
  render(
    <HashRouter>
      <PatientSearch />
    </HashRouter>
  );

describe('PatientSearch', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockGetRecentPatients.mockClear();
    mockGetRecentPatients.mockResolvedValue([]);
  });

  it('should render search input with placeholder', () => {
    renderComponent();
    expect(screen.getByPlaceholderText('Patient Search')).toBeInTheDocument();
  });

  it('should render search icon', () => {
    renderComponent();
    const searchIcon = screen.getByAltText('search');
    expect(searchIcon).toBeInTheDocument();
    expect(searchIcon).toHaveClass('w-6', 'h-6');
  });

  it('should have combobox ARIA role', () => {
    renderComponent();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should have aria-expanded false initially', () => {
    renderComponent();
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
  });

  it('should not show modal initially', () => {
    renderComponent();
    expect(screen.queryByText('Patient Search')).not.toBeInTheDocument();
  });

  it('should open modal on input focus', () => {
    renderComponent();
    fireEvent.focus(screen.getByRole('combobox'));
    expect(screen.getByText('Patient Search')).toBeInTheDocument();
  });

  it('should have aria-expanded true when modal is open', () => {
    renderComponent();
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  it('should fetch recent patients when modal opens with a hwId', async () => {
    mockGetRecentPatients.mockResolvedValue(mockRecentPatients);
    renderComponent();
    fireEvent.focus(screen.getByRole('combobox'));
    await waitFor(() => {
      expect(mockGetRecentPatients).toHaveBeenCalledWith('hw-001');
    });
  });

  it('should display recent patients inside the modal', async () => {
    mockGetRecentPatients.mockResolvedValue(mockRecentPatients);
    renderComponent();
    fireEvent.focus(screen.getByRole('combobox'));
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    });
  });

  it('should close modal when close button is clicked', () => {
    renderComponent();
    fireEvent.focus(screen.getByRole('combobox'));
    expect(screen.getByText('Patient Search')).toBeInTheDocument();
    fireEvent.click(screen.getByText('✕'));
    expect(screen.queryByText('Patient Search')).not.toBeInTheDocument();
  });

  it('should navigate and close modal when a patient is selected', async () => {
    mockGetRecentPatients.mockResolvedValue(mockRecentPatients);
    renderComponent();
    fireEvent.focus(screen.getByRole('combobox'));
    await waitFor(() => screen.getByText('Alice Smith'));
    fireEvent.click(screen.getByText('Alice Smith'));
    expect(mockNavigate).toHaveBeenCalledWith('/visit/v-1');
    expect(screen.queryByText('Patient Search')).not.toBeInTheDocument();
  });

  it('should not fetch recent patients again if already fetched', async () => {
    mockGetRecentPatients.mockResolvedValue(mockRecentPatients);
    renderComponent();
    // Open modal
    fireEvent.focus(screen.getByRole('combobox'));
    await waitFor(() => expect(mockGetRecentPatients).toHaveBeenCalledTimes(1));
    // Close and reopen
    fireEvent.click(screen.getByText('✕'));
    fireEvent.focus(screen.getByRole('combobox'));
    // Should not fetch again since recentPatients.length > 0
    expect(mockGetRecentPatients).toHaveBeenCalledTimes(1);
  });
});
