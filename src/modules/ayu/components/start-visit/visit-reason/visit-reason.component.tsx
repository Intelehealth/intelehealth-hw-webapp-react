import { useState } from 'react';
import iconVisitReason from '../../../../../assets/icons/visit-reason.svg';
import { useGlobalModal } from '../../../../../components/modal/global-modal-context';
import { transformFhirToAyu } from '../../../../ayu-library/utils/fhir-to-ayu.util';
import { useVisitReasons } from '../../../hooks/useVisitReasons.hook';
import type { AyuQuestion } from '../../../types/ayu.types';
import type { SectionProps } from '../../../types/start-visit.types';
import { QuestionLoader } from '../../loaders/question-loader.component';
import { AyuStepperContainer } from './ayu-stepper-container.component';
import { VisitReasonFooter } from './footer';
import { ReasonAlphabetList } from './reason-alphabetList.component';
import { ReasonCategoryList } from './reason-categoryList.component';
import { ReasonSearchInput } from './search-input.component';
import { SelectedReasons } from './selected-reasons.component';

export const VisitReason = ({
  questionIndex,
  onNextQuestion,
  onPrevQuestion,
  onPrevSection,
  onProgressUpdate,
}: SectionProps) => {
  const [showStepper, setShowStepper] = useState(false);
  const [ayuSchema, setAyuSchema] = useState<AyuQuestion | null>(null);

  const {
    search,
    setSearch,
    filteredNames,
    selectedReasons,
    addReason,
    removeReason,
    grouped,
    selectedComplaints,
  } = useVisitReasons();

  const { showConfirmModal } = useGlobalModal();

  const canSubmit = selectedReasons.length > 0;

  const handleNext = () => {
    if (!canSubmit) return;

    showConfirmModal({
      icon: iconVisitReason,
      title: 'Confirm visit reason?',
      description:
        'Are you sure the patient has the following reasons for a visit?',
      confirmText: 'Yes',
      cancelText: 'No',
      type: 'confirm',
      items: selectedReasons,
      open: true,
      onConfirm: () => {
        const schema = transformFhirToAyu(selectedComplaints[0].json);

        setAyuSchema(schema);
        setShowStepper(true); //Switch UI
      },
    });
  };

  // STEP 2: If stepper active, render it instead
  if (showStepper && ayuSchema) {
    return (
      <div className="w-full flex flex-col h-full">
        <AyuStepperContainer
          questionnaire={ayuSchema}
          onComplete={() => {
            // Mark Visit Reason section as fully complete (1 out of 1 questions)
            onProgressUpdate?.(1, 1);
            setShowStepper(false); // optional
            onNextQuestion(); // move to next main section
          }}
          onProgressUpdate={(total: number, answered: number) => {
            // Keep parent's totalQuestions as 1, but update answered progress as a fraction
            // This treats the entire stepper as a single question
            onProgressUpdate?.(1, answered === total ? 1 : 0);
          }}
        />
      </div>
    );
  }

  // DEFAULT VISIT REASON UI
  return (
    <div className="w-full flex flex-col h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-4">
        {/* LEFT SIDE */}
        <div>
          <QuestionLoader
            questionIndex={questionIndex}
            totalQuestions={1}
            isShowQuestionNumber={false}
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
        totalQuestions={1}
        onPrevQuestion={onPrevQuestion}
        onPrevSection={onPrevSection}
        onNextQuestion={handleNext}
        isNextDisabled={!canSubmit}
      />
    </div>
  );
};
