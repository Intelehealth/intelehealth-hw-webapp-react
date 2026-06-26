import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenVisitsComponent } from '../../../modules/dashboard/open-visits.component';
import { BreadcrumbProvider } from '../../../context/BreadcrumbContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../components/common/filter-module.component', () => ({
  default: ({ onApply }: { onApply: (value: any) => void }) => (
    <div data-testid="filter-module">
      <button
        data-testid="mock-filter-apply"
        onClick={() => onApply({ mode: 'date', from: '2025-04-21', to: null })}
      >
        Mock Apply
      </button>
    </div>
  ),
}));

const mockUseOpenVisits = vi.fn();
const mockUsePriorityVisits = vi.fn();

vi.mock('../../../hooks/useOpenVisits', () => ({
  useOpenVisits: (...args: unknown[]) => mockUseOpenVisits(...args),
}));

vi.mock('../../../hooks/usePriorityVisits', () => ({
  usePriorityVisits: (...args: unknown[]) => mockUsePriorityVisits(...args),
}));

const mockData = [
  {
    visitUuid: 'ov-1',
    patientName: 'Ravi Kumar',
    gender: 'M',
    age: 35,
    visitCreatedDate: '2025-04-21',
    clinicName: 'TM Clinic 1',
    uploadTimestamp: '30 min ago',
  },
  {
    visitUuid: 'ov-2',
    patientName: 'Anita Desai',
    gender: 'F',
    age: 42,
    visitCreatedDate: '2025-04-20',
    clinicName: 'TM Clinic 2',
    uploadTimestamp: '1 hr ago',
    isPriority: true,
  },
  {
    visitUuid: 'ov-3',
    patientName: 'Zara Malik',
    gender: 'F',
    age: 29,
    visitCreatedDate: '2025-04-19',
    clinicName: 'TM Clinic 3',
    uploadTimestamp: '2 hr ago',
  },
];

const mockPriorityData = [
  {
    visitUuid: 'pv-1',
    patientName: 'Anita Desai',
    gender: 'F',
    age: 42,
    visitCreatedDate: '2025-04-20',
    clinicName: 'TM Clinic 2',
    uploadTimestamp: '1 hr ago',
    isPriority: true,
  },
];

const defaultState = {
  data: mockData,
  loading: false,
  error: null,
  totalCount: 3,
};

