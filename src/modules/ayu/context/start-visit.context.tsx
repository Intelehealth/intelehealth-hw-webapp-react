import { createContext, useContext, useState } from 'react';
import type { PhysicalExamAnswers } from '../data/physical-exam.data';
import type { VitalsFormValues } from '../types/vitals.types';
import type { VitalField } from '../types/vitals.types';
import type { AyuAnswerValue } from '../types/ayu.types';

export interface MedicalConditionData {
  id: number;
  name: string;
  hasCondition: string | null;
  relation?: string;
  describeRelation?: string;
  describeIllness?: string;
}

export interface StartVisitData {
  vitals: {
    formValues: VitalsFormValues;
    config: VitalField[];
  } | null;
  visitReason: {
    answers: Record<string, AyuAnswerValue>;
    reasonNames: string[];
    details: Array<{ label: string; value: string }>;
  } | null;
  physicalExam: {
    answers: PhysicalExamAnswers;
  } | null;
  medicalHistory: {
    conditions: MedicalConditionData[];
  } | null;
}

interface StartVisitContextType {
  data: StartVisitData;
  setVitalsData: (formValues: VitalsFormValues, config: VitalField[]) => void;
  setVisitReasonData: (answers: Record<string, AyuAnswerValue>, reasonNames: string[], details: Array<{ label: string; value: string }>) => void;
  setPhysicalExamData: (answers: PhysicalExamAnswers) => void;
  setMedicalHistoryData: (conditions: MedicalConditionData[]) => void;
}

const StartVisitContext = createContext<StartVisitContextType | null>(null);

export const StartVisitProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<StartVisitData>({
    vitals: null,
    visitReason: null,
    physicalExam: null,
    medicalHistory: null,
  });

  const setVitalsData = (formValues: VitalsFormValues, config: VitalField[]) => {
    setData(prev => ({ ...prev, vitals: { formValues, config } }));
  };

  const setVisitReasonData = (answers: Record<string, AyuAnswerValue>, reasonNames: string[], details: Array<{ label: string; value: string }>) => {
    setData(prev => ({ ...prev, visitReason: { answers, reasonNames, details } }));
  };

  const setPhysicalExamData = (answers: PhysicalExamAnswers) => {
    setData(prev => ({ ...prev, physicalExam: { answers } }));
  };

  const setMedicalHistoryData = (conditions: MedicalConditionData[]) => {
    setData(prev => ({ ...prev, medicalHistory: { conditions } }));
  };

  return (
    <StartVisitContext.Provider
      value={{ data, setVitalsData, setVisitReasonData, setPhysicalExamData, setMedicalHistoryData }}
    >
      {children}
    </StartVisitContext.Provider>
  );
};

export const useStartVisitData = () => {
  const ctx = useContext(StartVisitContext);
  if (!ctx) throw new Error('useStartVisitData must be used within StartVisitProvider');
  return ctx;
};
