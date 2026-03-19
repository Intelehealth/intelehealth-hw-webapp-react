/* eslint-disable @typescript-eslint/no-explicit-any */
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { PrescriptionData } from '../services/visit-prescription.service';
import iconConsultationUrl from '../assets/icons/prescription-consultation.svg?url';
import iconDiagnosisUrl from '../assets/icons/prescription-diagnosis.svg?url';
import iconMedicationUrl from '../assets/icons/prescription-medication.svg?url';
import iconAdviceUrl from '../assets/icons/prescription-advice.svg?url';
import iconTestUrl from '../assets/icons/prescription-test.svg?url';
import iconFollowupUrl from '../assets/icons/prescription-followup.svg?url';
import iconReferralUrl from '../assets/icons/prescription-referral.svg?url';

(pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs ?? (pdfFonts as any).vfs;

async function toBase64(
  url: string,
  forceImageMime = false
): Promise<string | null> {
  try {
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) return null;
    const blob = await res.blob();
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
    img.onerror = () => resolve(null);
    img.src = svgUrl;
  });
}

const m4 = (a: number, b: number, c: number, d: number) =>
  [a, b, c, d] as [number, number, number, number];

function bulletRow(label: string, value: string | null | undefined) {
  return {
    columns: [
      { text: `• ${label}`, color: '#888888', fontSize: 9, width: 140 },
      { text: value || 'NA', color: '#1A237E', fontSize: 9 },
    ],
    margin: m4(0, 4, 0, 0),
  };
}

function sectionHeader(title: string, icon: string | null) {
  const iconCell = icon
    ? { image: icon, width: 24, height: 24, margin: m4(0, 2, 0, 0) }
    : {
        canvas: [
          { type: 'ellipse', x: 11, y: 11, r1: 11, r2: 11, color: '#2E1E91' },
        ],
        width: 22,
        height: 22,
      };
  return [
    {
      colSpan: 4,
      columns: [
        iconCell,
        {
          text: title,
          bold: true,
          fontSize: 11,
          color: '#1A1A2E',
          margin: m4(6, 4, 0, 0),
        },
      ],
      columnGap: 0,
      margin: m4(0, 10, 0, 0),
    },
    '',
    '',
    '',
  ];
}

function divider() {
  return [
    {
      colSpan: 4,
      canvas: [
        {
          type: 'line',
          x1: 0,
          y1: 0,
          x2: 515,
          y2: 0,
          lineWidth: 0.5,
          lineColor: '#E0E0E0',
        },
      ],
      margin: m4(0, 2, 0, 4),
    },
    '',
    '',
    '',
  ];
}

function contentRow(content: any) {
  return [{ colSpan: 4, ...content }, '', '', ''];
}

const tableLayout = {
  hLineWidth: (i: number, node: any) =>
    i === 0 ? 0 : i === 1 ? 0.5 : i === node.table.body.length ? 0 : 0.3,
  vLineWidth: () => 0,
  hLineColor: (i: number) => (i === 1 ? '#CCCCCC' : '#EBEBEB'),
  paddingLeft: () => 6,
  paddingRight: () => 6,
  paddingTop: () => 4,
  paddingBottom: () => 4,
};

export function openPrescriptionPreview(visitUuid: string): void {
  window.open(
    `${window.location.origin}${window.location.pathname}#/prescription-preview?visitUuid=${visitUuid}`,
    '_blank'
  );
}

