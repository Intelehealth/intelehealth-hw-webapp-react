import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AddPatientComponent from '../../../../modules/patient/add/add-patient.component';
import { ADD_PATIENT_LABEL, PATIENT_DETAILS_LABEL } from '../../../../utils/constant';

// Mock temp-storage service
const mockGetResource = vi.fn();
const mockUpsertResource = vi.fn();
vi.mock('../../../../modules/ayu/services/temp-storage.service', () => ({
  getResource: (...args: unknown[]) => mockGetResource(...args),
  upsertResource: (...args: unknown[]) => mockUpsertResource(...args),
}));

// Mock storage
const mockStorageGet = vi.fn((_key: string): string | null => 'test-patient-id');
const mockStorageSet = vi.fn();
const mockStorageRemove = vi.fn();
const mockStorageGetUser = vi.fn(
  (): string | null => JSON.stringify({ uuid: 'user-uuid' })
);
vi.mock('../../../../utils/storage', () => ({
  storage: {
    get: (key: string) => mockStorageGet(key),
    set: (...args: unknown[]) => mockStorageSet(...(args as [])),
    remove: (...args: unknown[]) => mockStorageRemove(...(args as [])),
    getUser: () => mockStorageGetUser(),
  },
}));

// Mock the hooks
const mockHandleAddPatient = vi.fn();
vi.mock('../../../../modules/patient/add/add-patient.hooks', () => ({
  useAddPatient: () => ({
    handleAddPatient: mockHandleAddPatient,
  }),
}));

// Mock all the step components
vi.mock('../../../../modules/patient/add/steps/privacy-policy/patient-privacy-policy.component', () => ({
  default: ({ onNext, onPrev }: { onNext: (data: any) => void; onPrev: () => void }) => (
    <div data-testid="privacy-policy">
      <button data-testid="privacy-accept" onClick={() => onNext({ privacyPolicyAccepted: true })}>
        Accept
      </button>
      <button data-testid="privacy-decline" onClick={onPrev}>
        Decline
      </button>
    </div>
  ),
}));

vi.mock('../../../../modules/patient/add/steps/terms/terms.component', () => ({
  default: ({ onNext, onPrev }: { onNext: (data: any) => void; onPrev: () => void }) => (
    <div data-testid="terms">
      <button data-testid="terms-accept" onClick={() => onNext({ termsAccepted: true })}>
        Accept
      </button>
      <button data-testid="terms-decline" onClick={onPrev}>
        Decline
      </button>
    </div>
  ),
}));

vi.mock('../../../../modules/patient/add/steps/personal-info/patient-personal-info.component', () => ({
  default: ({
    onNext,
    onPrev,
    defaultValues,
  }: {
    onNext: (data: any) => void;
    onPrev: () => void;
    defaultValues: any;
  }) => (
    <div data-testid="personal-info">
      <div data-testid="personal-default-values">
        {JSON.stringify(defaultValues)}
      </div>
      <button
        data-testid="personal-next"
        onClick={() =>
          onNext({
            personalInfo: {
              firstName: 'John',
              middleName: 'M',
              lastName: 'Doe',
              gender: 'male',
              dateOfBirth: '1990-01-01',
              age: '34',
              phoneNumber: '1234567890',
              phoneNumberCountryCode: '+91',
              contactType: 'self',
              emergencyContactName: 'Jane Doe',
              emergencyContactNumber: '0987654321',
              emergencyContactNumberCountryCode: '+91',
              profilePhoto: 'base64string',
            },
          })
        }
      >
        Next
      </button>
      <button data-testid="personal-prev" onClick={onPrev}>
        Previous
      </button>
    </div>
  ),
}));

vi.mock('../../../../modules/patient/add/steps/address-info/patient-address-info.component', () => ({
  default: ({
    onNext,
    onPrev,
    defaultValues,
  }: {
    onNext: (data: any) => void;
    onPrev: () => void;
    defaultValues: any;
  }) => (
    <div data-testid="address-info">
      <div data-testid="address-default-values">
        {JSON.stringify(defaultValues)}
      </div>
      <button
        data-testid="address-next"
        onClick={() =>
          onNext({
            addressInfo: {
              postalCode: '123456',
              city: 'Mumbai',
              state: 'Maharashtra',
              country: 'India',
              district: 'Mumbai',
              correspondingAddress1: 'Address Line 1',
              correspondingAddress2: 'Address Line 2',
            },
          })
        }
      >
        Next
      </button>
      <button data-testid="address-prev" onClick={onPrev}>
        Previous
      </button>
    </div>
  ),
}));

