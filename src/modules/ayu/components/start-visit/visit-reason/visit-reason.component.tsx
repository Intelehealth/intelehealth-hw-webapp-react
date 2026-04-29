import { useCallback, useMemo, useRef, useState } from 'react';
import iconRightArrow from '../../../../../assets/icons/icon-right-arrow.svg';
import iconVisitReason from '../../../../../assets/icons/visit-reason.svg';
import { useGlobalModal } from '../../../../../components/modal/global-modal-context';
import type {
  AyuAnswerValue,
  AyuQuestion,
} from '../../../../ayu-library/types/ayu.types';
import type { SectionProps } from '../../../../ayu-library/types/start-visit.types';
import { transformFhirToAyu } from '../../../../ayu-library/utils/fhir-to-ayu.util';
import iconWashHand from '../../../assets/wash-hand.svg';
import { useStartVisitData } from '../../../context/start-visit.context';
import { usePatientDemographics } from '../../../hooks/useVisitReasons.hook';
import {
  BUTTON_BACK,
  BUTTON_CONFIRM,
  CONFIRM_MODAL_DESCRIPTION,
  CONFIRM_MODAL_NO,
  CONFIRM_MODAL_OK,
  CONFIRM_MODAL_TITLE,
  CONFIRM_MODAL_YES,
  ITEM_TYPES,
  PHYSCAL_EXAM_DESCRIPTION,
  VISIT_REASON_SUMMARY_TITLE,
} from '../../../utils/ayu.constants';
import { buildVisitSummary } from '../../../utils/visit-summary.util';
import AyuButton from '../../common/ayu-button.component';
import { QuestionLoader } from '../../loaders/question-loader.component';
import type { AyuStepperContainerHandle } from './ayu-stepper-container.component';
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
  const {
    search,
    setSearch,
    filteredNames,
    selectedReasons,
    disabledReasons,
    addReason,
    removeReason,
    grouped,
    selectedComplaints,
  } = visitReasons!;

  const { data, setVisitReasonData, saveSectionToTemp } = useStartVisitData();
  const savedAnswers = data.visitReason?.answers;

  const patientDemographics = usePatientDemographics();

  const [showStepper, setShowStepper] = useState(() => !!savedAnswers);
  const [ayuSchema, setAyuSchema] = useState<AyuQuestion | null>(() => {
    if (savedAnswers && selectedComplaints.length > 0) {
      return transformFhirToAyu(
        selectedComplaints[0].json,
        patientDemographics
      );
    }
    return null;
  });
  const { showConfirmModal } = useGlobalModal();
  const stepperRef = useRef<AyuStepperContainerHandle>(null);

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
        const schema = transformFhirToAyu(
          selectedComplaints[0].json,
          patientDemographics
        );
        setAyuSchema(schema);
        setShowStepper(true); //Switch UI
      },
    });
  };

  const stableSchema = useMemo(() => ayuSchema, [ayuSchema]);

  const handleStepperComplete = useCallback(
    (answers: Record<string, AyuAnswerValue>) => {
      const topLevelItems = (stableSchema?.item ?? []).filter(
        q => q.type !== ITEM_TYPES.GROUP
      );
      const answersMap = new Map(Object.entries(answers));
      const sections = buildVisitSummary(topLevelItems, answersMap, '');
      const details: Array<{ label: string; value: string }> = [];
      for (const section of sections) {
        for (const item of section.items) {
          if (item.type === ITEM_TYPES.LABEL_VALUE) {
            details.push({
              label: item.label,
              value: String(item.value ?? ''),
            });
          } else if (item.type === ITEM_TYPES.SUBHEADING) {
            details.push({
              label: item.heading,
              value: item.values.join(', '),
            });
          }
        }
      }

      setVisitReasonData(answers, selectedReasons, details);
      saveSectionToTemp({
        visitReason: { answers, reasonNames: selectedReasons, details },
        confirmedReasons: selectedReasons,
      });

      // Show wash-hands modal only on first navigation to Physical Exam
      if (savedAnswers) {
        onProgressUpdate?.(1, 1);
        onNextQuestion();
      } else {
        setTimeout(() => {
          showConfirmModal({
            icon: iconWashHand,
            size: 'sm',
            description: PHYSCAL_EXAM_DESCRIPTION,
            confirmText: CONFIRM_MODAL_OK,
            type: 'confirm',
            open: true,
            title: '',
            onConfirm: () => {
              onProgressUpdate?.(1, 1);
              onNextQuestion();
            },
          });
        }, 0);
      }
    },
    [
      onProgressUpdate,
      onNextQuestion,
      stableSchema,
      selectedReasons,
      setVisitReasonData,
      saveSectionToTemp,
      showConfirmModal,
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
    const isReviewMode = !!savedAnswers;
    return (
      <div className="w-full flex flex-col h-full">
        <AyuStepperContainer
          ref={stepperRef}
          questionnaire={stableSchema}
          summaryTitle={VISIT_REASON_SUMMARY_TITLE}
          initialAnswers={savedAnswers}
          onComplete={handleStepperComplete}
          onProgressUpdate={handleStepperProgress}
        />
        {/* Navigation buttons — pinned to bottom (same pattern as Medical History) */}
        {isReviewMode && (
          <div className="sticky bottom-0 bg-white pt-2 pb-4 flex gap-3 md:justify-end">
            <AyuButton
              type="button"
              variant="secondary"
              onClick={() => {
                setShowStepper(false);
              }}
              className="w-full md:w-[10%]"
            >
              <span className="mx-auto w-full text-base">{BUTTON_BACK}</span>
            </AyuButton>
            <AyuButton
              type="button"
              variant="primary"
              rightIcon={<img src={iconRightArrow} alt="yes" />}
              onClick={() => stepperRef.current?.showSummary()}
              className="w-full md:w-[10%]"
            >
              <span className="mx-auto w-full text-base">{BUTTON_CONFIRM}</span>
            </AyuButton>
          </div>
        )}
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
              disabledReasons={disabledReasons}
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
            disabledReasons={disabledReasons}
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
