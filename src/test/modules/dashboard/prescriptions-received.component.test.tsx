import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrescriptionsReceived } from '../../../modules/dashboard/prescriptions-received.component';

const mockUsePrescriptionsReceived = vi.fn();
const mockUseOpenVisits = vi.fn();

vi.mock('../../../hooks/usePrescriptionsReceived', () => ({
  usePrescriptionsReceived: () => mockUsePrescriptionsReceived(),
}));

vi.mock('../../../hooks/useOpenVisits', () => ({
  useOpenVisits: () => mockUseOpenVisits(),
}));

const mockReceivedData = [
  {
    visitUuid: 'r-1',
    patientName: 'Sarrah Paul',
    gender: 'F',
    age: 41,
    visitCreatedDate: '2025-04-21',
    clinicName: 'TM Clinic 2',
    prescriptionReceivedTimestamp: '1 hr ago',
  },
  {
    visitUuid: 'r-2',
    patientName: 'Nikita Agrawal',
    gender: 'F',
    age: 32,
    visitCreatedDate: '2025-04-20',
    clinicName: 'TM Clinic 1',
    prescriptionReceivedTimestamp: '2 hr ago',
  },
  {
    visitUuid: 'r-3',
    patientName: 'Suresh Deshmukh',
    gender: 'M',
    age: 55,
    visitCreatedDate: '2025-04-19',
    clinicName: 'TM Clinic 3',
    prescriptionReceivedTimestamp: '4 hr ago',
  },
];

const mockOpenVisitsData = [
  {
    visitUuid: 'ov-1',
    patientName: 'Ravi Kumar',
    gender: 'M',
    age: 35,
    visitCreatedDate: '2025-04-21',
    clinicName: 'TM Clinic 1',
    uploadTimestamp: '30 min ago',
  },
];

const defaultReceivedState = {
  data: mockReceivedData,
  loading: false,
  error: null,
  totalCount: 3,
};

const defaultOpenVisitsState = {
  data: mockOpenVisitsData,
  loading: false,
  error: null,
  totalCount: 1,
};

