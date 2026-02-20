import type { FhirExtension, FhirTranslatableElement } from './fhir-raw.types';

export type AyuQuestionType =
  | 'group'
  | 'display'
  | 'string'
  | 'integer'
  | 'decimal'
  | 'date'
  | 'choice'
  | 'quantity';

export interface AyuAnswerOption {
  valueString?: string;
  valueInteger?: number;
  valueDate?: string;
  valueCoding?: {
    code: string;
    display?: string;
    _display?: FhirTranslatableElement;
  };
  extension?: FhirExtension[];
}

export interface FhirQuestionnaire {
  resourceType: string;
  item?: AyuQuestion[];
}

export interface AyuEnableWhen {
  question: string;
  operator: string;
  answerBoolean?: boolean;
  answerString?: string;
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

  _text?: FhirTranslatableElement;

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

  // enableBehavior?: 'all' | 'any';

  extension?: FhirExtension[];

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
