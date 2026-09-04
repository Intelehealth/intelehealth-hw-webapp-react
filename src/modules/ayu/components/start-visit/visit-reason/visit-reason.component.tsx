import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import iconVisitReason from '../../../../../assets/icons/visit-reason.svg';
import { useGlobalModal } from '../../../../../components/modal/global-modal-context';
import type {
  AyuAnswerValue,
  AyuQuestion,
} from '../../../../ayu-library/types/ayu.types';
import type { SectionProps } from '../../../../ayu-library/types/start-visit.types';
import { mergeProtocols } from '../../../../ayu-library/utils/merge-protocols.util';
import { extractGenderLinkIds } from '../../../../ayu-library/utils/question.utils';
import iconWashHand from '../../../assets/wash-hand.svg';
import { useStartVisitData } from '../../../context/start-visit.context';
import { usePatientDemographics } from '../../../hooks/useVisitReasons.hook';
import {
  ALL_REASONS_LABEL,
  BUTTON_BACK,
  BUTTON_SAVE_NEXT,
  CONFIRM_MODAL_DESCRIPTION,
  CONFIRM_MODAL_NO,
  CONFIRM_MODAL_OK,
  CONFIRM_MODAL_TITLE,
  CONFIRM_MODAL_YES,
  ITEM_TYPES,
  PHYSCAL_EXAM_DESCRIPTION,
  REMOVE_REASON_CONFIRM_DESCRIPTION,
  REMOVE_REASON_CONFIRM_TITLE,
  VISIT_REASON_SUMMARY_TITLE,
} from '../../../utils/ayu.constants';
import { buildVisitSummary } from '../../../utils/visit-summary.util';
import AyuButton from '../../common/ayu-button.component';
import { QuestionLoader } from '../../loaders/question-loader.component';
import type { AyuStepperContainerHandle } from './ayu-stepper-container.component';
import { AyuStepperContainer } from './ayu-stepper-container.component';
import { VisitReasonFooter } from './footer';
import { ReasonAlphabetList } from './reason-alphabetList.component';
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
  onStepperActiveChange,
  onProtocolCleared,
  isActive,
}: SectionProps) => {
  const {
    search,
    setSearch,
    filteredNames,
    selectedReasons,
    disabledReasons,
    addReason,
    removeReason,
    clearReasons,
    grouped,
    selectedComplaints,
  } = visitReasons!;

  const { data, setVisitReasonData, clearVisitReasonData, saveSectionToTemp } =
    useStartVisitData();
  const savedAnswers = data.visitReason?.answers;

  const patientDemographics = usePatientDemographics();

  const [showStepper, setShowStepper] = useState(() => !!savedAnswers);
  const [summaryShown, setSummaryShown] = useState(false);
  const [ayuSchema, setAyuSchema] = useState<AyuQuestion | null>(() => {
    if (savedAnswers && selectedComplaints.length > 0) {
      return mergeProtocols(selectedComplaints, patientDemographics);
    }
    return null;
  });

  useEffect(() => {
    if (savedAnswers && selectedComplaints.length > 0 && !ayuSchema) {
      setAyuSchema(mergeProtocols(selectedComplaints, patientDemographics));
    }
  }, [savedAnswers, selectedComplaints, ayuSchema, patientDemographics]);

  const { showConfirmModal } = useGlobalModal();
  const stepperRef = useRef<AyuStepperContainerHandle>(null);

  useEffect(() => {
    onStepperActiveChange?.(showStepper && !!ayuSchema);
  }, [showStepper, ayuSchema, onStepperActiveChange]);

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
        const schema = mergeProtocols(selectedComplaints, patientDemographics);
        setAyuSchema(schema);
        setSummaryShown(false);
        setShowStepper(true); //Switch UI
      },
    });
  };

  const stableSchema = useMemo(() => ayuSchema, [ayuSchema]);

  const genderLinkIds = useMemo(
    () => extractGenderLinkIds(stableSchema?.item ?? []),
    [stableSchema]
  );

  const handleResetAnswers = useCallback(() => {
    clearReasons();
    clearVisitReasonData();
    saveSectionToTemp({ visitReason: null, confirmedReasons: [] });
    setAyuSchema(null);
    setShowStepper(false);
    setSummaryShown(false);
    onProgressUpdate?.(1, 0);
    onProtocolCleared?.();
  }, [
    clearReasons,
    clearVisitReasonData,
    saveSectionToTemp,
    onProgressUpdate,
    onProtocolCleared,
  ]);

  const hasAnsweredQuestions =
    !!savedAnswers && Object.keys(savedAnswers).length > 0;

  const handleRemoveReason = useCallback(
    (reason: string) => {
      // Nothing to clear yet — just remove the chip.
      if (!hasAnsweredQuestions && !ayuSchema) {
        removeReason(reason);
        return;
      }

      showConfirmModal({
        title: REMOVE_REASON_CONFIRM_TITLE,
        description: REMOVE_REASON_CONFIRM_DESCRIPTION,
        confirmText: CONFIRM_MODAL_YES,
        cancelText: CONFIRM_MODAL_NO,
        type: 'confirm',
        open: true,
        onConfirm: () => {
          clearVisitReasonData();
          saveSectionToTemp({ visitReason: null, confirmedReasons: [] });
          setAyuSchema(null);
          setShowStepper(false);
          setSummaryShown(false);
          onProgressUpdate?.(1, 0);
          removeReason(reason);
          onProtocolCleared?.();
        },
      });
    },
    [
      hasAnsweredQuestions,
      ayuSchema,
      removeReason,
      showConfirmModal,
      clearVisitReasonData,
      saveSectionToTemp,
      onProgressUpdate,
      onProtocolCleared,
    ]
  );

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

      const detailsSections = sections.map(({ title, items }) => ({
        title,
        items,
      }));

      setVisitReasonData(answers, selectedReasons, details, detailsSections);
      saveSectionToTemp({
        visitReason: {
          answers,
          reasonNames: selectedReasons,
          details,
          detailsSections,
        },
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
    const showFooter = isReviewMode || summaryShown;
    return (
      <div className="w-full flex flex-col mt-4">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[996px]">
            {/*
             * isActive is forwarded verbatim from the parent section so
             * AyuStepperContainer can detect false→true transitions and open
             * the last question for editing when the user navigates back from
             * Physical Exam. VisitReason itself has no per-render use for it.
             */}
            <AyuStepperContainer
              ref={stepperRef}
              questionnaire={stableSchema}
              summaryTitle={VISIT_REASON_SUMMARY_TITLE}
              initialAnswers={savedAnswers}
              onComplete={handleStepperComplete}
              onProgressUpdate={handleStepperProgress}
              onSummaryShown={() => setSummaryShown(true)}
              isActive={isActive}
              resetLinkIds={genderLinkIds}
              onResetAnswers={handleResetAnswers}
            />
          </div>
        </div>
        {showFooter && (
          <div className="border-t border-gray-200 pt-3">
            <div className="flex gap-3 md:justify-end">
              <AyuButton
                type="button"
                variant="primarylight"
                size="md"
                onClick={() => {
                  const currentAnswers = stepperRef.current?.getAnswers() ?? {};
                  if (Object.keys(currentAnswers).length > 0) {
                    setVisitReasonData(currentAnswers, selectedReasons, []);
                    saveSectionToTemp({
                      visitReason: {
                        answers: currentAnswers,
                        reasonNames: selectedReasons,
                        details: [],
                      },
                      confirmedReasons: selectedReasons,
                    });
                  }
                  onProgressUpdate?.(1, 0);
                  setShowStepper(false);
                }}
                className="w-full md:w-[10%]"
              >
                <span className="mx-auto w-full text-base">{BUTTON_BACK}</span>
              </AyuButton>
              <AyuButton
                type="button"
                variant="primary"
                size="md"
                onClick={() => stepperRef.current?.showSummary()}
                className="w-full md:w-[10%]"
              >
                <span className="mx-auto w-full text-base">
                  {BUTTON_SAVE_NEXT}
                </span>
              </AyuButton>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DEFAULT VISIT REASON UI
  return (
    <div className="w-full flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col gap-4 mt-4 w-full max-w-[996px]">
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

          <div className="flex flex-col gap-4 pl-[80px]">
            <SelectedReasons
              selectedReasons={selectedReasons}
              removeReason={handleRemoveReason}
            />

            <div className="flex flex-col">
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                {ALL_REASONS_LABEL}
              </h3>

              <ReasonAlphabetList
                grouped={grouped}
                selectedReasons={selectedReasons}
                disabledReasons={disabledReasons}
                addReason={addReason}
              />
            </div>
          </div>
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
