import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import iconAyu from '../../../../ayu/assets/icon-ayu.svg';
import iconNo from '../../../assets/no.svg';
import iconYes from '../../../assets/yes.svg';
import AyuButton from '../../common/ayu-button.component';
import { AyuSelectableOption } from '../../common/ayu-selectable-option.component';

interface MedicalCondition {
  id: number;
  name: string;
  hasCondition: string | null;
  relation?: string;
  describeRelation?: string;
  describeIllness?: string;
}

const MEDICAL_CONDITIONS: MedicalCondition[] = [
  { id: 0, name: 'High blood pressure', hasCondition: null },
  { id: 1, name: 'Heart problems', hasCondition: null },
  { id: 2, name: 'Stroke', hasCondition: null },
  { id: 3, name: 'Diabetes', hasCondition: null },
  { id: 4, name: 'Asthama', hasCondition: null },
  { id: 5, name: 'Cancer/Tumour', hasCondition: null },
  { id: 6, name: 'Operation', hasCondition: null },
  { id: 7, name: 'Other', hasCondition: null },
];

const RELATION_OPTIONS = ['Mother', 'Father', 'Sister', 'Brother', 'Other'];
const NEEDS_RELATION = ['Stroke', 'Cancer/Tumour', 'Other'];
const TOTAL_QUESTIONS = 8;

export const MedicalHistory = () => {
  const navigate = useNavigate();
  const [conditions, setConditions] =
    useState<MedicalCondition[]>(MEDICAL_CONDITIONS);

  const updateCondition = (id: number, updates: Partial<MedicalCondition>) => {
    setConditions(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  return (
    <div className="max-w-3xl">
      {/* Diamond icon + question count */}
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center">
          <img src={iconAyu} className="w-10 h-10" alt="Question Icon" />
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
        <p className="pt-2 text-sm font-medium text-[#2e1e91]">
          {TOTAL_QUESTIONS} questions
        </p>
      </div>

      <div className="space-y-4 bg-emerald-50 p-4 rounded-xl">
        <div className="text-lg font-medium">
          Please provide the patient's family's medical history
        </div>
        <div className="text-sm text-gray-500">Select yes or no</div>

        {conditions.map((condition, index) => {
          const needsRelation = NEEDS_RELATION.includes(condition.name);
          const isYes = condition.hasCondition === 'Yes';
          const isNo = condition.hasCondition === 'No';

          return (
            <div key={condition.id} className="border-b border-b-gray-200 pb-3">
              <div className="flex items-center justify-between">
                <span>
                  {index + 1}. {condition.name}
                </span>

                <div className="flex gap-3">
                  <AyuButton
                    variant="white"
                    leftIcon={
                      <img src={iconYes} alt="yes" className="w-6 h-6" />
                    }
                    size="md"
                    type="button"
                    className={`px-4 py-1 rounded-lg border-none! ${
                      isYes ? 'bg-emerald-500! text-white!' : ''
                    }`}
                    onClick={() =>
                      updateCondition(condition.id, { hasCondition: 'Yes' })
                    }
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
                    onClick={() =>
                      updateCondition(condition.id, { hasCondition: 'No' })
                    }
                  >
                    No
                  </AyuButton>
                </div>
              </div>

              {isYes && needsRelation && (
                <div className="space-y-3 mt-3">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-base text-gray-700">
                      <span className="text-emerald-500">&#9654;</span>
                      Relation
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {RELATION_OPTIONS.map(option => (
                        <AyuSelectableOption
                          key={option}
                          label={option}
                          value={option}
                          selected={condition.relation === option}
                          onClick={() =>
                            updateCondition(condition.id, { relation: option })
                          }
                        />
                      ))}
                    </div>
                  </div>

                  {condition.relation === 'Other' && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-base text-gray-700">
                        <span className="text-emerald-500">&#9654;</span>
                        Describe relation
                      </label>
                      <input
                        type="text"
                        value={condition.describeRelation || ''}
                        onChange={e =>
                          updateCondition(condition.id, {
                            describeRelation: e.target.value,
                          })
                        }
                        placeholder="Grandfather"
                        className="w-full px-3 py-2 text-base border border-[#20c997] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#20c997] bg-white"
                      />
                    </div>
                  )}

                  {condition.name === 'Other' && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-base text-gray-700">
                        <span className="text-emerald-500">&#9654;</span>
                        Describe illness
                      </label>
                      <input
                        type="text"
                        value={condition.describeIllness || ''}
                        onChange={e =>
                          updateCondition(condition.id, {
                            describeIllness: e.target.value,
                          })
                        }
                        placeholder="Grandfather"
                        className="w-full px-3 py-2 text-base border border-[#20c997] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#20c997] bg-white"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end mt-6 px-4 pb-2">
        <AyuButton
          type="submit"
          onClick={() => {
            navigate('/ayu/renders');
          }}
          variant="primary"
          size="sm"
        >
          Submit
        </AyuButton>
      </div>
    </div>
  );
};
