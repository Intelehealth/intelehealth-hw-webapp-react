/** Encounter type UUIDs from OpenMRS */
export const ENCOUNTER_TYPES = {
  /** Vitals encounter */
  VITALS: '67a71486-1a54-468f-ac3e-7091a9a79584',
  /** Adult Initial encounter (visit reason, physical exam, medical & family history) */
  ADULT_INITIAL: '8d5b27bc-c2cc-11de-8d13-0010c6dffd0f',
  /** Visit Complete encounter */
  VISIT_COMPLETE: 'ca5f5dc3-4f0b-4097-9cae-5cf2eb44a09c',
} as const;

/** Encounter role UUID */
export const ENCOUNTER_ROLE = '73bbb069-9781-4afc-a9d1-54b6b2270e04';

/** Visit type UUID */
export const VISIT_TYPE = 'a86ac96e-2e07-47a7-8e72-8216a1a75bfd';

/** Visit attribute type UUIDs */
export const VISIT_ATTRIBUTE_TYPES = {
  SPECIALITY: '3f296939-c6d3-4d2e-b8ca-d7f4bfd42c2d',
  VISIT_COMPLETE_DATETIME: 'e76eee5e-9d73-4d07-8f30-16b77e626ccf',
  DOCTOR_NOTES: '64aa50c8-e913-48c6-b8ad-dfa0bccb202b',
} as const;

/**
 * Concept UUIDs for the Adult Initial encounter observations.
 * Each section has a "display" concept (HTML formatted for display)
 * and a "raw" concept (JSON structured data).
 */
export const ADULT_INITIAL_CONCEPTS = {
  /** Visit Reason - display (HTML formatted) */
  VISIT_REASON_DISPLAY: '3edb0e09-9135-481e-b8f0-07a26fa9a5ce',
  /** Visit Reason - raw (JSON with text_en) */
  VISIT_REASON_RAW: '9cca1f28-c52c-461e-9305-7bec2d048d25',

  /** Physical Examination - display (HTML formatted) */
  PHYSICAL_EXAM_DISPLAY: 'e1761e85-9b50-48ae-8c4d-e6b7eeeba084',
  /** Physical Examination - raw (JSON with text_en) */
  PHYSICAL_EXAM_RAW: '1ae67139-abb3-464c-9091-feab2e6e0fdb',

  /** Medical History - display (HTML formatted) */
  MEDICAL_HISTORY_DISPLAY: '62bff84b-795a-45ad-aae1-80e7f5163a82',
  /** Medical History - raw (JSON with text_en) */
  MEDICAL_HISTORY_RAW: 'cf536c43-5aec-444c-a8a1-13f8d9c3e34d',

  /** Family History - display (HTML formatted) */
  FAMILY_HISTORY_DISPLAY: 'd63ae965-47fb-40e8-8f08-1f46a8a60b2b',
  /** Family History - raw (JSON with text_en) */
  FAMILY_HISTORY_RAW: '2349d38e-2d66-4a2b-a435-06ed28da5a7f',
} as const;
