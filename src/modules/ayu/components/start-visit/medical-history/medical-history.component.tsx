import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AyuButton from '../../common/ayu-button.component';
import { AyuYesNoButton } from '../../common/ayu-yes-no-button.component';
import './medical-history.styles.css';

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
const PRIMARY_COLOR = '#0fd197';

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
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-primary-500 transform rotate-45 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-white -rotate-45"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <span className="text-base font-semibold text-gray-700">
          {TOTAL_QUESTIONS} questions
        </span>
      </div>

      <div className="mb-4">
        <h2 className="text-base font-medium text-gray-900 mb-1">
          Please provide the patient's family's medical history
        </h2>
        <p className="text-sm text-gray-500">Select yes or no</p>
      </div>

      <div className="space-y-0 max-h-[500px] overflow-y-auto pr-2 hide-scrollbar mb-4">
        {conditions.map(condition => {
          const needsRelation = NEEDS_RELATION.includes(condition.name);
          const isYes = condition.hasCondition === 'Yes';

          return (
            <div
              key={condition.id}
              className="bg-emerald-50 rounded-none p-4 border-b border-emerald-100 last:border-b-0 last:rounded-b-lg first:rounded-t-lg space-y-3"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-base text-gray-900 flex-1">
                  {condition.id + 1}. {condition.name}
                </p>

                <AyuYesNoButton
                  value={condition.hasCondition as 'Yes' | 'No' | null}
                  onChange={value =>
                    updateCondition(condition.id, { hasCondition: value })
                  }
                  activeColor={PRIMARY_COLOR}
                />
              </div>

              {isYes && needsRelation && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-base text-gray-700">
                      <span className="text-[#0fd197]">▶</span>
                      Relation
                    </label>
                    <div className="grid grid-cols-3 gap-2 max-w-xs">
                      {RELATION_OPTIONS.map(option => (
                        <AyuButton
                          key={option}
                          type="button"
                          onClick={() =>
                            updateCondition(condition.id, { relation: option })
                          }
                          variant={
                            condition.relation === option
                              ? 'primary'
                              : 'secondary'
                          }
                          size="sm"
                          className={`${condition.relation === option ? 'text-white border-0' : 'bg-white text-gray-700 border-0'} px-3 py-1.5 text-sm`}
                          style={
                            condition.relation === option
                              ? { backgroundColor: PRIMARY_COLOR }
                              : {}
                          }
                        >
                          {option}
                        </AyuButton>
                      ))}
                    </div>
                  </div>

                  {condition.relation === 'Other' && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-base text-gray-700">
                        <span className="text-[#0fd197]">▶</span>
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
                        className="w-/full px-3 py-2 text-base border border-[#0fd197] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0fd197] bg-white"
                      />
                    </div>
                  )}

                  {condition.name === 'Other' && (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-base text-gray-700">
                        <span className="text-[#0fd197]">▶</span>
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
                        className="w-full px-3 py-2 text-base border border-[#0fd197] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0fd197] bg-white"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div className="flex justify-end mt-6 px-4 pb-2">
          <AyuButton
            type="submit"
            onClick={() => {
              navigate('/ayu/renders');
            }}
            variant="primary"
            size="sm"
            className="text-white border-0"
            style={{ backgroundColor: PRIMARY_COLOR }}
          >
            Submit
          </AyuButton>
        </div>
      </div>
    </div>
  );
};
