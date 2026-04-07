import { useCallback, useEffect, useRef, useState } from 'react';
import iconCamera from '../../../../../assets/icons/icon-camera.svg';
import iconRightArrow from '../../../../../assets/icons/icon-right-arrow.svg';
import { SELECT_ANY_ONE, SELECT_ONE_OR_MORE } from '../../../../ayu-library';
import type { SectionProps } from '../../../../ayu-library/types/start-visit.types';
import iconYes from '../../../assets/yes.svg';
import { useStartVisitData } from '../../../context/start-visit.context';
import { usePhysicalExam } from '../../../hooks/usePhysicalExam';
import {
  BUTTON_BACK,
  BUTTON_CONFIRM,
  BUTTON_SUBMIT,
  BUTTON_UPLOAD,
} from '../../../utils/ayu.constants';
import { getJobAidUrl } from '../../../utils/physExamAssets';
import AyuButton from '../../common/ayu-button.component';
import { AyuSelectableOption } from '../../common/ayu-selectable-option.component';
import { QuestionLoader } from '../../loaders/question-loader.component';
import { PhysicalExamImageCapture } from './physical-exam-image-capture.component';
import type { QuestionCardProps } from './physical-examination.types';
import { arraysEqual, getOptionIcon } from './physical-examination.utils';

const QuestionCard = ({
  question,
  index,
  totalQuestions,
  isActive,
  selectedOptions,
  cameraImages,
  onSelectSingle,
  onSelectSinglePast,
  onToggleMulti,
  onSkip,
  onAddCameraImage,
  onRemoveCameraImage,
  onClearCameraImages,
  onUploadImages,
  activeRef,
  isSubmitted,
}: QuestionCardProps) => {
  const regularOptions = question.options.filter(o => !o.isCamera);
  const cameraOption = question.options.find(o => o.isCamera);
  const isCameraSelected = cameraOption
    ? selectedOptions.includes(cameraOption.id)
    : false;
  const jobAidUrl = question.jobAidFile
    ? getJobAidUrl(question.jobAidFile)
    : null;

  const handleOptionClick = (optionId: string) => {
    if (question.isMultiChoice) onToggleMulti(optionId);
    else if (isActive) onSelectSingle(optionId);
    else onSelectSinglePast(optionId);
  };

  return (
    <div ref={isActive ? activeRef : null}>
      <QuestionLoader questionIndex={index} totalQuestions={totalQuestions}>
        <div className="px-3 pt-3 pb-1">
          <span className="text-xs font-semibold text-gray-500">
            {question.sectionLabel}
          </span>
          <span className="text-xs font-semibold text-gray-500 ml-1">
            {question.categoryLabel}
          </span>
        </div>
        <p className="text-base font-semibold text-gray-900 px-3 pb-2">
          {question.questionText}
          {question.isRequired && (
            <span className="text-red-500 ml-0.5">*</span>
          )}
        </p>
        {jobAidUrl && (
          <div className="px-3 pb-2">
            <p className="text-xs text-gray-500 mb-1">References:</p>
            {question.jobAidType === 'video' ? (
              <video src={jobAidUrl} controls className="rounded-md" />
            ) : (
              <img
                src={jobAidUrl}
                alt={question.categoryLabel}
                className="rounded-md"
              />
            )}
          </div>
        )}
        <hr className="mx-3 border-gray-200" />
        <p className="px-3 pt-2 text-xs text-gray-500">
          {question.isMultiChoice ? SELECT_ONE_OR_MORE : SELECT_ANY_ONE}
        </p>
        <div className="flex flex-wrap gap-3 px-3 pt-2 pb-3">
          {regularOptions.map(option => (
            <AyuSelectableOption
              key={option.id}
              label={option.text}
              value={option.id}
              selected={selectedOptions.includes(option.id)}
              leftIcon={getOptionIcon(option.text)}
              onClick={() => handleOptionClick(option.id)}
            />
          ))}
          {isActive && !question.isRequired && (
            <AyuSelectableOption
              label="Skip"
              value="skip"
              selected={false}
              onClick={onSkip}
            />
          )}
          {cameraOption && (
            <AyuSelectableOption
              label="Take a picture"
              value={cameraOption.id}
              selected={isCameraSelected}
              leftIcon={<img src={iconCamera} alt="" className="w-4 h-4" />}
              onClick={() => {
                if (isCameraSelected) onClearCameraImages();
                onToggleMulti(cameraOption.id);
              }}
            />
          )}
        </div>
        {isCameraSelected && (
          <div className="px-3 pb-3">
            <PhysicalExamImageCapture
              images={cameraImages}
              onAdd={onAddCameraImage}
              onRemove={onRemoveCameraImage}
            />
          </div>
        )}
        {selectedOptions.length > 0 &&
          (!isCameraSelected || cameraImages.length > 0) &&
          (question.isMultiChoice || isCameraSelected) && (
            <div className="flex justify-end px-3 pb-3">
              <AyuButton
                type="button"
                variant="primary"
                size="sm"
                onClick={onUploadImages}
              >
                {isCameraSelected && cameraImages.length > 0
                  ? `${BUTTON_UPLOAD} (${cameraImages.length})`
                  : BUTTON_SUBMIT}
                {isCameraSelected && cameraImages.length > 0 && isSubmitted && (
                  <img src={iconYes} alt="yes" />
                )}
              </AyuButton>
            </div>
          )}
      </QuestionLoader>
    </div>
  );
};

