/** Observation payload for an encounter */
export interface EncounterObs {
  comments: string;
  concept: string;
  value: string;
}

/** Provider reference within an encounter */
export interface EncounterProvider {
  encounterRole: string;
  provider: string;
}

/** Single encounter payload */
export interface EncounterPayload {
  encounterDatetime: string;
  encounterProviders: EncounterProvider[];
  encounterType: string;
  location: string;
  obs?: EncounterObs[];
  patient: string;
  voided: number;
}

/** Visit attribute */
export interface VisitAttribute {
  attributeType: string;
  value: string;
}

/** Visit payload */
export interface VisitPayload {
  attributes: VisitAttribute[];
  location: string;
  patient: string;
  startDatetime: string;
  visitType: string;
}

/** Full upload payload sent to OpenMRS */
export interface VisitUploadPayload {
  encounters: EncounterPayload[];
  visits: VisitPayload[];
}
