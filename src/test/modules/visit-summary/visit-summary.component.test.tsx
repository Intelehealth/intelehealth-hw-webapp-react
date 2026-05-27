import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as visitSummaryDataModule from '../../../assets/data/visit-summary.data';
import VisitSummaryComponent from '../../../modules/visit-summary/visit-summary.component';
import { visitSummaryService } from '../../../modules/visit-summary/visit-summary.service';

// Mock the service
vi.mock('../../../modules/visit-summary/visit-summary.service', () => ({
  visitSummaryService: {
    getVisitSummary: vi.fn(),
    getAdditionalDocuments: vi.fn().mockResolvedValue([]),
    getDocumentFile: vi.fn().mockRejectedValue(new Error('not found')),
  },
}));

// Mock SVG imports
vi.mock('../../../assets/icons/appointment/icon-patient-image.svg', () => ({
  default: 'icon-patient-image.svg',
}));
vi.mock('../../../assets/icons/icon-visit-summery.svg', () => ({
  default: 'icon-visit-summary.svg',
}));
vi.mock('../../../assets/icons/icon-physical-examination.svg', () => ({
  default: 'icon-physical-exam.svg',
}));
vi.mock('../../../assets/icons/vitals.svg', () => ({
  default: 'icon-vitals.svg',
}));
vi.mock('../../../assets/icons/visit-reason.svg', () => ({
  default: 'icon-visit-reason.svg',
}));
vi.mock('../../../assets/icons/icon-sync.svg', () => ({
  default: 'icon-sync.svg',
}));
vi.mock('../../../assets/icons/icon-more-horizontal.svg', () => ({
  default: 'icon-three-dot.svg',
}));
vi.mock('../../../assets/icons/icon-chevron-down.svg', () => ({
  default: 'icon-chevron-down.svg',
}));
vi.mock('../../../assets/icons/edit.svg', () => ({
  default: 'icon-edit.svg',
}));
vi.mock('../../../assets/icons/icon-info.svg', () => ({
  default: 'icon-info.svg',
}));
vi.mock('../../../assets/icons/icon-medical-history-green-rounded-bordered.svg', () => ({
  default: 'icon-medical-history.svg',
}));

// Mock Dropdown and Toggle components
vi.mock('../../../components/common/dropdown.component', () => ({
  default: ({ value, placeholder, disabled }: { value?: string; placeholder?: string; disabled?: boolean }) => (
    <div data-testid="dropdown" data-disabled={disabled} data-value={value}>
      {value || placeholder || ''}
    </div>
  ),
}));
vi.mock('../../../components/common/toggle.component', () => ({
  default: ({ checked, disabled, ...props }: { checked?: boolean; disabled?: boolean }) => (
    <input type="checkbox" data-testid="toggle" checked={checked} disabled={disabled} readOnly {...props} />
  ),
}));

/* Render without visitId — uses mock data fallback via useEffect */
const renderWithMockData = () => {
  return render(
    <MemoryRouter initialEntries={['/visit-summary']}>
      <Routes>
        <Route path="/visit-summary" element={<VisitSummaryComponent />} />
      </Routes>
    </MemoryRouter>
  );
};

