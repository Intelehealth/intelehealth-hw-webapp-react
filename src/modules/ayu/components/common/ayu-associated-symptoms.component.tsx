import iconNo from '../../assets/no.svg';
import iconYes from '../../assets/yes.svg';
import type { AyuAnswerValue, AyuQuestion } from '../../types/ayu.types';
import { AyuNestedRenderer } from '../start-visit/visit-reason/ayu-nested-renderer.component';
import AyuButton from './ayu-button.component';

interface Props {
  question: AyuQuestion;
  value: AyuAnswerValue;
  onChange?: (val: AyuAnswerValue) => void;
  answers: Record<string, AyuAnswerValue>;
  setAnswer: (question: AyuQuestion, value: AyuAnswerValue) => void;
}

export const AyuAssociatedSymptoms = ({
  question,
  value,
  onChange,
  answers,
  setAnswer,
}: Props) => {
  // Parse yes/no answers from the stored value array.
  // Yes codes are stored as-is; No codes are stored with a "NO_" prefix.
  const yesValues: string[] = [];
  const noValues: string[] = [];

  if (Array.isArray(value)) {
    for (const v of value) {
      if (typeof v === 'string' && v.startsWith('NO_')) {
        noValues.push(v.slice(3));
      } else if (typeof v === 'string') {
        yesValues.push(v);
      }
    }
  }

  const toggleValue = (code: string, isYes: boolean) => {
    const newYes = isYes
      ? [...yesValues.filter(c => c !== code), code]
      : yesValues.filter(c => c !== code);
    const newNo = isYes
      ? noValues.filter(c => c !== code)
      : [...noValues.filter(c => c !== code), code];

    onChange?.([...newYes, ...newNo.map(c => `NO_${c}`)]);
  };

  return (
    <div className="space-y-4 bg-emerald-50 p-4 rounded-xl">
      <div className="text-lg font-medium">
        {question.text}
        {question?.required && <span className="text-error-500 ml-1">*</span>}
      </div>
      <div className="text-sm text-gray-500">
        Select yes or no for each option
      </div>

      {question.answerOption?.map((opt, index) => {
        const code = opt.valueCoding?.code || opt.valueString || '';

        const isSelected = yesValues.includes(code);
        const isNo = noValues.includes(code);

        return (
          <div
            key={code}
            className="flex items-center justify-between border-b border-b-gray-200 pb-3"
          >
            <span>
              {index + 1}. {opt.valueCoding?.display || opt.valueString}
            </span>

            <div className="flex gap-3">
              <AyuButton
                variant="white"
                leftIcon={<img src={iconYes} alt="yes" className="w-6 h-6" />}
                size="md"
                type="button"
                className={`px-4 py-1 rounded-lg border-none! ${
                  isSelected ? 'bg-emerald-500! text-white!' : ''
                }`}
                onClick={() => toggleValue(code, true)}
              >
                Yes
              </AyuButton>

              <AyuButton
                variant="white"
                leftIcon={<img src={iconNo} alt="no" className="w-6 h-6" />}
                size="md"
                type="button"
                className={`px-4 py-1 rounded-lg border-none! ${
                  isNo ? 'bg-emerald-500! text-white!' : ''
                }`}
                onClick={() => toggleValue(code, false)}
              >
                No
              </AyuButton>
            </div>
          </div>
        );
      })}

      {/* Nested Questions Support */}
      {question.item && (
        <AyuNestedRenderer
          items={question.item}
          answers={{ ...answers, [question.linkId]: yesValues }}
          setAnswer={setAnswer}
        />
      )}
    </div>
  );
};
