import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PrescriptionsReceived } from '../../../modules/dashboard/prescriptions-received.component';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUsePrescriptionsReceived = vi.fn();
const mockUsePrescriptionsPending = vi.fn();

vi.mock('../../../hooks/usePrescriptionsReceived', () => ({
  usePrescriptionsReceived: () => mockUsePrescriptionsReceived(),
}));

vi.mock('../../../hooks/usePrescriptionsPending', () => ({
  usePrescriptionsPending: () => mockUsePrescriptionsPending(),
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

const mockPendingData = [
  {
    visitUuid: 'p-1',
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

const defaultPendingState = {
  data: mockPendingData,
  loading: false,
  error: null,
  totalCount: 1,
};

const renderComponent = (props = {}) =>
  render(
    <MemoryRouter>
      <PrescriptionsReceived {...props} />
    </MemoryRouter>
  );

describe('PrescriptionsReceived', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePrescriptionsReceived.mockReturnValue(defaultReceivedState);
    mockUsePrescriptionsPending.mockReturnValue(defaultPendingState);
  });

  describe('Initial render', () => {
    it('renders without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('renders header title', () => {
      renderComponent();
      expect(screen.getByText('Prescription Received')).toBeInTheDocument();
    });

    it('renders filter icon', () => {
      renderComponent();
      expect(screen.getByAltText('filter')).toBeInTheDocument();
    });

    it('renders search input with placeholder', () => {
      renderComponent();
      expect(screen.getByPlaceholderText('Find patient')).toBeInTheDocument();
    });

    it('renders search icon', () => {
      renderComponent();
      expect(screen.getByAltText('search')).toBeInTheDocument();
    });

    it('renders Received and Pendings tab buttons', () => {
      renderComponent();
      expect(screen.getByText('Received')).toBeInTheDocument();
      expect(screen.getByText('Pendings')).toBeInTheDocument();
    });

    it('renders patient data in the Received table', () => {
      renderComponent();
      expect(screen.getAllByText('Sarrah Paul').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Nikita Agrawal').length).toBeGreaterThan(0);
    });

    it('renders all received patients', () => {
      renderComponent();
      expect(screen.getAllByText('Sarrah Paul').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Nikita Agrawal').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Suresh Deshmukh').length).toBeGreaterThan(0);
    });

    it('renders Received tab column headers', () => {
      renderComponent();
      expect(screen.getAllByText('Patient').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Age').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Visit created').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Clinic').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Gender').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Prescription').length).toBeGreaterThan(0);
    });

    it('renders Show all footer link', () => {
      renderComponent();
      expect(screen.getByText('Show all →')).toBeInTheDocument();
    });
  });

  describe('Tab switching', () => {
    it('clicking Received tab sets it as active', () => {
      renderComponent();
      const receivedTab = screen.getByText('Received').closest('button')!;
      fireEvent.click(receivedTab);
      expect(receivedTab).toHaveClass('border-indigo-600');
      expect(receivedTab).toHaveClass('text-indigo-600');
    });

    it('clicking Pendings tab sets it as active', () => {
      renderComponent();
      const pendingsTab = screen.getByText('Pendings').closest('button')!;
      fireEvent.click(pendingsTab);
      expect(pendingsTab).toHaveClass('border-indigo-600');
      expect(pendingsTab).toHaveClass('text-indigo-600');
    });

    it('inactive tab has transparent border', () => {
      renderComponent();
      const receivedTab = screen.getByText('Received').closest('button')!;
      const pendingsTab = screen.getByText('Pendings').closest('button')!;
      fireEvent.click(pendingsTab);
      expect(receivedTab).toHaveClass('border-transparent');
    });

    it('switching tabs toggles active styling', () => {
      renderComponent();
      const receivedTab = screen.getByText('Received').closest('button')!;
      const pendingsTab = screen.getByText('Pendings').closest('button')!;

      fireEvent.click(receivedTab);
      expect(receivedTab).toHaveClass('border-indigo-600');
      expect(pendingsTab).toHaveClass('border-transparent');

      fireEvent.click(pendingsTab);
      expect(pendingsTab).toHaveClass('border-indigo-600');
      expect(receivedTab).toHaveClass('border-transparent');
    });

    it('shows pending prescriptions data when Pendings tab is active', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Pendings').closest('button')!);
      expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThan(0);
    });

    it('shows Uploaded column header in Pendings tab', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Pendings').closest('button')!);
      expect(screen.getAllByText('Uploaded').length).toBeGreaterThan(0);
    });

    it('renders pending upload timestamp with custom render', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Pendings').closest('button')!);
      expect(screen.getAllByText('30 min ago').length).toBeGreaterThan(0);
    });
  });

  describe('Patient data display', () => {
    it('renders patient ages', () => {
      renderComponent();
      expect(screen.getAllByText('41').length).toBeGreaterThan(0);
      expect(screen.getAllByText('32').length).toBeGreaterThan(0);
    });

    it('renders visit dates', () => {
      renderComponent();
      expect(screen.getAllByText('2025-04-21').length).toBeGreaterThan(0);
      expect(screen.getAllByText('2025-04-20').length).toBeGreaterThan(0);
    });

    it('renders clinic names', () => {
      renderComponent();
      expect(screen.getAllByText('TM Clinic 2').length).toBeGreaterThan(0);
    });

    it('renders prescription timestamps', () => {
      renderComponent();
      expect(screen.getAllByText('1 hr ago').length).toBeGreaterThan(0);
      expect(screen.getAllByText('2 hr ago').length).toBeGreaterThan(0);
      expect(screen.getAllByText('4 hr ago').length).toBeGreaterThan(0);
    });
  });

  describe('Search filtering', () => {
    it('filters Received tab by patient name', () => {
      renderComponent();
      const input = screen.getByPlaceholderText('Find patient');
      fireEvent.change(input, { target: { value: 'Sarrah' } });
      expect(screen.getAllByText('Sarrah Paul').length).toBeGreaterThan(0);
      expect(screen.queryByText('Nikita Agrawal')).not.toBeInTheDocument();
    });
  });

  describe('Loading and error states', () => {
    it('shows loading indicator for Received tab', () => {
      mockUsePrescriptionsReceived.mockReturnValue({ data: [], loading: true, error: null, totalCount: 0 });
      renderComponent();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows error for Received tab', () => {
      mockUsePrescriptionsReceived.mockReturnValue({ data: [], loading: false, error: 'Failed to fetch prescriptions', totalCount: 0 });
      renderComponent();
      expect(screen.getByText('Failed to fetch prescriptions')).toBeInTheDocument();
    });

    it('shows loading indicator for Pendings tab', () => {
      mockUsePrescriptionsPending.mockReturnValue({ data: [], loading: true, error: null, totalCount: 0 });
      renderComponent();
      fireEvent.click(screen.getByText('Pendings').closest('button')!);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows error for Pendings tab', () => {
      mockUsePrescriptionsPending.mockReturnValue({ data: [], loading: false, error: 'Failed to fetch pending prescriptions', totalCount: 0 });
      renderComponent();
      fireEvent.click(screen.getByText('Pendings').closest('button')!);
      expect(screen.getByText('Failed to fetch pending prescriptions')).toBeInTheDocument();
    });

    it('shows empty message when no received prescriptions', () => {
      mockUsePrescriptionsReceived.mockReturnValue({ data: [], loading: false, error: null, totalCount: 0 });
      renderComponent();
      expect(screen.getByText('No prescriptions found.')).toBeInTheDocument();
    });

    it('shows empty message when no pending prescriptions in Pendings tab', () => {
      mockUsePrescriptionsPending.mockReturnValue({ data: [], loading: false, error: null, totalCount: 0 });
      renderComponent();
      fireEvent.click(screen.getByText('Pendings').closest('button')!);
      expect(screen.getByText('No pending prescriptions found.')).toBeInTheDocument();
    });
  });

  describe('onCountLoaded callback', () => {
    it('calls onCountLoaded with total received count', () => {
      const onCountLoaded = vi.fn();
      renderComponent({ onCountLoaded });
      expect(onCountLoaded).toHaveBeenCalledWith(3);
    });
  });

  describe('Row click navigation', () => {
    it('navigates to visit-details on received row click', () => {
      renderComponent();
      const patientNames = screen.getAllByText('Sarrah Paul');
      const row = patientNames[0].closest('.rounded-xl');
      fireEvent.click(row!);
      expect(mockNavigate).toHaveBeenCalledWith('/visit-details/r-1');
    });

    it('navigates to visit-details on pending row click', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Pendings').closest('button')!);
      const patientNames = screen.getAllByText('Ravi Kumar');
      const row = patientNames[0].closest('.rounded-xl');
      fireEvent.click(row!);
      expect(mockNavigate).toHaveBeenCalledWith('/visit-details/p-1');
    });
  });
});
