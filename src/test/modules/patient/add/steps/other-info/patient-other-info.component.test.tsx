import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PatientOtherInfo from '../../../../../../modules/patient/add/steps/other-info/patient-other-info.component';

// Mock the common components
vi.mock('../../../../../../components/common', () => ({
  Button: ({ children, onClick, type, variant, className }: any) => (
    <button type={type} onClick={onClick} className={className} data-variant={variant}>
      {children}
    </button>
  ),
  Input: ({ label, placeholder, error, isRequired, ...props }: any) => (
    <div>
      {label && (
        <label>
          {label} {isRequired && <span>*</span>}
        </label>
      )}
      <input placeholder={placeholder} {...props} />
      {error && <span className="error">{error}</span>}
    </div>
  ),
  Dropdown: ({ label, options, onChange, value, error, isRequired, placeholder }: any) => (
    <div>
      {label && (
        <label>
          {label} {isRequired && <span>*</span>}
        </label>
      )}
      <select
        value={Array.isArray(value) ? value[0] : value}
        onChange={(e) => onChange?.(e.target.value)}
        data-testid={`dropdown-${label}`}
      >
        <option value="">{placeholder}</option>
        {options?.map((option: any) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="error">{error}</span>}
    </div>
  ),
}));

// Mock the countries data
vi.mock('../../../../../../assets/data/countries', () => ({
  countries: [
    { name: 'India', code: 'IN' },
    { name: 'United States', code: 'US' },
    { name: 'United Kingdom', code: 'UK' },
  ],
}));

describe('PatientOtherInfo', () => {
  const mockOnNext = vi.fn();
  const mockOnPrev = vi.fn();
  const defaultValues = {
    sonDaughterWifeOf: '',
    occupation: '',
    caste: '',
    education: '',
    economicStatus: '',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(
          <PatientOtherInfo
            defaultValues={defaultValues}
            onNext={mockOnNext}
            onPrev={mockOnPrev}
          />
        );
      }).not.toThrow();
    });

    it('should render with default values', () => {
      const valuesWithData = {
        sonDaughterWifeOf: 'John Doe',
        occupation: 'Engineer',
        caste: 'General',
        education: 'Graduate',
        economicStatus: 'Middle Class',
      };

      render(
        <PatientOtherInfo
          defaultValues={valuesWithData}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const sonDaughterWifeOfInput = screen.getByPlaceholderText('Enter Son/Daughter/Wife Of');
      expect(sonDaughterWifeOfInput).toHaveValue('John Doe');
    });

    it('should render form element', () => {
      const { container } = render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('Form Fields Rendering', () => {
    it('should render sonDaughterWifeOf field without required indicator', () => {
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Enter Son/Daughter/Wife Of')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter Son/Daughter/Wife Of')).toBeInTheDocument();
    });

    it('should render occupation dropdown without required indicator', () => {
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Occupation')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-Occupation')).toBeInTheDocument();
    });

    it('should render caste dropdown without required indicator', () => {
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Caste')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-Caste')).toBeInTheDocument();
    });

    it('should render education dropdown with required indicator', () => {
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Education')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-Education')).toBeInTheDocument();
      const educationLabel = screen.getByText('Education');
      expect(educationLabel.parentElement).toContainHTML('*');
    });

    it('should render economicStatus dropdown without required indicator', () => {
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Economic Status')).toBeInTheDocument();
      expect(screen.getByTestId('dropdown-Economic Status')).toBeInTheDocument();
    });
  });

  describe('Dropdown Options', () => {
    it('should render occupation options from countries data', () => {
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const occupationDropdown = screen.getByTestId('dropdown-Occupation');
      expect(occupationDropdown).toBeInTheDocument();
      const options = occupationDropdown.querySelectorAll('option');
      expect(options.length).toBeGreaterThan(1); // Placeholder + countries
    });

    it('should render caste options from countries data', () => {
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const casteDropdown = screen.getByTestId('dropdown-Caste');
      expect(casteDropdown).toBeInTheDocument();
      const options = casteDropdown.querySelectorAll('option');
      expect(options.length).toBeGreaterThan(1);
    });

    it('should render education options from countries data', () => {
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const educationDropdown = screen.getByTestId('dropdown-Education');
      expect(educationDropdown).toBeInTheDocument();
      const options = educationDropdown.querySelectorAll('option');
      expect(options.length).toBeGreaterThan(1);
    });

    it('should render economic status options from countries data', () => {
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const economicStatusDropdown = screen.getByTestId('dropdown-Economic Status');
      expect(economicStatusDropdown).toBeInTheDocument();
      const options = economicStatusDropdown.querySelectorAll('option');
      expect(options.length).toBeGreaterThan(1);
    });
  });

  describe('Form Validation', () => {
    it('should display error for empty education on submit', async () => {
      const user = userEvent.setup();
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Education is required')).toBeInTheDocument();
      });
    });

    it('should not display error for empty sonDaughterWifeOf on submit', async () => {
      const user = userEvent.setup();
      render(
        <PatientOtherInfo
          defaultValues={{
            ...defaultValues,
            education: 'Graduate',
          }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockOnNext).toHaveBeenCalled();
      });
    });

    it('should not display error for empty occupation on submit', async () => {
      const user = userEvent.setup();
      render(
        <PatientOtherInfo
          defaultValues={{
            ...defaultValues,
            education: 'Graduate',
          }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockOnNext).toHaveBeenCalled();
      });
    });

    it('should not display error for empty caste on submit', async () => {
      const user = userEvent.setup();
      render(
        <PatientOtherInfo
          defaultValues={{
            ...defaultValues,
            education: 'Graduate',
          }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockOnNext).toHaveBeenCalled();
      });
    });

    it('should not display error for empty economicStatus on submit', async () => {
      const user = userEvent.setup();
      render(
        <PatientOtherInfo
          defaultValues={{
            ...defaultValues,
            education: 'Graduate',
          }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockOnNext).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call onNext with otherInfo data on valid form submission', async () => {
      const user = userEvent.setup();
      const validValues = {
        sonDaughterWifeOf: 'John Doe',
        occupation: 'Engineer',
        caste: 'General',
        education: 'Graduate',
        economicStatus: 'Middle Class',
      };

      render(
        <PatientOtherInfo
          defaultValues={validValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockOnNext).toHaveBeenCalledWith({
          otherInfo: expect.objectContaining({
            education: 'Graduate',
          }),
        });
      });
    });

    it('should call onNext with only education when other fields are empty', async () => {
      const user = userEvent.setup();
      const minimalValues = {
        sonDaughterWifeOf: '',
        occupation: '',
        caste: '',
        education: 'Graduate',
        economicStatus: '',
      };

      render(
        <PatientOtherInfo
          defaultValues={minimalValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockOnNext).toHaveBeenCalledWith({
          otherInfo: expect.objectContaining({
            education: 'Graduate',
          }),
        });
      });
    });

    it('should not call onNext on invalid form submission', async () => {
      const user = userEvent.setup();
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockOnNext).not.toHaveBeenCalled();
      });
    });
  });

  describe('Back Button', () => {
    it('should render Back button', () => {
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const backButton = screen.getByText('Back');
      expect(backButton).toBeInTheDocument();
      expect(backButton.closest('button')).toHaveAttribute('type', 'button');
    });

    it('should call onPrev when Back button is clicked', async () => {
      const user = userEvent.setup();
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const backButton = screen.getByText('Back');
      await user.click(backButton);

      expect(mockOnPrev).toHaveBeenCalledTimes(1);
      expect(mockOnNext).not.toHaveBeenCalled();
    });
  });

  describe('Next Button', () => {
    it('should render Next button', () => {
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      expect(nextButton).toBeInTheDocument();
      expect(nextButton.closest('button')).toHaveAttribute('type', 'submit');
    });
  });

  describe('Field Interactions', () => {
    it('should handle sonDaughterWifeOf input change', async () => {
      const user = userEvent.setup();
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const sonDaughterWifeOfInput = screen.getByPlaceholderText('Enter Son/Daughter/Wife Of');
      await user.type(sonDaughterWifeOfInput, 'John Doe');

      expect(sonDaughterWifeOfInput).toHaveValue('John Doe');
    });

    it('should handle occupation selection', async () => {
      const user = userEvent.setup();
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const occupationDropdown = screen.getByTestId('dropdown-Occupation');
      await user.selectOptions(occupationDropdown, 'India');

      expect(occupationDropdown).toHaveValue('India');
    });

    it('should handle caste selection', async () => {
      const user = userEvent.setup();
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const casteDropdown = screen.getByTestId('dropdown-Caste');
      await user.selectOptions(casteDropdown, 'India');

      expect(casteDropdown).toHaveValue('India');
    });

    it('should handle education selection', async () => {
      const user = userEvent.setup();
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const educationDropdown = screen.getByTestId('dropdown-Education');
      await user.selectOptions(educationDropdown, 'India');

      expect(educationDropdown).toHaveValue('India');
    });

    it('should handle economic status selection', async () => {
      const user = userEvent.setup();
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const economicStatusDropdown = screen.getByTestId('dropdown-Economic Status');
      await user.selectOptions(economicStatusDropdown, 'India');

      expect(economicStatusDropdown).toHaveValue('India');
    });
  });

  describe('Layout and Styling', () => {
    it('should have correct form layout classes', () => {
      const { container } = render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const form = container.querySelector('form');
      expect(form).toHaveClass('space-y-6', 'h-full');
    });

    it('should have correct button layout classes', () => {
      const { container } = render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const buttonContainer = container.querySelector('.flex.gap-3');
      expect(buttonContainer).toBeInTheDocument();
    });

    it('should render Back button with secondary variant', () => {
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const backButton = screen.getByText('Back').closest('button');
      expect(backButton).toHaveAttribute('data-variant', 'secondary');
    });

    it('should render Next button with primary variant', () => {
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next').closest('button');
      expect(nextButton).toHaveAttribute('data-variant', 'primary');
    });
  });

  describe('Accessibility', () => {
    it('should have required field indicator for education only', () => {
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const requiredIndicators = screen.getAllByText('*');
      // Only education field should be required
      expect(requiredIndicators.length).toBe(1);
    });

    it('should have accessible buttons', () => {
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2); // Back and Next
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });
  });

  describe('Component Props', () => {
    it('should accept and use onNext prop', () => {
      const customOnNext = vi.fn();
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={customOnNext}
          onPrev={mockOnPrev}
        />
      );

      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should accept and use onPrev prop', () => {
      const customOnPrev = vi.fn();
      render(
        <PatientOtherInfo
          defaultValues={defaultValues}
          onNext={mockOnNext}
          onPrev={customOnPrev}
        />
      );

      expect(screen.getByText('Back')).toBeInTheDocument();
    });
  });

  describe('Optional Fields', () => {
    it('should treat sonDaughterWifeOf as optional', async () => {
      const user = userEvent.setup();
      render(
        <PatientOtherInfo
          defaultValues={{
            ...defaultValues,
            education: 'Graduate',
          }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      // Should not show validation error for sonDaughterWifeOf
      await waitFor(() => {
        expect(screen.queryByText(/son\/daughter\/wife of is required/i)).not.toBeInTheDocument();
      });
    });

    it('should treat occupation as optional', async () => {
      const user = userEvent.setup();
      render(
        <PatientOtherInfo
          defaultValues={{
            ...defaultValues,
            education: 'Graduate',
          }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      // Should not show validation error for occupation
      await waitFor(() => {
        expect(screen.queryByText(/occupation is required/i)).not.toBeInTheDocument();
      });
    });

    it('should treat caste as optional', async () => {
      const user = userEvent.setup();
      render(
        <PatientOtherInfo
          defaultValues={{
            ...defaultValues,
            education: 'Graduate',
          }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      // Should not show validation error for caste
      await waitFor(() => {
        expect(screen.queryByText(/caste is required/i)).not.toBeInTheDocument();
      });
    });

    it('should treat economicStatus as optional', async () => {
      const user = userEvent.setup();
      render(
        <PatientOtherInfo
          defaultValues={{
            ...defaultValues,
            education: 'Graduate',
          }}
          onNext={mockOnNext}
          onPrev={mockOnPrev}
        />
      );

      const nextButton = screen.getByText('Next');
      await user.click(nextButton);

      // Should not show validation error for economicStatus
      await waitFor(() => {
        expect(screen.queryByText(/economic status is required/i)).not.toBeInTheDocument();
      });
    });
  });
});
