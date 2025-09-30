import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Dropdown, {
  type DropdownOption,
} from '../../components/common/dropdown.component';

const OPTIONS: DropdownOption[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana', description: 'Yellow fruit' },
  { label: 'Carrot', value: 'carrot', disabled: true },
];

describe('Dropdown', () => {
  it('renders label and placeholder', () => {
    render(
      <Dropdown options={OPTIONS} label="Fruits" placeholder="Select fruit" />
    );
    expect(screen.getByText('Fruits')).toBeInTheDocument();
    expect(screen.getByText('Select fruit')).toBeInTheDocument();
  });

  it('opens and closes dropdown on click', async () => {
    render(<Dropdown options={OPTIONS} />);
    const toggleBtn = screen.getByRole('button');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await userEvent.click(toggleBtn);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await userEvent.click(toggleBtn);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows options when opened', async () => {
    render(<Dropdown options={OPTIONS} />);
    await userEvent.click(screen.getByRole('button'));
    OPTIONS.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  it('does not allow selecting disabled options', async () => {
    const onChange = vi.fn();
    render(<Dropdown options={OPTIONS} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button'));

    const disabledOption = screen.getByText('Carrot');
    await userEvent.click(disabledOption);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onChange when option is selected (single)', async () => {
    const onChange = vi.fn();
    render(<Dropdown options={OPTIONS} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button'));

    const option = screen.getByText('Banana');
    await userEvent.click(option);

    expect(onChange).toHaveBeenCalledWith('banana');
  });

  it('supports multiple selection', async () => {
    const onChange = vi.fn();
    render(<Dropdown options={OPTIONS} onChange={onChange} multiple />);
    await userEvent.click(screen.getByRole('button'));

    await userEvent.click(screen.getByText('Apple'));
    expect(onChange).toHaveBeenCalledWith(['apple']);

    await userEvent.click(screen.getByText('Banana'));
    expect(onChange).toHaveBeenCalledWith(['apple', 'banana']);
  });

  it('clears selection when clear button is clicked', async () => {
    const onChange = vi.fn();
    render(
      <Dropdown
        options={OPTIONS}
        value="banana"
        onChange={onChange}
        clearable
      />
    );
    const clearButton = screen.getByRole('button', {
      name: /clear selection/i,
    });
    await userEvent.click(clearButton);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('shows error and helper text', () => {
    render(
      <Dropdown
        options={OPTIONS}
        error="Required field"
        helperText="Pick one"
      />
    );
    expect(screen.getByText('Required field')).toBeInTheDocument();
    expect(screen.queryByText('Pick one')).not.toBeInTheDocument(); // Should not show when error is present
  });

  it('shows helper text if no error', () => {
    render(<Dropdown options={OPTIONS} helperText="Pick a fruit" />);
    expect(screen.getByText('Pick a fruit')).toBeInTheDocument();
  });

  it('filters options when searchable', async () => {
    render(<Dropdown options={OPTIONS} searchable />);
    await userEvent.click(screen.getByRole('button'));

    const searchBox = screen.getByPlaceholderText('Search options...');
    await userEvent.type(searchBox, 'ba');

    expect(screen.getByText('Banana')).toBeInTheDocument();
    expect(screen.queryByText('Apple')).not.toBeInTheDocument();
  });

  it('renders selected value when value is provided', () => {
    render(<Dropdown options={OPTIONS} value="banana" />);
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });

  it('renders multiple selected values as tags', () => {
    render(<Dropdown options={OPTIONS} value={['apple', 'banana']} multiple />);
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('Banana')).toBeInTheDocument();
  });
});
