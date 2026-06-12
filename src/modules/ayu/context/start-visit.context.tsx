import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ModalSectionItem } from '../../../components/modal/global-modal-context';
import { storage } from '../../../utils/storage';
import type { AyuAnswerValue } from '../../ayu-library/types/ayu.types';
import { getResource, upsertResource } from '../services/temp-storage.service';
import type { PhysicalExamAnswers } from '../types/physical-exam.types';
import type { VitalField, VitalsFormValues } from '../types/vitals.types';

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
    detailsSections?: MedicalHistorySummary[];
  } | null;
  physicalExam: {
    answers: PhysicalExamAnswers;
    details: Array<{ label: string; value: string }>;
  } | null;
  medicalHistory: {
    patHistSummary: MedicalHistorySummary[];
    famHistSummary: MedicalHistorySummary[];
  } | null;
  medicalHistoryAnswers: Record<string, Record<string, AyuAnswerValue>> | null;
}

export interface TempVisitData {
  vitals: StartVisitData['vitals'];
  visitReason: StartVisitData['visitReason'];
  physicalExam: StartVisitData['physicalExam'];
  medicalHistory: StartVisitData['medicalHistory'];
  medicalHistoryAnswers?: Record<string, Record<string, AyuAnswerValue>>;
  currentSectionIndex?: number;
  confirmedReasons?: string[];
}

const VISIT_ID_STORAGE_KEY = 'temp_visit_id';

function visitIdStorageKey(patientUuid: string | null): string {
  return patientUuid
    ? `${VISIT_ID_STORAGE_KEY}_${patientUuid}`
    : VISIT_ID_STORAGE_KEY;
}

