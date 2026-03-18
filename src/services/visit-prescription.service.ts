import { OpenMRSApi } from './openmrs';

interface ObsValue {
  display?: string;
  name?: string;
  uuid?: string;
}
interface Obs {
  uuid?: string;
  display?: string;
  value?: string | ObsValue;
  concept?: { uuid?: string; display?: string };
  groupMembers?: Obs[];
}
interface EncProvider {
  provider?: {
    uuid?: string;
    display?: string;
    attributes?: { value?: string; attributeType?: { display: string } }[];
  };
}
interface Encounter {
  encounterDatetime: string;
  obs?: Obs[];
  encounterProviders?: EncProvider[];
}
interface PersonAttr {
  value?: string;
  attributeType?: { display: string };
}
interface VisitResponse {
  uuid: string;
  location?: { display?: string };
  patient?: {
    uuid?: string;
    identifiers?: {
      identifier?: string;
      identifierType?: { display?: string };
    }[];
    person?: {
      display?: string;
      gender?: string;
      age?: number;
      preferredName?: {
        givenName?: string;
        middleName?: string;
        familyName?: string;
      };
      attributes?: PersonAttr[];
      preferredAddress?: {
        address1?: string;
        cityVillage?: string;
        countyDistrict?: string;
        stateProvince?: string;
      };
    };
  };
  encounters?: Encounter[];
}

const CONCEPT_IDS = {
  diagnosis: '537bb20d-d09d-4f88-930b-cc45c7d662df',
  medication: 'c38c0c50-2fd2-4ae3-b7ba-7dd25adca4ca',
  advice: '67a050c1-35e5-451c-a4ab-fff9d57b0db1',
  test: '23601d71-50e6-483f-968d-aeef3031346d',
  referral: '605b6f15-8f7a-4c45-b06d-14165f6974be',
  followUp: 'e8caffd6-5d22-41c4-8d6a-bc31a44d0c86',
};

export interface DiagnosisItem {
  diagnosisName: string;
  diagnosisType: string;
  diagnosisStatus: string;
}
export interface MedicineItem {
  drug: string;
  strength: string;
  days: string;
  timing: string;
  frequency: string;
  remark: string;
}
export interface FollowUpData {
  wantFollowUp: string;
  followUpType: string | null;
  followUpDate: string | null;
  followUpTime: string | null;
  followUpReason: string | null;
}

export interface PrescriptionData {
  visitUuid: string;
  patientName: string;
  patientUuid: string;
  patientId: string;
  gender: string;
  age: string;
  phone: string | null;
  address: string | null;
  nationalId: string | null;
  occupation: string | null;
  consultationDate: string;
  location: string;
  doctorName: string;
  doctorQualification: string;
  doctorRegNumber: string;
  doctorSignatureUrl: string | null;
  diagnoses: DiagnosisItem[];
  medicines: MedicineItem[];
  advices: string[];
  tests: string[];
  referrals: { speciality: string; reason: string }[];
  followUp: FollowUpData | null;
}

const VISIT_CUSTOM_REP =
  'custom:(uuid,startDatetime,location:(display),' +
  'patient:(uuid,identifiers:(identifier,identifierType:(name,display)),' +
  'person:(display,gender,age,birthdate,preferredName:(givenName,middleName,familyName),' +
  'attributes:(value,attributeType:(display,uuid)),preferredAddress:(address1,address2,cityVillage,countyDistrict,stateProvince,postalCode))),' +
  'encounters:(encounterDatetime,encounterType:(display),' +
  'obs:(uuid,display,value,concept:(uuid,display),groupMembers:(uuid,display,value,concept:(uuid,display))),' +
  'encounterProviders:(provider:(uuid,display,attributes:(value,attributeType:(display))))))';

type Person = NonNullable<NonNullable<VisitResponse['patient']>['person']>;

function getPersonAttribute(
  person: Person | undefined,
  display: string
): string | null {
  return (
    person?.attributes?.find(
      (a: PersonAttr) => a.attributeType?.display === display
    )?.value ?? null
  );
}

export function parseDiagnosis(value: string): DiagnosisItem {
  const dictMatch = value.match(/\{['"]\w+['"]\s*:\s*["'](.+)["']\s*\}/s);
  if (dictMatch)
    return {
      diagnosisName: dictMatch[1].replace(/\\n/g, '\n').trim(),
      diagnosisType: '',
      diagnosisStatus: '',
    };

  const parts = value.split('::');
  if (parts.length >= 2) {
    const rest = parts[1].split(':');
    const tsParts = (rest[rest.length - 1] || '').split(' & ');
    return {
      diagnosisName: rest[0] || value,
      diagnosisType: tsParts[0] || '',
      diagnosisStatus: tsParts[1] || '',
    };
  }

  const c = value.split(':');
  return {
    diagnosisName: c[0] || value,
    diagnosisType: c[1] || '',
    diagnosisStatus: c[2] || '',
  };
}

export function parseMedicine(value: string): MedicineItem {
  const p = value.split(':');
  return {
    drug: p[0] || '',
    strength: p[1] || '',
    days: p[2] || '',
    timing: p[3] || '',
    remark: p[4] || '',
    frequency: p[5] || '',
  };
}

