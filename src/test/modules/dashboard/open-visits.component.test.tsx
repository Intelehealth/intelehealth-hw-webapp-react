import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OpenVisitsComponent } from '../../../modules/dashboard/open-visits.component';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUseOpenVisits = vi.fn();

vi.mock('../../../hooks/useOpenVisits', () => ({
  useOpenVisits: () => mockUseOpenVisits(),
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

const defaultState = {
  data: mockData,
  loading: false,
  error: null,
  totalCount: 3,
};

const renderComponent = (props = {}) =>
  render(
    <MemoryRouter>
      <OpenVisitsComponent {...props} />
    </MemoryRouter>
  );

describe('OpenVisitsComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOpenVisits.mockReturnValue(defaultState);
  });

  describe('Initial render', () => {
    it('renders without crashing', () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it('renders the Open Visits heading', () => {
      renderComponent();
      expect(screen.getByText('Open Visits')).toBeInTheDocument();
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

    it('renders upload timestamps', () => {
      renderComponent();
      expect(screen.getAllByText('30 min ago').length).toBeGreaterThan(0);
      expect(screen.getAllByText('1 hr ago').length).toBeGreaterThan(0);
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
        ...screen.getAllByAltText('sort-asc'),
        ...screen.getAllByAltText('sort-desc'),
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

  describe('Row click navigation', () => {
    it('navigates to visit-details on row click', () => {
      renderComponent();
      const raviNodes = screen.getAllByText('Ravi Kumar');
      const clickable = raviNodes[0].closest('.rounded-xl');
      if (clickable) fireEvent.click(clickable);
      expect(mockNavigate).toHaveBeenCalledWith('/visit-details/ov-1');
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
});
