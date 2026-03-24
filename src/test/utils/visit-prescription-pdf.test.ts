import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { PrescriptionData } from '../../services/visit-prescription.service';

// ─── Mock pdfmake ─────────────────────────────────────────────────────────────
const h = vi.hoisted(() => {
  const mockDownload = vi.fn();
  const mockCreatePdf = vi.fn(() => ({ download: mockDownload }));
  return { mockDownload, mockCreatePdf };
});
const { mockDownload, mockCreatePdf } = h;

vi.mock('pdfmake/build/pdfmake', () => ({ default: { createPdf: h.mockCreatePdf, vfs: {} } }));
vi.mock('pdfmake/build/vfs_fonts', () => ({ default: { pdfMake: { vfs: {} } } }));

// ─── Mock SVG ?url imports ────────────────────────────────────────────────────
vi.mock('../../assets/icons/prescription-consultation.svg?url', () => ({ default: 'consultation.svg' }));
vi.mock('../../assets/icons/prescription-diagnosis.svg?url', () => ({ default: 'diagnosis.svg' }));
vi.mock('../../assets/icons/prescription-medication.svg?url', () => ({ default: 'medication.svg' }));
vi.mock('../../assets/icons/prescription-advice.svg?url', () => ({ default: 'advice.svg' }));
vi.mock('../../assets/icons/prescription-test.svg?url', () => ({ default: 'test.svg' }));
vi.mock('../../assets/icons/prescription-followup.svg?url', () => ({ default: 'followup.svg' }));
vi.mock('../../assets/icons/prescription-referral.svg?url', () => ({ default: 'referral.svg' }));

// ─── Mock browser APIs ────────────────────────────────────────────────────────

// fetch → returns image blob
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// FileReader → immediately calls onloadend with a data URL
class MockFileReader {
  result: string | null = null;
  onloadend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  readAsDataURL(blob: Blob) {
    // Simulate async behaviour
    const mime = (blob as any).type || 'image/png';
    this.result = `data:${mime};base64,AAAA`;
    setTimeout(() => this.onloadend?.(), 0);
  }
}
vi.stubGlobal('FileReader', MockFileReader);

// HTMLCanvasElement.getContext → returns a minimal 2d context
const mockDrawImage = vi.fn();
const mockToDataURL = vi.fn(() => 'data:image/png;base64,CANVAS');
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  drawImage: mockDrawImage,
})) as any;
HTMLCanvasElement.prototype.toDataURL = mockToDataURL;

// Image → fires onload immediately when src is set
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  private _src = '';
  get src() { return this._src; }
  set src(v: string) { this._src = v; setTimeout(() => this.onload?.(), 0); }
}
vi.stubGlobal('Image', MockImage);

// window.open
vi.stubGlobal('open', vi.fn());

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeImageResponse(mime = 'image/png') {
  return {
    ok: true,
    blob: () => Promise.resolve(new Blob(['img'], { type: mime })),
  };
}

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
  diagnoses: [{ diagnosisName: 'Typhoid fever', diagnosisType: 'Primary', diagnosisStatus: 'Confirmed' }],
  medicines: [{ drug: 'Paracetamol', strength: '500mg', frequency: 'Twice daily', days: '5', timing: 'After food', remark: 'NA' }],
  advices: ['Drink plenty of water'],
  tests: ['CBC Test'],
  referrals: [{ speciality: 'Cardiology', reason: 'Chest pain' }],
  followUp: { wantFollowUp: 'Yes', followUpType: 'In person', followUpDate: '2026-04-10', followUpTime: '10:00 AM', followUpReason: 'Check BP' },
  ...overrides,
});

// ─── Import the functions under test (after mocks are set up) ─────────────────
const { downloadVisitPrescriptionPdf, openPrescriptionPreview } =
  await import('../../utils/visit-prescription-pdf');

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('openPrescriptionPreview', () => {
  it('opens a new tab with the correct URL', () => {
    openPrescriptionPreview('visit-abc');
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('#/prescription-preview?visitUuid=visit-abc'),
      '_blank'
    );
  });
});

describe('downloadVisitPrescriptionPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: patient image fetch succeeds
    mockFetch.mockResolvedValue(makeImageResponse());
    mockToDataURL.mockReturnValue('data:image/png;base64,CANVAS');
  });

  it('calls pdfMake.createPdf and triggers download', async () => {
    await downloadVisitPrescriptionPdf(makePrescription());
    expect(mockCreatePdf).toHaveBeenCalledTimes(1);
    expect(mockDownload).toHaveBeenCalledWith('e-prescription.pdf');
  });

  it('passes correct pageSize and orientation', async () => {
    await downloadVisitPrescriptionPdf(makePrescription());
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    expect(docDef.pageSize).toBe('A4');
    expect(docDef.pageOrientation).toBe('portrait');
  });

  it('includes watermark', async () => {
    await downloadVisitPrescriptionPdf(makePrescription());
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    expect(docDef.watermark.text).toBe('INTELEHEALTH');
  });

  it('uses canvas PNG for patient avatar when fetch succeeds', async () => {
    await downloadVisitPrescriptionPdf(makePrescription());
    expect(mockDrawImage).toHaveBeenCalled();
  });

  it('uses ellipse canvas for patient avatar when fetch fails', async () => {
    mockFetch.mockResolvedValue({ ok: false });
    await downloadVisitPrescriptionPdf(makePrescription());
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    const bodyRows = docDef.content[0].table.body;
    const patientRow = bodyRows[0];
    const avatarCell = patientRow[0].table.body[0][0];
    expect(avatarCell).toHaveProperty('canvas');
  });

  it('includes signature image when doctorSignatureUrl is a data URL', async () => {
    const sig = 'data:image/png;base64,SIGDATA';
    await downloadVisitPrescriptionPdf(makePrescription({ doctorSignatureUrl: sig }));
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    const bodyStr = JSON.stringify(docDef.content);
    expect(bodyStr).toContain('SIGDATA');
  });

  it('fetches and uses signature when doctorSignatureUrl is a URL', async () => {
    mockFetch
      .mockResolvedValueOnce(makeImageResponse()) // patient image
      .mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(new Blob(['sig'], { type: 'application/octet-stream' })) }); // signature
    await downloadVisitPrescriptionPdf(makePrescription({ doctorSignatureUrl: 'https://example.com/sig.png' }));
    expect(mockCreatePdf).toHaveBeenCalled();
    expect(mockDownload).toHaveBeenCalledWith('e-prescription.pdf');
  });

  it('omits signature block when doctorSignatureUrl is null', async () => {
    await downloadVisitPrescriptionPdf(makePrescription({ doctorSignatureUrl: null }));
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    const bodyStr = JSON.stringify(docDef.content);
    expect(bodyStr).not.toContain('SIGDATA');
  });

  it('includes Advice section when advices present', async () => {
    await downloadVisitPrescriptionPdf(makePrescription({ advices: ['Rest well'] }));
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    const bodyStr = JSON.stringify(docDef.content);
    expect(bodyStr).toContain('Advice');
    expect(bodyStr).toContain('Rest well');
  });

  it('omits Advice section when advices empty', async () => {
    await downloadVisitPrescriptionPdf(makePrescription({ advices: [] }));
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    const bodyStr = JSON.stringify(docDef.content);
    expect(bodyStr).not.toContain('"Advice"');
  });

  it('includes Tests section when tests present', async () => {
    await downloadVisitPrescriptionPdf(makePrescription({ tests: ['MRI Scan'] }));
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    expect(JSON.stringify(docDef.content)).toContain('MRI Scan');
  });

  it('omits Tests section when tests empty', async () => {
    await downloadVisitPrescriptionPdf(makePrescription({ tests: [] }));
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    expect(JSON.stringify(docDef.content)).not.toContain('Tests Recommended');
  });

  it('includes Referral section when referrals present', async () => {
    await downloadVisitPrescriptionPdf(makePrescription());
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    expect(JSON.stringify(docDef.content)).toContain('Referred Specialist');
    expect(JSON.stringify(docDef.content)).toContain('Cardiology');
  });

  it('omits Referral section when referrals empty', async () => {
    await downloadVisitPrescriptionPdf(makePrescription({ referrals: [] }));
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    expect(JSON.stringify(docDef.content)).not.toContain('Referred Specialist');
  });

  it('shows "No" for follow-up when followUp is null', async () => {
    await downloadVisitPrescriptionPdf(makePrescription({ followUp: null }));
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    expect(JSON.stringify(docDef.content)).toContain('No');
  });

  it('footer returns disclaimer on last page', async () => {
    await downloadVisitPrescriptionPdf(makePrescription());
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    const footer = docDef.footer(2, 2); // last page
    expect(footer.columns[0].text).toContain('telemedicine');
  });

  it('footer returns empty string on non-last page', async () => {
    await downloadVisitPrescriptionPdf(makePrescription());
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    const footer = docDef.footer(1, 2); // not last page
    expect(footer.columns[0].text).toBe('');
  });

  it('footer shows page number', async () => {
    await downloadVisitPrescriptionPdf(makePrescription());
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    const footer = docDef.footer(1, 3);
    expect(footer.columns[1].text).toBe('1 of 3');
  });

  it('shows "No diagnosis added" row when diagnoses empty', async () => {
    await downloadVisitPrescriptionPdf(makePrescription({ diagnoses: [] }));
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    expect(JSON.stringify(docDef.content)).toContain('No diagnosis added');
  });

  it('shows "No medicines added" row when medicines empty', async () => {
    await downloadVisitPrescriptionPdf(makePrescription({ medicines: [] }));
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    expect(JSON.stringify(docDef.content)).toContain('No medicines added');
  });

  it('returns null from toBase64 when reader result does not start with data: (lines 29-31)', async () => {
    // Override MockFileReader to produce a non-data: result
    const OrigReader = globalThis.FileReader;
    class BadResultReader {
      result: string | null = null;
      onloadend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readAsDataURL() {
        this.result = 'blob:http://localhost/bad';
        setTimeout(() => this.onloadend?.(), 0);
      }
    }
    vi.stubGlobal('FileReader', BadResultReader);

    // Signature URL triggers toBase64 with forceImageMime=true
    mockFetch
      .mockResolvedValueOnce(makeImageResponse()) // patient avatar
      .mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(new Blob(['sig'], { type: 'image/png' })) }); // signature
    await downloadVisitPrescriptionPdf(makePrescription({ doctorSignatureUrl: 'https://example.com/sig.png' }));
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    // Signature should not appear since toBase64 returned null
    expect(JSON.stringify(docDef.content)).not.toContain('SIGDATA');

    vi.stubGlobal('FileReader', OrigReader);
  });

  it('returns null from toBase64 when fetch throws (lines 40-41)', async () => {
    mockFetch
      .mockResolvedValueOnce(makeImageResponse()) // patient avatar
      .mockRejectedValueOnce(new Error('Network error')); // signature fetch throws
    await downloadVisitPrescriptionPdf(makePrescription({ doctorSignatureUrl: 'https://example.com/sig.png' }));
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    expect(JSON.stringify(docDef.content)).not.toContain('SIGDATA');
    expect(mockDownload).toHaveBeenCalledWith('e-prescription.pdf');
  });

  it('returns null from svgToPng when getContext returns null (lines 54-56)', async () => {
    // Override getContext to return null
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as any;

    await downloadVisitPrescriptionPdf(makePrescription());
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    // Section headers still present even though icons are null
    expect(JSON.stringify(docDef.content)).toContain('Consultation details');

    HTMLCanvasElement.prototype.getContext = origGetContext;
  });

  it('uses ellipse canvas for section icon when svgToPng returns null', async () => {
    // Force canvas.toDataURL to return null so svgToPng resolves null → icon = null → hits line 60
    mockToDataURL.mockReturnValue(null as any);
    await downloadVisitPrescriptionPdf(makePrescription());
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    // The section headers should still be present, just using canvas fallback
    expect(JSON.stringify(docDef.content)).toContain('Consultation details');
  });

  it('tableLayout hLineWidth returns 0 for first row, 0.5 for header, 0 for last row, 0.3 for others', async () => {
    await downloadVisitPrescriptionPdf(makePrescription());
    expect(mockCreatePdf).toHaveBeenCalled();
    const calls = mockCreatePdf.mock.calls as any[][];
    const docDef = calls[0][0];
    const bodyRows: any[] = docDef.content[0].table.body;
    const diagnosisContentRow = bodyRows.find((r: any) =>
      Array.isArray(r) && r[0]?.table?.body && typeof r[0]?.layout?.hLineWidth === 'function'
    );
    expect(diagnosisContentRow).toBeDefined();
    const layout = diagnosisContentRow![0].layout;
    const node = { table: { body: new Array(5) } };

    expect(layout.hLineWidth(0, node)).toBe(0);
    expect(layout.hLineWidth(1, node)).toBe(0.5);
    expect(layout.hLineWidth(5, node)).toBe(0);
    expect(layout.hLineWidth(2, node)).toBe(0.3);
    expect(layout.vLineWidth()).toBe(0);
    expect(layout.hLineColor(1)).toBe('#CCCCCC');
    expect(layout.hLineColor(2)).toBe('#EBEBEB');
    expect(layout.paddingLeft()).toBe(6);
    expect(layout.paddingRight()).toBe(6);
    expect(layout.paddingTop()).toBe(4);
    expect(layout.paddingBottom()).toBe(4);
  });
});
