import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import VisitDetails from '../../../modules/visit-details/visit-details.component';
import { visitDetailsService } from '../../../modules/visit-details/visit-details.service';
import type { TransformedVisitDetails } from '../../../modules/visit-details/visit-details.types';
import { BreadcrumbProvider } from '../../../context/BreadcrumbContext';

/* ── Mocks ── */

const mockNavigate = vi.fn();
const mockShowConfirmModal = vi.fn();
const mockShowToast = vi.fn();

vi.mock('../../../services/toast', () => ({
  showToast: (...args: unknown[]) => mockShowToast(...args),
}));

const {
  mockGetVisitPrescriptionData,
  mockPrintVisitPrescriptionPdf,
  mockShareVisitPrescriptionPdf,
} = vi.hoisted(() => ({
  mockGetVisitPrescriptionData: vi.fn(),
  mockPrintVisitPrescriptionPdf: vi.fn(),
  mockShareVisitPrescriptionPdf: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../components/modal/global-modal-context', () => ({
  useGlobalModal: () => ({
    showConfirmModal: mockShowConfirmModal,
    showVitalConfirmationModal: vi.fn(),
    closeModal: vi.fn(),
  }),
}));

vi.mock('../../../modules/visit-details/visit-details.service', () => ({
  visitDetailsService: {
    getVisitDetails: vi.fn(),
    endVisit: vi.fn(),
  },
}));

vi.mock('../../../services/visit-prescription.service', () => ({
  getVisitPrescriptionData: mockGetVisitPrescriptionData,
}));

vi.mock('../../../utils/visit-prescription-pdf', () => ({
  printVisitPrescriptionPdf: mockPrintVisitPrescriptionPdf,
  shareVisitPrescriptionPdf: mockShareVisitPrescriptionPdf,
}));

// SVG icon mocks
vi.mock('../../../assets/icons/appointment/icon-patient-image.svg', () => ({ default: 'icon-patient-image.svg' }));
vi.mock('../../../assets/icons/appointment/green-field-apm-phone-icon.svg', () => ({ default: 'icon-phone.svg' }));
vi.mock('../../../assets/icons/appointment/icon-apm-calendar.svg', () => ({ default: 'icon-calendar.svg' }));
vi.mock('../../../assets/icons/appointment/icon-apm-clock-time.svg', () => ({ default: 'icon-clock.svg' }));
vi.mock('../../../assets/icons/appointment/violet-field-apm-general-physician.svg', () => ({ default: 'icon-gp.svg' }));
vi.mock('../../../assets/icons/appointment/violet-field-apm-visit-summary.svg', () => ({ default: 'icon-visit-summary.svg' }));
vi.mock('../../../assets/icons/appointment/icon-apm-angle-small-right.svg', () => ({ default: 'icon-angle-right.svg' }));
vi.mock('../../../assets/icons/appointment/violet-field-apm-prescription.svg', () => ({ default: 'icon-prescription.svg' }));
vi.mock('../../../assets/icons/appointment/icons-patient-recevied.svg', () => ({ default: 'icon-prescription-plain.svg' }));
vi.mock('../../../assets/icons/icon-visit-summery.svg', () => ({ default: 'icon-visit-summary-icon.svg' }));
vi.mock('../../../assets/icons/icon-print.svg', () => ({ default: 'icon-print.svg' }));
vi.mock('../../../assets/icons/icon-share.svg', () => ({ default: 'icon-share.svg' }));
vi.mock('../../../assets/icons/icon-chat.svg', () => ({ default: 'icon-chat.svg' }));

/* ── Helpers ── */

function makeVisitData(overrides?: Partial<TransformedVisitDetails>): TransformedVisitDetails {
  return {
    visitUuid: 'visit-uuid-12345678',
    visitId: '12345678',
    patientName: 'John Doe',
    patientUuid: 'patient-uuid',
    gender: 'Male',
    age: 30,
    patientIdentifier: 'ABC-123',
    chiefComplaint: 'Fever',
    chiefComplaintHtml: '<b>Fever</b>: <br/>• Duration - 3 days.<br/>• Severity - Moderate.',
    visitDate: '27 January 2026',
    visitTime: '10:31 AM',
    doctorName: 'Dr. Smith',
    doctorSpeciality: 'General Physician',
    visitStatus: 'Active',
    prescriptionDate: '28 January 2026',
    followUpDate: '3 February 2026',
    phoneNumber: '9876543210',
    ...overrides,
  };
}

