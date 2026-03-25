import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import VisitDetails from '../../../modules/visit-details/visit-details.component';
import { visitDetailsService } from '../../../modules/visit-details/visit-details.service';
import type { TransformedVisitDetails } from '../../../modules/visit-details/visit-details.types';

/* ── Mocks ── */

const mockNavigate = vi.fn();
const mockShowConfirmModal = vi.fn();

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

// SVG icon mocks
vi.mock('../../../assets/icons/appiontment/icon-patient-image.svg', () => ({ default: 'icon-patient-image.svg' }));
vi.mock('../../../assets/icons/appiontment/green-field-apm-phone-icon.svg', () => ({ default: 'icon-phone.svg' }));
vi.mock('../../../assets/icons/appiontment/icon-apm-calendar.svg', () => ({ default: 'icon-calendar.svg' }));
vi.mock('../../../assets/icons/appiontment/icon-apm-clock-time.svg', () => ({ default: 'icon-clock.svg' }));
vi.mock('../../../assets/icons/appiontment/violet-field-apm-general-physician.svg', () => ({ default: 'icon-gp.svg' }));
vi.mock('../../../assets/icons/appiontment/violet-field-apm-visit-summary.svg', () => ({ default: 'icon-visit-summary.svg' }));
vi.mock('../../../assets/icons/appiontment/icon-apm-angle-small-right.svg', () => ({ default: 'icon-angle-right.svg' }));
vi.mock('../../../assets/icons/appiontment/violet-field-apm-prescription.svg', () => ({ default: 'icon-prescription.svg' }));
vi.mock('../../../assets/icons/appiontment/icons-patient-recevied.svg', () => ({ default: 'icon-prescription-plain.svg' }));
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
      <Routes>
        <Route path="/visit-details/:visitId" element={<VisitDetails />} />
      </Routes>
    </MemoryRouter>
  );
};

const renderWithoutVisitId = () => {
  return render(
    <MemoryRouter initialEntries={['/visit-details']}>
      <Routes>
        <Route path="/visit-details" element={<VisitDetails />} />
      </Routes>
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

    it('should render "Back to Dashboard" button', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
      });
    });

    it('should navigate back on "Back to Dashboard" click', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Back to Dashboard'));
      expect(mockNavigate).toHaveBeenCalledWith(-1);
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

    it('should navigate to visit summary on row click', async () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(makeVisitData());
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('Visit summary')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Visit summary'));
      expect(mockNavigate).toHaveBeenCalledWith('/visit-summary');
    });

    it('should navigate to prescription detail on prescription row click', async () => {
      vi.mocked(visitDetailsService.getVisitDetails).mockResolvedValue(makeVisitData());
      renderWithRouter('my-visit-uuid');
      await waitFor(() => {
        expect(screen.getByText('Prescription')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Prescription'));
      expect(mockNavigate).toHaveBeenCalledWith('/prescription-detail/my-visit-uuid');
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

    it('should handle View Prescription button click', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('View Prescription')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('View Prescription'));
    });

    it('should handle Print button click', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Print'));
    });

    it('should handle Share button click', async () => {
      renderWithRouter();
      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Share'));
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
});
