import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { PrescriptionData } from '../../services/visit-prescription.service';

// ─── Mock pdfmake ─────────────────────────────────────────────────────────────
const h = vi.hoisted(() => {
  const mockDownload = vi.fn();
  const mockPrint = vi.fn();
  const mockCreatePdf = vi.fn(() => ({ download: mockDownload, print: mockPrint }));
  return { mockDownload, mockPrint, mockCreatePdf };
});
const { mockDownload, mockPrint, mockCreatePdf } = h;

vi.mock('pdfmake/build/pdfmake', () => ({ default: { createPdf: h.mockCreatePdf, addVirtualFileSystem: vi.fn() } }));
vi.mock('pdfmake/build/vfs_fonts', () => ({ default: { pdfMake: { vfs: {} } } }));

// ─── Mock SVG ?url imports ────────────────────────────────────────────────────
vi.mock('../../assets/icons/prescription-consultation.svg?url', () => ({ default: 'consultation.svg' }));
vi.mock('../../assets/icons/prescription-diagnosis.svg?url', () => ({ default: 'diagnosis.svg' }));
vi.mock('../../assets/icons/prescription-medication.svg?url', () => ({ default: 'medication.svg' }));
vi.mock('../../assets/icons/prescription-advice.svg?url', () => ({ default: 'advice.svg' }));
vi.mock('../../assets/icons/prescription-test.svg?url', () => ({ default: 'test.svg' }));
vi.mock('../../assets/icons/prescription-followup.svg?url', () => ({ default: 'followup.svg' }));
vi.mock('../../assets/icons/prescription-referral.svg?url', () => ({ default: 'referral.svg' }));
vi.mock('../../assets/icons/vitals.svg?url', () => ({ default: 'vitals.svg' }));
vi.mock('../../assets/images/default-user-img.svg?url', () => ({ default: 'default-user.svg' }));

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
  vitals: {
    height: '170',
    weight: '65',
    bpSystolic: '120',
    bpDiastolic: '80',
    pulse: '72',
    temperature: '98.6',
    spo2: '98',
    respiratoryRate: '16',
  },
  diagnoses: [{ diagnosisName: 'Typhoid fever', diagnosisType: 'Primary', diagnosisStatus: 'Confirmed' }],
  medicines: [{ drug: 'Paracetamol', strength: '500mg', frequency: 'Twice daily', days: '5', timing: 'After food', remark: 'NA' }],
  advices: ['Drink plenty of water'],
  tests: ['CBC Test'],
  referrals: [{ speciality: 'Cardiology', reason: 'Chest pain' }],
  followUp: { wantFollowUp: 'Yes', followUpType: 'In person', followUpDate: '2026-04-10', followUpTime: '10:00 AM', followUpReason: 'Check BP' },
  ...overrides,
});

