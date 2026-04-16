import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  parseDiagnosis,
  parseMedicine,
  parseFollowUp,
  parseReferral,
  getVisitPrescriptionData,
  type DiagnosisItem,
  type MedicineItem,
  type FollowUpData,
  type PrescriptionData,
} from '../../services/visit-prescription.service';

// ─── Mock OpenMRSApi so getVisitPrescriptionData doesn't hit the network ──────
vi.mock('../../services/openmrs', () => ({
  OpenMRSApi: { get: vi.fn() },
}));

import { OpenMRSApi } from '../../services/openmrs';
const mockGet = vi.mocked(OpenMRSApi.get);

// ─── Interface shape tests ────────────────────────────────────────────────────

describe('PrescriptionData interfaces', () => {
  it('DiagnosisItem has correct fields', () => {
    const d: DiagnosisItem = { diagnosisName: 'Flu', diagnosisType: 'Primary', diagnosisStatus: 'Confirmed' };
    expect(d.diagnosisName).toBe('Flu');
    expect(d.diagnosisType).toBe('Primary');
    expect(d.diagnosisStatus).toBe('Confirmed');
  });

  it('MedicineItem has correct fields', () => {
    const m: MedicineItem = { drug: 'Paracetamol', strength: '500mg', days: '5', timing: 'After food', frequency: 'Twice daily', remark: '' };
    expect(m.drug).toBe('Paracetamol');
    expect(m.frequency).toBe('Twice daily');
    expect(m.remark).toBe('');
  });

  it('FollowUpData allows nullable fields', () => {
    const f: FollowUpData = { wantFollowUp: 'Yes', followUpType: null, followUpDate: '2026-04-01', followUpTime: null, followUpReason: null };
    expect(f.wantFollowUp).toBe('Yes');
    expect(f.followUpDate).toBe('2026-04-01');
    expect(f.followUpType).toBeNull();
  });

  it('PrescriptionData.followUp can be null', () => {
    const p: Partial<PrescriptionData> = { followUp: null };
    expect(p.followUp).toBeNull();
  });
});

// ─── parseDiagnosis ───────────────────────────────────────────────────────────

describe('parseDiagnosis', () => {
  it('parses "prefix::name:Type & Status" format', () => {
    const r = parseDiagnosis('HW::Rheumatic fever:Primary & Confirmed');
    expect(r.diagnosisName).toBe('Rheumatic fever');
    expect(r.diagnosisType).toBe('Primary');
    expect(r.diagnosisStatus).toBe('Confirmed');
  });

  it('parses "name:type:status" colon format', () => {
    const r = parseDiagnosis('Malaria:Secondary:Suspected');
    expect(r.diagnosisName).toBe('Malaria');
    expect(r.diagnosisType).toBe('Secondary');
    expect(r.diagnosisStatus).toBe('Suspected');
  });

  it('parses Python-dict style with \\n content', () => {
    const raw = `{'diagnosis': "Philadelphia Chromosome-Positive\\nDate of Diagnosis: 19/12/2021\\nBaseline IRMA: Negative."}`;
    const r = parseDiagnosis(raw);
    expect(r.diagnosisName).toContain('Philadelphia Chromosome-Positive');
    expect(r.diagnosisName).toContain('Date of Diagnosis: 19/12/2021');
    expect(r.diagnosisType).toBe('');
    expect(r.diagnosisStatus).toBe('');
  });

  it('parses double-quoted dict style', () => {
    const r = parseDiagnosis(`{"diagnosis": "Wilms Tumor\\nLocalized to kidney"}`);
    expect(r.diagnosisName).toContain('Wilms Tumor');
    expect(r.diagnosisType).toBe('');
  });

  it('returns plain string as diagnosisName when no delimiter found', () => {
    const r = parseDiagnosis('Simple Diagnosis');
    expect(r.diagnosisName).toBe('Simple Diagnosis');
    expect(r.diagnosisType).toBe('');
  });

  it('handles empty string', () => {
    const r = parseDiagnosis('');
    expect(r.diagnosisName).toBe('');
    expect(r.diagnosisType).toBe('');
    expect(r.diagnosisStatus).toBe('');
  });
});

// ─── parseMedicine ────────────────────────────────────────────────────────────

