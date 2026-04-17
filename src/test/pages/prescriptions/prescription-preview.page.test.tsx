import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import PrescriptionPreviewPage from '../../../pages/prescriptions/prescription-preview.page';
import type { PrescriptionData } from '../../../services/visit-prescription.service';

// ─── Mock service & SVG assets ───────────────────────────────────────────────

vi.mock('../../../services/visit-prescription.service', () => ({
  getVisitPrescriptionData: vi.fn(),
}));

vi.mock('../../../assets/icons/prescription-consultation.svg', () => ({ default: 'consultation.svg' }));
vi.mock('../../../assets/icons/prescription-diagnosis.svg', () => ({ default: 'diagnosis.svg' }));
vi.mock('../../../assets/icons/prescription-followup.svg', () => ({ default: 'followup.svg' }));
vi.mock('../../../assets/icons/prescription-medication.svg', () => ({ default: 'medication.svg' }));
vi.mock('../../../assets/icons/prescription-advice.svg', () => ({ default: 'advice.svg' }));
vi.mock('../../../assets/icons/prescription-test.svg', () => ({ default: 'test.svg' }));
vi.mock('../../../assets/icons/prescription-referral.svg', () => ({ default: 'referral.svg' }));

import { getVisitPrescriptionData } from '../../../services/visit-prescription.service';
const mockGetData = vi.mocked(getVisitPrescriptionData);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makePrescription = (overrides: Partial<PrescriptionData> = {}): PrescriptionData => ({
  visitUuid: 'visit-1',
  patientName: 'JOHN DOE',
  patientUuid: 'patient-1',
  patientId: 'OPD-001',
  gender: 'Male',
  age: '34 years',
  phone: '9876543210',
  address: '12 Main St, Delhi',
  nationalId: 'ID-12345',
  occupation: 'Farmer',
  consultationDate: '17 Mar 2026',
  location: 'Central Clinic',
  doctorName: 'Dr. Smith',
  doctorQualification: 'MBBS',
  doctorRegNumber: 'REG-999',
  doctorSignatureUrl: null,
  vitals: { height: '170', weight: '70', bpSystolic: '120', bpDiastolic: '80', pulse: '72', temperature: '98.6', spo2: '98', respiratoryRate: '18' },
  diagnoses: [{ diagnosisName: 'Typhoid fever', diagnosisType: 'Primary', diagnosisStatus: 'Confirmed' }],
  medicines: [{ drug: 'Paracetamol', strength: '500mg', frequency: 'Twice daily', days: '5', timing: 'After food', remark: 'NA' }],
  advices: ['Drink plenty of water'],
  tests: ['CBC Test'],
  referrals: [{ speciality: 'Cardiology', reason: 'Chest pain' }],
  followUp: { wantFollowUp: 'Yes', followUpType: 'In person', followUpDate: '2026-04-10', followUpTime: '10:00 AM', followUpReason: 'Check BP' },
  ...overrides,
});

