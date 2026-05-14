import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import iconVisitReasonSummary from '../../../../../assets/icons/visit-reason.svg';
import type { ModalSection } from '../../../../../components/modal/global-modal-context';
import { useGlobalModal } from '../../../../../components/modal/global-modal-context';
import type { AyuAnswerValue } from '../../../../ayu-library/types/ayu.types';
import type { SectionProps } from '../../../../ayu-library/types/start-visit.types';
import { transformFhirToAyu } from '../../../../ayu-library/utils/fhir-to-ayu.util';
import { useStartVisitData } from '../../../context/start-visit.context';
import { usePatientDemographics } from '../../../hooks/useVisitReasons.hook';
import {
  BUTTON_BACK,
  BUTTON_SAVE_NEXT,
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
  const {
    data: visitData,
    setMedicalHistoryData,
    setMedicalHistoryAnswers,
    saveSectionToTemp,
  } = useStartVisitData();
  const restoredAnswers = visitData.medicalHistoryAnswers;
  const [currentStep, setCurrentStep] = useState(() => {
    if (!restoredAnswers) return 0;
    const completedFiles = HISTORY_JSON_NAMES.filter(
      name => restoredAnswers[name]
    );
    return Math.min(completedFiles.length, HISTORY_JSON_NAMES.length - 1);
  });
  const fileResultsRef = useRef<FileResult[]>([]);
  const fileAnswersRef = useRef<Record<string, Record<string, AyuAnswerValue>>>(
    restoredAnswers ?? {}
  );
  const stepperRef = useRef<AyuStepperContainerHandle>(null);
  const { showVitalConfirmationModal } = useGlobalModal();

  const historyFiles = useMemo(() => {
    if (!ayuConfigFiles) return [];
    return HISTORY_JSON_NAMES.map(name =>
      ayuConfigFiles.find(f => f.name.replace(/\.json$/i, '').trim() === name)
    ).filter(Boolean);
  }, [ayuConfigFiles]);

  const patientAgeAndGender = usePatientDemographics();

  const schemas = useMemo(() => {
    return historyFiles.map(file => ({
      name: file!.name.replace(/\.json$/i, '').trim(),
      title: file!.json?.title ?? file!.name,
      schema: transformFhirToAyu(file!.json, patientAgeAndGender),
    }));
  }, [historyFiles, patientAgeAndGender]);

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
        saveSectionToTemp({
          medicalHistory: { patHistSummary: patHist, famHistSummary: famHist },
          medicalHistoryAnswers: { ...fileAnswersRef.current },
        });
        const basePath = location.pathname.replace(/\/$/, '');
        navigate(`${basePath}/visit-summary`);
      },
    });
  }, [
    showVitalConfirmationModal,
    navigate,
    setMedicalHistoryData,
    saveSectionToTemp,
    location.pathname,
  ]);

  const handleComplete = useCallback(
    (answers: Record<string, AyuAnswerValue>) => {
      const schema = schemas[currentStep];
      if (!schema?.schema) return;

      // Store answers for this file so they can be restored on "Change"
      fileAnswersRef.current[schema.name] = answers;

      // Keep context in sync so the merge base preserves these across saves
      const updatedAnswers = { ...fileAnswersRef.current };
      setMedicalHistoryAnswers(updatedAnswers);

      // Persist raw answers per file so they survive refresh
      saveSectionToTemp({
        medicalHistoryAnswers: updatedAnswers,
      });

      const buildResult = (
        s: (typeof schemas)[number],
        a: Record<string, AyuAnswerValue>
      ): FileResult => {
        const items = (s.schema?.item || []).filter(
          item => item.type !== 'group'
        );
        const map = new Map(Object.entries(a));
        const rawSections = buildVisitSummary(
          items,
          map,
          s.schema?.text || s.title,
          { useLabeledFormat: true }
        );
        const mergedItems = rawSections.flatMap(rs => rs.items);
        const sections: ModalSection[] =
          mergedItems.length > 0
            ? [{ title: s.schema?.text || s.title, items: mergedItems }]
            : [];
        return { title: s.title, sections };
      };

      const next: FileResult[] = [];
      for (let i = 0; i <= currentStep; i++) {
        const s = schemas[i];
        if (!s?.schema) continue;
        if (i === currentStep) {
          next[i] = buildResult(s, answers);
        } else if (fileResultsRef.current[i]) {
          next[i] = fileResultsRef.current[i];
        } else {
          const restored = fileAnswersRef.current[s.name];
          if (restored) next[i] = buildResult(s, restored);
        }
      }
      fileResultsRef.current = next;

      if (currentStep < schemas.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        showCombinedSummary();
      }
    },
    [
      currentStep,
      schemas,
      showCombinedSummary,
      saveSectionToTemp,
      setMedicalHistoryAnswers,
    ]
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
    <div className="w-full flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-[800px]">
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
        </div>
      </div>
      <div className="sticky bottom-0 z-40 bg-white border-t border-gray-200 pt-3">
        <div className="flex gap-3 md:justify-end">
          <AyuButton
            type="button"
            variant="primarylight"
            size="sm"
            onClick={() => {
              if (currentStep > 0) {
                setCurrentStep(prev => prev - 1);
              } else {
                onPrevSection?.();
              }
            }}
            className="w-full md:w-[11%]"
          >
            <span className="mx-auto w-full text-base">{BUTTON_BACK}</span>
          </AyuButton>
          {isReviewMode && (
            <AyuButton
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                stepperRef.current?.confirm();
              }}
              className="w-full md:w-[11%]"
            >
              <span className="mx-auto w-full text-base">
                {BUTTON_SAVE_NEXT}
              </span>
            </AyuButton>
          )}
        </div>
      </div>
    </div>
  );
};