describe('parseMedicine', () => {
  it('parses full 6-part colon-separated format', () => {
    const r = parseMedicine('Paracetamol:500mg:5:After food:Take with water:Twice daily');
    expect(r.drug).toBe('Paracetamol');
    expect(r.strength).toBe('500mg');
    expect(r.days).toBe('5');
    expect(r.timing).toBe('After food');
    expect(r.remark).toBe('Take with water');
    expect(r.frequency).toBe('Twice daily');
  });

  it('fills missing fields with empty string', () => {
    const r = parseMedicine('Amoxicillin');
    expect(r.drug).toBe('Amoxicillin');
    expect(r.strength).toBe('');
    expect(r.days).toBe('');
    expect(r.frequency).toBe('');
  });

  it('handles partial fields', () => {
    const r = parseMedicine('Ibuprofen:400mg');
    expect(r.drug).toBe('Ibuprofen');
    expect(r.strength).toBe('400mg');
    expect(r.days).toBe('');
  });

  it('handles empty string', () => {
    const r = parseMedicine('');
    expect(r.drug).toBe('');
  });
});

// ─── parseFollowUp ────────────────────────────────────────────────────────────

describe('parseFollowUp', () => {
  it('parses comma-separated value format', () => {
    const r = parseFollowUp({ value: '2026-04-10,Time:10:00 AM,Remark:Rest,Type:In person' });
    expect(r.wantFollowUp).toBe('Yes');
    expect(r.followUpDate).toBe('2026-04-10');
    expect(r.followUpTime).toBe('10:00 AM');
    expect(r.followUpReason).toBe('Rest');
    expect(r.followUpType).toBe('In person');
  });

  it('treats "null" remark/type as null', () => {
    const r = parseFollowUp({ value: '2026-04-10,Time:10:00 AM,Remark:null,Type:null' });
    expect(r.followUpReason).toBeNull();
    expect(r.followUpType).toBeNull();
  });

  it('parses groupMembers format', () => {
    const r = parseFollowUp({
      groupMembers: [
        { concept: { display: 'Follow up date' }, value: '2026-05-01' },
        { concept: { display: 'Follow up time' }, value: '09:00 AM' },
        { concept: { display: 'Visit type' }, value: 'Virtual' },
        { concept: { display: 'Reason for follow up' }, value: 'Check BP' },
      ],
    });
    expect(r.wantFollowUp).toBe('Yes');
    expect(r.followUpDate).toBe('2026-05-01');
    expect(r.followUpTime).toBe('09:00 AM');
    expect(r.followUpType).toBe('Virtual');
    expect(r.followUpReason).toBe('Check BP');
  });

  it('falls back to plain date when no Time: key present', () => {
    const r = parseFollowUp({ value: '2026-06-15' });
    expect(r.followUpDate).toBe('2026-06-15');
    expect(r.followUpTime).toBeNull();
  });
});

// ─── parseReferral ────────────────────────────────────────────────────────────

describe('parseReferral', () => {
  it('parses "speciality:facility:priority:reason" — uses parts[3]', () => {
    const r = parseReferral('Cardiology:Apollo:Urgent:Chest pain');
    expect(r.speciality).toBe('Cardiology');
    expect(r.reason).toBe('Chest pain');
  });

  it('falls back to parts[1] when parts[3] is absent', () => {
    const r = parseReferral('Neurology:Headache');
    expect(r.speciality).toBe('Neurology');
    expect(r.reason).toBe('Headache');
  });

  it('handles speciality-only input', () => {
    const r = parseReferral('Orthopedics');
    expect(r.speciality).toBe('Orthopedics');
    expect(r.reason).toBe('');
  });

  it('handles empty string', () => {
    const r = parseReferral('');
    expect(r.speciality).toBe('');
    expect(r.reason).toBe('');
  });
});

// ─── getVisitPrescriptionData ─────────────────────────────────────────────────

