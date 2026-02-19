export interface AyuAnswerOption {
  valueString?: string;
  valueInteger?: number;
  valueCoding?: {
    code: string;
    display?: string;
  };
  extension?: {
    url: string;
    valueBoolean?: boolean;
  }[];
}

export interface DropdownValues {
  number?: string | number | null;
  days?: string | null;
}

export interface DurationAnswer {
  dropdownValues: DropdownValues;
}

export type AyuAnswerValue =
  | string
  | number
  | boolean
  | DurationAnswer
  | string[]
  | null
  | undefined;

export interface FhirQuestionnaire {
  resourceType: string;
  item?: AyuQuestion[];
}

export interface AyuEnableWhen {
  question: string;
  operator: string;
  answerBoolean?: boolean;
  answerString?: string;
  answerInteger?: number;
  answerCoding?: {
    system?: string;
    code: string;
    display?: string;
  };
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

  enableWhen?: AyuEnableWhen[];

  //  enableBehavior?: 'all' | 'any';

  /** FHIR: item.answerOption */
  answerOption?: AyuAnswerOption[];

  /** FHIR: item.item (nested items) */
  item?: AyuQuestion[];

  /** UI-only overrides (optional) */
  ui?: {
    inputType?: 'radio' | 'select';
    placeholder?: string;
  };
  extension?: {
    url: string;
    valueString?: string;
  }[];
}
