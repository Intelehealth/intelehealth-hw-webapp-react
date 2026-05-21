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
      expect(screen.getByText('Prescriptions')).toBeInTheDocument();
    });

    it('renders sort icons next to search', () => {
      renderComponent();
      expect(screen.getAllByAltText('sort-asc').length).toBeGreaterThan(0);
      expect(screen.getAllByAltText('sort-desc').length).toBeGreaterThan(0);
    });

    it('renders search input with placeholder', () => {
      renderComponent();
      expect(screen.getByPlaceholderText('Find patient')).toBeInTheDocument();
    });

    it('renders search icon', () => {
      renderComponent();
      expect(screen.getByAltText('search')).toBeInTheDocument();
    });

    it('renders Received and Pending tab buttons', () => {
      renderComponent();
      expect(screen.getByText('Received')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
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

    it('does not render Show all footer when data has 6 or fewer rows', () => {
      renderComponent();
      expect(screen.queryByText('Show all →')).not.toBeInTheDocument();
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

    it('clicking Pending tab sets it as active', () => {
      renderComponent();
      const pendingsTab = screen.getByText('Pending').closest('button')!;
      fireEvent.click(pendingsTab);
      expect(pendingsTab).toHaveClass('border-indigo-600');
      expect(pendingsTab).toHaveClass('text-indigo-600');
    });

    it('inactive tab has transparent border', () => {
      renderComponent();
      const receivedTab = screen.getByText('Received').closest('button')!;
      const pendingsTab = screen.getByText('Pending').closest('button')!;
      fireEvent.click(pendingsTab);
      expect(receivedTab).toHaveClass('border-transparent');
    });

    it('switching tabs toggles active styling', () => {
      renderComponent();
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
      renderComponent();
      fireEvent.click(screen.getByText('Pending').closest('button')!);
      expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThan(0);
    });

    it('shows Uploaded column header in Pending tab', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Pending').closest('button')!);
      expect(screen.getAllByText('Uploaded').length).toBeGreaterThan(0);
    });

    it('renders the visit date in the pending Uploaded column (backend only emits visitCreatedDate)', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Pending').closest('button')!);
      // Uploaded column now sources from visitCreatedDate, so the date is the
      // visible value — the Pending row has visitCreatedDate '2025-04-21'.
      expect(screen.getAllByText('2025-04-21').length).toBeGreaterThan(0);
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

    it('shows loading indicator for Pending tab', () => {
      mockUsePrescriptionsPending.mockReturnValue({ data: [], loading: true, error: null, totalCount: 0 });
      renderComponent();
      fireEvent.click(screen.getByText('Pending').closest('button')!);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows error for Pending tab', () => {
      mockUsePrescriptionsPending.mockReturnValue({ data: [], loading: false, error: 'Failed to fetch pending prescriptions', totalCount: 0 });
      renderComponent();
      fireEvent.click(screen.getByText('Pending').closest('button')!);
      expect(screen.getByText('Failed to fetch pending prescriptions')).toBeInTheDocument();
    });

    it('shows empty message when no received prescriptions', () => {
      mockUsePrescriptionsReceived.mockReturnValue({ data: [], loading: false, error: null, totalCount: 0 });
      renderComponent();
      expect(screen.getByText('No prescriptions found.')).toBeInTheDocument();
    });

    it('shows empty message when no pending prescriptions in Pending tab', () => {
      mockUsePrescriptionsPending.mockReturnValue({ data: [], loading: false, error: null, totalCount: 0 });
      renderComponent();
      fireEvent.click(screen.getByText('Pending').closest('button')!);
      expect(screen.getByText('No pending prescriptions found.')).toBeInTheDocument();
    });
  });

  describe('onCountLoaded callback', () => {
    it('calls onCountLoaded with total received count', () => {
      const onCountLoaded = vi.fn();
      renderComponent({ onCountLoaded });
      expect(onCountLoaded).toHaveBeenCalledWith(3);
    });

    it('does not throw when onCountLoaded is not provided', () => {
      expect(() => renderComponent()).not.toThrow();
    });
  });

  describe('initialRowCount prop', () => {
    it('passes initialRowCount to ReusableGridTable on Received tab', () => {
      renderComponent({ initialRowCount: 2 });
      // With initialRowCount=2, only 2 of 3 received patients should show
      expect(screen.getAllByText('Sarrah Paul').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Nikita Agrawal').length).toBeGreaterThan(0);
      expect(screen.queryByText('Suresh Deshmukh')).not.toBeInTheDocument();
    });

    it('passes initialRowCount to ReusableGridTable on Pending tab', () => {
      renderComponent({ initialRowCount: 5 });
      fireEvent.click(screen.getByText('Pending').closest('button')!);
      expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThan(0);
    });

    it('shows Show all footer when data exceeds initialRowCount', () => {
      renderComponent({ initialRowCount: 2 });
      expect(screen.getByText('Show all →')).toBeInTheDocument();
    });

    it('uses default row count when initialRowCount is not provided', () => {
      renderComponent();
      // 3 rows < default 6, so all should show and no footer
      expect(screen.getAllByText('Sarrah Paul').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Suresh Deshmukh').length).toBeGreaterThan(0);
      expect(screen.queryByText('Show all →')).not.toBeInTheDocument();
    });
  });

  describe('Search filtering on Pending tab', () => {
    it('filters Pending tab by patient name', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Pending').closest('button')!);
      const input = screen.getByPlaceholderText('Find patient');
      fireEvent.change(input, { target: { value: 'Ravi' } });
      expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThan(0);
    });

    it('shows empty message when search has no Pending matches', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Pending').closest('button')!);
      const input = screen.getByPlaceholderText('Find patient');
      fireEvent.change(input, { target: { value: 'nonexistent' } });
      expect(screen.getByText('No pending prescriptions found.')).toBeInTheDocument();
    });
  });

  describe('Sorting by column header', () => {
    it('clicking Patient header sorts received data ascending', () => {
      renderComponent();
      const patientHeaders = screen.getAllByText('Patient');
      fireEvent.click(patientHeaders[0]); // asc

      const ascIcons = screen.getAllByAltText('sort-asc');
      expect(ascIcons.some(el => el.classList.contains('opacity-100'))).toBe(true);

      // Nikita < Sarrah < Suresh alphabetically
      const rows = document.querySelectorAll('.rounded-xl');
      const patientTexts = Array.from(rows)
        .map(r => r.textContent ?? '')
        .filter(t => t.includes('Nikita') || t.includes('Sarrah') || t.includes('Suresh'));
      if (patientTexts.length >= 2) {
        const nikitaIndex = patientTexts.findIndex(t => t.includes('Nikita'));
        const sureshIndex = patientTexts.findIndex(t => t.includes('Suresh'));
        expect(nikitaIndex).toBeLessThan(sureshIndex);
      }
    });

    it('second click sorts received data descending', () => {
      renderComponent();
      const patientHeaders = screen.getAllByText('Patient');
      fireEvent.click(patientHeaders[0]); // asc
      fireEvent.click(patientHeaders[0]); // desc

      const descIcons = screen.getAllByAltText('sort-desc');
      expect(descIcons.some(el => el.classList.contains('opacity-100'))).toBe(true);
    });

    it('third click removes sort', () => {
      renderComponent();
      const patientHeaders = screen.getAllByText('Patient');
      fireEvent.click(patientHeaders[0]); // asc
      fireEvent.click(patientHeaders[0]); // desc
      fireEvent.click(patientHeaders[0]); // null

      const allSortIcons = [
        ...screen.getAllByAltText('sort-asc'),
        ...screen.getAllByAltText('sort-desc'),
      ];
      allSortIcons.forEach(el => expect(el).not.toHaveClass('opacity-100'));
    });

    it('sorts pending data ascending when Pending tab is active', () => {
      mockUsePrescriptionsPending.mockReturnValue({
        data: [
          { visitUuid: 'p-2', patientName: 'Zara Malik', gender: 'F', age: 29, visitCreatedDate: '2025-04-22', clinicName: 'TM Clinic 2', uploadTimestamp: '10 min ago' },
          { visitUuid: 'p-1', patientName: 'Aarav Shah', gender: 'M', age: 40, visitCreatedDate: '2025-04-21', clinicName: 'TM Clinic 1', uploadTimestamp: '30 min ago' },
        ],
        loading: false,
        error: null,
        totalCount: 2,
      });
      renderComponent();
      fireEvent.click(screen.getByText('Pending').closest('button')!);
      const patientHeaders = screen.getAllByText('Patient');
      fireEvent.click(patientHeaders[0]); // asc

      const rows = document.querySelectorAll('.rounded-xl');
      const rowTexts = Array.from(rows)
        .map(r => r.textContent ?? '')
        .filter(t => t.includes('Aarav') || t.includes('Zara'));
      if (rowTexts.length >= 2) {
        const aaravIndex = rowTexts.findIndex(t => t.includes('Aarav'));
        const zaraIndex = rowTexts.findIndex(t => t.includes('Zara'));
        expect(aaravIndex).toBeLessThan(zaraIndex);
      }
    });

    it('clicking Age header sorts by age', () => {
      renderComponent();
      const ageHeaders = screen.getAllByText('Age');
      fireEvent.click(ageHeaders[0]); // asc

      const ascIcons = screen.getAllByAltText('sort-asc');
      expect(ascIcons.some(el => el.classList.contains('opacity-100'))).toBe(true);
    });
  });

  describe('Name sort button (search area)', () => {
    it('first click sorts ascending — sort-asc icon becomes active', () => {
      renderComponent();
      const sortAscIcon = screen.getAllByAltText('sort-asc')[0];
      fireEvent.click(sortAscIcon); // triggers toggleNameSort via bubbling

      expect(sortAscIcon).toHaveClass('opacity-100');
    });

    it('second click sorts descending — sort-desc icon becomes active', () => {
      renderComponent();
      const sortAscIcon = screen.getAllByAltText('sort-asc')[0];
      const sortDescIcon = screen.getAllByAltText('sort-desc')[0];
      fireEvent.click(sortAscIcon); // asc
      fireEvent.click(sortAscIcon); // desc

      expect(sortDescIcon).toHaveClass('opacity-100');
      expect(sortAscIcon).toHaveClass('opacity-70');
    });

    it('third click clears sort — both icons inactive', () => {
      renderComponent();
      const sortAscIcon = screen.getAllByAltText('sort-asc')[0];
      const sortDescIcon = screen.getAllByAltText('sort-desc')[0];
      fireEvent.click(sortAscIcon); // asc
      fireEvent.click(sortAscIcon); // desc
      fireEvent.click(sortAscIcon); // null

      expect(sortAscIcon).toHaveClass('opacity-70');
      expect(sortDescIcon).toHaveClass('opacity-70');
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

    it('renders tabs section with shrink-0 class', () => {
      const { container } = renderComponent();
      const shrinkElements = container.querySelectorAll('.shrink-0');
      expect(shrinkElements.length).toBeGreaterThanOrEqual(2);
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
      fireEvent.click(screen.getByText('Pending').closest('button')!);
      const patientNames = screen.getAllByText('Ravi Kumar');
      const row = patientNames[0].closest('.rounded-xl');
      fireEvent.click(row!);
      expect(mockNavigate).toHaveBeenCalledWith('/visit-details/p-1');
    });
  });
});
