import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import iconConsultation from '../../assets/icons/prescription-consultation.svg';
import iconDiagnosis from '../../assets/icons/prescription-diagnosis.svg';
import iconFollowUp from '../../assets/icons/prescription-followup.svg';
import iconMedication from '../../assets/icons/prescription-medication.svg';
import iconAdvice from '../../assets/icons/prescription-advice.svg';
import iconTest from '../../assets/icons/prescription-test.svg';
import iconReferral from '../../assets/icons/prescription-referral.svg';
import {
  getVisitPrescriptionData,
  type PrescriptionData,
} from '../../services/visit-prescription.service';
import { COLORS } from '../../utils/colors.constant';

const thStyle = {
  textAlign: 'left' as const,
  padding: '5px 8px',
  fontWeight: 'bold',
  fontSize: 9,
  color: COLORS.TEXT_DARK_GRAY,
  borderBottom: `1px solid ${COLORS.BORDER_LIGHT}`,
  whiteSpace: 'nowrap' as const,
};
const tdStyle = {
  padding: '5px 8px',
  fontSize: 9,
  color: COLORS.TEXT_PRIMARY,
  verticalAlign: 'top' as const,
  borderBottom: `1px solid ${COLORS.BORDER_LIGHTER}`,
  whiteSpace: 'pre-line' as const,
};

const InfoCell = ({
  label,
  value,
  phone,
}: {
  label: string;
  value: string | null | undefined;
  phone?: boolean;
}) => (
  <div style={{ marginBottom: 7 }}>
    <div style={{ fontSize: 8, color: COLORS.TEXT_MUTED, marginBottom: 2 }}>
      {label}
    </div>
    <div style={{ fontSize: 9, color: COLORS.TEXT_PRIMARY }}>
      {phone && value ? ` ${value}` : value || '-'}
    </div>
  </div>
);

const Section = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) => (
  <div style={{ marginBottom: 8 }}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        marginBottom: 6,
        paddingBottom: 6,
        borderBottom: `1px solid ${COLORS.BORDER_LIGHT}`,
      }}
    >
      <img src={icon} style={{ width: 28, height: 28, flexShrink: 0 }} />
      <span
        style={{ fontWeight: 700, fontSize: 12, color: COLORS.TEXT_PRIMARY }}
      >
        {title}
      </span>
    </div>
    <div style={{ paddingLeft: 36 }}>{children}</div>
  </div>
);

