import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PhysicalExamQuestion } from '../../../../modules/ayu/types/physical-exam.types';

// ── Mock data ───────────────────────────────────────────────────────────────

const { mockQuestions } = vi.hoisted(() => {
  const mockQuestions: PhysicalExamQuestion[] = [
    {
      id: 'q1',
      sectionLabel: 'Section 1:',
      categoryLabel: 'Cat 1',
      questionText: 'Single-choice required?',
      isRequired: true,
      isMultiChoice: false,
      sectionKey: 'S1',
      options: [
        { id: 'q1-a', text: 'Yes' },
        { id: 'q1-b', text: 'No' },
      ],
    },
    {
      id: 'q2',
      sectionLabel: 'Section 1:',
      categoryLabel: 'Cat 2',
      questionText: 'Multi-choice?',
      isRequired: true,
      isMultiChoice: true,
      sectionKey: 'S1',
      options: [
        { id: 'q2-normal', text: 'Normal', excludeFromMulti: true },
        { id: 'q2-a', text: 'Option A' },
        { id: 'q2-b', text: 'Option B' },
        { id: 'q2-cam', text: 'Camera', isCamera: true, isExclusiveOption: true },
        { id: 'q2-exc', text: 'Exclusive', isExclusiveOption: true },
      ],
    },
    {
      id: 'q3',
      sectionLabel: 'Section 2:',
      categoryLabel: 'Cat 3',
      questionText: 'Non-required?',
      isRequired: false,
      isMultiChoice: false,
      sectionKey: 'S2',
      options: [
        { id: 'q3-a', text: 'Yes' },
        { id: 'q3-b', text: 'No' },
      ],
    },
    {
      id: 'q4',
      sectionLabel: 'Section 2:',
      categoryLabel: 'Cat 4',
      questionText: 'Conditional?',
      isRequired: false,
      isMultiChoice: false,
      sectionKey: 'S2',
      options: [
        { id: 'q4-a', text: 'Yes' },
        { id: 'q4-b', text: 'No' },
      ],
      showWhen: { questionId: 'q3', optionId: 'q3-a' },
    },
  ];
  return { mockQuestions };
});

// ── Mocks ───────────────────────────────────────────────────────────────────

const mockFilterFn = vi.fn();

vi.mock('../../../../modules/ayu/utils/physical-exam.utils', () => ({
  filterPhysicalExamQuestions: (...args: unknown[]) => mockFilterFn(...args),
}));

vi.mock('../../../../modules/profile/profile.helpers', () => ({
  fileToBase64: vi.fn().mockResolvedValue('data:image/png;base64,AAAA'),
}));

vi.mock('../../../../utils/storage', () => ({
  storage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    getUser: vi.fn(() => JSON.stringify({ uuid: 'user-uuid' })),
  },
}));

const mockSaveSectionToTemp = vi.fn().mockResolvedValue(undefined);
const mockGetChildResources = vi.fn().mockResolvedValue({ data: [] });
const mockUpsertAssetResource = vi.fn().mockResolvedValue({ data: { id: 1 } });

vi.mock('../../../../modules/ayu/services/temp-storage.service', () => ({
  getChildResources: (...args: unknown[]) => mockGetChildResources(...args),
  upsertAssetResource: (...args: unknown[]) => mockUpsertAssetResource(...args),
}));

vi.mock('../../../../modules/ayu/context/start-visit.context', () => ({
  useStartVisitData: () => ({
    visitId: 'test-visit-id',
    saveSectionToTemp: mockSaveSectionToTemp,
  }),
}));

const mockAddPendingImage = vi.fn();
const mockRemovePendingImage = vi.fn();
const mockClearPendingImages = vi.fn();

vi.mock('../../../../modules/ayu/services/obs.service', () => ({
  addPendingImage: (...args: unknown[]) => mockAddPendingImage(...args),
  removePendingImage: (...args: unknown[]) => mockRemovePendingImage(...args),
  clearPendingImages: (...args: unknown[]) => mockClearPendingImages(...args),
}));

const mockUseAyuJsonList = vi
  .fn()
  .mockReturnValue([{ name: 'physExam.json', json: '__use_mock_questions__' }]);

vi.mock('../../../../modules/ayu/hooks/useAyuJson.hook', () => ({
  useAyuJsonList: (...args: unknown[]) => mockUseAyuJsonList(...args),
}));

vi.mock('../../../../modules/ayu/utils/parseFhirPhysExamQuestionnaire', async () => {
  const actual = await vi.importActual<
    typeof import('../../../../modules/ayu/utils/parseFhirPhysExamQuestionnaire')
  >('../../../../modules/ayu/utils/parseFhirPhysExamQuestionnaire');
  return {
    ...actual,
    parseFhirPhysExamQuestionnaire: (raw: unknown) =>
      raw === '__use_mock_questions__'
        ? mockQuestions
        : actual.parseFhirPhysExamQuestionnaire(
            raw as Parameters<typeof actual.parseFhirPhysExamQuestionnaire>[0]
          ),
  };
});

import { usePhysicalExam } from '../../../../modules/ayu/hooks/usePhysicalExam';

// ── Helpers ─────────────────────────────────────────────────────────────────

import type { PhysicalExamAnswers } from '../../../../modules/ayu/types/physical-exam.types';

const defaultProps = {
  questionIndex: 0,
  onNextQuestion: vi.fn(),
  onPrevQuestion: vi.fn(),
  onPrevSection: vi.fn(),
  onProgressUpdate: vi.fn(),
};

