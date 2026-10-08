import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TabClosedError } from '../../../utils/pdf-window';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import type { PrescriptionData } from '../../../assets/data/prescription-detail.data';

/* ── Hoisted mock data ── */

const {
  mockGetPrescriptionData,
  mockNavigate,
  mockGetVisitPrescriptionData,
  mockDownloadPdf,
  mockPrintPdf,
  mockSharePdf,
  mockOpenPendingWindow,
  mockShowToast,
} = vi.hoisted(() => ({
  mockOpenPendingWindow: vi.fn(),
  mockShowToast: vi.fn(),
  mockGetPrescriptionData: vi.fn(),
  mockNavigate: vi.fn(),
  mockGetVisitPrescriptionData: vi.fn(),
  mockDownloadPdf: vi.fn(),
  mockPrintPdf: vi.fn(),
  mockSharePdf: vi.fn(),
}));

/* ── Mocks ── */

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../modules/prescription-detail/prescription-detail.service', () => ({
  prescriptionDetailService: {
    getPrescriptionData: mockGetPrescriptionData,
  },
}));

vi.mock('../../../services/visit-prescription.service', () => ({
  getVisitPrescriptionData: mockGetVisitPrescriptionData,
}));

vi.mock('../../../services/toast', () => ({
  showToast: mockShowToast,
}));

vi.mock('../../../utils/visit-prescription-pdf', () => ({
  openPendingWindow: mockOpenPendingWindow,
  downloadVisitPrescriptionPdf: mockDownloadPdf,
  printVisitPrescriptionPdf: mockPrintPdf,
  shareVisitPrescriptionPdf: mockSharePdf,
}));

// SVG icon mocks
vi.mock('../../../assets/icons/appointment/icon-patient-image.svg', () => ({ default: 'icon-patient.svg' }));
vi.mock('../../../assets/icons/icon-advice.svg', () => ({ default: 'icon-advice.svg' }));
vi.mock('../../../assets/icons/icon-download.svg', () => ({ default: 'icon-download.svg' }));
vi.mock('../../../assets/icons/icon-followup-circle.svg', () => ({ default: 'icon-followup.svg' }));
vi.mock('../../../assets/icons/icon-medications-circle.svg', () => ({ default: 'icon-medications.svg' }));
vi.mock('../../../assets/icons/icon-print-white.svg', () => ({ default: 'icon-print-white.svg' }));
vi.mock('../../../assets/icons/icon-referral-circle.svg', () => ({ default: 'icon-referral.svg' }));
vi.mock('../../../assets/icons/icon-share-white.svg', () => ({ default: 'icon-share-white.svg' }));
vi.mock('../../../assets/icons/icon-back-arrow.svg', () => ({ default: 'icon-back-arrow.svg' }));
vi.mock('../../../assets/icons/visit-reason.svg', () => ({ default: 'icon-diagnosis.svg' }));
vi.mock('../../../assets/icons/vitals.svg', () => ({ default: 'icon-tests.svg' }));

/* ── Helpers ── */

import PrescriptionDetail from '../../../modules/prescription-detail/prescription-detail.component';
import { BreadcrumbProvider } from '../../../context/BreadcrumbContext';

const fullData: PrescriptionData = {
  patientName: 'Test S',
  age: 19,
  gender: 'Male',
  patientIdentifier: '163KG-9',
  doctorName: 'Rohith M S',
  doctorQualification: 'MBBS, MD',
  visitDate: '27 January 2026, 10:31 AM',
  diagnosis: 'Infestation by Sarcoptes Scabiei',
  medications: [
    { name: 'Ambroxol Drops', strength: '10 mg', frequency: '3 times/day', duration: '7 days' },
    { name: 'Paracetamol', strength: '250 mg', frequency: 'As needed', duration: '5 days' },
  ],
  advice: ['Drink plenty of water', 'Take rest'],
  testsRecommended: ['LFT', 'CBC'],
  referredSpecialist: 'CHO – Community Health Officer',
  followUpDate: '3 February 2026',
};

