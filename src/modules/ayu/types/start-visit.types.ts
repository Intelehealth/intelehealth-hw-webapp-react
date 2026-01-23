export interface SectionProps {
  questionIndex: number;

  onNextQuestion: () => void;
  onPrevQuestion?: () => void;

  onPrevSection?: () => void;
}

export interface SectionState {
  totalQuestions: number;
  answeredQuestions: number;
  name: string;
}
