import { QuestionLoader } from '../../loaders/question-loader.component';
import { VisitReasonFooter } from './footer';
import { ReasonAlphabetList } from './reason-alphabetList.component';
import { ReasonCategoryList } from './reason-categoryList.component';
import { ReasonSearchInput } from './search-input.component';
import { SelectedReasons } from './selected-reasons.component';
import { useVisitReasons } from './useVisitReasons.hook';

interface SectionProps {
  questionIndex: number;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onPrevSection?: () => void;
}

export const VisitReason = ({
  questionIndex,
  onNextQuestion,
  onPrevQuestion,
  onPrevSection,
}: SectionProps) => {
  const TOTAL_QUESTIONS = 6;

  const {
    search,
    setSearch,
    filteredNames,
    selectedReasons,
    addReason,
    removeReason,
    grouped,
  } = useVisitReasons();

  return (
    <div className="w-full flex flex-col h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-4">
        {/* LEFT SIDE */}
        <div>
          <QuestionLoader
            question="What is the reason for this visit?"
            questionIndex={questionIndex}
            totalQuestions={TOTAL_QUESTIONS}
            onNextQuestion={onNextQuestion}
          >
            <ReasonSearchInput
              search={search}
              setSearch={setSearch}
              filteredNames={filteredNames}
              addReason={addReason}
            />
          </QuestionLoader>
          <SelectedReasons
            selectedReasons={selectedReasons}
            removeReason={removeReason}
          />
        </div>

        {/* RIGHT SIDE */}
        <div className="flex flex-col">
          <ReasonCategoryList addReason={addReason} />

          <ReasonAlphabetList
            grouped={grouped}
            selectedReasons={selectedReasons}
            addReason={addReason}
          />
        </div>
      </div>

      <VisitReasonFooter
        questionIndex={questionIndex}
        totalQuestions={TOTAL_QUESTIONS}
        onPrevQuestion={onPrevQuestion}
        onPrevSection={onPrevSection}
        onNextQuestion={onNextQuestion}
      />
    </div>
  );
};