describe('PrescriptionsReceived', () => {
  beforeEach(() => {
    mockUsePrescriptionsReceived.mockReturnValue(defaultReceivedState);
    mockUseOpenVisits.mockReturnValue(defaultOpenVisitsState);
  });

  describe('Initial render', () => {
    it('renders without crashing', () => {
      expect(() => render(<PrescriptionsReceived />)).not.toThrow();
    });

    it('renders header title', () => {
      render(<PrescriptionsReceived />);
      expect(screen.getByText('Prescription Received')).toBeInTheDocument();
    });

    it('renders filter icon', () => {
      render(<PrescriptionsReceived />);
      expect(screen.getByAltText('filter')).toBeInTheDocument();
    });

    it('renders search input with placeholder', () => {
      render(<PrescriptionsReceived />);
      expect(screen.getByPlaceholderText('Find patient')).toBeInTheDocument();
    });

    it('renders search icon', () => {
      render(<PrescriptionsReceived />);
      expect(screen.getByAltText('search')).toBeInTheDocument();
    });

    it('renders Received and Pendings tab buttons', () => {
      render(<PrescriptionsReceived />);
      expect(screen.getByText('Received')).toBeInTheDocument();
      expect(screen.getByText('Pendings')).toBeInTheDocument();
    });

    it('renders patient data in the Received table', () => {
      render(<PrescriptionsReceived />);
      expect(screen.getAllByText('Sarrah Paul').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Nikita Agrawal').length).toBeGreaterThan(0);
    });

    it('renders all received patients', () => {
      render(<PrescriptionsReceived />);
      expect(screen.getAllByText('Sarrah Paul').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Nikita Agrawal').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Suresh Deshmukh').length).toBeGreaterThan(0);
    });

    it('renders Received tab column headers', () => {
      render(<PrescriptionsReceived />);
      expect(screen.getAllByText('Patient').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Age').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Visit created').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Clinic').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Gender').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Prescription').length).toBeGreaterThan(0);
    });

    it('renders Show all footer link', () => {
      render(<PrescriptionsReceived />);
      expect(screen.getByText('Show all →')).toBeInTheDocument();
    });
  });

  describe('Tab switching', () => {
    it('clicking Received tab sets it as active', () => {
      render(<PrescriptionsReceived />);
      const receivedTab = screen.getByText('Received').closest('button')!;
      fireEvent.click(receivedTab);
      expect(receivedTab).toHaveClass('border-indigo-600');
      expect(receivedTab).toHaveClass('text-indigo-600');
    });

    it('clicking Pendings tab sets it as active', () => {
      render(<PrescriptionsReceived />);
      const pendingsTab = screen.getByText('Pendings').closest('button')!;
      fireEvent.click(pendingsTab);
      expect(pendingsTab).toHaveClass('border-indigo-600');
      expect(pendingsTab).toHaveClass('text-indigo-600');
    });

    it('inactive tab has transparent border', () => {
      render(<PrescriptionsReceived />);
      const receivedTab = screen.getByText('Received').closest('button')!;
      const pendingsTab = screen.getByText('Pendings').closest('button')!;
      fireEvent.click(pendingsTab);
      expect(receivedTab).toHaveClass('border-transparent');
    });

    it('switching tabs toggles active styling', () => {
      render(<PrescriptionsReceived />);
      const receivedTab = screen.getByText('Received').closest('button')!;
      const pendingsTab = screen.getByText('Pendings').closest('button')!;

      fireEvent.click(receivedTab);
      expect(receivedTab).toHaveClass('border-indigo-600');
      expect(pendingsTab).toHaveClass('border-transparent');

      fireEvent.click(pendingsTab);
      expect(pendingsTab).toHaveClass('border-indigo-600');
      expect(receivedTab).toHaveClass('border-transparent');
    });

    it('shows Pendings (open visits) data when Pendings tab is active', () => {
      render(<PrescriptionsReceived />);
      fireEvent.click(screen.getByText('Pendings').closest('button')!);
      expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThan(0);
    });

    it('shows Uploaded column header in Pendings tab', () => {
      render(<PrescriptionsReceived />);
      fireEvent.click(screen.getByText('Pendings').closest('button')!);
      expect(screen.getAllByText('Uploaded').length).toBeGreaterThan(0);
    });
  });

  describe('Patient data display', () => {
    it('renders patient ages', () => {
      render(<PrescriptionsReceived />);
      expect(screen.getAllByText('41').length).toBeGreaterThan(0);
      expect(screen.getAllByText('32').length).toBeGreaterThan(0);
    });

    it('renders visit dates', () => {
      render(<PrescriptionsReceived />);
      expect(screen.getAllByText('2025-04-21').length).toBeGreaterThan(0);
      expect(screen.getAllByText('2025-04-20').length).toBeGreaterThan(0);
    });

    it('renders clinic names', () => {
      render(<PrescriptionsReceived />);
      expect(screen.getAllByText('TM Clinic 2').length).toBeGreaterThan(0);
    });

    it('renders prescription timestamps', () => {
      render(<PrescriptionsReceived />);
      expect(screen.getAllByText('1 hr ago').length).toBeGreaterThan(0);
      expect(screen.getAllByText('2 hr ago').length).toBeGreaterThan(0);
      expect(screen.getAllByText('4 hr ago').length).toBeGreaterThan(0);
    });
  });

  describe('Search filtering', () => {
    it('filters Received tab by patient name', () => {
      render(<PrescriptionsReceived />);
      const input = screen.getByPlaceholderText('Find patient');
      fireEvent.change(input, { target: { value: 'Sarrah' } });
      expect(screen.getAllByText('Sarrah Paul').length).toBeGreaterThan(0);
      expect(screen.queryByText('Nikita Agrawal')).not.toBeInTheDocument();
    });
  });

  describe('Loading and error states', () => {
    it('shows loading indicator for Received tab', () => {
      mockUsePrescriptionsReceived.mockReturnValue({ data: [], loading: true, error: null, totalCount: 0 });
      render(<PrescriptionsReceived />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows error for Received tab', () => {
      mockUsePrescriptionsReceived.mockReturnValue({ data: [], loading: false, error: 'Failed to fetch prescriptions', totalCount: 0 });
      render(<PrescriptionsReceived />);
      expect(screen.getByText('Failed to fetch prescriptions')).toBeInTheDocument();
    });

    it('shows loading indicator for Pendings tab', () => {
      mockUseOpenVisits.mockReturnValue({ data: [], loading: true, error: null, totalCount: 0 });
      render(<PrescriptionsReceived />);
      fireEvent.click(screen.getByText('Pendings').closest('button')!);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows empty message when no received prescriptions', () => {
      mockUsePrescriptionsReceived.mockReturnValue({ data: [], loading: false, error: null, totalCount: 0 });
      render(<PrescriptionsReceived />);
      expect(screen.getByText('No prescriptions found.')).toBeInTheDocument();
    });

    it('shows empty message when no open visits in Pendings tab', () => {
      mockUseOpenVisits.mockReturnValue({ data: [], loading: false, error: null, totalCount: 0 });
      render(<PrescriptionsReceived />);
      fireEvent.click(screen.getByText('Pendings').closest('button')!);
      expect(screen.getByText('No open visits found.')).toBeInTheDocument();
    });
  });

  describe('onCountLoaded callback', () => {
    it('calls onCountLoaded with total received count', () => {
      const onCountLoaded = vi.fn();
      render(<PrescriptionsReceived onCountLoaded={onCountLoaded} />);
      expect(onCountLoaded).toHaveBeenCalledWith(3);
    });
  });
});
