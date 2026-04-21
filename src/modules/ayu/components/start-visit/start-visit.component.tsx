import { useCallback, useEffect, useMemo, useState } from 'react';
import { storage } from '../../../../utils/storage';
import type { SectionState } from '../../../ayu-library/types/start-visit.types';
import iconStartVisit from '../../../ayu/assets/icon-start-visit.svg';
import { useStartVisitData } from '../../context/start-visit.context';
import { useVisitReasons } from '../../hooks/useVisitReasons.hook';
import CoughQuestionnaire from '../../pages/Cough.questionnaire.json';
import { SectionCompletionLoader } from '../loaders/section-completion-loader.component';
import { SideLoader } from '../loaders/side-loader.component';
import { MedicalHistory } from './medical-history/medical-history.component';
import { PhysicalExamination } from './physical-examination/physical-examination.component';
import { VisitReason } from './visit-reason/visit-reason.component';
import { Vitals } from './vitals/vitals.component';

const getPhysicalExamFilter = (
  questionnaire: typeof CoughQuestionnaire
): string => {
  const ext =
    (
      questionnaire as {
        extension?: Array<{ url: string; valueString?: string }>;
      }
    ).extension /* c8 ignore next */ ?? [];
  return (
    ext.find(e => e.url === 'urn:intelehealth:perform-physical-exam')
      ?.valueString /* c8 ignore next */ ?? ''
  );
};

