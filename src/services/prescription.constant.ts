export const PRESCRIPTION_CONCEPT_IDS = {
  DIAGNOSIS: '537bb20d-d09d-4f88-930b-cc45c7d662df',
  MEDICATION: 'c38c0c50-2fd2-4ae3-b7ba-7dd25adca4ca',
  ADVICE: '67a050c1-35e5-451c-a4ab-fff9d57b0db1',
  TEST: '23601d71-50e6-483f-968d-aeef3031346d',
  REFERRAL: '605b6f15-8f7a-4c45-b06d-14165f6974be',
  FOLLOW_UP: 'e8caffd6-5d22-41c4-8d6a-bc31a44d0c86',
} as const;

export const IDENTIFIER_TYPES = {
  OPENMRS_ID: 'OpenMRS ID',
} as const;

export const PERSON_ATTRIBUTES = {
  TELEPHONE_NUMBER: 'Telephone Number',
  NATIONAL_ID: 'National ID',
  OCCUPATION: 'Occupation',
} as const;

export const PROVIDER_ATTRIBUTES = {
  SIGNATURE: 'signature',
  QUALIFICATION_CERTIFICATE: 'qualificationcertificate',
  QUALIFICATION: 'qualification',
  TYPE_OF_PROFESSION: 'typeofprofession',
  REGISTRATION_NUMBER: 'registrationnumber',
  REGISTRATION_NUMBER_ALT: 'registration number',
} as const;
