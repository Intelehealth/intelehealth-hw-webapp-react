import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { VitalConfirmationModal } from '../../../components/modal/vitals-confirmation.modal';

describe('VitalConfirmationModal', () => {
  const defaultProps = {
    open: true,
    title: 'Confirm Vitals',
    onClose: vi.fn(),
    onConfirm: vi.fn(),
  };

  it('renders nothing when open is false', () => {
    const { container } = render(
      <VitalConfirmationModal {...defaultProps} open={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with title when open is true', () => {
    render(<VitalConfirmationModal {...defaultProps} />);
    expect(screen.getByText('Confirm Vitals')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <VitalConfirmationModal
        {...defaultProps}
        description="Patient Vitals Summary"
      />
    );
    expect(screen.getByText('Patient Vitals Summary')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(<VitalConfirmationModal {...defaultProps} icon="/vitals-icon.svg" />);
    const modalIcon = screen.getByAltText('Modal Icon');
    expect(modalIcon).toBeInTheDocument();
    expect(modalIcon).toHaveAttribute('src', '/vitals-icon.svg');
    expect(modalIcon).toHaveClass('w-6', 'h-6');

    // Check wrapper divs and classes
    const iconWrapper = modalIcon.parentElement;
    expect(iconWrapper).toHaveClass(
      'w-12',
      'h-12',
      'flex',
      'items-center',
      'justify-center',
      'rounded-full',
      'bg-emerald-100'
    );

    const outerWrapper = iconWrapper?.parentElement;
    expect(outerWrapper).toHaveClass('flex', 'justify-center', 'mb-3');
  });

  it('renders items list correctly', () => {
    const items = [
      { label: 'Blood Pressure', value: '120/80' },
      { label: 'Heart Rate', value: 72 },
      { label: 'Temperature', value: '98.6°F' },
    ];

    render(<VitalConfirmationModal {...defaultProps} items={items} />);

    expect(screen.getByText('Blood Pressure')).toBeInTheDocument();
    expect(screen.getByText('120/80')).toBeInTheDocument();
    expect(screen.getByText('Heart Rate')).toBeInTheDocument();
    expect(screen.getByText('72')).toBeInTheDocument();
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('98.6°F')).toBeInTheDocument();
  });

  it('renders "No information" for null values', () => {
    const items = [
      { label: 'Blood Pressure', value: null },
      { label: 'Heart Rate', value: null },
    ];

    render(<VitalConfirmationModal {...defaultProps} items={items} />);

    const noInfoElements = screen.getAllByText('No information');
    expect(noInfoElements).toHaveLength(2);

    // Check that "No information" has correct styling class
    noInfoElements.forEach((element) => {
      expect(element).toHaveClass('text-gray-500');
    });
  });

  it('renders without items (empty array)', () => {
    render(<VitalConfirmationModal {...defaultProps} items={[]} />);
    expect(screen.getByText('Confirm Vitals')).toBeInTheDocument();
  });

  it('renders default button text', () => {
    render(<VitalConfirmationModal {...defaultProps} />);
    expect(screen.getByText('Back')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('renders custom button text when provided', () => {
    render(
      <VitalConfirmationModal
        {...defaultProps}
        cancelText="Cancel"
        confirmText="Submit"
      />
    );
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('calls onClose when close icon is clicked (mobile)', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<VitalConfirmationModal {...defaultProps} onClose={onClose} />);
    const closeButton = screen.getByRole('button', { name: /close icon/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when back button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<VitalConfirmationModal {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByText('Back'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(<VitalConfirmationModal {...defaultProps} onConfirm={onConfirm} />);
    await user.click(screen.getByText('Confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('renders Change button when onChange is provided', () => {
    const onChange = vi.fn();
    render(<VitalConfirmationModal {...defaultProps} onChange={onChange} />);

    expect(screen.getByText('Change')).toBeInTheDocument();
  });

  it('does not render Change button when onChange is not provided', () => {
    render(<VitalConfirmationModal {...defaultProps} />);

    expect(screen.queryByText('Change')).not.toBeInTheDocument();
  });

  it('calls onChange when Change button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <VitalConfirmationModal
        {...defaultProps}
        onChange={onChange}
        description="Patient Info"
      />
    );

    await user.click(screen.getByText('Change'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('renders with correct modal structure and responsive classes', () => {
    const { container } = render(<VitalConfirmationModal {...defaultProps} />);
    const modal = container.querySelector('.fixed.inset-0.z-50');
    const modalBox = container.querySelector('.bg-white');

    expect(modal).toBeInTheDocument();
    expect(modalBox).toBeInTheDocument();
    expect(modalBox).toHaveClass('max-sm:w-full', 'max-sm:h-full');
  });

  it('renders all items with bullet points', () => {
    const items = [
      { label: 'Item 1', value: 'Value 1' },
      { label: 'Item 2', value: 'Value 2' },
    ];

    const { container } = render(
      <VitalConfirmationModal {...defaultProps} items={items} />
    );
    const bullets = container.querySelectorAll('.text-gray-500.font-bold');
    expect(bullets.length).toBeGreaterThanOrEqual(2);
  });

  it('converts number values to strings correctly', () => {
    const items = [{ label: 'Age', value: 25 }];

    render(<VitalConfirmationModal {...defaultProps} items={items} />);
    expect(screen.getByText('25')).toBeInTheDocument();
  });

  it('handles mixed value types (string, number, null)', () => {
    const items = [
      { label: 'Name', value: 'John Doe' },
      { label: 'Age', value: 30 },
      { label: 'Address', value: null },
    ];

    render(<VitalConfirmationModal {...defaultProps} items={items} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('No information')).toBeInTheDocument();
  });

  it('renders scrollable content area', () => {
    const { container } = render(<VitalConfirmationModal {...defaultProps} />);
    const scrollableArea = container.querySelector('.flex-1.overflow-y-auto');
    expect(scrollableArea).toBeInTheDocument();
  });

  it('applies scroll styles when items length exceeds 7', () => {
    const items = [
      { label: 'Blood Pressure', value: '120/80' },
      { label: 'Heart Rate', value: 72 },
      { label: 'Temperature', value: '98.6°F' },
      { label: 'Oxygen Saturation', value: '98%' },
      { label: 'Respiratory Rate', value: 16 },
      { label: 'Weight', value: '70 kg' },
      { label: 'Height', value: '170 cm' },
      { label: 'BMI', value: 24.2 },
    ];

    const { container } = render(
      <VitalConfirmationModal {...defaultProps} items={items} />
    );

    const itemsContainer = container.querySelector('.mt-4.space-y-3');
    expect(itemsContainer).toHaveClass('sm:max-h-[250px]');
    expect(itemsContainer).toHaveClass('sm:overflow-y-auto');
    expect(itemsContainer).toHaveClass('sm:pr-2');
  });

  it('does not apply scroll styles when items length is 7 or less', () => {
    const items = [
      { label: 'Blood Pressure', value: '120/80' },
      { label: 'Heart Rate', value: 72 },
      { label: 'Temperature', value: '98.6°F' },
      { label: 'Oxygen Saturation', value: '98%' },
      { label: 'Respiratory Rate', value: 16 },
      { label: 'Weight', value: '70 kg' },
      { label: 'Height', value: '170 cm' },
    ];

    const { container } = render(
      <VitalConfirmationModal {...defaultProps} items={items} />
    );

    const itemsContainer = container.querySelector('.mt-4.space-y-3');
    expect(itemsContainer).not.toHaveClass('sm:max-h-[250px]');
    expect(itemsContainer).not.toHaveClass('sm:overflow-y-auto');
    expect(itemsContainer).not.toHaveClass('sm:pr-2');
  });
});
