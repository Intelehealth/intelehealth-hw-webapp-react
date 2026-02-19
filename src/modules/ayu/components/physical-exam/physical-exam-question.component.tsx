import React, { useRef } from 'react';
import type { FlattenedQuestion, PhysicalExamOption } from '../../types/physical-exam.types';
import '../common/selectable-option.css';

interface PhysicalExamQuestionProps {
  question: FlattenedQuestion;
  selectedAnswer: string | string[];
  onAnswerSelect: (answerId: string, isExclusive: boolean) => void;
  onImageCapture?: (imageData: string) => void;
}

export const PhysicalExamQuestion: React.FC<PhysicalExamQuestionProps> = ({
  question,
  selectedAnswer,
  onAnswerSelect,
  onImageCapture,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSelected = (optionId: string): boolean => {
    if (Array.isArray(selectedAnswer)) {
      return selectedAnswer.includes(optionId);
    }
    return selectedAnswer === optionId;
  };

  const handleOptionClick = (option: PhysicalExamOption) => {
    if (option['input-type'] === 'camera') {
      // Trigger file input for camera
      fileInputRef.current?.click();
    } else {
      const isExclusive =
        option['is-exclusive-option'] === 'true' || option['is-exclusive-option'] === true;
      onAnswerSelect(option.id, isExclusive);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageCapture) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        onImageCapture(imageData);

        // Find the camera option and select it
        const cameraOption = question.options.find(
          (opt) => opt['input-type'] === 'camera'
        );
        if (cameraOption) {
          const isExclusive =
            cameraOption['is-exclusive-option'] === 'true' ||
            cameraOption['is-exclusive-option'] === true;
          onAnswerSelect(cameraOption.id, isExclusive);
        }
      };
      reader.readAsDataURL(file);
    }
  };

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

  // Helper function to get reference images based on job aid file
  const getReferenceImages = (jobAidFile: string) => {
    // Map of job aid files to placeholder image paths
    // TODO: Replace with actual image paths when available
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

  return (
    <div className="mt-6">
      {/* Category Path - Breadcrumb */}
      {question.categoryPath.length > 0 && (
        <div className="text-sm text-gray-600 mb-3">
          {question.categoryPath.join(' > ')}
        </div>
      )}

      {/* Reference Images Section */}
      {question.jobAidType === 'image' && question.jobAidFile && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">References:</p>
          <div className="flex gap-3">
            {getReferenceImages(question.jobAidFile).map((imagePath, index) => (
              <div
                key={index}
                className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100 flex items-center justify-center"
              >
                <img
                  src={imagePath}
                  alt={`Reference ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback for missing images - show placeholder
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
      {question.jobAidType === 'video' && question.jobAidFile && (
        <div className="mb-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-700 flex items-center gap-2">
          <span className="text-lg">🎥</span>
          <div>
            <span className="font-medium">Video Reference Available:</span>{' '}
            {question.jobAidFile}
          </div>
        </div>
      )}

      <p className="text-sm text-gray-500 mb-3">Select any one</p>

      {/* Options */}
      <div className="option-group">
        {question.options.map((option) => {
          const selected = isSelected(option.id);
          const isCameraOption = option['input-type'] === 'camera';

          return (
            <button
              key={option.id}
              type="button"
              className={`selectable-option ${selected ? 'selected' : ''}`}
              onClick={() => handleOptionClick(option)}
            >
              {isCameraOption && getCameraIcon()}
              {option.text}
            </button>
          );
        })}
      </div>

      {/* Hidden file input for camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Help text for multi-choice */}
      {question.multiChoice && (
        <div className="mt-3 text-sm text-gray-600 italic">
          You can select multiple options
        </div>
      )}
    </div>
  );
};
