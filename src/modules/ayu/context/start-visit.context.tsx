import { createContext, useContext, useState } from 'react';
import type { ModalSectionItem } from '../../../components/modal/global-modal-context';
import type { PhysicalExamAnswers } from '../data/physical-exam.data';
import type { VitalsFormValues } from '../types/vitals.types';
import type { VitalField } from '../types/vitals.types';
import type { AyuAnswerValue } from '../../ayu-library/types/ayu.types';

export interface MedicalHistorySummary {
  title: string;
  items: ModalSectionItem[];
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
    patHistSummary: MedicalHistorySummary[];
    famHistSummary: MedicalHistorySummary[];
  } | null;
}

interface StartVisitContextType {
  data: StartVisitData;
  patientUuid: string | null;
  setPatientUuid: (uuid: string) => void;
  setVitalsData: (formValues: VitalsFormValues, config: VitalField[]) => void;
  setVisitReasonData: (
    answers: Record<string, AyuAnswerValue>,
    reasonNames: string[],
    details: Array<{ label: string; value: string }>
  ) => void;
  setPhysicalExamData: (answers: PhysicalExamAnswers) => void;
  setMedicalHistoryData: (
    patHistSummary: MedicalHistorySummary[],
    famHistSummary: MedicalHistorySummary[]
  ) => void;
}

const StartVisitContext = createContext<StartVisitContextType | null>(null);

export const StartVisitProvider = ({
  children,
  initialPatientUuid,
}: {
  children: React.ReactNode;
  initialPatientUuid?: string | null;
}) => {
  const [patientUuid, setPatientUuid] = useState<string | null>(
    initialPatientUuid ?? null
  );
  const [data, setData] = useState<StartVisitData>({
    vitals: null,
    visitReason: null,
    physicalExam: null,
    medicalHistory: null,
  });

  const setVitalsData = (
    formValues: VitalsFormValues,
    config: VitalField[]
  ) => {
    setData(prev => ({ ...prev, vitals: { formValues, config } }));
  };

  const setVisitReasonData = (
    answers: Record<string, AyuAnswerValue>,
    reasonNames: string[],
    details: Array<{ label: string; value: string }>
  ) => {
    setData(prev => ({
      ...prev,
      visitReason: { answers, reasonNames, details },
    }));
  };

  const setPhysicalExamData = (answers: PhysicalExamAnswers) => {
    setData(prev => ({ ...prev, physicalExam: { answers } }));
  };

  const setMedicalHistoryData = (
    patHistSummary: MedicalHistorySummary[],
    famHistSummary: MedicalHistorySummary[]
  ) => {
    setData(prev => ({
      ...prev,
      medicalHistory: { patHistSummary, famHistSummary },
    }));
  };

  return (
    <StartVisitContext.Provider
      value={{
        data,
        patientUuid,
        setPatientUuid,
        setVitalsData,
        setVisitReasonData,
        setPhysicalExamData,
        setMedicalHistoryData,
      }}
    >
      {children}
    </StartVisitContext.Provider>
  );
};

export const useStartVisitData = () => {
  const ctx = useContext(StartVisitContext);
  if (!ctx)
    throw new Error('useStartVisitData must be used within StartVisitProvider');
  return ctx;
};
