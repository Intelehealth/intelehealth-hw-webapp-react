import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import iconRightArrow from '../../../../../assets/icons/icon-right-arrow.svg';
import iconVisitReasonSummary from '../../../../../assets/icons/visit-reason.svg';
import type { ModalSection } from '../../../../../components/modal/global-modal-context';
import { useGlobalModal } from '../../../../../components/modal/global-modal-context';
import type { AyuAnswerValue } from '../../../../ayu-library/types/ayu.types';
import type { SectionProps } from '../../../../ayu-library/types/start-visit.types';
import { transformFhirToAyu } from '../../../../ayu-library/utils/fhir-to-ayu.util';
import { useStartVisitData } from '../../../context/start-visit.context';
import {
  BUTTON_BACK,
  BUTTON_CONFIRM,
  MEDICAL_HISTORY_SUMMARY_TITLE,
  SUMMARY_CANCEL_TEXT,
  SUMMARY_CONFIRM_TEXT,
} from '../../../utils/ayu.constants';
import { buildVisitSummary } from '../../../utils/visit-summary.util';
import AyuButton from '../../common/ayu-button.component';
import type { AyuStepperContainerHandle } from '../visit-reason/ayu-stepper-container.component';
import { AyuStepperContainer } from '../visit-reason/ayu-stepper-container.component';

const HISTORY_JSON_NAMES = ['patHist', 'famHist'];

interface FileResult {
  title: string;
  sections: ModalSection[];
}