const renderWithRouter = (visitId = 'test-visit-uuid') => {
  return render(
    <MemoryRouter initialEntries={[`/visit-details/${visitId}`]}>
      <BreadcrumbProvider>
        <Routes>
          <Route path="/visit-details/:visitId" element={<VisitDetails />} />
        </Routes>
      </BreadcrumbProvider>
    </MemoryRouter>
  );
};

const renderWithoutVisitId = () => {
  return render(
    <MemoryRouter initialEntries={['/visit-details']}>
      <BreadcrumbProvider>
        <Routes>
          <Route path="/visit-details" element={<VisitDetails />} />
        </Routes>
      </BreadcrumbProvider>
    </MemoryRouter>
  );
};

/* ── Tests ── */

describe('VisitDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ── Loading state ── */

  describe('loading state', () => {
    it('should show loading message initially', () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockReturnValue(new Promise(() => {}));
      renderWithRouter();
      expect(screen.getByText('Loading visit details...')).toBeInTheDocument();
    });

    it('should show loading when visitId is absent', () => {
      renderWithoutVisitId();
      expect(screen.getByText('Loading visit details...')).toBeInTheDocument();
      expect(visitDetailsService.getVisitDetails).not.toHaveBeenCalled();
    });
  });

  /* ── Error state ── */

  describe('error state', () => {
    it('should show error message on API failure', async () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockRejectedValue(new Error('Network error'));
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Failed to load visit details')).toBeInTheDocument();
      });
    });

    it('should show "Visit not found" when data is null', async () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(null as unknown as TransformedVisitDetails);
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('Visit not found')).toBeInTheDocument();
      });
    });
  });

  /* ── Success state ── */

  describe('success state', () => {
    const mockData = makeVisitData();

    beforeEach(() => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(mockData);
    });

    it('should render without crashing', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('Visit details')).toBeInTheDocument();
      });
    });

    it('should not render "Back to Dashboard" button (removed in favor of breadcrumbs)', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('Visit details')).toBeInTheDocument();
      });
      expect(screen.queryByText('Back to Dashboard')).not.toBeInTheDocument();
    });
  });

  /* ── PatientInfoCard ── */

  describe('PatientInfoCard', () => {
    beforeEach(() => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(makeVisitData());
    });

    it('should render patient name, gender, age and identifier', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
        expect(screen.getByText(/Male, 30 years/)).toBeInTheDocument();
        expect(screen.getByText('ID: ABC-123')).toBeInTheDocument();
      });
    });

    it('should render call and chat buttons', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByLabelText('Call patient')).toBeInTheDocument();
        expect(screen.getByLabelText('Message patient')).toBeInTheDocument();
      });
    });

    it('should handle call button click', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByLabelText('Call patient')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText('Call patient'));
      // TODO handler - just verifying no crash
    });

    it('should handle chat button click', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByLabelText('Message patient')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByLabelText('Message patient'));
      // TODO handler - just verifying no crash
    });
  });

  /* ── ChiefComplaintSection ── */

  describe('ChiefComplaintSection', () => {
    beforeEach(() => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(makeVisitData());
    });

    it('should render chief complaint', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText(/Chief Complaint: Fever/)).toBeInTheDocument();
      });
    });

    it('should render visit ID', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('Visit ID: 12345678')).toBeInTheDocument();
      });
    });

    it('should render visit date and time', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('27 January 2026')).toBeInTheDocument();
        expect(screen.getByText('10:31 AM')).toBeInTheDocument();
      });
    });

    it('should render doctor speciality', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('General Physician')).toBeInTheDocument();
        expect(screen.getByText("Doctor's speciality")).toBeInTheDocument();
      });
    });

    it('should render chief complaint HTML details', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText(/Duration - 3 days/)).toBeInTheDocument();
        expect(screen.getByText(/Severity - Moderate/)).toBeInTheDocument();
      });
    });

    it('should not render HTML details div when chiefComplaintHtml is empty', async () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(
        makeVisitData({ chiefComplaintHtml: '' })
      );
      const { container } = renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText(/Chief Complaint: Fever/)).toBeInTheDocument();
      });
      const htmlDiv = container.querySelector('.leading-relaxed');
      expect(htmlDiv).not.toBeInTheDocument();
    });

    it('should render bold text from HTML chief complaint', async () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(
        makeVisitData({ chiefComplaintHtml: '<b>Cough</b>: <br/>• Dry cough' })
      );
      const { container } = renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText(/Chief Complaint:/)).toBeInTheDocument();
      });
      const htmlDiv = container.querySelector('.leading-relaxed');
      expect(htmlDiv).toBeInTheDocument();
      expect(htmlDiv!.innerHTML).toContain('<b>Cough</b>');
    });
  });

  /* ── NavigableRow ── */

  describe('NavigableRow', () => {
    it('should render visit summary row without subtitle', async () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(makeVisitData({ prescriptionDate: null }));
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('Visit summary')).toBeInTheDocument();
      });
    });

    it('should render prescription row with subtitle when prescriptionDate exists', async () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(makeVisitData());
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('Prescription')).toBeInTheDocument();
        expect(screen.getByText('Received 28 January 2026')).toBeInTheDocument();
      });
    });

    it('should render prescription row without subtitle when prescriptionDate is null', async () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(makeVisitData({ prescriptionDate: null }));
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('Prescription')).toBeInTheDocument();
      });
      expect(screen.queryByText(/Received/)).not.toBeInTheDocument();
    });

    it('should navigate to visit summary on visit summary row click', async () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(makeVisitData());
      renderWithRouter('my-visit-uuid');
      await waitFor(() => {
        expect(screen.getByText('Visit summary')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Visit summary'));
      expect(mockNavigate).toHaveBeenCalledWith('/visit-summary/my-visit-uuid', { state: { fromLabel: undefined, fromPath: undefined } });
    });

    it('should navigate to prescription detail on prescription row click', async () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(makeVisitData());
      renderWithRouter('my-visit-uuid');
      await waitFor(() => {
        expect(screen.getByText('Prescription')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Prescription'));
      expect(mockNavigate).toHaveBeenCalledWith('/prescription-detail/my-visit-uuid', { state: { fromLabel: undefined, fromPath: undefined } });
    });
  });

  /* ── FollowUpSection ── */

  describe('FollowUpSection', () => {
    it('should render follow-up date and end visit button when active with followUpDate', async () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(
        makeVisitData({ visitStatus: 'Active', followUpDate: '3 February 2026' })
      );
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('Follow up on 3 February 2026')).toBeInTheDocument();
        expect(screen.getByText(/follow-up time has arrived/)).toBeInTheDocument();
        expect(screen.getByText('End visit')).toBeInTheDocument();
      });
    });

    it('should render only end visit button when active without followUpDate', async () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(
        makeVisitData({ visitStatus: 'Active', followUpDate: null })
      );
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('End visit')).toBeInTheDocument();
      });
      expect(screen.queryByText(/Follow up on/)).not.toBeInTheDocument();
    });

    it('should not render FollowUpSection when visit is Closed', async () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(
        makeVisitData({ visitStatus: 'Closed' })
      );
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('Visit details')).toBeInTheDocument();
      });
      expect(screen.queryByText('End visit')).not.toBeInTheDocument();
    });
  });

  /* ── VisitStatusCard ── */

  describe('VisitStatusCard', () => {
    it('should render Active status', async () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(makeVisitData({ visitStatus: 'Active' }));
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('Visit Status')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('should render Closed status', async () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(makeVisitData({ visitStatus: 'Closed' }));
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('Closed')).toBeInTheDocument();
      });
    });
  });

  /* ── QuickActionsCard ── */

  describe('QuickActionsCard', () => {
    beforeEach(() => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(makeVisitData());
      mockNavigate.mockClear();
      mockShowToast.mockClear();
      mockGetVisitPrescriptionData.mockReset();
      mockPrintVisitPrescriptionPdf.mockReset();
      mockShareVisitPrescriptionPdf.mockReset();
    });

    it('should render all quick action buttons', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('Quick Actions')).toBeInTheDocument();
        expect(screen.getByText('View Prescription')).toBeInTheDocument();
        expect(screen.getByText('Print')).toBeInTheDocument();
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
    });

    it('should navigate to the prescription detail page when View Prescription is clicked', async () => {
      renderWithRouter('test-visit-uuid');
      await waitFor(() => {
        expect(screen.getByText('View Prescription')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('View Prescription'));
      expect(mockNavigate).toHaveBeenCalledWith('/prescription-detail/test-visit-uuid', {
        state: { fromLabel: undefined, fromPath: undefined },
      });
    });

    it('should fetch prescription data and call printVisitPrescriptionPdf when Print is clicked', async () => {
      const pdfData = { visitUuid: 'test-visit-uuid', patientName: 'Test' };
      mockGetVisitPrescriptionData.mockResolvedValue(pdfData);
      mockPrintVisitPrescriptionPdf.mockResolvedValue(undefined);
      renderWithRouter('test-visit-uuid');
      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Print'));
      await waitFor(() => {
        expect(mockGetVisitPrescriptionData).toHaveBeenCalledWith('test-visit-uuid');
      });
      await waitFor(() => {
        expect(mockPrintVisitPrescriptionPdf).toHaveBeenCalledWith(pdfData);
      });
    });

    it('should disable Print and Share while the PDF is being prepared, then re-enable them', async () => {
      let resolvePdf: (value: unknown) => void = () => {};
      mockGetVisitPrescriptionData.mockReturnValue(
        new Promise(resolve => {
          resolvePdf = resolve;
        })
      );
      mockPrintVisitPrescriptionPdf.mockResolvedValue(undefined);
      renderWithRouter('test-visit-uuid');
      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Print'));

      const printingButton = await screen.findByRole('button', {
        name: /Printing\.\.\./,
      });
      expect(printingButton).toBeDisabled();
      expect(screen.getByRole('button', { name: /Share/ })).toBeDisabled();

      resolvePdf({ visitUuid: 'test-visit-uuid' });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Print$/ })).toBeEnabled();
      });
      expect(screen.getByRole('button', { name: /Share/ })).toBeEnabled();
    });

    it('should log a generic error, show an error toast, and stop loading when printing fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetVisitPrescriptionData.mockRejectedValue(new Error('boom'));
      renderWithRouter('test-visit-uuid');
      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Print'));
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to print prescription PDF');
      });
      // The raw error object is never logged (may carry patient data/tokens).
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.anything(), expect.any(Error));
      expect(mockShowToast).toHaveBeenCalledWith(
        'Error',
        'Failed to print the prescription. Please try again.',
        'error'
      );
      expect(mockPrintVisitPrescriptionPdf).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Print$/ })).toBeEnabled();
      });
      consoleSpy.mockRestore();
    });

    it('should not update state after the component unmounts while printing', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let resolvePdf: (value: unknown) => void = () => {};
      mockGetVisitPrescriptionData.mockReturnValue(
        new Promise(resolve => {
          resolvePdf = resolve;
        })
      );
      mockPrintVisitPrescriptionPdf.mockResolvedValue(undefined);
      const { unmount } = renderWithRouter('test-visit-uuid');
      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Print'));
      await waitFor(() => {
        expect(mockGetVisitPrescriptionData).toHaveBeenCalled();
      });

      unmount();
      resolvePdf({ visitUuid: 'test-visit-uuid' });
      await Promise.resolve();
      await Promise.resolve();

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('unmounted')
      );
      consoleSpy.mockRestore();
    });

    it('should open the WhatsApp share modal when Share is clicked', async () => {
      renderWithRouter('test-visit-uuid');
      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Share'));
      await waitFor(() => {
        expect(
          screen.getByText('Enter the mobile number to which you want to share the prescription.')
        ).toBeInTheDocument();
      });
    });

    it('should close the WhatsApp share modal on backdrop click', async () => {
      renderWithRouter('test-visit-uuid');
      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Share'));
      const modalText = 'Enter the mobile number to which you want to share the prescription.';
      await waitFor(() => {
        expect(screen.getByText(modalText)).toBeInTheDocument();
      });
      const backdrop = screen.getByText(modalText).closest('.fixed');
      fireEvent.click(backdrop!);
      await waitFor(() => {
        expect(screen.queryByText(modalText)).not.toBeInTheDocument();
      });
    });

    it('should fetch prescription data and call shareVisitPrescriptionPdf with the phone number when share is submitted', async () => {
      const pdfData = { visitUuid: 'test-visit-uuid', patientName: 'Test' };
      mockGetVisitPrescriptionData.mockResolvedValue(pdfData);
      mockShareVisitPrescriptionPdf.mockResolvedValue(undefined);
      renderWithRouter('test-visit-uuid');
      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Share'));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('+918179987770')).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText('+918179987770'), {
        target: { value: '+919876543210' },
      });
      const shareButtons = screen.getAllByRole('button', { name: /share/i });
      fireEvent.click(shareButtons[shareButtons.length - 1]);
      await waitFor(() => {
        expect(mockGetVisitPrescriptionData).toHaveBeenCalledWith('test-visit-uuid');
      });
      await waitFor(() => {
        expect(mockShareVisitPrescriptionPdf).toHaveBeenCalledWith(pdfData, '919876543210');
      });
    });

    it('should log a generic error, show an error toast, and stop loading when sharing fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetVisitPrescriptionData.mockRejectedValue(new Error('boom'));
      renderWithRouter('test-visit-uuid');
      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Share'));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('+918179987770')).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText('+918179987770'), {
        target: { value: '+919876543210' },
      });
      const shareButtons = screen.getAllByRole('button', { name: /share/i });
      fireEvent.click(shareButtons[shareButtons.length - 1]);
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to share prescription PDF');
      });
      // The raw error object is never logged (may carry patient data/tokens).
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.anything(), expect.any(Error));
      expect(mockShowToast).toHaveBeenCalledWith(
        'Error',
        'Failed to share the prescription. Please try again.',
        'error'
      );
      expect(mockShareVisitPrescriptionPdf).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Share/ })).toBeEnabled();
      });
      consoleSpy.mockRestore();
    });

    it('should not update state after the component unmounts while sharing', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let resolvePdf: (value: unknown) => void = () => {};
      mockGetVisitPrescriptionData.mockReturnValue(
        new Promise(resolve => {
          resolvePdf = resolve;
        })
      );
      mockShareVisitPrescriptionPdf.mockResolvedValue(undefined);
      const { unmount } = renderWithRouter('test-visit-uuid');
      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Share'));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('+918179987770')).toBeInTheDocument();
      });
      fireEvent.change(screen.getByPlaceholderText('+918179987770'), {
        target: { value: '+919876543210' },
      });
      const shareButtons = screen.getAllByRole('button', { name: /share/i });
      fireEvent.click(shareButtons[shareButtons.length - 1]);
      await waitFor(() => {
        expect(mockGetVisitPrescriptionData).toHaveBeenCalled();
      });

      unmount();
      resolvePdf({ visitUuid: 'test-visit-uuid' });
      await Promise.resolve();
      await Promise.resolve();

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('unmounted')
      );
      consoleSpy.mockRestore();
    });
  });

  /* ── handleEndVisit ── */

  describe('handleEndVisit', () => {
    it('should call showConfirmModal when End visit is clicked', async () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(makeVisitData());
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('End visit')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('End visit'));

      expect(mockShowConfirmModal).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'End visit?',
          description: 'Are you sure you want to end this visit? This action cannot be undone.',
          confirmText: 'Yes, end visit',
          cancelText: 'Cancel',
          type: 'confirm',
          open: true,
        })
      );
    });

    it('should update status to Closed on successful end visit', async () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(makeVisitData());
      vi.mocked(visitDetailsService.endVisit).mockResolvedValue({});
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('End visit')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('End visit'));

      const { onConfirm } = mockShowConfirmModal.mock.calls[0][0];
      await onConfirm();

      await waitFor(() => {
        expect(screen.getByText('Closed')).toBeInTheDocument();
      });
      expect(screen.queryByText('End visit')).not.toBeInTheDocument();
    });

    it('should handle end visit API error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(makeVisitData());
      vi.mocked(visitDetailsService.endVisit).mockRejectedValue(new Error('API error'));
      renderWithRouter();

      await waitFor(() => {
        expect(screen.getByText('End visit')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('End visit'));

      const { onConfirm } = mockShowConfirmModal.mock.calls[0][0];
      await onConfirm();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to end visit:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  /* ── API call ── */

  describe('API integration', () => {
    it('should call getVisitDetails with the visitId from URL params', async () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(makeVisitData());
      renderWithRouter('my-visit-123');

      await waitFor(() => {
        expect(visitDetailsService.getVisitDetails).toHaveBeenCalledWith('my-visit-123');
      });
    });
  });

  /* ── Breadcrumb with location state ── */

  describe('breadcrumb with navigation state', () => {
    it('should pass fromLabel and fromPath to child navigation when location.state is present', async () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(makeVisitData());
      render(
        <MemoryRouter initialEntries={[{ pathname: '/visit-details/my-visit-uuid', state: { fromLabel: 'Open Visits', fromPath: '/open-visits' } }]}>
          <BreadcrumbProvider>
            <Routes>
              <Route path="/visit-details/:visitId" element={<VisitDetails />} />
            </Routes>
          </BreadcrumbProvider>
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText('Visit summary')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Visit summary'));
      expect(mockNavigate).toHaveBeenCalledWith('/visit-summary/my-visit-uuid', { state: { fromLabel: 'Open Visits', fromPath: '/open-visits' } });
    });
  });
});
