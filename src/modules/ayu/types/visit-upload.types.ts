export interface EncounterObs {
  comments: string;
  concept: string;
  value: string;
}

export interface EncounterProvider {
  encounterRole: string;
  provider: string;
}

export interface EncounterPayload {
  encounterDatetime: string;
  encounterProviders: EncounterProvider[];
  encounterType: string;
  location: string;
  obs?: EncounterObs[];
  patient: string;
  voided: number;
}

export interface VisitAttribute {
  attributeType: string;
  value: string;
}

export interface VisitPayload {
  attributes: VisitAttribute[];
  location: string;
  patient: string;
  startDatetime: string;
  visitType: string;
}

export interface VisitUploadPayload {
  encounters: EncounterPayload[];
  visits: VisitPayload[];
}

export interface EncounterRef {
  uuid: string;
  encounterType?: { uuid: string };
}

export interface VisitUploadResponse {
  encounters?: EncounterRef[];
  [key: string]: unknown;
}
