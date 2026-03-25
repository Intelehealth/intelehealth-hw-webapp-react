import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Vitals } from '../../../../../modules/ayu/components/start-visit/vitals/vitals.component';
import type { VitalField } from '../../../../../modules/ayu/types/vitals.types';

// Mock the useVitals hook
const mockUseVitals = vi.fn();
vi.mock('../../../../../modules/ayu/hooks/useVitals', () => ({
  useVitals: () => mockUseVitals(),
}));

// Mock the AyuButton component
vi.mock('../../../../../modules/ayu/components/common/ayu-button.component', () => ({
  default: vi.fn(({ children, onClick, type, variant, className }) => (
    <button onClick={onClick} type={type} data-variant={variant} className={className}>
      {children}
    </button>
  )),
}));

describe('Vitals Component', () => {
  const mockOnNextQuestion = vi.fn();
  const mockOnPrevQuestion = vi.fn();
  const mockHandleSubmit = vi.fn((callback) => (e: any) => {
    e?.preventDefault();
    callback();
  });
  const mockRegister = vi.fn((fieldName) => ({ name: fieldName }));
  const mockWatch = vi.fn();
  const mockOnSubmit = vi.fn();
  const mockGetBMIStatus = vi.fn();
  const mockIsBPHigh = vi.fn();

  const mockBodyMeasurementFields: VitalField[] = [
    {
      name: 'Height (cm)',
      key: 'height_cm',
      uuid: 'height-uuid',
      is_mandatory: true,
      lang: null,
      is_enabled: true,
    },
    {
      name: 'Weight (kg)',
      key: 'weight_kg',
      uuid: 'weight-uuid',
      is_mandatory: true,
      lang: null,
      is_enabled: true,
    },
    {
      name: 'BMI',
      key: 'bmi',
      uuid: 'bmi-uuid',
      is_mandatory: true,
      lang: null,
      is_enabled: true,
    },
  ];

  const mockVitalFields: VitalField[] = [
    {
      name: 'BP Systolic',
      key: 'bp_systolic',
      uuid: 'bp-sys-uuid',
      is_mandatory: false,
      lang: null,
      is_enabled: true,
    },
    {
      name: 'BP Diastolic',
      key: 'bp_diastolic',
      uuid: 'bp-dia-uuid',
      is_mandatory: false,
      lang: null,
      is_enabled: true,
    },
    {
      name: 'Pulse (bpm)',
      key: 'pulse_bpm',
      uuid: 'pulse-uuid',
      is_mandatory: true,
      lang: null,
      is_enabled: true,
    },
  ];

  const mockOtherFields: VitalField[] = [
    {
      name: 'Blood Group',
      key: 'blood_group',
      uuid: 'blood-group-uuid',
      is_mandatory: false,
      lang: null,
      is_enabled: true,
    },
    {
      name: 'Waist to Hip Ratio (WHR)',
      key: 'waist_to_hip_ratio',
      uuid: 'whr-uuid',
      is_mandatory: true,
      lang: null,
      is_enabled: true,
    },
  ];

  const defaultMockReturn = {
    register: mockRegister,
    handleSubmit: mockHandleSubmit,
    watch: mockWatch,
    errors: {},
    bodyMeasurementFields: mockBodyMeasurementFields,
    vitalFields: mockVitalFields,
    otherFields: mockOtherFields,
    onSubmit: mockOnSubmit,
    isLoading: false,
    bpSystolic: undefined,
    bpDiastolic: undefined,
    getBMIStatus: mockGetBMIStatus,
    isBPHigh: mockIsBPHigh,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseVitals.mockReturnValue(defaultMockReturn);
    mockWatch.mockReturnValue(undefined);
    mockGetBMIStatus.mockReturnValue('Normal');
    mockIsBPHigh.mockReturnValue(false);
  });

  describe('Loading State', () => {
    it('should render loading message when isLoading is true', () => {
      mockUseVitals.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true,
      });

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);
      expect(screen.getByText('Loading vitals configuration...')).toBeInTheDocument();
    });

    it('should not render form when loading', () => {
      mockUseVitals.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true,
      });

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);
      expect(screen.queryByRole('button', { name: /Next/i })).not.toBeInTheDocument();
    });
  });

  describe('Form Rendering', () => {
    it('should render form when not loading', () => {
      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should render all three sections with correct titles', () => {
      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(screen.getByText("Enter patient's body measurement details")).toBeInTheDocument();
      expect(screen.getByText("Enter the patient's vitals")).toBeInTheDocument();
      expect(screen.getByText('Additional Measurements')).toBeInTheDocument();
    });

    it('should not render section if fields array is empty', () => {
      mockUseVitals.mockReturnValue({
        ...defaultMockReturn,
        bodyMeasurementFields: [],
        vitalFields: [],
        otherFields: [],
      });

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(screen.queryByText("Enter patient's body measurement details")).not.toBeInTheDocument();
      expect(screen.queryByText("Enter the patient's vitals")).not.toBeInTheDocument();
      expect(screen.queryByText('Additional Measurements')).not.toBeInTheDocument();
    });
  });

  describe('Field Rendering', () => {
    it('should render all body measurement fields', () => {
      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(screen.getByText('Height (cm)')).toBeInTheDocument();
      expect(screen.getByText('Weight (kg)')).toBeInTheDocument();
      expect(screen.getByText('BMI')).toBeInTheDocument();
    });

    it('should render all vital fields', () => {
      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(screen.getByText('BP Systolic')).toBeInTheDocument();
      expect(screen.getByText('BP Diastolic')).toBeInTheDocument();
      expect(screen.getByText('Pulse (bpm)')).toBeInTheDocument();
    });

    it('should render all other fields', () => {
      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(screen.getByText('Blood Group')).toBeInTheDocument();
      expect(screen.getByText('Waist to Hip Ratio (WHR)')).toBeInTheDocument();
    });

    it('should show mandatory indicator for required fields', () => {
      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      const heightLabel = screen.getByText('Height (cm)').parentElement;
      expect(heightLabel?.textContent).toContain('*');
    });

    it('should not show mandatory indicator for optional fields', () => {
      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      const bpSystolicLabel = screen.getByText('BP Systolic').parentElement;
      const asterisks = bpSystolicLabel?.querySelectorAll('.text-red-500');
      expect(asterisks?.length).toBe(0);
    });

    it('should render input fields with correct placeholders', () => {
      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(screen.getByPlaceholderText('E.g., 172 cm')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('E.g., 63 kg')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('E.g., 120 mmHg')).toBeInTheDocument();
    });
  });

  describe('Read-only Fields', () => {
    it('should make BMI field read-only', () => {
      const { container } = render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      const bmiInput = container.querySelector('input[name="bmi"]');
      expect(bmiInput).toHaveAttribute('readonly');
    });

    it('should make Waist to Hip Ratio field read-only', () => {
      const { container } = render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      const whrInput = container.querySelector('input[name="waist_to_hip_ratio"]');
      expect(whrInput).toHaveAttribute('readonly');
    });

    it('should apply read-only styling to BMI field', () => {
      const { container } = render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      const bmiInput = container.querySelector('input[name="bmi"]');
      expect(bmiInput).toHaveClass('bg-gray-50', 'cursor-not-allowed');
    });
  });

  describe('BMI Status Display', () => {
    it('should display BMI status when BMI value exists', () => {
      mockWatch.mockImplementation((fieldName) => {
        if (fieldName === 'bmi') return 24.5;
        return undefined;
      });
      mockGetBMIStatus.mockReturnValue('Normal');

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(screen.getByText('(Normal)')).toBeInTheDocument();
    });

    it('should display Normal status with green color', () => {
      mockWatch.mockImplementation((fieldName) => {
        if (fieldName === 'bmi') return 22;
        return undefined;
      });
      mockGetBMIStatus.mockReturnValue('Normal');

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      const statusElement = screen.getByText('(Normal)');
      expect(statusElement).toHaveClass('text-green-600');
    });

    it('should display Underweight status with yellow color', () => {
      mockWatch.mockImplementation((fieldName) => {
        if (fieldName === 'bmi') return 17;
        return undefined;
      });
      mockGetBMIStatus.mockReturnValue('Underweight');

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      const statusElement = screen.getByText('(Underweight)');
      expect(statusElement).toHaveClass('text-yellow-600');
    });

    it('should display Overweight status with yellow color', () => {
      mockWatch.mockImplementation((fieldName) => {
        if (fieldName === 'bmi') return 27;
        return undefined;
      });
      mockGetBMIStatus.mockReturnValue('Overweight');

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      const statusElement = screen.getByText('(Overweight)');
      expect(statusElement).toHaveClass('text-yellow-600');
    });

    it('should display Obese status with red color', () => {
      mockWatch.mockImplementation((fieldName) => {
        if (fieldName === 'bmi') return 32;
        return undefined;
      });
      mockGetBMIStatus.mockReturnValue('Obese');

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      const statusElement = screen.getByText('(Obese)');
      expect(statusElement).toHaveClass('text-red-600');
    });

    it('should not display BMI status when BMI value is undefined', () => {
      mockWatch.mockReturnValue(undefined);

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(screen.queryByText(/Normal|Underweight|Overweight|Obese/)).not.toBeInTheDocument();
    });
  });

  describe('Blood Pressure Warning', () => {
    it('should display BP warning when BP is high', () => {
      mockUseVitals.mockReturnValue({
        ...defaultMockReturn,
        bpSystolic: 150,
        bpDiastolic: 95,
        isBPHigh: vi.fn().mockReturnValue(true),
      });
      mockWatch.mockImplementation((fieldName) => {
        if (fieldName === 'bp_systolic') return 150;
        if (fieldName === 'bp_diastolic') return 95;
        return undefined;
      });

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(screen.getByText('BP Sys is too high. This should be a priority visit')).toBeInTheDocument();
      expect(screen.getByText('BP Dia is too high. This should be a priority visit')).toBeInTheDocument();
    });

    it('should not display BP warning when BP is normal', () => {
      mockUseVitals.mockReturnValue({
        ...defaultMockReturn,
        bpSystolic: 120,
        bpDiastolic: 80,
        isBPHigh: vi.fn().mockReturnValue(false),
      });
      mockWatch.mockImplementation((fieldName) => {
        if (fieldName === 'bp_systolic') return 120;
        if (fieldName === 'bp_diastolic') return 80;
        return undefined;
      });

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(screen.queryByText('BP Sys is too high. This should be a priority visit')).not.toBeInTheDocument();
      expect(screen.queryByText('BP Dia is too high. This should be a priority visit')).not.toBeInTheDocument();
    });

    it('should call isBPHigh per field with correct values', () => {
      const mockIsBPHighFn = vi.fn().mockReturnValue(true);
      mockUseVitals.mockReturnValue({
        ...defaultMockReturn,
        bpSystolic: 150,
        bpDiastolic: 95,
        isBPHigh: mockIsBPHighFn,
      });
      mockWatch.mockImplementation((fieldName) => {
        if (fieldName === 'bp_systolic') return 150;
        if (fieldName === 'bp_diastolic') return 95;
        return undefined;
      });

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(mockIsBPHighFn).toHaveBeenCalledWith(150, undefined);
      expect(mockIsBPHighFn).toHaveBeenCalledWith(undefined, 95);
    });
  });

  describe('Error Display', () => {
    it('should display error message when field has error', () => {
      mockUseVitals.mockReturnValue({
        ...defaultMockReturn,
        errors: {
          height_cm: { message: 'Height must be between 50 and 250 cm' },
        },
      });

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(screen.getByText('Height must be between 50 and 250 cm')).toBeInTheDocument();
    });

    it('should display error icon when field has error', () => {
      mockUseVitals.mockReturnValue({
        ...defaultMockReturn,
        errors: {
          height_cm: { message: 'Height is required' },
        },
      });

      const { container } = render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      const errorIcon = container.querySelector('svg.text-red-500');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should apply error border styling to input with error', () => {
      mockUseVitals.mockReturnValue({
        ...defaultMockReturn,
        errors: {
          weight_kg: { message: 'Weight is required' },
        },
      });

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      const weightInput = screen.getByPlaceholderText('E.g., 63 kg');
      expect(weightInput).toHaveClass('border-red-500');
    });

    it('should not display error when field has no error', () => {
      mockUseVitals.mockReturnValue({
        ...defaultMockReturn,
        errors: {},
      });

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      const heightInput = screen.getByPlaceholderText('E.g., 172 cm');
      expect(heightInput).not.toHaveClass('border-red-500');
    });
  });

  describe('Form Submission', () => {
    it('should call handleSubmit when form is submitted', async () => {
      const user = userEvent.setup();
      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      const submitButton = screen.getByRole('button');
      await user.click(submitButton);

      expect(mockHandleSubmit).toHaveBeenCalledWith(mockOnSubmit);
    });

    it('should call onSubmit when form is valid', async () => {
      const user = userEvent.setup();
      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      const submitButton = screen.getByRole('button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Button Text', () => {
    it('should display "Next" button when not on last question', () => {
      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should display "Confirm" button when on last question', () => {
      render(<Vitals questionIndex={9} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('should not display "Next" when on last question', () => {
      render(<Vitals questionIndex={9} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    it('should render button with primary variant', () => {
      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-variant', 'primary');
    });

    it('should render button with submit type', () => {
      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('Field Types', () => {
    it('should render text inputs with decimal inputMode for numeric fields', () => {
      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      const textInputs = screen.getAllByRole('textbox');
      expect(textInputs.length).toBeGreaterThan(0);
      textInputs.forEach((input) => {
        expect(input).toHaveAttribute('inputmode', 'decimal');
        expect(input).toHaveAttribute('maxlength', '10');
      });
    });

    it('should render dropdown for blood_group field', () => {
      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(select).toHaveAttribute('name', 'blood_group');
      expect(screen.getByText('Select Blood Group')).toBeInTheDocument();
      expect(screen.getByText('A+')).toBeInTheDocument();
      expect(screen.getByText('O-')).toBeInTheDocument();
    });
  });

  describe('Form Registration', () => {
    it('should register all body measurement fields', () => {
      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(mockRegister).toHaveBeenCalledWith('height_cm');
      expect(mockRegister).toHaveBeenCalledWith('weight_kg');
      expect(mockRegister).toHaveBeenCalledWith('bmi');
    });

    it('should register all vital fields', () => {
      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(mockRegister).toHaveBeenCalledWith('bp_systolic');
      expect(mockRegister).toHaveBeenCalledWith('bp_diastolic');
      expect(mockRegister).toHaveBeenCalledWith('pulse_bpm');
    });

    it('should register all other fields', () => {
      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(mockRegister).toHaveBeenCalledWith('blood_group');
      expect(mockRegister).toHaveBeenCalledWith('waist_to_hip_ratio');
    });
  });

  describe('Watch Function Calls', () => {
    it('should watch field values for each field', () => {
      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      // Watch is called for each field to check for values
      expect(mockWatch).toHaveBeenCalled();
    });

    it('should watch bmi value to display status', () => {
      mockWatch.mockImplementation((fieldName) => {
        if (fieldName === 'bmi') return 24;
        return undefined;
      });

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(mockWatch).toHaveBeenCalledWith('bmi');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty field arrays gracefully', () => {
      mockUseVitals.mockReturnValue({
        ...defaultMockReturn,
        bodyMeasurementFields: [],
        vitalFields: [],
        otherFields: [],
      });

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      // Should still render submit button
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle undefined error messages', () => {
      mockUseVitals.mockReturnValue({
        ...defaultMockReturn,
        errors: {
          height_cm: { message: undefined },
        },
      });

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      // Should not crash
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should handle questionIndex at boundary values', () => {
      const { rerender } = render(
        <Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />
      );
      expect(screen.getByText('Next')).toBeInTheDocument();

      rerender(<Vitals questionIndex={9} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('should render correctly with mixed field states', () => {
      mockUseVitals.mockReturnValue({
        ...defaultMockReturn,
        errors: {
          height_cm: { message: 'Height error' },
        },
      });
      mockWatch.mockImplementation((fieldName) => {
        if (fieldName === 'bmi') return 25;
        if (fieldName === 'bp_systolic') return 150;
        if (fieldName === 'bp_diastolic') return 95;
        return undefined;
      });
      mockIsBPHigh.mockReturnValue(true);
      mockGetBMIStatus.mockReturnValue('Overweight');

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      // Should render all states simultaneously
      expect(screen.getByText('Height error')).toBeInTheDocument();
      expect(screen.getByText('(Overweight)')).toBeInTheDocument();
      expect(screen.getByText('BP Dia is too high. This should be a priority visit')).toBeInTheDocument();
    });
  });

  describe('Props Integration', () => {
    it('should pass onNextQuestion to useVitals hook', () => {
      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(mockUseVitals).toHaveBeenCalled();
    });

    it('should use questionIndex to determine button text', () => {
      render(<Vitals questionIndex={5} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(screen.getByText('Next')).toBeInTheDocument();
    });
  });

  describe('BMI and WHR out-of-range warnings', () => {
    it('should show BMI warning under weight field when BMI is out of range (lines 152-154)', () => {
      mockWatch.mockImplementation((fieldName: string) => {
        if (fieldName === 'bmi') return 65;
        if (fieldName === 'waist_to_hip_ratio') return undefined;
        if (fieldName === 'weight_kg') return 300;
        return undefined;
      });

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(screen.getByText(/BMI must be between 10 and 60/)).toBeInTheDocument();
    });

    it('should not show BMI warning when BMI is within range', () => {
      mockWatch.mockImplementation((fieldName: string) => {
        if (fieldName === 'bmi') return 22;
        if (fieldName === 'waist_to_hip_ratio') return undefined;
        return undefined;
      });

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(screen.queryByText(/BMI must be between/)).not.toBeInTheDocument();
    });

    it('should show WHR warning under hip field when WHR is out of range (lines 157-159)', () => {
      const otherFieldsWithHip: VitalField[] = [
        ...mockOtherFields,
        { name: 'Hip Circumference (cm)', key: 'hip_circumference_cm', uuid: 'hip-uuid', is_mandatory: true, lang: null, is_enabled: true },
      ];
      mockUseVitals.mockReturnValue({ ...defaultMockReturn, otherFields: otherFieldsWithHip });
      mockWatch.mockImplementation((fieldName: string) => {
        if (fieldName === 'waist_to_hip_ratio') return 1.8;
        if (fieldName === 'hip_circumference_cm') return 50;
        if (fieldName === 'bmi') return undefined;
        return undefined;
      });

      render(<Vitals questionIndex={0} onNextQuestion={mockOnNextQuestion} onPrevQuestion={mockOnPrevQuestion} />);

      expect(screen.getByText(/Waist to Hip Ratio \(WHR\) must be between 0.5 and 1.5/)).toBeInTheDocument();
    });
  });
});