export const PhysicalExamination = (props: SectionProps) => {
  const { onNextQuestion: originalOnNext } = props;
  const { data, setPhysicalExamData } = useStartVisitData();
  const answersRef = useRef<Record<string, string[]>>({});

  const wrappedOnNextQuestion = useCallback(() => {
    setPhysicalExamData(answersRef.current);
    originalOnNext();
  }, [originalOnNext, setPhysicalExamData]);

  const {
    internalIndex,
    visibleQuestions,
    totalQuestions,
    answers,
    selectedOptionsFor,
    cameraImagesFor,
    addCameraImage,
    removeCameraImage,
    clearCameraImages,
    selectAndAdvance,
    selectSingle,
    toggleOption,
    goNext,
    goSkip,
    onPrevSection,
  } = usePhysicalExam({ ...props, onNextQuestion: wrappedOnNextQuestion });

  answersRef.current = answers;

  const activeRef = useRef<HTMLDivElement | null>(null);
  const [submittedAnswers, setSubmittedAnswers] = useState<
    Record<string, string[]>
  >({});

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [internalIndex]);

  return (
    <div className="flex flex-col gap-6">
      {visibleQuestions.slice(0, internalIndex + 1).map((question, index) => {
        const isActive = index === internalIndex;
        const opts = selectedOptionsFor(question.id);
        return (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            totalQuestions={totalQuestions}
            isActive={isActive}
            selectedOptions={opts}
            cameraImages={cameraImagesFor(question.id)}
            onSelectSingle={id => {
              setSubmittedAnswers(p => ({ ...p, [question.id]: [id] }));
              selectAndAdvance(id);
            }}
            onSelectSinglePast={id => selectSingle(id, question.id)}
            onToggleMulti={id => toggleOption(id, question.id)}
            onSkip={goSkip}
            onAddCameraImage={f => addCameraImage(question.id, f)}
            onRemoveCameraImage={i => removeCameraImage(question.id, i)}
            onClearCameraImages={() => clearCameraImages(question.id)}
            onUploadImages={() => {
              setSubmittedAnswers(p => ({ ...p, [question.id]: opts }));
              goNext();
            }}
            activeRef={activeRef}
            isSubmitted={
              !!submittedAnswers[question.id] &&
              arraysEqual(opts, submittedAnswers[question.id])
            }
          />
        );
      })}
      <div className="flex gap-3 md:justify-end my-2">
        <AyuButton
          type="button"
          variant="secondary"
          onClick={() => onPrevSection?.()}
          className="w-full md:w-[10%]"
        >
          <span className="mx-auto w-full text-base">{BUTTON_BACK}</span>
        </AyuButton>
        {!!data.physicalExam && (
          <AyuButton
            type="button"
            variant="primary"
            rightIcon={<img src={iconRightArrow} alt="yes" />}
            onClick={() => wrappedOnNextQuestion()}
            className="w-full md:w-[10%]"
          >
            <span className="mx-auto w-full text-base">{BUTTON_CONFIRM}</span>
          </AyuButton>
        )}
      </div>
    </div>
  );
};