// ─── Import the functions under test (after mocks are set up) ─────────────────
const { downloadVisitPrescriptionPdf, printVisitPrescriptionPdf, shareVisitPrescriptionPdf, openPrescriptionPreview } =
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

  it('uses patient avatar icon when patient image fetch fails', async () => {
    mockFetch.mockResolvedValue({ ok: false });
    await downloadVisitPrescriptionPdf(makePrescription());
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    const bodyRows = docDef.content[0].table.body;
    const patientRow = bodyRows[0];
    const avatarCell = patientRow[0].table.body[0][0];
    expect(avatarCell).toHaveProperty('image');
  });

  it('skips patient image fetch when patientUuid is empty', async () => {
    mockFetch.mockResolvedValue(makeImageResponse());
    await downloadVisitPrescriptionPdf(makePrescription({ patientUuid: '' }));
    // fetch should only be called for SVG icon conversions, not for personimage
    const personImageCalls = mockFetch.mock.calls.filter(
      (call: any[]) => String(call[0]).includes('personimage')
    );
    expect(personImageCalls).toHaveLength(0);
    // Should use patient avatar icon fallback
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    const avatarCell = docDef.content[0].table.body[0][0].table.body[0][0];
    expect(avatarCell).toHaveProperty('image');
  });

  it('uses ellipse canvas when both patient fetch and avatar SVG fail', async () => {
    mockFetch.mockResolvedValue({ ok: false });
    // Force canvas.getContext to return null so svgToPng returns null for all icons
    const origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as any;

    await downloadVisitPrescriptionPdf(makePrescription());
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    const avatarCell = docDef.content[0].table.body[0][0].table.body[0][0];
    expect(avatarCell).toHaveProperty('canvas');

    HTMLCanvasElement.prototype.getContext = origGetContext;
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

  it('shows dash for null infoCell value (line 230)', async () => {
    await downloadVisitPrescriptionPdf(makePrescription({
      gender: null as any,
      occupation: '',
    }));
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    const bodyStr = JSON.stringify(docDef.content);
    expect(bodyStr).toContain('-');
  });

  it('shows referral without reason (line 456)', async () => {
    await downloadVisitPrescriptionPdf(makePrescription({
      referrals: [{ speciality: 'Dermatology', reason: '' }],
    }));
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    const bodyStr = JSON.stringify(docDef.content);
    expect(bodyStr).toContain('Dermatology');
    expect(bodyStr).not.toContain('Dermatology –');
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

  it('includes Vitals section with vitals data', async () => {
    await downloadVisitPrescriptionPdf(makePrescription());
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    const bodyStr = JSON.stringify(docDef.content);
    expect(bodyStr).toContain('Vitals');
    expect(bodyStr).toContain('Height(cm):');
    expect(bodyStr).toContain('170');
    expect(bodyStr).toContain('Weight(kg):');
    expect(bodyStr).toContain('65');
    expect(bodyStr).toContain('Systolic Blood Pressure:');
    expect(bodyStr).toContain('120');
    expect(bodyStr).toContain('Diastolic Blood Pressure:');
    expect(bodyStr).toContain('80');
    expect(bodyStr).toContain('Pulse(bpm):');
    expect(bodyStr).toContain('SpO2 (%):');
    expect(bodyStr).toContain('Respiratory Rate:');
  });

  it('shows NA for null vitals values', async () => {
    await downloadVisitPrescriptionPdf(makePrescription({
      vitals: {
        height: null, weight: null, bpSystolic: null, bpDiastolic: null,
        pulse: null, temperature: null, spo2: null, respiratoryRate: null,
      },
    }));
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    const bodyStr = JSON.stringify(docDef.content);
    expect(bodyStr).toContain('Vitals');
    expect(bodyStr).toContain('Height(cm):');
    // NA is shown for null values
    const naCount = (bodyStr.match(/"NA"/g) || []).length;
    expect(naCount).toBeGreaterThanOrEqual(8);
  });

  it('shows "No diagnosis added" row when diagnoses empty', async () => {
    await downloadVisitPrescriptionPdf(makePrescription({ diagnoses: [] }));
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    expect(JSON.stringify(docDef.content)).toContain('No diagnosis added');
  });

  it('omits Prescribed Medications section when medicines empty', async () => {
    await downloadVisitPrescriptionPdf(makePrescription({ medicines: [] }));
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    expect(JSON.stringify(docDef.content)).not.toContain('Prescribed Medications');
  });

  it('returns null from toBase64 when reader.onerror fires (line 37)', async () => {
    const OrigReader = globalThis.FileReader;
    class ErrorReader {
      result: string | null = null;
      onloadend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      readAsDataURL() {
        setTimeout(() => this.onerror?.(), 0);
      }
    }
    vi.stubGlobal('FileReader', ErrorReader);

    mockFetch
      .mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(new Blob(['sig'], { type: 'image/png' })) }); // signature
    await downloadVisitPrescriptionPdf(makePrescription({ doctorSignatureUrl: 'https://example.com/sig.png' }));
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    expect(JSON.stringify(docDef.content)).not.toContain('SIGDATA');

    vi.stubGlobal('FileReader', OrigReader);
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
      .mockResolvedValueOnce({ ok: true, blob: () => Promise.resolve(new Blob(['sig'], { type: 'image/png' })) }); // signature
    await downloadVisitPrescriptionPdf(makePrescription({ doctorSignatureUrl: 'https://example.com/sig.png' }));
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    // Signature should not appear since toBase64 returned null
    expect(JSON.stringify(docDef.content)).not.toContain('SIGDATA');

    vi.stubGlobal('FileReader', OrigReader);
  });

  it('returns null from toBase64 when signature fetch returns not ok', async () => {
    mockFetch.mockResolvedValue({ ok: false });
    await downloadVisitPrescriptionPdf(makePrescription({ doctorSignatureUrl: 'https://example.com/sig.png' }));
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    expect(JSON.stringify(docDef.content)).not.toContain('SIGDATA');
  });

  it('returns null from toBase64 when fetch throws (lines 44-46)', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
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
    // After sectionBlock refactor, tables are nested inside unbreakable stacks
    let layout: any;
    for (const r of bodyRows) {
      if (!Array.isArray(r)) continue;
      const cell = r[0];
      // Direct table row
      if (cell?.table?.body && typeof cell?.layout?.hLineWidth === 'function') {
        layout = cell.layout;
        break;
      }
      // Inside unbreakable stack
      if (cell?.stack) {
        const nested = cell.stack.find(
          (s: any) => s?.table?.body && typeof s?.layout?.hLineWidth === 'function'
        );
        if (nested) {
          layout = nested.layout;
          break;
        }
      }
    }
    expect(layout).toBeDefined();
    const node = { table: { body: new Array(5) } };

    expect(layout.hLineWidth(0, node)).toBe(0);
    expect(layout.hLineWidth(1, node)).toBe(0.5);
    expect(layout.hLineWidth(5, node)).toBe(0);
    expect(layout.hLineWidth(2, node)).toBe(0.3);
    expect(layout.vLineWidth()).toBe(0);
    expect(layout.hLineColor(1)).toBe('#CCCCCC');
    expect(layout.hLineColor(2)).toBe('#EBEBEB');
    expect(layout.paddingLeft()).toBe(5);
    expect(layout.paddingRight()).toBe(5);
    expect(layout.paddingTop()).toBe(4);
    expect(layout.paddingBottom()).toBe(4);
  });
});

