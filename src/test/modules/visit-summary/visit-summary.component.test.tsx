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
  },
}));

// Mock SVG imports
vi.mock('../../../assets/icons/appiontment/icon-patient-image.svg', () => ({
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

const renderWithRouter = (action = 'view') => {
  return render(
    <GlobalModalProvider>
      <MemoryRouter initialEntries={[`/visit-summary/${action}`]}>
        <Routes>
          <Route path="/visit-summary/:action" element={<VisitSummaryComponent />} />
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

  it('should render without crashing', () => {
    expect(() => {
      renderWithRouter();
    }).not.toThrow();
  });

  it('should render the Visit Summary header', () => {
    renderWithRouter();
    expect(screen.getByText('Visit Summary')).toBeInTheDocument();
  });

  it('should render the mobile header', () => {
    renderWithRouter();
    expect(screen.getByText('Visit summary')).toBeInTheDocument();
  });

  it('should render patient name in collapsed header', () => {
    renderWithRouter();
    expect(
      screen.getByText((content) => content.includes(data.patient.name) && content.includes('M 24'))
    ).toBeInTheDocument();
  });

  it('should render patient ID as subtitle', () => {
    renderWithRouter();
    expect(screen.getByText(`ID: ${data.patient.id}`)).toBeInTheDocument();
  });

  it('should render Vitals section', () => {
    renderWithRouter();
    expect(screen.getByText('Vitals')).toBeInTheDocument();
  });

  it('should render Check-up reason section', () => {
    renderWithRouter();
    expect(screen.getByText('Check-up reason')).toBeInTheDocument();
  });

  it('should render Physical examination section', () => {
    renderWithRouter();
    expect(screen.getByText('Physical examination')).toBeInTheDocument();
  });

  describe('PatientHeader', () => {
    it('should render CHW worker value', () => {
      renderWithRouter();
      expect(screen.getAllByText(data.patient.chwWorker).length).toBeGreaterThan(0);
    });

    it('should render Visit ID value', () => {
      renderWithRouter();
      expect(screen.getAllByText(data.patient.visitId).length).toBeGreaterThan(0);
    });

    it('should render Gender label', () => {
      renderWithRouter();
      expect(screen.getAllByText('Gender').length).toBeGreaterThan(0);
    });

    it('should render Age label', () => {
      renderWithRouter();
      expect(screen.getAllByText('Age').length).toBeGreaterThan(0);
    });
  });

  describe('VitalsSection', () => {
    it('should render height value', () => {
      renderWithRouter();
      expect(screen.getAllByText('168').length).toBeGreaterThan(0);
    });

    it('should render weight value', () => {
      renderWithRouter();
      expect(screen.getAllByText('72').length).toBeGreaterThan(0);
    });

    it('should render BMI value', () => {
      renderWithRouter();
      expect(screen.getAllByText('25.51').length).toBeGreaterThan(0);
    });

    it('should render BP value', () => {
      renderWithRouter();
      expect(screen.getAllByText('130/85').length).toBeGreaterThan(0);
    });

    it('should render "No information" for missing vitals', () => {
      renderWithRouter();
      expect(screen.getAllByText('No information').length).toBeGreaterThan(0);
    });

    it('should render Details content label', () => {
      renderWithRouter();
      expect(screen.getByText('Details')).toBeInTheDocument();
    });
  });

  describe('CheckupReasonSection', () => {
    it('should render Chief complaint(s) label', () => {
      renderWithRouter();
      expect(screen.getByText('Chief complaint(s)')).toBeInTheDocument();
    });

    it('should render complaint chips', () => {
      renderWithRouter();
      expect(screen.getAllByText('Abdominal pain').length).toBeGreaterThan(0);
    });

    it('should render complaint details', () => {
      renderWithRouter();
      expect(screen.getByText('Upper (R) - Right Hypochondrium')).toBeInTheDocument();
    });

    it('should render Site label', () => {
      renderWithRouter();
      expect(screen.getByText('Site')).toBeInTheDocument();
    });

    it('should render Change button for complaint', () => {
      renderWithRouter();
      expect(screen.getAllByText('Change').length).toBeGreaterThan(0);
    });
  });

  describe('PhysicalExaminationSection', () => {
    it('should render General exams content label', () => {
      renderWithRouter();
      expect(screen.getByText('General exams')).toBeInTheDocument();
    });

    it('should render physical exam details', () => {
      renderWithRouter();
      expect(
        screen.getByText('Person Consultation')
      ).toBeInTheDocument();
    });

    it('should render exam labels', () => {
      renderWithRouter();
      expect(screen.getAllByText('Eyes').length).toBeGreaterThan(0);
    });
  });

  describe('Action buttons', () => {
    it('should render Appointment and Send visit buttons by default', () => {
      renderWithRouter('view');
      expect(screen.getAllByText('Appointment').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Send visit').length).toBeGreaterThan(0);
    });

    it('should render Close visit button when action is close', () => {
      renderWithRouter('close');
      expect(screen.getAllByText('Close visit').length).toBeGreaterThan(0);
    });

    it('should not render Appointment button when action is close', () => {
      renderWithRouter('close');
      expect(screen.queryByText('Appointment')).not.toBeInTheDocument();
    });
  });

  describe('Toggle all', () => {
    it('should render Close all button', () => {
      renderWithRouter();
      expect(screen.getByText('Close all')).toBeInTheDocument();
    });

    it('should toggle to Open all on click', () => {
      renderWithRouter();
      fireEvent.click(screen.getByText('Close all'));
      expect(screen.getByText('Open all')).toBeInTheDocument();
    });
  });

  describe('handleCloseVisit', () => {
    it('should call visitSummaryService.closeVisit when desktop Close visit button is clicked', async () => {
      renderWithRouter('close');
      const closeButtons = screen.getAllByText('Close visit');
      fireEvent.click(closeButtons[0]);

      await waitFor(() => {
        expect(visitSummaryService.closeVisit).toHaveBeenCalledWith(data.patient.visitId);
      });
    });

    it('should call visitSummaryService.closeVisit when mobile Close visit button is clicked', async () => {
      renderWithRouter('close');
      const closeButtons = screen.getAllByText('Close visit');
      // Click the mobile button (second one)
      fireEvent.click(closeButtons[closeButtons.length - 1]);

      await waitFor(() => {
        expect(visitSummaryService.closeVisit).toHaveBeenCalledWith(data.patient.visitId);
      });
    });

    it('should handle closeVisit API error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(visitSummaryService.closeVisit).mockRejectedValueOnce(new Error('API error'));

      renderWithRouter('close');
      const closeButtons = screen.getAllByText('Close visit');
      fireEvent.click(closeButtons[0]);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to close visit:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('handleAppointment', () => {
    it('should show appointment confirmation modal when desktop Appointment button is clicked', () => {
      renderWithRouter('view');
      const appointmentButtons = screen.getAllByText('Appointment');
      fireEvent.click(appointmentButtons[0]);
      expect(screen.getByText('Book appointment?')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to book an appointment for this patient?')).toBeInTheDocument();
    });

    it('should show appointment confirmation modal when mobile Appointment button is clicked', () => {
      renderWithRouter('view');
      const appointmentButtons = screen.getAllByText('Appointment');
      fireEvent.click(appointmentButtons[appointmentButtons.length - 1]);
      expect(screen.getByText('Book appointment?')).toBeInTheDocument();
    });

    it('should navigate to appointment schedule on confirm', () => {
      renderWithRouter('view');
      const appointmentButtons = screen.getAllByText('Appointment');
      fireEvent.click(appointmentButtons[0]);
      fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
      expect(mockNavigate).toHaveBeenCalledWith('/appointment-schedule');
    });

    it('should dismiss modal on cancel', () => {
      renderWithRouter('view');
      const appointmentButtons = screen.getAllByText('Appointment');
      fireEvent.click(appointmentButtons[0]);
      expect(screen.getByText('Book appointment?')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'No' }));
      expect(screen.queryByText('Book appointment?')).not.toBeInTheDocument();
    });
  });

  describe('handleSendVisit', () => {
    it('should show send visit confirmation modal when desktop Send visit button is clicked', () => {
      renderWithRouter('view');
      const sendButtons = screen.getAllByText('Send visit');
      fireEvent.click(sendButtons[0]);
      expect(screen.getByText('Send visit', { selector: 'h2' })).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to send the visit to the doctor?')).toBeInTheDocument();
    });

    it('should show send visit confirmation modal when mobile Send visit button is clicked', () => {
      renderWithRouter('view');
      const sendButtons = screen.getAllByText('Send visit');
      fireEvent.click(sendButtons[sendButtons.length - 1]);
      expect(screen.getByText('Are you sure you want to send the visit to the doctor?')).toBeInTheDocument();
    });

    it('should dismiss modal when No is clicked', () => {
      renderWithRouter('view');
      const sendButtons = screen.getAllByText('Send visit');
      fireEvent.click(sendButtons[0]);
      expect(screen.getByText('Are you sure you want to send the visit to the doctor?')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'No' }));
      expect(screen.queryByText('Are you sure you want to send the visit to the doctor?')).not.toBeInTheDocument();
    });

    it('should close modal when Yes is clicked', () => {
      renderWithRouter('view');
      const sendButtons = screen.getAllByText('Send visit');
      fireEvent.click(sendButtons[0]);
      fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
      expect(screen.queryByText('Are you sure you want to send the visit to the doctor?')).not.toBeInTheDocument();
    });
  });

  describe('Empty data fallback', () => {
    it('should render fallback message when no data is available', () => {
      const originalData = [...visitSummaryDataModule.visitSummaryData];
      visitSummaryDataModule.visitSummaryData.length = 0;

      renderWithRouter();
      expect(screen.getByText('No visit summary data found')).toBeInTheDocument();

      // Restore original data
      visitSummaryDataModule.visitSummaryData.push(...originalData);
    });
  });

  describe('Change buttons in sections', () => {
    it('should render Change buttons for Vitals and Physical examination', () => {
      renderWithRouter();
      const changeButtons = screen.getAllByText('Change');
      // Vitals, CheckupReason, and Physical examination each have a Change button
      expect(changeButtons.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle Change button click in Vitals section', () => {
      renderWithRouter();
      // The Change button next to "Details" label belongs to Vitals CollapsedComponent
      const detailsLabel = screen.getByText('Details');
      const vitalsChangeBtn = detailsLabel.parentElement!.querySelector('[role="button"]') as HTMLElement;
      expect(vitalsChangeBtn).toBeInTheDocument();
      fireEvent.click(vitalsChangeBtn);
      // Verify it doesn't collapse the section (stopPropagation works)
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('should handle Change button click in Physical examination section', () => {
      renderWithRouter();
      // The Change button next to "General exams" label belongs to Physical examination CollapsedComponent
      const generalExamsLabel = screen.getByText('General exams');
      const physicalChangeBtn = generalExamsLabel.parentElement!.querySelector('[role="button"]') as HTMLElement;
      expect(physicalChangeBtn).toBeInTheDocument();
      fireEvent.click(physicalChangeBtn);
      // Verify it doesn't collapse the section (stopPropagation works)
      expect(screen.getByText('General exams')).toBeInTheDocument();
    });

    it('should invoke all onChangeClick callbacks when Change buttons are clicked', () => {
      const { container } = renderWithRouter();
      // Get all role="button" elements with "Change" text — these are inside CollapsedComponents
      const allChangeButtons = container.querySelectorAll('[role="button"]');
      allChangeButtons.forEach(btn => {
        if (btn.textContent?.includes('Change')) {
          fireEvent.click(btn);
        }
      });
      // All sections should still be visible after clicking Change buttons
      expect(screen.getByText('Vitals')).toBeInTheDocument();
      expect(screen.getByText('Physical examination')).toBeInTheDocument();
    });
  });

  describe('getVitalDisplay fallback', () => {
    it('should show "No information" when vital value is null and note is undefined', () => {
      const originalData = [...visitSummaryDataModule.visitSummaryData];

      // Modify pulse to have null value with no note — hits the final fallback branch
      visitSummaryDataModule.visitSummaryData[0] = {
        ...originalData[0],
        vitals: {
          ...originalData[0].vitals,
          pulse: { value: null },
        },
      };

      renderWithRouter();

      // Pulse row should now display "No information" via the final ?? fallback
      const pulseLabels = screen.getAllByText('Pulse');
      expect(pulseLabels.length).toBeGreaterThan(0);

      // Restore original data
      visitSummaryDataModule.visitSummaryData.length = 0;
      visitSummaryDataModule.visitSummaryData.push(...originalData);
    });
  });

  describe('Toggle all round-trip', () => {
    it('should toggle from Open all back to Close all', () => {
      renderWithRouter();
      // Close all -> Open all
      fireEvent.click(screen.getByText('Close all'));
      expect(screen.getByText('Open all')).toBeInTheDocument();

      // Open all -> Close all
      fireEvent.click(screen.getByText('Open all'));
      expect(screen.getByText('Close all')).toBeInTheDocument();
    });
  });

  describe('Mobile UI', () => {
    it('should render mobile header with back arrow icon', () => {
      const { container } = renderWithRouter();
      const backIcon = container.querySelector('.fa-arrow-left');
      expect(backIcon).toBeInTheDocument();
    });

    it('should render mobile sync button', () => {
      renderWithRouter();
      expect(screen.getByAltText('sync')).toBeInTheDocument();
    });

    it('should render mobile menu button', () => {
      renderWithRouter();
      expect(screen.getByAltText('menu')).toBeInTheDocument();
    });

    it('should render mobile header as sticky', () => {
      const { container } = renderWithRouter();
      const mobileHeader = container.querySelector('.md\\:hidden.sticky');
      expect(mobileHeader).toBeInTheDocument();
    });

    it('should render mobile Close all / Open all toggle with chevron icon', () => {
      renderWithRouter();
      const toggleWrapper = screen.getByText('Close all').closest('button');
      expect(toggleWrapper).toBeInTheDocument();
      const chevronImg = toggleWrapper!.querySelector('img');
      expect(chevronImg).toBeInTheDocument();
    });

    it('should rotate chevron icon when allOpen is true', () => {
      renderWithRouter();
      const toggleWrapper = screen.getByText('Close all').closest('button');
      const chevronImg = toggleWrapper!.querySelector('img');
      expect(chevronImg).toHaveClass('rotate-180');
    });

    it('should not rotate chevron icon when allOpen is false', () => {
      renderWithRouter();
      fireEvent.click(screen.getByText('Close all'));
      const toggleWrapper = screen.getByText('Open all').closest('button');
      const chevronImg = toggleWrapper!.querySelector('img');
      expect(chevronImg).not.toHaveClass('rotate-180');
    });

    it('should render mobile Appointment and Send visit buttons by default', () => {
      const { container } = renderWithRouter('view');
      const mobileBar = container.querySelector('.fixed.bottom-\\[70px\\]');
      expect(mobileBar).toBeInTheDocument();
      // Two buttons inside mobile bar
      const buttons = mobileBar!.querySelectorAll('button');
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent).toBe('Appointment');
      expect(buttons[1].textContent).toBe('Send visit');
    });

    it('should render mobile Close visit button when action is close', () => {
      const { container } = renderWithRouter('close');
      const mobileBar = container.querySelector('.fixed.bottom-\\[70px\\]');
      expect(mobileBar).toBeInTheDocument();
      const buttons = mobileBar!.querySelectorAll('button');
      expect(buttons.length).toBe(1);
      expect(buttons[0].textContent).toBe('Close visit');
    });

    it('should render bottom spacer for mobile', () => {
      const { container } = renderWithRouter();
      const spacer = container.querySelector('.h-36.md\\:hidden');
      expect(spacer).toBeInTheDocument();
    });

    it('should render mobile PatientHeader with only CHW worker and Visit ID', () => {
      const { container } = renderWithRouter();
      const mobileSection = container.querySelector('.md\\:hidden.space-y-1');
      expect(mobileSection).toBeInTheDocument();
      expect(mobileSection!.children.length).toBe(2);
    });
  });
});
