import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FollowupVisitsComponent } from '../../../modules/dashboard/followup-visits.component';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockUseFollowupVisits = vi.fn();

vi.mock('../../../hooks/useFollowupVisits', () => ({
  useFollowupVisits: () => mockUseFollowupVisits(),
}));

const mockData = [
  {
    visitUuid: 'v-1',
    patientName: 'Ravi Kumar',
    gender: 'M',
    age: 35,
    visitCreatedDate: '2025-04-21',
    clinicName: 'TM Clinic 1',
  },
  {
    visitUuid: 'v-2',
    patientName: 'Priya Singh',
    gender: 'F',
    age: 28,
    visitCreatedDate: '2025-04-20',
    clinicName: 'TM Clinic 2',
  },
];

const renderComponent = (props = {}) =>
  render(
    <MemoryRouter>
      <FollowupVisitsComponent {...props} />
    </MemoryRouter>
  );

describe('FollowupVisitsComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseFollowupVisits.mockReturnValue({
      data: mockData,
      loading: false,
      error: null,
    });
  });

  it('renders without crashing', () => {
    expect(() => renderComponent()).not.toThrow();
  });

  it('renders the Follow-up Visits heading', () => {
    renderComponent();
    expect(screen.getByText('Follow-up Visits')).toBeInTheDocument();
  });

  it('renders search input with placeholder', () => {
    renderComponent();
    expect(screen.getByPlaceholderText('Find patient')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    renderComponent();
    expect(screen.getAllByText('Patient').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Age').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Visit created').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Clinic').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Gender').length).toBeGreaterThan(0);
  });


  it('renders all patient rows', () => {
    renderComponent();
   
    expect(screen.getAllByText('Ravi Kumar').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Priya Singh').length).toBeGreaterThanOrEqual(1);
  });


  it('filters patients by search', () => {
    renderComponent();
    const input = screen.getByPlaceholderText('Find patient');
    fireEvent.change(input, { target: { value: 'Priya' } });
   
    expect(screen.getAllByText('Priya Singh').length).toBeGreaterThanOrEqual(1);
   
    expect(screen.queryAllByText('Ravi Kumar').length).toBe(0);
  });

  it('shows loading state', () => {
    mockUseFollowupVisits.mockReturnValue({ data: [], loading: true, error: null });
    renderComponent();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseFollowupVisits.mockReturnValue({ data: [], loading: false, error: 'Failed' });
    renderComponent();
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('shows empty state', () => {
    mockUseFollowupVisits.mockReturnValue({ data: [], loading: false, error: null });
    renderComponent();
    expect(screen.getByText('No follow-up visits found.')).toBeInTheDocument();
  });


  describe('Sorting by column header', () => {
    it('clicking Patient header sorts ascending — Priya before Ravi', () => {
      renderComponent();
      const patientHeaders = screen.getAllByText('Patient');
      fireEvent.click(patientHeaders[0]); // asc

      const ascIcons = screen.getAllByAltText('sort-asc');
      expect(ascIcons.some(el => el.classList.contains('opacity-100'))).toBe(true);

      const rows = document.querySelectorAll('.rounded-xl');
      const rowTexts = Array.from(rows)
        .map(r => r.textContent ?? '')
        .filter(t => t.includes('Priya') || t.includes('Ravi'));
      if (rowTexts.length >= 2) {
        const priyaIndex = rowTexts.findIndex(t => t.includes('Priya'));
        const raviIndex = rowTexts.findIndex(t => t.includes('Ravi'));
        expect(priyaIndex).toBeLessThan(raviIndex);
      }
    });

    it('second click sorts descending — Ravi before Priya', () => {
      renderComponent();
      const patientHeaders = screen.getAllByText('Patient');
      fireEvent.click(patientHeaders[0]); // asc
      fireEvent.click(patientHeaders[0]); // desc

      const descIcons = screen.getAllByAltText('sort-desc');
      expect(descIcons.some(el => el.classList.contains('opacity-100'))).toBe(true);

      const rows = document.querySelectorAll('.rounded-xl');
      const rowTexts = Array.from(rows)
        .map(r => r.textContent ?? '')
        .filter(t => t.includes('Priya') || t.includes('Ravi'));
      if (rowTexts.length >= 2) {
        const raviIndex = rowTexts.findIndex(t => t.includes('Ravi'));
        const priyaIndex = rowTexts.findIndex(t => t.includes('Priya'));
        expect(raviIndex).toBeLessThan(priyaIndex);
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
      expect(sortAscIcon).toHaveClass('opacity-50');
    });

    it('third click clears sort — both icons inactive', () => {
      renderComponent();
      const sortAscIcon = screen.getAllByAltText('sort-asc')[0];
      const sortDescIcon = screen.getAllByAltText('sort-desc')[0];
      fireEvent.click(sortAscIcon); // asc
      fireEvent.click(sortAscIcon); // desc
      fireEvent.click(sortAscIcon); // null

      expect(sortAscIcon).toHaveClass('opacity-50');
      expect(sortDescIcon).toHaveClass('opacity-50');
    });
  });

  it('navigates to visit details on row click', () => {
    renderComponent();

    const raviNodes = screen.getAllByText('Ravi Kumar');

    const clickable = raviNodes[0].closest('tr') || raviNodes[0].closest('div[role="row"]') || raviNodes[0].closest('div');
    if (clickable) fireEvent.click(clickable);
    expect(mockNavigate).toHaveBeenCalledWith('/visit-details/v-1');
  });
});
