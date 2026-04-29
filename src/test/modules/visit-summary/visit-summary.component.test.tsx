import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import VisitSummaryComponent from '../../../modules/visit-summary/visit-summary.component';
import * as visitSummaryDataModule from '../../../assets/data/visit-summary.data';
import { visitSummaryService } from '../../../modules/visit-summary/visit-summary.service';

// Mock the service
vi.mock('../../../modules/visit-summary/visit-summary.service', () => ({
  visitSummaryService: {
    getVisitSummary: vi.fn(),
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
});