const BulletRow = ({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) => (
  <div style={{ display: 'flex', gap: 8, marginBottom: 5, fontSize: 9 }}>
    <span style={{ color: COLORS.TEXT_SECONDARY, width: 150, flexShrink: 0 }}>
      • {label}
    </span>
    <span style={{ color: COLORS.TEXT_INDIGO }}>{value || 'NA'}</span>
  </div>
);

const DataTable = ({
  headers,
  children,
  empty,
  colSpan,
}: {
  headers: string[];
  children: React.ReactNode;
  empty: string;
  colSpan: number;
}) => {
  const arr = Array.isArray(children) ? children : [children];
  const hasRows = arr.filter(Boolean).length > 0;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9 }}>
      <thead>
        <tr style={{ background: COLORS.BG_TABLE_HEADER }}>
          {headers.map((h, i) => (
            <th key={i} style={thStyle}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {hasRows ? (
          children
        ) : (
          <tr>
            <td
              colSpan={colSpan}
              style={{
                textAlign: 'center',
                color: COLORS.TEXT_MUTED,
                padding: 8,
                fontSize: 9,
              }}
            >
              {empty}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

const Td = ({ children }: { children: React.ReactNode }) => (
  <td style={tdStyle}>{children}</td>
);

const PatientAvatar = ({ uuid, name }: { uuid: string; name: string }) => {
  const [hasError, setHasError] = useState(false);
  const src = `${import.meta.env.VITE_OPENMRS_API_URL}/personimage/${uuid}`;
  const circle = {
    width: 36,
    height: 36,
    borderRadius: '50%',
    flexShrink: 0 as const,
  };
  return hasError ? (
    <div
      style={{
        ...circle,
        background: COLORS.BG_AVATAR_FALLBACK,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: 14,
        color: COLORS.WHITE,
      }}
    >
      {name?.[0] || 'P'}
    </div>
  ) : (
    <img
      src={src}
      onError={() => setHasError(true)}
      style={{ ...circle, objectFit: 'cover' }}
    />
  );
};

const ListSection = ({
  title,
  icon,
  items,
}: {
  title: string;
  icon: string;
  items: { text: string; sub?: string }[];
}) =>
  items.length > 0 ? (
    <Section title={title} icon={icon}>
      <ul style={{ margin: 0, paddingLeft: 16, fontSize: 9 }}>
        {items.map((item, i) => (
          <li key={i} style={{ marginBottom: 3 }}>
            {item.text}
            {item.sub ? ` – ${item.sub}` : ''}
          </li>
        ))}
      </ul>
    </Section>
  ) : null;

const PrescriptionPreviewPage = () => {
  const [searchParams] = useSearchParams();
  const visitUuid = searchParams.get('visitUuid') || '';
  const [data, setData] = useState<PrescriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visitUuid) {
      setLoading(false);
      setError('No visitUuid provided');
      return;
    }
    setLoading(true);
    setData(null);
    setError(null);
    getVisitPrescriptionData(visitUuid)
      .then(setData)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [visitUuid]);

  if (loading)
    return (
      <div className="p-8 text-gray-400">Loading prescription data...</div>
    );
  if (error || !data)
    return <div className="p-8 text-red-500">{error || 'No data'}</div>;

  return (
    <div
      style={{ background: COLORS.BG_PAGE, minHeight: '100vh', padding: 24 }}
    >
      <div
        style={{
          width: 794,
          margin: '0 auto',
          background: COLORS.BG_WHITE,
          boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
          fontFamily: 'Arial, sans-serif',
          fontSize: 10,
          color: COLORS.TEXT_PRIMARY,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            background: COLORS.BG_PRESCRIPTION_HEADER,
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: 14,
            padding: '14px 36px',
            color: COLORS.TEXT_PRIMARY,
          }}
        >
          Intelehealth e-Prescription
        </div>
        <div style={{ padding: '16px 36px 30px' }}>
          {/* Patient header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 0.8fr 1fr 1fr',
              gap: 10,
              paddingBottom: 12,
              borderBottom: `1px solid ${COLORS.BORDER_FAINT}`,
              marginBottom: 4,
              alignItems: 'start',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <PatientAvatar uuid={data.patientUuid} name={data.patientName} />
              <div>
                <div
                  style={{ fontWeight: 'bold', fontSize: 12, marginBottom: 2 }}
                >
                  {data.patientName}
                </div>
                <div style={{ fontSize: 9, color: COLORS.TEXT_SECONDARY }}>
                  {data.patientId}
                </div>
              </div>
            </div>
            <div>
              <InfoCell label="Gender" value={data.gender} />
              <InfoCell label="Age" value={data.age} />
            </div>
            <div>
              <InfoCell label="Address" value={data.address} />
              <InfoCell label="Occupation" value={data.occupation} />
            </div>
            <div>
              <InfoCell label="National ID" value={data.nationalId} />
              <InfoCell label="Contact no." value={data.phone} phone />
            </div>
          </div>

          <Section title="Consultation details" icon={iconConsultation}>
            <BulletRow label="Patient Id" value={data.patientId} />
            <BulletRow
              label="Prescription Issued"
              value={data.consultationDate}
            />
          </Section>

          <Section title="Diagnosis" icon={iconDiagnosis}>
            <DataTable
              headers={['Diagnosis', 'Type', 'Status']}
              empty="No diagnosis added"
              colSpan={3}
            >
              {data.diagnoses.map((d, i) => (
                <tr key={i}>
                  <Td>{d.diagnosisName}</Td>
                  <Td>{d.diagnosisType}</Td>
                  <Td>{d.diagnosisStatus}</Td>
                </tr>
              ))}
            </DataTable>
          </Section>

          <Section title="Prescribed Medications" icon={iconMedication}>
            <DataTable
              headers={[
                'Medicine',
                'Strength',
                'Frequency',
                'Duration',
                'Timing',
                'Remarks',
              ]}
              empty="No medicines added"
              colSpan={6}
            >
              {data.medicines.map((m, i) => (
                <tr key={i}>
                  <Td>{m.drug}</Td>
                  <Td>{m.strength}</Td>
                  <Td>{m.frequency}</Td>
                  <Td>{m.days}</Td>
                  <Td>{m.timing}</Td>
                  <Td>{m.remark}</Td>
                </tr>
              ))}
            </DataTable>
          </Section>

          <ListSection
            title="Advice"
            icon={iconAdvice}
            items={data.advices.map(a => ({ text: a }))}
          />
          <ListSection
            title="Tests Recommended"
            icon={iconTest}
            items={data.tests.map(t => ({ text: t }))}
          />
          <ListSection
            title="Referred Specialist"
            icon={iconReferral}
            items={data.referrals.map(r => ({
              text: r.speciality,
              sub: r.reason || undefined,
            }))}
          />

          <Section title="Follow-up" icon={iconFollowUp}>
            <BulletRow
              label="Follow-up suggested"
              value={data.followUp?.wantFollowUp ?? 'No'}
            />
            <BulletRow label="Type" value={data.followUp?.followUpType} />
            <BulletRow
              label="Follow-up Date"
              value={data.followUp?.followUpDate}
            />
            <BulletRow
              label="Follow-up Time"
              value={data.followUp?.followUpTime}
            />
            <BulletRow
              label="Reason for follow-up"
              value={data.followUp?.followUpReason}
            />
          </Section>

          {/* Doctor signature */}
          <div style={{ textAlign: 'right', marginTop: 32 }}>
            {data.doctorSignatureUrl && (
              <img
                src={data.doctorSignatureUrl}
                alt="signature"
                style={{
                  height: 52,
                  marginBottom: 4,
                  display: 'block',
                  marginLeft: 'auto',
                }}
              />
            )}
            {data.doctorName && (
              <div style={{ fontSize: 10, color: COLORS.TEXT_PRIMARY }}>
                {data.doctorName}
              </div>
            )}
            {data.doctorQualification && (
              <div style={{ fontSize: 9, color: COLORS.TEXT_GRAY }}>
                {data.doctorQualification}
              </div>
            )}
            {data.doctorRegNumber && (
              <div style={{ fontSize: 9, color: COLORS.TEXT_GRAY }}>
                Registration No: {data.doctorRegNumber}
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div
            style={{
              marginTop: 24,
              paddingTop: 10,
              borderTop: `1px solid ${COLORS.BORDER_SUBTLE}`,
              fontSize: 7,
              color: COLORS.TEXT_MUTED,
            }}
          >
            *The diagnosis and prescription is through telemedicine consultation
            conducted as per applicable telemedicine guideline
            <br />
            Copyright ©2023 Intelehealth, a 501 (c)(3) &amp; Section 8
            non-profit organisation
          </div>
        </div>
      </div>

      <details style={{ width: 794, margin: '16px auto 0' }}>
        <summary
          style={{
            cursor: 'pointer',
            fontSize: 11,
            color: COLORS.TEXT_LIGHT,
            marginBottom: 4,
          }}
        >
          Raw API data (debug)
        </summary>
        <pre
          style={{
            fontSize: 11,
            background: COLORS.BG_DEBUG,
            color: COLORS.TEXT_DEBUG,
            padding: 16,
            borderRadius: 8,
            overflow: 'auto',
            maxHeight: 400,
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default PrescriptionPreviewPage;
