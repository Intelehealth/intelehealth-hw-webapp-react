export interface AyuAnswerOption {
  valueString?: string;
  valueInteger?: number;
  valueCoding?: {
    code: string;
    display?: string;
  };
}

export interface FhirQuestionnaire {
  resourceType: string;
  item?: AyuQuestion[];
}

export interface AyuQuestion {
  /** FHIR: item.linkId */
  linkId: string;

  /** FHIR: item.text */
  text?: string;

  /** FHIR: item.type */
  type: string;
  // | 'group'
  // | 'display'
  // | 'string'
  // | 'integer'
  // | 'decimal'
  // | 'date'
  // | 'choice';

  /** FHIR: item.required */
  required?: boolean;

  /** FHIR: item.readOnly */
  readOnly?: boolean;

  /** FHIR: item.repeats */
  repeats?: boolean;

  /** FHIR: item.answerOption */
  answerOption?: AyuAnswerOption[];

  /** FHIR: item.item (nested items) */
  item?: AyuQuestion[];

  /** UI-only overrides (optional) */
  ui?: {
    inputType?: 'radio' | 'select';
    placeholder?: string;
  };
}