const renderComponent = (visitId = 'visit-123') =>
  render(
    <MemoryRouter initialEntries={[`/prescription-detail/${visitId}`]}>
      <BreadcrumbProvider>
        <Routes>
          <Route path="/prescription-detail/:visitId" element={<PrescriptionDetail />} />
        </Routes>
      </BreadcrumbProvider>
    </MemoryRouter>
  );

const renderWithLocationState = (visitId = 'visit-123') =>
  render(
    <MemoryRouter initialEntries={[{ pathname: `/prescription-detail/${visitId}`, state: { fromLabel: 'Open Visits', fromPath: '/open-visits' } }]}>
      <BreadcrumbProvider>
        <Routes>
          <Route path="/prescription-detail/:visitId" element={<PrescriptionDetail />} />
        </Routes>
      </BreadcrumbProvider>
    </MemoryRouter>
  );

/* ── Tests ── */

const POPUP_BLOCKED = 'Your browser blocked the pop-up. Allow pop-ups for this site and try again.';
const TAB_CLOSED = 'The tab was closed before the prescription was ready. Please try again.';
const SHARE_FAILED = 'Failed to share the prescription. Please try again.';
const anyWindow = expect.objectContaining({ close: expect.any(Function) });
let openedWindows: { close: ReturnType<typeof vi.fn>; closed: boolean }[] = [];

