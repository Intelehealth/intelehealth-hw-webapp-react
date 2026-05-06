import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';


const h = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUsePatientProfile: vi.fn(),
}));

let mockUuid: string | undefined = 'test-uuid';
vi.mock('react-router-dom', () => ({
  useNavigate: () => h.mockNavigate,
  useParams: () => ({ uuid: mockUuid }),
}));

vi.mock(
  '../../../../modules/patient/profile/patient-profile.hooks',
  async () => {
    const actual = await vi.importActual<
      typeof import('../../../../modules/patient/profile/patient-profile.hooks')
    >('../../../../modules/patient/profile/patient-profile.hooks');
    return { ...actual, usePatientProfile: h.mockUsePatientProfile };
  }
);

vi.mock(
  '../../../../modules/visit-summary/visit-summary-collapsed.component',
  () => ({
    default: ({
      children,
      title,
    }: {
      children: React.ReactNode;
      title: string;
    }) => (
      <div data-testid={`section-${title}`}>
        <span>{title}</span>
        {children}
      </div>
    ),
  })
);


vi.mock('../../../../assets/icons/close.svg', () => ({ default: 'close.svg' }));
vi.mock(
  '../../../../assets/icons/icon-location-green-rounded-bordered.svg',
  () => ({ default: 'addr.svg' })
);
vi.mock(
  '../../../../assets/icons/icon-right-arrow.svg',
  () => ({ default: 'right.svg' })
);
vi.mock(
  '../../../../assets/icons/icon-summary-list.svg',
  () => ({ default: 'list.svg' })
);
vi.mock('../../../../assets/icons/icon-sync.svg', () => ({
  default: 'sync.svg',
}));
vi.mock(
  '../../../../assets/icons/icon-three-dot-green-rounded-bordered.svg',
  () => ({ default: 'other.svg' })
);
vi.mock(
  '../../../../assets/icons/icon-user-green-rounded-bordered.svg',
  () => ({ default: 'personal.svg' })
);
vi.mock(
  '../../../../assets/images/default-user-img.svg',
  () => ({ default: 'user.svg' })
);

vi.mock('../../../../components/common', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));


vi.mock('../../../../assets/data/openmrs_uuids', () => ({
  patientAttributes: {
    telephoneNumber: 'tel-uuid',
    emergencyContactType: 'ect-uuid',
    emergencyContactName: 'ecn-uuid',
    emergencyContactNumber: 'ecnum-uuid',
    occupation: 'occ-uuid',
    caste: 'caste-uuid',
    education: 'edu-uuid',
    economicStatus: 'eco-uuid',
  },
}));

import PatientProfileComponent from '../../../../modules/patient/profile/patient-profile.component';



const basePatientData = {
  fullName: 'John K Doe',
  patientId: 'PAT001',
  gender: 'Male',
  dob: '1/15/1994',
  age: '30 years',
  phone: '+911234567890',
  contactType: 'Spouse',
  emergencyName: 'Jane',
  emergencyNumber: '+9198',
  occupation: 'Engineer',
  caste: 'General',
  education: 'Graduate',
  economicStatus: 'Middle',
  address: {
    address1: '123 Main St',
    address2: 'Apt 4',
    cityVillage: 'Mumbai',
    stateProvince: 'Maharashtra',
    country: 'India',
    postalCode: '400001',
    countyDistrict: 'Mumbai Urban',
  },
};

const defaultHookReturn = {
  patientData: basePatientData,
  visits: [],
  loading: false,
  refreshing: false,
  error: null,
  refresh: vi.fn(),
};



