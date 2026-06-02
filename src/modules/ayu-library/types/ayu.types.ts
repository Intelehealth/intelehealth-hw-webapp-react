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

export interface DropdownValues {
  number?: string | number | null;
  days?: string | null;
}

export interface DurationAnswer {
  dropdownValues: DropdownValues;
}

export interface QuantityAnswer {
  value?: number | string | null;
  unit?: string;
}

export interface RangeAnswer {
  low?: number;
  high?: number;
}

export type AyuAnswerValue =
  | string
  | number
  | boolean
  | DurationAnswer
  | QuantityAnswer
  | RangeAnswer
  | string[]
  | null
  | undefined;

export interface FhirQuestionnaire {
  resourceType?: string;
  item?: AyuQuestion[];
  text?: string;
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

  _text?: FhirTranslatableElement;

  /** FHIR: item.type */
  type: string;

  /** FHIR: item.required */
  required?: boolean;

  /** FHIR: item.readOnly */
  readOnly?: boolean;

  /** FHIR: item.repeats */
  repeats?: boolean;

  enableWhen?: AyuEnableWhen[];

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

  /**
   * Source protocol code, set only when a multi-protocol selection is merged
   * via mergeProtocols. Single-protocol flows leave this unset.
   */
  protocolCode?: string;
}