export const StartVisit = () => {
  const { lastSectionIndex, data } = useStartVisitData();

  const patientName = storage.get('patientName') ?? null;
  const patientAge = storage.get('patientAge') ?? null;
  const patientGender = storage.get('patientGender') ?? null;

  const {
    data: restoredData,
    isRestoring,
    restoredSectionIndex,
    saveSectionToTemp,
  } = useStartVisitData();
  const visitReasons = useVisitReasons();
  const { ayuConfigFiles } = visitReasons;
  const [confirmedReasons, setConfirmedReasons] = useState<string[]>([]);
  const [medicalHistorySubtitle, setMedicalHistorySubtitle] = useState('');

  const handleReasonsConfirmed = useCallback((reasons: string[]) => {
    setConfirmedReasons(reasons);
  }, []);

  const getSectionSubtitle = (sectionName: string): string => {
    switch (sectionName) {
      case 'Visit Reason':
        return confirmedReasons.length > 0 ? confirmedReasons.join(', ') : '';
      case 'Physical Examination': {
        const physExam = ayuConfigFiles.find(
          f => f.name.replace(/\.json$/i, '') === 'physExam'
        );
        return physExam?.json?.title ?? '';
      }
      case 'Medical History':
        return medicalHistorySubtitle;
      default:
        return '';
    }
  };

  const physicalExamFilter = useMemo(
    () => getPhysicalExamFilter(CoughQuestionnaire),
    []
  );
  const [sections, setSections] = useState<SectionState[]>(() => {
    const vitalsTotal = 1;
    const visitReasonTotal = 1;
    const physExamTotal = 3;
    const medHistTotal = 5;
    return [
      {
        totalQuestions: vitalsTotal,
        answeredQuestions: data.vitals ? vitalsTotal : 1,
        name: 'Vitals',
        currentStepIndex: 0,
      },
      {
        totalQuestions: visitReasonTotal,
        answeredQuestions: data.visitReason ? visitReasonTotal : 0,
        name: 'Visit Reason',
        currentStepIndex: 0,
      },
      {
        totalQuestions: physExamTotal, // updated by onProgressUpdate at runtime
        answeredQuestions: data.physicalExam ? physExamTotal : 0,
        name: 'Physical Examination',
        currentStepIndex: 0,
      },
      {
        totalQuestions: medHistTotal,
        answeredQuestions: data.medicalHistory ? medHistTotal : 0,
        name: 'Medical History',
        currentStepIndex: 0,
      },
    ];
  });

  const [currentSectionIndex, setCurrentSectionIndex] =
    useState(lastSectionIndex);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hasRestored, setHasRestored] = useState(false);

  // Restore section index from temp-storage data after context finishes loading
  useEffect(() => {
    if (isRestoring || hasRestored) return;
    setHasRestored(true);

    // Use the exact saved section index if available, otherwise compute from data
    let restoreIndex: number;
    if (restoredSectionIndex != null) {
      restoreIndex = restoredSectionIndex;
    } else {
      restoreIndex = 0;
      if (restoredData.vitals) restoreIndex = 1;
      if (restoredData.visitReason) restoreIndex = 2;
      if (restoredData.physicalExam) restoreIndex = 3;
    }

    if (restoredData.visitReason?.reasonNames?.length) {
      setConfirmedReasons(restoredData.visitReason.reasonNames);
    }

    if (restoreIndex > 0) {
      setCurrentSectionIndex(restoreIndex);
    }

    // Mark any section as completed if its data exists in restoredData —
    // independent of restoreIndex, so the section completion loader reflects
    // the true saved state after refresh.
    setSections(prev =>
      prev.map(s => {
        const hasData =
          (s.name === 'Vitals' && !!restoredData.vitals) ||
          (s.name === 'Visit Reason' && !!restoredData.visitReason) ||
          (s.name === 'Physical Examination' && !!restoredData.physicalExam) ||
          (s.name === 'Medical History' && !!restoredData.medicalHistory);
        return hasData ? { ...s, answeredQuestions: s.totalQuestions } : s;
      })
    );
  }, [isRestoring, hasRestored, restoredData, restoredSectionIndex]);

  /* ---------------- Question Navigation ---------------- */

  // Returns true if the current section has already been completed
  // (data exists in context). Used to short-circuit Confirm-on-revisit flows.
  const isCurrentSectionCompleted = (): boolean => {
    switch (currentSectionIndex) {
      case 0:
        return !!data.vitals;
      case 1:
        return !!data.visitReason;
      case 2:
        return !!data.physicalExam;
      case 3:
        return !!data.medicalHistory;
      /* c8 ignore next 2 */
      default:
        return false;
    }
  };

  const goNextQuestion = () => {
    const section = sections[currentSectionIndex];
    const total = section.totalQuestions;

    // Section already completed in context (Confirm on revisit / after refresh)
    // → go straight to next section regardless of sections[] counters
    if (isCurrentSectionCompleted()) {
      goNextSection();
      return;
    }

    // Section already marked completed via counters → go to next section
    if (section.answeredQuestions >= total) {
      goNextSection();
      return;
    }

    //If NOT last question → just move forward
    if (currentQuestionIndex < total - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      return;
    }

    // LAST QUESTION → mark section completed ONCE
    setSections(prev => {
      const copy = [...prev];
      copy[currentSectionIndex].answeredQuestions =
        copy[currentSectionIndex].totalQuestions;
      return copy;
    });

    goNextSection();
  };

  const goPreviousQuestion = () => {
    setCurrentQuestionIndex(prev => Math.max(prev - 1, 0));
  };

  /* ---------------- Section Navigation ---------------- */

  const goNextSection = () => {
    setCurrentSectionIndex(prev => {
      const next = Math.min(prev + 1, sections.length - 1);
      saveSectionToTemp({ currentSectionIndex: next });
      return next;
    });
    setCurrentQuestionIndex(0);
  };

  const goPreviousSection = () => {
    setCurrentSectionIndex(prev => {
      const newIndex = Math.max(prev - 1, 0);
      saveSectionToTemp({ currentSectionIndex: newIndex });

      setCurrentQuestionIndex(
        Math.max(sections[newIndex].answeredQuestions - 1, 0)
      );

      return newIndex;
    });
  };

  const updateSectionProgress = useCallback(
    (sectionName: string, total: number, answered: number) => {
      setSections(prev =>
        prev.map(section =>
          section.name === sectionName
            ? { ...section, totalQuestions: total, answeredQuestions: answered }
            : section
        )
      );
      // SYNC SIDE LOADER INDEX HERE
      setCurrentQuestionIndex(answered);
    },
    []
  );

  const handleVisitReasonProgress = useCallback(
    (total: number, answered: number) => {
      updateSectionProgress('Visit Reason', total, answered);
    },
    [updateSectionProgress]
  );

  const handlePhysicalExamProgress = useCallback(
    (total: number, answered: number) => {
      updateSectionProgress('Physical Examination', total, answered);
    },
    [updateSectionProgress]
  );

  const handleMedicalHistoryProgress = useCallback(
    (total: number, answered: number) => {
      updateSectionProgress('Medical History', total, answered);
    },
    [updateSectionProgress]
  );

  const handleMedicalHistorySubtitleChange = useCallback((subtitle: string) => {
    setMedicalHistorySubtitle(subtitle);
  }, []);

  if (isRestoring) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Restoring visit data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200 text-gray-700 font-semibold">
        <img
          src={iconStartVisit}
          className="object-cover rounded-full"
          alt="Ayu Loader"
        />
        Start Visit
      </div>
      <div className="mt-2">
        {patientName && (
          <span className="text-gray-700 font-semibold">
            {patientName}
            <span className="text-gray-700 text-sm font-normal">
              {patientAge ? ` (${patientAge}` : ''}
              {patientGender ? ` | ${patientGender})` : ''}
            </span>
          </span>
        )}
        <div
          className="font-medium text-xs md:text-sm"
          style={{ color: '#2e1e91' }}
        >
          {currentSectionIndex + 1}/{sections.length}{' '}
          {sections[currentSectionIndex].name}
          {getSectionSubtitle(sections[currentSectionIndex].name) && (
            <> : {getSectionSubtitle(sections[currentSectionIndex].name)}</>
          )}
        </div>
      </div>
      {/* Top Loader */}
      <div className="pt-3">
        <SectionCompletionLoader
          sections={sections}
          currentSectionIndex={currentSectionIndex}
        />
      </div>

      {/* Side Loader */}
      {sections[currentSectionIndex]?.totalQuestions > 1 && (
        <div className="hidden md:block">
          <SideLoader
            sections={sections}
            currentSectionIndex={currentSectionIndex}
            currentQuestionIndex={currentQuestionIndex}
          />
        </div>
      )}

      {/* Active Section */}
      <div className="pt-4">
        {currentSectionIndex === 0 && (
          <Vitals
            questionIndex={currentQuestionIndex}
            onNextQuestion={goNextQuestion}
            onPrevQuestion={goPreviousQuestion}
          />
        )}

        <div style={{ display: currentSectionIndex === 1 ? 'block' : 'none' }}>
          <VisitReason
            questionIndex={currentQuestionIndex}
            onNextQuestion={goNextQuestion}
            onPrevQuestion={goPreviousQuestion}
            onPrevSection={goPreviousSection}
            onProgressUpdate={handleVisitReasonProgress}
            visitReasons={visitReasons}
            onReasonsConfirmed={handleReasonsConfirmed}
          />
        </div>

        <div style={{ display: currentSectionIndex === 2 ? 'block' : 'none' }}>
          <PhysicalExamination
            questionIndex={currentQuestionIndex}
            onNextQuestion={goNextQuestion}
            onPrevQuestion={goPreviousQuestion}
            onPrevSection={goPreviousSection}
            onProgressUpdate={handlePhysicalExamProgress}
            physicalExamFilter={physicalExamFilter}
            ayuConfigFiles={ayuConfigFiles}
          />
        </div>

        <div style={{ display: currentSectionIndex === 3 ? 'block' : 'none' }}>
          <MedicalHistory
            questionIndex={currentQuestionIndex}
            onNextQuestion={goNextQuestion}
            onPrevQuestion={goPreviousQuestion}
            onPrevSection={goPreviousSection}
            onProgressUpdate={handleMedicalHistoryProgress}
            onSubtitleChange={handleMedicalHistorySubtitleChange}
            ayuConfigFiles={ayuConfigFiles}
          />
        </div>
      </div>
    </div>
  );
};