describe('PatientProfileComponent', () => {


  it('renders spinner when loading is true', () => {
    h.mockUsePatientProfile.mockReturnValue({
      ...defaultHookReturn,
      patientData: null,
      loading: true,
    });
    const { container } = render(<PatientProfileComponent />);
    expect(container.querySelector('.spinner')).toBeTruthy();
  });



  it('renders error message when error is set', () => {
    h.mockUsePatientProfile.mockReturnValue({
      ...defaultHookReturn,
      patientData: null,
      loading: false,
      error: 'Network failure',
    });
    render(<PatientProfileComponent />);
    expect(screen.getByText('Network failure')).toBeInTheDocument();
  });

  it('renders "Patient not found." when patientData is null and no error', () => {
    h.mockUsePatientProfile.mockReturnValue({
      ...defaultHookReturn,
      patientData: null,
      loading: false,
      error: null,
    });
    render(<PatientProfileComponent />);
    expect(screen.getByText('Patient not found.')).toBeInTheDocument();
  });


  it('renders patient name and id in the header card', () => {
    h.mockUsePatientProfile.mockReturnValue({ ...defaultHookReturn });
    render(<PatientProfileComponent />);
    expect(screen.getAllByText('John K Doe').length).toBeGreaterThan(0);
    expect(screen.getByText('PAT001')).toBeInTheDocument();
  });

  it('renders all personal detail rows', () => {
    h.mockUsePatientProfile.mockReturnValue({ ...defaultHookReturn });
    render(<PatientProfileComponent />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Gender')).toBeInTheDocument();
    expect(screen.getByText('Male')).toBeInTheDocument();
    expect(screen.getByText('30 years')).toBeInTheDocument();
    expect(screen.getByText('Engineer')).toBeInTheDocument();
  });

  it('renders address rows with provided values', () => {
    h.mockUsePatientProfile.mockReturnValue({ ...defaultHookReturn });
    render(<PatientProfileComponent />);
    expect(screen.getByText('India')).toBeInTheDocument();
    expect(screen.getByText('Maharashtra')).toBeInTheDocument();
    expect(screen.getByText('Mumbai')).toBeInTheDocument();
  });



  it('renders address fallbacks when address is null', () => {
    h.mockUsePatientProfile.mockReturnValue({
      ...defaultHookReturn,
      patientData: { ...basePatientData, address: null },
    });
    render(<PatientProfileComponent />);
    expect(screen.getByText('No postal code added')).toBeInTheDocument();
    expect(screen.getByText('No country added')).toBeInTheDocument();
    expect(screen.getByText('No state added')).toBeInTheDocument();
    expect(screen.getAllByText('NA').length).toBeGreaterThan(0);
    expect(screen.getByText('No city added')).toBeInTheDocument();
  });

 

  it('renders "No open visits" when visits array is empty', () => {
    h.mockUsePatientProfile.mockReturnValue({
      ...defaultHookReturn,
      visits: [],
    });
    render(<PatientProfileComponent />);
    expect(screen.getByText('No open visits')).toBeInTheDocument();
  });

 

  it('renders visit card with title, id, and date', () => {
    h.mockUsePatientProfile.mockReturnValue({
      ...defaultHookReturn,
      visits: [
        {
          uuid: 'vis-uuid-abcd1234',
          startDatetime: '2025-09-12T20:14:36.000+0000',
          visitType: { display: 'OPD Visit' },
          encounters: [],
        },
      ],
    });
    render(<PatientProfileComponent />);
    expect(screen.getByText('OPD Visit')).toBeInTheDocument();
    expect(screen.getByText(/Visit ID:/)).toBeInTheDocument();
    expect(screen.getByText(/XXXX1234/)).toBeInTheDocument();
    expect(screen.getByText(/2025-09-12/)).toBeInTheDocument();
  });

  it('does not render title paragraph when visitType is null and no encounters', () => {
    h.mockUsePatientProfile.mockReturnValue({
      ...defaultHookReturn,
      visits: [
        {
          uuid: 'vis-uuid-0000abcd',
          startDatetime: '2025-09-12T20:14:36.000+0000',
          visitType: null,
          encounters: [],
        },
      ],
    });
    render(<PatientProfileComponent />);
   
    expect(screen.queryByText('OPD Visit')).not.toBeInTheDocument();
   
    expect(screen.getByText(/Visit ID:/)).toBeInTheDocument();
  });

  it('renders empty visit date when startDatetime is empty string', () => {
    h.mockUsePatientProfile.mockReturnValue({
      ...defaultHookReturn,
      visits: [
        {
          uuid: 'vis-uuid-0000abcd',
          startDatetime: '',
          visitType: { display: 'OPD' },
          encounters: [],
        },
      ],
    });
    render(<PatientProfileComponent />);

    expect(screen.getByText(/Visit Date:/)).toBeInTheDocument();
  });



  it('adds animate-spin class to sync icon and disables button when refreshing', () => {
    h.mockUsePatientProfile.mockReturnValue({
      ...defaultHookReturn,
      refreshing: true,
    });
    render(<PatientProfileComponent />);
    const img = screen.getByAltText('Refresh');
    expect(img).toHaveClass('animate-spin');
    expect(img.closest('button')).toBeDisabled();
  });

  it('does not add animate-spin when not refreshing', () => {
    h.mockUsePatientProfile.mockReturnValue({
      ...defaultHookReturn,
      refreshing: false,
    });
    render(<PatientProfileComponent />);
    const img = screen.getByAltText('Refresh');
    expect(img).not.toHaveClass('animate-spin');
  });



  it('calls refresh() when refresh button is clicked', async () => {
    const mockRefresh = vi.fn();
    h.mockUsePatientProfile.mockReturnValue({
      ...defaultHookReturn,
      refresh: mockRefresh,
    });
    render(<PatientProfileComponent />);
    await userEvent.click(screen.getByAltText('Refresh').closest('button')!);
    expect(mockRefresh).toHaveBeenCalledOnce();
  });

  it('calls navigate(-1) when close button is clicked', async () => {
    h.mockUsePatientProfile.mockReturnValue({ ...defaultHookReturn });
    render(<PatientProfileComponent />);
    await userEvent.click(screen.getByAltText('Close').closest('button')!);
    expect(h.mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('navigates to /visit-summary when a visit card is clicked', async () => {
    h.mockUsePatientProfile.mockReturnValue({
      ...defaultHookReturn,
      visits: [
        {
          uuid: 'vis-uuid-abcd5678',
          startDatetime: '2025-06-01T10:00:00.000+0000',
          visitType: { display: 'Consultation' },
          encounters: [],
        },
      ],
    });
    render(<PatientProfileComponent />);
    await userEvent.click(screen.getByRole('button', { name: /Visit ID/i }));
    expect(h.mockNavigate).toHaveBeenCalledWith('/visit-summary/vis-uuid-abcd5678', {
      state: { visitUuid: 'vis-uuid-abcd5678' },
    });
  });

 

  it('renders "Not provided" fallback for empty string fields', () => {
    h.mockUsePatientProfile.mockReturnValue({
      ...defaultHookReturn,
      patientData: {
        ...basePatientData,
        phone: '',
        contactType: '',
        emergencyName: '',
        emergencyNumber: '',
      },
    });
    render(<PatientProfileComponent />);
    const notProvided = screen.getAllByText('Not provided');
    expect(notProvided.length).toBeGreaterThanOrEqual(4);
  });

  it('renders patient profile image using personimage URL', () => {
    h.mockUsePatientProfile.mockReturnValue({ ...defaultHookReturn });
    render(<PatientProfileComponent />);
    const img = screen.getByAltText('John K Doe') as HTMLImageElement;
    expect(img.src).toContain('/personimage/test-uuid');
  });

  it('falls back to default image on profile image load error', async () => {
    h.mockUsePatientProfile.mockReturnValue({ ...defaultHookReturn });
    render(<PatientProfileComponent />);
    const img = screen.getByAltText('John K Doe') as HTMLImageElement;

    // Trigger error using fireEvent
    fireEvent.error(img);

    // After error, should use default image
    expect(img.src).toContain('user.svg');
  });

  it('renders "Start Visit" button when there are no open visits', () => {
    h.mockUsePatientProfile.mockReturnValue({
      ...defaultHookReturn,
      visits: [],
    });
    render(<PatientProfileComponent />);
    expect(screen.getByText('Start Visit')).toBeInTheDocument();
  });

  it('navigates to /ayu with patient state when "Start Visit" is clicked', async () => {
    h.mockUsePatientProfile.mockReturnValue({
      ...defaultHookReturn,
      visits: [],
    });
    render(<PatientProfileComponent />);
    await userEvent.click(screen.getByText('Start Visit'));
    expect(h.mockNavigate).toHaveBeenCalledWith('/ayu', {
      state: {
        patientName: 'John K Doe',
        patientAge: '30 years',
        patientGender: 'Male',
        patientUuid: 'test-uuid',
      },
    });
  });

  it('does not render "Start Visit" button when visits exist', () => {
    h.mockUsePatientProfile.mockReturnValue({
      ...defaultHookReturn,
      visits: [
        {
          uuid: 'vis-uuid-abcd1234',
          startDatetime: '2025-09-12T20:14:36.000+0000',
          visitType: { display: 'OPD Visit' },
          encounters: [],
        },
      ],
    });
    render(<PatientProfileComponent />);
    expect(screen.queryByText('Start Visit')).not.toBeInTheDocument();
  });

  it('uses default image when uuid is undefined', () => {
    mockUuid = undefined;
    h.mockUsePatientProfile.mockReturnValue({ ...defaultHookReturn });
    render(<PatientProfileComponent />);
    const img = screen.getByAltText('John K Doe') as HTMLImageElement;
    expect(img.src).toContain('user.svg');
    mockUuid = 'test-uuid';
  });

  it('uses dob as fallback for patientAge in Start Visit navigation when age is empty', async () => {
    h.mockUsePatientProfile.mockReturnValue({
      ...defaultHookReturn,
      patientData: { ...basePatientData, age: '', dob: '1/15/1994' },
      visits: [],
    });
    render(<PatientProfileComponent />);
    await userEvent.click(screen.getByText('Start Visit'));
    expect(h.mockNavigate).toHaveBeenCalledWith('/ayu', {
      state: expect.objectContaining({
        patientAge: '1/15/1994',
      }),
    });
  });
});
