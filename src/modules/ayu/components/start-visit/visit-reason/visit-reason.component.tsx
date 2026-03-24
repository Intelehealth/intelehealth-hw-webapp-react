import { useCallback, useMemo, useState } from 'react';
import iconVisitReason from '../../../../../assets/icons/visit-reason.svg';
import { useGlobalModal } from '../../../../../components/modal/global-modal-context';
import type {
  AyuAnswerValue,
  AyuQuestion,
} from '../../../../ayu-library/types/ayu.types';
import type { SectionProps } from '../../../../ayu-library/types/start-visit.types';
import { transformFhirToAyu } from '../../../../ayu-library/utils/fhir-to-ayu.util';
import { useStartVisitData } from '../../../context/start-visit.context';
import {
  CONFIRM_MODAL_DESCRIPTION,
  CONFIRM_MODAL_NO,
  CONFIRM_MODAL_TITLE,
  CONFIRM_MODAL_YES,
  VISIT_REASON_SUMMARY_TITLE,
} from '../../../utils/ayu.constants';
import { buildVisitSummary } from '../../../utils/visit-summary.util';
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
  visitReasons,
  onReasonsConfirmed,
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
  } = visitReasons!;

  const { setVisitReasonData } = useStartVisitData();
  const { showConfirmModal } = useGlobalModal();

  const canSubmit = selectedReasons.length > 0;

  const handleNext = () => {
    if (!canSubmit) return;

    showConfirmModal({
      icon: iconVisitReason,
      title: CONFIRM_MODAL_TITLE,
      description: CONFIRM_MODAL_DESCRIPTION,
      confirmText: CONFIRM_MODAL_YES,
      cancelText: CONFIRM_MODAL_NO,
      type: 'confirm',
      items: selectedReasons,
      open: true,
      onConfirm: () => {
        onReasonsConfirmed?.(selectedReasons);
        const schema = transformFhirToAyu(selectedComplaints[0].json);
        setAyuSchema(schema);
        setShowStepper(true); //Switch UI
      },
    });
  };

  const stableSchema = useMemo(() => ayuSchema, [ayuSchema]);

  const handleStepperComplete = useCallback(
    (answers: Record<string, AyuAnswerValue>) => {
      // Use buildVisitSummary to properly resolve answer codes to display text
      const topLevelItems = (stableSchema?.item ?? []).filter(
        q => q.type !== 'group'
      );
      const answersMap = new Map(Object.entries(answers));
      const sections = buildVisitSummary(topLevelItems, answersMap, '');
      const details: Array<{ label: string; value: string }> = [];
      for (const section of sections) {
        for (const item of section.items) {
          if (item.type === 'labelValue') {
            details.push({
              label: item.label,
              value: String(item.value ?? ''),
            });
          } else if (item.type === 'subheading') {
            details.push({
              label: item.heading,
              value: item.values.join(', '),
            });
          }
        }
      }

      setVisitReasonData(answers, selectedReasons, details);
      onProgressUpdate?.(1, 1);
      onNextQuestion();
    },
    [
      onProgressUpdate,
      onNextQuestion,
      stableSchema,
      selectedReasons,
      setVisitReasonData,
    ]
  );

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
          summaryTitle={VISIT_REASON_SUMMARY_TITLE}
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