export async function downloadVisitPrescriptionPdf(
  data: PrescriptionData
): Promise<void> {
  const [
    iConsultation,
    iDiagnosis,
    iMedication,
    iAdvice,
    iTest,
    iFollowup,
    iReferral,
  ] = await Promise.all([
    svgToPng(iconConsultationUrl),
    svgToPng(iconDiagnosisUrl),
    svgToPng(iconMedicationUrl),
    svgToPng(iconAdviceUrl),
    svgToPng(iconTestUrl),
    svgToPng(iconFollowupUrl),
    svgToPng(iconReferralUrl),
  ]);

  const patientImg = await toBase64(
    `${import.meta.env.VITE_OPENMRS_API_URL}/personimage/${data.patientUuid}`
  );
  const signatureB64 = data.doctorSignatureUrl
    ? data.doctorSignatureUrl.startsWith('data:')
      ? data.doctorSignatureUrl
      : await toBase64(data.doctorSignatureUrl, true)
    : null;

  const patientAvatar = patientImg
    ? { image: patientImg, width: 36, height: 36, margin: m4(0, 6, 10, 6) }
    : {
        canvas: [
          { type: 'ellipse', x: 18, y: 18, r1: 18, r2: 18, color: '#C5CAE9' },
        ],
        width: 36,
        height: 36,
        margin: m4(0, 6, 10, 6),
      };

  const cell9 = (t: string) => ({ text: t, fontSize: 9 });
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
      { text: label, color: '#888888', fontSize: 8, margin: m4(0, 0, 0, 2) },
      { text: value || '-', fontSize: 9, color: '#1A1A2E' },
    ],
    margin: m4(0, 4, 0, 4),
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
      fontSize: 10,
      bold: true,
      color: '#1A1A2E',
    });
  if (data.doctorQualification)
    sigItems.push({
      text: data.doctorQualification,
      fontSize: 9,
      color: '#555',
    });
  if (data.doctorRegNumber)
    sigItems.push({
      text: `Registration No: ${data.doctorRegNumber}`,
      fontSize: 9,
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
                    fontSize: 11,
                    color: '#1A1A2E',
                    margin: m4(0, 6, 0, 2),
                  },
                  { text: data.patientId, fontSize: 9, color: '#7B7FA6' },
                ],
              },
            ],
          ],
        },
        layout: 'noBorders',
      },
      {
        stack: [infoCell('Gender', data.gender), infoCell('Age', data.age)],
        margin: m4(8, 0, 0, 0),
      },
      {
        stack: [
          infoCell('Address', data.address),
          infoCell('Occupation', data.occupation),
        ],
        margin: m4(8, 0, 0, 0),
      },
      {
        stack: [
          infoCell('National ID', data.nationalId),
          infoCell('Contact no.', data.phone),
        ],
        margin: m4(8, 0, 0, 0),
      },
    ],
    sectionHeader('Consultation details', iConsultation),
    divider(),
    contentRow({
      margin: m4(28, 0, 0, 6),
      stack: [
        bulletRow('Patient Id', data.patientId),
        bulletRow('Prescription Issued', data.consultationDate),
      ],
    }),
    sectionHeader('Diagnosis', iDiagnosis),
    divider(),
    contentRow({
      margin: m4(28, 0, 0, 6),
      table: {
        widths: ['*', 'auto', 'auto'],
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
    sectionHeader('Prescribed Medications', iMedication),
    divider(),
    contentRow({
      margin: m4(28, 0, 0, 6),
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
    }),
  ];

  if (data.advices.length > 0) {
    bodyRows.push(
      sectionHeader('Advice', iAdvice),
      divider(),
      contentRow({
        margin: m4(28, 0, 0, 6),
        ul: data.advices.map(a => ({
          text: a,
          fontSize: 9,
          margin: m4(0, 3, 0, 0),
        })),
      })
    );
  }
  if (data.tests.length > 0) {
    bodyRows.push(
      sectionHeader('Tests Recommended', iTest),
      divider(),
      contentRow({
        margin: m4(28, 0, 0, 6),
        ul: data.tests.map(t => ({
          text: t,
          fontSize: 9,
          margin: m4(0, 3, 0, 0),
        })),
      })
    );
  }
  if (data.referrals.length > 0) {
    bodyRows.push(
      sectionHeader('Referred Specialist', iReferral),
      divider(),
      contentRow({
        margin: m4(28, 0, 0, 6),
        ul: data.referrals.map(r => ({
          text: r.speciality + (r.reason ? ` – ${r.reason}` : ''),
          fontSize: 9,
          margin: m4(0, 3, 0, 0),
        })),
      })
    );
  }

  bodyRows.push(
    sectionHeader('Follow-up', iFollowup),
    divider(),
    contentRow({
      margin: m4(28, 0, 0, 6),
      stack: [
        bulletRow('Follow-up suggested', data.followUp?.wantFollowUp ?? 'No'),
        bulletRow('Type', data.followUp?.followUpType ?? null),
        bulletRow('Follow-up Date', data.followUp?.followUpDate ?? null),
        bulletRow('Follow-up Time', data.followUp?.followUpTime ?? null),
        bulletRow(
          'Reason for follow-up',
          data.followUp?.followUpReason ?? null
        ),
      ],
    }),
    contentRow({
      columns: [
        { text: '', width: '*' },
        { stack: sigItems, width: 'auto', alignment: 'right' as const },
      ],
      margin: m4(0, 24, 0, 0),
    })
  );

  pdfMake
    .createPdf({
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: m4(30, 48, 30, 50),
      header: {
        table: {
          widths: ['*'],
          body: [
            [
              {
                text: 'Intelehealth e-Prescription',
                alignment: 'center',
                bold: true,
                fontSize: 14,
                color: '#1A1A2E',
                fillColor: '#E6FFF3',
                border: [false, false, false, false],
                margin: m4(0, 12, 0, 12),
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
            margin: [30, 4, 0, 0],
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
          table: { widths: ['25%', '30%', '22%', '23%'], body: bodyRows },
          layout: 'noBorders',
        },
      ],
      styles: {
        tHeader: {
          bold: true,
          fontSize: 9,
          color: '#444444',
          fillColor: '#F5F7FA',
          margin: m4(0, 2, 0, 2),
        },
      },
      defaultStyle: { fontSize: 10, color: '#1A1A2E' },
    } as any)
    .download('e-prescription.pdf');
}
