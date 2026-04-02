import { useCallback, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { SectionState } from '../../../ayu-library/types/start-visit.types';
import iconStartVisit from '../../../ayu/assets/icon-start-visit.svg';
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
    ).extension ?? [];
  return (
    ext.find(e => e.url === 'urn:intelehealth:perform-physical-exam')
      ?.valueString ?? ''
  );
};

export const StartVisit = () => {
  const location = useLocation();
  const { patientName, patientAge, patientGender } =
    (location.state as {
      patientName?: string;
      patientAge?: string;
      patientGender?: string;
    }) || {};

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
  const [sections, setSections] = useState<SectionState[]>([
    {
      totalQuestions: 1,
      answeredQuestions: 1,
      name: 'Vitals',
      currentStepIndex: 0,
    }, // Vitals
    {
      totalQuestions: 1,
      answeredQuestions: 0,
      name: 'Visit Reason',
      currentStepIndex: 0,
    }, // Visit Reason
    {
      totalQuestions: 3, // updated by onProgressUpdate at runtime (conditional questions may change count)
      answeredQuestions: 0,
      name: 'Physical Examination',
      currentStepIndex: 0,
    }, // Physical Examination
    {
      totalQuestions: 5,
      answeredQuestions: 0,
      name: 'Medical History',
      currentStepIndex: 0,
    }, // Medical History
  ]);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  /* ---------------- Question Navigation ---------------- */

  const goNextQuestion = () => {
    const section = sections[currentSectionIndex];
    const total = section.totalQuestions;

    // Section already completed (e.g. Confirm on revisit) → go straight to next section
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
    setCurrentSectionIndex(prev => Math.min(prev + 1, sections.length - 1));
    setCurrentQuestionIndex(0);
  };

  const goPreviousSection = () => {
    setCurrentSectionIndex(prev => {
      const newIndex = Math.max(prev - 1, 0);

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
      updateSectionProgress('Physical Exam', total, answered);
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