describe('PrescriptionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPrescriptionData.mockResolvedValue({ ...fullData });
    // every click opens a fresh fake tab, like window.open('', '_blank')
    openedWindows = [];
    mockOpenPendingWindow.mockReset();
    mockOpenPendingWindow.mockImplementation(() => {
      const win = { close: vi.fn(), closed: false };
      openedWindows.push(win);
      return win;
    });
  });

  /* ── Breadcrumb with navigation state ── */

  it('should render with breadcrumb navigation state (fromLabel and fromPath)', async () => {
    renderWithLocationState();
    await waitFor(() => {
      expect(screen.getByText('Test S')).toBeInTheDocument();
    });
  });

  /* ── Loading state ── */

  it('should show loading state initially', () => {
    mockGetPrescriptionData.mockReturnValue(new Promise(() => {}));
    renderComponent();
    expect(screen.getByText('Loading prescription details...')).toBeInTheDocument();
  });

  /* ── Error state ── */

  it('should show error message when API fails', async () => {
    mockGetPrescriptionData.mockRejectedValue(new Error('Network error'));
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Failed to load prescription details')).toBeInTheDocument();
    });
  });

  /* ── Full data rendering ── */

  it('should render without crashing', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Test S')).toBeInTheDocument();
    });
  });

  it('should call service with visitId from URL params', async () => {
    renderComponent('abc-456');
    await waitFor(() => {
      expect(mockGetPrescriptionData).toHaveBeenCalledWith('abc-456');
    });
  });

  it('should not render "Back to Dashboard" button (removed in favor of breadcrumbs)', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Test S')).toBeInTheDocument();
    });
    expect(screen.queryByText('Back to Dashboard')).not.toBeInTheDocument();
  });

  /* ── PrescriptionHeader ── */

  describe('PrescriptionHeader', () => {
    it('should render patient info', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Test S')).toBeInTheDocument();
      });
      expect(screen.getByText('Age: 19')).toBeInTheDocument();
      expect(screen.getByText('Male')).toBeInTheDocument();
      expect(screen.getByText('ID: 163KG-9')).toBeInTheDocument();
    });

    it('should render doctor info with qualification', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Dr. Rohith M S')).toBeInTheDocument();
      });
      expect(screen.getByText('Qualification: MBBS, MD')).toBeInTheDocument();
    });

    it('should render visit date', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Visit: 27 January 2026, 10:31 AM')).toBeInTheDocument();
      });
    });

    it('should not render doctor section when doctorName is empty', async () => {
      mockGetPrescriptionData.mockResolvedValue({ ...fullData, doctorName: '' });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Test S')).toBeInTheDocument();
      });
      expect(screen.queryByText(/Dr\./)).not.toBeInTheDocument();
    });

    it('should not render qualification when doctorQualification is empty', async () => {
      mockGetPrescriptionData.mockResolvedValue({ ...fullData, doctorQualification: '' });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Dr. Rohith M S')).toBeInTheDocument();
      });
      expect(screen.queryByText(/Qualification/)).not.toBeInTheDocument();
    });

    it('should render Print, Share, and Download PDF buttons', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument();
      });
      expect(screen.getByText('Share')).toBeInTheDocument();
      expect(screen.getByText('Download PDF')).toBeInTheDocument();
    });

    it('should call printVisitPrescriptionPdf when Print is clicked', async () => {
      const pdfData = { visitUuid: 'visit-123', patientName: 'Test' };
      mockGetVisitPrescriptionData.mockResolvedValue(pdfData);
      mockPrintPdf.mockResolvedValue(undefined);
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Print'));
      await waitFor(() => {
        expect(mockGetVisitPrescriptionData).toHaveBeenCalledWith('visit-123', expect.any(AbortSignal));
      });
      await waitFor(() => {
        expect(mockPrintPdf).toHaveBeenCalledWith(pdfData, expect.any(AbortSignal), anyWindow);
      });
    });

    it('should open WhatsApp share modal when Share is clicked', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Share'));
      await waitFor(() => {
        expect(screen.getByText('Enter the mobile number to which you want to share the prescription.')).toBeInTheDocument();
      });
    });

    it('should close WhatsApp share modal on backdrop click', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Share'));
      const modalText = 'Enter the mobile number to which you want to share the prescription.';
      await waitFor(() => {
        expect(screen.getByText(modalText)).toBeInTheDocument();
      });
      // Click the backdrop overlay
      const backdrop = screen.getByText(modalText).closest('.fixed');
      fireEvent.click(backdrop!);
      await waitFor(() => {
        expect(screen.queryByText(modalText)).not.toBeInTheDocument();
      });
    });

    it('should show validation error when phone number is too short', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Share'));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('+918179987770')).toBeInTheDocument();
      });
      // Enter short number (valid country code but less than 10 digits)
      const phoneInput = screen.getByPlaceholderText('+918179987770');
      fireEvent.change(phoneInput, { target: { value: '+9112345' } });
      // Click the Share button inside the modal
      const shareButtons = screen.getAllByRole('button', { name: /share/i });
      fireEvent.click(shareButtons[shareButtons.length - 1]);
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid 10-digit phone number')).toBeInTheDocument();
      });
    });

    it('should call shareVisitPrescriptionPdf with phone number when modal share is submitted', async () => {
      const pdfData = { visitUuid: 'visit-123', patientName: 'Test' };
      mockGetVisitPrescriptionData.mockResolvedValue(pdfData);
      mockSharePdf.mockResolvedValue(undefined);
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Share'));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('+918179987770')).toBeInTheDocument();
      });
      // Enter full phone number with country code
      const phoneInput = screen.getByPlaceholderText('+918179987770');
      fireEvent.change(phoneInput, { target: { value: '+919876543210' } });
      // Click Share button in modal
      const shareButtons = screen.getAllByRole('button', { name: /share/i });
      fireEvent.click(shareButtons[shareButtons.length - 1]);
      await waitFor(() => {
        expect(mockGetVisitPrescriptionData).toHaveBeenCalledWith('visit-123', expect.any(AbortSignal));
      });
      await waitFor(() => {
        expect(mockSharePdf).toHaveBeenCalledWith(pdfData, '919876543210', expect.any(AbortSignal), anyWindow);
      });
      // a successful share closes the modal
      await waitFor(() => {
        expect(screen.queryByPlaceholderText('+918179987770')).not.toBeInTheDocument();
      });
    });

    const submitShare = async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Share$/ }));
      const input = await screen.findByPlaceholderText('+918179987770');
      fireEvent.change(input, { target: { value: '+919876543210' } });
      const shareButtons = screen.getAllByRole('button', { name: /share/i });
      fireEvent.click(shareButtons[shareButtons.length - 1]);
    };

    it('should open the print tab in the click, before the request, and hand it to print', async () => {
      mockGetVisitPrescriptionData.mockResolvedValue({ visitUuid: 'visit-123' });
      mockPrintPdf.mockResolvedValue(undefined);
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Print'));

      expect(mockOpenPendingWindow).toHaveBeenCalledWith('Preparing your prescription...');
      expect(mockOpenPendingWindow.mock.invocationCallOrder[0]).toBeLessThan(
        mockGetVisitPrescriptionData.mock.invocationCallOrder[0]
      );
      await waitFor(() => {
        expect(mockPrintPdf).toHaveBeenCalledTimes(1);
      });
      expect(mockPrintPdf.mock.calls[0][2]).toBe(openedWindows[0]);
      expect(openedWindows[0].close).not.toHaveBeenCalled();
    });

    it('should open the WhatsApp tab in the click, before the request, and hand it to share', async () => {
      mockGetVisitPrescriptionData.mockResolvedValue({ visitUuid: 'visit-123' });
      mockSharePdf.mockResolvedValue(undefined);
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
      await submitShare();

      expect(mockOpenPendingWindow).toHaveBeenCalledWith('Opening WhatsApp...');
      expect(mockOpenPendingWindow.mock.invocationCallOrder[0]).toBeLessThan(
        mockGetVisitPrescriptionData.mock.invocationCallOrder[0]
      );
      await waitFor(() => {
        expect(mockSharePdf).toHaveBeenCalledTimes(1);
      });
      expect(mockSharePdf.mock.calls[0][3]).toBe(openedWindows[0]);
      expect(openedWindows[0].close).not.toHaveBeenCalled();
    });

    it('should tell the user to allow pop-ups, and do no work, when the print tab is blocked', async () => {
      mockOpenPendingWindow.mockReturnValueOnce(null);
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Print'));

      expect(mockShowToast).toHaveBeenCalledWith('Error', POPUP_BLOCKED, 'error');
      expect(mockGetVisitPrescriptionData).not.toHaveBeenCalled();
      expect(mockPrintPdf).not.toHaveBeenCalled();
    });

    it('should tell the user to allow pop-ups, keep the modal open and do no work, when the WhatsApp tab is blocked', async () => {
      mockOpenPendingWindow.mockReturnValueOnce(null);
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
      await submitShare();

      expect(mockShowToast).toHaveBeenCalledWith('Error', POPUP_BLOCKED, 'error');
      expect(mockGetVisitPrescriptionData).not.toHaveBeenCalled();
      expect(mockSharePdf).not.toHaveBeenCalled();
      expect(screen.getByPlaceholderText('+918179987770')).toHaveValue('+919876543210');
    });

    it('should tell the user, and not print, when the print tab was closed before the data arrived', async () => {
      let resolvePdf: (value: unknown) => void = () => {};
      mockGetVisitPrescriptionData.mockReturnValue(
        new Promise(resolve => {
          resolvePdf = resolve;
        })
      );
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Print'));
      await waitFor(() => {
        expect(mockGetVisitPrescriptionData).toHaveBeenCalled();
      });

      openedWindows[0].closed = true;
      resolvePdf({ visitUuid: 'visit-123' });

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Error', TAB_CLOSED, 'error');
      });
      expect(mockPrintPdf).not.toHaveBeenCalled();
    });

    it('should tell the user, keep the modal open and not share, when the WhatsApp tab was closed before the data arrived', async () => {
      let resolvePdf: (value: unknown) => void = () => {};
      mockGetVisitPrescriptionData.mockReturnValue(
        new Promise(resolve => {
          resolvePdf = resolve;
        })
      );
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
      await submitShare();
      await waitFor(() => {
        expect(mockGetVisitPrescriptionData).toHaveBeenCalled();
      });

      openedWindows[0].closed = true;
      resolvePdf({ visitUuid: 'visit-123' });

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Error', TAB_CLOSED, 'error');
      });
      expect(mockSharePdf).not.toHaveBeenCalled();
      expect(screen.queryByText(SHARE_FAILED)).not.toBeInTheDocument();
      expect(screen.getByPlaceholderText('+918179987770')).toHaveValue('+919876543210');
    });

    it('should close the blank print tab when printing fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetVisitPrescriptionData.mockRejectedValue(new Error('API error'));
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Print'));
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to print prescription PDF', { name: 'Error', status: undefined });
      });
      expect(openedWindows[0].close).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should close the blank WhatsApp tab when sharing fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetVisitPrescriptionData.mockResolvedValue({ visitUuid: 'visit-123' });
      mockSharePdf.mockRejectedValue(new Error('share failed'));
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
      await submitShare();
      expect(await screen.findByText(SHARE_FAILED)).toBeInTheDocument();
      expect(openedWindows[0].close).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should show the same error message as Visit Details, and close the tab, when printing fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetVisitPrescriptionData.mockRejectedValue(new Error('API error'));
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Print'));
      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Error',
          'Failed to print the prescription. Please try again.',
          'error'
        );
      });
      expect(openedWindows[0].close).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should not open two tabs or fetch twice for a double click on Print', async () => {
      mockGetVisitPrescriptionData.mockReturnValue(new Promise(() => {}));
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument();
      });
      const printButton = screen.getByRole('button', { name: /^Print$/ });
      act(() => {
        printButton.click();
        printButton.click();
      });
      expect(openedWindows).toHaveLength(1);
      expect(mockGetVisitPrescriptionData).toHaveBeenCalledTimes(1);
    });

    it('should not open two tabs, fetch twice or share twice for a double click on the modal Share button', async () => {
      mockGetVisitPrescriptionData.mockReturnValue(new Promise(() => {}));
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole('button', { name: /^Share$/ }));
      fireEvent.change(await screen.findByPlaceholderText('+918179987770'), {
        target: { value: '+919876543210' },
      });
      const shareButtons = screen.getAllByRole('button', { name: /share/i });
      const submit = shareButtons[shareButtons.length - 1];
      act(() => {
        submit.click();
        submit.click();
      });
      expect(openedWindows).toHaveLength(1);
      expect(mockGetVisitPrescriptionData).toHaveBeenCalledTimes(1);
      expect(mockSharePdf).not.toHaveBeenCalled();
    });

    it('should cancel the request, close the tab and stay silent when the user leaves while printing', async () => {
      let resolvePdf: (value: unknown) => void = () => {};
      let signal: AbortSignal | undefined;
      mockGetVisitPrescriptionData.mockImplementation((_id: string, s?: AbortSignal) => {
        signal = s;
        return new Promise(resolve => {
          resolvePdf = resolve;
        });
      });
      const { unmount } = renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Print'));
      await waitFor(() => {
        expect(mockGetVisitPrescriptionData).toHaveBeenCalled();
      });
      unmount();
      await Promise.resolve();
      expect(signal?.aborted).toBe(true);
      resolvePdf({ visitUuid: 'visit-123' });
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(mockPrintPdf).not.toHaveBeenCalled();
      expect(openedWindows[0].close).toHaveBeenCalled();
      expect(mockShowToast).not.toHaveBeenCalled();
    });

    it('should tell the user when the tab turns out to be closed during the PDF build', async () => {
      mockGetVisitPrescriptionData.mockResolvedValue({ visitUuid: 'visit-123' });
      mockPrintPdf.mockRejectedValue(new TabClosedError());
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Print'));
      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith('Error', TAB_CLOSED, 'error');
      });
      expect(mockShowToast).toHaveBeenCalledTimes(1);
    });

    it('should log only the error type and HTTP status when downloading fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetVisitPrescriptionData.mockRejectedValue(
        Object.assign(new Error('token=secret-123 patient=John'), { response: { status: 500 } })
      );
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Download PDF')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Download PDF'));
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to download prescription PDF', { name: 'Error', status: 500 });
      });
      expect(JSON.stringify(consoleSpy.mock.calls)).not.toContain('secret-123');
      consoleSpy.mockRestore();
    });

    it('should show a failure toast when downloading fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetVisitPrescriptionData.mockRejectedValue(new Error('API error'));
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Download PDF')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Download PDF'));
      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith(
          'Error',
          'Failed to download the prescription. Please try again.',
          'error'
        );
      });
      consoleSpy.mockRestore();
    });

    it('should not fetch or save twice for a double click on Download PDF', async () => {
      mockGetVisitPrescriptionData.mockReturnValue(new Promise(() => {}));
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Download PDF')).toBeInTheDocument();
      });
      const button = screen.getByRole('button', { name: /^Download PDF$/ });
      act(() => {
        button.click();
        button.click();
      });
      expect(mockGetVisitPrescriptionData).toHaveBeenCalledTimes(1);
    });

    it('should cancel the request and save nothing when the user leaves while downloading', async () => {
      let resolvePdf: (value: unknown) => void = () => {};
      let signal: AbortSignal | undefined;
      mockGetVisitPrescriptionData.mockImplementation((_id: string, s?: AbortSignal) => {
        signal = s;
        return new Promise(resolve => {
          resolvePdf = resolve;
        });
      });
      const { unmount } = renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Download PDF')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Download PDF'));
      await waitFor(() => {
        expect(mockGetVisitPrescriptionData).toHaveBeenCalled();
      });
      unmount();
      await Promise.resolve();
      expect(signal?.aborted).toBe(true);
      resolvePdf({ visitUuid: 'visit-123' });
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mockDownloadPdf).not.toHaveBeenCalled();
      expect(mockShowToast).not.toHaveBeenCalled();
    });

    it('should show the busy state only on the button that is working', async () => {
      // a share in progress: neither Print nor Download claims to be working
      mockGetVisitPrescriptionData.mockReturnValue(new Promise(() => {}));
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
      await submitShare();
      await screen.findByRole('button', { name: /Sharing.../ });
      expect(screen.getByRole('button', { name: /^Print$/ })).toBeDisabled();
      expect(screen.getByRole('button', { name: /^Download PDF$/ })).toBeDisabled();
      expect(screen.queryByRole('button', { name: /Printing.../ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Downloading.../ })).not.toBeInTheDocument();
    });

    it('should show "Printing..." only on Print, and "Downloading..." only on Download', async () => {
      mockGetVisitPrescriptionData.mockReturnValue(new Promise(() => {}));
      const first = renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Print'));
      await screen.findByRole('button', { name: /Printing.../ });
      expect(screen.getByRole('button', { name: /^Download PDF$/ })).toBeDisabled();
      expect(screen.queryByRole('button', { name: /Downloading.../ })).not.toBeInTheDocument();
      first.unmount();

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Download PDF')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Download PDF'));
      await screen.findByRole('button', { name: /Downloading.../ });
      expect(screen.getByRole('button', { name: /^Print$/ })).toBeDisabled();
      expect(screen.queryByRole('button', { name: /Printing.../ })).not.toBeInTheDocument();
    });

    it('should cancel an in-flight Print and free the buttons when the route moves to another visit', async () => {
      let resolveA: (value: unknown) => void = () => {};
      const calls: { id: string; signal?: AbortSignal }[] = [];
      mockGetVisitPrescriptionData.mockImplementation((id: string, s?: AbortSignal) => {
        calls.push({ id, signal: s });
        return id === 'visit-a'
          ? new Promise(resolve => {
              resolveA = resolve;
            })
          : Promise.resolve({ visitUuid: id });
      });
      mockPrintPdf.mockResolvedValue(undefined);
      render(
        <MemoryRouter initialEntries={['/prescription-detail/visit-a']}>
          <BreadcrumbProvider>
            <Link to="/prescription-detail/visit-b">go to visit b</Link>
            <Routes>
              <Route path="/prescription-detail/:visitId" element={<PrescriptionDetail />} />
            </Routes>
          </BreadcrumbProvider>
        </MemoryRouter>
      );
      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Print'));
      await waitFor(() => {
        expect(calls).toHaveLength(1);
      });

      // the page stays mounted when only the visit in the route changes
      fireEvent.click(screen.getByText('go to visit b'));
      await waitFor(() => {
        expect(calls[0].signal?.aborted).toBe(true);
      });
      resolveA({ visitUuid: 'visit-a' });
      await new Promise(resolve => setTimeout(resolve, 0));
      // visit A's prescription must not print from what is now visit B's page
      expect(mockPrintPdf).not.toHaveBeenCalled();
      expect(openedWindows[0].close).toHaveBeenCalled();

      // visit B is usable straight away and prints its own data
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^Print$/ })).toBeEnabled();
      });
      fireEvent.click(screen.getByText('Print'));
      await waitFor(() => {
        expect(mockPrintPdf).toHaveBeenCalledTimes(1);
      });
      expect(calls[1].id).toBe('visit-b');
      expect(mockPrintPdf).toHaveBeenCalledWith({ visitUuid: 'visit-b' }, expect.any(AbortSignal), anyWindow);
    });

    it('should call downloadVisitPrescriptionPdf when Download PDF is clicked', async () => {
      const pdfData = { visitUuid: 'visit-123', patientName: 'Test' };
      mockGetVisitPrescriptionData.mockResolvedValue(pdfData);
      mockDownloadPdf.mockResolvedValue(undefined);
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Download PDF')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Download PDF'));
      await waitFor(() => {
        expect(mockGetVisitPrescriptionData).toHaveBeenCalledWith('visit-123', expect.any(AbortSignal));
      });
      await waitFor(() => {
        expect(mockDownloadPdf).toHaveBeenCalledWith(pdfData, expect.any(AbortSignal));
      });
      // downloading saves a file: no tab is opened for it
      expect(mockOpenPendingWindow).not.toHaveBeenCalled();
    });

    it('should handle download error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetVisitPrescriptionData.mockRejectedValue(new Error('API error'));
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Download PDF')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Download PDF'));
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to download prescription PDF', { name: 'Error', status: undefined });
        // the raw error object is never logged (may carry patient data/tokens)
        expect(consoleSpy).not.toHaveBeenCalledWith(expect.anything(), expect.any(Error));
      });
      consoleSpy.mockRestore();
    });

    it('should handle print error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetVisitPrescriptionData.mockRejectedValue(new Error('API error'));
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Print'));
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to print prescription PDF', { name: 'Error', status: undefined });
        expect(consoleSpy).not.toHaveBeenCalledWith(expect.anything(), expect.any(Error));
      });
      consoleSpy.mockRestore();
    });

    it('should handle share error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetVisitPrescriptionData.mockRejectedValue(new Error('Share API error'));
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Share'));
      await waitFor(() => {
        expect(screen.getByPlaceholderText('+918179987770')).toBeInTheDocument();
      });
      const phoneInput = screen.getByPlaceholderText('+918179987770');
      fireEvent.change(phoneInput, { target: { value: '+919876543210' } });
      const shareButtons = screen.getAllByRole('button', { name: /share/i });
      fireEvent.click(shareButtons[shareButtons.length - 1]);
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to share prescription PDF', { name: 'Error', status: undefined });
      });
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.anything(), expect.any(Error));
      // the failure is shown inside the modal, which stays open with the number kept
      expect(
        await screen.findByText('Failed to share the prescription. Please try again.')
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText('+918179987770')).toHaveValue('+919876543210');
      consoleSpy.mockRestore();
    });
  });

  /* ── DiagnosisSection ── */

  describe('DiagnosisSection', () => {
    it('should render diagnosis when present', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Diagnosis')).toBeInTheDocument();
      });
      expect(screen.getByText('Infestation by Sarcoptes Scabiei')).toBeInTheDocument();
    });

    it('should not render diagnosis section when diagnosis is empty', async () => {
      mockGetPrescriptionData.mockResolvedValue({ ...fullData, diagnosis: '' });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Test S')).toBeInTheDocument();
      });
      expect(screen.queryByText('Diagnosis')).not.toBeInTheDocument();
    });
  });

  /* ── MedicationsTable ── */

  describe('MedicationsTable', () => {
    it('should render medications table with data', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Prescribed Medications')).toBeInTheDocument();
      });
      expect(screen.getByText('Medicine')).toBeInTheDocument();
      expect(screen.getByText('Strength')).toBeInTheDocument();
      expect(screen.getByText('Frequency')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('Ambroxol Drops')).toBeInTheDocument();
      expect(screen.getByText('Paracetamol')).toBeInTheDocument();
    });

    it('should not render medications section when array is empty', async () => {
      mockGetPrescriptionData.mockResolvedValue({ ...fullData, medications: [] });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Test S')).toBeInTheDocument();
      });
      expect(screen.queryByText('Prescribed Medications')).not.toBeInTheDocument();
    });

    it('should show dash for missing medication fields', async () => {
      mockGetPrescriptionData.mockResolvedValue({
        ...fullData,
        medications: [{ name: 'Test Med', strength: '', frequency: '', duration: '' }],
      });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Test Med')).toBeInTheDocument();
      });
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBe(3);
    });
  });

  /* ── AdviceSection ── */

  describe('AdviceSection', () => {
    it('should render advice items when present', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Advice')).toBeInTheDocument();
      });
      expect(screen.getByText('Drink plenty of water')).toBeInTheDocument();
      expect(screen.getByText('Take rest')).toBeInTheDocument();
    });

    it('should not render advice section when array is empty', async () => {
      mockGetPrescriptionData.mockResolvedValue({ ...fullData, advice: [] });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Test S')).toBeInTheDocument();
      });
      expect(screen.queryByText('Advice')).not.toBeInTheDocument();
    });
  });

  /* ── TestsSection ── */

  describe('TestsSection', () => {
    it('should render test items when present', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Tests Recommended')).toBeInTheDocument();
      });
      expect(screen.getByText('LFT')).toBeInTheDocument();
      expect(screen.getByText('CBC')).toBeInTheDocument();
    });

    it('should not render tests section when array is empty', async () => {
      mockGetPrescriptionData.mockResolvedValue({ ...fullData, testsRecommended: [] });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Test S')).toBeInTheDocument();
      });
      expect(screen.queryByText('Tests Recommended')).not.toBeInTheDocument();
    });
  });

  /* ── ReferredSpecialistSection ── */

  describe('ReferredSpecialistSection', () => {
    it('should render specialist when present', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Referred Specialist')).toBeInTheDocument();
      });
      expect(screen.getByText('CHO – Community Health Officer')).toBeInTheDocument();
    });

    it('should not render specialist section when null', async () => {
      mockGetPrescriptionData.mockResolvedValue({ ...fullData, referredSpecialist: null });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Test S')).toBeInTheDocument();
      });
      expect(screen.queryByText('Referred Specialist')).not.toBeInTheDocument();
    });
  });

  /* ── FollowUpSection ── */

  describe('FollowUpSection', () => {
    it('should render follow-up date when present', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Follow-up')).toBeInTheDocument();
      });
      expect(screen.getByText('3 February 2026')).toBeInTheDocument();
    });

    it('should not render follow-up section when null', async () => {
      mockGetPrescriptionData.mockResolvedValue({ ...fullData, followUpDate: null });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Test S')).toBeInTheDocument();
      });
      expect(screen.queryByText('Follow-up')).not.toBeInTheDocument();
    });
  });

  /* ── Empty state ── */

  describe('empty state', () => {
    it('should show "No prescription data available" when all sections are empty', async () => {
      mockGetPrescriptionData.mockResolvedValue({
        ...fullData,
        diagnosis: '',
        medications: [],
        advice: [],
        testsRecommended: [],
        referredSpecialist: null,
        followUpDate: null,
      });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('No prescription data available for this visit.')).toBeInTheDocument();
      });
    });

    it('should not show empty message when at least one section has data', async () => {
      mockGetPrescriptionData.mockResolvedValue({
        ...fullData,
        diagnosis: 'Fever',
        medications: [],
        advice: [],
        testsRecommended: [],
        referredSpecialist: null,
        followUpDate: null,
      });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Fever')).toBeInTheDocument();
      });
      expect(screen.queryByText('No prescription data available for this visit.')).not.toBeInTheDocument();
    });
  });
});
