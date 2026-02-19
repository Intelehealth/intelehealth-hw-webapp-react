interface SectionProgress {
  totalQuestions: number;
  answeredQuestions: number;
}

interface SectionCompletionLoaderProps {
  sections: SectionProgress[]; // length = 4
  currentSectionIndex: number; // 0-based
}

interface SideLoaderProps {
  sections: {
    totalQuestions: number;
  }[];
  currentSectionIndex: number;
  currentQuestionIndex: number;
}

export type { SectionCompletionLoaderProps, SectionProgress, SideLoaderProps };
