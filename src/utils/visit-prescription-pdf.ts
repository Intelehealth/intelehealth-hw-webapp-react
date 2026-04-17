/* eslint-disable @typescript-eslint/no-explicit-any */
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from './pdfmake-vfs';
import type { PrescriptionData } from '../services/visit-prescription.service';
import iconConsultationUrl from '../assets/icons/prescription-consultation.svg?url';
import iconDiagnosisUrl from '../assets/icons/prescription-diagnosis.svg?url';
import iconMedicationUrl from '../assets/icons/prescription-medication.svg?url';
import iconAdviceUrl from '../assets/icons/prescription-advice.svg?url';
import iconTestUrl from '../assets/icons/prescription-test.svg?url';
import iconFollowupUrl from '../assets/icons/prescription-followup.svg?url';
import iconReferralUrl from '../assets/icons/prescription-referral.svg?url';
import iconVitalsUrl from '../assets/icons/vitals.svg?url';
import defaultUserImgUrl from '../assets/images/default-user-img.svg?url';

/* c8 ignore next 2 */
const vfsData = (pdfFonts as any).pdfMake?.vfs ?? (pdfFonts as any).vfs ?? {};
(pdfMake as any).addVirtualFileSystem(vfsData);

async function toBase64(
  url: string,
  forceImageMime = false
): Promise<string | null> {
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) return null;
    const blob = await res.blob();
    /* c8 ignore next */
    if (!forceImageMime && !blob.type.startsWith('image/')) return null;
    return await new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => {
        let r = reader.result as string;
        if (!r?.startsWith('data:')) {
          resolve(null);
          return;
        }
        if (forceImageMime && !r.startsWith('data:image/'))
          r = r.replace(/^data:[^;]+;/, 'data:image/png;');
        resolve(r);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// SVG URL → PNG via canvas (pdfmake cannot render SVG)
async function svgToPng(svgUrl: string, size = 28): Promise<string | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas.toDataURL('image/png'));
    };
    /* c8 ignore next */
    img.onerror = () => resolve(null);
    img.src = svgUrl;
  });
}

const m4 = (a: number, b: number, c: number, d: number) =>
  [a, b, c, d] as [number, number, number, number];

function bulletRow(label: string, value: string | null | undefined) {
  return {
    columns: [
      { text: `• ${label}`, color: '#555555', fontSize: 8, width: 170 },
      { text: value || 'NA', color: '#1A1A2E', fontSize: 8 },
    ],
    margin: m4(0, 4, 0, 0),
  };
}

function sectionHeaderInline(title: string, icon: string | null) {
  const iconCell = icon
    ? { image: icon, width: 20, height: 20, margin: m4(0, 1, 0, 0) }
    : {
        canvas: [
          { type: 'ellipse', x: 10, y: 10, r1: 10, r2: 10, color: '#2E1E91' },
        ],
        width: 20,
        height: 20,
      };
  return {
    columns: [
      iconCell,
      {
        text: title,
        bold: true,
        fontSize: 11,
        color: '#1A1A2E',
        margin: m4(5, 2, 0, 0),
      },
    ],
    columnGap: 0,
    margin: m4(0, 8, 0, 0),
  };
}

function dividerInline() {
  return {
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 0,
        x2: 535,
        y2: 0,
        lineWidth: 0.5,
        lineColor: '#E0E0E0',
      },
    ],
    margin: m4(0, 2, 0, 3),
  };
}

function contentRow(content: any) {
  return [{ colSpan: 4, ...content }, '', '', ''];
}

/** Wraps section header + divider + content into a single unbreakable row */
function sectionBlock(title: string, icon: string | null, content: any) {
  return contentRow({
    unbreakable: true,
    stack: [sectionHeaderInline(title, icon), dividerInline(), content],
  });
}

const tableLayout = {
  hLineWidth: (i: number, node: any) =>
    i === 0 ? 0 : i === 1 ? 0.5 : i === node.table.body.length ? 0 : 0.3,
  vLineWidth: () => 0,
  hLineColor: (i: number) => (i === 1 ? '#CCCCCC' : '#EBEBEB'),
  paddingLeft: () => 5,
  paddingRight: () => 5,
  paddingTop: () => 4,
  paddingBottom: () => 4,
};

