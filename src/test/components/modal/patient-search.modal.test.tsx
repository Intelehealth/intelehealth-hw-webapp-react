import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PatientSearchModal from '../../../components/modal/patient-search.modal';
import type { Patient } from '../../../components/navbar/patient-search/patient-search.hook';
import type { RecentPatient } from '../../../services/patient.service';

const mockRecentPatients: RecentPatient[] = [
  {
    visitUuid: 'v-1',
    patientName: 'Alice Smith',
    gender: 'F',
    age: 30,
    visitCreatedDate: '2025-01-01',
    clinicName: 'Clinic A',
    uploadTimestamp: '1h',
  },
  {
    visitUuid: 'v-2',
    patientName: 'Bob Jones',
    gender: 'M',
    age: 40,
    visitCreatedDate: '2025-01-02',
    clinicName: 'Clinic B',
    uploadTimestamp: '2h',
  },
];

const mockLivePatients: Patient[] = [
  {
    uuid: 'uuid-1',
    identifiers: [{ identifier: 'OPM-100', identifierType: { name: 'OpenMRS ID' } }],
    person: { display: 'Carol Davis', gender: 'F', age: 35, attributes: [] },
  },
];

const defaultProps = {
  open: true,
  recentPatients: [],
  onSelectRecent: vi.fn(),
  livePatients: [],
  searchTerm: '',
  onSearchChange: vi.fn(),
  onClose: vi.fn(),
};

describe('PatientSearchModal', () => {
  it('renders nothing when open is false', () => {
    const { container } = render(
      <PatientSearchModal {...defaultProps} open={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the modal when open is true', () => {
    render(<PatientSearchModal {...defaultProps} />);
    expect(screen.getByText('Patient Search')).toBeInTheDocument();
  });

  it('renders a search input inside the modal', () => {
    render(<PatientSearchModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search by name or visit ID')).toBeInTheDocument();
  });

  it('calls onSearchChange when typing in the modal search input', () => {
    const onSearchChange = vi.fn();
    render(<PatientSearchModal {...defaultProps} onSearchChange={onSearchChange} />);
    fireEvent.change(screen.getByPlaceholderText('Search by name or visit ID'), {
      target: { value: 'Alice' },
    });
    expect(onSearchChange).toHaveBeenCalledWith('Alice');
  });

  it('shows "Recent patients" label when searchTerm is empty', () => {
    render(<PatientSearchModal {...defaultProps} searchTerm="" />);
    expect(screen.getByText('Recent patients')).toBeInTheDocument();
  });

  it('shows "Search results" label when searchTerm is non-empty', () => {
    render(<PatientSearchModal {...defaultProps} searchTerm="Alice" livePatients={mockLivePatients} />);
    expect(screen.getByText('Search results')).toBeInTheDocument();
  });

  it('shows loading indicator when recentLoading is true and no searchTerm', () => {
    render(<PatientSearchModal {...defaultProps} recentLoading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows loading indicator when liveLoading is true and searchTerm is set', () => {
    render(<PatientSearchModal {...defaultProps} searchTerm="Alice" liveLoading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error message when recentError is set and no searchTerm', () => {
    render(
      <PatientSearchModal
        {...defaultProps}
        recentError="Something went wrong"
        recentLoading={false}
      />
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows empty message when no recent patients and no searchTerm', () => {
    render(
      <PatientSearchModal
        {...defaultProps}
        recentPatients={[]}
        recentLoading={false}
        searchTerm=""
      />
    );
    expect(screen.getByText('No recent patients.')).toBeInTheDocument();
  });

  it('shows empty message when no live patients and searchTerm is set', () => {
    render(
      <PatientSearchModal
        {...defaultProps}
        livePatients={[]}
        liveLoading={false}
        searchTerm="xyz"
      />
    );
    expect(screen.getByText('No patients found.')).toBeInTheDocument();
  });

  it('renders recent patient list when searchTerm is empty', () => {
    render(
      <PatientSearchModal
        {...defaultProps}
        recentPatients={mockRecentPatients}
        recentLoading={false}
      />
    );
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('renders recent patient details including gender, age, and clinic', () => {
    render(
      <PatientSearchModal
        {...defaultProps}
        recentPatients={mockRecentPatients}
        recentLoading={false}
      />
    );
    expect(screen.getByText(/Clinic A/)).toBeInTheDocument();
    expect(screen.getByText(/Clinic B/)).toBeInTheDocument();
  });

  it('renders visit date for each recent patient', () => {
    render(
      <PatientSearchModal
        {...defaultProps}
        recentPatients={mockRecentPatients}
        recentLoading={false}
      />
    );
    expect(screen.getByText(/Visit: 2025-01-01/)).toBeInTheDocument();
    expect(screen.getByText(/Visit: 2025-01-02/)).toBeInTheDocument();
  });

  it('renders recent patient with no age gracefully', () => {
    const patientWithoutAge: RecentPatient = {
      visitUuid: 'v-3',
      patientName: 'Carol Davis',
      gender: 'F',
      visitCreatedDate: '2025-01-03',
      clinicName: 'Clinic C',
      uploadTimestamp: '3h',
    };
    render(
      <PatientSearchModal
        {...defaultProps}
        recentPatients={[patientWithoutAge]}
        recentLoading={false}
      />
    );
    expect(screen.getByText('Carol Davis')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<PatientSearchModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('✕'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSelectRecent with the correct patient when a recent patient is clicked', () => {
    const onSelectRecent = vi.fn();
    render(
      <PatientSearchModal
        {...defaultProps}
        recentPatients={mockRecentPatients}
        recentLoading={false}
        onSelectRecent={onSelectRecent}
      />
    );
    fireEvent.click(screen.getByText('Alice Smith'));
    expect(onSelectRecent).toHaveBeenCalledWith(mockRecentPatients[0]);
  });

  it('calls onSelectRecent with the second recent patient when clicked', () => {
    const onSelectRecent = vi.fn();
    render(
      <PatientSearchModal
        {...defaultProps}
        recentPatients={mockRecentPatients}
        recentLoading={false}
        onSelectRecent={onSelectRecent}
      />
    );
    fireEvent.click(screen.getByText('Bob Jones'));
    expect(onSelectRecent).toHaveBeenCalledWith(mockRecentPatients[1]);
  });

  it('renders live search results when searchTerm is non-empty', () => {
    render(
      <PatientSearchModal
        {...defaultProps}
        searchTerm="Carol"
        livePatients={mockLivePatients}
        liveLoading={false}
      />
    );
    expect(screen.getByText('Carol Davis')).toBeInTheDocument();
    expect(screen.getByText(/OPM-100/)).toBeInTheDocument();
  });

  it('calls onSelectRecent with adapted data when a live patient is clicked', () => {
    const onSelectRecent = vi.fn();
    render(
      <PatientSearchModal
        {...defaultProps}
        searchTerm="Carol"
        livePatients={mockLivePatients}
        liveLoading={false}
        onSelectRecent={onSelectRecent}
      />
    );
    fireEvent.click(screen.getByText('Carol Davis'));
    expect(onSelectRecent).toHaveBeenCalledWith(
      expect.objectContaining({
        visitUuid: 'uuid-1',
        patientName: 'Carol Davis',
        gender: 'F',
        age: 35,
      })
    );
  });
});