const defaultPriorityState = {
  data: mockPriorityData,
  loading: false,
  error: null,
  totalCount: 1,
};

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
    mockUseOpenVisits.mockReturnValue(defaultState);
    mockUsePriorityVisits.mockReturnValue(defaultPriorityState);
  });

  describe('Initial render', () => {
    it('renders without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('renders the Open Visits heading', () => {
      renderComponent();
      expect(
        screen.getByRole('heading', { name: 'Open Visits' })
      ).toBeInTheDocument();
    });

    it('renders filter icon next to search', () => {
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

    it('renders column headers', () => {
      renderComponent();
      expect(screen.getAllByText('Patient').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Age').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Visit created').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Clinic').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Gender').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Uploaded').length).toBeGreaterThan(0);
    });

    it('renders all patient rows', () => {
      renderComponent();
      expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Anita Desai').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Zara Malik').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Patient data display', () => {
    it('renders patient ages', () => {
      renderComponent();
      expect(screen.getAllByText('35').length).toBeGreaterThan(0);
      expect(screen.getAllByText('42').length).toBeGreaterThan(0);
    });

    it('renders visit dates', () => {
      renderComponent();
      expect(screen.getAllByText('2025-04-21').length).toBeGreaterThan(0);
      expect(screen.getAllByText('2025-04-20').length).toBeGreaterThan(0);
    });

    it('renders clinic names', () => {
      renderComponent();
      expect(screen.getAllByText('TM Clinic 1').length).toBeGreaterThan(0);
      expect(screen.getAllByText('TM Clinic 2').length).toBeGreaterThan(0);
    });

    it('renders the visit date in the Uploaded column (backend only emits visitCreatedDate)', () => {
      renderComponent();
      // visitCreatedDate now powers both the "Visit created" and "Uploaded"
      // columns since the API does not emit uploadTimestamp. Each date should
      // appear at least twice in the row.
      expect(screen.getAllByText('2025-04-21').length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText('2025-04-20').length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Search filtering', () => {
    it('filters by patient name', () => {
      renderComponent();
      const input = screen.getByPlaceholderText('Find patient');
      fireEvent.change(input, { target: { value: 'Ravi' } });
      expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThan(0);
      expect(screen.queryByText('Anita Desai')).not.toBeInTheDocument();
    });

    it('is case-insensitive', () => {
      renderComponent();
      fireEvent.change(screen.getByPlaceholderText('Find patient'), {
        target: { value: 'anita' },
      });
      expect(screen.getAllByText('Anita Desai').length).toBeGreaterThan(0);
    });

    it('shows empty state when no results match', () => {
      renderComponent();
      fireEvent.change(screen.getByPlaceholderText('Find patient'), {
        target: { value: 'NonExistentXYZ' },
      });
      expect(screen.getByText('No open visits found.')).toBeInTheDocument();
    });
  });

  describe('Loading and error states', () => {
    it('shows loading indicator', () => {
      mockUseOpenVisits.mockReturnValue({ data: [], loading: true, error: null, totalCount: 0 });
      renderComponent();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows error message', () => {
      mockUseOpenVisits.mockReturnValue({ data: [], loading: false, error: 'Failed to fetch', totalCount: 0 });
      renderComponent();
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });

    it('shows empty state when no data', () => {
      mockUseOpenVisits.mockReturnValue({ data: [], loading: false, error: null, totalCount: 0 });
      renderComponent();
      expect(screen.getByText('No open visits found.')).toBeInTheDocument();
    });
  });

  describe('Sorting by column header', () => {
    it('clicking Patient header sorts ascending — Anita before Ravi before Zara', () => {
      renderComponent();
      const patientHeaders = screen.getAllByText('Patient');
      fireEvent.click(patientHeaders[0]); // asc

      const ascIcons = screen.getAllByAltText('sort-asc');
      expect(ascIcons.some(el => el.classList.contains('opacity-100'))).toBe(true);

      const rows = document.querySelectorAll('.rounded-xl');
      const rowTexts = Array.from(rows)
        .map(r => r.textContent ?? '')
        .filter(t => t.includes('Anita') || t.includes('Ravi') || t.includes('Zara'));
      if (rowTexts.length >= 3) {
        const anitaIndex = rowTexts.findIndex(t => t.includes('Anita'));
        const zaraIndex = rowTexts.findIndex(t => t.includes('Zara'));
        expect(anitaIndex).toBeLessThan(zaraIndex);
      }
    });

    it('second click on Patient header sorts descending — Zara before Anita', () => {
      renderComponent();
      const patientHeaders = screen.getAllByText('Patient');
      fireEvent.click(patientHeaders[0]); // asc
      fireEvent.click(patientHeaders[0]); // desc

      const descIcons = screen.getAllByAltText('sort-desc');
      expect(descIcons.some(el => el.classList.contains('opacity-100'))).toBe(true);

      const rows = document.querySelectorAll('.rounded-xl');
      const rowTexts = Array.from(rows)
        .map(r => r.textContent ?? '')
        .filter(t => t.includes('Anita') || t.includes('Ravi') || t.includes('Zara'));
      if (rowTexts.length >= 3) {
        const zaraIndex = rowTexts.findIndex(t => t.includes('Zara'));
        const anitaIndex = rowTexts.findIndex(t => t.includes('Anita'));
        expect(zaraIndex).toBeLessThan(anitaIndex);
      }
    });

    it('third click removes sort icon', () => {
      renderComponent();
      const patientHeaders = screen.getAllByText('Patient');
      fireEvent.click(patientHeaders[0]); // asc
      fireEvent.click(patientHeaders[0]); // desc
      fireEvent.click(patientHeaders[0]); // null

      const allSortIcons = [
        ...screen.queryAllByAltText('sort-asc'),
        ...screen.queryAllByAltText('sort-desc'),
      ];
      allSortIcons.forEach(el => expect(el).not.toHaveClass('opacity-100'));
    });

    it('clicking Age header sorts by age', () => {
      renderComponent();
      const ageHeaders = screen.getAllByText('Age');
      fireEvent.click(ageHeaders[0]); // asc

      const ascIcons = screen.getAllByAltText('sort-asc');
      expect(ascIcons.some(el => el.classList.contains('opacity-100'))).toBe(true);
    });

    it('clicking a different column resets previous sort', () => {
      renderComponent();
      const patientHeaders = screen.getAllByText('Patient');
      const ageHeaders = screen.getAllByText('Age');
      fireEvent.click(patientHeaders[0]); // asc by patient
      fireEvent.click(ageHeaders[0]); // asc by age

      // Only one sort-asc icon should have opacity-100 (the active Age column)
      const ascIcons = screen.getAllByAltText('sort-asc');
      expect(ascIcons.filter(el => el.classList.contains('opacity-100')).length).toBe(1);
    });
  });

  describe('Filter icon (search area)', () => {
    it('renders the filter icon next to the search input', () => {
      renderComponent();
      const filterIcon = screen.getByAltText('filter');
      expect(filterIcon).toBeInTheDocument();
      expect(filterIcon).toHaveClass('w-5', 'h-5');
    });

    it('filter icon has hover styling', () => {
      renderComponent();
      const filterIcon = screen.getByAltText('filter');
      expect(filterIcon).toHaveClass('cursor-pointer', 'hover:opacity-70', 'transition');
    });
  });

  describe('Filter module', () => {
    it('opens filter module when filter icon is clicked', () => {
      renderComponent();
      expect(screen.queryByTestId('filter-module')).not.toBeInTheDocument();
      fireEvent.click(screen.getByAltText('filter'));
      expect(screen.getByTestId('filter-module')).toBeInTheDocument();
    });

    it('closes filter module when filter icon is clicked again', () => {
      renderComponent();
      fireEvent.click(screen.getByAltText('filter'));
      expect(screen.getByTestId('filter-module')).toBeInTheDocument();
      fireEvent.click(screen.getByAltText('filter'));
      expect(screen.queryByTestId('filter-module')).not.toBeInTheDocument();
    });

    it('closes filter module on outside click', () => {
      renderComponent();
      fireEvent.click(screen.getByAltText('filter'));
      expect(screen.getByTestId('filter-module')).toBeInTheDocument();
      fireEvent.mouseDown(document.body);
      expect(screen.queryByTestId('filter-module')).not.toBeInTheDocument();
    });

    it('does not close filter module on inside click', () => {
      renderComponent();
      fireEvent.click(screen.getByAltText('filter'));
      expect(screen.getByTestId('filter-module')).toBeInTheDocument();
      fireEvent.mouseDown(screen.getByTestId('filter-module'));
      expect(screen.getByTestId('filter-module')).toBeInTheDocument();
    });

    it('closes filter module after applying filter', () => {
      renderComponent();
      fireEvent.click(screen.getByAltText('filter'));
      fireEvent.click(screen.getByTestId('mock-filter-apply'));
      expect(screen.queryByTestId('filter-module')).not.toBeInTheDocument();
    });

    it('applies date filter to visits', () => {
      const filteredData = [mockData[0]]; // Only Ravi Kumar (2025-04-21)
      mockUseOpenVisits.mockImplementation((fromDate?: string) => {
        if (fromDate) {
          return { data: filteredData, loading: false, error: null, totalCount: 1 };
        }
        return defaultState;
      });
      mockUsePriorityVisits.mockImplementation((fromDate?: string) => {
        if (fromDate) {
          return { data: [], loading: false, error: null, totalCount: 0 };
        }
        return defaultPriorityState;
      });
      renderComponent();
      fireEvent.click(screen.getByAltText('filter'));
      fireEvent.click(screen.getByTestId('mock-filter-apply'));
      // Server-side filter for 2025-04-21 returns only 'Ravi Kumar'
      expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThanOrEqual(1);
      expect(screen.queryByText('Anita Desai')).not.toBeInTheDocument();
      expect(screen.queryByText('Zara Malik')).not.toBeInTheDocument();
    });
  });

  describe('Row click navigation', () => {
    it('navigates to visit-details on row click', () => {
      renderComponent();
      const raviNodes = screen.getAllByText('Ravi Kumar');
      const clickable = raviNodes[0].closest('.rounded-xl');
      if (clickable) fireEvent.click(clickable);
      expect(mockNavigate).toHaveBeenCalledWith('/visit-details/ov-1', { state: { fromLabel: 'Open Visits', fromPath: '/open-visits' } });
    });

    it('navigates without state when rendered on dashboard', () => {
      render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <BreadcrumbProvider>
            <OpenVisitsComponent />
          </BreadcrumbProvider>
        </MemoryRouter>
      );
      const raviNodes = screen.getAllByText('Ravi Kumar');
      const clickable = raviNodes[0].closest('.rounded-xl');
      if (clickable) fireEvent.click(clickable);
      expect(mockNavigate).toHaveBeenCalledWith('/visit-details/ov-1', undefined);
    });
  });

  describe('initialRowCount prop', () => {
    it('passes initialRowCount to ReusableGridTable', () => {
      renderComponent({ initialRowCount: 2 });
      expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Anita Desai').length).toBeGreaterThan(0);
      expect(screen.queryByText('Zara Malik')).not.toBeInTheDocument();
    });

    it('shows Show all footer when data exceeds initialRowCount', () => {
      renderComponent({ initialRowCount: 2 });
      expect(screen.getByText('Show all →')).toBeInTheDocument();
    });
  });

  describe('Tabs (Open Visits / Priority Visits)', () => {
    it('renders both tab buttons', () => {
      renderComponent();
      const openTab = screen
        .getAllByText('Open Visits')
        .find(el => el.closest('button'));
      const priorityTab = screen.getByText('Priority Visits').closest('button');
      expect(openTab).toBeDefined();
      expect(priorityTab).toBeInTheDocument();
    });

    it('Open Visits tab is active by default', () => {
      renderComponent();
      const openTab = screen
        .getAllByText('Open Visits')
        .map(el => el.closest('button'))
        .find((b): b is HTMLButtonElement => b !== null)!;
      expect(openTab).toHaveClass('border-indigo-600');
      expect(openTab).toHaveClass('text-indigo-600');
    });

    it('Priority Visits tab displays rows from the dedicated priority endpoint', () => {
      renderComponent();
      const priorityTab = screen
        .getByText('Priority Visits')
        .closest('button')!;
      fireEvent.click(priorityTab);
      // Only Anita is present in the priority-visits payload; rows that exist
      // in the open-visits payload must not bleed through.
      expect(screen.getAllByText('Anita Desai').length).toBeGreaterThan(0);
      expect(screen.queryByText('Ravi Kumar')).not.toBeInTheDocument();
      expect(screen.queryByText('Zara Malik')).not.toBeInTheDocument();
    });

    it('shows "No priority visits found." when the priority endpoint returns no rows', () => {
      mockUsePriorityVisits.mockReturnValue({
        data: [],
        loading: false,
        error: null,
        totalCount: 0,
      });
      renderComponent();
      fireEvent.click(screen.getByText('Priority Visits').closest('button')!);
      expect(
        screen.getByText('No priority visits found.')
      ).toBeInTheDocument();
    });

    it('Priority tab surfaces loading state from the priority hook', () => {
      mockUsePriorityVisits.mockReturnValue({
        data: [],
        loading: true,
        error: null,
        totalCount: 0,
      });
      renderComponent();
      fireEvent.click(screen.getByText('Priority Visits').closest('button')!);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('Priority tab surfaces error from the priority hook', () => {
      mockUsePriorityVisits.mockReturnValue({
        data: [],
        loading: false,
        error: 'Failed to fetch priority visits',
        totalCount: 0,
      });
      renderComponent();
      fireEvent.click(screen.getByText('Priority Visits').closest('button')!);
      expect(
        screen.getByText('Failed to fetch priority visits')
      ).toBeInTheDocument();
    });

    it('switching tabs toggles active styling', () => {
      renderComponent();
      const openTab = screen
        .getAllByText('Open Visits')
        .map(el => el.closest('button'))
        .find((b): b is HTMLButtonElement => b !== null)!;
      const priorityTab = screen
        .getByText('Priority Visits')
        .closest('button')!;

      fireEvent.click(priorityTab);
      expect(priorityTab).toHaveClass('border-indigo-600');
      expect(openTab).toHaveClass('border-transparent');

      fireEvent.click(openTab);
      expect(openTab).toHaveClass('border-indigo-600');
      expect(priorityTab).toHaveClass('border-transparent');
    });
  });
});