function getOrCreateVisitId(patientUuid: string | null): string {
  const key = visitIdStorageKey(patientUuid);
  const existing = storage.get(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  storage.set(key, id);
  return id;
}

interface StartVisitContextType {
  data: StartVisitData;
  patientUuid: string | null;
  visitId: string;
  tempRecordId: number | null;
  isRestoring: boolean;
  restoredSectionIndex: number | null;
  lastSectionIndex: number;
  setLastSectionIndex: (index: number) => void;
  setPatientUuid: (uuid: string) => void;
  setVitalsData: (formValues: VitalsFormValues, config: VitalField[]) => void;
  setVisitReasonData: (
    answers: Record<string, AyuAnswerValue>,
    reasonNames: string[],
    details: Array<{ label: string; value: string }>,
    detailsSections?: MedicalHistorySummary[]
  ) => void;
  clearVisitReasonData: () => void;
  clearPhysicalExamData: () => void;
  clearMedicalHistoryData: () => void;
  setPhysicalExamData: (
    answers: PhysicalExamAnswers,
    details: Array<{ label: string; value: string }>
  ) => void;
  setMedicalHistoryData: (
    patHistSummary: MedicalHistorySummary[],
    famHistSummary: MedicalHistorySummary[]
  ) => void;
  setMedicalHistoryAnswers: (
    answers: Record<string, Record<string, AyuAnswerValue>>
  ) => void;
  saveSectionToTemp: (sectionData: Partial<TempVisitData>) => Promise<void>;
  clearVisitId: () => void;
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
  const [visitId] = useState(() =>
    getOrCreateVisitId(initialPatientUuid ?? null)
  );
  const [tempRecordId, setTempRecordId] = useState<number | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [restoredSectionIndex, setRestoredSectionIndex] = useState<
    number | null
  >(null);
  const [lastSectionIndex, setLastSectionIndex] = useState(0);
  const [data, setData] = useState<StartVisitData>({
    vitals: null,
    visitReason: null,
    physicalExam: null,
    medicalHistory: null,
    medicalHistoryAnswers: null,
  });

  const dataRef = useRef(data);
  dataRef.current = data;

  const currentSectionIndexRef = useRef<number | undefined>(undefined);

  // Restore from temp-storage on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getResource<TempVisitData>('visit', visitId);
        if (cancelled || !res.data) return;
        const recordPatientId = res.data.parent_id ?? null;
        if (patientUuid && recordPatientId && recordPatientId !== patientUuid) {
          storage.remove(visitIdStorageKey(patientUuid));
          return;
        }
        const saved = res.data.data;
        setTempRecordId(res.data.id);
        if (saved.currentSectionIndex != null) {
          currentSectionIndexRef.current = saved.currentSectionIndex;
          setRestoredSectionIndex(saved.currentSectionIndex);
        }
        setData({
          vitals: saved.vitals ?? null,
          visitReason: saved.visitReason ?? null,
          physicalExam: saved.physicalExam ?? null,
          medicalHistory: saved.medicalHistory ?? null,
          medicalHistoryAnswers: saved.medicalHistoryAnswers ?? null,
        });
      } catch {
        // No existing temp record — start fresh
      } finally {
        if (!cancelled) setIsRestoring(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visitId, patientUuid]);

  const saveSectionToTemp = useCallback(
    async (sectionData: Partial<TempVisitData>) => {
      if (sectionData.currentSectionIndex != null) {
        currentSectionIndexRef.current = sectionData.currentSectionIndex;
      }
      const current = dataRef.current;
      const merged: TempVisitData = {
        vitals: current.vitals,
        visitReason: current.visitReason,
        physicalExam: current.physicalExam,
        medicalHistory: current.medicalHistory,
        medicalHistoryAnswers: current.medicalHistoryAnswers ?? undefined,
        currentSectionIndex: currentSectionIndexRef.current,
        ...sectionData,
      };
      try {
        let createdBy = null;
        try {
          const user = storage.getUser();
          if (user) createdBy = JSON.parse(user).uuid ?? user;
        } catch {
          /* use fallback */
        }
        const res = await upsertResource<TempVisitData>({
          resource_type: 'visit',
          resource_id: visitId,
          parent_type: 'patient',
          parent_id: patientUuid ?? undefined,
          data: merged,
          created_by: createdBy,
        });
        setTempRecordId(res.data.id);
      } catch {
        // Save failed silently — context state is still the source of truth
      }
    },
    [visitId, patientUuid]
  );

  const clearVisitId = useCallback(() => {
    storage.remove(visitIdStorageKey(patientUuid));
  }, [patientUuid]);

  const setVitalsData = (
    formValues: VitalsFormValues,
    config: VitalField[]
  ) => {
    setData(prev => ({ ...prev, vitals: { formValues, config } }));
  };

  const setVisitReasonData = (
    answers: Record<string, AyuAnswerValue>,
    reasonNames: string[],
    details: Array<{ label: string; value: string }>,
    detailsSections?: MedicalHistorySummary[]
  ) => {
    setData(prev => ({
      ...prev,
      visitReason: { answers, reasonNames, details, detailsSections },
    }));
  };

  const clearVisitReasonData = () => {
    setData(prev => ({ ...prev, visitReason: null }));
  };

  const clearPhysicalExamData = () => {
    setData(prev => ({ ...prev, physicalExam: null }));
  };

  const clearMedicalHistoryData = () => {
    setData(prev => ({
      ...prev,
      medicalHistory: null,
      medicalHistoryAnswers: null,
    }));
  };

  const setPhysicalExamData = (
    answers: PhysicalExamAnswers,
    details: Array<{ label: string; value: string }>
  ) => {
    setData(prev => ({ ...prev, physicalExam: { answers, details } }));
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

  const setMedicalHistoryAnswers = (
    answers: Record<string, Record<string, AyuAnswerValue>>
  ) => {
    setData(prev => ({ ...prev, medicalHistoryAnswers: answers }));
  };

  return (
    <StartVisitContext.Provider
      value={{
        data,
        patientUuid,
        visitId,
        tempRecordId,
        isRestoring,
        restoredSectionIndex,
        lastSectionIndex,
        setLastSectionIndex,
        setPatientUuid,
        setVitalsData,
        setVisitReasonData,
        clearVisitReasonData,
        clearPhysicalExamData,
        clearMedicalHistoryData,
        setPhysicalExamData,
        setMedicalHistoryData,
        setMedicalHistoryAnswers,
        saveSectionToTemp,
        clearVisitId,
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