export function openPrescriptionPreview(visitUuid: string): void {
  window.open(
    `${window.location.origin}${window.location.pathname}#/prescription-preview?visitUuid=${visitUuid}`,
    '_blank'
  );
}

async function buildPrescriptionDocDef(data: PrescriptionData): Promise<any> {
  const [
    iConsultation,
    iDiagnosis,
    iMedication,
    iAdvice,
    iTest,
    iFollowup,
    iReferral,
    iVitals,
    iPatientAvatar,
  ] = await Promise.all([
    svgToPng(iconConsultationUrl),
    svgToPng(iconDiagnosisUrl),
    svgToPng(iconMedicationUrl),
    svgToPng(iconAdviceUrl),
    svgToPng(iconTestUrl),
    svgToPng(iconFollowupUrl),
    svgToPng(iconReferralUrl),
    svgToPng(iconVitalsUrl),
    svgToPng(defaultUserImgUrl, 32),
  ]);

  const signatureB64 = data.doctorSignatureUrl
    ? data.doctorSignatureUrl.startsWith('data:')
      ? data.doctorSignatureUrl
      : await toBase64(data.doctorSignatureUrl, true)
    : null;

  const avatarImg = iPatientAvatar;
  const patientAvatar = avatarImg
    ? { image: avatarImg, width: 32, height: 32, margin: m4(0, 4, 6, 4) }
    : {
        canvas: [
          { type: 'ellipse', x: 16, y: 16, r1: 16, r2: 16, color: '#C5CAE9' },
        ],
        width: 32,
        height: 32,
        margin: m4(0, 4, 6, 4),
      };

  const cell9 = (t: string) => ({ text: t, fontSize: 8 });
  const noData = (msg: string, span: number) => [
    [
      {
        text: msg,
        colSpan: span,
        alignment: 'center',
        fontSize: 9,
        color: '#888',
      },
      ...Array(span - 1).fill(''),
    ],
  ];

  const diagnosisRows = data.diagnoses.length
    ? data.diagnoses.map(d => [
        cell9(d.diagnosisName),
        cell9(d.diagnosisType),
        cell9(d.diagnosisStatus),
      ])
    : noData('No diagnosis added', 3);

  const medicineRows = data.medicines.length
    ? data.medicines.map(m => [
        cell9(m.drug),
        cell9(m.strength),
        cell9(m.frequency),
        cell9(m.days),
        cell9(m.timing),
        cell9(m.remark),
      ])
    : noData('No medicines added', 6);

  const infoCell = (label: string, value: string | null | undefined) => ({
    stack: [
      { text: label, color: '#9E9E9E', fontSize: 7, margin: m4(0, 0, 0, 1) },
      { text: value || '-', fontSize: 8, bold: true, color: '#212121' },
    ],
    margin: m4(0, 3, 0, 3),
  });

  const sigItems: any[] = [];
  if (signatureB64)
    sigItems.push({
      image: signatureB64,
      width: 100,
      height: 52,
      margin: m4(0, 0, 0, 4),
    });
  if (data.doctorName)
    sigItems.push({
      text: data.doctorName,
      fontSize: 9,
      bold: true,
      color: '#1A1A2E',
    });
  if (data.doctorQualification)
    sigItems.push({
      text: data.doctorQualification,
      fontSize: 8,
      color: '#555',
    });
  if (data.doctorRegNumber)
    sigItems.push({
      text: `Registration No: ${data.doctorRegNumber}`,
      fontSize: 8,
      color: '#555',
    });

  const bodyRows: any[] = [
    // Patient header
    [
      {
        table: {
          widths: ['auto', '*'],
          body: [
            [
              patientAvatar,
              {
                stack: [
                  {
                    text: data.patientName,
                    bold: true,
                    fontSize: 10,
                    color: '#1A1A2E',
                    margin: m4(0, 4, 0, 1),
                  },
                  { text: data.patientId, fontSize: 8, color: '#7B7FA6' },
                ],
              },
            ],
          ],
        },
        layout: 'noBorders',
      },
      {
        columns: [
          {
            canvas: [
              {
                type: 'line',
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 45,
                lineWidth: 1,
                lineColor: '#E0E0E0',
              },
            ],
            width: 8,
            margin: m4(0, 3, 0, 0),
          },
          {
            stack: [infoCell('Gender', data.gender), infoCell('Age', data.age)],
          },
        ],
        columnGap: 0,
      },
      {
        columns: [
          {
            canvas: [
              {
                type: 'line',
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 45,
                lineWidth: 1,
                lineColor: '#E0E0E0',
              },
            ],
            width: 8,
            margin: m4(0, 3, 0, 0),
          },
          {
            stack: [
              infoCell('Address', data.address),
              infoCell('Occupation', data.occupation),
            ],
          },
        ],
        columnGap: 0,
      },
      {
        columns: [
          {
            canvas: [
              {
                type: 'line',
                x1: 0,
                y1: 0,
                x2: 0,
                y2: 45,
                lineWidth: 1,
                lineColor: '#E0E0E0',
              },
            ],
            width: 8,
            margin: m4(0, 3, 0, 0),
          },
          {
            stack: [
              infoCell('National ID', data.nationalId),
              infoCell('Contact no.', data.phone),
            ],
          },
        ],
        columnGap: 0,
      },
    ],
    sectionBlock('Vitals', iVitals, {
      margin: m4(30, 0, 0, 4),
      stack: [
        bulletRow('Height(cm):', data.vitals.height),
        bulletRow('Weight(kg):', data.vitals.weight),
        bulletRow('Systolic Blood Pressure:', data.vitals.bpSystolic),
        bulletRow('Diastolic Blood Pressure:', data.vitals.bpDiastolic),
        bulletRow('Pulse(bpm):', data.vitals.pulse),
        bulletRow('Temperature (F):', data.vitals.temperature),
        bulletRow('SpO2 (%):', data.vitals.spo2),
        bulletRow('Respiratory Rate:', data.vitals.respiratoryRate),
      ],
    }),
    sectionBlock('Consultation details', iConsultation, {
      margin: m4(30, 0, 0, 4),
      stack: [
        bulletRow('Patient Id', data.patientId),
        bulletRow('Prescription Issued', data.consultationDate),
      ],
    }),
    sectionBlock('Diagnosis', iDiagnosis, {
      margin: m4(30, 0, 0, 4),
      table: {
        widths: ['55%', '20%', '25%'],
        headerRows: 1,
        body: [
          [
            { text: 'Diagnosis', style: 'tHeader' },
            { text: 'Type', style: 'tHeader' },
            { text: 'Status', style: 'tHeader' },
          ],
          ...diagnosisRows,
        ],
      },
      layout: tableLayout,
    }),
  ];

  if (data.medicines.length > 0) {
    bodyRows.push(
      sectionBlock('Prescribed Medications', iMedication, {
        margin: m4(30, 0, 0, 4),
        table: {
          widths: ['*', 'auto', 'auto', 'auto', 'auto', 'auto'],
          headerRows: 1,
          body: [
            [
              { text: 'Medicine', style: 'tHeader' },
              { text: 'Strength', style: 'tHeader' },
              { text: 'Frequency', style: 'tHeader' },
              { text: 'Duration', style: 'tHeader' },
              { text: 'Timing', style: 'tHeader' },
              { text: 'Remarks', style: 'tHeader' },
            ],
            ...medicineRows,
          ],
        },
        layout: tableLayout,
      })
    );
  }

  if (data.advices.length > 0) {
    bodyRows.push(
      sectionBlock('Advice', iAdvice, {
        margin: m4(30, 0, 0, 4),
        ul: data.advices.map(a => ({
          text: a,
          fontSize: 8,
          margin: m4(0, 2, 0, 0),
        })),
      })
    );
  }
  if (data.tests.length > 0) {
    bodyRows.push(
      sectionBlock('Tests Recommended', iTest, {
        margin: m4(30, 0, 0, 4),
        ul: data.tests.map(t => ({
          text: t,
          fontSize: 8,
          margin: m4(0, 2, 0, 0),
        })),
      })
    );
  }
  if (data.referrals.length > 0) {
    bodyRows.push(
      sectionBlock('Referred Specialist', iReferral, {
        margin: m4(30, 0, 0, 4),
        ul: data.referrals.map(r => ({
          text: r.speciality + (r.reason ? ` – ${r.reason}` : ''),
          fontSize: 8,
          margin: m4(0, 2, 0, 0),
        })),
      })
    );
  }

  // Follow-up + Signature combined as unbreakable
  bodyRows.push(
    contentRow({
      unbreakable: true,
      stack: [
        sectionHeaderInline('Follow-up', iFollowup),
        dividerInline(),
        {
          margin: m4(30, 0, 0, 4),
          stack: [
            bulletRow(
              'Follow-up suggested',
              data.followUp?.wantFollowUp ?? 'No'
            ),
            bulletRow('Follow-up Date', data.followUp?.followUpDate ?? null),
            bulletRow('Follow-up Time', data.followUp?.followUpTime ?? null),
            bulletRow(
              'Reason for follow-up',
              data.followUp?.followUpReason ?? null
            ),
          ],
        },
        {
          columns: [
            { text: '', width: '*' },
            { stack: sigItems, width: 'auto', alignment: 'right' as const },
          ],
          margin: m4(0, 20, 0, 0),
        },
      ],
    })
  );

  return {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: m4(30, 40, 30, 34),
    header: {
      table: {
        widths: ['*'],
        body: [
          [
            {
              text: 'Intelehealth e-Prescription',
              alignment: 'center',
              bold: true,
              fontSize: 12,
              color: '#1A1A2E',
              fillColor: '#E6FFF3',
              border: [false, false, false, false],
              margin: m4(0, 8, 0, 8),
            },
          ],
        ],
      },
      layout: 'noBorders',
    },
    watermark: {
      text: 'INTELEHEALTH',
      color: '#cccccc',
      opacity: 0.07,
      bold: true,
      italics: false,
      angle: 0,
      fontSize: 50,
    },
    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        {
          text:
            currentPage === pageCount
              ? '*The diagnosis and prescription is through telemedicine consultation conducted as per applicable telemedicine guideline'
              : '',
          fontSize: 7,
          color: '#555',
          margin: [28, 4, 0, 0],
        },
        {
          text: `${currentPage} of ${pageCount}`,
          width: 45,
          fontSize: 7,
          color: '#888',
          alignment: 'right',
          margin: [0, 4, 10, 0],
        },
      ],
    }),
    content: [
      {
        table: { widths: ['25%', '25%', '25%', '25%'], body: bodyRows },
        layout: 'noBorders',
      },
    ],
    styles: {
      tHeader: {
        bold: true,
        fontSize: 8,
        color: '#444444',
        fillColor: '#F5F7FA',
        margin: m4(0, 2, 0, 2),
      },
    },
    defaultStyle: { fontSize: 9, color: '#1A1A2E' },
  };
}

export async function downloadVisitPrescriptionPdf(
  data: PrescriptionData
): Promise<void> {
  const docDef = await buildPrescriptionDocDef(data);
  pdfMake.createPdf(docDef).download('e-prescription.pdf');
}

export async function printVisitPrescriptionPdf(
  data: PrescriptionData
): Promise<void> {
  const docDef = await buildPrescriptionDocDef(data);
  pdfMake.createPdf(docDef).print();
}

export async function shareVisitPrescriptionPdf(
  data: PrescriptionData,
  phoneNumber: string
): Promise<void> {
  const docDef = await buildPrescriptionDocDef(data);
  const pdfDoc = pdfMake.createPdf(docDef);

  // Download the PDF so the user has it locally
  pdfDoc.download('e-prescription.pdf');

  // TODO: Replace dummy link with actual upload URL once backend API is ready
  const downloadLink =
    'https://pathqa.intelehealth.org/intelehealth/index.html#/i/2vpa';

  // Open WhatsApp with the provided phone number and download link
  const message = encodeURIComponent(
    `Hello, Thank you for using Intelehealth. To download your prescription click here\nDownload here: ${downloadLink}`
  );
  window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
}
