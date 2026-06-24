import { useCallback, useMemo, useRef, useState } from 'react';
import iconPhysicalExam from '../../../../../assets/icons/icon-physical-examination.svg';
import type { ModalSection } from '../../../../../components/modal/global-modal-context';
import { useGlobalModal } from '../../../../../components/modal/global-modal-context';
import type {
  AyuAnswerValue,
  AyuQuestion,
} from '../../../../ayu-library/types/ayu.types';
import type { SectionProps } from '../../../../ayu-library/types/start-visit.types';
import {
  EXT_URL_JOB_AID_FILE,
  EXT_URL_JOB_AID_TYPE,
  EXT_URL_PE_CATEGORY_LABEL,
  EXT_URL_PE_OPTION_KIND,
  EXT_URL_PE_SECTION_KEY,
  PE_OPTION_KIND_CAMERA,
} from '../../../../ayu-library/utils/constants';
import { transformFhirPhysExamToAyu } from '../../../../ayu-library/utils/fhir-to-ayu.util';
import { useStartVisitData } from '../../../context/start-visit.context';
import { usePatientDemographics } from '../../../hooks/useVisitReasons.hook';
import type { PhysicalExamAnswers } from '../../../types/physical-exam.types';
import {
  BUTTON_BACK,
  BUTTON_SAVE_NEXT,
  PE_PICTURE_TAKEN_LABEL,
  PHYSICAL_EXAM_SUMMARY_TITLE,
  SUMMARY_CANCEL_TEXT,
  SUMMARY_CONFIRM_TEXT,
} from '../../../utils/ayu.constants';
import {
  filterAyuQuestionsForPhysExam,
  parsePhysicalExamFilter,
} from '../../../utils/physical-exam.utils';
import { getJobAidType, getJobAidUrl } from '../../../utils/physExamAssets';
import AyuButton from '../../common/ayu-button.component';
import type { AyuStepperContainerHandle } from '../visit-reason/ayu-stepper-container.component';
import { AyuStepperContainer } from '../visit-reason/ayu-stepper-container.component';
import {
  PhysicalExamCameraProvider,
  usePhysicalExamCamera,
} from './physical-exam-camera-context';

interface AyuFhirShape {
  resourceType?: string;
  text?: string;
  item?: AyuQuestion[];
}

/**
 * Boundary adapter: convert AyuStepperContainer's rich answer map back to
 * PhysicalExamAnswers (Record<string, string[]>) so visit-upload's
 * buildPhysicalExamData — which still consumes the legacy shape — works
 * without modification.
 */
const ayuAnswersToPhysicalExamAnswers = (
  answers: Record<string, AyuAnswerValue>
): PhysicalExamAnswers => {
  const out: PhysicalExamAnswers = {};
  for (const [linkId, value] of Object.entries(answers)) {
    if (Array.isArray(value)) {
      out[linkId] = value.filter((v): v is string => typeof v === 'string');
    } else if (typeof value === 'string') {
      out[linkId] = [value];
    } else {
      out[linkId] = [];
    }
  }
  return out;
};

const readExt = (q: AyuQuestion, url: string): string | undefined =>
  q.extension?.find(e => e.url === url)?.valueString;

const isCameraOption = (
  opt: NonNullable<AyuQuestion['answerOption']>[number]
): boolean =>
  !!opt.extension?.some(
    ext =>
      ext.url === EXT_URL_PE_OPTION_KIND &&
      ext.valueString === PE_OPTION_KIND_CAMERA
  );

