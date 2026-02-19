export interface PhysicalExamOption {
  id: string;
  text: string;
  language?: string;
  'display-or'?: string;
  'display-hi'?: string;
  'display-gu'?: string;
  'display-as'?: string;
  'display-bn'?: string;
  'display-kn'?: string;
  'display-mr'?: string;
  'input-type'?: string;
  'is-exclusive-option'?: string | boolean;
  'exclude-from-multi-choice'?: boolean;
  'job-aid-type'?: string;
  'job-aid-file'?: string;
  isRequired?: string | boolean;
  'enable-exclusive-option'?: string | boolean;
  'multi-choice'?: boolean;
  havingNestedQuestion?: string | boolean;
  options?: PhysicalExamOption[];
}

export interface PhysicalExamCategory {
  id: string;
  text: string;
  language?: string;
  'display-or'?: string;
  'display-hi'?: string;
  'display-gu'?: string;
  'display-as'?: string;
  'display-bn'?: string;
  'display-kn'?: string;
  'display-mr'?: string;
  options?: PhysicalExamOption[];
}

export interface PhysicalExamData {
  id: string;
  text: string;
  engineVersion: string;
  options: PhysicalExamCategory[];
}

export interface PhysicalExamAnswer {
  questionId: string;
  answerId: string | string[];
  answerText?: string;
  imageData?: string;
}

export interface FlattenedQuestion {
  id: string;
  text: string;
  categoryPath: string[];
  isRequired: boolean;
  multiChoice: boolean;
  enableExclusiveOption: boolean;
  jobAidType?: string;
  jobAidFile?: string;
  options: PhysicalExamOption[];
  parentAnswerId?: string;
}
