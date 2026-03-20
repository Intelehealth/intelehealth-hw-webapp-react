import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { PrescriptionData } from '../../../assets/data/prescription-detail.data';

/* ── Hoisted mock data ── */

const { mockGetPrescriptionData, mockNavigate } = vi.hoisted(() => ({
  mockGetPrescriptionData: vi.fn(),
  mockNavigate: vi.fn(),
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

// SVG icon mocks
vi.mock('../../../assets/icons/appiontment/icon-patient-image.svg', () => ({ default: 'icon-patient.svg' }));
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
      <Routes>
        <Route path="/prescription-detail/:visitId" element={<PrescriptionDetail />} />
      </Routes>
    </MemoryRouter>
  );

/* ── Tests ── */

describe('PrescriptionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPrescriptionData.mockResolvedValue({ ...fullData });
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

  it('should render "Back to Dashboard" button', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });
  });

  it('should navigate back on "Back to Dashboard" click', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Back to Dashboard'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
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

    it('should handle Print button click', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Print')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Print'));
    });

    it('should handle Share button click', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Share'));
    });

    it('should handle Download PDF button click', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Download PDF')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Download PDF'));
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
