import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Dropdown from '../../components/common/dropdown.component';

const mockOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
];

const mockOptionsWithDescription = [
  { value: 'option1', label: 'Option 1', description: 'First option' },
  { value: 'option2', label: 'Option 2', description: 'Second option' },
  { value: 'option3', label: 'Option 3', description: 'Third option' },
];

describe('Dropdown', () => {
  it('renders with basic props', () => {
    render(<Dropdown options={mockOptions} placeholder="Select option" />);
    expect(screen.getByText('Select option')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Dropdown options={mockOptions} label="Choose option" />);
    expect(screen.getByText('Choose option')).toBeInTheDocument();
  });

  it('renders with required indicator', () => {
    render(
      <Dropdown options={mockOptions} label="Required field" isRequired />
    );
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders with error state', () => {
    render(<Dropdown options={mockOptions} error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders with helper text', () => {
    render(<Dropdown options={mockOptions} helperText="Select an option" />);
    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Dropdown options={mockOptions} size="sm" />);
    expect(screen.getByRole('button')).toHaveClass('px-3', 'py-2', 'text-sm');

    rerender(<Dropdown options={mockOptions} size="md" />);
    expect(screen.getByRole('button')).toHaveClass('px-4', 'py-3', 'text-base');

    rerender(<Dropdown options={mockOptions} size="lg" />);
    expect(screen.getByRole('button')).toHaveClass('px-5', 'py-4', 'text-lg');
  });

  it('renders different variants', () => {
    const { rerender } = render(
      <Dropdown options={mockOptions} variant="outlined" />
    );
    expect(screen.getByRole('button')).toHaveClass('border-gray-300');

    rerender(<Dropdown options={mockOptions} variant="filled" />);
    expect(screen.getByRole('button')).toHaveClass(
      'bg-gray-100',
      'border-transparent'
    );

    rerender(<Dropdown options={mockOptions} variant="default" />);
    expect(screen.getByRole('button')).toHaveClass('border-gray-300');
  });

  it('opens dropdown on click', async () => {
    const user = userEvent.setup();
    render(<Dropdown options={mockOptions} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Dropdown options={mockOptions} />
        <div data-testid="outside">Outside</div>
      </div>
    );

    const button = screen.getByRole('button');
    await user.click(button);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    const outside = screen.getByTestId('outside');
    await user.click(outside);

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('handles single selection', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Dropdown options={mockOptions} onChange={handleChange} />);

    const button = screen.getByRole('button');
    await user.click(button);

    const option1 = screen.getByText('Option 1');
    await user.click(option1);

    expect(handleChange).toHaveBeenCalledWith('option1');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('handles multiple selection', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Dropdown options={mockOptions} multiple onChange={handleChange} />);

    const button = screen.getByRole('button');
    await user.click(button);

    const option1 = screen.getByText('Option 1');
    const option2 = screen.getByText('Option 2');

    await user.click(option1);
    expect(handleChange).toHaveBeenCalledWith(['option1']);

    // For multiple selection, dropdown should stay open, so we can click option2 directly
    await user.click(option2);
    expect(handleChange).toHaveBeenLastCalledWith(['option1', 'option2']);
  });

  it('shows selected value', () => {
    render(<Dropdown options={mockOptions} value="option2" />);
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('shows multiple selected values', () => {
    render(
      <Dropdown options={mockOptions} value={['option1', 'option2']} multiple />
    );
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Dropdown options={mockOptions} onChange={handleChange} />);

    const button = screen.getByRole('button');
    button.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(handleChange).toHaveBeenCalledWith('option1');
  });

  it('handles search functionality', async () => {
    const user = userEvent.setup();
    render(<Dropdown options={mockOptions} searchable />);

    const button = screen.getByRole('button');
    await user.click(button);

    const searchInput = screen.getByPlaceholderText('Search options...');
    await user.type(searchInput, 'Option 1');

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.queryByText('Option 2')).not.toBeInTheDocument();
  });

  it('shows clear button when clearable', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <Dropdown
        options={mockOptions}
        value="option1"
        clearable
        onChange={handleChange}
      />
    );

    const clearButton = screen.getByLabelText('Clear selection');
    await user.click(clearButton);

    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('handles disabled state', () => {
    render(<Dropdown options={mockOptions} disabled />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('renders with descriptions', async () => {
    const user = userEvent.setup();
    render(<Dropdown options={mockOptionsWithDescription} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(screen.getByText('First option')).toBeInTheDocument();
    expect(screen.getByText('Second option')).toBeInTheDocument();
  });

  it('handles disabled options', async () => {
    const user = userEvent.setup();
    const optionsWithDisabled = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2', disabled: true },
      { value: 'option3', label: 'Option 3' },
    ];

    render(<Dropdown options={optionsWithDisabled} />);

    const button = screen.getByRole('button');
    await user.click(button);

    const disabledOption = screen.getByText('Option 2');
    expect(disabledOption.closest('li')).toHaveClass(
      'opacity-50',
      'cursor-not-allowed'
    );
  });

  it('shows no options found message', async () => {
    const user = userEvent.setup();
    render(<Dropdown options={mockOptions} searchable />);

    const button = screen.getByRole('button');
    await user.click(button);

    const searchInput = screen.getByPlaceholderText('Search options...');
    await user.type(searchInput, 'nonexistent');

    expect(screen.getByText('No options found')).toBeInTheDocument();
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Dropdown ref={ref} options={mockOptions} />);
    expect(ref).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Dropdown options={mockOptions} className="custom-class" />);
    const buttonContainer = screen.getByRole('button').closest('div');
    expect(buttonContainer?.parentElement).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(
      <Dropdown
        options={mockOptions}
        aria-label="Test dropdown"
        error="Required field"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Test dropdown');
    expect(button).toHaveAttribute('aria-invalid', 'true');
    expect(button).toHaveAttribute('aria-haspopup', 'listbox');
  });

  it('shows error instead of helper text when both are provided', () => {
    render(
      <Dropdown
        options={mockOptions}
        error="This field is required"
        helperText="Select an option"
      />
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.queryByText('Select an option')).not.toBeInTheDocument();
  });
});