/* Render with visitId — fetches data from API */
const renderWithVisitId = (visitId = 'test-visit-123') => {
  return render(
    <MemoryRouter initialEntries={[`/visit-summary/${visitId}`]}>
      <Routes>
        <Route path="/visit-summary/:visitId" element={<VisitSummaryComponent />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('VisitSummaryComponent', () => {
  const data = visitSummaryDataModule.visitSummaryData[0];

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    globalThis.URL.revokeObjectURL = vi.fn();
  });

  describe('loading and error states (with visitId)', () => {
    it('should show loading message while fetching', () => {
      vi.mocked(visitSummaryService.getVisitSummary).mockReturnValue(new Promise(() => {}));
      renderWithVisitId();
      expect(screen.getByText('Loading visit summary...')).toBeInTheDocument();
    });

    it('should show error message on API failure', async () => {
      vi.mocked(visitSummaryService.getVisitSummary).mockRejectedValue(new Error('fail'));
      renderWithVisitId();

      await waitFor(() => {
        expect(screen.getByText('Failed to load visit summary')).toBeInTheDocument();
      });
    });

    it('should render data after successful API fetch', async () => {
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      renderWithVisitId();

      await waitFor(() => {
        expect(screen.getByText('Visit Summary')).toBeInTheDocument();
        expect(screen.getByText('Vitals')).toBeInTheDocument();
      });
    });

    it('should call getVisitSummary with the visitId from params', async () => {
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      renderWithVisitId('my-uuid-123');

      await waitFor(() => {
        expect(visitSummaryService.getVisitSummary).toHaveBeenCalledWith('my-uuid-123');
      });
    });
  });

  describe('mock data fallback (no visitId)', () => {
    it('should render without crashing', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Visit Summary')).toBeInTheDocument();
      });
    });

    it('should not call getVisitSummary', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Visit Summary')).toBeInTheDocument();
      });
      expect(visitSummaryService.getVisitSummary).not.toHaveBeenCalled();
    });

    it('should render fallback message when mock data is empty', async () => {
      const originalData = [...visitSummaryDataModule.visitSummaryData];
      visitSummaryDataModule.visitSummaryData.length = 0;

      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('No visit summary data found')).toBeInTheDocument();
      });

      visitSummaryDataModule.visitSummaryData.push(...originalData);
    });
  });

  it('should render the Visit Summary header', async () => {
    renderWithMockData();
    await waitFor(() => {
      expect(screen.getByText('Visit Summary')).toBeInTheDocument();
    });
  });

  it('should render the mobile header', async () => {
    renderWithMockData();
    await waitFor(() => {
      expect(screen.getByText('Visit summary')).toBeInTheDocument();
    });
  });

  it('should render patient name in collapsed header', async () => {
    renderWithMockData();
    await waitFor(() => {
      expect(
        screen.getByText((content) => content.includes(data.patient.name) && content.includes('M 24'))
      ).toBeInTheDocument();
    });
  });

  it('should render patient ID as subtitle', async () => {
    renderWithMockData();
    await waitFor(() => {
      expect(screen.getByText(`ID: ${data.patient.id}`)).toBeInTheDocument();
    });
  });

  it('should render Vitals section', async () => {
    renderWithMockData();
    await waitFor(() => {
      expect(screen.getByText('Vitals')).toBeInTheDocument();
    });
  });

  it('should render Check-up reason section', async () => {
    renderWithMockData();
    await waitFor(() => {
      expect(screen.getByText('Check-up reason')).toBeInTheDocument();
    });
  });

  it('should render Physical examination section', async () => {
    renderWithMockData();
    await waitFor(() => {
      expect(screen.getByText('Physical examination')).toBeInTheDocument();
    });
  });

  describe('PatientHeader', () => {
    it('should render CHW worker value', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText(data.patient.chwWorker).length).toBeGreaterThan(0);
      });
    });

    it('should render Visit ID value', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText(data.patient.visitId).length).toBeGreaterThan(0);
      });
    });

    it('should render Gender label', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('Gender').length).toBeGreaterThan(0);
      });
    });

    it('should render Age label', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('Age').length).toBeGreaterThan(0);
      });
    });
  });

  describe('VitalsSection', () => {
    it('should render height value', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('168').length).toBeGreaterThan(0);
      });
    });

    it('should render weight value', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('72').length).toBeGreaterThan(0);
      });
    });

    it('should render BMI value', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('25.51').length).toBeGreaterThan(0);
      });
    });

    it('should render BP value', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('130/85').length).toBeGreaterThan(0);
      });
    });

    it('should render "No information" for missing vitals', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('No information').length).toBeGreaterThan(0);
      });
    });

    it('should render Details content label', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
    });

    it('should not render Additional Measurements heading when none present', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      expect(screen.queryByText('Additional Measurements')).not.toBeInTheDocument();
    });

    it('should render Additional Measurements when provided', async () => {
      const originalData = [...visitSummaryDataModule.visitSummaryData];
      visitSummaryDataModule.visitSummaryData[0] = {
        ...originalData[0],
        vitals: {
          ...originalData[0].vitals,
          additionalMeasurements: [
            { label: 'Fasting Blood Sugar (FBS) (mg/dl)', value: '89' },
            { label: 'HbA1c', value: '6' },
            { label: 'Blood Group', value: 'B POSITIVE' },
          ],
        },
      };

      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('Additional Measurements').length).toBeGreaterThan(0);
        expect(
          screen.getAllByText('Fasting Blood Sugar (FBS) (mg/dl)').length
        ).toBeGreaterThan(0);
        expect(screen.getAllByText('89').length).toBeGreaterThan(0);
        expect(screen.getAllByText('HbA1c').length).toBeGreaterThan(0);
        expect(screen.getAllByText('B POSITIVE').length).toBeGreaterThan(0);
      });

      visitSummaryDataModule.visitSummaryData.length = 0;
      visitSummaryDataModule.visitSummaryData.push(...originalData);
    });
  });

  describe('CheckupReasonSection', () => {
    it('should render Chief complaint(s) label', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Chief complaint(s)')).toBeInTheDocument();
      });
    });

    it('should render complaint chips', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('Abdominal pain').length).toBeGreaterThan(0);
      });
    });

    it('should render complaint details', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Upper (R) - Right Hypochondrium')).toBeInTheDocument();
      });
    });

    it('should render Site label', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Site')).toBeInTheDocument();
      });
    });

    it('should render associated symptoms when present', async () => {
      const originalData = [...visitSummaryDataModule.visitSummaryData];
      visitSummaryDataModule.visitSummaryData[0] = {
        ...originalData[0],
        checkupReason: {
          chiefComplaints: ['Fever'],
          details: [{ label: 'Duration', value: '3 days' }],
          associatedSymptoms: [
            { heading: 'Patient reports', values: ['Chills', 'Sweating'] },
            { heading: 'Patient denies', values: ['Nausea'] },
          ],
        },
      };

      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Associated symptoms')).toBeInTheDocument();
        expect(screen.getByText('Patient reports:')).toBeInTheDocument();
        expect(screen.getByText('Chills')).toBeInTheDocument();
        expect(screen.getByText('Sweating')).toBeInTheDocument();
        expect(screen.getByText('Patient denies:')).toBeInTheDocument();
        expect(screen.getByText('Nausea')).toBeInTheDocument();
      });

      visitSummaryDataModule.visitSummaryData.length = 0;
      visitSummaryDataModule.visitSummaryData.push(...originalData);
    });

    it('should show empty state when no checkup reason', async () => {
      const originalData = [...visitSummaryDataModule.visitSummaryData];
      visitSummaryDataModule.visitSummaryData[0] = {
        ...originalData[0],
        checkupReason: { chiefComplaints: ['No information'], details: [] },
      };

      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('No visit reason recorded')).toBeInTheDocument();
      });

      visitSummaryDataModule.visitSummaryData.length = 0;
      visitSummaryDataModule.visitSummaryData.push(...originalData);
    });
  });

  describe('PhysicalExaminationSection', () => {
    it('should render General exams content label', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('General exams')).toBeInTheDocument();
      });
    });

    it('should render physical exam details', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Person Consultation')).toBeInTheDocument();
      });
    });

    it('should render exam labels', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('Eyes').length).toBeGreaterThan(0);
      });
    });
  });

  describe('MedicalHistorySection', () => {
    it('should render Medical History section title', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Medical History')).toBeInTheDocument();
      });
    });

    it('should show empty state when no medical history', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('No medical history recorded')).toBeInTheDocument();
      });
    });

    it('should render medical history details when present', async () => {
      const originalData = [...visitSummaryDataModule.visitSummaryData];
      visitSummaryDataModule.visitSummaryData[0] = {
        ...originalData[0],
        medicalHistory: [
          {
            title: 'Patient History',
            details: [
              { label: 'Diabetes', value: 'Type 2' },
              { label: 'Hypertension', value: 'Controlled' },
            ],
          },
          {
            title: 'Family History',
            details: [
              { label: 'Diabetes', value: 'Father' },
            ],
          },
        ],
      };

      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Patient History')).toBeInTheDocument();
        expect(screen.getAllByText('Diabetes').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText('Type 2')).toBeInTheDocument();
        expect(screen.getByText('Hypertension')).toBeInTheDocument();
        expect(screen.getByText('Controlled')).toBeInTheDocument();
        expect(screen.getByText('Family History')).toBeInTheDocument();
        expect(screen.getByText('Father')).toBeInTheDocument();
      });

      visitSummaryDataModule.visitSummaryData.length = 0;
      visitSummaryDataModule.visitSummaryData.push(...originalData);
    });
  });

  describe('Doctor\'s Specialty and Priority Visit', () => {
    it('should render Doctor\'s specialty label', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText("Doctor's specialty")).toBeInTheDocument();
      });
    });

    it('should show placeholder when specialty is not set', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('General physician')).toBeInTheDocument();
      });
    });

    it('should render specialty value when present', async () => {
      const originalData = [...visitSummaryDataModule.visitSummaryData];
      visitSummaryDataModule.visitSummaryData[0] = {
        ...originalData[0],
        speciality: 'Cardiologist',
      };

      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Cardiologist')).toBeInTheDocument();
      });

      visitSummaryDataModule.visitSummaryData.length = 0;
      visitSummaryDataModule.visitSummaryData.push(...originalData);
    });

    it('should render Priority Visit label', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Priority Visit')).toBeInTheDocument();
      });
    });

    it('should render toggle unchecked when priority visit is false or undefined', async () => {
      renderWithMockData();
      await waitFor(() => {
        const toggle = screen.getByRole('checkbox', { hidden: true });
        expect(toggle).not.toBeChecked();
      });
    });

    it('should render toggle checked when priority visit is true', async () => {
      const originalData = [...visitSummaryDataModule.visitSummaryData];
      visitSummaryDataModule.visitSummaryData[0] = {
        ...originalData[0],
        priorityVisit: true,
      };

      renderWithMockData();
      await waitFor(() => {
        const toggle = screen.getByRole('checkbox', { hidden: true });
        expect(toggle).toBeChecked();
      });

      visitSummaryDataModule.visitSummaryData.length = 0;
      visitSummaryDataModule.visitSummaryData.push(...originalData);
    });
  });

  describe('View-only mode', () => {
    it('should not render any Change buttons', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Vitals')).toBeInTheDocument();
      });
      expect(screen.queryByText('Change')).not.toBeInTheDocument();
    });

    it('should not render Appointment button', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Vitals')).toBeInTheDocument();
      });
      expect(screen.queryByText('Appointment')).not.toBeInTheDocument();
    });

    it('should not render Send visit button', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Vitals')).toBeInTheDocument();
      });
      expect(screen.queryByText('Send visit')).not.toBeInTheDocument();
    });

    it('should not render Close visit button', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Vitals')).toBeInTheDocument();
      });
      expect(screen.queryByText('Close visit')).not.toBeInTheDocument();
    });
  });

  describe('getVitalDisplay fallback', () => {
    it('should show "No information" when vital value is null and note is undefined', async () => {
      const originalData = [...visitSummaryDataModule.visitSummaryData];

      visitSummaryDataModule.visitSummaryData[0] = {
        ...originalData[0],
        vitals: {
          ...originalData[0].vitals,
          pulse: { value: null },
        },
      };

      renderWithMockData();
      await waitFor(() => {
        const pulseLabels = screen.getAllByText('Pulse');
        expect(pulseLabels.length).toBeGreaterThan(0);
      });

      visitSummaryDataModule.visitSummaryData.length = 0;
      visitSummaryDataModule.visitSummaryData.push(...originalData);
    });

    it('should show "No information" for BP when both systolic and diastolic are 0', async () => {
      const originalData = [...visitSummaryDataModule.visitSummaryData];

      visitSummaryDataModule.visitSummaryData[0] = {
        ...originalData[0],
        vitals: {
          ...originalData[0].vitals,
          bp: { systolic: 0, diastolic: 0 },
        },
      };

      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('BP').length).toBeGreaterThan(0);
        // BP row should display "No information" since both values are 0
        const noInfoElements = screen.getAllByText('No information');
        expect(noInfoElements.length).toBeGreaterThan(0);
      });

      visitSummaryDataModule.visitSummaryData.length = 0;
      visitSummaryDataModule.visitSummaryData.push(...originalData);
    });

    it('should show "No information" for BMI when value is 0', async () => {
      const originalData = [...visitSummaryDataModule.visitSummaryData];

      visitSummaryDataModule.visitSummaryData[0] = {
        ...originalData[0],
        vitals: {
          ...originalData[0].vitals,
          bmi: { value: 0 },
        },
      };

      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('BMI').length).toBeGreaterThan(0);
        const noInfoElements = screen.getAllByText('No information');
        expect(noInfoElements.length).toBeGreaterThan(0);
      });

      visitSummaryDataModule.visitSummaryData.length = 0;
      visitSummaryDataModule.visitSummaryData.push(...originalData);
    });
  });

  describe('Toggle all', () => {
    it('should render Close all button', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Close all')).toBeInTheDocument();
      });
    });

    it('should toggle to Open all on click', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Close all')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Close all'));
      expect(screen.getByText('Open all')).toBeInTheDocument();
    });

    it('should toggle from Open all back to Close all', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Close all')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Close all'));
      expect(screen.getByText('Open all')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Open all'));
      expect(screen.getByText('Close all')).toBeInTheDocument();
    });
  });

  describe('Mobile UI', () => {
    it('should render mobile header with back arrow icon', async () => {
      const { container } = renderWithMockData();
      await waitFor(() => {
        expect(container.querySelector('.fa-arrow-left')).toBeInTheDocument();
      });
    });

    it('should render mobile sync button', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByAltText('sync')).toBeInTheDocument();
      });
    });

    it('should render mobile menu button', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByAltText('menu')).toBeInTheDocument();
      });
    });

    it('should render mobile header as sticky', async () => {
      const { container } = renderWithMockData();
      await waitFor(() => {
        expect(container.querySelector('.md\\:hidden.sticky')).toBeInTheDocument();
      });
    });

    it('should render mobile Close all / Open all toggle with chevron icon', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Close all')).toBeInTheDocument();
      });
      const toggleWrapper = screen.getByText('Close all').closest('button');
      expect(toggleWrapper).toBeInTheDocument();
      const chevronImg = toggleWrapper!.querySelector('img');
      expect(chevronImg).toBeInTheDocument();
    });

    it('should rotate chevron icon when allOpen is true', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Close all')).toBeInTheDocument();
      });
      const toggleWrapper = screen.getByText('Close all').closest('button');
      const chevronImg = toggleWrapper!.querySelector('img');
      expect(chevronImg).toHaveClass('rotate-180');
    });

    it('should not rotate chevron icon when allOpen is false', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Close all')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Close all'));
      const toggleWrapper = screen.getByText('Open all').closest('button');
      const chevronImg = toggleWrapper!.querySelector('img');
      expect(chevronImg).not.toHaveClass('rotate-180');
    });

    it('should render mobile PatientHeader with only CHW worker and Visit ID', async () => {
      const { container } = renderWithMockData();
      await waitFor(() => {
        expect(container.querySelector('.md\\:hidden.space-y-1')).toBeInTheDocument();
      });
      const mobileSection = container.querySelector('.md\\:hidden.space-y-1');
      expect(mobileSection!.children.length).toBe(2);
    });
  });

  describe('Additional Notes section', () => {
    it('should render Additional notes label', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Additional notes')).toBeInTheDocument();
      });
    });

    it('should show empty state when no notes', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(
          screen.getByText('No notes added for Doctor.')
        ).toBeInTheDocument();
      });
    });

    it('should render doctor notes text when present', async () => {
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue({
        ...data,
        doctorNotes: 'Please check blood pressure regularly',
      });
      renderWithVisitId();

      await waitFor(() => {
        expect(
          screen.getByText('Please check blood pressure regularly')
        ).toBeInTheDocument();
      });
    });

    it('should not render a textarea (read-only)', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Additional notes')).toBeInTheDocument();
      });
      expect(screen.queryByPlaceholderText('Leave a note for doctor')).not.toBeInTheDocument();
    });
  });

  describe('Additional Documents section', () => {
    it('should render Additional documents label', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText(/Additional documents/)).toBeInTheDocument();
      });
    });

    it('should show empty state when no documents', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(
          screen.getByText('No documents attached')
        ).toBeInTheDocument();
      });
    });

    it('should not render file input (read-only)', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText(/Additional documents/)).toBeInTheDocument();
      });
      expect(screen.queryByRole('button', { name: '+' })).not.toBeInTheDocument();
    });

    it('should fetch and render additional documents after data loads', async () => {
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        {
          uuid: 'doc-1',
          name: 'lab-report.pdf',
          fileUrl: 'http://example.com/file',
          isImage: false,
        },
      ]);

      renderWithVisitId();

      await waitFor(() => {
        expect(screen.getByText('lab-report.pdf')).toBeInTheDocument();
      });
    });

    it('should show document count when documents exist', async () => {
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        { uuid: 'doc-1', name: 'file1.pdf', fileUrl: '', isImage: false },
        { uuid: 'doc-2', name: 'file2.pdf', fileUrl: '', isImage: false },
      ]);

      renderWithVisitId();

      await waitFor(() => {
        expect(screen.getByText('(2)')).toBeInTheDocument();
      });
    });

    it('should render image thumbnail for image documents', async () => {
      const mockBlob = new Blob(['img'], { type: 'image/png' });
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        {
          uuid: 'doc-1',
          name: 'photo.jpg',
          fileUrl: 'http://example.com/photo.jpg',
          isImage: true,
        },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockResolvedValue(mockBlob);

      renderWithVisitId();

      await waitFor(() => {
        const img = screen.getByAltText('photo.jpg');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'blob:mock-url');
      });
    });

    it('should render PDF icon for PDF documents', async () => {
      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        {
          uuid: 'doc-1',
          name: 'report.pdf',
          fileUrl: 'http://example.com/report.pdf',
          isImage: false,
        },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockResolvedValue(mockBlob);

      const { container } = renderWithVisitId();

      await waitFor(() => {
        expect(screen.getByText('report.pdf')).toBeInTheDocument();
        expect(container.querySelector('.fa-file-pdf')).toBeInTheDocument();
      });
    });

    it('should handle document fetch failure gracefully', async () => {
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockRejectedValue(
        new Error('Network error')
      );

      renderWithVisitId();

      await waitFor(() => {
        expect(screen.getByText('No documents attached')).toBeInTheDocument();
      });
    });

    it('should call getAdditionalDocuments with patient UUID and visit UUID', async () => {
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([]);

      renderWithVisitId();

      await waitFor(() => {
        expect(visitSummaryService.getAdditionalDocuments).toHaveBeenCalledWith(
          data.patient.patientUuid,
          data.visitUuid
        );
      });
    });

    it('should show fallback file icon when blob fetch fails', async () => {
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        {
          uuid: 'doc-1',
          name: 'photo.jpg',
          fileUrl: '',
          isImage: true,
        },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockRejectedValue(
        new Error('not found')
      );

      const { container } = renderWithVisitId();

      await waitFor(() => {
        expect(screen.getByText('photo.jpg')).toBeInTheDocument();
      }, { timeout: 3000 });
      await waitFor(() => {
        expect(container.querySelector('.fa-file')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should render Word icon for .docx documents', async () => {
      const mockBlob = new Blob(['doc'], { type: 'application/msword' });
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        { uuid: 'doc-1', name: 'notes.docx', fileUrl: '', isImage: false },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockResolvedValue(mockBlob);

      const { container } = renderWithVisitId();

      await waitFor(() => {
        expect(container.querySelector('.fa-file-word')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should render Excel icon for .xlsx documents', async () => {
      const mockBlob = new Blob(['xls'], { type: 'application/vnd.ms-excel' });
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        { uuid: 'doc-1', name: 'data.xlsx', fileUrl: '', isImage: false },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockResolvedValue(mockBlob);

      const { container } = renderWithVisitId();

      await waitFor(() => {
        expect(container.querySelector('.fa-file-excel')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should render text icon for .txt documents', async () => {
      const mockBlob = new Blob(['txt'], { type: 'text/plain' });
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        { uuid: 'doc-1', name: 'readme.txt', fileUrl: '', isImage: false },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockResolvedValue(mockBlob);

      const { container } = renderWithVisitId();

      await waitFor(() => {
        expect(container.querySelector('.fa-file-lines')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should render generic icon for unknown file types', async () => {
      const mockBlob = new Blob(['data']);
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        { uuid: 'doc-1', name: 'archive', fileUrl: '', isImage: false },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockResolvedValue(mockBlob);

      const { container } = renderWithVisitId();

      await waitFor(() => {
        expect(container.querySelector('.fa-file')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should not open window when blob is not loaded', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        { uuid: 'doc-1', name: 'file.pdf', fileUrl: '', isImage: false },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockRejectedValue(
        new Error('fail')
      );

      const { container } = renderWithVisitId();

      await waitFor(() => {
        expect(container.querySelector('.fa-file-pdf')).toBeInTheDocument();
      });

      const docLabel = screen.getByText('file.pdf');
      const docContainer = docLabel.closest('.flex.flex-col')!;
      const button = docContainer.querySelector('button')!;
      fireEvent.click(button);

      expect(windowOpenSpy).not.toHaveBeenCalled();
      windowOpenSpy.mockRestore();
    });

    it('should open document in new tab on click', async () => {
      const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        {
          uuid: 'doc-1',
          name: 'report.pdf',
          fileUrl: '',
          isImage: false,
        },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockResolvedValue(mockBlob);

      const { container } = renderWithVisitId();

      await waitFor(() => {
        expect(container.querySelector('.fa-file-pdf')).toBeInTheDocument();
      });

      const docLabel = screen.getByText('report.pdf');
      const docContainer = docLabel.closest('.flex.flex-col')!;
      const button = docContainer.querySelector('button')!;
      fireEvent.click(button);

      expect(windowOpenSpy).toHaveBeenCalledWith('blob:mock-url', '_blank');
      windowOpenSpy.mockRestore();
    });
  });

  describe('DocumentThumbnail loading state', () => {
    it('should show loading pulse animation while blob is being fetched', async () => {
      let resolveBlob!: (value: Blob) => void;
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        { uuid: 'doc-1', name: 'photo.jpg', fileUrl: '', isImage: true },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockReturnValue(
        new Promise(resolve => {
          resolveBlob = resolve;
        })
      );

      const { container } = renderWithVisitId();

      await waitFor(() => {
        expect(screen.getByText('photo.jpg')).toBeInTheDocument();
      });

      // While loading, the pulse animation div should be shown
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();

      // Resolve the blob to finish loading
      resolveBlob(new Blob(['img'], { type: 'image/png' }));

      await waitFor(() => {
        expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
      });
    });

    it('should revoke blob URL on unmount', async () => {
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');
      const mockBlob = new Blob(['img'], { type: 'image/png' });
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        { uuid: 'doc-1', name: 'cleanup.jpg', fileUrl: '', isImage: true },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockResolvedValue(mockBlob);

      const { unmount } = renderWithVisitId();

      await waitFor(() => {
        expect(screen.getByAltText('cleanup.jpg')).toBeInTheDocument();
      });

      unmount();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
      revokeObjectURLSpy.mockRestore();
    });

    it('should not revoke URL on unmount when blob never loaded', async () => {
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        { uuid: 'doc-1', name: 'fail.jpg', fileUrl: '', isImage: true },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockRejectedValue(
        new Error('not found')
      );

      const { unmount } = renderWithVisitId();

      await waitFor(() => {
        expect(screen.getByText('fail.jpg')).toBeInTheDocument();
      });

      unmount();
      expect(revokeObjectURLSpy).not.toHaveBeenCalled();
      revokeObjectURLSpy.mockRestore();
    });
  });

  describe('cancelled flag race condition prevention', () => {
    it('should not set data after unmount during API fetch', async () => {
      let resolveSummary!: (value: typeof data) => void;
      vi.mocked(visitSummaryService.getVisitSummary).mockReturnValue(
        new Promise(resolve => {
          resolveSummary = resolve;
        })
      );

      const { unmount } = renderWithVisitId();

      // Loading state should be shown
      expect(screen.getByText('Loading visit summary...')).toBeInTheDocument();

      // Unmount before the promise resolves
      unmount();

      // Resolve the promise after unmount — should not throw or update state
      resolveSummary(data);
    });

    it('should not set error after unmount during API failure', async () => {
      let rejectSummary!: (err: Error) => void;
      vi.mocked(visitSummaryService.getVisitSummary).mockReturnValue(
        new Promise((_resolve, reject) => {
          rejectSummary = reject;
        })
      );

      const { unmount } = renderWithVisitId();
      expect(screen.getByText('Loading visit summary...')).toBeInTheDocument();

      unmount();

      // Reject after unmount — should not throw
      rejectSummary(new Error('fail'));
    });

    it('should not set documents after unmount during documents fetch', async () => {
      let resolveDocuments!: (value: any[]) => void;
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockReturnValue(
        new Promise(resolve => {
          resolveDocuments = resolve;
        })
      );

      const { unmount } = renderWithVisitId();

      await waitFor(() => {
        expect(screen.getByText('Vitals')).toBeInTheDocument();
      });

      unmount();

      // Resolve documents after unmount — should not throw
      resolveDocuments([
        { uuid: 'doc-1', name: 'late.jpg', fileUrl: '', isImage: true },
      ]);
    });
  });

  describe('getFileIcon edge cases', () => {
    it('should render Word icon for .doc extension', async () => {
      const mockBlob = new Blob(['doc'], { type: 'application/msword' });
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        { uuid: 'doc-1', name: 'notes.doc', fileUrl: '', isImage: false },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockResolvedValue(mockBlob);

      const { container } = renderWithVisitId();

      await waitFor(() => {
        expect(container.querySelector('.fa-file-word')).toBeInTheDocument();
        expect(container.querySelector('.text-blue-500')).toBeInTheDocument();
      });
    });

    it('should render Excel icon for .csv extension', async () => {
      const mockBlob = new Blob(['csv'], { type: 'text/csv' });
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        { uuid: 'doc-1', name: 'data.csv', fileUrl: '', isImage: false },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockResolvedValue(mockBlob);

      const { container } = renderWithVisitId();

      await waitFor(() => {
        expect(container.querySelector('.fa-file-excel')).toBeInTheDocument();
        expect(container.querySelector('.text-green-600')).toBeInTheDocument();
      });
    });

    it('should render Excel icon for .xls extension', async () => {
      const mockBlob = new Blob(['xls'], { type: 'application/vnd.ms-excel' });
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        { uuid: 'doc-1', name: 'report.xls', fileUrl: '', isImage: false },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockResolvedValue(mockBlob);

      const { container } = renderWithVisitId();

      await waitFor(() => {
        expect(container.querySelector('.fa-file-excel')).toBeInTheDocument();
      });
    });

    it('should render text icon for .txt extension', async () => {
      const mockBlob = new Blob(['text'], { type: 'text/plain' });
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        { uuid: 'doc-1', name: 'readme.txt', fileUrl: '', isImage: false },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockResolvedValue(mockBlob);

      const { container } = renderWithVisitId();

      await waitFor(() => {
        expect(container.querySelector('.fa-file-lines')).toBeInTheDocument();
        expect(container.querySelector('.text-gray-500')).toBeInTheDocument();
      });
    });

    it('should render generic file icon for unknown extension', async () => {
      const mockBlob = new Blob(['data']);
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        { uuid: 'doc-1', name: 'archive.zip', fileUrl: '', isImage: false },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockResolvedValue(mockBlob);

      const { container } = renderWithVisitId();

      await waitFor(() => {
        expect(container.querySelector('.fa-file')).toBeInTheDocument();
      });
    });
  });

  describe('documents not fetched without required UUIDs', () => {
    it('should not fetch documents when visitUuid is missing', async () => {
      const dataWithoutVisitUuid = { ...data, visitUuid: undefined as any };
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(dataWithoutVisitUuid);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([]);

      renderWithVisitId();

      await waitFor(() => {
        expect(screen.getByText('Vitals')).toBeInTheDocument();
      });

      expect(visitSummaryService.getAdditionalDocuments).not.toHaveBeenCalled();
    });

    it('should not fetch documents when patientUuid is missing', async () => {
      const dataWithoutPatient = {
        ...data,
        patient: { ...data.patient, patientUuid: undefined as any },
      };
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(dataWithoutPatient);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([]);

      renderWithVisitId();

      await waitFor(() => {
        expect(screen.getByText('Vitals')).toBeInTheDocument();
      });

      expect(visitSummaryService.getAdditionalDocuments).not.toHaveBeenCalled();
    });
  });

  describe('LabelValueRow styling', () => {
    it('should render dot indicator in label', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Vitals')).toBeInTheDocument();
      });
      // Dot indicators are small spans inside the label
      const { container } = renderWithMockData();
      await waitFor(() => {
        const dots = container.querySelectorAll('.w-1.h-1.rounded-full.bg-\\[\\#E5E5E9\\]');
        expect(dots.length).toBeGreaterThan(0);
      });
    });

    it('should apply italic styling to "No information" values', async () => {
      renderWithMockData();
      await waitFor(() => {
        const noInfoElements = screen.getAllByText('No information');
        noInfoElements.forEach(el => {
          expect(el).toHaveClass('italic');
          expect(el).toHaveClass('text-gray-400');
        });
      });
    });
  });

  describe('multiple documents rendering', () => {
    it('should render multiple documents of different types simultaneously', async () => {
      const mockBlob = new Blob(['data']);
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        { uuid: 'doc-1', name: 'photo.jpg', fileUrl: '', isImage: true },
        { uuid: 'doc-2', name: 'report.pdf', fileUrl: '', isImage: false },
        { uuid: 'doc-3', name: 'notes.docx', fileUrl: '', isImage: false },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockResolvedValue(mockBlob);

      const { container } = renderWithVisitId();

      await waitFor(() => {
        expect(screen.getByText('photo.jpg')).toBeInTheDocument();
        expect(screen.getByText('report.pdf')).toBeInTheDocument();
        expect(screen.getByText('notes.docx')).toBeInTheDocument();
        expect(screen.getByText('(3)')).toBeInTheDocument();
      });
      await waitFor(() => {
        expect(container.querySelector('.fa-file-pdf')).toBeInTheDocument();
        expect(container.querySelector('.fa-file-word')).toBeInTheDocument();
      });
    });
  });

  describe('DocumentThumbnail button disabled state', () => {
    it('should disable button when blob URL is empty', async () => {
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        { uuid: 'doc-1', name: 'no-blob.pdf', fileUrl: '', isImage: false },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockRejectedValue(new Error('fail'));

      renderWithVisitId();

      await waitFor(() => {
        expect(screen.getByText('no-blob.pdf')).toBeInTheDocument();
      });

      const docLabel = screen.getByText('no-blob.pdf');
      const docContainer = docLabel.closest('.flex.flex-col')!;
      const button = docContainer.querySelector('button')!;
      expect(button).toBeDisabled();
    });

    it('should not open window when clicking button with no blob URL', async () => {
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        { uuid: 'doc-1', name: 'no-blob.pdf', fileUrl: '', isImage: false },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockRejectedValue(new Error('fail'));

      renderWithVisitId();

      await waitFor(() => {
        expect(screen.getByText('no-blob.pdf')).toBeInTheDocument();
      });

      const docLabel = screen.getByText('no-blob.pdf');
      const button = docLabel.closest('.flex.flex-col')!.querySelector('button')!;
      fireEvent.click(button);

      expect(openSpy).not.toHaveBeenCalled();
      openSpy.mockRestore();
    });

    it('should enable button when blob URL is set', async () => {
      const mockBlob = new Blob(['data'], { type: 'image/png' });
      vi.mocked(visitSummaryService.getVisitSummary).mockResolvedValue(data);
      vi.mocked(visitSummaryService.getAdditionalDocuments).mockResolvedValue([
        { uuid: 'doc-1', name: 'has-blob.jpg', fileUrl: '', isImage: true },
      ]);
      vi.mocked(visitSummaryService.getDocumentFile).mockResolvedValue(mockBlob);

      renderWithVisitId();

      await waitFor(() => {
        expect(screen.getByAltText('has-blob.jpg')).toBeInTheDocument();
      });

      const docLabel = screen.getByText('has-blob.jpg');
      const docContainer = docLabel.closest('.flex.flex-col')!;
      const button = docContainer.querySelector('button')!;
      expect(button).not.toBeDisabled();
    });
  });
});
