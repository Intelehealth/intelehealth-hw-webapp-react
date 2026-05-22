import { createContext, useContext, useMemo } from 'react';
import { usePhysicalExamCameraImages } from '../../../hooks/usePhysicalExamCameraImages';
import type { UsePhysicalExamCameraImagesReturn } from '../../../hooks/usePhysicalExamCameraImages';

/**
 * React context that exposes per-question camera state and image handlers to
 * any AyuRenderer-style component nested inside a Physical Exam screen.
 *
 * Camera state is PE-specific and doesn't fit AyuRendererBaseProps without
 * polluting every other renderer, so we route it through context instead.
 */
const PhysicalExamCameraContext =
  createContext<PhysicalExamCameraContextValue | null>(null);

export interface PhysicalExamCameraContextValue
  extends UsePhysicalExamCameraImagesReturn {
  /** Returns the job-aid URL (image or video) for a question, if any. */
  jobAidUrlFor: (questionId: string) => string | null;
  /** Returns the job-aid media type for a question, if any. */
  jobAidTypeFor: (questionId: string) => 'image' | 'video' | null;
}

export interface PhysicalExamCameraProviderProps {
  children: React.ReactNode;
  visitId: string | number | null | undefined;
  sectionCommentFor: (questionId: string) => string;
  jobAidUrlFor?: (questionId: string) => string | null;
  jobAidTypeFor?: (questionId: string) => 'image' | 'video' | null;
}

export const PhysicalExamCameraProvider = ({
  children,
  visitId,
  sectionCommentFor,
  jobAidUrlFor,
  jobAidTypeFor,
}: PhysicalExamCameraProviderProps) => {
  const camera = usePhysicalExamCameraImages({ visitId, sectionCommentFor });

  const value = useMemo<PhysicalExamCameraContextValue>(
    () => ({
      ...camera,
      jobAidUrlFor: jobAidUrlFor ?? (() => null),
      jobAidTypeFor: jobAidTypeFor ?? (() => null),
    }),
    [camera, jobAidUrlFor, jobAidTypeFor]
  );

  return (
    <PhysicalExamCameraContext.Provider value={value}>
      {children}
    </PhysicalExamCameraContext.Provider>
  );
};

/**
 * Consumer hook for the PE camera context. Returns null when no provider is
 * mounted (e.g. for Visit Reason or other non-PE flows), so callers can
 * safely fall back to non-camera behavior.
 */
export const usePhysicalExamCamera =
  (): PhysicalExamCameraContextValue | null =>
    useContext(PhysicalExamCameraContext);
