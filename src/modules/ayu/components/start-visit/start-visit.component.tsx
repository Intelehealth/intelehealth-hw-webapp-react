import { useState } from 'react';
import iconStartVisit from '../../../ayu/assets/icon-start-visit.svg';
import type { SectionState } from '../../types/start-visit.types';
import { SectionCompletionLoader } from '../loaders/section-completion-loader.component';
import { SideLoader } from '../loaders/side-loader.component';
import { MedicalHistory } from './medical-history.component';
import { PhysicalExamination } from './physical-examination.component';
import { VisitReason } from './visit-reason/visit-reason.component';
import { Vitals } from './vitals.component';

export const StartVisit = () => {
  const [sections, setSections] = useState<SectionState[]>([
    {
      totalQuestions: 1,
      answeredQuestions: 0,
      name: 'Vitals',
    }, // Vitals
    {
      totalQuestions: 6,
      answeredQuestions: 0,
      name: 'Visit Reason',
    }, // Visit Reason
    { totalQuestions: 8, answeredQuestions: 0, name: 'Physical Exam' }, // Physical Exam
    { totalQuestions: 5, answeredQuestions: 0, name: 'Medical History' }, // Medical History
  ]);

  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  /* ---------------- Question Navigation ---------------- */

  const goNextQuestion = () => {
    const total = sections[currentSectionIndex].totalQuestions;
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

    if (sections[currentSectionIndex] === sections[sections.length - 1]) {
      alert('Completed all sections!');
    }

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
      <div
        className="mt-2 font-medium text-xs md:text-sm"
        style={{ color: '#2e1e91' }}
      >
        {currentSectionIndex + 1}/{sections.length}{' '}
        {sections[currentSectionIndex].name}
      </div>
      {/* Top Loader */}
      <div className="pt-3">
        <SectionCompletionLoader
          sections={sections}
          currentSectionIndex={currentSectionIndex}
          currentQuestionIndex={currentQuestionIndex}
        />
      </div>

      {/* Side Loader */}
      <div className="hidden md:block">
        <SideLoader
          totalQuestions={sections[currentSectionIndex].totalQuestions}
          currentQuestionIndex={currentQuestionIndex}
        />
      </div>

      {/* Active Section */}
      <div className="pt-4">
        {currentSectionIndex === 0 && (
          <Vitals
            questionIndex={currentQuestionIndex}
            onNextQuestion={goNextQuestion}
          />
        )}

        {currentSectionIndex === 1 && (
          <VisitReason
            questionIndex={currentQuestionIndex}
            onNextQuestion={goNextQuestion}
            onPrevQuestion={goPreviousQuestion}
            onPrevSection={goPreviousSection}
          />
        )}

        {currentSectionIndex === 2 && (
          <PhysicalExamination
            questionIndex={currentQuestionIndex}
            onNextQuestion={goNextQuestion}
            onPrevQuestion={goPreviousQuestion}
            onPrevSection={goPreviousSection}
          />
        )}

        {currentSectionIndex === 3 && (
          <MedicalHistory
            questionIndex={currentQuestionIndex}
            onNextQuestion={goNextQuestion}
            onPrevQuestion={goPreviousQuestion}
            onPrevSection={goPreviousSection}
          />
        )}
      </div>
    </div>
  );
};