vi.mock('../../../../modules/patient/add/steps/other-info/patient-other-info.component', () => ({
  default: ({
    onNext,
    onPrev,
    defaultValues,
  }: {
    onNext: (data: any) => void;
    onPrev: () => void;
    defaultValues: any;
  }) => (
    <div data-testid="other-info">
      <div data-testid="other-default-values">{JSON.stringify(defaultValues)}</div>
      <button
        data-testid="other-next"
        onClick={() =>
          onNext({
            otherInfo: {
              sonDaughterWifeOf: 'Parent Name',
              occupation: 'Engineer',
              caste: 'General',
              education: 'Graduate',
              economicStatus: 'Middle Class',
            },
          })
        }
      >
        Next
      </button>
      <button data-testid="other-prev" onClick={onPrev}>
        Previous
      </button>
    </div>
  ),
}));

vi.mock('../../../../modules/patient/add/steps/patient-preview/patient-preview.component', () => ({
  default: ({ data }: { data: any }) => (
    <div data-testid="preview">
      <div data-testid="preview-data">{JSON.stringify(data)}</div>
    </div>
  ),
}));

// Mock asset imports
vi.mock('../../../../assets/icons/icon-location-green-rounded-bordered.svg', () => ({
  default: 'icon-location-green-rounded-bordered.svg',
}));
vi.mock('../../../../assets/icons/icon-location-green-rounded-filled.svg', () => ({
  default: 'icon-location-green-rounded-filled.svg',
}));
vi.mock('../../../../assets/icons/icon-location-green-rounded.svg', () => ({
  default: 'icon-location-green-rounded.svg',
}));
vi.mock('../../../../assets/icons/icon-three-dot-green-rounded-bordered.svg', () => ({
  default: 'icon-three-dot-green-rounded-bordered.svg',
}));
vi.mock('../../../../assets/icons/icon-three-dot-green-rounded.svg', () => ({
  default: 'icon-three-dot-green-rounded.svg',
}));
vi.mock('../../../../assets/icons/icon-user-green-rounded-bordered.svg', () => ({
  default: 'icon-user-green-rounded-bordered.svg',
}));
vi.mock('../../../../assets/icons/icon-user-green-rounded-filled.svg', () => ({
  default: 'icon-user-green-rounded-filled.svg',
}));
vi.mock('../../../../assets/icons/icon-user-plus-green-rounded.svg', () => ({
  default: 'icon-user-plus-green-rounded.svg',
}));

// Helper function to render with router
const renderWithRouter = async (component: React.ReactElement) => {
  const result = render(<MemoryRouter>{component}</MemoryRouter>);
  // Wait for initial render + restore effect to settle
  await waitFor(() => {
    expect(screen.getByTestId('privacy-policy')).toBeInTheDocument();
  });
  return result;
};

