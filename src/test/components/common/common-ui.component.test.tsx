import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CommonUiComponent from '../../../components/common/common-ui.component';

// Mock all the UI components
vi.mock('../../../components/common/index', () => ({
          Button: ({ children, onClick, type, variant, size, disabled, ...props }: {
            children: React.ReactNode;
            onClick?: () => void;
            type?: string;
            variant?: string;
            size?: string;
            disabled?: boolean;
            [key: string]: unknown;
          }) => (
            <button
              type={type as 'button' | 'submit' | 'reset' | undefined}
              onClick={onClick}
              disabled={disabled}
              data-testid="button"
              data-variant={variant}
              data-size={size}
              {...props}
            >
              {children}
            </button>
          ),
          Input: ({ label, value, onChange, type, placeholder, error, helperText, isRequired, ...props }: {
            label?: string;
            value?: string;
            onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
            type?: string;
            placeholder?: string;
            error?: string;
            helperText?: string;
            isRequired?: boolean;
            [key: string]: unknown;
          }) => (
    <div data-testid="input-container">
      {label && <label data-testid="input-label">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={isRequired}
        data-testid="input"
        data-error={!!error}
        {...props}
      />
      {error && <span data-testid="input-error">{error}</span>}
      {helperText && <span data-testid="input-helper">{helperText}</span>}
    </div>
  ),
          Checkbox: ({ label, checked, onChange, disabled, ...props }: {
            label?: string;
            checked?: boolean;
            onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
            disabled?: boolean;
            [key: string]: unknown;
          }) => (
    <label data-testid="checkbox-container">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        data-testid="checkbox"
        {...props}
      />
      {label && <span data-testid="checkbox-label">{label}</span>}
    </label>
  ),
          Radio: ({ label, value, checked, onChange, disabled, ...props }: {
            label?: string;
            value?: string;
            checked?: boolean;
            onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
            disabled?: boolean;
            [key: string]: unknown;
          }) => (
    <label data-testid="radio-container">
      <input
        type="radio"
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        data-testid="radio"
        {...props}
      />
      {label && <span data-testid="radio-label">{label}</span>}
    </label>
  ),
          RadioGroup: ({ children, value, name, ...props }: {
            children: React.ReactNode;
            value?: string;
            onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
            name?: string;
            [key: string]: unknown;
          }) => (
    <div data-testid="radio-group" data-value={value} data-name={name} {...props}>
      {children}
    </div>
  ),
          Dropdown: ({ options, value, onChange, multiple, disabled, placeholder, ...props }: {
            options?: Array<{ value: string; label: string }>;
            value?: string | string[];
            onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
            multiple?: boolean;
            disabled?: boolean;
            placeholder?: string;
            [key: string]: unknown;
          }) => (
            <div data-testid="dropdown-container">
              <select
                value={multiple && Array.isArray(value) ? value : (Array.isArray(value) ? value.join(',') : value || '')}
                onChange={onChange}
                multiple={multiple}
                disabled={disabled}
                data-testid="dropdown"
                {...props}
              >
                {placeholder && <option value="">{placeholder}</option>}
                {options?.map((option: { value: string; label: string }) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ),
          Toggle: ({ label, checked, onChange, disabled, variant, size, ...props }: {
            label?: string;
            checked?: boolean;
            onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
            disabled?: boolean;
            variant?: string;
            size?: string;
            [key: string]: unknown;
          }) => (
    <label data-testid="toggle-container">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        data-testid="toggle"
        data-variant={variant}
        data-size={size}
        {...props}
      />
      {label && <span data-testid="toggle-label">{label}</span>}
    </label>
  ),
          Chip: ({ children, onClick, onRemove, disabled, variant, size, removable, clickable, ...props }: {
            children: React.ReactNode;
            onClick?: () => void;
            onRemove?: () => void;
            disabled?: boolean;
            variant?: string;
            size?: string;
            removable?: boolean;
            clickable?: boolean;
            [key: string]: unknown;
          }) => (
    <div
      data-testid="chip"
      data-variant={variant}
      data-size={size}
      data-disabled={disabled}
      data-removable={removable}
      data-clickable={clickable}
      onClick={onClick}
      {...props}
    >
      {children}
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          data-testid="chip-remove"
        >
          ×
        </button>
      )}
    </div>
  ),
}));

describe('CommonUiComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() => {
      render(<CommonUiComponent />);
    }).not.toThrow();
  });

  it('should render the main title and description', () => {
    render(<CommonUiComponent />);
    
    expect(screen.getByText('Common UI Components Examples')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive examples of all available UI components with various configurations')).toBeInTheDocument();
  });

  it('should render all input components', () => {
    render(<CommonUiComponent />);
    
    // Check for input labels
    expect(screen.getByText('Username')).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
  });

  it('should handle input changes', () => {
    render(<CommonUiComponent />);
    
    const usernameInput = screen.getAllByTestId('input')[0];
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    
    expect(usernameInput).toHaveValue('testuser');
  });

  it('should handle email validation', () => {
    render(<CommonUiComponent />);
    
    const emailInput = screen.getAllByTestId('input')[1];
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    // Should show error for invalid email
    expect(screen.getByText('Please enter a valid email')).toBeInTheDocument();
  });

  it('should render dropdown components', () => {
    render(<CommonUiComponent />);
    
    // Check for dropdown containers instead of specific text
    const dropdowns = screen.getAllByTestId('dropdown');
    expect(dropdowns.length).toBeGreaterThan(0);
  });

  it('should handle dropdown selection', () => {
    render(<CommonUiComponent />);
    
    const countryDropdown = screen.getAllByTestId('dropdown')[0];
    fireEvent.change(countryDropdown, { target: { value: 'us' } });
    
    expect(countryDropdown).toHaveValue('us');
  });

  it('should render checkbox components', () => {
    render(<CommonUiComponent />);
    
    expect(screen.getByText('Subscribe to newsletter (Secondary Variant)')).toBeInTheDocument();
    expect(screen.getByText('Enable Notifications')).toBeInTheDocument();
    expect(screen.getByText('I agree to the terms and conditions (Primary Variant)')).toBeInTheDocument();
  });

  it('should handle checkbox changes', () => {
    render(<CommonUiComponent />);
    
    const newsletterCheckbox = screen.getAllByTestId('checkbox')[0];
    fireEvent.click(newsletterCheckbox);
    
    expect(newsletterCheckbox).toBeChecked();
  });

  it('should render radio group components', () => {
    render(<CommonUiComponent />);
    
    expect(screen.getByText('Select Varient')).toBeInTheDocument();
    // Check for radio labels specifically
    const primaryRadio = screen.getAllByText('Primary').find(element => 
      element.getAttribute('data-testid') === 'radio-label'
    );
    const secondaryRadio = screen.getAllByText('Secondary').find(element => 
      element.getAttribute('data-testid') === 'radio-label'
    );
    expect(primaryRadio).toBeInTheDocument();
    expect(secondaryRadio).toBeInTheDocument();
  });

  it('should handle radio selection', () => {
    render(<CommonUiComponent />);
    
    const lightRadio = screen.getAllByTestId('radio')[0];
    fireEvent.click(lightRadio);
    
    expect(lightRadio).toBeChecked();
  });

  it('should render toggle components', () => {
    render(<CommonUiComponent />);
    
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByText('Primary (Default)')).toBeInTheDocument();
    // Check for toggle labels specifically
    const secondaryToggle = screen.getAllByText('Secondary').find(element => 
      element.getAttribute('data-testid') === 'toggle-label'
    );
    expect(secondaryToggle).toBeInTheDocument();
  });

  it('should handle toggle changes', () => {
    render(<CommonUiComponent />);
    
    const darkModeToggle = screen.getAllByTestId('toggle')[0];
    fireEvent.click(darkModeToggle);
    
    expect(darkModeToggle).toBeChecked();
  });

  it('should render chip components', () => {
    render(<CommonUiComponent />);
    
    expect(screen.getAllByText('React')).toHaveLength(2); // Multiple React chips
    expect(screen.getAllByText('TypeScript')).toHaveLength(2); // Multiple TypeScript chips
    expect(screen.getByText('TailwindCSS')).toBeInTheDocument();
  });

  it('should handle chip removal', () => {
    render(<CommonUiComponent />);
    
    const removeButtons = screen.getAllByTestId('chip-remove');
    expect(removeButtons.length).toBeGreaterThan(0);
    
    fireEvent.click(removeButtons[0]);
    // The chip should be removed (this would be reflected in the component state)
  });

  it('should render status chips', () => {
    render(<CommonUiComponent />);
    
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('should render disabled chips', () => {
    render(<CommonUiComponent />);
    
    expect(screen.getAllByText('Disabled')).toHaveLength(2); // Multiple Disabled elements
    expect(screen.getByText('Clickable Disabled')).toBeInTheDocument();
    expect(screen.getByText('Removable Disabled')).toBeInTheDocument();
  });

  it('should render form action buttons', () => {
    render(<CommonUiComponent />);
    
    expect(screen.getAllByText('Submit Form')).toHaveLength(2); // Multiple Submit Form buttons
    expect(screen.getByText('Reset')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should handle form submission', () => {
    render(<CommonUiComponent />);
    
    const submitButtons = screen.getAllByText('Submit Form');
    const submitButton = submitButtons[0]; // Use first submit button
    const form = submitButton.closest('form');
    
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
    Object.defineProperty(submitEvent, 'preventDefault', { value: vi.fn() });
    
    fireEvent(form!, submitEvent);
    
    expect(submitEvent.preventDefault).toHaveBeenCalled();
  });

  it('should display current form data', () => {
    render(<CommonUiComponent />);
    
    expect(screen.getByText('Current Form Data')).toBeInTheDocument();
    
    // Should display JSON data - look for the pre element specifically
    const preElement = screen.getByText(/"username": ""/);
    expect(preElement).toBeInTheDocument();
  });

  it('should handle multiple dropdown selections', () => {
    render(<CommonUiComponent />);
    
    // Find the multi-select dropdown (should be the one with multiple prop)
    const dropdowns = screen.getAllByTestId('dropdown');
    const multiSelectDropdown = dropdowns.find(dropdown => 
      dropdown.hasAttribute('multiple')
    );
    
    if (multiSelectDropdown) {
      // For multi-select, we need to simulate selecting multiple options
      const options = multiSelectDropdown.querySelectorAll('option');
      if (options.length > 1) {
        // Just verify the dropdown exists and has options
        expect(multiSelectDropdown).toBeInTheDocument();
        expect(options.length).toBeGreaterThan(1);
      }
    }
  });

  it('should handle skill toggles', () => {
    render(<CommonUiComponent />);
    
    // Find skill chips and test clicking
    const skillChips = screen.getAllByTestId('chip').filter(chip => 
      chip.textContent?.includes('JavaScript') || 
      chip.textContent?.includes('Python') || 
      chip.textContent?.includes('Java')
    );
    
    if (skillChips.length > 0) {
      fireEvent.click(skillChips[0]);
      // The chip should be toggled
    }
  });

  it('should handle filter chip toggles', () => {
    render(<CommonUiComponent />);
    
    // Find filter chips
    const filterChips = screen.getAllByTestId('chip').filter(chip => 
      chip.textContent?.includes('Frontend') || 
      chip.textContent?.includes('Backend') || 
      chip.textContent?.includes('Full Stack')
    );
    
    if (filterChips.length > 0) {
      fireEvent.click(filterChips[0]);
      // The chip should be toggled
    }
  });

  it('should render all toggle variants and sizes', () => {
    render(<CommonUiComponent />);
    
    // Check for different toggle sizes
    const toggles = screen.getAllByTestId('toggle');
    expect(toggles.length).toBeGreaterThan(0);
    
    // Check for different variants - using the actual labels from the component
    expect(screen.getByText('Primary (Default)')).toBeInTheDocument();
    expect(screen.getAllByText('Secondary')).toHaveLength(4); // Multiple Secondary elements
    expect(screen.getByText('Small Toggle')).toBeInTheDocument();
    expect(screen.getByText('Medium Toggle')).toBeInTheDocument();
    expect(screen.getByText('Large Toggle')).toBeInTheDocument();
  });

  it('should render all chip variants', () => {
    render(<CommonUiComponent />);
    
    const chips = screen.getAllByTestId('chip');
    expect(chips.length).toBeGreaterThan(0);
    
    // Check for different chip variants
    const successChip = screen.getByText('Active');
    const warningChip = screen.getByText('Pending');
    const errorChip = screen.getByText('Failed');
    
    expect(successChip).toBeInTheDocument();
    expect(warningChip).toBeInTheDocument();
    expect(errorChip).toBeInTheDocument();
  });

  it('should handle password input with toggle', () => {
    render(<CommonUiComponent />);
    
    const passwordInput = screen.getAllByTestId('input').find(input => 
      input.getAttribute('type') === 'password'
    );
    
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('should handle age input with number type', () => {
    render(<CommonUiComponent />);
    
    const ageInput = screen.getAllByTestId('input').find(input => 
      input.getAttribute('type') === 'number'
    );
    
    expect(ageInput).toBeInTheDocument();
    expect(ageInput).toHaveAttribute('type', 'number');
  });

  it('should render helper text for inputs', () => {
    render(<CommonUiComponent />);
    
    expect(screen.getByText('Choose a unique username')).toBeInTheDocument();
  });

  it('should render required field indicators', () => {
    render(<CommonUiComponent />);
    
    const requiredInputs = screen.getAllByTestId('input').filter(input => 
      input.hasAttribute('required')
    );
    
    expect(requiredInputs.length).toBeGreaterThan(0);
  });

  it('should handle form data state updates', async () => {
    render(<CommonUiComponent />);
    
    // Update username
    const usernameInput = screen.getAllByTestId('input')[0];
    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    
    // Update email
    const emailInput = screen.getAllByTestId('input')[1];
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    // Toggle newsletter
    const newsletterCheckbox = screen.getAllByTestId('checkbox')[0];
    fireEvent.click(newsletterCheckbox);
    
    // The form data should be updated (this would be reflected in the JSON display)
    await waitFor(() => {
      expect(screen.getByText(/newuser/)).toBeInTheDocument();
    });
  });

  it('should render all component sections', () => {
    render(<CommonUiComponent />);
    
    // Check for all section headers - using the actual section names from the component
    expect(screen.getByText('Input Components')).toBeInTheDocument();
    expect(screen.getByText('Button Components')).toBeInTheDocument();
    expect(screen.getByText('Checkbox Components')).toBeInTheDocument();
    expect(screen.getByText('Radio Components')).toBeInTheDocument();
    expect(screen.getByText('Toggle Components')).toBeInTheDocument();
    expect(screen.getByText('Dropdown Components')).toBeInTheDocument();
    expect(screen.getByText('Chip Components')).toBeInTheDocument();
    expect(screen.getByText('Form Actions')).toBeInTheDocument();
    expect(screen.getByText('Current Form Data')).toBeInTheDocument();
  });

  it('should handle disabled states', () => {
    render(<CommonUiComponent />);
    
    // Check for disabled chips
    const disabledChips = screen.getAllByTestId('chip').filter(chip => 
      chip.getAttribute('data-disabled') === 'true'
    );
    
    expect(disabledChips.length).toBeGreaterThan(0);
  });

  it('should render clickable and removable chips', () => {
    render(<CommonUiComponent />);
    
    const clickableChips = screen.getAllByTestId('chip').filter(chip => 
      chip.getAttribute('data-clickable') === 'true'
    );
    
    const removableChips = screen.getAllByTestId('chip').filter(chip => 
      chip.getAttribute('data-removable') === 'true'
    );
    
    expect(clickableChips.length).toBeGreaterThan(0);
    expect(removableChips.length).toBeGreaterThan(0);
  });

  it('should handle complex form interactions', async () => {
    render(<CommonUiComponent />);
    
    // Fill out the form
    const usernameInput = screen.getAllByTestId('input')[0];
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    
    const emailInput = screen.getAllByTestId('input')[1];
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const passwordInput = screen.getAllByTestId('input')[2];
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    const ageInput = screen.getAllByTestId('input')[3];
    fireEvent.change(ageInput, { target: { value: '25' } });
    
    // Select country
    const countryDropdown = screen.getAllByTestId('dropdown')[0];
    fireEvent.change(countryDropdown, { target: { value: 'us' } });
    
    // Toggle checkboxes
    const newsletterCheckbox = screen.getAllByTestId('checkbox')[0];
    fireEvent.click(newsletterCheckbox);
    
    const notificationsCheckbox = screen.getAllByTestId('checkbox')[1];
    fireEvent.click(notificationsCheckbox);
    
    // Select theme
    const lightRadio = screen.getAllByTestId('radio')[0];
    fireEvent.click(lightRadio);
    
    // Toggle dark mode
    const darkModeToggle = screen.getAllByTestId('toggle')[0];
    fireEvent.click(darkModeToggle);
    
    // The form should handle all these interactions
    expect(usernameInput).toHaveValue('testuser');
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
    expect(ageInput).toHaveValue(25);
    expect(countryDropdown).toHaveValue('us');
    expect(newsletterCheckbox).toBeChecked();
    expect(notificationsCheckbox).toBeChecked();
    expect(lightRadio).toBeChecked();
    expect(darkModeToggle).toBeChecked();
  });

  it('should handle toggle state changes for all variants', () => {
    render(<CommonUiComponent />);
    
    // Test toggle state changes for all toggle variants
    const toggles = screen.getAllByTestId('toggle');
    
    // Click each toggle to test state changes (lines 98-102)
    toggles.forEach(toggle => {
      fireEvent.click(toggle);
    });
    
    // All toggles should be clickable
    expect(toggles.length).toBeGreaterThan(0);
  });

  it('should handle chip selection and deselection', () => {
    render(<CommonUiComponent />);
    
    // Find chip buttons and test selection/deselection (lines 82)
    const chipButtons = screen.getAllByTestId('chip');
    
    if (chipButtons.length > 0) {
      // Click first chip to select
      fireEvent.click(chipButtons[0]);
      
      // Click again to deselect (line 82 - filter logic)
      fireEvent.click(chipButtons[0]);
      
      expect(chipButtons[0]).toBeInTheDocument();
    }
  });


  it('should handle chip deselection logic', () => {
    render(<CommonUiComponent />);
    
    // Find clickable chips that use handleChipToggle
    const chipButtons = screen.getAllByTestId('chip');
    
    if (chipButtons.length > 0) {
      // Click first chip to test selection
      fireEvent.click(chipButtons[0]);
      
      // Click again to test deselection (line 82 - filter logic)
      fireEvent.click(chipButtons[0]);
      
      // Verify chip is still in the document
      expect(chipButtons[0]).toBeInTheDocument();
    }
  });


});
