export interface AchievementsData {
  patientsCreatedToday: number;
  visitsEndedToday: number;
  averagePatientSatisfactionScore: number;
}

export interface Encounter {
  uuid: string;
  visituuid: string;
  encounter_type_uuid: string;
  provider_uuid: string;
  encounter_time: string;
}

export interface Obs {
  conceptuuid: string;
  encounteruuid: string;
  value: string;
}

export interface PatientAttribute {
  patientuuid: string;
  person_attribute_type_uuid: string;
  value: string;
}

export interface PullRawData {
  patientAttributesList: PatientAttribute[];
  encounterlist: Encounter[];
  obslist: Obs[];
}

export interface PullDataResponse {
  status: string;
  data: {
    patientlist: unknown[];
    patientAttributesList: PatientAttribute[];
    visitlist: unknown[];
    encounterlist: Encounter[];
    obslist: Obs[];
  };
}

export interface UseAchievementsParams {
  period?: 'overall';
  fromDate?: string;
  toDate?: string;
}

export interface LocalPatient {
  patientuuid: string;
  providerUuid: string;
  createdDate: string;
}