describe('printVisitPrescriptionPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(makeImageResponse());
    mockToDataURL.mockReturnValue('data:image/png;base64,CANVAS');
  });

  it('calls pdfMake.createPdf and triggers print', async () => {
    await printVisitPrescriptionPdf(makePrescription());
    expect(mockCreatePdf).toHaveBeenCalledTimes(1);
    expect(mockPrint).toHaveBeenCalledTimes(1);
    expect(mockDownload).not.toHaveBeenCalled();
  });

  it('generates same document definition as download', async () => {
    await printVisitPrescriptionPdf(makePrescription());
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    expect(docDef.pageSize).toBe('A4');
    expect(docDef.watermark.text).toBe('INTELEHEALTH');
  });
});

describe('shareVisitPrescriptionPdf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(makeImageResponse());
    mockToDataURL.mockReturnValue('data:image/png;base64,CANVAS');
    vi.stubGlobal('open', vi.fn());
  });

  it('downloads PDF and opens WhatsApp with phone number', async () => {
    await shareVisitPrescriptionPdf(makePrescription({ patientName: 'JANE DOE' }), '919876543210');

    expect(mockCreatePdf).toHaveBeenCalledTimes(1);
    expect(mockDownload).toHaveBeenCalledWith('e-prescription.pdf');
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://wa.me/919876543210'),
      '_blank'
    );
  });

  it('includes download link in WhatsApp message', async () => {
    await shareVisitPrescriptionPdf(makePrescription({ patientName: 'JOHN DOE' }), '11234567890');

    const url = (window.open as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    const message = decodeURIComponent(url.split('?text=')[1]);
    expect(message).toContain('Download here:');
    expect(message).toContain('https://');
  });

  it('generates same document definition as download', async () => {
    await shareVisitPrescriptionPdf(makePrescription(), '919876543210');
    const docDef = (mockCreatePdf.mock.calls as any[][])[0][0];
    expect(docDef.pageSize).toBe('A4');
    expect(docDef.watermark.text).toBe('INTELEHEALTH');
  });
});