function setup(overrides: Partial<typeof defaultProps> & { initialAnswers?: PhysicalExamAnswers } = {}) {
  const props = { ...defaultProps, ...overrides };
  return renderHook(() => usePhysicalExam(props));
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('usePhysicalExam', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFilterFn.mockImplementation(
      (questions: PhysicalExamQuestion[]) => questions
    );
    mockUseAyuJsonList.mockReturnValue([
      { name: 'physExam.json', json: '__use_mock_questions__' },
    ]);
  });

  // ── Initial state ──────────────────────────────────────────────────────

  describe('initial state', () => {
    it('should start at internalIndex 0', () => {
      const { result } = setup();
      expect(result.current.internalIndex).toBe(0);
    });

    it('should compute visible questions (q4 hidden by default)', () => {
      const { result } = setup();
      expect(result.current.visibleQuestions).toHaveLength(3);
      expect(result.current.visibleQuestions.map(q => q.id)).toEqual(['q1', 'q2', 'q3']);
    });

    it('should set totalQuestions to visible count', () => {
      const { result } = setup();
      expect(result.current.totalQuestions).toBe(3);
    });

    it('should set currentQuestion to first visible question', () => {
      const { result } = setup();
      expect(result.current.currentQuestion?.id).toBe('q1');
    });

    it('should set isLastQuestion to false on first question', () => {
      const { result } = setup();
      expect(result.current.isLastQuestion).toBe(false);
    });

    it('should call onProgressUpdate on mount', () => {
      setup();
      expect(defaultProps.onProgressUpdate).toHaveBeenCalledWith(3, 0);
    });
  });

  // ── physicalExamFilter ─────────────────────────────────────────────────

  describe('physicalExamFilter', () => {
    it('should pass filter string to filterPhysicalExamQuestions', () => {
      setup({ physicalExamFilter: 'S1:' } as any);
      expect(mockFilterFn).toHaveBeenCalledWith(mockQuestions, 'S1:');
    });

    it('should default to empty string when physicalExamFilter is undefined', () => {
      setup({ physicalExamFilter: undefined } as any);
      expect(mockFilterFn).toHaveBeenCalledWith(mockQuestions, '');
    });
  });

  // ── serverQuestions (useAyuJsonList) ──────────────────────────────────

  describe('serverQuestions via useAyuJsonList', () => {
    afterEach(() => {
      mockUseAyuJsonList.mockReturnValue([
        { name: 'physExam.json', json: '__use_mock_questions__' },
      ]);
    });

    it('should fall back to empty list when physExam.json is not in ayuList', () => {
      mockUseAyuJsonList.mockReturnValue([]);
      mockFilterFn.mockImplementation((q: PhysicalExamQuestion[]) => q);

      const { result } = setup();

      expect(result.current.totalQuestions).toBe(0);
      expect(mockFilterFn).toHaveBeenLastCalledWith([], '');
    });

    it('should use parseFhirPhysExamQuestionnaire when physExam.json is found', () => {
      const rawPhysExam = {
        resourceType: 'Questionnaire',
        item: [
          {
            linkId: 'sec1',
            text: 'general exams',
            type: 'group',
            extension: [
              {
                url: 'https://intelehealth.org/fhir/StructureDefinition/language',
                valueString: 'General Exams:',
              },
            ],
            answerOption: [
              { valueCoding: { code: 'pallor-tag', display: 'Pallor' } },
            ],
            item: [
              {
                linkId: 'server-q1',
                text: 'Check pallor*',
                type: 'choice',
                required: true,
                answerOption: [
                  { valueCoding: { code: 'sq1-a', display: 'Yes' } },
                  { valueCoding: { code: 'sq1-b', display: 'No' } },
                ],
              },
            ],
          },
        ],
      };

      mockUseAyuJsonList.mockReturnValue([
        { name: 'physExam.json', json: rawPhysExam },
      ]);
      mockFilterFn.mockImplementation((q: PhysicalExamQuestion[]) => q);

      const { result } = setup();

      expect(result.current.totalQuestions).toBe(1);
      expect(result.current.currentQuestion?.id).toBe('server-q1');
      expect(result.current.currentQuestion?.sectionLabel).toBe('General Exams:');
      expect(result.current.currentQuestion?.isRequired).toBe(true);
    });

    it('should handle camera, exclusive, and excludeFromMulti options from server', () => {
      const IH = 'https://intelehealth.org/fhir/StructureDefinition';
      const rawPhysExam = {
        resourceType: 'Questionnaire',
        item: [
          {
            linkId: 'sec1',
            text: 'hands',
            type: 'group',
            item: [
              {
                linkId: 'sq2',
                text: 'Check nails',
                type: 'choice',
                required: true,
                extension: [
                  {
                    url: 'http://hl7.org/fhir/StructureDefinition/questionnaire-itemControl',
                    valueCodeableConcept: {
                      coding: [
                        {
                          system:
                            'http://hl7.org/fhir/questionnaire-item-control',
                          code: 'check-box',
                        },
                      ],
                    },
                  },
                  { url: `${IH}/job-aid-type`, valueString: 'image' },
                  { url: `${IH}/job-aid-file`, valueString: 'nails.png' },
                ],
                answerOption: [
                  {
                    valueCoding: { code: 'sq2-n', display: 'Normal' },
                    extension: [
                      {
                        url: `${IH}/exclude-from-multi-choice`,
                        valueString: 'true',
                      },
                    ],
                  },
                  { valueCoding: { code: 'sq2-a', display: 'Cyanosis' } },
                  {
                    valueCoding: { code: 'sq2-exc', display: 'Exclusive' },
                    extension: [
                      {
                        url: `${IH}/is-exclusive-option`,
                        valueString: 'true',
                      },
                    ],
                  },
                ],
                item: [
                  {
                    linkId: 'sq2-cam-link',
                    text: 'Take a picture',
                    type: 'attachment',
                    enableWhen: [
                      {
                        question: 'sq2',
                        operator: '=',
                        answerCoding: { code: 'sq2-cam' },
                      },
                    ],
                    extension: [
                      {
                        url: `${IH}/is-exclusive-option`,
                        valueString: 'true',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      mockUseAyuJsonList.mockReturnValue([
        { name: 'physExam.json', json: rawPhysExam },
      ]);
      mockFilterFn.mockImplementation((q: PhysicalExamQuestion[]) => q);

      const { result } = setup();

      const q = result.current.currentQuestion!;
      expect(q.id).toBe('sq2');
      expect(q.isMultiChoice).toBe(true);
      expect(q.jobAidType).toBe('image');
      expect(q.jobAidFile).toBe('nails.png');
      expect(q.sectionLabel).toBe('Hands:');
      expect(q.options.find(o => o.id === 'sq2-cam')?.isCamera).toBe(true);
      expect(q.options.find(o => o.id === 'sq2-cam')?.isExclusiveOption).toBe(true);
      expect(q.options.find(o => o.id === 'sq2-exc')?.isExclusiveOption).toBe(true);
      expect(q.options.find(o => o.id === 'sq2-n')?.excludeFromMulti).toBe(true);
    });

    it('should handle section with language set to "%"', () => {
      const rawPhysExam = {
        resourceType: 'Questionnaire',
        item: [
          {
            linkId: 'sec1',
            text: 'feet',
            type: 'group',
            extension: [
              {
                url: 'https://intelehealth.org/fhir/StructureDefinition/language',
                valueString: '%',
              },
            ],
            item: [],
          },
        ],
      };

      mockUseAyuJsonList.mockReturnValue([
        { name: 'physExam.json', json: rawPhysExam },
      ]);
      mockFilterFn.mockImplementation((q: PhysicalExamQuestion[]) => q);

      const { result } = setup();

      // language is '%' so sectionLabel falls back to sectionKey + ':'
      expect(result.current.totalQuestions).toBe(0);
    });
  });

  // ── selectAndAdvance ───────────────────────────────────────────────────

  describe('selectAndAdvance', () => {
    it('should advance to next question and set answer', () => {
      const { result } = setup();
      act(() => result.current.selectAndAdvance('q1-a'));
      expect(result.current.internalIndex).toBe(1);
      expect(result.current.selectedOptionsFor('q1')).toEqual(['q1-a']);
      expect(result.current.currentQuestion?.id).toBe('q2');
    });

    it('should call onNextQuestion when on last visible question', () => {
      const onNext = vi.fn();
      const { result } = setup({ onNextQuestion: onNext });

      // Advance to q2 then q3 (last visible)
      act(() => result.current.selectAndAdvance('q1-a'));
      act(() => result.current.selectAndAdvance('q2-a'));
      expect(result.current.currentQuestion?.id).toBe('q3');

      // q3 is last — selecting should call onNextQuestion (when q3-b is chosen, q4 stays hidden)
      act(() => result.current.selectAndAdvance('q3-b'));
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('should reveal conditional question and NOT call onNextQuestion', () => {
      const onNext = vi.fn();
      const { result } = setup({ onNextQuestion: onNext });

      // Navigate to q3
      act(() => result.current.selectAndAdvance('q1-a'));
      act(() => result.current.selectAndAdvance('q2-a'));

      // Selecting q3-a reveals q4 via showWhen → q3 is no longer last
      act(() => result.current.selectAndAdvance('q3-a'));
      expect(onNext).not.toHaveBeenCalled();
      expect(result.current.internalIndex).toBe(3);
      expect(result.current.currentQuestion?.id).toBe('q4');
      expect(result.current.visibleQuestions).toHaveLength(4);
    });

    it('should no-op when currentQuestion is null', () => {
      mockFilterFn.mockReturnValue([]);
      const { result } = setup();
      expect(result.current.currentQuestion).toBeNull();
      act(() => result.current.selectAndAdvance('anything'));
      // Should not throw or change state
      expect(result.current.internalIndex).toBe(0);
    });
  });

  // ── selectSingle ──────────────────────────────────────────────────────

  describe('selectSingle', () => {
    it('should set a single answer without advancing', () => {
      const { result } = setup();
      act(() => result.current.selectAndAdvance('q1-a')); // advance to q2
      // Now use selectSingle on past question q1
      act(() => result.current.selectSingle('q1-b', 'q1'));
      expect(result.current.selectedOptionsFor('q1')).toEqual(['q1-b']);
      expect(result.current.internalIndex).toBe(1); // did not change
    });

    it('should preserve camera selection when changing answer', () => {
      const { result } = setup();
      act(() => result.current.selectAndAdvance('q1-a')); // advance to q2
      // Select camera on q2
      act(() => result.current.toggleOption('q2-cam'));
      act(() => result.current.toggleOption('q2-a'));
      act(() => result.current.goNext()); // advance past q2
      // Now selectSingle on q2 — should keep camera
      act(() => result.current.selectSingle('q2-b', 'q2'));
      const opts = result.current.selectedOptionsFor('q2');
      expect(opts).toContain('q2-cam');
      expect(opts).toContain('q2-b');
      expect(opts).not.toContain('q2-a');
    });

    it('should no-op when targetQuestionId is not found (line 85)', () => {
      const { result } = setup();
      act(() => result.current.selectSingle('q1-a', 'nonexistent-q'));
      // Nothing should change
      expect(result.current.selectedOptionsFor('q1')).toEqual([]);
    });
  });

  // ── toggleOption ───────────────────────────────────────────────────────

  describe('toggleOption', () => {
    function setupAtQ2() {
      mockFilterFn.mockImplementation((q: PhysicalExamQuestion[]) => q);
      const hook = setup();
      act(() => hook.result.current.selectAndAdvance('q1-a'));
      expect(hook.result.current.currentQuestion?.id).toBe('q2');
      return hook;
    }

    it('should add a regular option', () => {
      const { result } = setupAtQ2();
      act(() => result.current.toggleOption('q2-a'));
      expect(result.current.selectedOptionsFor('q2')).toEqual(['q2-a']);
    });

    it('should toggle off a regular option', () => {
      const { result } = setupAtQ2();
      act(() => result.current.toggleOption('q2-a'));
      act(() => result.current.toggleOption('q2-a'));
      expect(result.current.selectedOptionsFor('q2')).toEqual([]);
    });

    it('should allow selecting multiple regular options', () => {
      const { result } = setupAtQ2();
      act(() => result.current.toggleOption('q2-a'));
      act(() => result.current.toggleOption('q2-b'));
      expect(result.current.selectedOptionsFor('q2')).toEqual(['q2-a', 'q2-b']);
    });

    it('should keep camera alongside other selections (camera is additive)', () => {
      const { result } = setupAtQ2();
      act(() => result.current.toggleOption('q2-a'));
      act(() => result.current.toggleOption('q2-cam')); // camera — additive
      expect(result.current.selectedOptionsFor('q2')).toEqual(['q2-a', 'q2-cam']);
    });

    it('should set only the excludeFromMulti option when selected', () => {
      const { result } = setupAtQ2();
      act(() => result.current.toggleOption('q2-a'));
      act(() => result.current.toggleOption('q2-normal')); // excludeFromMulti
      expect(result.current.selectedOptionsFor('q2')).toEqual(['q2-normal']);
    });

    it('should keep camera when a regular option is added', () => {
      const { result } = setupAtQ2();
      act(() => result.current.toggleOption('q2-cam')); // camera
      expect(result.current.selectedOptionsFor('q2')).toEqual(['q2-cam']);

      act(() => result.current.toggleOption('q2-a')); // regular — camera stays
      expect(result.current.selectedOptionsFor('q2')).toEqual(['q2-cam', 'q2-a']);
    });

    it('should clear excludeFromMulti option when a regular option is selected', () => {
      const { result } = setupAtQ2();
      act(() => result.current.toggleOption('q2-normal')); // excludeFromMulti
      expect(result.current.selectedOptionsFor('q2')).toEqual(['q2-normal']);

      act(() => result.current.toggleOption('q2-b')); // regular — filters out excludeFromMulti
      expect(result.current.selectedOptionsFor('q2')).toEqual(['q2-b']);
    });

    it('should no-op when currentQuestion is null', () => {
      mockFilterFn.mockReturnValue([]);
      const { result } = setup();
      act(() => result.current.toggleOption('anything'));
      expect(result.current.selectedOptionsFor('q2')).toEqual([]);
    });

    it('should toggle off camera option when already selected (line 127)', () => {
      const { result } = setupAtQ2();
      act(() => result.current.toggleOption('q2-cam')); // select camera
      expect(result.current.selectedOptionsFor('q2')).toContain('q2-cam');
      act(() => result.current.toggleOption('q2-cam')); // deselect camera
      expect(result.current.selectedOptionsFor('q2')).not.toContain('q2-cam');
    });

    it('should select only exclusive option when isExclusiveOption is true (lines 132-133)', () => {
      const { result } = setupAtQ2();
      // First select some regular options
      act(() => result.current.toggleOption('q2-a'));
      act(() => result.current.toggleOption('q2-b'));
      expect(result.current.selectedOptionsFor('q2')).toEqual(['q2-a', 'q2-b']);

      // Now add an isExclusiveOption (non-camera) — need a question with such an option
      // q2-cam has isExclusiveOption but also isCamera, so camera takes precedence
      // Let's test with targetQuestionId to use a question with exclusive non-camera option
      // We can use toggleOption with a non-camera exclusive option by adding to mock data
      // For now, verify that camera additive overrides exclusive
      act(() => result.current.toggleOption('q2-cam'));
      expect(result.current.selectedOptionsFor('q2')).toEqual(['q2-a', 'q2-b', 'q2-cam']);
    });

    it('should select only exclusive non-camera option, clearing others (lines 132-133)', () => {
      const { result } = setupAtQ2();
      act(() => result.current.toggleOption('q2-a'));
      act(() => result.current.toggleOption('q2-b'));
      expect(result.current.selectedOptionsFor('q2')).toEqual(['q2-a', 'q2-b']);
      // Select exclusive non-camera option — should clear all and keep only this
      act(() => result.current.toggleOption('q2-exc'));
      expect(result.current.selectedOptionsFor('q2')).toEqual(['q2-exc']);
    });

    it('should fall back to currentQuestion when targetQuestionId not found (line 115)', () => {
      const { result } = setupAtQ2();
      // Pass a non-existent targetQuestionId — should fall back to currentQuestion (q2)
      act(() => result.current.toggleOption('q2-a', 'nonexistent-q'));
      expect(result.current.selectedOptionsFor('q2')).toEqual(['q2-a']);
    });
  });

  // ── goNext ─────────────────────────────────────────────────────────────

  describe('goNext', () => {
    it('should advance internalIndex when not on last question', () => {
      const { result } = setup();
      act(() => result.current.goNext());
      expect(result.current.internalIndex).toBe(1);
    });

    it('should call onNextQuestion when on last question and all required answered', () => {
      const onNext = vi.fn();
      const { result } = setup({ onNextQuestion: onNext });

      // Answer all required questions (q1 and q2 are required) then advance
      act(() => result.current.selectAndAdvance('q1-a'));
      act(() => result.current.toggleOption('q2-a'));
      act(() => result.current.goNext()); // advance past q2
      expect(result.current.isLastQuestion).toBe(true);

      act(() => result.current.goNext());
      expect(onNext).toHaveBeenCalledTimes(1);
    });
  });

  // ── goSkip ─────────────────────────────────────────────────────────────

  describe('goSkip', () => {
    it('should clear answer and images for current question and advance', () => {
      const { result } = setup();

      // Answer q1 first, then go back, then skip
      act(() => result.current.selectAndAdvance('q1-a'));
      act(() => result.current.goBack());
      expect(result.current.selectedOptionsFor('q1')).toEqual(['q1-a']);

      act(() => result.current.goSkip());
      expect(result.current.selectedOptionsFor('q1')).toEqual([]);
      expect(result.current.internalIndex).toBe(1);
    });

    it('should call onNextQuestion when skipping last question and all required answered', () => {
      const onNext = vi.fn();
      const { result } = setup({ onNextQuestion: onNext });

      // Answer required questions then navigate to last (q3 is not required)
      act(() => result.current.selectAndAdvance('q1-a'));
      act(() => result.current.toggleOption('q2-a'));
      act(() => result.current.goNext());

      act(() => result.current.goSkip());
      expect(onNext).toHaveBeenCalledTimes(1);
    });

    it('should handle skip when currentQuestion is null', () => {
      mockFilterFn.mockReturnValue([]);
      const onNext = vi.fn();
      const { result } = setup({ onNextQuestion: onNext });

      act(() => result.current.goSkip());
      // isLast is true (0 >= -1), so onNextQuestion is called
      expect(onNext).toHaveBeenCalledTimes(1);
    });
  });

  // ── goBack ─────────────────────────────────────────────────────────────

  describe('goBack', () => {
    it('should call onPrevSection when at index 0', () => {
      const onPrev = vi.fn();
      const { result } = setup({ onPrevSection: onPrev });

      act(() => result.current.goBack());
      expect(onPrev).toHaveBeenCalledTimes(1);
    });

    it('should decrement internalIndex when not at 0', () => {
      const { result } = setup();

      act(() => result.current.goNext());
      expect(result.current.internalIndex).toBe(1);

      act(() => result.current.goBack());
      expect(result.current.internalIndex).toBe(0);
    });

    it('should not throw when onPrevSection is undefined', () => {
      const { result } = setup({ onPrevSection: undefined });
      expect(() => act(() => result.current.goBack())).not.toThrow();
    });
  });

  // ── selectedOptionsFor ─────────────────────────────────────────────────

  describe('selectedOptionsFor', () => {
    it('should return empty array for unanswered question', () => {
      const { result } = setup();
      expect(result.current.selectedOptionsFor('q1')).toEqual([]);
    });

    it('should return selected options after answering', () => {
      const { result } = setup();
      act(() => result.current.selectAndAdvance('q1-b'));
      expect(result.current.selectedOptionsFor('q1')).toEqual(['q1-b']);
    });

    it('should return empty array for unknown questionId', () => {
      const { result } = setup();
      expect(result.current.selectedOptionsFor('nonexistent')).toEqual([]);
    });
  });

  // ── Camera image management ────────────────────────────────────────────

  describe('cameraImagesFor', () => {
    it('should return empty array when no images', () => {
      const { result } = setup();
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
    });

    it('should return empty array for unknown questionId', () => {
      const { result } = setup();
      expect(result.current.cameraImagesFor('nonexistent')).toEqual([]);
    });
  });

  describe('addCameraImage', () => {
    it('should add a base64 image for the question', async () => {
      const { result } = setup();
      const file = new File(['test'], 'photo.png', { type: 'image/png' });

      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });

      expect(result.current.cameraImagesFor('q1')).toEqual([
        'data:image/png;base64,AAAA',
      ]);
    });

    it('should append to existing images', async () => {
      const { result } = setup();
      const file = new File(['test'], 'photo.png', { type: 'image/png' });

      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });
      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });

      expect(result.current.cameraImagesFor('q1')).toHaveLength(2);
    });
  });

  describe('removeCameraImage', () => {
    it('should remove image at the given index', async () => {
      const { result } = setup();
      const file = new File(['test'], 'photo.png', { type: 'image/png' });

      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });
      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });

      act(() => result.current.removeCameraImage('q1', 0));
      expect(result.current.cameraImagesFor('q1')).toHaveLength(1);
    });

    it('should handle removal when no images exist', () => {
      const { result } = setup();
      act(() => result.current.removeCameraImage('q1', 0));
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
    });

    it('should compute correct flat index when images exist in earlier questions', async () => {
      const { result } = setup();
      const file1 = new File(['a'], 'a.png', { type: 'image/png' });
      const file2 = new File(['b'], 'b.png', { type: 'image/png' });
      const file3 = new File(['c'], 'c.png', { type: 'image/png' });

      // Add 2 images to q1 (earlier question)
      await act(async () => {
        await result.current.addCameraImage('q1', file1);
      });
      await act(async () => {
        await result.current.addCameraImage('q1', file2);
      });
      // Add 1 image to q2 (later question)
      await act(async () => {
        await result.current.addCameraImage('q2', file3);
      });

      mockRemovePendingImage.mockClear();

      // Remove index 0 from q2 — flatIndex should be 2 (q1 has 2 images)
      act(() => result.current.removeCameraImage('q2', 0));

      expect(mockRemovePendingImage).toHaveBeenCalledWith(2);
      expect(result.current.cameraImagesFor('q2')).toEqual([]);
    });

    it('should count previous images with files when removing by index > 0', async () => {
      const { result } = setup();
      const file1 = new File(['a'], 'a.png', { type: 'image/png' });
      const file2 = new File(['b'], 'b.png', { type: 'image/png' });
      const file3 = new File(['c'], 'c.png', { type: 'image/png' });

      // Add 3 images to q1 (all with files)
      await act(async () => {
        await result.current.addCameraImage('q1', file1);
        await result.current.addCameraImage('q1', file2);
        await result.current.addCameraImage('q1', file3);
      });

      mockRemovePendingImage.mockClear();

      // Remove index 2 → loop increments flatIndex for i=0, i=1 (both have .file)
      // flatIndex ends at 2 → removePendingImage(2)
      act(() => result.current.removeCameraImage('q1', 2));

      expect(mockRemovePendingImage).toHaveBeenCalledWith(2);
      expect(result.current.cameraImagesFor('q1')).toHaveLength(2);
    });
  });

  describe('clearCameraImages', () => {
    it('should clear all images for a question', async () => {
      const { result } = setup();
      const file = new File(['test'], 'photo.png', { type: 'image/png' });

      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });

      act(() => result.current.clearCameraImages('q1'));
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
    });

    it('should re-add pending images for other questions when clearing one', async () => {
      const { result } = setup();
      const file1 = new File(['a'], 'a.png', { type: 'image/png' });
      const file2 = new File(['b'], 'b.png', { type: 'image/png' });

      // Add image to q1
      await act(async () => {
        await result.current.addCameraImage('q1', file1);
      });
      // Add image to q2
      await act(async () => {
        await result.current.addCameraImage('q2', file2);
      });

      mockClearPendingImages.mockClear();
      mockAddPendingImage.mockClear();

      // Clear only q1 — q2's image should be re-added to pending queue
      act(() => result.current.clearCameraImages('q1'));

      expect(mockClearPendingImages).toHaveBeenCalledTimes(1);
      // addPendingImage should be called for q2's remaining image
      expect(mockAddPendingImage).toHaveBeenCalledWith(file2, 'Section 1');
      // q1 images cleared, q2 images still there
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
      expect(result.current.cameraImagesFor('q2')).toHaveLength(1);
    });

    it('should fall back to "General exams" when remaining image belongs to unknown question', async () => {
      const { result } = setup();
      const file1 = new File(['a'], 'a.png', { type: 'image/png' });
      const file2 = new File(['b'], 'b.png', { type: 'image/png' });

      // Add image to a known question
      await act(async () => {
        await result.current.addCameraImage('q1', file1);
      });
      // Add image to an unknown question id
      await act(async () => {
        await result.current.addCameraImage('unknown-q', file2);
      });

      mockClearPendingImages.mockClear();
      mockAddPendingImage.mockClear();

      // Clear q1 — unknown-q's image remains and falls back to 'General exams'
      act(() => result.current.clearCameraImages('q1'));

      expect(mockAddPendingImage).toHaveBeenCalledWith(file2, 'General exams');
    });
  });

  // ── onProgressUpdate ───────────────────────────────────────────────────

  describe('onProgressUpdate', () => {
    it('should call onProgressUpdate with answered count when an answer is added', () => {
      const onProgress = vi.fn();
      const { result } = setup({ onProgressUpdate: onProgress });

      onProgress.mockClear();
      act(() => result.current.selectAndAdvance('q1-a'));
      expect(onProgress).toHaveBeenCalledWith(3, 1);
    });

    it('should call onProgressUpdate when totalQuestions changes', () => {
      const onProgress = vi.fn();
      const { result } = setup({ onProgressUpdate: onProgress });

      // Navigate to q3 and reveal q4
      act(() => result.current.selectAndAdvance('q1-a'));
      act(() => result.current.selectAndAdvance('q2-a'));

      onProgress.mockClear();
      act(() => result.current.selectAndAdvance('q3-a')); // reveals q4
      expect(onProgress).toHaveBeenCalledWith(4, 3);
    });

    it('should handle undefined onProgressUpdate', () => {
      expect(() => setup({ onProgressUpdate: undefined })).not.toThrow();
    });
  });

  // ── computeVisible (conditional questions) ─────────────────────────────

  describe('conditional visibility', () => {
    it('should hide questions whose showWhen condition is not met', () => {
      const { result } = setup();
      expect(result.current.visibleQuestions.find(q => q.id === 'q4')).toBeUndefined();
    });

    it('should show questions when showWhen condition is met', () => {
      const { result } = setup();

      // Answer q3 with q3-a (triggers q4 showWhen)
      act(() => result.current.selectAndAdvance('q1-a'));
      act(() => result.current.selectAndAdvance('q2-a'));
      act(() => result.current.selectAndAdvance('q3-a'));

      expect(result.current.visibleQuestions.find(q => q.id === 'q4')).toBeDefined();
      expect(result.current.visibleQuestions).toHaveLength(4);
    });

    it('should hide questions again when showWhen condition is removed', () => {
      const { result } = setup();

      // Answer q3 with q3-a → q4 visible
      act(() => result.current.selectAndAdvance('q1-a'));
      act(() => result.current.selectAndAdvance('q2-a'));
      act(() => result.current.selectAndAdvance('q3-a'));
      expect(result.current.visibleQuestions).toHaveLength(4);

      // Go back to q3 and change answer → q4 hidden
      act(() => result.current.goBack());
      act(() => result.current.selectAndAdvance('q3-b'));

      // After selecting q3-b, q4 is hidden again, and q3 is last → onNextQuestion called
      expect(result.current.visibleQuestions).toHaveLength(3);
    });
  });

  // ── goSkip clears camera images ────────────────────────────────────────

  describe('goSkip clears camera images', () => {
    it('should clear camera images when skipping a question', async () => {
      const { result } = setup();
      const file = new File(['test'], 'photo.png', { type: 'image/png' });

      // Add an image for q1
      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });
      expect(result.current.cameraImagesFor('q1')).toHaveLength(1);

      // Skip q1 — should clear images
      act(() => result.current.goSkip());
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
    });
  });

  // ── obs.service integration ─────────────────────────────────────────────

  describe('obs.service pending image integration', () => {
    it('should call addPendingImage when addCameraImage is called', async () => {
      const { result } = setup();
      const file = new File(['test'], 'photo.png', { type: 'image/png' });

      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });

      expect(mockAddPendingImage).toHaveBeenCalledWith(file, 'Section 1');
    });

    it('should use sectionLabel as comment with trailing colon stripped', async () => {
      const { result } = setup();
      const file = new File(['test'], 'photo.png', { type: 'image/png' });

      // q3 has sectionLabel 'Section 2:'
      act(() => result.current.goNext()); // q2
      act(() => result.current.goNext()); // q3

      await act(async () => {
        await result.current.addCameraImage('q3', file);
      });

      expect(mockAddPendingImage).toHaveBeenCalledWith(file, 'Section 2');
    });

    it('should fall back to "General exams" when question not found', async () => {
      const { result } = setup();
      const file = new File(['test'], 'photo.png', { type: 'image/png' });

      await act(async () => {
        await result.current.addCameraImage('nonexistent', file);
      });

      expect(mockAddPendingImage).toHaveBeenCalledWith(file, 'General exams');
    });

    it('should call removePendingImage when removeCameraImage is called', async () => {
      const { result } = setup();
      const file = new File(['test'], 'photo.png', { type: 'image/png' });

      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });

      act(() => result.current.removeCameraImage('q1', 0));

      expect(mockRemovePendingImage).toHaveBeenCalled();
    });

    it('should call clearPendingImages when clearCameraImages is called', async () => {
      const { result } = setup();
      const file = new File(['test'], 'photo.png', { type: 'image/png' });

      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });

      act(() => result.current.clearCameraImages('q1'));

      expect(mockClearPendingImages).toHaveBeenCalled();
    });

    it('should call clearPendingImages when goSkip clears images', async () => {
      const { result } = setup();
      const file = new File(['test'], 'photo.png', { type: 'image/png' });

      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });

      mockClearPendingImages.mockClear();
      act(() => result.current.goSkip());

      expect(mockClearPendingImages).toHaveBeenCalled();
    });
  });

  // ── Temp-storage: initialAnswers restore ─────────────────────────────

  describe('initialAnswers restore', () => {
    it('should initialize answers from initialAnswers', () => {
      const initialAnswers = { q1: ['q1-a'], q2: ['q2-a'] };
      const { result } = setup({ initialAnswers });
      expect(result.current.answers).toEqual(initialAnswers);
    });

    it('should compute internalIndex to last answered + 1', () => {
      const initialAnswers = { q1: ['q1-a'], q2: ['q2-a'] };
      const { result } = setup({ initialAnswers });
      // q1 answered (index 0), q2 answered (index 1) → internalIndex = 2 (q3)
      expect(result.current.internalIndex).toBe(2);
    });

    it('should clamp internalIndex to last question when all answered', () => {
      const initialAnswers = { q1: ['q1-a'], q2: ['q2-a'], q3: ['q3-b'] };
      const { result } = setup({ initialAnswers });
      // All 3 visible questions answered → internalIndex = 2 (last)
      expect(result.current.internalIndex).toBe(2);
    });

    it('should start at 0 when initialAnswers is empty', () => {
      const { result } = setup({ initialAnswers: {} });
      expect(result.current.internalIndex).toBe(0);
    });

    it('should return correct selectedOptionsFor with restored answers', () => {
      const initialAnswers = { q1: ['q1-b'] };
      const { result } = setup({ initialAnswers });
      expect(result.current.selectedOptionsFor('q1')).toEqual(['q1-b']);
      expect(result.current.selectedOptionsFor('q2')).toEqual([]);
    });

    it('should start at 0 when initialAnswers has keys but all arrays are empty', () => {
      // Triggers `lastAnswered < 0` → `: 0` branch in the ternary
      const { result } = setup({
        initialAnswers: { q1: [], q2: [], q3: [] },
      });
      expect(result.current.internalIndex).toBe(0);
    });
  });

  // ── Branch coverage for selectSingle: answers[id] ?? [] fallback ─────

  describe('selectSingle branch coverage', () => {
    it('should handle selectSingle when answers for the question are undefined', () => {
      // No prior answers → answers[targetQuestionId] is undefined → `?? []` kicks in
      const { result } = setup();

      act(() => result.current.selectSingle('q1-a', 'q1'));

      expect(result.current.selectedOptionsFor('q1')).toEqual(['q1-a']);
    });
  });

  // ── Branch coverage for addCameraImage createdBy fallbacks ───────────

  describe('addCameraImage createdBy fallbacks', () => {
    it('should use fallback createdBy when parsed user has no uuid', async () => {
      const { storage } = await import('../../../../utils/storage');
      vi.mocked(storage.getUser).mockReturnValue('{"name":"no-uuid"}');

      const { result } = setup();
      const file = new File(['x'], 'x.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });

      expect(mockUpsertAssetResource).toHaveBeenCalledWith(
        file,
        expect.objectContaining({ created_by: '{"name":"no-uuid"}' })
      );
    });

    it('should use fallback createdBy when JSON.parse throws', async () => {
      const { storage } = await import('../../../../utils/storage');
      vi.mocked(storage.getUser).mockReturnValue('not-valid-json{{');

      const { result } = setup();
      const file = new File(['x'], 'x.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });

      expect(mockUpsertAssetResource).toHaveBeenCalledWith(
        file,
        expect.objectContaining({ created_by: 'unknown' })
      );
    });

    it('should use fallback createdBy when storage.getUser returns null', async () => {
      const { storage } = await import('../../../../utils/storage');
      vi.mocked(storage.getUser).mockReturnValue(null);

      const { result } = setup();
      const file = new File(['x'], 'x.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });

      expect(mockUpsertAssetResource).toHaveBeenCalledWith(
        file,
        expect.objectContaining({ created_by: 'unknown' })
      );
    });
  });

  // ── Temp-storage: image upload on capture ────────────────────────────

  describe('temp-storage image upload', () => {
    it('should upload image as asset to temp-storage when captured', async () => {
      const { result } = setup();
      const file = new File(['img'], 'pic.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });

      expect(mockUpsertAssetResource).toHaveBeenCalledWith(
        file,
        expect.objectContaining({
          parent_type: 'visit',
          parent_id: 'test-visit-id',
          data: { questionId: 'q1' },
        })
      );
    });

    it('should still add to local state even if asset upload fails', async () => {
      mockUpsertAssetResource.mockRejectedValueOnce(new Error('Upload failed'));
      const { result } = setup();
      const file = new File(['img'], 'pic.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.addCameraImage('q1', file);
      });

      expect(result.current.cameraImagesFor('q1')).toHaveLength(1);
    });
  });

  // ── Temp-storage: image restore from assets ──────────────────────────

  describe('temp-storage image restore', () => {
    it('should fetch and restore camera images from child assets on init', async () => {
      mockGetChildResources.mockResolvedValueOnce({
        data: [
          { id: 10, data: { questionId: 'q1' }, file_path: 'https://s3.example.com/img1.jpg' },
          { id: 11, data: { questionId: 'q2' }, file_path: 'https://s3.example.com/img2.jpg' },
        ],
      });

      const initialAnswers = { q1: ['q1-a'] };
      const { result } = setup({ initialAnswers });

      // Wait for async restore
      await act(async () => {
        await new Promise(r => setTimeout(r, 50));
      });

      expect(mockGetChildResources).toHaveBeenCalledWith('visit', 'test-visit-id', 'asset');
      expect(result.current.cameraImagesFor('q1')).toEqual(['https://s3.example.com/img1.jpg']);
      expect(result.current.cameraImagesFor('q2')).toEqual(['https://s3.example.com/img2.jpg']);
    });

    it('should not fetch assets when no initialAnswers', () => {
      setup();
      expect(mockGetChildResources).not.toHaveBeenCalled();
    });

    it('should handle asset fetch failure gracefully', async () => {
      mockGetChildResources.mockRejectedValueOnce(new Error('Network error'));

      const initialAnswers = { q1: ['q1-a'] };
      const { result } = setup({ initialAnswers });

      await act(async () => {
        await new Promise(r => setTimeout(r, 50));
      });

      // Should not crash, images just empty
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
    });

    it('should skip records missing questionId or file_path', async () => {
      mockGetChildResources.mockResolvedValueOnce({
        data: [
          { id: 1, data: {}, file_path: 'https://s3/a.jpg' }, // missing questionId
          { id: 2, data: { questionId: 'q1' }, file_path: null }, // missing file_path
          { id: 3, data: { questionId: 'q2' }, file_path: 'https://s3/c.jpg' }, // valid
        ],
      });

      const initialAnswers = { q1: ['q1-a'] };
      const { result } = setup({ initialAnswers });

      await act(async () => {
        await new Promise(r => setTimeout(r, 50));
      });

      // Only q2 gets the valid image; q1 has none (file_path was null)
      expect(result.current.cameraImagesFor('q1')).toEqual([]);
      expect(result.current.cameraImagesFor('q2')).toEqual(['https://s3/c.jpg']);
    });
  });
});
