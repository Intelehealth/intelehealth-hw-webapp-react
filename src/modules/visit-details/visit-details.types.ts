export interface VisitDetailsEncounter {
  uuid: string;
  display: string;
  encounterDatetime: string;
  encounterType: {
    uuid: string;
    display: string;
  };
  encounterProviders: {
    uuid: string;
    display: string;
    provider: {
      uuid: string;
      display: string;
      person: {
        uuid: string;
        display: string;
      };
      attributes: {
        uuid: string;
        display: string;
        attributeType: {
          uuid: string;
          display: string;
        };
        value: string;
      }[];
    };
  }[];
  obs: {
    uuid: string;
    display: string;
    concept: {
      uuid: string;
      display: string;
    };
    value:
      | string
      | {
          uuid: string;
          display: string;
        };
  }[];
}

export interface VisitDetailsPatient {
  uuid: string;
  display: string;
  person: {
    uuid: string;
    display: string;
    gender: string;
    age: number;
    birthdate: string;
    preferredName: {
      uuid: string;
      display: string;
      givenName: string;
      familyName: string;
    };
    attributes: {
      uuid: string;
      display: string;
      attributeType: {
        uuid: string;
        display: string;
      };
      value: string;
    }[];
  };
  identifiers: {
    uuid: string;
    display: string;
    identifier: string;
    identifierType: {
      uuid: string;
      display: string;
    };
  }[];
}

export interface VisitDetailsAttribute {
  uuid: string;
  display: string;
  attributeType: {
    uuid: string;
    display: string;
  };
  value: string;
}

export interface VisitDetailsResponse {
  uuid: string;
  display: string;
  patient: VisitDetailsPatient;
  visitType: {
    uuid: string;
    display: string;
  };
  startDatetime: string;
  stopDatetime: string | null;
  encounters: VisitDetailsEncounter[];
  attributes: VisitDetailsAttribute[];
  location: {
    uuid: string;
    display: string;
  };
}

export interface TransformedVisitDetails {
  visitUuid: string;
  visitId: string;
  patientName: string;
  patientUuid: string;
  gender: string;
  age: number;
  patientIdentifier: string;
  chiefComplaint: string;
  chiefComplaintHtml: string;
  visitDate: string;
  visitTime: string;
  doctorName: string;
  doctorSpeciality: string;
  visitStatus: 'Active' | 'Closed';
  prescriptionDate: string | null;
  followUpDate: string | null;
  phoneNumber: string;
}
