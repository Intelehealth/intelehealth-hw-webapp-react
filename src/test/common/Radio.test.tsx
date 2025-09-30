import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Radio, { RadioGroup } from '../../components/common/radio.component';

describe('Radio', () => {
  it('renders with basic props', () => {
    render(<Radio />);
    const radio = screen.getByRole('radio');
    expect(radio).toBeInTheDocument();
    expect(radio).toHaveAttribute('type', 'radio');
  });

  it('renders with label', () => {
    render(<Radio label="Option 1" />);
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByRole('radio')).toBeInTheDocument();
  });

  it('renders with required indicator', () => {
    render(<Radio label="Required option" isRequired />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders with error state', () => {
    render(<Radio label="Option" error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('radio')).toHaveAttribute('aria-invalid', 'true');
  });

  it('renders with helper text', () => {
    render(<Radio label="Option" helperText="Select this option" />);
    expect(screen.getByText('Select this option')).toBeInTheDocument();
  });

  it('renders with description', () => {
    render(<Radio label="Option" description="This is a description" />);
    expect(screen.getByText('This is a description')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Radio size="sm" label="Small" />);
    expect(screen.getByRole('radio')).toHaveClass('w-4', 'h-4');

    rerender(<Radio size="md" label="Medium" />);
    expect(screen.getByRole('radio')).toHaveClass('w-5', 'h-5');

    rerender(<Radio size="lg" label="Large" />);
    expect(screen.getByRole('radio')).toHaveClass('w-6', 'h-6');
  });

  it('handles checked state', () => {
    render(<Radio checked label="Checked" />);
    expect(screen.getByRole('radio')).toBeChecked();
  });

  it('handles disabled state', () => {
    render(<Radio disabled label="Disabled" />);
    const radio = screen.getByRole('radio');
    expect(radio).toBeDisabled();
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Radio onChange={handleChange} label="Test radio" />);
    const radio = screen.getByRole('radio');

    await user.click(radio);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('can be clicked via label', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Radio onChange={handleChange} label="Clickable label" />);
    const label = screen.getByText('Clickable label');

    await user.click(label);
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Radio ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Radio className="custom-class" />);
    expect(screen.getByRole('radio')).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    render(
      <Radio
        label="Radio"
        error="Required field"
        helperText="Select this option"
        aria-label="Test radio"
      />
    );

    const radio = screen.getByRole('radio');
    expect(radio).toHaveAttribute('aria-invalid', 'true');
    expect(radio).toHaveAttribute('aria-describedby');
  });

  it('shows error instead of helper text when both are provided', () => {
    render(
      <Radio
        label="Radio"
        error="This field is required"
        helperText="Select this option"
      />
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.queryByText('Select this option')).not.toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(<Radio onChange={handleChange} label="Keyboard test" />);
    const radio = screen.getByRole('radio');

    radio.focus();
    await user.keyboard(' ');
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('renders with custom id', () => {
    render(<Radio id="custom-id" label="Custom ID" />);
    const radio = screen.getByRole('radio');
    expect(radio).toHaveAttribute('id', 'custom-id');
  });
});

describe('RadioGroup', () => {
  it('renders with multiple radio options', () => {
    render(
      <RadioGroup name="test-group">
        <Radio value="option1" label="Option 1" />
        <Radio value="option2" label="Option 2" />
        <Radio value="option3" label="Option 3" />
      </RadioGroup>
    );

    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(3);
    expect(radios[0]).toHaveAttribute('name', 'test-group');
    expect(radios[1]).toHaveAttribute('name', 'test-group');
    expect(radios[2]).toHaveAttribute('name', 'test-group');
  });

  it('handles group value changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <RadioGroup name="test-group" onChange={handleChange}>
        <Radio value="option1" label="Option 1" />
        <Radio value="option2" label="Option 2" />
      </RadioGroup>
    );

    const option2 = screen.getByLabelText('Option 2');
    await user.click(option2);

    expect(handleChange).toHaveBeenCalledWith('option2');
  });

  it('shows selected value', () => {
    render(
      <RadioGroup name="test-group" value="option2">
        <Radio value="option1" label="Option 1" />
        <Radio value="option2" label="Option 2" />
        <Radio value="option3" label="Option 3" />
      </RadioGroup>
    );

    const option2 = screen.getByLabelText('Option 2');
    expect(option2).toBeChecked();
  });

  it('renders with group error', () => {
    render(
      <RadioGroup name="test-group" error="Please select an option">
        <Radio value="option1" label="Option 1" />
        <Radio value="option2" label="Option 2" />
      </RadioGroup>
    );

    expect(screen.getByText('Please select an option')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('renders with group helper text', () => {
    render(
      <RadioGroup name="test-group" helperText="Choose one option">
        <Radio value="option1" label="Option 1" />
        <Radio value="option2" label="Option 2" />
      </RadioGroup>
    );

    expect(screen.getByText('Choose one option')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <RadioGroup
        name="test-group"
        aria-label="Test radio group"
        error="Required field"
      >
        <Radio value="option1" label="Option 1" />
        <Radio value="option2" label="Option 2" />
      </RadioGroup>
    );

    const group = screen.getByRole('radiogroup');
    expect(group).toHaveAttribute('aria-label', 'Test radio group');
    expect(group).toHaveAttribute('aria-invalid', 'true');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(
      <RadioGroup ref={ref} name="test-group">
        <Radio value="option1" label="Option 1" />
      </RadioGroup>
    );
    expect(ref).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(
      <RadioGroup name="test-group" className="custom-class">
        <Radio value="option1" label="Option 1" />
      </RadioGroup>
    );

    expect(screen.getByRole('radiogroup').parentElement).toHaveClass(
      'custom-class'
    );
  });
});