export function parseFollowUp(obs: Obs): FollowUpData {
  const wantFollowUp = 'Yes';
  const members: Obs[] = obs.groupMembers || [];
  if (members.length > 0) {
    const get = (name: string) => {
      const m = members.find(mb =>
        (mb.concept?.display || '').toLowerCase().includes(name.toLowerCase())
      );
      if (!m) return null;
      const v = m.value;
      return (typeof v === 'object' ? v?.display : v) || m.display || null;
    };
    return {
      wantFollowUp,
      followUpDate: get('date') || get('follow up date'),
      followUpTime: get('time') || get('follow up time'),
      followUpReason: get('reason') || get('remark') || get('comment'),
      followUpType: get('type') || get('visit type'),
    };
  }

  const obsValue = String(obs.value || obs.display || '');
  if (obsValue.includes('Time:')) {
    const parts = obsValue.split(',').filter(Boolean);
    const extract = (key: string) =>
      parts
        .find(v => v.includes(key))
        ?.split(key)?.[1]
        ?.trim() ?? null;
    const remark = extract('Remark:');
    const type = extract('Type:');
    return {
      wantFollowUp,
      followUpDate: parts[0]?.trim() || null,
      followUpTime: extract('Time:'),
      followUpReason: remark === 'null' ? null : remark,
      followUpType: type === 'null' ? null : type,
    };
  }
  return {
    wantFollowUp,
    followUpDate: obsValue || null,
    followUpTime: null,
    followUpReason: null,
    followUpType: null,
  };
}

export function parseReferral(value: string): {
  speciality: string;
  reason: string;
} {
  const p = value.split(':');
  return { speciality: p[0] || '', reason: p[3] || p[1] || '' };
}

function obsStr(o: Obs): string {
  return String(o.value || o.display || '');
}

export async function getVisitPrescriptionData(
  visitUuid: string
): Promise<PrescriptionData> {
  const visit = await OpenMRSApi.get<VisitResponse>(
    `/visit/${visitUuid}?v=${VISIT_CUSTOM_REP}`
  );
  const patient = visit.patient;
  const person = patient?.person;
  const pn = person?.preferredName;

  const patientName = pn
    ? [pn.givenName, pn.middleName, pn.familyName]
        .filter(Boolean)
        .join(' ')
        .toUpperCase()
    : person?.display || '';
  const patientId =
    patient?.identifiers?.find(
      id => id.identifierType?.display === 'OpenMRS ID'
    )?.identifier ||
    patient?.identifiers?.[0]?.identifier ||
    '';
  const gender =
    person?.gender === 'M'
      ? 'Male'
      : person?.gender === 'F'
        ? 'Female'
        : person?.gender || '';
  const age = person?.age ? `${person.age} years` : '';
  const addr = person?.preferredAddress;
  const address = addr
    ? [addr.address1, addr.cityVillage, addr.countyDistrict, addr.stateProvince]
        .filter(Boolean)
        .join(', ')
    : null;
  const encounters: Encounter[] = visit.encounters || [];

  const consultationDate = encounters.length
    ? new Date(
        [...encounters].sort(
          (a, b) =>
            new Date(b.encounterDatetime).getTime() -
            new Date(a.encounterDatetime).getTime()
        )[0].encounterDatetime
      ).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';

  let doctorName = '',
    doctorQualification = '',
    doctorRegNumber = '',
    doctorSignatureUrl: string | null = null;
  for (const enc of encounters) {
    for (const ep of enc.encounterProviders || []) {
      const prov = ep.provider;
      if (!prov) continue;
      doctorName = doctorName || prov.display || '';
      for (const attr of prov.attributes || []) {
        const d = (attr.attributeType?.display || '').toLowerCase();
        if (d === 'signature' || d === 'qualificationcertificate')
          doctorSignatureUrl = doctorSignatureUrl || attr.value || null;
        if (d === 'qualification' || d === 'typeofprofession')
          doctorQualification = doctorQualification || attr.value || '';
        if (d === 'registrationnumber' || d === 'registration number')
          doctorRegNumber = doctorRegNumber || attr.value || '';
      }
    }
  }

  const allObs: Obs[] = encounters.flatMap(enc => enc.obs || []);
  const byConceptId = (id: string) =>
    allObs.filter(o => o.concept?.uuid === id);
  const followUpObs = byConceptId(CONCEPT_IDS.followUp);

  return {
    visitUuid,
    patientName,
    patientUuid: patient?.uuid || '',
    patientId,
    gender,
    age,
    phone: getPersonAttribute(person, 'Telephone Number'),
    address,
    nationalId: getPersonAttribute(person, 'National ID'),
    occupation: getPersonAttribute(person, 'Occupation'),
    consultationDate,
    location: visit.location?.display || '',
    doctorName,
    doctorQualification,
    doctorRegNumber,
    doctorSignatureUrl,
    diagnoses: byConceptId(CONCEPT_IDS.diagnosis).map(o => {
      const v = o.value;
      const val =
        typeof v === 'object' && v !== null
          ? v.display || v.name || o.display || ''
          : v || o.display || '';
      return parseDiagnosis(val);
    }),
    medicines: byConceptId(CONCEPT_IDS.medication).map(o =>
      parseMedicine(obsStr(o))
    ),
    advices: byConceptId(CONCEPT_IDS.advice).map(o => obsStr(o)),
    tests: byConceptId(CONCEPT_IDS.test).map(o => obsStr(o)),
    referrals: byConceptId(CONCEPT_IDS.referral).map(o =>
      parseReferral(obsStr(o))
    ),
    followUp: followUpObs.length ? parseFollowUp(followUpObs[0]) : null,
  };
}
