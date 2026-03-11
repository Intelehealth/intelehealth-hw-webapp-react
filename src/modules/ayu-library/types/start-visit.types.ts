export interface SectionProps {
  questionIndex: number;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onPrevSection?: () => void;
  onProgressUpdate?: (total: number, answered: number) => void;
  physicalExamFilter?: string;
}

export interface SectionState {
  totalQuestions: number;
  answeredQuestions: number;
  name: string;
  currentStepIndex?: number;
}
