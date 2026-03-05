import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import PatientSearchModal from '../../../components/modal/patient-search.modal';
import type { RecentPatient } from '../../../services/patient.service';

const mockPatients: RecentPatient[] = [
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

describe('PatientSearchModal', () => {
  it('renders nothing when open is false', () => {
    const { container } = render(
      <PatientSearchModal
        open={false}
        patients={[]}
        onClose={vi.fn()}
        onSelect={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the modal when open is true', () => {
    render(
      <PatientSearchModal
        open={true}
        patients={[]}
        onClose={vi.fn()}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText('Patient Search')).toBeInTheDocument();
  });

  it('shows loading indicator when loading is true', () => {
    render(
      <PatientSearchModal
        open={true}
        patients={[]}
        loading={true}
        onClose={vi.fn()}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error message when error is provided and not loading', () => {
    render(
      <PatientSearchModal
        open={true}
        patients={[]}
        loading={false}
        error="Something went wrong"
        onClose={vi.fn()}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows empty message when no patients and no error', () => {
    render(
      <PatientSearchModal
        open={true}
        patients={[]}
        loading={false}
        error={null}
        onClose={vi.fn()}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText('No patients found.')).toBeInTheDocument();
  });

  it('renders patient list when patients are provided', () => {
    render(
      <PatientSearchModal
        open={true}
        patients={mockPatients}
        loading={false}
        error={null}
        onClose={vi.fn()}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('renders patient details including gender, age, and clinic', () => {
    render(
      <PatientSearchModal
        open={true}
        patients={mockPatients}
        loading={false}
        onClose={vi.fn()}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText(/Clinic A/)).toBeInTheDocument();
    expect(screen.getByText(/Clinic B/)).toBeInTheDocument();
  });

  it('renders visit date for each patient', () => {
    render(
      <PatientSearchModal
        open={true}
        patients={mockPatients}
        loading={false}
        onClose={vi.fn()}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText(/Visit: 2025-01-01/)).toBeInTheDocument();
    expect(screen.getByText(/Visit: 2025-01-02/)).toBeInTheDocument();
  });

  it('renders patient with no age gracefully', () => {
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
        open={true}
        patients={[patientWithoutAge]}
        loading={false}
        onClose={vi.fn()}
        onSelect={vi.fn()}
      />
    );
    expect(screen.getByText('Carol Davis')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <PatientSearchModal
        open={true}
        patients={[]}
        onClose={onClose}
        onSelect={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('✕'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect with the correct patient when a patient button is clicked', () => {
    const onSelect = vi.fn();
    render(
      <PatientSearchModal
        open={true}
        patients={mockPatients}
        loading={false}
        onClose={vi.fn()}
        onSelect={onSelect}
      />
    );
    fireEvent.click(screen.getByText('Alice Smith'));
    expect(onSelect).toHaveBeenCalledWith(mockPatients[0]);
  });

  it('calls onSelect with the second patient when the second patient button is clicked', () => {
    const onSelect = vi.fn();
    render(
      <PatientSearchModal
        open={true}
        patients={mockPatients}
        loading={false}
        onClose={vi.fn()}
        onSelect={onSelect}
      />
    );
    fireEvent.click(screen.getByText('Bob Jones'));
    expect(onSelect).toHaveBeenCalledWith(mockPatients[1]);
  });
});
