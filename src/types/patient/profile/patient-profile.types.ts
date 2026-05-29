export interface OpenMRSPatient {
  uuid: string;
  identifiers: { identifier: string; preferred: boolean }[];
  person: {
    uuid: string;
    gender: string;
    age: number;
    birthdate: string;
    preferredName: {
      givenName: string;
      middleName: string | null;
      familyName: string;
    } | null;
    preferredAddress: {
      address1: string | null;
      address2: string | null;
      cityVillage: string | null;
      stateProvince: string | null;
      country: string | null;
      postalCode: string | null;
      countyDistrict: string | null;
    } | null;
    attributes: {
      value: string;
      attributeType: { uuid: string; display: string };
    }[];
  };
}

export interface OpenMRSVisit {
  uuid: string;
  startDatetime: string;
  visitType: { display: string } | null;
  encounters: {
    encounterType: { display: string };
  }[];
}

export interface PatientDisplayData {
  fullName: string;
  patientId: string;
  gender: string;
  dob: string;
  age: string;
  phone: string;
  contactType: string;
  emergencyName: string;
  emergencyNumber: string;
  occupation: string;
  caste: string;
  education: string;
  economicStatus: string;
  address: OpenMRSPatient['person']['preferredAddress'];
}

export interface UsePatientProfileReturn {
  patientData: PatientDisplayData | null;
  rawPatient: OpenMRSPatient | null;
  visits: OpenMRSVisit[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
}
