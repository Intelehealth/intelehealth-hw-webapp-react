import { useState } from 'react';
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
import iconYes from '../../assets/yes.svg';
import {
  BUTTON_UPLOAD,
  PE_CAMERA_TILE_LABEL,
  VALIDATION_UPLOAD_IMAGE,
} from '../../utils/ayu.constants';
import { usePhysicalExamCamera } from '../start-visit/physical-examination/physical-exam-camera-context';
import { PhysicalExamImageCapture } from '../start-visit/physical-examination/physical-exam-image-capture.component';
import { getOptionIcon } from '../start-visit/physical-examination/physical-examination.utils';
import AyuButton from './ayu-button.component';
import { AyuSelectableOption } from './ayu-selectable-option.component';

/**
 * Physical-Exam-specific renderer plugged into componentMap as
 * `'physicalExamOptions'`. Recognised by the section-key marker that
 * transformFhirPhysExamToAyu attaches; otherwise inert.
 *
 * UX contract:
 *  - Non-camera options commit to answers immediately on click (single-choice
 *    auto-advances via useFHIRStepper).
 *  - Camera tile selection is held in LOCAL state until the user clicks the
 *    Submit/Upload button. This prevents the stepper's auto-advance from
 *    firing before the user has had a chance to actually capture an image.
 *  - Submit/Upload button visibility:
 *      * multi-choice with any selected option, OR
 *      * camera tile locally selected with at least one image captured.
 */
export const AyuPhysicalExamOptions = ({
  question,
  value,
  setAnswer,
}: AyuRendererBaseProps) => {
  const camera = usePhysicalExamCamera();
  const [cameraLocallySelected, setCameraLocallySelected] = useState(false);
  const [submittedAt, setSubmittedAt] = useState<number | null>(null);
  const [showUploadError, setShowUploadError] = useState(false);

  if (!question) return null;

  const allOptions = question.answerOption ?? [];
  const cameraOption = allOptions.find(o =>
    o.extension?.some(
      ext =>
        ext.url === EXT_URL_PE_OPTION_KIND &&
        ext.valueString === PE_OPTION_KIND_CAMERA
    )
  );
  const cameraCode = cameraOption?.valueCoding?.code;
  const regularOptions = allOptions.filter(o => o !== cameraOption);
  const isMultiChoice = !!question.repeats;
  const selected: string[] = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? [value]
      : [];

  /* The camera tile is "selected" either while the user is actively capturing
   * this session (cameraLocallySelected) OR when a picture was already
   * committed to the answer (e.g. on edit / revisit) — so it pre-selects. */
  const cameraCommitted = !!cameraCode && selected.includes(cameraCode);
  const isCameraSelected = cameraLocallySelected || cameraCommitted;

  const categoryLabel = question.extension?.find(
    e => e.url === EXT_URL_PE_CATEGORY_LABEL
  )?.valueString;
  const sectionLabel = question.extension?.find(
    e => e.url === EXT_URL_PE_SECTION_KEY
  )?.valueString;
  const cameraImages = cameraCode
    ? (camera?.cameraImagesFor(question.linkId) ?? [])
    : [];
  const jobAidUrl = camera?.jobAidUrlFor(question.linkId) ?? null;
  const jobAidType = camera?.jobAidTypeFor(question.linkId) ?? null;

  const codeOf = (opt: AyuAnswerOption): string | undefined =>
    opt.valueCoding?.code ?? opt.valueString;

  const handleRegularOptionClick = (optionId: string) => {
    if (isMultiChoice) {
      /* Toggle through the shared logic so mutually-exclusive options
      (e.g. "None"/"Normal", marked exclude-from-multi-choice) clear the
      rest and vice-versa. The camera code is never exclusive, so it is
      preserved when a normal option is toggled.*/
      const next = computeMultiSelectToggle(question, selected, optionId);
      setAnswer?.(question, next);
    } else {
      setAnswer?.(question, optionId);
    }
  };

  const handleCameraTileClick = () => {
    /* The tile is rendered only when both cameraOption and cameraCode are
     * present, so this handler always runs with cameraCode set. */
    if (isCameraSelected) {
      // Deselecting — drop any in-progress images, clear local state, and
      // remove a previously committed camera answer (edit case).
      camera?.clearCameraImages(question.linkId);
      setCameraLocallySelected(false);
      setShowUploadError(false);
      if (cameraCommitted) {
        setAnswer?.(
          question,
          isMultiChoice ? selected.filter(id => id !== cameraCode) : ''
        );
      }
      return;
    }
    setCameraLocallySelected(true);
    setShowUploadError(false);
  };

  const handleSubmit = () => {
    if (cameraImages.length === 0) {
      setShowUploadError(true);
      return;
    }
    setShowUploadError(false);
    const next = isMultiChoice
      ? [...selected.filter(id => id !== cameraCode), cameraCode!]
      : [cameraCode!];
    setAnswer?.(question, next);
    setSubmittedAt(Date.now());
  };

  /* Only the camera-commit case needs an in-component Submit, since a captured
   * image must be explicitly turned into an answer. Plain multi-choice defers
   * to the outer stepper container's Submit (which also validates required
   * fields and advances via goNext) — otherwise two Submit buttons stack.
   * We show the button whenever the camera tile is selected — either being
   * captured this session OR already committed (edit), so on edit the user can
   * review the uploaded pictures, add/remove, and re-submit. */
  const submitVisible = isCameraSelected && cameraImages.length > 0;

  const submitJustHappened = !!submittedAt && Date.now() - submittedAt < 1500;

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
              selected={selected.includes(optId)}
              leftIcon={getOptionIcon(
                opt.valueCoding?.display ?? opt.valueString ?? ''
              )}
              onClick={() => handleRegularOptionClick(optId)}
            />
          );
        })}
        {cameraOption && cameraCode && (
          <AyuSelectableOption
            /* Always render the camera tile as "Take a Picture". The
             * underlying option's display in the FHIR data can be a marker
             * like "[picture taken]" — never expose that to the user. */
            label={PE_CAMERA_TILE_LABEL}
            value={cameraCode}
            selected={isCameraSelected}
            leftIcon={<img src={iconCamera} alt="" className="w-4 h-4" />}
            onClick={handleCameraTileClick}
          />
        )}
      </div>
      {isCameraSelected && camera && (
        <div className="pb-3">
          <PhysicalExamImageCapture
            images={cameraImages}
            onAdd={f => {
              camera.addCameraImage(question.linkId, f);
              setShowUploadError(false);
            }}
            onRemove={i => camera.removeCameraImage(question.linkId, i)}
          />
          {/* Block submission without a picture: show the error after a submit
           * attempt (showUploadError) and also whenever the picture option is
           * committed but has no images (e.g. all removed on edit) — that is an
           * invalid state the user must fix before the answer can stand. */}
          {(showUploadError || cameraCommitted) &&
            cameraImages.length === 0 && (
              <p className="text-xs text-red-500 mt-1 px-3">
                {VALIDATION_UPLOAD_IMAGE}
              </p>
            )}
        </div>
      )}
      {submitVisible && (
        <div className="flex justify-end pb-3">
          <AyuButton
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSubmit}
          >
            {`${BUTTON_UPLOAD} (${cameraImages.length})`}
            {submitJustHappened && <img src={iconYes} alt="yes" />}
          </AyuButton>
        </div>
      )}
    </div>
  );
};
