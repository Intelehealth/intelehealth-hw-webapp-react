interface SectionProgress {
  totalQuestions: number;
  answeredQuestions: number;
}

interface SectionCompletionLoaderProps {
  sections: SectionProgress[]; // length = 4
  currentSectionIndex: number; // 0-based
  currentQuestionIndex: number; // 0-based
}

interface SideLoaderProps {
  totalQuestions: number;
  currentQuestionIndex: number; // 0-based
}

export type { SectionCompletionLoaderProps, SectionProgress, SideLoaderProps };
