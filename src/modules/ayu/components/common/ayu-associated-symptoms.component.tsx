import {
  parseYesNoValues,
  toggleAssociatedSymptom,
} from '../../../ayu-library/logic/associated-symptoms.logic';
import type {
  AyuAnswerValue,
  AyuQuestion,
} from '../../../ayu-library/types/ayu.types';
import {
  EXT_URL_DISPLAY_TEXT,
  SELECT_YES_OR_NO,
} from '../../../ayu-library/utils/constants';
import iconNo from '../../assets/no-default.svg';
import iconNoSelected from '../../assets/No.svg';
import iconYes from '../../assets/yes-default.svg';
import iconYesSelected from '../../assets/Yes.svg';
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
  const { yesValues, noValues } = parseYesNoValues(value);

  const toggleValue = (code: string, isYes: boolean) => {
    onChange?.(
      toggleAssociatedSymptom(yesValues, noValues, code, isYes, question)
    );
  };

  return (
    <div className="bg-emerald-50 p-4 rounded-xl">
      <div className="text-lg font-medium">
        {question?.extension &&
        question?.extension?.find(ext => ext.url === EXT_URL_DISPLAY_TEXT)
          ?.valueString
          ? question?.extension?.find(ext => ext.url === EXT_URL_DISPLAY_TEXT)
              ?.valueString
          : question.text}
        {/* {question?.required && <span className="text-error-500 ml-1">*</span>} */}
      </div>
      <span className="text-sm text-gray-500">{SELECT_YES_OR_NO}</span>

      {question.answerOption?.map((opt, index) => {
        const code = opt.valueCoding?.code || opt.valueString || '';

        const isSelected = yesValues.includes(code);
        const isNo = noValues.includes(code);

        // Get nested items whose enableWhen references this specific option
        const childItems = question.item?.filter(item =>
          item.enableWhen?.some(
            rule =>
              rule.question === question.linkId &&
              rule.answerCoding?.code === code
          )
        );

        return (
          <div key={code} className="border-b border-b-gray-200 pt-3 pb-3">
            <div className="flex items-center justify-between">
              <span>
                {index + 1}. {opt.valueCoding?.display || opt.valueString}
              </span>

              <div className="flex gap-3">
                <AyuButton
                  variant="white"
                  leftIcon={
                    <img
                      src={isSelected ? iconYesSelected : iconYes}
                      alt="yes"
                      className="w-full h-full"
                    />
                  }
                  size="md"
                  type="button"
                  className={`px-5 py-2 rounded-lg  border-none! ${
                    isSelected ? 'bg-emerald-500! text-white!' : ''
                  }`}
                  onClick={() => toggleValue(code, true)}
                >
                  Yes
                </AyuButton>

                <AyuButton
                  variant="white"
                  leftIcon={
                    <img
                      src={isNo ? iconNoSelected : iconNo}
                      alt="no"
                      className="w-full h-full"
                    />
                  }
                  size="md"
                  type="button"
                  className={`px-5 py-2 rounded-lg border-none! ${
                    isNo ? 'bg-emerald-500! text-white!' : ''
                  }`}
                  onClick={() => toggleValue(code, false)}
                >
                  No
                </AyuButton>
              </div>
            </div>

            {/* Render nested children only when "Yes" is selected */}
            {isSelected && childItems && childItems.length > 0 && (
              <AyuNestedRenderer
                items={childItems}
                parentQuestion={question}
                answers={{ ...answers, [question.linkId]: yesValues }}
                setAnswer={setAnswer}
                showAllTriangles
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
