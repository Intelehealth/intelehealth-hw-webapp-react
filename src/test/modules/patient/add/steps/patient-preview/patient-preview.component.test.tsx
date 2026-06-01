import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PatientPreviewComponent from '../../../../../../modules/patient/add/steps/patient-preview/patient-preview.component';
import type { PatientFormData } from '../../../../../../types/patient/add/add-patient.types';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../../../../../components/common', () => ({
  Button: ({ children, onClick, type, variant }: any) => (
    <button type={type} onClick={onClick} data-variant={variant}>
      {children}
    </button>
  ),
}));

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

const h = vi.hoisted(() => ({ mockGetPatient: vi.fn() }));
vi.mock('../../../../../../modules/patient/add/add-patient.service', () => ({
  patientService: {
    getPatient: (...args: unknown[]) => h.mockGetPatient(...args),
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
      contactType: '',
      emergencyContactName: '',
      emergencyContactNumber: '',
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

  // gender + age empty (no header meta), phone empty, with an uploaded photo
  const edgeData: PatientFormData = {
    ...completeData,
    personalInfo: {
      ...completeData.personalInfo,
      gender: '',
      age: '',
      phoneNumber: '',
      profilePhoto: 'data:image/png;base64,ZZZ',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: a pending fetch so renders that don't care about the ID don't
    // trigger async state updates. ID-specific tests override this.
    h.mockGetPatient.mockReturnValue(new Promise(() => {}));
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      expect(() =>
        render(
          <PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />
        )
      ).not.toThrow();
    });

    it('renders the combined full name', () => {
      render(
        <PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />
      );
      expect(screen.getAllByText('John Michael Doe').length).toBeGreaterThan(0);
    });

    it('joins the name without empty segments when middle name is missing', () => {
      render(
        <PatientPreviewComponent patientUuid="test-uuid-123" data={minimalData} />
      );
      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
      expect(screen.queryByText('Michael')).not.toBeInTheDocument();
    });

    it('renders the three section titles', () => {
      render(
        <PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />
      );
      expect(screen.getByText('Personal')).toBeInTheDocument();
      expect(screen.getByText('Address')).toBeInTheDocument();
      expect(screen.getByText('Other')).toBeInTheDocument();
    });

    it('has the main container layout classes', () => {
      const { container } = render(
        <PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />
      );
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('w-full', 'flex', 'flex-col', 'h-full');
    });
  });

  describe('Header card', () => {
    it('shows gender initial and age as meta next to the name', () => {
      render(
        <PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />
      );
      expect(screen.getByText('M 34')).toBeInTheDocument();
    });

    it('renders without meta when gender and age are empty', () => {
      render(
        <PatientPreviewComponent patientUuid="test-uuid-123" data={edgeData} />
      );
      expect(screen.queryByText('M 34')).not.toBeInTheDocument();
      // name still renders
      expect(screen.getAllByText('John Michael Doe').length).toBeGreaterThan(0);
    });

    it('renders a placeholder Edit button', () => {
      render(
        <PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />
      );
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('uses the uploaded profile photo when provided', () => {
      render(<PatientPreviewComponent patientUuid="test-uuid-123" data={edgeData} />);
      const img = screen.getByAltText('John Michael Doe') as HTMLImageElement;
      expect(img.src).toContain('data:image/png;base64,ZZZ');
    });

    it('falls back to a default photo when none is provided', () => {
      render(
        <PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />
      );
      const img = screen.getByAltText('John Michael Doe') as HTMLImageElement;
      expect(img.src).not.toContain('data:image/png;base64');
      expect(img.getAttribute('src')).toBeTruthy();
    });
  });

  describe('Patient ID fetch', () => {
    it('fetches and renders the OpenMRS ID', async () => {
      h.mockGetPatient.mockResolvedValue({
        identifiers: [{ identifier: 'PID123', preferred: true }],
      });
      render(
        <PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />
      );
      expect(await screen.findByText('ID: PID123')).toBeInTheDocument();
      expect(h.mockGetPatient).toHaveBeenCalledWith('test-uuid-123');
    });

    it('does not fetch or show an ID when patientUuid is null', () => {
      render(<PatientPreviewComponent patientUuid={null} data={completeData} />);
      expect(h.mockGetPatient).not.toHaveBeenCalled();
      expect(screen.queryByText(/^ID:/)).not.toBeInTheDocument();
    });

    it('shows no ID when the patient has no identifiers', async () => {
      h.mockGetPatient.mockResolvedValue({ identifiers: [] });
      render(
        <PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />
      );
      await waitFor(() => expect(h.mockGetPatient).toHaveBeenCalledTimes(1));
      expect(screen.queryByText(/^ID:/)).not.toBeInTheDocument();
    });

    it('shows no ID when the response has no identifiers field', async () => {
      h.mockGetPatient.mockResolvedValue({});
      render(
        <PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />
      );
      await waitFor(() => expect(h.mockGetPatient).toHaveBeenCalledTimes(1));
      expect(screen.queryByText(/^ID:/)).not.toBeInTheDocument();
    });

    it('handles a fetch rejection gracefully', async () => {
      h.mockGetPatient.mockRejectedValue(new Error('network'));
      render(
        <PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />
      );
      await waitFor(() => expect(h.mockGetPatient).toHaveBeenCalledTimes(1));
      expect(screen.queryByText(/^ID:/)).not.toBeInTheDocument();
      expect(screen.getAllByText('John Michael Doe').length).toBeGreaterThan(0);
    });
  });

  describe('Personal section', () => {
    it('renders the Figma personal fields', () => {
      render(
        <PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />
      );
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Gender')).toBeInTheDocument();
      expect(screen.getByText('Date of birth')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('Phone number')).toBeInTheDocument();
      expect(screen.getByText('1990-01-01')).toBeInTheDocument();
      expect(screen.getByText('34')).toBeInTheDocument();
      expect(screen.getByText('+91 1234567890')).toBeInTheDocument();
    });
  });

  describe('Address section', () => {
    it('renders the Figma address fields', () => {
      render(
        <PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />
      );
      expect(screen.getByText('Postal code')).toBeInTheDocument();
      expect(screen.getByText('123456')).toBeInTheDocument();
      expect(screen.getByText('Country')).toBeInTheDocument();
      expect(screen.getByText('India')).toBeInTheDocument();
      expect(screen.getByText('State')).toBeInTheDocument();
      expect(screen.getByText('Karnataka')).toBeInTheDocument();
      expect(screen.getByText('District')).toBeInTheDocument();
      expect(screen.getByText('Bangalore Urban')).toBeInTheDocument();
      expect(screen.getByText('Village/Town/City')).toBeInTheDocument();
      expect(screen.getByText('Bangalore')).toBeInTheDocument();
      expect(screen.getByText('Corresponding Address 1')).toBeInTheDocument();
      expect(screen.getByText('123 Main Street')).toBeInTheDocument();
    });
  });

  describe('Other section', () => {
    it('renders the Figma other fields', () => {
      render(
        <PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />
      );
      expect(screen.getByText('Son/Daughter/Wife of')).toBeInTheDocument();
      expect(screen.getByText('Robert Doe')).toBeInTheDocument();
      expect(screen.getByText('Occupation')).toBeInTheDocument();
      expect(screen.getByText('Engineer')).toBeInTheDocument();
      expect(screen.getByText('Caste')).toBeInTheDocument();
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Education')).toBeInTheDocument();
      expect(screen.getByText('Graduate')).toBeInTheDocument();
      expect(screen.getByText('Economic status')).toBeInTheDocument();
      expect(screen.getByText('Middle Class')).toBeInTheDocument();
    });
  });

  describe('Empty value handling', () => {
    it('shows "Not provided" for blank fields', () => {
      render(
        <PatientPreviewComponent patientUuid="test-uuid-123" data={minimalData} />
      );
      // occupation, caste, economic status, son/daughter/wife of, age are blank
      expect(screen.getAllByText('Not provided').length).toBeGreaterThanOrEqual(
        4
      );
    });

    it('still renders labels for blank fields', () => {
      render(
        <PatientPreviewComponent patientUuid="test-uuid-123" data={minimalData} />
      );
      expect(screen.getByText('Occupation')).toBeInTheDocument();
      expect(screen.getByText('Caste')).toBeInTheDocument();
      expect(screen.getByText('Economic status')).toBeInTheDocument();
    });
  });

  describe('Start visit button', () => {
    it('renders a primary "Start visit" button of type button', () => {
      render(
        <PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />
      );
      const btn = screen.getByRole('button', { name: /Start visit/i });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveAttribute('type', 'button');
      expect(btn).toHaveAttribute('data-variant', 'primary');
    });

    it('persists display info and navigates to /ayu when clicked', async () => {
      const user = userEvent.setup();
      render(
        <PatientPreviewComponent patientUuid="test-uuid-123" data={completeData} />
      );
      await user.click(screen.getByRole('button', { name: /Start visit/i }));

      expect(mockStorageSet).toHaveBeenCalledWith(
        'patientName',
        'John Michael Doe'
      );
      expect(mockStorageSet).toHaveBeenCalledWith('patientAge', '34');
      expect(mockStorageSet).toHaveBeenCalledWith('patientGender', 'M');
      expect(mockStorageRemove).toHaveBeenCalledWith('temp_patient_id');
      expect(mockStorageRemove).toHaveBeenCalledWith('temp_visit_id');
      expect(mockNavigate).toHaveBeenCalledWith('/ayu', {
        state: { patientUuid: 'test-uuid-123' },
      });
    });

    it('falls back to date of birth for age when age is empty', async () => {
      const user = userEvent.setup();
      render(
        <PatientPreviewComponent patientUuid="test-uuid-123" data={minimalData} />
      );
      await user.click(screen.getByRole('button', { name: /Start visit/i }));

      expect(mockStorageSet).toHaveBeenCalledWith('patientName', 'John Doe');
      expect(mockStorageSet).toHaveBeenCalledWith('patientAge', '1990-01-01');
      expect(mockStorageSet).toHaveBeenCalledWith('patientGender', 'M');
    });
  });
});
