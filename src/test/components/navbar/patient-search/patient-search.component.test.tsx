import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HashRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import PatientSearch from '../../../../components/navbar/patient-search/patient-search.component';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

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

vi.mock(
  '../../../../components/navbar/patient-search/patient-search.hook',
  () => ({
    usePatientSearch: () => ({
      patients: mockPatients,
      loading: false,
    }),
  })
);

const renderComponent = () => {
  return render(
    <HashRouter>
      <PatientSearch />
    </HashRouter>
  );
};

describe('PatientSearch', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should render search input with placeholder', () => {
    renderComponent();

    expect(
      screen.getByPlaceholderText('Patient Search')
    ).toBeInTheDocument();
  });

  it('should render search icon', () => {
    renderComponent();

    const searchIcon = screen.getByAltText('search');
    expect(searchIcon).toBeInTheDocument();
    expect(searchIcon).toHaveClass('w-6', 'h-6');
  });

  it('should have combobox ARIA role', () => {
    renderComponent();

    const combobox = screen.getByRole('combobox');
    expect(combobox).toBeInTheDocument();
    expect(combobox).toHaveAttribute('aria-controls', 'patient-search-list');
    expect(combobox).toHaveAttribute('aria-autocomplete', 'list');
  });

  it('should not show dropdown initially', () => {
    renderComponent();

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should show dropdown when user types a search term', async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByPlaceholderText('Patient Search');
    await user.type(input, 'John');

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('should update aria-expanded when dropdown is shown', async () => {
    const user = userEvent.setup();
    renderComponent();

    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');

    await user.type(combobox, 'John');
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
  });

  it('should show dropdown on focus when there is a search term', async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByPlaceholderText('Patient Search');
    await user.type(input, 'John');

    // Click outside to close
    await user.click(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    // Focus to reopen
    await user.click(input);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('should close dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByPlaceholderText('Patient Search');
    await user.type(input, 'John');

    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Click outside
    await user.click(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should close dropdown on Escape key', async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByPlaceholderText('Patient Search');
    await user.type(input, 'John');

    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should navigate with ArrowDown key', async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByPlaceholderText('Patient Search');
    await user.type(input, 'John');

    await user.keyboard('{ArrowDown}');
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowDown}');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    expect(options[0]).toHaveAttribute('aria-selected', 'false');
  });

  it('should wrap ArrowDown at the end of the list', async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByPlaceholderText('Patient Search');
    await user.type(input, 'John');

    // Go to last item
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');

    // Wrap to first
    await user.keyboard('{ArrowDown}');
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('should navigate with ArrowUp key', async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByPlaceholderText('Patient Search');
    await user.type(input, 'John');

    // ArrowDown twice, then ArrowUp once
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowUp}');

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
  });

  it('should wrap ArrowUp to the last item', async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByPlaceholderText('Patient Search');
    await user.type(input, 'John');

    // ArrowDown to first item, then ArrowUp should wrap to last
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowUp}');

    const options = screen.getAllByRole('option');
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
  });

  it('should select patient on Enter and navigate', async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByPlaceholderText('Patient Search');
    await user.type(input, 'John');

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(mockNavigate).toHaveBeenCalledWith('/patient/uuid-1');
  });

  it('should not navigate on Enter if no active index', async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByPlaceholderText('Patient Search');
    await user.type(input, 'John');

    await user.keyboard('{Enter}');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should clear search term after selecting a patient', async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByPlaceholderText('Patient Search') as HTMLInputElement;
    await user.type(input, 'John');

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(input.value).toBe('');
  });

  it('should close dropdown after selecting a patient', async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByPlaceholderText('Patient Search');
    await user.type(input, 'John');

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should navigate when clicking a patient in dropdown', async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByPlaceholderText('Patient Search');
    await user.type(input, 'John');

    await user.click(screen.getByText('OPM-100'));
    expect(mockNavigate).toHaveBeenCalledWith('/patient/uuid-1');
  });

  it('should reset active index on new input', async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByPlaceholderText('Patient Search');
    await user.type(input, 'J');

    await user.keyboard('{ArrowDown}');
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    // Type more resets active index
    await user.type(input, 'o');
    const updatedOptions = screen.getAllByRole('option');
    expect(updatedOptions[0]).toHaveAttribute('aria-selected', 'false');
    expect(updatedOptions[1]).toHaveAttribute('aria-selected', 'false');
  });

  it('should not show dropdown when input is empty', async () => {
    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByPlaceholderText('Patient Search');
    await user.type(input, 'J');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.clear(input);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should ignore ArrowDown/ArrowUp when dropdown is not visible', async () => {
    const user = userEvent.setup();
    renderComponent();

    // No typing, just key presses - should not throw
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{ArrowUp}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