const renderWithParams = (search = '?visitUuid=visit-1') =>
  render(
    <MemoryRouter initialEntries={[`/prescription-preview${search}`]}>
      <Routes>
        <Route path="/prescription-preview" element={<PrescriptionPreviewPage />} />
      </Routes>
    </MemoryRouter>
  );

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('PrescriptionPreviewPage', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('loading state', () => {
    it('shows loading text while data is being fetched', () => {
      mockGetData.mockReturnValue(new Promise(() => {})); // never resolves
      renderWithParams();
      expect(screen.getByText('Loading prescription data...')).toBeInTheDocument();
    });
  });

  describe('error states', () => {
    it('shows error when no visitUuid provided', async () => {
      renderWithParams('');
      await waitFor(() => {
        expect(screen.getByText('No visitUuid provided')).toBeInTheDocument();
      });
    });

    it('shows error message when service rejects', async () => {
      mockGetData.mockRejectedValue(new Error('Network error'));
      renderWithParams();
      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });
  });

  describe('successful render', () => {
    it('renders the title bar', async () => {
      mockGetData.mockResolvedValue(makePrescription());
      renderWithParams();
      await waitFor(() => {
        expect(screen.getByText('Intelehealth e-Prescription')).toBeInTheDocument();
      });
    });

    it('renders patient name and ID', async () => {
      mockGetData.mockResolvedValue(makePrescription());
      renderWithParams();
      await waitFor(() => {
        expect(screen.getByText('JOHN DOE')).toBeInTheDocument();
        expect(screen.getAllByText('OPD-001').length).toBeGreaterThan(0);
      });
    });

    it('renders patient info fields', async () => {
      mockGetData.mockResolvedValue(makePrescription());
      renderWithParams();
      await waitFor(() => {
        expect(screen.getByText('Male')).toBeInTheDocument();
        expect(screen.getByText('34 years')).toBeInTheDocument();
        expect(screen.getByText('ID-12345')).toBeInTheDocument();
        expect(screen.getByText('Farmer')).toBeInTheDocument();
      });
    });

    it('renders section headers', async () => {
      mockGetData.mockResolvedValue(makePrescription());
      renderWithParams();
      await waitFor(() => {
        // Use getAllByText for labels that appear in both section header and table header
        expect(screen.getByText('Consultation details')).toBeInTheDocument();
        expect(screen.getAllByText('Diagnosis').length).toBeGreaterThan(0);
        expect(screen.getByText('Prescribed Medications')).toBeInTheDocument();
        expect(screen.getByText('Follow-up')).toBeInTheDocument();
      });
    });

    it('renders diagnosis row', async () => {
      mockGetData.mockResolvedValue(makePrescription());
      renderWithParams();
      await waitFor(() => {
        expect(screen.getByText('Typhoid fever')).toBeInTheDocument();
        expect(screen.getByText('Primary')).toBeInTheDocument();
        expect(screen.getByText('Confirmed')).toBeInTheDocument();
      });
    });

    it('renders medicine row', async () => {
      mockGetData.mockResolvedValue(makePrescription());
      renderWithParams();
      await waitFor(() => {
        expect(screen.getByText('Paracetamol')).toBeInTheDocument();
        expect(screen.getByText('500mg')).toBeInTheDocument();
        expect(screen.getByText('Twice daily')).toBeInTheDocument();
      });
    });

    it('renders advice section when advices present', async () => {
      mockGetData.mockResolvedValue(makePrescription());
      renderWithParams();
      await waitFor(() => {
        expect(screen.getByText('Advice')).toBeInTheDocument();
        expect(screen.getByText('Drink plenty of water')).toBeInTheDocument();
      });
    });

    it('renders tests section when tests present', async () => {
      mockGetData.mockResolvedValue(makePrescription());
      renderWithParams();
      await waitFor(() => {
        expect(screen.getByText('Tests Recommended')).toBeInTheDocument();
        expect(screen.getByText('CBC Test')).toBeInTheDocument();
      });
    });

    it('renders referral section when referrals present', async () => {
      mockGetData.mockResolvedValue(makePrescription());
      renderWithParams();
      await waitFor(() => {
        expect(screen.getByText('Referred Specialist')).toBeInTheDocument();
        // Match the <li> element specifically (not the debug JSON pre block)
        expect(screen.getByText(/Cardiology/, { selector: 'li' })).toBeInTheDocument();
      });
    });

    it('renders follow-up details', async () => {
      mockGetData.mockResolvedValue(makePrescription());
      renderWithParams();
      await waitFor(() => {
        expect(screen.getByText('Yes')).toBeInTheDocument();
        expect(screen.getByText('In person')).toBeInTheDocument();
        expect(screen.getByText('2026-04-10')).toBeInTheDocument();
      });
    });

    it('renders doctor name, qualification and registration', async () => {
      mockGetData.mockResolvedValue(makePrescription());
      renderWithParams();
      await waitFor(() => {
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
        expect(screen.getByText('MBBS')).toBeInTheDocument();
        expect(screen.getByText('Registration No: REG-999')).toBeInTheDocument();
      });
    });

    it('renders doctor signature img when doctorSignatureUrl provided', async () => {
      mockGetData.mockResolvedValue(makePrescription({ doctorSignatureUrl: 'https://example.com/sig.png' }));
      renderWithParams();
      await waitFor(() => {
        const sig = screen.getByAltText('signature') as HTMLImageElement;
        expect(sig).toBeInTheDocument();
        expect(sig.src).toContain('sig.png');
      });
    });

    it('does not render signature img when doctorSignatureUrl is null', async () => {
      mockGetData.mockResolvedValue(makePrescription({ doctorSignatureUrl: null }));
      renderWithParams();
      await waitFor(() => {
        expect(screen.queryByAltText('signature')).not.toBeInTheDocument();
      });
    });

    it('shows initials fallback when patient avatar image fails to load (line 64)', async () => {
      mockGetData.mockResolvedValue(makePrescription());
      renderWithParams();
      await waitFor(() => {
        const imgs = screen.getAllByRole('img') as HTMLImageElement[];
        const avatarImg = imgs.find(img => img.src.includes('personimage'));
        expect(avatarImg).toBeDefined();
        fireEvent.error(avatarImg!);
      });
      await waitFor(() => {
        expect(screen.getByText('J')).toBeInTheDocument();
      });
    });

    it('shows "P" as fallback initial when patientName is empty', async () => {
      mockGetData.mockResolvedValue(makePrescription({ patientName: '' }));
      renderWithParams();
      await waitFor(() => {
        const imgs = screen.getAllByRole('img') as HTMLImageElement[];
        const avatarImg = imgs.find(img => img.src.includes('personimage'));
        expect(avatarImg).toBeDefined();
        fireEvent.error(avatarImg!);
      });
      await waitFor(() => {
        expect(screen.getByText('P')).toBeInTheDocument();
      });
    });
  });

  describe('empty data sections', () => {
    it('shows "No diagnosis added" when diagnoses empty', async () => {
      mockGetData.mockResolvedValue(makePrescription({ diagnoses: [] }));
      renderWithParams();
      await waitFor(() => {
        expect(screen.getByText('No diagnosis added')).toBeInTheDocument();
      });
    });

    it('shows "No medicines added" when medicines empty', async () => {
      mockGetData.mockResolvedValue(makePrescription({ medicines: [] }));
      renderWithParams();
      await waitFor(() => {
        expect(screen.getByText('No medicines added')).toBeInTheDocument();
      });
    });

    it('does not render Advice section when advices empty', async () => {
      mockGetData.mockResolvedValue(makePrescription({ advices: [] }));
      renderWithParams();
      await waitFor(() => {
        expect(screen.queryByText('Advice')).not.toBeInTheDocument();
      });
    });

    it('does not render Tests section when tests empty', async () => {
      mockGetData.mockResolvedValue(makePrescription({ tests: [] }));
      renderWithParams();
      await waitFor(() => {
        expect(screen.queryByText('Tests Recommended')).not.toBeInTheDocument();
      });
    });

    it('does not render Referral section when referrals empty', async () => {
      mockGetData.mockResolvedValue(makePrescription({ referrals: [] }));
      renderWithParams();
      await waitFor(() => {
        expect(screen.queryByText('Referred Specialist')).not.toBeInTheDocument();
      });
    });

    it('shows "No" for follow-up suggested when followUp is null', async () => {
      mockGetData.mockResolvedValue(makePrescription({ followUp: null }));
      renderWithParams();
      await waitFor(() => {
        // BulletRow renders value in a <span> — match that specifically
        expect(screen.getByText('No', { selector: 'span' })).toBeInTheDocument();
      });
    });
  });

  describe('disclaimer', () => {
    it('renders telemedicine disclaimer', async () => {
      mockGetData.mockResolvedValue(makePrescription());
      renderWithParams();
      await waitFor(() => {
        expect(screen.getByText(/telemedicine consultation/)).toBeInTheDocument();
      });
    });
  });
});