describe('getVisitPrescriptionData', () => {
  beforeEach(() => { mockGet.mockReset(); });

  const makeVisit = (overrides: any = {}) => ({
    patient: {
      uuid: 'patient-uuid-1',
      identifiers: [{ identifier: 'OPD-001', identifierType: { display: 'OpenMRS ID' } }],
      person: {
        display: 'John Doe',
        gender: 'M',
        age: 34,
        preferredName: { givenName: 'John', middleName: null, familyName: 'Doe' },
        attributes: [
          { value: '9876543210', attributeType: { display: 'Telephone Number' } },
          { value: 'ID123456', attributeType: { display: 'National ID' } },
          { value: 'Farmer', attributeType: { display: 'Occupation' } },
        ],
        preferredAddress: { address1: '12 Main St', cityVillage: 'Delhi', countyDistrict: null, stateProvince: 'DL' },
      },
    },
    location: { display: 'Central Clinic' },
    startDatetime: '2026-03-01T10:00:00',
    encounters: [
      {
        encounterDatetime: '2026-03-01T10:30:00',
        encounterType: { display: 'Consultation' },
        encounterProviders: [{
          provider: {
            display: 'Dr. Smith',
            uuid: 'prov-1',
            attributes: [
              { value: 'MBBS', attributeType: { display: 'Qualification' } },
              { value: 'REG-999', attributeType: { display: 'RegistrationNumber' } },
            ],
          },
        }],
        obs: [
          { concept: { uuid: '537bb20d-d09d-4f88-930b-cc45c7d662df' }, value: 'HW::Typhoid fever:Primary & Confirmed' },
          { concept: { uuid: 'c38c0c50-2fd2-4ae3-b7ba-7dd25adca4ca' }, value: 'Paracetamol:500mg:5:After food:NA:Twice daily' },
          { concept: { uuid: '67a050c1-35e5-451c-a4ab-fff9d57b0db1' }, value: 'Drink plenty of water' },
          { concept: { uuid: '23601d71-50e6-483f-968d-aeef3031346d' }, value: 'CBC Test' },
          { concept: { uuid: '605b6f15-8f7a-4c45-b06d-14165f6974be' }, value: 'Cardiology:Apollo:Urgent:Chest pain' },
          { concept: { uuid: 'e8caffd6-5d22-41c4-8d6a-bc31a44d0c86' }, value: '2026-04-01,Time:10:00 AM,Remark:Rest,Type:In person' },
          { concept: { uuid: '5090AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' }, value: '170' },
          { concept: { uuid: '5089AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' }, value: '65' },
          { concept: { uuid: '5085AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' }, value: '120' },
          { concept: { uuid: '5086AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' }, value: '80' },
          { concept: { uuid: '5087AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' }, value: '72' },
          { concept: { uuid: '5088AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' }, value: '98.6' },
          { concept: { uuid: '5092AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' }, value: '98' },
          { concept: { uuid: '5242AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' }, value: '16' },
        ],
      },
    ],
    ...overrides,
  });

  it('maps patient fields correctly', async () => {
    mockGet.mockResolvedValue(makeVisit());
    const result = await getVisitPrescriptionData('visit-uuid-1');
    expect(result.visitUuid).toBe('visit-uuid-1');
    expect(result.patientName).toBe('JOHN DOE');
    expect(result.patientUuid).toBe('patient-uuid-1');
    expect(result.patientId).toBe('OPD-001');
    expect(result.gender).toBe('Male');
    expect(result.age).toBe('34 years');
    expect(result.phone).toBe('9876543210');
    expect(result.nationalId).toBe('ID123456');
    expect(result.occupation).toBe('Farmer');
    expect(result.address).toContain('12 Main St');
    expect(result.location).toBe('Central Clinic');
  });

  it('maps doctor fields correctly', async () => {
    mockGet.mockResolvedValue(makeVisit());
    const result = await getVisitPrescriptionData('visit-uuid-1');
    expect(result.doctorName).toBe('Dr. Smith');
    expect(result.doctorQualification).toBe('MBBS');
    expect(result.doctorRegNumber).toBe('REG-999');
  });

  it('maps diagnoses, medicines, advices, tests, referrals, followUp', async () => {
    mockGet.mockResolvedValue(makeVisit());
    const result = await getVisitPrescriptionData('visit-uuid-1');
    expect(result.diagnoses[0].diagnosisName).toBe('Typhoid fever');
    expect(result.diagnoses[0].diagnosisType).toBe('Primary');
    expect(result.medicines[0].drug).toBe('Paracetamol');
    expect(result.advices[0]).toBe('Drink plenty of water');
    expect(result.tests[0]).toBe('CBC Test');
    expect(result.referrals[0].speciality).toBe('Cardiology');
    expect(result.followUp?.followUpDate).toBe('2026-04-01');
    expect(result.followUp?.followUpType).toBe('In person');
  });

  it('maps vitals correctly', async () => {
    mockGet.mockResolvedValue(makeVisit());
    const result = await getVisitPrescriptionData('visit-uuid-1');
    expect(result.vitals.height).toBe('170');
    expect(result.vitals.weight).toBe('65');
    expect(result.vitals.bpSystolic).toBe('120');
    expect(result.vitals.bpDiastolic).toBe('80');
    expect(result.vitals.pulse).toBe('72');
    expect(result.vitals.temperature).toBe('98.6');
    expect(result.vitals.spo2).toBe('98');
    expect(result.vitals.respiratoryRate).toBe('16');
  });

  it('returns null vitals when no vitals obs present', async () => {
    const visit = makeVisit();
    visit.encounters[0].obs = visit.encounters[0].obs.filter(
      (o: any) => !o.concept.uuid.match(/^5\d{3}AAAA|^5242AAAA/)
    );
    mockGet.mockResolvedValue(visit);
    const result = await getVisitPrescriptionData('visit-uuid-1');
    expect(result.vitals.height).toBeNull();
    expect(result.vitals.weight).toBeNull();
    expect(result.vitals.bpSystolic).toBeNull();
    expect(result.vitals.pulse).toBeNull();
  });

  it('handles female gender mapping', async () => {
    const visit = makeVisit();
    visit.patient.person.gender = 'F';
    mockGet.mockResolvedValue(visit);
    const result = await getVisitPrescriptionData('visit-uuid-1');
    expect(result.gender).toBe('Female');
  });

  it('returns null followUp when no followUp obs present', async () => {
    const visit = makeVisit();
    visit.encounters[0].obs = visit.encounters[0].obs.filter(
      (o: any) => o.concept.uuid !== 'e8caffd6-5d22-41c4-8d6a-bc31a44d0c86'
    );
    mockGet.mockResolvedValue(visit);
    const result = await getVisitPrescriptionData('visit-uuid-1');
    expect(result.followUp).toBeNull();
  });

  it('handles object obs.value for diagnosis', async () => {
    const visit = makeVisit();
    visit.encounters[0].obs = [
      { concept: { uuid: '537bb20d-d09d-4f88-930b-cc45c7d662df' }, value: { display: 'HW::Dengue fever:Primary & Suspected' } },
    ];
    mockGet.mockResolvedValue(visit);
    const result = await getVisitPrescriptionData('visit-uuid-1');
    expect(result.diagnoses[0].diagnosisName).toBe('Dengue fever');
  });

  it('uses person.display as patientName when preferredName is null (line 174)', async () => {
    const visit = makeVisit();
    visit.patient.person.preferredName = null;
    mockGet.mockResolvedValue(visit);
    const result = await getVisitPrescriptionData('visit-uuid-1');
    expect(result.patientName).toBe('John Doe');
  });

  it('returns null address when preferredAddress is null (line 189)', async () => {
    const visit = makeVisit();
    visit.patient.person.preferredAddress = null;
    mockGet.mockResolvedValue(visit);
    const result = await getVisitPrescriptionData('visit-uuid-1');
    expect(result.address).toBeNull();
  });

  it('returns empty consultationDate when encounters is empty (line 197)', async () => {
    const visit = makeVisit();
    visit.encounters = [];
    mockGet.mockResolvedValue(visit);
    const result = await getVisitPrescriptionData('visit-uuid-1');
    expect(result.consultationDate).toBe('');
  });

  it('uses first identifier as patientId when no OpenMRS ID found', async () => {
    const visit = makeVisit();
    visit.patient.identifiers = [{ identifier: 'ALT-999', identifierType: { display: 'Other ID' } }];
    mockGet.mockResolvedValue(visit);
    const result = await getVisitPrescriptionData('visit-uuid-1');
    expect(result.patientId).toBe('ALT-999');
  });

  it('returns empty patientId when patient has no identifiers (line 259)', async () => {
    const visit = makeVisit();
    visit.patient.identifiers = [];
    mockGet.mockResolvedValue(visit);
    const result = await getVisitPrescriptionData('visit-uuid-1');
    expect(result.patientId).toBe('');
  });

  it('sorts multiple encounters by date for consultationDate (lines 279-280)', async () => {
    const visit = makeVisit();
    visit.encounters = [
      { encounterDatetime: '2026-03-10T08:00:00', encounterType: { display: 'Visit Note' }, obs: [], encounterProviders: [] },
      { encounterDatetime: '2026-03-15T10:00:00', encounterType: { display: 'Visit Note' }, obs: [], encounterProviders: [] },
      { encounterDatetime: '2026-03-12T09:00:00', encounterType: { display: 'Visit Note' }, obs: [], encounterProviders: [] },
    ];
    mockGet.mockResolvedValue(visit);
    const result = await getVisitPrescriptionData('visit-uuid-1');
    expect(result.consultationDate).toContain('15');
  });

  it('maps unknown gender as-is', async () => {
    const visit = makeVisit();
    visit.patient.person.gender = 'O';
    mockGet.mockResolvedValue(visit);
    const result = await getVisitPrescriptionData('visit-uuid-1');
    expect(result.gender).toBe('O');
  });
});
