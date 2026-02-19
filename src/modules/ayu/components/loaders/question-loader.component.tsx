import { useEffect, useState, useRef, Suspense, lazy } from 'react';
import iconQuestionMark from '../../../ayu/assets/icon-ayu.svg';
import type { FlattenedQuestion, PhysicalExamOption } from '../../types/physical-exam.types';
import '../common/selectable-option.css';
import { fileToBase64, validateImageFormat } from '../../../profile/profile.helpers';
import { showToast } from '../../../../services/toast';
import Button from '../../../../components/common/button.component';

const CameraCaptureModal = lazy(
  () => import('../../../../components/common/camera-capture-modal.component')
);

interface QuestionLoaderProps {
  question: string;
  questionIndex: number;
  totalQuestions: number;
  onNextQuestion: () => void;
  showAsterisk?: boolean;
  // Physical exam specific props
  physicalExamQuestion?: FlattenedQuestion;
  selectedAnswer?: string | string[];
  onAnswerSelect?: (answerId: string, isExclusive: boolean) => void;
  onImageCapture?: (imageData: string) => void;
  onImageRemove?: (imageIndex: number) => void;
  capturedImages?: string[];
}

export const QuestionLoader = ({
  question = 'Since when have you had this symptom?',
  questionIndex,
  totalQuestions,
  showAsterisk = true,
  physicalExamQuestion,
  selectedAnswer,
  onAnswerSelect,
  onImageCapture,
  onImageRemove,
  capturedImages = [],
}: QuestionLoaderProps) => {
  const [loading, setLoading] = useState(true);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLoading(true);
    setShowImageGallery(false); // Reset gallery state when question changes
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, [questionIndex]);

  // Show image gallery when images are captured
  useEffect(() => {
    if (capturedImages.length > 0) {
      setShowImageGallery(true);
    }
  }, [capturedImages.length]);

  // Helper function to get reference images based on job aid file
  const getReferenceImages = (jobAidFile: string) => {
    const imageMap: Record<string, string[]> = {
      jaundiceexample: [
        '/assets/physical-exam/jaundice-1.jpg',
        '/assets/physical-exam/jaundice-2.jpg',
        '/assets/physical-exam/jaundice-3.jpg',
      ],
      conjunctivaexample: [
        '/assets/physical-exam/conjunctiva-1.jpg',
        '/assets/physical-exam/conjunctiva-2.jpg',
      ],
      abnormalnails: [
        '/assets/physical-exam/nails-1.jpg',
        '/assets/physical-exam/nails-2.jpg',
        '/assets/physical-exam/nails-3.jpg',
      ],
      ankleedemaexample: [
        '/assets/physical-exam/ankle-1.jpg',
        '/assets/physical-exam/ankle-2.jpg',
      ],
    };
    return imageMap[jobAidFile] || [];
  };

  const isSelected = (optionId: string): boolean => {
    if (Array.isArray(selectedAnswer)) {
      return selectedAnswer.includes(optionId);
    }
    return selectedAnswer === optionId;
  };

  const handleOptionClick = (option: PhysicalExamOption) => {
    if (!onAnswerSelect) return;

    if (option['input-type'] === 'camera') {
      // Show add button only, don't open modal
      setShowImageGallery(true);
    } else {
      const isExclusive =
        option['is-exclusive-option'] === 'true' || option['is-exclusive-option'] === true;
      onAnswerSelect(option.id, isExclusive);
    }
  };

  const handleOpenCamera = () => {
    setIsPhotoModalOpen(false);
    setIsCameraModalOpen(true);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file format
      if (!validateImageFormat(file)) {
        showToast(
          'Upload error!',
          'Upload JPG, JPEG or PNG format image only.',
          'warning'
        );
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      if (onImageCapture) {
        try {
          const base64 = await fileToBase64(file);
          onImageCapture(base64);
          setIsPhotoModalOpen(false);
        } catch (error) {
          console.error('Error converting file to base64:', error);
          showToast('Upload error!', 'Failed to process image.', 'error');
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCameraCapture = async (file: File) => {
    // Validate format
    if (!validateImageFormat(file)) {
      showToast(
        'Upload error!',
        'Upload JPG, JPEG or PNG format image only.',
        'warning'
      );
      setIsCameraModalOpen(false);
      return;
    }

    if (onImageCapture) {
      try {
        const base64 = await fileToBase64(file);
        onImageCapture(base64);
        setIsCameraModalOpen(false);
        setIsPhotoModalOpen(false);
      } catch (error) {
        console.error('Error converting file to base64:', error);
        showToast('Upload error!', 'Failed to process image.', 'error');
      }
    }
  };

  const handleCameraClose = () => {
    setIsCameraModalOpen(false);
  };

  const handlePhotoModalClose = () => {
    setIsPhotoModalOpen(false);
  };

  const handlePlusButtonClick = () => {
    setIsPhotoModalOpen(true);
  };

  const handleImageRemoveClick = (index: number) => {
    if (onImageRemove) {
      onImageRemove(index);
      if (capturedImages.length === 1) {
        setShowImageGallery(false);
      }
    }
  };

  const handleUploadImages = () => {
    if (physicalExamQuestion && onAnswerSelect && capturedImages.length > 0) {
      const cameraOption = physicalExamQuestion.options.find(
        (opt) => opt['input-type'] === 'camera'
      );
      if (cameraOption) {
        const isExclusive =
          cameraOption['is-exclusive-option'] === 'true' ||
          cameraOption['is-exclusive-option'] === true;
        onAnswerSelect(cameraOption.id, isExclusive);
        setShowImageGallery(false);
      }
    }
  };

  const getYesIcon = () => (
    <svg
      className="w-5 h-5 mr-2"
      fill="none"
      stroke="#0FD197"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );

  const getNoIcon = () => (
    <svg
      className="w-5 h-5 mr-2"
      fill="none"
      stroke="#0FD197"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );

  const getCameraIcon = () => (
    <svg
      className="w-5 h-5 mr-2"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );

  const getOptionIcon = (optionText: string) => {
    const text = optionText.toLowerCase();
    if (text === 'yes') return getYesIcon();
    if (text === 'no') return getNoIcon();
    return null;
  };

  return (
    <div className="w-full max-w-[760px]">
      {/* TOP ROW: ICON + QUESTION COUNT */}
      <div className="flex items-start gap-3">
        {/* ICON */}
        <div className="flex flex-col items-center">
          <img
            src={iconQuestionMark}
            className="w-10 h-10"
            alt="Question Icon"
          />

          {/* TRIANGLE */}
          <svg
            width="18"
            height="9"
            viewBox="0 0 20 10"
            className="mt-1 text-emerald-50"
          >
            <path
              d="M0 10 C5 10 7.5 0 10 0 C12.5 0 15 10 20 10 Z"
              fill="currentColor"
            />
          </svg>
        </div>

        {/* QUESTION COUNT */}
        <p className="pt-2 text-sm font-medium text-[#2e1e91]">
          {questionIndex + 1} of {totalQuestions} questions
        </p>
      </div>

      {/* GREEN COMMENT BOX (FULL WIDTH) */}
      <div className="w-full bg-emerald-50 rounded-lg px-4 py-4 min-h-[96px]">
        {loading ? (
          <div className="flex gap-2 items-center">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-emerald-500"
                style={{
                  animation: 'dotBounce 1.4s infinite ease-in-out both',
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        ) : (
          <>
            <p className="text-lg font-medium text-gray-900 leading-[156%]">
              {question}
              {showAsterisk && question && <span className="text-red-500">*</span>}
            </p>

            {/* Reference Images Section */}
            {physicalExamQuestion?.jobAidType === 'image' && physicalExamQuestion?.jobAidFile && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">References:</p>
                <div className="flex gap-3">
                  {getReferenceImages(physicalExamQuestion.jobAidFile).map((imagePath, index) => (
                    <div
                      key={index}
                      className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center"
                    >
                      <img
                        src={imagePath}
                        alt={`Reference ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.innerHTML = `
                            <div class="text-gray-400 text-xs text-center p-2">
                              Ref ${index + 1}
                            </div>
                          `;
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video Reference Info */}
            {physicalExamQuestion?.jobAidType === 'video' && physicalExamQuestion?.jobAidFile && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700 flex items-center gap-2">
                <span className="text-lg">🎥</span>
                <div>
                  <span className="font-medium">Video Reference:</span>{' '}
                  {physicalExamQuestion.jobAidFile}
                </div>
              </div>
            )}

            {physicalExamQuestion && (
              <p className="text-sm text-gray-500 mt-3">Select any one</p>
            )}

            {/* Option Buttons - Inside the green box */}
            {physicalExamQuestion && (
              <>
                <div className="mt-4 option-group">
                  {/* Render non-camera options first, with Yes before No */}
                  {physicalExamQuestion.options
                    .filter((option) => option['input-type'] !== 'camera')
                    .sort((a, b) => {
                      const aText = a.text.toLowerCase();
                      const bText = b.text.toLowerCase();
                      if (aText === 'yes') return -1;
                      if (bText === 'yes') return 1;
                      if (aText === 'no') return -1;
                      if (bText === 'no') return 1;
                      return 0;
                    })
                    .map((option) => {
                      const selected = isSelected(option.id);

                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={`selectable-option ${selected ? 'selected' : ''}`}
                          onClick={() => handleOptionClick(option)}
                        >
                          {getOptionIcon(option.text)}
                          {option.text}
                        </button>
                      );
                    })}

                  {/* Skip Button - Before Take a picture */}
                  <button
                    type="button"
                    className={`selectable-option ${isSelected('skip_' + physicalExamQuestion.id) ? 'selected' : ''}`}
                    onClick={() => {
                      if (onAnswerSelect) {
                        onAnswerSelect('skip_' + physicalExamQuestion.id, true);
                      }
                    }}
                  >
                    Skip
                  </button>

                  {/* Render camera options last */}
                  {physicalExamQuestion.options
                    .filter((option) => option['input-type'] === 'camera')
                    .map((option) => {
                      const selected = isSelected(option.id) || showImageGallery;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={`selectable-option ${selected ? 'selected' : ''}`}
                          onClick={() => handleOptionClick(option)}
                        >
                          {getCameraIcon()}
                          {option.text}
                        </button>
                      );
                    })}
                </div>

                {/* Upload Prompt - Show after Take Picture is clicked */}
                {showImageGallery && capturedImages.length === 0 &&
                 physicalExamQuestion.options.some(opt => opt['input-type'] === 'camera') && (
                  <div className="mt-4">
                    <div className="flex items-center gap-2 text-gray-800">
                      <div
                        onClick={handlePlusButtonClick}
                        className="w-11 h-11 bg-[#0fd197] rounded flex items-center justify-center cursor-pointer hover:bg-[#0ec189] transition-colors"
                      >
                        <svg
                          className="w-6 h-6 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </div>
                      <span className="text-sm font-medium">Upload an image from gallery or take a picture</span>
                    </div>
                  </div>
                )}

                {/* Image Gallery - Show when images are captured */}
                {showImageGallery && capturedImages.length > 0 && (
                  <div className="mt-4">
                    <div className="flex gap-3 flex-wrap items-center">
                      {/* Captured Image Thumbnails */}
                      {capturedImages.map((imageData, index) => (
                        <div
                          key={index}
                          className="relative w-16 h-16"
                        >
                          <div className="w-full h-full rounded-lg overflow-hidden border-2 border-gray-300">
                            <img
                              src={imageData}
                              alt={`Captured ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => handleImageRemoveClick(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-md"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}

                      {/* Add More Button */}
                      <button
                        type="button"
                        onClick={handlePlusButtonClick}
                        className="w-16 h-16 rounded-lg border-2 border-dashed border-[#0fd197] bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
                      >
                        <svg
                          className="w-8 h-8 text-[#0fd197]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Upload Button */}
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleUploadImages}
                        className="px-6 py-2 bg-[#0fd197] text-white rounded-lg font-medium hover:bg-[#0ec089] transition-colors"
                      >
                        Upload ({capturedImages.length})
                      </button>
                    </div>
                  </div>
                )}

                {/* Help text for multi-choice */}
                {physicalExamQuestion.multiChoice && (
                  <div className="mt-3 text-sm text-gray-600 italic">
                    You can select multiple options
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Simple Photo Upload Modal - No Crop */}
      {!loading && physicalExamQuestion && isPhotoModalOpen && !isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[#2e1e91] lg:bg-white/90"
            onClick={handlePhotoModalClose}
          />

          {/* Modal */}
          <div
            className="relative bg-white rounded-2xl lg:rounded-lg shadow-xl mx-6 border border-gray-200 z-10 overflow-hidden"
            style={{ width: '500px', height: '250px' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Upload/Change photo
              </h3>
              <button
                onClick={handlePhotoModalClose}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors border"
                style={{ borderColor: '#7f7b92' }}
              >
                <i
                  className="fa-solid fa-times"
                  style={{ fontSize: '8px', color: '#7f7b92' }}
                ></i>
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Take Photo Option */}
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 ">
                    <i className="fa-solid fa-camera text-green-600 text-lg"></i>
                  </div>
                  <span className="text-gray-800 font-medium text-base">
                    Take photo
                  </span>
                </div>
                <Button
                  onClick={handleOpenCamera}
                  variant="primary"
                  size="md"
                  className="px-6"
                  leftIcon={<i className="fa-solid fa-camera text-white"></i>}
                >
                  Use Camera
                </Button>
              </div>

              {/* Upload Photo Option */}
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100 ">
                    <i className="fa-solid fa-upload text-green-600 text-lg"></i>
                  </div>
                  <span className="text-gray-800 font-medium text-base">
                    Upload photo
                  </span>
                </div>
                <Button
                  onClick={handleUploadClick}
                  variant="primary"
                  size="md"
                  className="px-6"
                  leftIcon={<i className="fa-solid fa-upload text-white"></i>}
                >
                  Upload
                </Button>
              </div>

              {/* Hidden file input for Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      {!loading && physicalExamQuestion && isCameraModalOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <CameraCaptureModal
            isOpen={isCameraModalOpen}
            onClose={handleCameraClose}
            onCapture={handleCameraCapture}
          />
        </Suspense>
      )}

      {/* ANIMATION */}
      <style>
        {`
          @keyframes dotBounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
};
