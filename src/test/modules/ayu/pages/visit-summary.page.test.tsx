import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

/* ── Mock navigation ─────────────────────────────────────────────────────── */

const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

/* ── Mock context: useStartVisitData ─────────────────────────────────────── */

const defaultData = {
  vitals: null as any,
  visitReason: null as any,
  physicalExam: null as any,
  medicalHistory: null as any,
};

const mockUseStartVisitData = vi.fn(() => ({
  data: { ...defaultData },
  patientUuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  lastSectionIndex: 0,
  setLastSectionIndex: vi.fn(),
  setPatientUuid: vi.fn(),
  setVitalsData: vi.fn(),
  setVisitReasonData: vi.fn(),
  setPhysicalExamData: vi.fn(),
  setMedicalHistoryData: vi.fn(),
}));

vi.mock('../../../../modules/ayu/context/start-visit.context', () => ({
  useStartVisitData: () => mockUseStartVisitData(),
}));

/* ── Mock ProfileContext ─────────────────────────────────────────────────── */

const mockHwProfile = {
  providerUuid: 'provider-uuid-1234',
  display: 'Test Provider',
};

vi.mock('../../../../context/ProfileContext', () => ({
  useProfileContext: () => ({
    hwProfile: mockHwProfile,
    profile: null,
    isLoading: false,
  }),
}));

/* ── Mock storage ────────────────────────────────────────────────────────── */

const mockStorageGet = vi.fn((_key: string): string | null => null);
const mockStorageGetLocationUuid = vi.fn(() => 'location-uuid-5678');

vi.mock('../../../../utils/storage', () => ({
  storage: {
    get: (key: string) => mockStorageGet(key),
    set: vi.fn(),
    getLocationUuid: () => mockStorageGetLocationUuid(),
  },
}));

/* ── Mock toast ──────────────────────────────────────────────────────────── */

const mockShowToast = vi.fn();
vi.mock('../../../../services/toast', () => ({
  showToast: (...args: any[]) => mockShowToast(...args),
}));

/* ── Mock ConfirmationModal ──────────────────────────────────────────────── */

