import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PatientPreviewComponent from '../../../../../../modules/patient/add/steps/patient-preview/patient-preview.component';
import type { PatientFormData } from '../../../../../../types/patient/add/add-patient.types';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock the common components
vi.mock('../../../../../../components/common', () => ({
  Button: ({ children, onClick, type, variant, className }: any) => (
    <button type={type} onClick={onClick} className={className} data-variant={variant}>
      {children}
    </button>
  ),
}));

// Mock storage — patient display info now persists to localStorage before navigate
const mockStorageSet = vi.fn();
const mockStorageRemove = vi.fn();
vi.mock('../../../../../../utils/storage', () => ({
  storage: {
    set: (...args: unknown[]) => mockStorageSet(...args),
    remove: (...args: unknown[]) => mockStorageRemove(...args),
    get: vi.fn(),
    getUser: vi.fn(),
  },
}));

describe('PatientPreviewComponent', () => {
  const completeData: PatientFormData = {
    personalInfo: {
      firstName: 'John',
      middleName: 'Michael',
      lastName: 'Doe',
      gender: 'M',
      dateOfBirth: '1990-01-01',
      age: '34',
      phoneNumber: '1234567890',
      phoneNumberCountryCode: '+91',
      contactType: 'Family',
      emergencyContactName: 'Jane Doe',
      emergencyContactNumber: '9876543210',
      emergencyContactNumberCountryCode: '+91',
      profilePhoto: null,
    },
    addressInfo: {
      postalCode: '123456',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      district: 'Bangalore Urban',
      correspondingAddress1: '123 Main Street',
      correspondingAddress2: 'Apt 4B',
    },
    otherInfo: {
      sonDaughterWifeOf: 'Robert Doe',
      occupation: 'Engineer',
      caste: 'General',
      education: 'Graduate',
      economicStatus: 'Middle Class',
    },
  };

  const minimalData: PatientFormData = {
    personalInfo: {
      firstName: 'John',
      middleName: '',
      lastName: 'Doe',
      gender: 'M',
      dateOfBirth: '1990-01-01',
      age: '',
      phoneNumber: '1234567890',
      phoneNumberCountryCode: '+91',
      contactType: 'Family',
      emergencyContactName: 'Jane Doe',
      emergencyContactNumber: '9876543210',
      emergencyContactNumberCountryCode: '+91',
      profilePhoto: null,
    },
    addressInfo: {
      postalCode: '123456',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      district: 'Bangalore Urban',
      correspondingAddress1: '123 Main Street',
      correspondingAddress2: 'Apt 4B',
    },
    otherInfo: {
      sonDaughterWifeOf: '',
      occupation: '',
      caste: '',
      education: 'Graduate',
      economicStatus: '',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Component Rendering', () => {
    it('should render without crashing', () => {
      expect(() => {
        render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      }).not.toThrow();
    });

    it('should render with complete patient data', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Doe')).toBeInTheDocument();
    });

    it('should render with minimal patient data', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={minimalData} />);
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Doe')).toBeInTheDocument();
    });
  });

  describe('Personal Info Card', () => {
    it('should render Personal card with title', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Personal')).toBeInTheDocument();
    });

    it('should display first name', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('First Name')).toBeInTheDocument();
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    it('should display middle name', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Middle Name')).toBeInTheDocument();
      expect(screen.getByText('Michael')).toBeInTheDocument();
    });

    it('should display last name', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Last Name')).toBeInTheDocument();
      expect(screen.getByText('Doe')).toBeInTheDocument();
    });

    it('should display date of birth', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Date of Birth')).toBeInTheDocument();
      expect(screen.getByText('1990-01-01')).toBeInTheDocument();
    });

    it('should display gender', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Gender')).toBeInTheDocument();
      expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('should display phone number with country code', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('+91 1234567890')).toBeInTheDocument();
    });

    it('should display contact type', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Contact Type')).toBeInTheDocument();
      expect(screen.getByText('Family')).toBeInTheDocument();
    });

    it('should display emergency contact name', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Emergency Contact Name')).toBeInTheDocument();
      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    });

    it('should display emergency contact number', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Emergency Contact Number')).toBeInTheDocument();
      expect(screen.getByText('9876543210')).toBeInTheDocument();
    });

    it('should have Change button for Personal card', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const changeButtons = screen.getAllByText('Change');
      expect(changeButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Address Info Card', () => {
    it('should render Address card with title', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Address')).toBeInTheDocument();
    });

    it('should display postal code', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Postal Code')).toBeInTheDocument();
      expect(screen.getByText('123456')).toBeInTheDocument();
    });

    it('should display city', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('City')).toBeInTheDocument();
      expect(screen.getByText('Bangalore')).toBeInTheDocument();
    });

    it('should display state', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('State')).toBeInTheDocument();
      expect(screen.getByText('Karnataka')).toBeInTheDocument();
    });

    it('should display country', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Country')).toBeInTheDocument();
      expect(screen.getByText('India')).toBeInTheDocument();
    });

    it('should display district', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('District')).toBeInTheDocument();
      expect(screen.getByText('Bangalore Urban')).toBeInTheDocument();
    });

    it('should display corresponding address 1', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Corresponding Address 1')).toBeInTheDocument();
      expect(screen.getByText('123 Main Street')).toBeInTheDocument();
    });

    it('should display corresponding address 2', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Corresponding Address 2')).toBeInTheDocument();
      expect(screen.getByText('Apt 4B')).toBeInTheDocument();
    });

    it('should have Change button for Address card', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const changeButtons = screen.getAllByText('Change');
      expect(changeButtons.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Other Info Card', () => {
    it('should render Other card with title', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Other')).toBeInTheDocument();
    });

    it('should display son/daughter/wife of', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Son/Daughter/Wife Of')).toBeInTheDocument();
      expect(screen.getByText('Robert Doe')).toBeInTheDocument();
    });

    it('should display occupation', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Occupation')).toBeInTheDocument();
      expect(screen.getByText('Engineer')).toBeInTheDocument();
    });

    it('should display caste', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Caste')).toBeInTheDocument();
      expect(screen.getByText('General')).toBeInTheDocument();
    });

    it('should display education', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Education')).toBeInTheDocument();
      expect(screen.getByText('Graduate')).toBeInTheDocument();
    });

    it('should display economic status', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Economic Status')).toBeInTheDocument();
      expect(screen.getByText('Middle Class')).toBeInTheDocument();
    });

    it('should have Change button for Other card', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const changeButtons = screen.getAllByText('Change');
      expect(changeButtons.length).toBe(3); // Personal, Address, and Other
    });
  });

  describe('Empty Value Handling', () => {
    it('should not display middle name when empty', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={minimalData} />);
      const middleNameLabel = screen.queryByText('Middle Name');
      // The label might be present but the value row should not be rendered
      expect(middleNameLabel).not.toBeInTheDocument();
    });

    it('should not display son/daughter/wife of when empty', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={minimalData} />);
      const label = screen.queryByText('Son/Daughter/Wife Of');
      expect(label).not.toBeInTheDocument();
    });

    it('should not display occupation when empty', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={minimalData} />);
      const label = screen.queryByText('Occupation');
      expect(label).not.toBeInTheDocument();
    });

    it('should not display caste when empty', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={minimalData} />);
      const label = screen.queryByText('Caste');
      expect(label).not.toBeInTheDocument();
    });

    it('should not display economic status when empty', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={minimalData} />);
      const label = screen.queryByText('Economic Status');
      expect(label).not.toBeInTheDocument();
    });

    it('should display education even when other fields are empty', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={minimalData} />);
      expect(screen.getByText('Education')).toBeInTheDocument();
      expect(screen.getByText('Graduate')).toBeInTheDocument();
    });
  });

  describe('Start Visit Button', () => {
    it('should render Start Visit button', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const startVisitButton = screen.getByRole('button', { name: /Start Visit/i });
      expect(startVisitButton).toBeInTheDocument();
    });

    it('should have correct button type', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const startVisitButton = screen.getByRole('button', { name: /Start Visit/i });
      expect(startVisitButton).toHaveAttribute('type', 'button');
    });

    it('should have primary variant', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const startVisitButton = screen.getByRole('button', { name: /Start Visit/i });
      expect(startVisitButton).toHaveAttribute('data-variant', 'primary');
    });

    it('should be clickable', async () => {
      const user = userEvent.setup();
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const startVisitButton = screen.getByRole('button', { name: /Start Visit/i });

      await user.click(startVisitButton);
      // Button click should not throw error
      expect(startVisitButton).toBeInTheDocument();
    });

    it('should navigate to /ayu with patientUuid and persist display info to storage when clicked', async () => {
      const user = userEvent.setup();
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const startVisitButton = screen.getByRole('button', { name: /Start Visit/i });

      await user.click(startVisitButton);

      // Patient display info persisted to localStorage
      expect(mockStorageSet).toHaveBeenCalledWith('patientName', 'John Michael Doe');
      expect(mockStorageSet).toHaveBeenCalledWith('patientAge', '34');
      expect(mockStorageSet).toHaveBeenCalledWith('patientGender', 'M');
      // temp_patient_id cleared after patient creation
      expect(mockStorageRemove).toHaveBeenCalledWith('temp_patient_id');
      // Navigate state only carries patientUuid
      expect(mockNavigate).toHaveBeenCalledWith('/ayu', {
        state: { patientUuid: 'test-uuid-123' },
      });
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it('should pass patientName without empty segments when middleName is missing', async () => {
      const user = userEvent.setup();
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={minimalData} />);
      const startVisitButton = screen.getByRole('button', { name: /Start Visit/i });

      await user.click(startVisitButton);

      expect(mockStorageSet).toHaveBeenCalledWith('patientName', 'John Doe');
      expect(mockStorageSet).toHaveBeenCalledWith('patientAge', '1990-01-01');
      expect(mockStorageSet).toHaveBeenCalledWith('patientGender', 'M');
      expect(mockNavigate).toHaveBeenCalledWith('/ayu', {
        state: { patientUuid: 'test-uuid-123' },
      });
    });
  });

  describe('Change Buttons', () => {
    it('should render three Change buttons for each section', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const changeButtons = screen.getAllByRole('button', { name: /Change/i });
      expect(changeButtons).toHaveLength(3);
    });

    it('should have Change button in Personal card', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Personal')).toBeInTheDocument();
      const changeButtons = screen.getAllByText('Change');
      expect(changeButtons.length).toBeGreaterThan(0);
    });

    it('should have Change button in Address card', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Address')).toBeInTheDocument();
      const changeButtons = screen.getAllByText('Change');
      expect(changeButtons.length).toBeGreaterThan(0);
    });

    it('should have Change button in Other card', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Other')).toBeInTheDocument();
      const changeButtons = screen.getAllByText('Change');
      expect(changeButtons.length).toBeGreaterThan(0);
    });

    it('should be clickable', async () => {
      const user = userEvent.setup();
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const changeButtons = screen.getAllByRole('button', { name: /Change/i });

      await user.click(changeButtons[0]);
      // Button click should not throw error
      expect(changeButtons[0]).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should have correct main container classes', () => {
      const { container } = render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('w-full', 'flex', 'flex-col', 'h-full');
    });

    it('should render three cards in grid layout', () => {
      const { container } = render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const gridContainer = container.querySelector('.grid.md\\:grid-cols-3');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should have correct card styling', () => {
      const { container } = render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const cards = container.querySelectorAll('.bg-white.shadow-sm.border.rounded-xl');
      expect(cards.length).toBe(3);
    });

    it('should have correct button container classes', () => {
      const { container } = render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const buttonContainer = container.querySelector('.flex.flex-col.md\\:flex-row');
      expect(buttonContainer).toBeInTheDocument();
      expect(buttonContainer).toHaveClass('justify-center', 'gap-3', 'pb-6');
    });
  });

  describe('Card Components', () => {
    it('should render card headers with correct styling', () => {
      const { container } = render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const cardHeaders = container.querySelectorAll('h2.font-semibold.text-gray-800');
      expect(cardHeaders.length).toBe(3);
    });

    it('should render list items with correct structure', () => {
      const { container } = render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const lists = container.querySelectorAll('ul.text-sm.text-gray-700.space-y-1');
      expect(lists.length).toBe(3);
    });

    it('should render detail items with correct layout', () => {
      const { container } = render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const detailItems = container.querySelectorAll('li.flex');
      expect(detailItems.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button elements', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should have semantic HTML structure', () => {
      const { container } = render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const headings = container.querySelectorAll('h2');
      expect(headings.length).toBe(3);
      headings.forEach(heading => {
        expect(heading.tagName).toBe('H2');
      });
    });

    it('should have proper list structure', () => {
      const { container } = render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const lists = container.querySelectorAll('ul');
      expect(lists.length).toBe(3);
      lists.forEach(list => {
        const items = list.querySelectorAll('li');
        expect(items.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Display', () => {
    it('should correctly format phone number with country code', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('+91 1234567890')).toBeInTheDocument();
    });

    it('should display all non-empty values', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);

      // Personal Info
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Michael')).toBeInTheDocument();
      expect(screen.getByText('Doe')).toBeInTheDocument();

      // Address Info
      expect(screen.getByText('123456')).toBeInTheDocument();
      expect(screen.getByText('Bangalore')).toBeInTheDocument();

      // Other Info
      expect(screen.getByText('Robert Doe')).toBeInTheDocument();
      expect(screen.getByText('Engineer')).toBeInTheDocument();
    });

    it('should handle null values gracefully', () => {
      const dataWithNulls = {
        ...completeData,
        personalInfo: {
          ...completeData.personalInfo,
          middleName: '',
        },
      };

      expect(() => {
        render(<PatientPreviewComponent patientUuid="test-uuid-123" data={dataWithNulls} />);
      }).not.toThrow();
    });
  });

  describe('Card Titles', () => {
    it('should render Personal card title', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const personalTitle = screen.getByText('Personal');
      expect(personalTitle.tagName).toBe('H2');
    });

    it('should render Address card title', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const addressTitle = screen.getByText('Address');
      expect(addressTitle.tagName).toBe('H2');
    });

    it('should render Other card title', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      const otherTitle = screen.getByText('Other');
      expect(otherTitle.tagName).toBe('H2');
    });
  });

  describe('Component Props', () => {
    it('should accept data prop', () => {
      expect(() => {
        render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      }).not.toThrow();
    });

    it('should render correctly with different data sets', () => {
      const { rerender } = render(<PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />);
      expect(screen.getByText('Michael')).toBeInTheDocument();

      rerender(<PatientPreviewComponent patientUuid="test-uuid-123" data={minimalData} />);
      expect(screen.queryByText('Michael')).not.toBeInTheDocument();
    });
  });
});