describe('AddPatientComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: no saved record
    mockGetResource.mockRejectedValue(new Error('Not found'));
    mockUpsertResource.mockResolvedValue({ data: { id: 1 } });
    // Reset storage defaults
    mockStorageGet.mockReturnValue('test-patient-id');
    mockStorageGetUser.mockReturnValue(JSON.stringify({ uuid: 'user-uuid' }));
  });

  describe('Initial Render', () => {
    it('should render without crashing', async () => {
      await renderWithRouter(<AddPatientComponent />);
      expect(screen.getByTestId('privacy-policy')).toBeInTheDocument();
    });

    it('should start at step 0 (Privacy Policy)', async () => {
      await renderWithRouter(<AddPatientComponent />);
      expect(screen.getByTestId('privacy-policy')).toBeInTheDocument();
    });

    it('should render header with Add Patient label on desktop', async () => {
      await renderWithRouter(<AddPatientComponent />);
      const label = screen.getByText(ADD_PATIENT_LABEL);
      expect(label).toBeInTheDocument();
      expect(label).toHaveClass('text-base', 'font-semibold');
    });

    it('should render mobile header', async () => {
      await renderWithRouter(<AddPatientComponent />);
      const mobileHeader = screen.getByText('Add New Patient');
      expect(mobileHeader).toBeInTheDocument();
      expect(mobileHeader).toHaveClass('text-lg', 'font-semibold', 'md:hidden');
    });

    it('should render header with Patient Details label on Preview step', async () => {
      mockHandleAddPatient.mockResolvedValue(true);
      await renderWithRouter(<AddPatientComponent />);

      // Navigate through all steps to Preview
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => expect(screen.getByTestId('personal-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('personal-next'));
      await waitFor(() => expect(screen.getByTestId('address-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('address-next'));
      await waitFor(() => expect(screen.getByTestId('other-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('other-next'));

      await waitFor(() => {
        expect(screen.getByTestId('preview')).toBeInTheDocument();
      });

      const label = screen.getByText(PATIENT_DETAILS_LABEL);
      expect(label).toBeInTheDocument();
      expect(label).toHaveClass('text-base', 'font-semibold');
    });

    it('should render icon in header', async () => {
      const { container } = await renderWithRouter(<AddPatientComponent />);

      await waitFor(() => {
        const icon = container.querySelector('img[src="icon-user-plus-green-rounded.svg"]');
        expect(icon).toBeInTheDocument();
      });
    });

    it('should not show step indicator on Privacy Policy step', async () => {
      await renderWithRouter(<AddPatientComponent />);

      await waitFor(() => {
        const stepIndicators = screen.queryByAltText('Personal');
        expect(stepIndicators).not.toBeInTheDocument();
      });
    });
  });

  describe('Step Navigation', () => {
    it('should navigate from Privacy Policy to Terms', async () => {
      await renderWithRouter(<AddPatientComponent />);

      const acceptButton = screen.getByTestId('privacy-accept');
      fireEvent.click(acceptButton);

      await waitFor(() => {
        expect(screen.getByTestId('terms')).toBeInTheDocument();
      });
    });

    it('should navigate from Terms to Personal Info', async () => {
      await renderWithRouter(<AddPatientComponent />);

      // Go to Terms step
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());

      // Go to Personal Info step
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => {
        expect(screen.getByTestId('personal-info')).toBeInTheDocument();
      });
    });

    it('should navigate backwards from Terms to Privacy Policy', async () => {
      await renderWithRouter(<AddPatientComponent />);

      // Go to Terms
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());

      // Go back to Privacy Policy
      fireEvent.click(screen.getByTestId('terms-decline'));
      await waitFor(() => {
        expect(screen.getByTestId('privacy-policy')).toBeInTheDocument();
      });
    });

    it('should handle prevStep when step is 0', async () => {
      await renderWithRouter(<AddPatientComponent />);

      // Try to go back from step 0
      const declineButton = screen.getByTestId('privacy-decline');
      fireEvent.click(declineButton);

      // Should stay at Privacy Policy (step 0)
      expect(screen.getByTestId('privacy-policy')).toBeInTheDocument();
    });

    it('should navigate through all steps in order', async () => {
      await renderWithRouter(<AddPatientComponent />);

      // Privacy Policy -> Terms
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());

      // Terms -> Personal Info
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => expect(screen.getByTestId('personal-info')).toBeInTheDocument());

      // Personal Info -> Address Info
      fireEvent.click(screen.getByTestId('personal-next'));
      await waitFor(() => expect(screen.getByTestId('address-info')).toBeInTheDocument());

      // Address Info -> Other Info
      fireEvent.click(screen.getByTestId('address-next'));
      await waitFor(() => expect(screen.getByTestId('other-info')).toBeInTheDocument());
    });
  });

  describe('Step Indicator', () => {
    it('should show step indicator when on Personal Info step (step 2)', async () => {
      await renderWithRouter(<AddPatientComponent />);

      // Navigate to Personal Info
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => expect(screen.getByTestId('personal-info')).toBeInTheDocument());

      // Step indicator should be visible
      expect(screen.getByAltText('Personal')).toBeInTheDocument();
      expect(screen.getByAltText('Address')).toBeInTheDocument();
      expect(screen.getByAltText('Other')).toBeInTheDocument();
    });

    it('should show step indicator when on Address Info step (step 3)', async () => {
      await renderWithRouter(<AddPatientComponent />);

      // Navigate to Address Info
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => expect(screen.getByTestId('personal-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('personal-next'));
      await waitFor(() => expect(screen.getByTestId('address-info')).toBeInTheDocument());

      // Step indicator should be visible
      expect(screen.getByAltText('Personal')).toBeInTheDocument();
      expect(screen.getByAltText('Address')).toBeInTheDocument();
      expect(screen.getByAltText('Other')).toBeInTheDocument();
    });

    it('should show step indicator when on Other Info step (step 4)', async () => {
      await renderWithRouter(<AddPatientComponent />);

      // Navigate to Other Info
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => expect(screen.getByTestId('personal-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('personal-next'));
      await waitFor(() => expect(screen.getByTestId('address-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('address-next'));
      await waitFor(() => expect(screen.getByTestId('other-info')).toBeInTheDocument());

      // Step indicator should be visible
      expect(screen.getByAltText('Personal')).toBeInTheDocument();
      expect(screen.getByAltText('Address')).toBeInTheDocument();
      expect(screen.getByAltText('Other')).toBeInTheDocument();
    });

    it('should not show step indicator on Privacy Policy step (step 0)', async () => {
      await renderWithRouter(<AddPatientComponent />);

      const personalIndicator = screen.queryByAltText('Personal');
      expect(personalIndicator).not.toBeInTheDocument();
    });

    it('should not show step indicator on Terms step (step 1)', async () => {
      await renderWithRouter(<AddPatientComponent />);

      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());

      const personalIndicator = screen.queryByAltText('Personal');
      expect(personalIndicator).not.toBeInTheDocument();
    });

    it('should not show step indicator on Preview step (step 5)', async () => {
      mockHandleAddPatient.mockResolvedValue(true);
      await renderWithRouter(<AddPatientComponent />);

      // Navigate through all steps
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => expect(screen.getByTestId('personal-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('personal-next'));
      await waitFor(() => expect(screen.getByTestId('address-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('address-next'));
      await waitFor(() => expect(screen.getByTestId('other-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('other-next'));

      await waitFor(() => {
        expect(screen.getByTestId('preview')).toBeInTheDocument();
      });

      const personalIndicator = screen.queryByAltText('Personal');
      expect(personalIndicator).not.toBeInTheDocument();
    });

    it('should show correct icon for current step', async () => {
      await renderWithRouter(<AddPatientComponent />);

      // Navigate to Personal Info step
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => expect(screen.getByTestId('personal-info')).toBeInTheDocument());

      const personalIcon = screen.getByAltText('Personal');
      expect(personalIcon).toHaveAttribute('src', 'icon-user-green-rounded-bordered.svg');
    });

    it('should show filled icon for completed steps', async () => {
      await renderWithRouter(<AddPatientComponent />);

      // Navigate to Address Info step (Personal should be filled)
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => expect(screen.getByTestId('personal-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('personal-next'));
      await waitFor(() => expect(screen.getByTestId('address-info')).toBeInTheDocument());

      const personalIcon = screen.getByAltText('Personal');
      expect(personalIcon).toHaveAttribute('src', 'icon-user-green-rounded-filled.svg');
    });

    it('should show unfilled icon for future steps', async () => {
      await renderWithRouter(<AddPatientComponent />);

      // Navigate to Personal Info step
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => expect(screen.getByTestId('personal-info')).toBeInTheDocument());

      const addressIcon = screen.getByAltText('Address');
      expect(addressIcon).toHaveAttribute('src', 'icon-location-green-rounded.svg');
    });
  });

  describe('Form Data Management', () => {
    it('should update formData when moving to next step', async () => {
      await renderWithRouter(<AddPatientComponent />);

      // Navigate to Personal Info and fill data
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => expect(screen.getByTestId('personal-info')).toBeInTheDocument());

      // Move to Address Info
      fireEvent.click(screen.getByTestId('personal-next'));
      await waitFor(() => {
        expect(screen.getByTestId('address-info')).toBeInTheDocument();
      });

      // Address info should receive empty default values initially
      const addressDefaults = screen.getByTestId('address-default-values');
      expect(addressDefaults).toBeInTheDocument();
    });

    it('should preserve form data when navigating backwards', async () => {
      await renderWithRouter(<AddPatientComponent />);

      // Navigate to Address Info
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => expect(screen.getByTestId('personal-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('personal-next'));
      await waitFor(() => expect(screen.getByTestId('address-info')).toBeInTheDocument());

      // Go back to Personal Info
      fireEvent.click(screen.getByTestId('address-prev'));
      await waitFor(() => {
        expect(screen.getByTestId('personal-info')).toBeInTheDocument();
      });

      // Default values should contain previously entered data
      const personalDefaults = screen.getByTestId('personal-default-values');
      const defaultValues = JSON.parse(personalDefaults.textContent || '{}');
      expect(defaultValues.firstName).toBe('John');
    });

    it('should handle profilePhoto as string in defaultValues', async () => {
      await renderWithRouter(<AddPatientComponent />);

      // Navigate to Personal Info and submit
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => expect(screen.getByTestId('personal-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('personal-next'));
      await waitFor(() => expect(screen.getByTestId('address-info')).toBeInTheDocument());

      // Go back to Personal Info
      fireEvent.click(screen.getByTestId('address-prev'));
      await waitFor(() => {
        expect(screen.getByTestId('personal-info')).toBeInTheDocument();
      });

      // profilePhoto should be converted to string
      const personalDefaults = screen.getByTestId('personal-default-values');
      const defaultValues = JSON.parse(personalDefaults.textContent || '{}');
      expect(defaultValues.profilePhoto).toBe('base64string');
    });

    it('should handle profilePhoto as non-string (null) in defaultValues', async () => {
      await renderWithRouter(<AddPatientComponent />);

      // Navigate to Personal Info (no data submitted yet)
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => {
        expect(screen.getByTestId('personal-info')).toBeInTheDocument();
      });

      // profilePhoto should be null initially
      const personalDefaults = screen.getByTestId('personal-default-values');
      const defaultValues = JSON.parse(personalDefaults.textContent || '{}');
      expect(defaultValues.profilePhoto).toBeNull();
    });
  });

  describe('Form Submission', () => {
    it('should call handleAddPatient when submitting from Other Info step', async () => {
      mockHandleAddPatient.mockResolvedValue(true);
      await renderWithRouter(<AddPatientComponent />);

      // Navigate to Other Info
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => expect(screen.getByTestId('personal-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('personal-next'));
      await waitFor(() => expect(screen.getByTestId('address-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('address-next'));
      await waitFor(() => expect(screen.getByTestId('other-info')).toBeInTheDocument());

      // Submit from Other Info
      fireEvent.click(screen.getByTestId('other-next'));

      await waitFor(() => {
        expect(mockHandleAddPatient).toHaveBeenCalled();
      });
    });

    it('should navigate to Preview on successful submission', async () => {
      mockHandleAddPatient.mockResolvedValue(true);
      await renderWithRouter(<AddPatientComponent />);

      // Navigate to Other Info and submit
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => expect(screen.getByTestId('personal-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('personal-next'));
      await waitFor(() => expect(screen.getByTestId('address-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('address-next'));
      await waitFor(() => expect(screen.getByTestId('other-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('other-next'));

      await waitFor(() => {
        expect(screen.getByTestId('preview')).toBeInTheDocument();
      });
    });

    it('should not navigate to Preview on failed submission', async () => {
      mockHandleAddPatient.mockResolvedValue(false);
      await renderWithRouter(<AddPatientComponent />);

      // Navigate to Other Info and submit
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => expect(screen.getByTestId('personal-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('personal-next'));
      await waitFor(() => expect(screen.getByTestId('address-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('address-next'));
      await waitFor(() => expect(screen.getByTestId('other-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('other-next'));

      await waitFor(() => {
        expect(mockHandleAddPatient).toHaveBeenCalled();
      });

      // Should stay on Other Info step
      expect(screen.getByTestId('other-info')).toBeInTheDocument();
      expect(screen.queryByTestId('preview')).not.toBeInTheDocument();
    });

    it('should merge form data correctly before submission', async () => {
      mockHandleAddPatient.mockResolvedValue(true);
      await renderWithRouter(<AddPatientComponent />);

      // Navigate through all steps
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => expect(screen.getByTestId('personal-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('personal-next'));
      await waitFor(() => expect(screen.getByTestId('address-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('address-next'));
      await waitFor(() => expect(screen.getByTestId('other-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('other-next'));

      await waitFor(() => {
        expect(mockHandleAddPatient).toHaveBeenCalledWith(
          expect.objectContaining({
            personalInfo: expect.objectContaining({
              firstName: 'John',
            }),
            addressInfo: expect.objectContaining({
              city: 'Mumbai',
            }),
            otherInfo: expect.objectContaining({
              occupation: 'Engineer',
            }),
          })
        );
      });
    });
  });

  describe('Preview Step', () => {
    it('should render Preview with all form data', async () => {
      mockHandleAddPatient.mockResolvedValue(true);
      await renderWithRouter(<AddPatientComponent />);

      // Navigate through all steps to Preview
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => expect(screen.getByTestId('personal-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('personal-next'));
      await waitFor(() => expect(screen.getByTestId('address-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('address-next'));
      await waitFor(() => expect(screen.getByTestId('other-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('other-next'));

      await waitFor(() => {
        expect(screen.getByTestId('preview')).toBeInTheDocument();
      });

      const previewData = screen.getByTestId('preview-data');
      const data = JSON.parse(previewData.textContent || '{}');
      expect(data.personalInfo.firstName).toBe('John');
      expect(data.addressInfo.city).toBe('Mumbai');
      expect(data.otherInfo.occupation).toBe('Engineer');
    });
  });

  describe('Edge Cases', () => {
    it('should handle nextStep being called multiple times', async () => {
      await renderWithRouter(<AddPatientComponent />);

      const nextButton = screen.getByTestId('privacy-accept');
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId('terms')).toBeInTheDocument();
      });
    });

    it('should handle empty form data structure', async () => {
      await renderWithRouter(<AddPatientComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('privacy-policy')).toBeInTheDocument();
      });
    });

    it('should render dividers between step indicators', async () => {
      const { container } = await renderWithRouter(<AddPatientComponent />);

      // Navigate to Personal Info to see step indicators
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => {
        expect(screen.getByTestId('personal-info')).toBeInTheDocument();
      });

      const hrs = container.querySelectorAll('hr.border-dashed');
      expect(hrs.length).toBeGreaterThan(0);
    });

    it('should apply correct CSS classes to step labels', async () => {
      await renderWithRouter(<AddPatientComponent />);

      // Navigate to Personal Info
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => {
        expect(screen.getByTestId('personal-info')).toBeInTheDocument();
      });

      const personalLabel = screen.getByText('Personal');
      expect(personalLabel).toHaveClass('text-sm', 'mt-2');
    });
  });

  describe('useEffect Hook', () => {
    it('should set step to 0 on component mount', async () => {
      await renderWithRouter(<AddPatientComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('privacy-policy')).toBeInTheDocument();
      });
    });

    it('should scroll to top when step changes', async () => {
      // Create a mock element with scrollTo method
      const mockScrollTo = vi.fn();
      const mockElement = {
        scrollTo: mockScrollTo,
      };

      // Mock getElementById to return our mock element
      const originalGetElementById = document.getElementById;
      document.getElementById = vi.fn(() => mockElement as any);

      await renderWithRouter(<AddPatientComponent />);

      // Navigate to next step to trigger useEffect
      fireEvent.click(screen.getByTestId('privacy-accept'));

      await waitFor(() => {
        expect(screen.getByTestId('terms')).toBeInTheDocument();
      });

      // Verify scrollTo was called
      expect(mockScrollTo).toHaveBeenCalledWith(0, 0);

      // Restore original getElementById
      document.getElementById = originalGetElementById;
    });
  });

  describe('Conditional Rendering', () => {
    it('should only render current step component', async () => {
      await renderWithRouter(<AddPatientComponent />);

      // Privacy Policy step
      expect(screen.getByTestId('privacy-policy')).toBeInTheDocument();
      expect(screen.queryByTestId('terms')).not.toBeInTheDocument();
      expect(screen.queryByTestId('personal-info')).not.toBeInTheDocument();

      // Navigate to Terms
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => {
        expect(screen.queryByTestId('privacy-policy')).not.toBeInTheDocument();
        expect(screen.getByTestId('terms')).toBeInTheDocument();
        expect(screen.queryByTestId('personal-info')).not.toBeInTheDocument();
      });
    });

    it('should handle step > 3 condition in nextStep', async () => {
      mockHandleAddPatient.mockResolvedValue(true);
      await renderWithRouter(<AddPatientComponent />);

      // Navigate to Other Info (step 4)
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => expect(screen.getByTestId('personal-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('personal-next'));
      await waitFor(() => expect(screen.getByTestId('address-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('address-next'));
      await waitFor(() => expect(screen.getByTestId('other-info')).toBeInTheDocument());

      // Clicking next from step 4 should trigger handleSubmit
      fireEvent.click(screen.getByTestId('other-next'));

      await waitFor(() => {
        expect(mockHandleAddPatient).toHaveBeenCalled();
      });
    });
  });

  describe('Temp-Storage Integration', () => {
    it('should fetch patient temp-storage record on mount', async () => {
      mockGetResource.mockRejectedValue(new Error('Not found'));
      await renderWithRouter(<AddPatientComponent />);

      expect(mockGetResource).toHaveBeenCalledWith('patient', 'test-patient-id');
    });

    it('should restore form data and step from temp-storage', async () => {
      mockGetResource.mockResolvedValue({
        data: {
          id: 1,
          data: {
            formData: {
              personalInfo: {
                firstName: 'Restored',
                middleName: '',
                lastName: 'User',
                gender: 'F',
                dateOfBirth: '2000-01-01',
                age: '26',
                phoneNumber: '9999999999',
                phoneNumberCountryCode: '+91',
                contactType: 'self',
                emergencyContactName: 'EC',
                emergencyContactNumber: '8888888888',
                emergencyContactNumberCountryCode: '+91',
                profilePhoto: null,
              },
              addressInfo: {
                postalCode: '400001',
                city: 'Mumbai',
                state: 'MH',
                country: 'India',
                district: 'Mumbai',
                correspondingAddress1: 'Addr 1',
                correspondingAddress2: 'Addr 2',
              },
              otherInfo: {
                sonDaughterWifeOf: '',
                occupation: '',
                caste: '',
                education: 'Graduate',
                economicStatus: '',
              },
            },
            step: 3,
            patientUuid: null,
          },
        },
      });

      await renderWithRouter(<AddPatientComponent />);

      // Should restore to step 3 (Address Info)
      await waitFor(() => {
        expect(screen.getByTestId('address-info')).toBeInTheDocument();
      });
    });

    it('should restore to Preview step with patientUuid', async () => {
      mockGetResource.mockResolvedValue({
        data: {
          id: 1,
          data: {
            formData: {
              personalInfo: {
                firstName: 'John',
                middleName: '',
                lastName: 'Doe',
                gender: 'M',
                dateOfBirth: '1990-01-01',
                age: '36',
                phoneNumber: '1234567890',
                phoneNumberCountryCode: '+91',
                contactType: 'self',
                emergencyContactName: 'Jane',
                emergencyContactNumber: '0987654321',
                emergencyContactNumberCountryCode: '+91',
                profilePhoto: null,
              },
              addressInfo: {
                postalCode: '400001',
                city: 'Mumbai',
                state: 'MH',
                country: 'India',
                district: 'Mumbai',
                correspondingAddress1: 'Addr 1',
                correspondingAddress2: 'Addr 2',
              },
              otherInfo: {
                sonDaughterWifeOf: '',
                occupation: 'Doctor',
                caste: '',
                education: 'Graduate',
                economicStatus: '',
              },
            },
            step: 5,
            patientUuid: 'real-patient-uuid-123',
          },
        },
      });

      await renderWithRouter(<AddPatientComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('preview')).toBeInTheDocument();
      });
    });

    it('should save form data to temp-storage on nextStep', async () => {
      await renderWithRouter(<AddPatientComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('privacy-policy')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('privacy-accept'));

      await waitFor(() => {
        expect(screen.getByTestId('terms')).toBeInTheDocument();
      });

      expect(mockUpsertResource).toHaveBeenCalledWith(
        expect.objectContaining({
          resource_type: 'patient',
          resource_id: 'test-patient-id',
          data: expect.objectContaining({
            step: 1,
          }),
        })
      );
    });

    it('should save form data to temp-storage on prevStep', async () => {
      await renderWithRouter(<AddPatientComponent />);

      // Navigate to Terms
      await waitFor(() => {
        expect(screen.getByTestId('privacy-policy')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());

      mockUpsertResource.mockClear();

      // Go back
      fireEvent.click(screen.getByTestId('terms-decline'));

      await waitFor(() => {
        expect(screen.getByTestId('privacy-policy')).toBeInTheDocument();
      });

      expect(mockUpsertResource).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            step: 0,
          }),
        })
      );
    });

    it('should save patientUuid to temp-storage after successful submission', async () => {
      mockHandleAddPatient.mockResolvedValue('new-patient-uuid');
      await renderWithRouter(<AddPatientComponent />);

      // Navigate to Other Info and submit
      await waitFor(() => expect(screen.getByTestId('privacy-policy')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('privacy-accept'));
      await waitFor(() => expect(screen.getByTestId('terms')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('terms-accept'));
      await waitFor(() => expect(screen.getByTestId('personal-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('personal-next'));
      await waitFor(() => expect(screen.getByTestId('address-info')).toBeInTheDocument());
      fireEvent.click(screen.getByTestId('address-next'));
      await waitFor(() => expect(screen.getByTestId('other-info')).toBeInTheDocument());

      mockUpsertResource.mockClear();
      fireEvent.click(screen.getByTestId('other-next'));

      await waitFor(() => {
        expect(screen.getByTestId('preview')).toBeInTheDocument();
      });

      expect(mockUpsertResource).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            patientUuid: 'new-patient-uuid',
            step: 5,
          }),
        })
      );
    });

    it('should handle temp-storage fetch failure gracefully', async () => {
      mockGetResource.mockRejectedValue(new Error('Network error'));

      await renderWithRouter(<AddPatientComponent />);

      // Should still render at step 0
      await waitFor(() => {
        expect(screen.getByTestId('privacy-policy')).toBeInTheDocument();
      });
    });

    it('should generate new patient ID via crypto.randomUUID when none exists', async () => {
      mockStorageGet.mockReturnValue(null);
      const randomUUIDSpy = vi
        .spyOn(crypto, 'randomUUID')
        .mockReturnValue('new-patient-uuid-1234-5678-abcd-efgh' as `${string}-${string}-${string}-${string}-${string}`);

      await renderWithRouter(<AddPatientComponent />);

      expect(randomUUIDSpy).toHaveBeenCalled();
      expect(mockStorageSet).toHaveBeenCalledWith(
        'temp_patient_id',
        'new-patient-uuid-1234-5678-abcd-efgh'
      );

      randomUUIDSpy.mockRestore();
    });

    it('should use fallback createdBy when JSON.parse throws on invalid user data', async () => {
      mockStorageGetUser.mockReturnValue('not-valid-json{');

      await renderWithRouter(<AddPatientComponent />);

      // Advance one step so savePatientToTemp fires
      fireEvent.click(screen.getByTestId('privacy-accept'));

      await waitFor(() => {
        expect(mockUpsertResource).toHaveBeenCalled();
      });

      // fallback is null from `let createdBy = null`
      expect(mockUpsertResource).toHaveBeenCalledWith(
        expect.objectContaining({ created_by: null })
      );
    });

    it('should fall back to raw user string when parsed JSON has no uuid', async () => {
      const rawUser = '{"name":"no-uuid-user"}';
      mockStorageGetUser.mockReturnValue(rawUser);

      await renderWithRouter(<AddPatientComponent />);

      fireEvent.click(screen.getByTestId('privacy-accept'));

      await waitFor(() => {
        expect(mockUpsertResource).toHaveBeenCalledWith(
          expect.objectContaining({ created_by: rawUser })
        );
      });
    });

    it('should use null createdBy when storage.getUser returns null', async () => {
      mockStorageGetUser.mockReturnValue(null);

      await renderWithRouter(<AddPatientComponent />);

      fireEvent.click(screen.getByTestId('privacy-accept'));

      await waitFor(() => {
        expect(mockUpsertResource).toHaveBeenCalledWith(
          expect.objectContaining({ created_by: null })
        );
      });
    });

    it('should skip restore when getResource returns no data', async () => {
      mockGetResource.mockResolvedValue({ data: null });

      await renderWithRouter(<AddPatientComponent />);

      // Renders normally at step 0
      expect(screen.getByTestId('privacy-policy')).toBeInTheDocument();
    });

    it('should swallow errors silently when savePatientToTemp upsert fails', async () => {
      mockUpsertResource.mockRejectedValue(new Error('network down'));

      await renderWithRouter(<AddPatientComponent />);

      // Advance a step — should not throw despite upsert failing
      fireEvent.click(screen.getByTestId('privacy-accept'));

      await waitFor(() => {
        expect(screen.getByTestId('terms')).toBeInTheDocument();
      });
    });
  });
});