export const PhysicalExamination = (props: SectionProps) => {
  const {
    onNextQuestion: originalOnNext,
    onPrevSection,
    onProgressUpdate,
    physicalExamFilter,
    ayuConfigFiles,
  } = props;
  const { data, visitId, setPhysicalExamData, saveSectionToTemp } =
    useStartVisitData();
  const { showVitalConfirmationModal } = useGlobalModal();
  const patientDemographics = usePatientDemographics();
  const stepperRef = useRef<AyuStepperContainerHandle>(null);
  const [isReviewMode, setIsReviewMode] = useState(() => !!data.physicalExam);

  const physExamJson = useMemo(
    () =>
      ayuConfigFiles?.find(
        f => f.name.replace(/\.json$/i, '').trim() === 'physExam'
      )?.json ?? null,
    [ayuConfigFiles]
  );

  const ayuRoot = useMemo<AyuFhirShape | null>(() => {
    if (!physExamJson) return null;
    const root = transformFhirPhysExamToAyu(
      physExamJson as unknown as Parameters<
        typeof transformFhirPhysExamToAyu
      >[0],
      patientDemographics
    );
    if (!root) return null;
    const filteredItems = filterAyuQuestionsForPhysExam(
      /* v8 ignore next */
      root.item ?? [],
      physicalExamFilter ?? ''
    );
    return {
      resourceType: 'Questionnaire',
      text: root.text,
      item: filteredItems,
    };
  }, [physExamJson, patientDemographics, physicalExamFilter]);

  const topLevelItems = useMemo(() => ayuRoot?.item ?? [], [ayuRoot]);

  // Keep a stable lookup so context callbacks below don't allocate per render
  const questionByLinkIdRef = useRef(new Map<string, AyuQuestion>());
  useMemo(() => {
    const map = new Map<string, AyuQuestion>();
    for (const q of topLevelItems) map.set(q.linkId, q);
    questionByLinkIdRef.current = map;
  }, [topLevelItems]);

  const sectionCommentFor = useCallback((questionId: string): string => {
    const q = questionByLinkIdRef.current.get(questionId);
    return (
      readExt(q ?? ({} as AyuQuestion), EXT_URL_PE_SECTION_KEY) ??
      'General Exams'
    );
  }, []);

  const jobAidUrlFor = useCallback((questionId: string): string | null => {
    const q = questionByLinkIdRef.current.get(questionId);
    if (!q) return null;
    const file = readExt(q, EXT_URL_JOB_AID_FILE);
    if (!file) return null;
    return getJobAidUrl(file) ?? null;
  }, []);

  const jobAidTypeFor = useCallback(
    (questionId: string): 'image' | 'video' | null => {
      const q = questionByLinkIdRef.current.get(questionId);
      if (!q) return null;
      // Prefer the type of the ACTUAL bundled asset (matches the URL the user
      // sees) over the FHIR job-aid-type, which can be wrong — e.g. a pallor
      // reference declared "video" while the file is a .jpg.
      const file = readExt(q, EXT_URL_JOB_AID_FILE);
      if (file) {
        const actual = getJobAidType(file);
        if (actual) return actual;
      }
      const t = readExt(q, EXT_URL_JOB_AID_TYPE);
      if (t === 'image' || t === 'video') return t;
      return null;
    },
    []
  );

  /*
   * Track which questions have captured camera images. Read by the section
   * builder below so a camera answer can be displayed as "Picture taken".
   * Mutated via a context-bridge (see jobAidUrlFor closure won't suffice —
   * we need a stable ref because cameraImagesFor is provider-owned).
   */
  const cameraImagesForRef = useRef<((qId: string) => string[]) | null>(null);

  const handleStepperComplete = useCallback(
    (answers: Record<string, AyuAnswerValue>) => {
      const physExamAnswers = ayuAnswersToPhysicalExamAnswers(answers);
      const cameraImagesFor = cameraImagesForRef.current ?? (() => []);

      // Build the per-question detail list (label/value) — used by the
      // start-visit context as a quick summary. Mirrors the old shape.
      const details: Array<{ label: string; value: string }> = [];
      const sectionMap = new Map<string, ModalSection>();

      for (const q of topLevelItems) {
        const selectedCodes = physExamAnswers[q.linkId] ?? [];
        if (selectedCodes.length === 0) continue;

        /* PE section + category extensions are always attached by
         * buildPhysExamQuestion, so the `?? ''` / `?? q.text` fallbacks are
         * defensive against future shape changes — never hit today. */
        /* v8 ignore next */
        const sectionKey = readExt(q, EXT_URL_PE_SECTION_KEY) ?? '';
        const categoryLabel =
          /* v8 ignore next */
          readExt(q, EXT_URL_PE_CATEGORY_LABEL) ?? q.text ?? '';

        const selectedTexts: string[] = [];
        const summaryTexts: string[] = [];
        for (const code of selectedCodes) {
          const opt = q.answerOption?.find(o => o.valueCoding?.code === code);
          if (!opt) continue;
          const display = opt.valueCoding?.display ?? '';
          if (isCameraOption(opt)) {
            const hasImages = cameraImagesFor(q.linkId).length > 0;
            if (hasImages) summaryTexts.push(PE_PICTURE_TAKEN_LABEL);
            // Cameras don't contribute to the plain details list (matches the
            // old PhysicalExamination behaviour).
          } else {
            if (display) {
              selectedTexts.push(display);
              summaryTexts.push(display);
            }
          }
        }

        if (selectedTexts.length > 0) {
          details.push({
            label: categoryLabel,
            value: selectedTexts.join(', '),
          });
        }

        if (summaryTexts.length === 0) continue;

        if (!sectionMap.has(sectionKey)) {
          sectionMap.set(sectionKey, {
            title: sectionKey,
            items: [],
            onChange: () => setIsReviewMode(true),
          });
        }
        sectionMap.get(sectionKey)!.items.push({
          type: 'labelValue',
          label: categoryLabel,
          value: summaryTexts.join(', '),
        });
      }

      const sections = Array.from(sectionMap.values());

      setIsReviewMode(true);
      showVitalConfirmationModal({
        open: true,
        type: 'vitalConfirm',
        icon: iconPhysicalExam,
        title: PHYSICAL_EXAM_SUMMARY_TITLE,
        sections,
        size: 'lg',
        confirmText: SUMMARY_CONFIRM_TEXT,
        cancelText: SUMMARY_CANCEL_TEXT,
        onConfirm: () => {
          const detailsSections = sections.map(s => ({
            title: s.title,
            items: s.items,
          }));
          setPhysicalExamData(physExamAnswers, details, detailsSections);
          saveSectionToTemp({
            physicalExam: {
              answers: physExamAnswers,
              details,
              detailsSections,
            },
          });
          originalOnNext();
        },
      });
    },
    [
      topLevelItems,
      showVitalConfirmationModal,
      setPhysicalExamData,
      saveSectionToTemp,
      originalOnNext,
    ]
  );

  const handleProgressUpdate = useCallback(
    (total: number, answered: number) => {
      onProgressUpdate?.(total, answered);
    },
    [onProgressUpdate]
  );

  const initialAnswers = useMemo(() => {
    const raw = data.physicalExam?.answers;
    if (!raw) return undefined;
    // PhysicalExamAnswers is Record<string, string[]>, which is a valid
    // Record<string, AyuAnswerValue>. Cast for the stricter typed prop.
    return raw as unknown as Record<string, AyuAnswerValue>;
  }, [data.physicalExam]);

  if (!ayuRoot || topLevelItems.length === 0) {
    return <div>Loading physical exam...</div>;
  }

  /* Camera context wraps the stepper so AyuPhysicalExamOptions can reach
   * camera handlers and job-aid resolvers via context. The protocol filter
   * has already pruned topLevelItems above, so the questionByLinkId map
   * here is the post-filter set. */
  return (
    <PhysicalExamCameraProvider
      visitId={visitId ?? null}
      sectionCommentFor={sectionCommentFor}
      jobAidUrlFor={jobAidUrlFor}
      jobAidTypeFor={jobAidTypeFor}
    >
      <CameraImagesForCapture cameraImagesForRef={cameraImagesForRef} />
      <div className="w-full flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[996px]">
            <AyuStepperContainer
              ref={stepperRef}
              questionnaire={ayuRoot as never}
              summaryTitle={PHYSICAL_EXAM_SUMMARY_TITLE}
              skipSummary
              initialAnswers={initialAnswers}
              onComplete={handleStepperComplete}
              onProgressUpdate={handleProgressUpdate}
            />
          </div>
        </div>
        <div className="sticky bottom-0 z-40 bg-white border-t border-gray-200 pt-3">
          <div className="flex gap-3 md:justify-end">
            <AyuButton
              type="button"
              variant="primarylight"
              size="md"
              onClick={() => onPrevSection?.()}
              className="w-full md:w-[10%]"
            >
              <span className="mx-auto w-full text-base">{BUTTON_BACK}</span>
            </AyuButton>
            {isReviewMode && (
              <AyuButton
                type="button"
                variant="primary"
                size="md"
                onClick={() => stepperRef.current?.confirm()}
                className="w-full md:w-[10%]"
              >
                <span className="mx-auto w-full text-base">
                  {BUTTON_SAVE_NEXT}
                </span>
              </AyuButton>
            )}
          </div>
        </div>
      </div>
    </PhysicalExamCameraProvider>
  );
};

/**
 * Bridges the camera context's cameraImagesFor reader into the outer
 * component's ref so handleStepperComplete (computed outside the provider)
 * can ask whether a question has captured images when building the modal.
 */
const CameraImagesForCapture = ({
  cameraImagesForRef,
}: {
  cameraImagesForRef: React.MutableRefObject<
    ((qId: string) => string[]) | null
  >;
}) => {
  const camera = usePhysicalExamCamera();
  cameraImagesForRef.current = camera?.cameraImagesFor ?? null;
  return null;
};

// Re-export to keep parsePhysicalExamFilter available where the protocol
// filter is consumed from this module path historically.
export { parsePhysicalExamFilter };
