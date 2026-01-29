/* =========================================
 * RAW FHIR TYPES (as-is JSON)
 * ========================================= */

export interface FhirExtension {
  url: string;
  valueBoolean?: boolean;
  valueString?: string;
  valueCode?: string;
  extension?: FhirExtension[];
}

export interface FhirTranslatableElement {
  extension?: FhirExtension[];
}

export interface FhirItem {
  linkId: string;

  text?: string;
  _text?: FhirTranslatableElement;

  /** IMPORTANT: raw FHIR uses string */
  type: string;

  required?: boolean;
  readOnly?: boolean;
  repeats?: boolean;

  answerOption?: {
    valueString?: string;
    valueInteger?: number;
    valueDate?: string;
    valueCoding?: {
      code: string;
      display?: string;
      _display?: FhirTranslatableElement;
    };
    extension?: FhirExtension[];
  }[];

  enableWhen?: {
    question: string;
    operator: string;
    answerBoolean?: boolean;
    answerString?: string;
    answerCoding?: { code: string };
  }[];

  // enableBehavior?: string;

  extension?: FhirExtension[];
  item?: FhirItem[];
}

export interface FhirQuestionnaire {
  resourceType: 'Questionnaire';

  id?: string;
  title?: string;
  _title?: FhirTranslatableElement;

  status?: string;
  language?: string;

  item?: FhirItem[];
  extension?: FhirExtension[];
}

export interface FhirEnableWhen {
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
