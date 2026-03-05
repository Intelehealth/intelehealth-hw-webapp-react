import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PatientSearchDropdown from '../../../../components/navbar/patient-search/patient-search-dropdown.component';

const mockPatients = [
  {
    uuid: 'uuid-1',
    identifiers: [
      { identifier: 'OPM-100', identifierType: { name: 'OpenMRS ID' } },
    ],
    person: { display: 'John Doe', gender: 'M', age: 30, attributes: [] },
  },
  {
    uuid: 'uuid-2',
    identifiers: [
      { identifier: 'OPM-101', identifierType: { name: 'OpenMRS ID' } },
    ],
    person: { display: 'Jane Smith', gender: 'F', age: 25, attributes: [] },
  },
];

describe('PatientSearchDropdown', () => {
  const defaultProps = {
    patients: mockPatients,
    loading: false,
    activeIndex: -1,
    onSelect: vi.fn(),
    setActiveIndex: vi.fn(),
  };

  it('should render the dropdown with patient count', () => {
    render(<PatientSearchDropdown {...defaultProps} />);

    expect(
      screen.getByText('Patients (2 results)')
    ).toBeInTheDocument();
  });

  it('should display "Searching..." when loading', () => {
    render(<PatientSearchDropdown {...defaultProps} loading={true} />);

    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('should display "No results found" when patients array is empty and not loading', () => {
    render(
      <PatientSearchDropdown {...defaultProps} patients={[]} loading={false} />
    );

    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('should render patient identifiers and details', () => {
    render(<PatientSearchDropdown {...defaultProps} />);

    expect(screen.getByText('OPM-100')).toBeInTheDocument();
    expect(screen.getByText('OPM-101')).toBeInTheDocument();
    expect(
      screen.getByText('John Doe (M, 30)')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Jane Smith (F, 25)')
    ).toBeInTheDocument();
  });

  it('should display "N/A" when patient has no identifiers', () => {
    const patients = [
      {
        uuid: 'uuid-3',
        identifiers: [],
        person: { display: 'No ID Patient', gender: 'M', age: 40, attributes: [] },
      },
    ];
    render(<PatientSearchDropdown {...defaultProps} patients={patients} />);

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('should highlight the active item with blue background', () => {
    render(<PatientSearchDropdown {...defaultProps} activeIndex={0} />);

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveClass('bg-blue-100');
    expect(options[1]).not.toHaveClass('bg-blue-100');
  });

  it('should call onSelect when a patient is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<PatientSearchDropdown {...defaultProps} onSelect={onSelect} />);

    await user.click(screen.getByText('OPM-100'));
    expect(onSelect).toHaveBeenCalledWith(mockPatients[0]);
  });

  it('should call setActiveIndex on mouse enter', async () => {
    const user = userEvent.setup();
    const setActiveIndex = vi.fn();
    render(
      <PatientSearchDropdown
        {...defaultProps}
        setActiveIndex={setActiveIndex}
      />
    );

    const options = screen.getAllByRole('option');
    await user.hover(options[1]);
    expect(setActiveIndex).toHaveBeenCalledWith(1);
  });

  it('should have correct ARIA attributes', () => {
    render(<PatientSearchDropdown {...defaultProps} activeIndex={1} />);

    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAttribute('id', 'patient-search-list');

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('should show "OpenMRS ID" label for each patient', () => {
    render(<PatientSearchDropdown {...defaultProps} />);

    const labels = screen.getAllByText('OpenMRS ID');
    expect(labels).toHaveLength(2);
  });

  it('should show 0 results when loading with patients', () => {
    render(
      <PatientSearchDropdown
        {...defaultProps}
        patients={mockPatients}
        loading={true}
      />
    );

    // When loading, "Searching..." is shown instead of patient items
    expect(screen.getByText('Searching...')).toBeInTheDocument();
    expect(screen.queryByText('OPM-100')).not.toBeInTheDocument();
  });
});
