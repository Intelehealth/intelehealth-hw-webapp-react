import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrescriptionsReceived } from '../../../modules/dashboard/prescriptions-received.component';

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

describe('PrescriptionsReceived', () => {
  beforeEach(() => {
    mockUsePrescriptionsReceived.mockReturnValue(defaultReceivedState);
    mockUsePrescriptionsPending.mockReturnValue(defaultPendingState);
  });

  describe('Initial render', () => {
    it('renders without crashing', () => {
      expect(() => render(<PrescriptionsReceived />)).not.toThrow();
    });

    it('renders header title', () => {
      render(<PrescriptionsReceived />);
      expect(screen.getByText('Prescriptions')).toBeInTheDocument();
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

    it('renders Received and Pending tab buttons', () => {
      render(<PrescriptionsReceived />);
      expect(screen.getByText('Received')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
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

    it('does not render Show all footer when data has 6 or fewer rows', () => {
      render(<PrescriptionsReceived />);
      expect(screen.queryByText('Show all →')).not.toBeInTheDocument();
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

    it('clicking Pending tab sets it as active', () => {
      render(<PrescriptionsReceived />);
      const pendingsTab = screen.getByText('Pending').closest('button')!;
      fireEvent.click(pendingsTab);
      expect(pendingsTab).toHaveClass('border-indigo-600');
      expect(pendingsTab).toHaveClass('text-indigo-600');
    });

    it('inactive tab has transparent border', () => {
      render(<PrescriptionsReceived />);
      const receivedTab = screen.getByText('Received').closest('button')!;
      const pendingsTab = screen.getByText('Pending').closest('button')!;
      fireEvent.click(pendingsTab);
      expect(receivedTab).toHaveClass('border-transparent');
    });

    it('switching tabs toggles active styling', () => {
      render(<PrescriptionsReceived />);
      const receivedTab = screen.getByText('Received').closest('button')!;
      const pendingsTab = screen.getByText('Pending').closest('button')!;

      fireEvent.click(receivedTab);
      expect(receivedTab).toHaveClass('border-indigo-600');
      expect(pendingsTab).toHaveClass('border-transparent');

      fireEvent.click(pendingsTab);
      expect(pendingsTab).toHaveClass('border-indigo-600');
      expect(receivedTab).toHaveClass('border-transparent');
    });

    it('shows pending prescriptions data when Pending tab is active', () => {
      render(<PrescriptionsReceived />);
      fireEvent.click(screen.getByText('Pending').closest('button')!);
      expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThan(0);
    });

    it('shows Uploaded column header in Pending tab', () => {
      render(<PrescriptionsReceived />);
      fireEvent.click(screen.getByText('Pending').closest('button')!);
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

    it('shows loading indicator for Pending tab', () => {
      mockUsePrescriptionsPending.mockReturnValue({ data: [], loading: true, error: null, totalCount: 0 });
      render(<PrescriptionsReceived />);
      fireEvent.click(screen.getByText('Pending').closest('button')!);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows error for Pending tab', () => {
      mockUsePrescriptionsPending.mockReturnValue({ data: [], loading: false, error: 'Failed to fetch pending prescriptions', totalCount: 0 });
      render(<PrescriptionsReceived />);
      fireEvent.click(screen.getByText('Pending').closest('button')!);
      expect(screen.getByText('Failed to fetch pending prescriptions')).toBeInTheDocument();
    });

    it('shows empty message when no received prescriptions', () => {
      mockUsePrescriptionsReceived.mockReturnValue({ data: [], loading: false, error: null, totalCount: 0 });
      render(<PrescriptionsReceived />);
      expect(screen.getByText('No prescriptions found.')).toBeInTheDocument();
    });

    it('shows empty message when no pending prescriptions in Pending tab', () => {
      mockUsePrescriptionsPending.mockReturnValue({ data: [], loading: false, error: null, totalCount: 0 });
      render(<PrescriptionsReceived />);
      fireEvent.click(screen.getByText('Pending').closest('button')!);
      expect(screen.getByText('No pending prescriptions found.')).toBeInTheDocument();
    });
  });

  describe('onCountLoaded callback', () => {
    it('calls onCountLoaded with total received count', () => {
      const onCountLoaded = vi.fn();
      render(<PrescriptionsReceived onCountLoaded={onCountLoaded} />);
      expect(onCountLoaded).toHaveBeenCalledWith(3);
    });

    it('does not throw when onCountLoaded is not provided', () => {
      expect(() => render(<PrescriptionsReceived />)).not.toThrow();
    });
  });

  describe('initialRowCount prop', () => {
    it('passes initialRowCount to ReusableGridTable on Received tab', () => {
      render(<PrescriptionsReceived initialRowCount={2} />);
      // With initialRowCount=2, only 2 of 3 received patients should show
      expect(screen.getAllByText('Sarrah Paul').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Nikita Agrawal').length).toBeGreaterThan(0);
      expect(screen.queryByText('Suresh Deshmukh')).not.toBeInTheDocument();
    });

    it('passes initialRowCount to ReusableGridTable on Pending tab', () => {
      render(<PrescriptionsReceived initialRowCount={5} />);
      fireEvent.click(screen.getByText('Pending').closest('button')!);
      expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThan(0);
    });

    it('shows Show all footer when data exceeds initialRowCount', () => {
      render(<PrescriptionsReceived initialRowCount={2} />);
      expect(screen.getByText('Show all →')).toBeInTheDocument();
    });

    it('uses default row count when initialRowCount is not provided', () => {
      render(<PrescriptionsReceived />);
      // 3 rows < default 6, so all should show and no footer
      expect(screen.getAllByText('Sarrah Paul').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Suresh Deshmukh').length).toBeGreaterThan(0);
      expect(screen.queryByText('Show all →')).not.toBeInTheDocument();
    });
  });

  describe('Search filtering on Pending tab', () => {
    it('filters Pending tab by patient name', () => {
      render(<PrescriptionsReceived />);
      fireEvent.click(screen.getByText('Pending').closest('button')!);
      const input = screen.getByPlaceholderText('Find patient');
      fireEvent.change(input, { target: { value: 'Ravi' } });
      expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThan(0);
    });

    it('shows empty message when search has no Pending matches', () => {
      render(<PrescriptionsReceived />);
      fireEvent.click(screen.getByText('Pending').closest('button')!);
      const input = screen.getByPlaceholderText('Find patient');
      fireEvent.change(input, { target: { value: 'nonexistent' } });
      expect(screen.getByText('No pending prescriptions found.')).toBeInTheDocument();
    });
  });

  describe('Layout structure', () => {
    it('renders with flex layout for height chain', () => {
      const { container } = render(<PrescriptionsReceived />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveClass('flex', 'flex-col', 'flex-1', 'min-h-0');
    });

    it('renders header with shrink-0 class', () => {
      const { container } = render(<PrescriptionsReceived />);
      const header = container.querySelector('.shrink-0');
      expect(header).toBeInTheDocument();
    });

    it('renders tabs section with shrink-0 class', () => {
      const { container } = render(<PrescriptionsReceived />);
      const shrinkElements = container.querySelectorAll('.shrink-0');
      expect(shrinkElements.length).toBeGreaterThanOrEqual(2);
    });
  });
});
