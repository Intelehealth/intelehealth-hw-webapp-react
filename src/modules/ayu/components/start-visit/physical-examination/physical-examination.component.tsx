import { useCallback, useEffect, useRef } from 'react';
import iconCamera from '../../../../../assets/icons/icon-camera.svg';
import type { SectionProps } from '../../../../ayu-library/types/start-visit.types';
import { useStartVisitData } from '../../../context/start-visit.context';
import type { PhysicalExamQuestion } from '../../../data/physical-exam.data';
import { usePhysicalExam } from '../../../hooks/usePhysicalExam';
import { getJobAidUrl } from '../../../utils/physExamAssets';
import AyuButton from '../../common/ayu-button.component';
import { AyuSelectableOption } from '../../common/ayu-selectable-option.component';
import { QuestionLoader } from '../../loaders/question-loader.component';
import { PhysicalExamImageCapture } from './physical-exam-image-capture.component';

// ── Icon helpers ──────────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M2 7l3.5 3.5L12 3.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path
      d="M2 2l10 10M12 2L2 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const getOptionIcon = (text: string): React.ReactNode | undefined => {
  const lower = text.toLowerCase();
  if (lower === 'yes') return <CheckIcon />;
  if (lower === 'no') return <XIcon />;
  return undefined;
};

// ── Single question card ──────────────────────────────────────────────────────

interface QuestionCardProps {
  question: PhysicalExamQuestion;
  index: number;
  totalQuestions: number;
  isActive: boolean;
  selectedOptions: string[];
  cameraImages: string[];
  onSelectSingle: (optionId: string) => void;
  onToggleMulti: (optionId: string) => void;
  onSkip: () => void;
  onAddCameraImage: (file: File) => void;
  onRemoveCameraImage: (index: number) => void;
  onClearCameraImages: () => void;
  onUploadImages: () => void;
  activeRef: React.RefObject<HTMLDivElement | null>;
}

const QuestionCard = ({
  question,
  index,
  totalQuestions,
  isActive,
  selectedOptions,
  cameraImages,
  onSelectSingle,
  onToggleMulti,
  onSkip,
  onAddCameraImage,
  onRemoveCameraImage,
  onClearCameraImages,
  onUploadImages,
  activeRef,
}: QuestionCardProps) => {
  const regularOptions = question.options.filter(o => !o.isCamera);
  const cameraOption = question.options.find(o => o.isCamera);
  const isCameraSelected = cameraOption
    ? selectedOptions.includes(cameraOption.id)
    : false;
  const hadCameraSelected = !isActive && isCameraSelected;

  return (
    <div ref={isActive ? activeRef : null}>
      <QuestionLoader questionIndex={index} totalQuestions={totalQuestions}>
        {/* Section + category label */}
        <div className="px-3 pt-3 pb-1">
          <span className="text-xs font-semibold text-gray-500">
            {question.sectionLabel}
          </span>
          <span className="text-xs font-semibold text-gray-500 ml-1">
            {question.categoryLabel}
          </span>
        </div>

        {/* Question text */}
        <p className="text-base font-semibold text-gray-900 px-3 pb-2">
          {question.questionText}
          {question.isRequired && (
            <span className="text-red-500 ml-0.5">*</span>
          )}
        </p>

        {question.jobAidFile &&
          (() => {
            const assetUrl = getJobAidUrl(question.jobAidFile);
            if (!assetUrl) return null;
            return (
              <div className="px-3 pb-2">
                <p className="text-xs text-gray-500 mb-1">References:</p>
                {question.jobAidType === 'video' ? (
                  <video src={assetUrl} controls className="rounded-md" />
                ) : (
                  <img
                    src={assetUrl}
                    alt={question.categoryLabel}
                    className="rounded-md"
                  />
                )}
              </div>
            );
          })()}

        <hr className="mx-3 border-gray-200" />

        <p className="px-3 pt-2 text-xs text-gray-500">
          {question.isMultiChoice ? 'Select any' : 'Select any one'}
        </p>

        {/* Option buttons — always visible */}
        <div className="flex flex-wrap gap-3 px-3 pt-2 pb-3">
          {regularOptions.map(option => {
            const isSelected = selectedOptions.includes(option.id);
            return (
              <AyuSelectableOption
                key={option.id}
                label={option.text}
                value={option.id}
                selected={isSelected}
                leftIcon={getOptionIcon(option.text)}
                onClick={() => {
                  if (isActive) {
                    onSelectSingle(option.id);
                  } else if (hadCameraSelected) {
                    onToggleMulti(option.id);
                  }
                }}
              />
            );
          })}

          {/* Skip — only for active non-required questions */}
          {isActive && !question.isRequired && (
            <AyuSelectableOption
              label="Skip"
              value="skip"
              selected={false}
              onClick={onSkip}
            />
          )}

          {/* Take a picture */}
          {cameraOption && (
            <AyuSelectableOption
              label="Take a picture"
              value={cameraOption.id}
              selected={isCameraSelected}
              leftIcon={<img src={iconCamera} alt="" className="w-4 h-4" />}
              onClick={() => {
                if (isCameraSelected) {
                  onClearCameraImages();
                } else {
                  onToggleMulti(cameraOption.id);
                }
              }}
            />
          )}
        </div>

        {/* Image capture area */}
        {isCameraSelected && (
          <div className="px-3 pb-3">
            <PhysicalExamImageCapture
              images={cameraImages}
              onAdd={onAddCameraImage}
              onRemove={onRemoveCameraImage}
              onUpload={onUploadImages}
              showTick={hadCameraSelected}
            />
          </div>
        )}
      </QuestionLoader>
    </div>
  );
};

// ── Main section component ────────────────────────────────────────────────────

export const PhysicalExamination = (props: SectionProps) => {
  const { onNextQuestion: originalOnNext } = props;
  const { setPhysicalExamData } = useStartVisitData();
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
    toggleOption,
    goNext,
    goSkip,
    goBack,
  } = usePhysicalExam({ ...props, onNextQuestion: wrappedOnNextQuestion });

  // Keep ref in sync so the wrapped callback always has latest answers
  answersRef.current = answers;

  const activeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [internalIndex]);

  const visitedQuestions = visibleQuestions.slice(0, internalIndex + 1);

  return (
    <div className="flex flex-col gap-6">
      {visitedQuestions.map((question, index) => {
        const isActive = index === internalIndex;

        return (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            totalQuestions={totalQuestions}
            isActive={isActive}
            selectedOptions={selectedOptionsFor(question.id)}
            cameraImages={cameraImagesFor(question.id)}
            onSelectSingle={optionId => selectAndAdvance(optionId)}
            onToggleMulti={optionId => toggleOption(optionId)}
            onSkip={goSkip}
            onAddCameraImage={file => addCameraImage(question.id, file)}
            onRemoveCameraImage={idx => removeCameraImage(question.id, idx)}
            onClearCameraImages={() => clearCameraImages(question.id)}
            onUploadImages={() => goNext()}
            activeRef={activeRef}
          />
        );
      })}

      {/* Back navigation */}
      <div className="flex md:justify-end my-2">
        <AyuButton
          type="button"
          variant="secondary"
          onClick={goBack}
          className="w-full md:w-[10%]"
        >
          <span className="mx-auto w-full text-base">Back</span>
        </AyuButton>
      </div>
    </div>
  );
};