vi.mock('../../../../components/modal/confirmation.modal', () => ({
  ConfirmationModal: vi.fn(
    ({ open, title, onConfirm, onClose }: any) =>
      open ? (
        <div data-testid="confirmation-modal">
          <span>{title}</span>
          <button data-testid="modal-confirm" onClick={onConfirm}>
            Confirm
          </button>
          <button data-testid="modal-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      ) : null
  ),
}));

/* ── Mock CollapsedComponent (render children directly) ──────────────────── */

vi.mock('../../../../modules/visit-summary/visit-summary-collapsed.component', () => ({
  default: vi.fn(({ title, children }: any) => (
    <div data-testid={`collapsed-${title}`}>
      <span>{title}</span>
      {children}
    </div>
  )),
}));

/* ── Mock visit-upload service functions ──────────────────────────────────── */

const mockBuildVisitReasonHtml = vi.fn((_a?: any, _b?: any) => '<p>visit reason</p>');
const mockBuildPhysicalExamData = vi.fn((_a?: any, _b?: any) => 'physical-exam-data');
const mockBuildMedicalHistoryData = vi.fn((_a?: any) => 'medical-history-data');
const mockBuildFamilyHistoryData = vi.fn((_a?: any) => 'family-history-data');
const mockBuildVisitUploadPayload = vi.fn((_a?: any) => ({ payload: true }));
const mockUploadVisit = vi.fn((_a?: any) => Promise.resolve());

vi.mock('../../../../modules/ayu/services/visit-upload.service', () => ({
  buildVisitReasonHtml: (...args: any[]) => mockBuildVisitReasonHtml(...args),
  buildPhysicalExamData: (...args: any[]) => mockBuildPhysicalExamData(...args),
  buildMedicalHistoryData: (...args: any[]) => mockBuildMedicalHistoryData(...args),
  buildFamilyHistoryData: (...args: any[]) => mockBuildFamilyHistoryData(...args),
  buildVisitUploadPayload: (...args: any[]) => mockBuildVisitUploadPayload(...args),
  uploadVisit: (...args: any[]) => mockUploadVisit(...args),
}));

/* ── Mock icon imports ───────────────────────────────────────────────────── */

vi.mock('../../../../assets/icons/icon-chevron-down.svg', () => ({
  default: 'icon-chevron-down.svg',
}));
vi.mock('../../../../assets/icons/icon-physical-examination.svg', () => ({
  default: 'icon-physical-examination.svg',
}));
vi.mock('../../../../assets/icons/icon-visit-summery.svg', () => ({
  default: 'icon-visit-summery.svg',
}));
vi.mock('../../../../assets/icons/visit-reason.svg', () => ({
  default: 'visit-reason.svg',
}));
vi.mock('../../../../assets/icons/vitals.svg', () => ({
  default: 'vitals.svg',
}));
vi.mock('../../../../assets/icons/icon-info.svg', () => ({
  default: 'icon-info.svg',
}));

/* ── Mock useConfig ────────────────────────────────────────────────────── */

const defaultMockConfig = {
  specialization: [
    { name: 'General Physician' },
    { name: 'Dermatology' },
    { name: 'Cardiology' },
  ],
};

const mockUseConfig = vi.fn(() => ({ config: defaultMockConfig }));

vi.mock('../../../../hooks/useConfig', () => ({
  useConfig: () => mockUseConfig(),
}));

/* ── Mock physical-exam data ─────────────────────────────────────────────── */

vi.mock('../../../../modules/ayu/data/physical-exam.data', () => ({
  PHYSICAL_EXAM_QUESTIONS: [
    {
      id: 'pe1',
      sectionLabel: 'General',
      categoryLabel: 'General Appearance',
      questionText: 'General appearance?',
      isRequired: false,
      isMultiChoice: true,
      options: [
        { id: 'opt1', text: 'Normal' },
        { id: 'opt2', text: 'Abnormal' },
      ],
    },
  ],
}));

/* ── Import the component under test (after all mocks) ───────────────────── */

const { default: VisitSummaryPage } = await import(
  '../../../../modules/ayu/pages/visit-summary.page'
);

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const fullData = {
  vitals: {
    formValues: {
      height_cm: 170,
      weight_kg: 70,
      bmi: 24.2,
      bp_systolic: 120,
      bp_diastolic: 80,
      pulse_bpm: 72,
      temprature_f: 98.6,
      spo2: 98,
      respiratory_rate: 16,
    },
    config: [],
  },
  visitReason: {
    answers: {},
    reasonNames: ['Cough', 'Fever'],
    details: [{ label: 'Duration', value: '3 days' }],
  },
  physicalExam: {
    answers: {
      pe1: ['opt1'],
    },
    details: [{ label: 'General Appearance', value: 'Normal' }],
  },
  medicalHistory: {
    patHistSummary: [
      {
        title: 'Past History',
        items: [{ type: 'labelValue' as const, label: 'Diabetes', value: 'Yes' }],
      },
    ],
    famHistSummary: [
      {
        title: 'Family History',
        items: [{ type: 'labelValue' as const, label: 'Hypertension', value: 'No' }],
      },
    ],
  },
};

function renderWithData(dataOverride?: Partial<typeof defaultData>) {
  const data = { ...defaultData, ...dataOverride };
  mockUseStartVisitData.mockReturnValue({
    data,
    patientUuid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    lastSectionIndex: 0,
    setLastSectionIndex: vi.fn(),
    setPatientUuid: vi.fn(),
    setVitalsData: vi.fn(),
    setVisitReasonData: vi.fn(),
    setPhysicalExamData: vi.fn(),
    setMedicalHistoryData: vi.fn(),
  });
  return render(<VisitSummaryPage />);
}

/* ── Tests ────────────────────────────────────────────────────────────────── */

beforeEach(() => {
  vi.clearAllMocks();
  mockStorageGet.mockReturnValue(null);
  mockStorageGetLocationUuid.mockReturnValue('location-uuid-5678');
  mockUploadVisit.mockResolvedValue(undefined);
  mockUseConfig.mockReturnValue({ config: defaultMockConfig });
});

describe('VisitSummaryPage', () => {
  /* ── Header ──────────────────────────────────────────────────────────── */

  it('should render the "Visit Summary" header', () => {
    renderWithData();
    expect(screen.getByText('Visit Summary')).toBeInTheDocument();
  });

  /* ── Empty-state messages ────────────────────────────────────────────── */

  it('should show "No vitals recorded" when data.vitals is null', () => {
    renderWithData({ vitals: null });
    expect(screen.getByText('No vitals recorded')).toBeInTheDocument();
  });

  it('should show "No visit reason recorded" when data.visitReason is null', () => {
    renderWithData({ visitReason: null });
    expect(screen.getByText('No visit reason recorded')).toBeInTheDocument();
  });

  it('should show "No physical exam recorded" when data.physicalExam is null', () => {
    renderWithData({ physicalExam: null });
    expect(screen.getByText('No physical exam recorded')).toBeInTheDocument();
  });

  it('should show "No medical history recorded" when data.medicalHistory is null', () => {
    renderWithData({ medicalHistory: null });
    expect(screen.getByText('No medical history recorded')).toBeInTheDocument();
  });

  /* ── Vitals data rendering ──────────────────────────────────────────── */

  it('should show vitals data when available', () => {
    renderWithData({ vitals: fullData.vitals });

    expect(screen.queryByText('No vitals recorded')).not.toBeInTheDocument();
    // Check a few representative vital labels/values
    expect(screen.getAllByText('Height(cm)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('170').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Weight(kg)').length).toBeGreaterThan(0);
    expect(screen.getAllByText('70').length).toBeGreaterThan(0);
  });

  /* ── Confirmation modal ─────────────────────────────────────────────── */

  it('should show confirmation modal when upload button is clicked', () => {
    renderWithData(fullData);

    expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();

    const uploadButton = screen.getByText('Upload Visit');
    fireEvent.click(uploadButton);

    expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
    expect(screen.getByText('Send Visit')).toBeInTheDocument();
  });

  /* ── handleUploadVisit: validation ──────────────────────────────────── */

  it('should show error toast when required data is missing', async () => {
    // All sections null
    renderWithData();

    // Click Upload Visit to open modal
    fireEvent.click(screen.getByText('Upload Visit'));
    // Confirm in modal
    fireEvent.click(screen.getByTestId('modal-confirm'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Error',
        'Please complete all sections before uploading',
        'error'
      );
    });
  });

  /* ── handleUploadVisit: success path ────────────────────────────────── */

  it('should call uploadVisit with correct payload when all data is present', async () => {
    renderWithData(fullData);

    // Open and confirm modal
    fireEvent.click(screen.getByText('Upload Visit'));
    fireEvent.click(screen.getByTestId('modal-confirm'));

    await waitFor(() => {
      expect(mockBuildVisitReasonHtml).toHaveBeenCalledWith(
        fullData.visitReason.details,
        fullData.visitReason.reasonNames
      );
      expect(mockBuildPhysicalExamData).toHaveBeenCalled();
      expect(mockBuildMedicalHistoryData).toHaveBeenCalled();
      expect(mockBuildFamilyHistoryData).toHaveBeenCalled();
      expect(mockBuildVisitUploadPayload).toHaveBeenCalled();
      expect(mockUploadVisit).toHaveBeenCalledWith({ payload: true });
    });

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Success',
        'Visit uploaded successfully',
        'success'
      );
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  /* ── "Back to Edit" button ──────────────────────────────────────────── */

  it('should navigate back when "Back to Edit" button is clicked', () => {
    renderWithData();

    const backButton = screen.getByText('Back to Edit');
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  /* ── MedicalHistorySection: subheading items ──────────────────────── */

  it('should render subheading items in medical history', () => {
    renderWithData({
      ...fullData,
      medicalHistory: {
        patHistSummary: [
          {
            title: 'Past History',
            items: [
              { type: 'subheading' as const, heading: 'Chronic Conditions', values: ['Asthma'] },
              { type: 'labelValue' as const, label: 'Diabetes', value: 'Yes' },
            ],
          },
        ],
        famHistSummary: [],
      },
    });

    expect(screen.getByText('Chronic Conditions')).toBeInTheDocument();
    expect(screen.getByText('Diabetes')).toBeInTheDocument();
  });

  it('should return null for unknown item types in medical history', () => {
    renderWithData({
      ...fullData,
      medicalHistory: {
        patHistSummary: [
          {
            title: 'Past History',
            items: [
              { type: 'unknownType' as any, label: 'X', value: 'Y' },
              { type: 'labelValue' as const, label: 'Known', value: 'Value' },
            ],
          },
        ],
        famHistSummary: [],
      },
    });

    // The known labelValue item should render, the unknown type should be skipped
    expect(screen.getByText('Known')).toBeInTheDocument();
  });

  it('should show "No information" for medical history item with null value', () => {
    renderWithData({
      ...fullData,
      medicalHistory: {
        patHistSummary: [
          {
            title: 'Past History',
            items: [
              { type: 'labelValue' as const, label: 'Diabetes', value: null },
            ],
          },
        ],
        famHistSummary: [],
      },
    });

    expect(screen.getByText('No information')).toBeInTheDocument();
  });

  /* ── Missing patient/location/provider shows error toast ──────────── */

  it('should show error toast when patient UUID is missing', async () => {
    mockUseStartVisitData.mockReturnValue({
      data: { ...fullData },
      patientUuid: null as any,
      lastSectionIndex: 0,
      setLastSectionIndex: vi.fn(),
      setPatientUuid: vi.fn(),
      setVitalsData: vi.fn(),
      setVisitReasonData: vi.fn(),
      setPhysicalExamData: vi.fn(),
      setMedicalHistoryData: vi.fn(),
    });
    mockStorageGet.mockReturnValue(null);

    render(<VisitSummaryPage />);

    fireEvent.click(screen.getByText('Upload Visit'));
    fireEvent.click(screen.getByTestId('modal-confirm'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Error',
        'Missing patient, location, or provider information',
        'error'
      );
    });
  });

  it('should show error toast when location UUID is missing', async () => {
    mockUseStartVisitData.mockReturnValue({
      data: { ...fullData },
      patientUuid: 'patient-uuid',
      lastSectionIndex: 0,
      setLastSectionIndex: vi.fn(),
      setPatientUuid: vi.fn(),
      setVitalsData: vi.fn(),
      setVisitReasonData: vi.fn(),
      setPhysicalExamData: vi.fn(),
      setMedicalHistoryData: vi.fn(),
    });
    mockStorageGetLocationUuid.mockReturnValue(null as any);

    render(<VisitSummaryPage />);

    fireEvent.click(screen.getByText('Upload Visit'));
    fireEvent.click(screen.getByTestId('modal-confirm'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Error',
        'Missing patient, location, or provider information',
        'error'
      );
    });
  });

  /* ── Upload failure shows error toast ─────────────────────────────── */

  it('should show error toast when upload fails', async () => {
    mockUploadVisit.mockRejectedValueOnce(new Error('Network error'));
    renderWithData(fullData);

    fireEvent.click(screen.getByText('Upload Visit'));
    fireEvent.click(screen.getByTestId('modal-confirm'));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Error',
        'Failed to upload visit. Please try again.',
        'error'
      );
    });
  });

  /* ── Storage fallback when ctxPatientUuid is null ──────────────────── */

  it('should use storage fallback when ctxPatientUuid is null', async () => {
    mockStorageGet.mockImplementation((key: string) =>
      key === 'patientUuid' ? 'storage-patient-uuid' : null
    );
    mockUseStartVisitData.mockReturnValue({
      data: { ...fullData },
      patientUuid: null as any,
      lastSectionIndex: 0,
      setLastSectionIndex: vi.fn(),
      setPatientUuid: vi.fn(),
      setVitalsData: vi.fn(),
      setVisitReasonData: vi.fn(),
      setPhysicalExamData: vi.fn(),
      setMedicalHistoryData: vi.fn(),
    });

    render(<VisitSummaryPage />);

    fireEvent.click(screen.getByText('Upload Visit'));
    fireEvent.click(screen.getByTestId('modal-confirm'));

    await waitFor(() => {
      expect(mockUploadVisit).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith(
        'Success',
        'Visit uploaded successfully',
        'success'
      );
    });
  });

  /* ── Toggle all button toggles allOpen state ──────────────────────── */

  it('should toggle between "Close all" and "Open all" when clicked', () => {
    renderWithData(fullData);

    // Initially allOpen is true, so button says "Close all"
    const toggleButton = screen.getByText('Close all');
    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);

    // After click, allOpen is false, so button says "Open all"
    expect(screen.getByText('Open all')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Open all'));

    // After second click, back to "Close all"
    expect(screen.getByText('Close all')).toBeInTheDocument();
  });

  /* ── Modal cancel/close closes modal ──────────────────────────────── */

  it('should close the confirmation modal when cancel is clicked', () => {
    renderWithData(fullData);

    fireEvent.click(screen.getByText('Upload Visit'));
    expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('modal-cancel'));

    expect(screen.queryByTestId('confirmation-modal')).not.toBeInTheDocument();
  });

  /* ── Full vitals rendering (mapVitals, VitalsSection branches) ─────── */

  it('should render all vitals including BMI and BP from formValues', () => {
    renderWithData({ vitals: fullData.vitals });

    expect(screen.getAllByText('BMI').length).toBeGreaterThan(0);
    expect(screen.getAllByText('24.2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('BP').length).toBeGreaterThan(0);
    expect(screen.getAllByText('120/80').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Pulse').length).toBeGreaterThan(0);
    expect(screen.getAllByText('72').length).toBeGreaterThan(0);
  });

  it('should render "No information" for null vital values', () => {
    renderWithData({
      vitals: {
        formValues: {
          height_cm: undefined as any,
          weight_kg: undefined as any,
          bmi: undefined as any,
          bp_systolic: undefined as any,
          bp_diastolic: undefined as any,
          pulse_bpm: undefined as any,
          temprature_f: undefined as any,
          spo2: undefined as any,
          respiratory_rate: undefined as any,
        },
        config: [],
      },
    });

    // mapVitals v() with undefined => value null, note 'No information'
    // getVitalDisplay(null, 'No information') => 'No information'
    const noInfoElements = screen.getAllByText('No information');
    expect(noInfoElements.length).toBeGreaterThanOrEqual(1);
  });

  /* ── LabelValueRow compact prop branch ────────────────────────────── */

  it('should render LabelValueRow with compact styling when vitals use compact=false by default', () => {
    renderWithData({ vitals: fullData.vitals });
    // LabelValueRow renders with py-1 when compact is false (default)
    expect(screen.getAllByText('Height(cm)').length).toBeGreaterThan(0);
  });

  /* ── Physical exam data rendering ─────────────────────────────────── */

  it('should render physical examination data with answers', () => {
    renderWithData({
      ...fullData,
      physicalExam: {
        answers: {
          pe1: ['opt1'],
        },
        details: [{ label: 'General Appearance', value: 'Normal' }],
      },
    });

    expect(screen.getByText('General Appearance')).toBeInTheDocument();
    expect(screen.getByText('Normal')).toBeInTheDocument();
  });

  it('should handle physical exam with empty answers (details empty)', () => {
    renderWithData({
      ...fullData,
      physicalExam: {
        answers: {},
        details: [],
      },
    });

    // No physical exam items with answers, but section still renders (not null)
    expect(screen.queryByText('No physical exam recorded')).not.toBeInTheDocument();
  });

  /* ── Check-up reason section rendering ────────────────────────────── */

  it('should render check-up reason with chief complaint chips and details', () => {
    renderWithData({
      ...fullData,
      visitReason: {
        answers: {},
        reasonNames: ['Cough', 'Fever'],
        details: [{ label: 'Duration', value: '3 days' }],
      },
    });

    expect(screen.getByText('Chief complaint(s)')).toBeInTheDocument();
    expect(screen.getByText('Cough')).toBeInTheDocument();
    expect(screen.getByText('Fever')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
    expect(screen.getByText('3 days')).toBeInTheDocument();
  });

  /* ── Vitals with null values (note fallback path) ────────────────── */

  it('should show "No information" for vitals with null values via note fallback', () => {
    renderWithData({
      vitals: {
        formValues: {
          height_cm: undefined as any,
          weight_kg: undefined as any,
          bmi: undefined as any,
          bp_systolic: undefined as any,
          bp_diastolic: undefined as any,
          pulse_bpm: undefined as any,
          temprature_f: undefined as any,
          spo2: undefined as any,
          respiratory_rate: undefined as any,
        },
        config: [],
      },
    });

    // When val is null, note is 'No information' — covers val?.toString() ?? note ?? 'No information'
    const noInfoElements = screen.getAllByText('No information');
    expect(noInfoElements.length).toBeGreaterThan(0);
  });

  /* ── Physical exam with question having no answers (answers[q.id] ?? []) ── */

  it('should handle physical exam questions with no matching answers', () => {
    renderWithData({
      physicalExam: {
        answers: {
          // pe1 has no entry
        },
        details: [],
      },
    });

    // Should still render without crashing, no exam items shown
    expect(screen.queryByText('General Appearance')).not.toBeInTheDocument();
  });

  /* ── Doctor's Specialty Dropdown ──────────────────────────────────── */

  it('should render Doctor\'s specialty label and dropdown', () => {
    renderWithData(fullData);
    expect(screen.getByText("Doctor's specialty")).toBeInTheDocument();
    expect(screen.getByText('General Physician')).toBeInTheDocument();
  });

  it('should render specialization options from config in the dropdown', () => {
    renderWithData(fullData);

    // Click dropdown to open options
    const dropdownButton = screen.getByRole('button', { name: /general physician/i });
    fireEvent.click(dropdownButton);

    expect(screen.getByText('Dermatology')).toBeInTheDocument();
    expect(screen.getByText('Cardiology')).toBeInTheDocument();
  });

  it('should update speciality when a dropdown option is selected', () => {
    renderWithData(fullData);

    // Open dropdown
    const dropdownButton = screen.getByRole('button', { name: /general physician/i });
    fireEvent.click(dropdownButton);

    // Select Dermatology
    fireEvent.click(screen.getByText('Dermatology'));

    // Dropdown should now show Dermatology
    expect(screen.getByText('Dermatology')).toBeInTheDocument();
  });

  /* ── Priority Visit Toggle ───────────────────────────────────────── */

  it('should render Priority Visit label and toggle', () => {
    renderWithData(fullData);
    expect(screen.getByText('Priority Visit')).toBeInTheDocument();
    // Toggle checkbox should be unchecked by default
    const toggle = screen.getByRole('checkbox');
    expect(toggle).not.toBeChecked();
  });

  it('should toggle priority visit when clicked', () => {
    renderWithData(fullData);

    const toggle = screen.getByRole('checkbox');
    expect(toggle).not.toBeChecked();

    fireEvent.click(toggle);
    expect(toggle).toBeChecked();
  });

  it('should pass speciality and priorityVisit to buildVisitUploadPayload', async () => {
    renderWithData(fullData);

    // Toggle priority visit on
    const toggle = screen.getByRole('checkbox');
    fireEvent.click(toggle);

    // Open and confirm upload
    fireEvent.click(screen.getByText('Upload Visit'));
    fireEvent.click(screen.getByTestId('modal-confirm'));

    await waitFor(() => {
      expect(mockBuildVisitUploadPayload).toHaveBeenCalledWith(
        expect.objectContaining({
          speciality: 'General Physician',
          priorityVisit: true,
        })
      );
    });
  });

  /* ── Config null/empty fallbacks ──────────────────────────────────── */

  it('should handle null config gracefully with empty specializations', () => {
    mockUseConfig.mockReturnValue({ config: null as any });
    renderWithData(fullData);

    // Dropdown should still render with placeholder
    expect(screen.getByText("Doctor's specialty")).toBeInTheDocument();
  });

  it('should handle specialization entries with null name', () => {
    mockUseConfig.mockReturnValue({
      config: {
        specialization: [
          { name: null as any },
          { name: 'Cardiology' },
        ],
      },
    });
    renderWithData(fullData);

    // Open dropdown to see options
    const dropdownButton = screen.getByRole('button', { name: /general physician/i });
    fireEvent.click(dropdownButton);

    // Null name should fallback to "Option 1"
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Cardiology')).toBeInTheDocument();
  });

  /* ── Physical exam with non-matching answer IDs ──────────────────── */

  it('should render empty value when physical exam answer IDs do not match any option', () => {
    renderWithData({
      ...fullData,
      physicalExam: {
        answers: {
          pe1: ['non_existent_option'],
        },
        details: [{ label: 'General Appearance', value: '' }],
      },
    });

    // details has the label but value is empty since answer IDs didn't match any option
    expect(screen.getByText('General Appearance')).toBeInTheDocument();
  });
});