export const MedicalHistory = ({
  onPrevSection,
  onProgressUpdate,
  onSubtitleChange,
  ayuConfigFiles,
}: SectionProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setMedicalHistoryData } = useStartVisitData();
  const [currentStep, setCurrentStep] = useState(0);
  const fileResultsRef = useRef<FileResult[]>([]);
  const fileAnswersRef = useRef<Record<string, Record<string, AyuAnswerValue>>>(
    {}
  );
  const stepperRef = useRef<AyuStepperContainerHandle>(null);
  const { showVitalConfirmationModal } = useGlobalModal();

  const historyFiles = useMemo(() => {
    if (!ayuConfigFiles) return [];
    return HISTORY_JSON_NAMES.map(name =>
      ayuConfigFiles.find(f => f.name.replace(/\.json$/i, '') === name)
    ).filter(Boolean);
  }, [ayuConfigFiles]);

  const schemas = useMemo(() => {
    return historyFiles.map(file => ({
      name: file!.name.replace(/\.json$/i, ''),
      title: file!.json?.title ?? file!.name,
      schema: transformFhirToAyu(file!.json),
    }));
  }, [historyFiles]);

  // Precompute total question count across all files so the counter is
  // correct even before later files have rendered their steppers.
  const precomputedTotal = useMemo(() => {
    return schemas.reduce((sum, s) => {
      const items = s.schema?.item || [];
      return sum + items.filter(item => item.type !== 'group').length;
    }, 0);
  }, [schemas]);

  const currentSchema = schemas[currentStep];

  // Review mode: true when returning from "Change" in the summary modal
  const isReviewMode = !!fileAnswersRef.current[currentSchema?.name];

  useEffect(() => {
    if (currentSchema?.title) {
      onSubtitleChange?.(currentSchema.title);
    }
  }, [currentSchema?.title, onSubtitleChange]);

  const showCombinedSummary = useCallback(() => {
    const combinedSections = fileResultsRef.current.flatMap((r, fileIndex) =>
      r.sections.map(section => ({
        ...section,
        onChange: () => {
          setCurrentStep(fileIndex);
        },
      }))
    );

    showVitalConfirmationModal({
      icon: iconVisitReasonSummary,
      title: MEDICAL_HISTORY_SUMMARY_TITLE,
      sections: combinedSections,
      confirmText: SUMMARY_CONFIRM_TEXT,
      cancelText: SUMMARY_CANCEL_TEXT,
      open: false,
      type: 'vitalConfirm',
      size: 'lg',
      onConfirm: () => {
        const patHist = (fileResultsRef.current[0]?.sections ?? []).map(s => ({
          title: s.title,
          items: s.items,
        }));
        const famHist = (fileResultsRef.current[1]?.sections ?? []).map(s => ({
          title: s.title,
          items: s.items,
        }));
        setMedicalHistoryData(patHist, famHist);
        const basePath = location.pathname.replace(/\/$/, '');
        navigate(`${basePath}/visit-summary`);
      },
    });
  }, [
    showVitalConfirmationModal,
    navigate,
    setMedicalHistoryData,
    location.pathname,
  ]);

  const handleComplete = useCallback(
    (answers: Record<string, AyuAnswerValue>) => {
      const schema = schemas[currentStep];
      if (!schema?.schema) return;

      // Store answers for this file so they can be restored on "Change"
      fileAnswersRef.current[schema.name] = answers;

      const topLevelItems = (schema.schema.item || []).filter(
        item => item.type !== 'group'
      );
      const answersMap = new Map(Object.entries(answers));
      const rawSections = buildVisitSummary(
        topLevelItems,
        answersMap,
        schema.schema.text || schema.title,
        { useLabeledFormat: true }
      );

      // Merge all sections (main items + associated symptoms) into one section per file
      const mergedItems = rawSections.flatMap(s => s.items);
      const sections: ModalSection[] =
        mergedItems.length > 0
          ? [{ title: schema.schema.text || schema.title, items: mergedItems }]
          : [];

      fileResultsRef.current = [
        ...fileResultsRef.current.slice(0, currentStep),
        { title: schema.title, sections },
      ];

      if (currentStep < schemas.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        showCombinedSummary();
      }
    },
    [currentStep, schemas, showCombinedSummary]
  );

  // Track per-file totals so progress accumulates across patHist + famHist
  const fileProgressRef = useRef<{ total: number; answered: number }[]>(
    schemas.map(() => ({ total: 0, answered: 0 }))
  );

  const handleProgressUpdate = useCallback(
    (total: number, answered: number) => {
      fileProgressRef.current[currentStep] = { total, answered };

      const combinedTotal = fileProgressRef.current.reduce(
        (sum, f) => sum + f.total,
        0
      );
      const combinedAnswered = fileProgressRef.current.reduce(
        (sum, f) => sum + f.answered,
        0
      );

      onProgressUpdate?.(combinedTotal, combinedAnswered);
    },
    [onProgressUpdate, currentStep]
  );

  // Compute question index offset (sum of previous files' totals) for QuestionLoader display
  const questionIndexOffset = fileProgressRef.current
    .slice(0, currentStep)
    .reduce((sum, f) => sum + f.total, 0);

  if (!currentSchema?.schema) {
    return <div>Loading medical history...</div>;
  }

  return (
    <div className="w-full flex flex-col h-full">
      <AyuStepperContainer
        ref={stepperRef}
        key={currentSchema.name}
        questionnaire={currentSchema.schema}
        summaryTitle={MEDICAL_HISTORY_SUMMARY_TITLE}
        skipSummary
        initialAnswers={fileAnswersRef.current[currentSchema.name]}
        questionIndexOffset={questionIndexOffset}
        totalQuestionsOverride={
          precomputedTotal > 0 ? precomputedTotal : undefined
        }
        onComplete={handleComplete}
        onProgressUpdate={handleProgressUpdate}
      />
      {/* Navigation buttons — pinned to bottom */}
      <div className="sticky bottom-0 bg-white pt-2 pb-4 flex gap-3 md:justify-end">
        <AyuButton
          type="button"
          variant="secondary"
          onClick={() => {
            if (currentStep > 0) {
              setCurrentStep(prev => prev - 1);
            } else {
              onPrevSection?.();
            }
          }}
          className="w-full md:w-[10%]"
        >
          <span className="mx-auto w-full text-base">{BUTTON_BACK}</span>
        </AyuButton>
        {isReviewMode && (
          <AyuButton
            type="button"
            variant="primary"
            rightIcon={<img src={iconRightArrow} alt="yes" />}
            onClick={() => {
              stepperRef.current?.confirm();
            }}
            className="w-full md:w-[10%]"
          >
            <span className="mx-auto w-full text-base">{BUTTON_CONFIRM}</span>
          </AyuButton>
        )}
      </div>
    </div>
  );
};
