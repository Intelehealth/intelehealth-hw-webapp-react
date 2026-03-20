import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { PrescriptionData } from '../../../assets/data/prescription-detail.data';

/* ── Hoisted mock data (available before vi.mock factories run) ── */

const { mockData, resetMockData } = vi.hoisted(() => {
  const data: PrescriptionData = {
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

  function reset() {
    Object.assign(data, {
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
    } satisfies PrescriptionData);
  }

  return { mockData: data, resetMockData: reset };
});

/* ── Mocks ── */

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../../assets/data/prescription-detail.data', () => ({
  DUMMY_PRESCRIPTION: mockData,
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

const renderComponent = () =>
  render(
    <MemoryRouter>
      <PrescriptionDetail />
    </MemoryRouter>
  );

/* ── Tests ── */

describe('PrescriptionDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetMockData();
  });

  /* ── Full data rendering ── */

  it('should render without crashing', () => {
    expect(() => renderComponent()).not.toThrow();
  });

  it('should render "Back to Dashboard" button', () => {
    renderComponent();
    expect(screen.getByText('Back to Dashboard')).toBeInTheDocument();
  });

  it('should navigate back on "Back to Dashboard" click', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Back to Dashboard'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  /* ── PrescriptionHeader ── */

  describe('PrescriptionHeader', () => {
    it('should render patient info', () => {
      renderComponent();
      expect(screen.getByText('Test S')).toBeInTheDocument();
      expect(screen.getByText('Age: 19')).toBeInTheDocument();
      expect(screen.getByText('Male')).toBeInTheDocument();
      expect(screen.getByText('ID: 163KG-9')).toBeInTheDocument();
    });

    it('should render doctor info with qualification', () => {
      renderComponent();
      expect(screen.getByText('Dr. Rohith M S')).toBeInTheDocument();
      expect(screen.getByText('Qualification: MBBS, MD')).toBeInTheDocument();
    });

    it('should render visit date', () => {
      renderComponent();
      expect(screen.getByText('Visit: 27 January 2026, 10:31 AM')).toBeInTheDocument();
    });

    it('should not render doctor section when doctorName is empty', () => {
      mockData.doctorName = '';
      renderComponent();
      expect(screen.queryByText(/Dr\./)).not.toBeInTheDocument();
    });

    it('should not render qualification when doctorQualification is empty', () => {
      mockData.doctorQualification = '';
      renderComponent();
      expect(screen.getByText('Dr. Rohith M S')).toBeInTheDocument();
      expect(screen.queryByText(/Qualification/)).not.toBeInTheDocument();
    });

    it('should render Print, Share, and Download PDF buttons', () => {
      renderComponent();
      expect(screen.getByText('Print')).toBeInTheDocument();
      expect(screen.getByText('Share')).toBeInTheDocument();
      expect(screen.getByText('Download PDF')).toBeInTheDocument();
    });

    it('should handle Print button click', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Print'));
    });

    it('should handle Share button click', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Share'));
    });

    it('should handle Download PDF button click', () => {
      renderComponent();
      fireEvent.click(screen.getByText('Download PDF'));
    });
  });

  /* ── DiagnosisSection ── */

  describe('DiagnosisSection', () => {
    it('should render diagnosis when present', () => {
      renderComponent();
      expect(screen.getByText('Diagnosis')).toBeInTheDocument();
      expect(screen.getByText('Infestation by Sarcoptes Scabiei')).toBeInTheDocument();
    });

    it('should not render diagnosis section when diagnosis is empty', () => {
      mockData.diagnosis = '';
      renderComponent();
      expect(screen.queryByText('Diagnosis')).not.toBeInTheDocument();
    });
  });

  /* ── MedicationsTable ── */

  describe('MedicationsTable', () => {
    it('should render medications table with data', () => {
      renderComponent();
      expect(screen.getByText('Prescribed Medications')).toBeInTheDocument();
      expect(screen.getByText('Medicine')).toBeInTheDocument();
      expect(screen.getByText('Strength')).toBeInTheDocument();
      expect(screen.getByText('Frequency')).toBeInTheDocument();
      expect(screen.getByText('Duration')).toBeInTheDocument();
      expect(screen.getByText('Ambroxol Drops')).toBeInTheDocument();
      expect(screen.getByText('Paracetamol')).toBeInTheDocument();
    });

    it('should not render medications section when array is empty', () => {
      mockData.medications = [];
      renderComponent();
      expect(screen.queryByText('Prescribed Medications')).not.toBeInTheDocument();
    });

    it('should show dash for missing medication fields', () => {
      mockData.medications = [{ name: 'Test Med', strength: '', frequency: '', duration: '' }];
      renderComponent();
      expect(screen.getByText('Test Med')).toBeInTheDocument();
      const dashes = screen.getAllByText('—');
      expect(dashes.length).toBe(3);
    });
  });

  /* ── AdviceSection ── */

  describe('AdviceSection', () => {
    it('should render advice items when present', () => {
      renderComponent();
      expect(screen.getByText('Advice')).toBeInTheDocument();
      expect(screen.getByText('Drink plenty of water')).toBeInTheDocument();
      expect(screen.getByText('Take rest')).toBeInTheDocument();
    });

    it('should not render advice section when array is empty', () => {
      mockData.advice = [];
      renderComponent();
      expect(screen.queryByText('Advice')).not.toBeInTheDocument();
    });
  });

  /* ── TestsSection ── */

  describe('TestsSection', () => {
    it('should render test items when present', () => {
      renderComponent();
      expect(screen.getByText('Tests Recommended')).toBeInTheDocument();
      expect(screen.getByText('LFT')).toBeInTheDocument();
      expect(screen.getByText('CBC')).toBeInTheDocument();
    });

    it('should not render tests section when array is empty', () => {
      mockData.testsRecommended = [];
      renderComponent();
      expect(screen.queryByText('Tests Recommended')).not.toBeInTheDocument();
    });
  });

  /* ── ReferredSpecialistSection ── */

  describe('ReferredSpecialistSection', () => {
    it('should render specialist when present', () => {
      renderComponent();
      expect(screen.getByText('Referred Specialist')).toBeInTheDocument();
      expect(screen.getByText('CHO – Community Health Officer')).toBeInTheDocument();
    });

    it('should not render specialist section when null', () => {
      mockData.referredSpecialist = null;
      renderComponent();
      expect(screen.queryByText('Referred Specialist')).not.toBeInTheDocument();
    });
  });

  /* ── FollowUpSection ── */

  describe('FollowUpSection', () => {
    it('should render follow-up date when present', () => {
      renderComponent();
      expect(screen.getByText('Follow-up')).toBeInTheDocument();
      expect(screen.getByText('3 February 2026')).toBeInTheDocument();
    });

    it('should not render follow-up section when null', () => {
      mockData.followUpDate = null;
      renderComponent();
      expect(screen.queryByText('Follow-up')).not.toBeInTheDocument();
    });
  });

  /* ── Empty state ── */

  describe('empty state', () => {
    it('should show "No prescription data available" when all sections are empty', () => {
      Object.assign(mockData, {
        diagnosis: '',
        medications: [],
        advice: [],
        testsRecommended: [],
        referredSpecialist: null,
        followUpDate: null,
      });
      renderComponent();
      expect(screen.getByText('No prescription data available for this visit.')).toBeInTheDocument();
    });

    it('should not show empty message when at least one section has data', () => {
      Object.assign(mockData, {
        diagnosis: 'Fever',
        medications: [],
        advice: [],
        testsRecommended: [],
        referredSpecialist: null,
        followUpDate: null,
      });
      renderComponent();
      expect(screen.queryByText('No prescription data available for this visit.')).not.toBeInTheDocument();
    });
  });
});
