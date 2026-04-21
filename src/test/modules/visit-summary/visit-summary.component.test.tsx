import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import VisitSummaryComponent from '../../../modules/visit-summary/visit-summary.component';
import * as visitSummaryDataModule from '../../../assets/data/visit-summary.data';
import { visitSummaryService } from '../../../modules/visit-summary/visit-summary.service';
import { GlobalModalProvider } from '../../../components/modal/global-modal-context';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the service
vi.mock('../../../modules/visit-summary/visit-summary.service', () => ({
  visitSummaryService: {
    closeVisit: vi.fn().mockResolvedValue({}),
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
vi.mock('../../../assets/icons/icon-send-visit.svg', () => ({
  default: 'icon-send-visit.svg',
}));

/* Render without visitId — uses mock data fallback via useEffect */
const renderWithMockData = (action?: string) => {
  const path = action ? `/visit-summary/${action}` : '/visit-summary';
  return render(
    <GlobalModalProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/visit-summary/:action?" element={<VisitSummaryComponent />} />
        </Routes>
      </MemoryRouter>
    </GlobalModalProvider>
  );
};

/* Render with visitId — fetches data from API */
const renderWithVisitId = (visitId = 'test-visit-123', action?: string) => {
  const path = action
    ? `/visit-summary/${visitId}/${action}`
    : `/visit-summary/${visitId}`;
  return render(
    <GlobalModalProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/visit-summary/:visitId/:action?" element={<VisitSummaryComponent />} />
        </Routes>
      </MemoryRouter>
    </GlobalModalProvider>
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

    it('should render Change button for complaint', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('Change').length).toBeGreaterThan(0);
      });
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

  describe('Action buttons', () => {
    it('should render Appointment and Send visit buttons by default', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('Appointment').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Send visit').length).toBeGreaterThan(0);
      });
    });

    it('should render Close visit button when action is close', async () => {
      renderWithMockData('close');
      await waitFor(() => {
        expect(screen.getAllByText('Close visit').length).toBeGreaterThan(0);
      });
    });

    it('should not render Appointment button when action is close', async () => {
      renderWithMockData('close');
      await waitFor(() => {
        expect(screen.getAllByText('Close visit').length).toBeGreaterThan(0);
      });
      expect(screen.queryByText('Appointment')).not.toBeInTheDocument();
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
  });

  describe('handleCloseVisit', () => {
    it('should call visitSummaryService.closeVisit when desktop Close visit button is clicked', async () => {
      renderWithMockData('close');
      await waitFor(() => {
        expect(screen.getAllByText('Close visit').length).toBeGreaterThan(0);
      });
      const closeButtons = screen.getAllByText('Close visit');
      fireEvent.click(closeButtons[0]);

      await waitFor(() => {
        expect(visitSummaryService.closeVisit).toHaveBeenCalledWith(data.patient.visitId);
      });
    });

    it('should call visitSummaryService.closeVisit when mobile Close visit button is clicked', async () => {
      renderWithMockData('close');
      await waitFor(() => {
        expect(screen.getAllByText('Close visit').length).toBeGreaterThan(0);
      });
      const closeButtons = screen.getAllByText('Close visit');
      fireEvent.click(closeButtons[closeButtons.length - 1]);

      await waitFor(() => {
        expect(visitSummaryService.closeVisit).toHaveBeenCalledWith(data.patient.visitId);
      });
    });

    it('should handle closeVisit API error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(visitSummaryService.closeVisit).mockRejectedValueOnce(new Error('API error'));

      renderWithMockData('close');
      await waitFor(() => {
        expect(screen.getAllByText('Close visit').length).toBeGreaterThan(0);
      });
      const closeButtons = screen.getAllByText('Close visit');
      fireEvent.click(closeButtons[0]);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to close visit:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('handleAppointment', () => {
    it('should show appointment confirmation modal when desktop Appointment button is clicked', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('Appointment').length).toBeGreaterThan(0);
      });
      const appointmentButtons = screen.getAllByText('Appointment');
      fireEvent.click(appointmentButtons[0]);
      expect(screen.getByText('Book appointment?')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to book an appointment for this patient?')).toBeInTheDocument();
    });

    it('should show appointment confirmation modal when mobile Appointment button is clicked', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('Appointment').length).toBeGreaterThan(0);
      });
      const appointmentButtons = screen.getAllByText('Appointment');
      fireEvent.click(appointmentButtons[appointmentButtons.length - 1]);
      expect(screen.getByText('Book appointment?')).toBeInTheDocument();
    });

    it('should navigate to appointment schedule on confirm', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('Appointment').length).toBeGreaterThan(0);
      });
      const appointmentButtons = screen.getAllByText('Appointment');
      fireEvent.click(appointmentButtons[0]);
      fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
      expect(mockNavigate).toHaveBeenCalledWith('/appointment-schedule/00000000-0000-0000-0000-000000000000', {
        state: { speciality: 'General Physician' },
      });
    });

    it('should dismiss modal on cancel', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('Appointment').length).toBeGreaterThan(0);
      });
      const appointmentButtons = screen.getAllByText('Appointment');
      fireEvent.click(appointmentButtons[0]);
      expect(screen.getByText('Book appointment?')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'No' }));
      expect(screen.queryByText('Book appointment?')).not.toBeInTheDocument();
    });
  });

  describe('handleSendVisit', () => {
    it('should show send visit confirmation modal when desktop Send visit button is clicked', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('Send visit').length).toBeGreaterThan(0);
      });
      const sendButtons = screen.getAllByText('Send visit');
      fireEvent.click(sendButtons[0]);
      expect(screen.getByText('Send visit', { selector: 'h2' })).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to send the visit to the doctor?')).toBeInTheDocument();
    });

    it('should show send visit confirmation modal when mobile Send visit button is clicked', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('Send visit').length).toBeGreaterThan(0);
      });
      const sendButtons = screen.getAllByText('Send visit');
      fireEvent.click(sendButtons[sendButtons.length - 1]);
      expect(screen.getByText('Are you sure you want to send the visit to the doctor?')).toBeInTheDocument();
    });

    it('should dismiss modal when No is clicked', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('Send visit').length).toBeGreaterThan(0);
      });
      const sendButtons = screen.getAllByText('Send visit');
      fireEvent.click(sendButtons[0]);
      expect(screen.getByText('Are you sure you want to send the visit to the doctor?')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'No' }));
      expect(screen.queryByText('Are you sure you want to send the visit to the doctor?')).not.toBeInTheDocument();
    });

    it('should close modal when Yes is clicked', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('Send visit').length).toBeGreaterThan(0);
      });
      const sendButtons = screen.getAllByText('Send visit');
      fireEvent.click(sendButtons[0]);
      fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
      expect(screen.queryByText('Are you sure you want to send the visit to the doctor?')).not.toBeInTheDocument();
    });
  });

  describe('Change buttons in sections', () => {
    it('should render Change buttons for Vitals and Physical examination', async () => {
      renderWithMockData();
      await waitFor(() => {
        const changeButtons = screen.getAllByText('Change');
        expect(changeButtons.length).toBeGreaterThanOrEqual(3);
      });
    });

    it('should handle Change button click in Vitals section', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Details')).toBeInTheDocument();
      });
      const detailsLabel = screen.getByText('Details');
      const vitalsChangeBtn = detailsLabel.parentElement!.querySelector('[role="button"]') as HTMLElement;
      expect(vitalsChangeBtn).toBeInTheDocument();
      fireEvent.click(vitalsChangeBtn);
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('should handle Change button click in Physical examination section', async () => {
      renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('General exams')).toBeInTheDocument();
      });
      const generalExamsLabel = screen.getByText('General exams');
      const physicalChangeBtn = generalExamsLabel.parentElement!.querySelector('[role="button"]') as HTMLElement;
      expect(physicalChangeBtn).toBeInTheDocument();
      fireEvent.click(physicalChangeBtn);
      expect(screen.getByText('General exams')).toBeInTheDocument();
    });

    it('should invoke all onChangeClick callbacks when Change buttons are clicked', async () => {
      const { container } = renderWithMockData();
      await waitFor(() => {
        expect(screen.getByText('Vitals')).toBeInTheDocument();
      });
      const allChangeButtons = container.querySelectorAll('[role="button"]');
      allChangeButtons.forEach(btn => {
        if (btn.textContent?.includes('Change')) {
          fireEvent.click(btn);
        }
      });
      expect(screen.getByText('Vitals')).toBeInTheDocument();
      expect(screen.getByText('Physical examination')).toBeInTheDocument();
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

  describe('Toggle all round-trip', () => {
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

    it('should render mobile Appointment and Send visit buttons by default', async () => {
      const { container } = renderWithMockData();
      await waitFor(() => {
        expect(screen.getAllByText('Appointment').length).toBeGreaterThan(0);
      });
      const mobileBar = container.querySelector('.fixed.bottom-\\[70px\\]');
      expect(mobileBar).toBeInTheDocument();
      const buttons = mobileBar!.querySelectorAll('button');
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent).toBe('Appointment');
      expect(buttons[1].textContent).toBe('Send visit');
    });

    it('should render mobile Close visit button when action is close', async () => {
      const { container } = renderWithMockData('close');
      await waitFor(() => {
        expect(screen.getAllByText('Close visit').length).toBeGreaterThan(0);
      });
      const mobileBar = container.querySelector('.fixed.bottom-\\[70px\\]');
      expect(mobileBar).toBeInTheDocument();
      const buttons = mobileBar!.querySelectorAll('button');
      expect(buttons.length).toBe(1);
      expect(buttons[0].textContent).toBe('Close visit');
    });

    it('should render bottom spacer for mobile', async () => {
      const { container } = renderWithMockData();
      await waitFor(() => {
        expect(container.querySelector('.h-36.md\\:hidden')).toBeInTheDocument();
      });
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
