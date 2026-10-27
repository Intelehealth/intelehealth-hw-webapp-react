export type PhysicalExamAnswers = Record<string, string[]>;

export interface PhysicalExamOption {
  id: string;
  text: string;
  isCamera?: boolean;
  isExclusiveOption?: boolean;
  excludeFromMulti?: boolean;
}

export interface PhysicalExamQuestion {
  id: string;
  sectionLabel: string;
  categoryLabel: string;
  questionText: string;
  isRequired: boolean;
  isMultiChoice: boolean;
  jobAidType?: 'image' | 'video';
  jobAidFile?: string;
  options: PhysicalExamOption[];
  /** If set, only show this question when the parent question has the given option selected */
  showWhen?: { questionId: string; optionId: string };
  /** Protocol section key — matches the section name in perform-physical-exam (e.g. "Hands", "Throat") */
  sectionKey: string;
  /** Protocol question key — matches the question name in perform-physical-exam (e.g. "Nails cyanosis") */
  questionKey?: string;
}
