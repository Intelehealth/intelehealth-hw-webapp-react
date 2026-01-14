import { QuestionLoader } from './question-loader.component';
import { SectionCompletionLoader } from './section-completion-loader.component';
import { SideLoader } from './side-loader.component';

interface LoaderProps {
  type: 'section' | 'side' | 'question';
  currentSectionIndex?: number;
}

const sections = [
  { totalQuestions: 10, answeredQuestions: 2 },
  { totalQuestions: 8, answeredQuestions: 0 },
  { totalQuestions: 6, answeredQuestions: 1 },
  { totalQuestions: 5, answeredQuestions: 0 },
];

export const Loader = ({ type, currentSectionIndex }: LoaderProps) => {
  switch (type) {
    case 'section':
      return (
        <SectionCompletionLoader
          sections={sections}
          currentSectionIndex={currentSectionIndex || 0}
        />
      );

    case 'side':
      return <SideLoader totalQuestions={5} currentQuestionIndex={3} />;

    case 'question':
      return <QuestionLoader />;

    default:
      return null;
  }
};
