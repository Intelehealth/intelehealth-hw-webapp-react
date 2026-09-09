import { useEffect, useState } from 'react';
import iconCamera from '../../../../assets/icons/icon-camera.svg';
import {
  computeMultiSelectToggle,
  SELECT_ANY_ONE,
  SELECT_ONE_OR_MORE,
} from '../../../ayu-library';
import type { AyuRendererBaseProps } from '../../../ayu-library/types/ayu-renderer-props.types';
import type { AyuAnswerOption } from '../../../ayu-library/types/ayu.types';
import {
  EXT_URL_PE_CATEGORY_LABEL,
  EXT_URL_PE_OPTION_KIND,
  EXT_URL_PE_SECTION_KEY,
  PE_OPTION_KIND_CAMERA,
} from '../../../ayu-library/utils/constants';
import { getRowLabel } from '../../../ayu-library/utils/question.utils';
import {
  PE_CAMERA_TILE_LABEL,
  VALIDATION_UPLOAD_IMAGE,
} from '../../utils/ayu.constants';
import { usePhysicalExamCamera } from '../start-visit/physical-examination/physical-exam-camera-context';
import { PhysicalExamImageCapture } from '../start-visit/physical-examination/physical-exam-image-capture.component';
import { getOptionIcon } from '../start-visit/physical-examination/physical-examination.utils';
import { AyuSelectableOption } from './ayu-selectable-option.component';

/**
 * Physical-Exam-specific renderer plugged into componentMap as
 * `'physicalExamOptions'`. Recognised by the section-key marker that
 * transformFhirPhysExamToAyu attaches; otherwise inert.
 */
