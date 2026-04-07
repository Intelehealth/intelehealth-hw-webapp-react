import type { PhysicalExamQuestion } from '../../../data/physical-exam.data';

export interface QuestionCardProps {
  question: PhysicalExamQuestion;
  index: number;
  totalQuestions: number;
  isActive: boolean;
  selectedOptions: string[];
  cameraImages: string[];
  onSelectSingle: (id: string) => void;
  onSelectSinglePast: (id: string) => void;
  onToggleMulti: (id: string) => void;
  onSkip: () => void;
  onAddCameraImage: (f: File) => void;
  onRemoveCameraImage: (i: number) => void;
  onClearCameraImages: () => void;
  onUploadImages: () => void;
  activeRef: React.RefObject<HTMLDivElement | null>;
  isSubmitted: boolean;
}
