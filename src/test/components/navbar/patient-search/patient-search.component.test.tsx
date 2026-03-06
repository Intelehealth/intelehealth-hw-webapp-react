import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../../../components/navbar/patient-search/patient-search.hook';
import PatientSearch from '../../../../components/navbar/patient-search/patient-search.component';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockPatients: Patient[] = [
  {
    uuid: 'p-1',
    identifiers: [{ identifier: 'OP-001', identifierType: { name: 'OpenMRS ID' } }],
    person: { display: 'Alice Smith', gender: 'F', age: 30, attributes: [] },
  },
  {
    uuid: 'p-2',
    identifiers: [{ identifier: 'OP-002', identifierType: { name: 'OpenMRS ID' } }],
    person: { display: 'Bob Jones', gender: 'M', age: 45, attributes: [] },
  },
];

const mockUsePatientSearch = vi.fn((_searchTerm: string) => ({
  patients: [] as Patient[],
  loading: false,
}));

vi.mock(
  '../../../../components/navbar/patient-search/patient-search.hook',
  () => ({
    usePatientSearch: (searchTerm: string) => mockUsePatientSearch(searchTerm),
  })
);

const renderComponent = () =>
  render(
    <PatientSearch />
  );

describe('PatientSearch', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUsePatientSearch.mockReturnValue({ patients: [], loading: false });
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

  it('should set aria-expanded true on focus', () => {
    renderComponent();
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
  });

  it('should not show dropdown when search term is empty', () => {
    renderComponent();
    fireEvent.focus(screen.getByRole('combobox'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should show dropdown when typing a search term', () => {
    mockUsePatientSearch.mockReturnValue({ patients: [], loading: false });
    renderComponent();
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Ali' } });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('should display "No results found" when no patients match', () => {
    mockUsePatientSearch.mockReturnValue({ patients: [], loading: false });
    renderComponent();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'xyz' } });
    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('should display "Searching..." when loading', () => {
    mockUsePatientSearch.mockReturnValue({ patients: [], loading: true });
    renderComponent();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Ali' } });
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('should display patient results in dropdown', () => {
    mockUsePatientSearch.mockReturnValue({ patients: mockPatients, loading: false });
    renderComponent();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Ali' } });
    expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
    expect(screen.getByText(/Bob Jones/)).toBeInTheDocument();
  });

  it('should show result count in dropdown', () => {
    mockUsePatientSearch.mockReturnValue({ patients: mockPatients, loading: false });
    renderComponent();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Ali' } });
    expect(screen.getByText('Patients (2 results)')).toBeInTheDocument();
  });

  it('should navigate to patient page on selection', () => {
    mockUsePatientSearch.mockReturnValue({ patients: mockPatients, loading: false });
    renderComponent();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Ali' } });
    fireEvent.click(screen.getByText(/Alice Smith/));
    expect(mockNavigate).toHaveBeenCalledWith('/patient/p-1');
  });

  it('should clear search term and hide dropdown after selection', () => {
    mockUsePatientSearch.mockReturnValue({ patients: mockPatients, loading: false });
    renderComponent();
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Ali' } });
    fireEvent.click(screen.getByText(/Alice Smith/));
    expect(input).toHaveValue('');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should close dropdown on Escape key', () => {
    mockUsePatientSearch.mockReturnValue({ patients: mockPatients, loading: false });
    renderComponent();
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Ali' } });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should navigate active index with ArrowDown and ArrowUp', () => {
    mockUsePatientSearch.mockReturnValue({ patients: mockPatients, loading: false });
    renderComponent();
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Ali' } });

    // ArrowDown selects first item
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    // ArrowDown again selects second item
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');

    // ArrowUp goes back to first
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('should select patient on Enter when active index is set', () => {
    mockUsePatientSearch.mockReturnValue({ patients: mockPatients, loading: false });
    renderComponent();
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Ali' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockNavigate).toHaveBeenCalledWith('/patient/p-1');
  });

  it('should not navigate on Enter when no active index', () => {
    mockUsePatientSearch.mockReturnValue({ patients: mockPatients, loading: false });
    renderComponent();
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Ali' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should close dropdown when clicking outside', () => {
    mockUsePatientSearch.mockReturnValue({ patients: mockPatients, loading: false });
    renderComponent();
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Ali' } });
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Simulate clicking outside
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should wrap around when ArrowDown at last item', () => {
    mockUsePatientSearch.mockReturnValue({ patients: mockPatients, loading: false });
    renderComponent();
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Ali' } });

    // Go to last item then press ArrowDown
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // index 0
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // index 1
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // wraps to 0

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('should wrap around when ArrowUp at first item', () => {
    mockUsePatientSearch.mockReturnValue({ patients: mockPatients, loading: false });
    renderComponent();
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Ali' } });

    fireEvent.keyDown(input, { key: 'ArrowDown' }); // index 0
    fireEvent.keyDown(input, { key: 'ArrowUp' });    // wraps to last

    const options = screen.getAllByRole('option');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
  });
});