export const AyuPhysicalExamOptions = ({
  question,
  value,
  setAnswer,
}: AyuRendererBaseProps) => {
  const camera = usePhysicalExamCamera();
  const [cameraLocallySelected, setCameraLocallySelected] = useState(false);

  const allOptions = question?.answerOption ?? [];
  const cameraOption = allOptions.find(o =>
    o.extension?.some(
      ext =>
        ext.url === EXT_URL_PE_OPTION_KIND &&
        ext.valueString === PE_OPTION_KIND_CAMERA
    )
  );
  const cameraCode = cameraOption?.valueCoding?.code;
  const regularOptions = allOptions.filter(o => o !== cameraOption);
  const isSingleOption = regularOptions.length === 1;
  const isMultiChoice = !!question?.repeats;

  /*
   * Auto-select when only one non-camera regular option exists so child
   * questions (e.g. Systolic / Diastolic) appear immediately without the user
   * having to click the single option tile first.
   */
  const singleOptionCode = isSingleOption
    ? (regularOptions[0]?.valueCoding?.code ?? regularOptions[0]?.valueString)
    : undefined;

  useEffect(() => {
    if (singleOptionCode && !value && question) {
      setAnswer?.(question, singleOptionCode);
    }
    /* Run only on mount; singleOptionCode and question are structurally stable. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!question) return null;
  const selected: string[] = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? [value]
      : [];

  const cameraCommitted = !!cameraCode && selected.includes(cameraCode);
  const isCameraSelected = cameraLocallySelected || cameraCommitted;

  const regularSelected: string[] = selected.filter(id => id !== cameraCode);

  const categoryLabel = question.extension?.find(
    e => e.url === EXT_URL_PE_CATEGORY_LABEL
  )?.valueString;
  const sectionLabel = question.extension?.find(
    e => e.url === EXT_URL_PE_SECTION_KEY
  )?.valueString;
  const cameraImages = cameraCode
    ? (camera?.cameraImageStatesFor(question.linkId) ?? [])
    : [];
  const isUploading = camera?.isCameraUploading(question.linkId) ?? false;
  const jobAidUrl = camera?.jobAidUrlFor(question.linkId) ?? null;
  const jobAidType = camera?.jobAidTypeFor(question.linkId) ?? null;

  const codeOf = (opt: AyuAnswerOption): string | undefined =>
    opt.valueCoding?.code ?? opt.valueString;

  const handleRegularOptionClick = (optionId: string) => {
    if (isMultiChoice) {
      const next = computeMultiSelectToggle(question, selected, optionId);
      setAnswer?.(question, next);
      return;
    }
    setAnswer?.(question, cameraCommitted ? [optionId, cameraCode!] : optionId);
  };

  const handleCameraTileClick = () => {
    if (isUploading) return;
    if (isCameraSelected) {
      void camera?.clearCameraImages(question.linkId);
      setCameraLocallySelected(false);
      if (cameraCommitted) {
        setAnswer?.(
          question,
          isMultiChoice ? regularSelected : (regularSelected[0] ?? '')
        );
      }
      return;
    }
    setCameraLocallySelected(true);
  };

  const handleImageAdded = (file: File) => {
    void camera?.addCameraImage(question.linkId, file);
    if (cameraCode && !cameraCommitted) {
      setAnswer?.(question, [...regularSelected, cameraCode]);
    }
    camera?.commitQuestionImages(question.linkId);
  };

  return (
    <div className="px-3 py-2">
      {(sectionLabel || categoryLabel) && (
        <div className="pb-1">
          {sectionLabel && (
            <span className="text-xs font-semibold text-gray-500">
              {sectionLabel}
            </span>
          )}
          {categoryLabel && (
            <span className="text-xs font-semibold text-gray-500 ml-1">
              {categoryLabel}
            </span>
          )}
        </div>
      )}
      <p className="text-base font-semibold text-gray-900 pb-2">
        {getRowLabel(question)}
        {question.required && <span className="text-red-500 ml-0.5">*</span>}
      </p>
      {jobAidUrl && (
        <div className="pb-2">
          <p className="text-xs text-gray-500 mb-1">References:</p>
          {jobAidType === 'video' ? (
            <video
              src={jobAidUrl}
              controls
              className="rounded-md max-w-xs w-full h-auto"
            />
          ) : (
            <img
              src={jobAidUrl}
              alt={categoryLabel ?? ''}
              className="rounded-md max-w-xs w-full h-auto object-contain"
            />
          )}
        </div>
      )}
      <hr className="border-gray-200" />
      {isSingleOption ? (
        /* Single non-camera option: auto-selected, show only camera if present */
        cameraOption && cameraCode ? (
          <div className="flex flex-wrap gap-3 pt-2 pb-3">
            <AyuSelectableOption
              label={PE_CAMERA_TILE_LABEL}
              value={cameraCode}
              selected={isCameraSelected}
              disabled={isUploading}
              leftIcon={<img src={iconCamera} alt="" className="w-4 h-4" />}
              onClick={handleCameraTileClick}
            />
          </div>
        ) : null
      ) : (
        <>
          <p className="pt-2 text-xs text-gray-500">
            {isMultiChoice ? SELECT_ONE_OR_MORE : SELECT_ANY_ONE}
          </p>
          <div className="flex flex-wrap gap-3 pt-2 pb-3">
            {regularOptions.map(opt => {
              const optId = codeOf(opt);
              if (!optId) return null;
              return (
                <AyuSelectableOption
                  key={optId}
                  label={opt.valueCoding?.display ?? opt.valueString ?? optId}
                  value={optId}
                  selected={regularSelected.includes(optId)}
                  leftIcon={getOptionIcon(
                    opt.valueCoding?.display ?? opt.valueString ?? ''
                  )}
                  onClick={() => handleRegularOptionClick(optId)}
                />
              );
            })}
            {cameraOption && cameraCode && (
              <AyuSelectableOption
                label={PE_CAMERA_TILE_LABEL}
                value={cameraCode}
                selected={isCameraSelected}
                disabled={isUploading}
                leftIcon={<img src={iconCamera} alt="" className="w-4 h-4" />}
                onClick={handleCameraTileClick}
              />
            )}
          </div>
        </>
      )}
      {isCameraSelected && camera && (
        <div className="pb-3">
          <PhysicalExamImageCapture
            images={cameraImages}
            onAdd={handleImageAdded}
            onRemove={i => void camera.removeCameraImage(question.linkId, i)}
            onRetry={i => void camera.retryCameraImage(question.linkId, i)}
          />
          {cameraCommitted && cameraImages.length === 0 && (
            <p className="text-xs text-red-500 mt-1 px-3">
              {VALIDATION_UPLOAD_IMAGE}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
