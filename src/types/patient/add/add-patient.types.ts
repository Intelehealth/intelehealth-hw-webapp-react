export interface AddPatientData {
  identifiers: [
    {
      identifier: string;
      identifierType: string;
      location: string;
      preferred: boolean;
    },
  ];
  person: {
    birthdate: string;
    gender: string;
    names: [
      {
        familyName: string;
        givenName: string;
        middleName: string;
      },
    ];
    addresses: [
      {
        address1: string;
        address2: string;
        address3: string;
        address6: string;
        cityVillage: string;
        country: string;
        countyDistrict: string;
        postalCode: string;
        stateProvince: string;
      },
    ];
    attributes?: {
      value: string;
      attributeType: string;
    }[];
  };
}

export interface PatientFormData {
  personalInfo: {
    firstName: string;
    middleName: string;
    lastName: string;
    gender: string;
    dateOfBirth: string;
    age: string;
    phoneNumber: string;
    phoneNumberCountryCode: string;
    contactType: string;
    emergencyContactName: string;
    emergencyContactNumber: string;
    emergencyContactNumberCountryCode: string;
    profilePhoto: null | string;
  };
  addressInfo: {
    postalCode: string;
    city: string;
    state: string;
    country: string;
    district: string;
    correspondingAddress1: string;
    correspondingAddress2: string;
  };
  otherInfo: {
    sonDaughterWifeOf: string;
    occupation: string;
    caste: string;
    education: string;
    economicStatus: string;
  };
}

export interface PersonImage {
  person: string;
  image: string;
}
