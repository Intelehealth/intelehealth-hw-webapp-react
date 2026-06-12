import type { VisitReasonsResult } from '../../ayu/hooks/useVisitReasons.hook';
import type { AyuJsonItem } from './ayu-json.types';

export interface SectionProps {
  questionIndex: number;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onPrevSection?: () => void;
  onProgressUpdate?: (total: number, answered: number) => void;
  onSubtitleChange?: (subtitle: string) => void;
  physicalExamFilter?: string;
  ayuConfigFiles?: AyuJsonItem[];
  visitReasons?: VisitReasonsResult;
  onReasonsConfirmed?: (reasons: string[]) => void;
  onStepperActiveChange?: (active: boolean) => void;
  onProtocolCleared?: () => void;
}

export interface SectionState {
  totalQuestions: number;
  answeredQuestions: number;
  name: string;
  currentStepIndex?: number;
}
