import { useCallback, useMemo, useState } from 'react';
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

  const stableSchema = useMemo(() => ayuSchema, [ayuSchema]);

  const handleStepperComplete = useCallback(() => {
    onProgressUpdate?.(1, 1);
    setShowStepper(false);
    onNextQuestion();
  }, [onProgressUpdate, onNextQuestion]);

  const handleStepperProgress = useCallback(
    (total: number, answered: number) => {
      onProgressUpdate?.(total, answered);
    },
    [onProgressUpdate]
  );

  // STEP 2: If stepper active, render it instead
  if (showStepper && stableSchema) {
    return (
      <div className="w-full flex flex-col h-full">
        <AyuStepperContainer
          questionnaire={stableSchema}
          onComplete={handleStepperComplete}
          onProgressUpdate={handleStepperProgress}
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
