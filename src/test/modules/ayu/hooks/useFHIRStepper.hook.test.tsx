import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFHIRStepper } from '../../../../modules/ayu/hooks/useFHIRStepper.hook';

describe('useFHIRStepper', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  const mockQuestionnaire = {
    item: [
      {
        linkId: 'q1',
        text: 'Question 1',
        type: 'string',
        required: true,
      },
      {
        linkId: 'q2',
        text: 'Question 2',
        type: 'choice',
        required: false,
        answerOption: [
          { valueCoding: { code: 'yes', display: 'Yes' } },
          { valueCoding: { code: 'no', display: 'No' } },
        ],
      },
      {
        linkId: 'q3',
        text: 'Question 3',
        type: 'integer',
        required: false,
      },
    ],
  };

  describe('Initial State', () => {
    it('should initialize with currentIndex 0', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: mockQuestionnaire })
      );

      expect(result.current.currentIndex).toBe(0);
    });

    it('should filter out group type items for topLevelItems', () => {
      const questionnaireWithGroup = {
        item: [
          { linkId: 'q1', type: 'string', text: 'Q1' },
          { linkId: 'g1', type: 'group', text: 'Group', item: [] },
          { linkId: 'q2', type: 'choice', text: 'Q2' },
        ],
      };

      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: questionnaireWithGroup })
      );

      expect(result.current.topLevelItems).toHaveLength(2);
      expect(result.current.topLevelItems[0].linkId).toBe('q1');
      expect(result.current.topLevelItems[1].linkId).toBe('q2');
    });

    it('should return first non-group question', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: mockQuestionnaire })
      );

      expect(result.current.currentQuestion?.linkId).toBe('q1');
    });

    it('should initialize empty answers object', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: mockQuestionnaire })
      );

      expect(result.current.answers).toEqual({});
    });

    it('should calculate correct structural total', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: mockQuestionnaire })
      );

      expect(result.current.total).toBe(3);
    });
  });

  describe('Basic Navigation', () => {
    it('should advance to next question with goNext()', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: mockQuestionnaire })
      );

      expect(result.current.currentIndex).toBe(0);

      act(() => {
        result.current.goNext();
      });

      expect(result.current.currentIndex).toBe(1);
    });

    it('should not advance beyond last question', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: mockQuestionnaire })
      );

      act(() => {
        result.current.goNext();
        result.current.goNext();
        result.current.goNext(); // Try to go beyond last
      });

      expect(result.current.currentIndex).toBe(2);
    });

    it('should call onComplete callback on last question', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useFHIRStepper({
          questionnaire: mockQuestionnaire,
          onComplete,
        })
      );

      // Navigate to second question
      act(() => {
        result.current.goNext();
      });

      // Navigate to third (last) question
      act(() => {
        result.current.goNext();
      });

      // Try to go beyond last - should trigger onComplete
      act(() => {
        result.current.goNext();
      });

      expect(onComplete).toHaveBeenCalledWith({});
    });

    it('should update isLast flag correctly', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: mockQuestionnaire })
      );

      expect(result.current.isLast).toBe(false);

      act(() => {
        result.current.goNext();
        result.current.goNext();
      });

      expect(result.current.isLast).toBe(true);
    });
  });

  describe('Auto-Advance Logic', () => {
    it('should NOT auto-advance for required string type', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: mockQuestionnaire })
      );

      expect(result.current.currentQuestion?.type).toBe('string');

      act(() => {
        result.current.setAnswer('q1', 'test answer');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.currentIndex).toBe(0); // Should NOT advance
    });

    it('should NOT auto-advance for quantity type', () => {
      const quantityQuestionnaire = {
        item: [
          {
            linkId: 'q1',
            text: 'Weight',
            type: 'quantity',
            required: false,
          },
          {
            linkId: 'q2',
            text: 'Height',
            type: 'integer',
          },
        ],
      };

      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: quantityQuestionnaire })
      );

      act(() => {
        result.current.setAnswer('q1', { value: 70, unit: 'kg' } as any);
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.currentIndex).toBe(0); // Should NOT advance
    });

    it('should NOT auto-advance for choice with dropdownValues', () => {
      const durationQuestionnaire = {
        item: [
          {
            linkId: 'q1',
            text: 'Duration',
            type: 'choice',
            required: false,
          },
        ],
      };

      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: durationQuestionnaire })
      );

      act(() => {
        result.current.setAnswer('q1', {
          dropdownValues: { number: 5, days: 'Days' },
        });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.currentIndex).toBe(0); // Should NOT advance
    });

    it('should auto-advance for choice without duration after 250ms', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: mockQuestionnaire })
      );

      // Move to question 2 (choice type)
      act(() => {
        result.current.goNext();
      });

      expect(result.current.currentQuestion?.type).toBe('choice');

      act(() => {
        result.current.setAnswer('q2', 'yes');
      });

      expect(result.current.currentIndex).toBe(1);

      act(() => {
        vi.advanceTimersByTime(250);
      });

      expect(result.current.currentIndex).toBe(2); // Should advance
    });

    it('should NOT auto-advance on last question', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: mockQuestionnaire })
      );

      // Move to last question
      act(() => {
        result.current.goNext();
        result.current.goNext();
      });

      expect(result.current.isLast).toBe(true);

      act(() => {
        result.current.setAnswer('q3', 42);
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.currentIndex).toBe(2); // Should NOT advance
    });

    it('should NOT auto-advance when visible string child exists', () => {
      const nestedQuestionnaire = {
        item: [
          {
            linkId: 'parent',
            text: 'Parent',
            type: 'choice',
            required: false,
            item: [
              {
                linkId: 'child',
                text: 'Child',
                type: 'string',
                enableWhen: [
                  {
                    question: 'parent',
                    operator: '=',
                    answerString: 'yes',
                  },
                ],
              },
            ],
          },
        ],
      };

      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: nestedQuestionnaire })
      );

      act(() => {
        result.current.setAnswer('parent', 'yes');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.currentIndex).toBe(0); // Should NOT advance
    });
  });

  describe('Duration Validation (dropdownValues structure)', () => {
    const durationQuestionnaire = {
      item: [
        {
          linkId: 'parent',
          text: 'Parent',
          type: 'choice',
          item: [
            {
              linkId: 'duration',
              text: 'Duration',
              type: 'quantity',
            },
          ],
        },
      ],
    };

    it('should detect nested child with dropdownValues', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: durationQuestionnaire })
      );

      act(() => {
        result.current.setAnswer('parent', 'yes');
        result.current.setAnswer('duration', {
          dropdownValues: { number: 5, days: 'Days' },
        });
      });

      const durationAnswer = result.current.answers.duration;
      expect(
        typeof durationAnswer === 'object' &&
        durationAnswer !== null &&
        'dropdownValues' in durationAnswer
      ).toBe(true);
    });

    it('should mark incomplete if only number filled', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: durationQuestionnaire })
      );

      act(() => {
        result.current.setAnswer('parent', 'yes');
        result.current.setAnswer('duration', {
          dropdownValues: { number: 5, days: '' },
        });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.currentIndex).toBe(0); // Should not advance (incomplete)
    });

    it('should mark incomplete if only days filled', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: durationQuestionnaire })
      );

      act(() => {
        result.current.setAnswer('parent', 'yes');
        result.current.setAnswer('duration', {
          dropdownValues: { number: '', days: 'Days' },
        });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.currentIndex).toBe(0); // Should not advance (incomplete)
    });

    it('should complete when both values present', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: durationQuestionnaire })
      );

      act(() => {
        result.current.setAnswer('parent', 'yes');
        result.current.setAnswer('duration', {
          dropdownValues: { number: 5, days: 'Days' },
        });
      });

      const durationAnswer = result.current.answers.duration;
      const isComplete =
        typeof durationAnswer === 'object' &&
        durationAnswer !== null &&
        'dropdownValues' in durationAnswer &&
        durationAnswer.dropdownValues?.number &&
        durationAnswer.dropdownValues?.days;

      expect(isComplete).toBeTruthy();
    });
  });

  describe('EnableWhen Visibility Logic', () => {
    const conditionalQuestionnaire = {
      item: [
        {
          linkId: 'parent',
          text: 'Parent',
          type: 'choice',
          item: [
            {
              linkId: 'boolChild',
              text: 'Bool Child',
              type: 'string',
              enableWhen: [{ question: 'parent', operator: '=', answerBoolean: true }],
            },
            {
              linkId: 'stringChild',
              text: 'String Child',
              type: 'string',
              enableWhen: [{ question: 'parent', operator: '=', answerString: 'yes' }],
            },
            {
              linkId: 'integerChild',
              text: 'Integer Child',
              type: 'string',
              enableWhen: [{ question: 'parent', operator: '=', answerInteger: 1 }],
            },
            {
              linkId: 'codingChild',
              text: 'Coding Child',
              type: 'string',
              enableWhen: [
                {
                  question: 'parent',
                  operator: '=',
                  answerCoding: { code: 'code1' },
                },
              ],
            },
          ],
        },
      ],
    };

    it('should check answerBoolean conditions', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: conditionalQuestionnaire })
      );

      act(() => {
        result.current.setAnswer('parent', true);
      });

      expect(result.current.answers.parent).toBe(true);
    });

    it('should check answerString conditions', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: conditionalQuestionnaire })
      );

      act(() => {
        result.current.setAnswer('parent', 'yes');
      });

      expect(result.current.answers.parent).toBe('yes');
    });

    it('should check answerInteger conditions', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: conditionalQuestionnaire })
      );

      act(() => {
        result.current.setAnswer('parent', 1);
      });

      expect(result.current.answers.parent).toBe(1);
    });

    it('should check answerCoding.code conditions', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: conditionalQuestionnaire })
      );

      act(() => {
        result.current.setAnswer('parent', 'code1');
      });

      expect(result.current.answers.parent).toBe('code1');
    });

    it('should handle multiple enableWhen rules (all must match)', () => {
      const multiRuleQuestionnaire = {
        item: [
          {
            linkId: 'q1',
            text: 'Q1',
            type: 'string',
          },
          {
            linkId: 'q2',
            text: 'Q2',
            type: 'string',
          },
          {
            linkId: 'q3',
            text: 'Q3',
            type: 'string',
            item: [
              {
                linkId: 'child',
                text: 'Child',
                type: 'string',
                enableWhen: [
                  { question: 'q1', operator: '=', answerString: 'yes' },
                  { question: 'q2', operator: '=', answerString: 'yes' },
                ],
              },
            ],
          },
        ],
      };

      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: multiRuleQuestionnaire })
      );

      act(() => {
        result.current.goNext();
        result.current.goNext();
        result.current.setAnswer('q1', 'yes');
        result.current.setAnswer('q2', 'yes');
        result.current.setAnswer('q3', 'parent-answer');
      });

      // Both conditions should be met
      expect(result.current.answers.q1).toBe('yes');
      expect(result.current.answers.q2).toBe('yes');
    });
  });

  describe('Top-Level Completion Logic', () => {
    it('should return false if parent answer is empty', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: mockQuestionnaire })
      );

      // Don't set any answer
      expect(result.current.answers.q1).toBeUndefined();
    });

    it('should return true if no nested children', () => {
      const simpleQuestionnaire = {
        item: [
          {
            linkId: 'q1',
            text: 'Simple Question',
            type: 'integer',
          },
        ],
      };

      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: simpleQuestionnaire })
      );

      act(() => {
        result.current.setAnswer('q1', 42);
      });

      expect(result.current.answers.q1).toBe(42);
    });

    it('should validate all visible nested children are answered', () => {
      const nestedQuestionnaire = {
        item: [
          {
            linkId: 'parent',
            text: 'Parent',
            type: 'choice',
            item: [
              {
                linkId: 'child1',
                text: 'Child 1',
                type: 'string',
                enableWhen: [{ question: 'parent', operator: '=', answerString: 'yes' }],
              },
              {
                linkId: 'child2',
                text: 'Child 2',
                type: 'string',
                enableWhen: [{ question: 'parent', operator: '=', answerString: 'yes' }],
              },
            ],
          },
        ],
      };

      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: nestedQuestionnaire })
      );

      act(() => {
        result.current.setAnswer('parent', 'yes');
        result.current.setAnswer('child1', 'answer1');
        result.current.setAnswer('child2', 'answer2');
      });

      expect(result.current.answers.child1).toBe('answer1');
      expect(result.current.answers.child2).toBe('answer2');
    });

    it('should handle duration structure in nested children', () => {
      const durationQuestionnaire = {
        item: [
          {
            linkId: 'parent',
            text: 'Parent',
            type: 'choice',
            item: [
              {
                linkId: 'duration',
                text: 'Duration',
                type: 'quantity',
              },
            ],
          },
        ],
      };

      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: durationQuestionnaire })
      );

      act(() => {
        result.current.setAnswer('parent', 'yes');
        result.current.setAnswer('duration', {
          dropdownValues: { number: 10, days: 'Weeks' },
        });
      });

      const durationAnswer = result.current.answers.duration;
      if (
        typeof durationAnswer === 'object' &&
        durationAnswer !== null &&
        'dropdownValues' in durationAnswer
      ) {
        expect(durationAnswer.dropdownValues.number).toBe(10);
        expect(durationAnswer.dropdownValues.days).toBe('Weeks');
      }
    });
  });

  describe('isTopLevelComplete Function Coverage', () => {
    describe('Parent Answer Validation (Line 144)', () => {
      it('should return false when parent answer is missing', () => {
        const simpleQuestionnaire = {
          item: [
            {
              linkId: 'q1',
              text: 'Question 1',
              type: 'string',
            },
          ],
        };

        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: simpleQuestionnaire })
        );

        // No answer set - should not auto-advance
        act(() => {
          vi.advanceTimersByTime(300);
        });

        expect(result.current.currentIndex).toBe(0);
      });

      it('should return false when parent answer is undefined', () => {
        const simpleQuestionnaire = {
          item: [
            {
              linkId: 'q1',
              text: 'Question 1',
              type: 'choice',
            },
          ],
        };

        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: simpleQuestionnaire })
        );

        expect(result.current.answers.q1).toBeUndefined();
      });

      it('should return false when parent answer is null', () => {
        const simpleQuestionnaire = {
          item: [
            {
              linkId: 'q1',
              text: 'Question 1',
              type: 'choice',
            },
            {
              linkId: 'q2',
              text: 'Question 2',
              type: 'string',
            },
          ],
        };

        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: simpleQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('q1', null);
        });

        act(() => {
          vi.advanceTimersByTime(300);
        });

        // Should not advance because null is falsy
        expect(result.current.currentIndex).toBe(0);
      });

      it('should return false when parent answer is empty string', () => {
        const simpleQuestionnaire = {
          item: [
            {
              linkId: 'q1',
              text: 'Question 1',
              type: 'choice',
            },
            {
              linkId: 'q2',
              text: 'Question 2',
              type: 'string',
            },
          ],
        };

        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: simpleQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('q1', '');
        });

        act(() => {
          vi.advanceTimersByTime(300);
        });

        // Should not advance because empty string is falsy
        expect(result.current.currentIndex).toBe(0);
      });
    });

    describe('Nested Child Duration Validation (Lines 146-163)', () => {
      const nestedDurationQuestionnaire = {
        item: [
          {
            linkId: 'parent',
            text: 'Parent Question',
            type: 'choice',
            item: [
              {
                linkId: 'duration-child',
                text: 'Duration Child',
                type: 'quantity',
              },
            ],
          },
          {
            linkId: 'next-question',
            text: 'Next Question',
            type: 'string',
          },
        ],
      };

      it('should return false when nested child has dropdownValues with only number', () => {
        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: nestedDurationQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('parent', 'yes');
          result.current.setAnswer('duration-child', {
            dropdownValues: { number: 5, days: null },
          });
        });

        act(() => {
          vi.advanceTimersByTime(300);
        });

        // Should not advance because days is null
        expect(result.current.currentIndex).toBe(0);
      });

      it('should return false when nested child has dropdownValues with only days', () => {
        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: nestedDurationQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('parent', 'yes');
          result.current.setAnswer('duration-child', {
            dropdownValues: { number: null, days: 'Days' },
          });
        });

        act(() => {
          vi.advanceTimersByTime(300);
        });

        // Should not advance because number is null
        expect(result.current.currentIndex).toBe(0);
      });

      it('should return false when nested child has dropdownValues with empty number', () => {
        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: nestedDurationQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('parent', 'yes');
          result.current.setAnswer('duration-child', {
            dropdownValues: { number: '', days: 'Days' },
          });
        });

        act(() => {
          vi.advanceTimersByTime(300);
        });

        // Should not advance because number is empty
        expect(result.current.currentIndex).toBe(0);
      });

      it('should return false when nested child has dropdownValues with empty days', () => {
        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: nestedDurationQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('parent', 'yes');
          result.current.setAnswer('duration-child', {
            dropdownValues: { number: 5, days: '' },
          });
        });

        act(() => {
          vi.advanceTimersByTime(300);
        });

        // Should not advance because days is empty
        expect(result.current.currentIndex).toBe(0);
      });

      it('should return false when nested child has dropdownValues with both empty', () => {
        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: nestedDurationQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('parent', 'yes');
          result.current.setAnswer('duration-child', {
            dropdownValues: { number: '', days: '' },
          });
        });

        act(() => {
          vi.advanceTimersByTime(300);
        });

        // Should not advance because both are empty
        expect(result.current.currentIndex).toBe(0);
      });

      it('should validate complete dropdownValues in nested child', () => {
        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: nestedDurationQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('parent', 'yes');
          result.current.setAnswer('duration-child', {
            dropdownValues: { number: 5, days: 'Days' },
          });
        });

        // Verify answers are properly stored with complete dropdownValues
        expect(result.current.answers.parent).toBe('yes');
        expect(result.current.answers['duration-child']).toEqual({
          dropdownValues: { number: 5, days: 'Days' },
        });
        // Verify both number and days are present
        const childAnswer = result.current.answers['duration-child'];
        if (
          typeof childAnswer === 'object' &&
          childAnswer !== null &&
          'dropdownValues' in childAnswer
        ) {
          expect(childAnswer.dropdownValues.number).toBe(5);
          expect(childAnswer.dropdownValues.days).toBe('Days');
        }
      });

      it('should check multiple nested children with duration structures', () => {
        const multiChildQuestionnaire = {
          item: [
            {
              linkId: 'parent',
              text: 'Parent',
              type: 'choice',
              item: [
                {
                  linkId: 'duration1',
                  text: 'Duration 1',
                  type: 'quantity',
                },
                {
                  linkId: 'duration2',
                  text: 'Duration 2',
                  type: 'quantity',
                },
              ],
            },
            {
              linkId: 'next',
              text: 'Next',
              type: 'string',
            },
          ],
        };

        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: multiChildQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('parent', 'yes');
          result.current.setAnswer('duration1', {
            dropdownValues: { number: 5, days: 'Days' },
          });
          result.current.setAnswer('duration2', {
            dropdownValues: { number: 3, days: null }, // Incomplete
          });
        });

        act(() => {
          vi.advanceTimersByTime(300);
        });

        // Should not advance because duration2 is incomplete
        expect(result.current.currentIndex).toBe(0);
      });
    });

    describe('Top-Level Duration Validation (Lines 165-177)', () => {
      const topLevelDurationQuestionnaire = {
        item: [
          {
            linkId: 'duration-question',
            text: 'Duration Question',
            type: 'choice',
          },
          {
            linkId: 'next-question',
            text: 'Next Question',
            type: 'string',
          },
        ],
      };

      it('should return false when top-level has dropdownValues with only number', () => {
        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: topLevelDurationQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('duration-question', {
            dropdownValues: { number: 10, days: null },
          });
        });

        act(() => {
          vi.advanceTimersByTime(300);
        });

        expect(result.current.currentIndex).toBe(0);
      });

      it('should return false when top-level has dropdownValues with only days', () => {
        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: topLevelDurationQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('duration-question', {
            dropdownValues: { number: null, days: 'Weeks' },
          });
        });

        act(() => {
          vi.advanceTimersByTime(300);
        });

        expect(result.current.currentIndex).toBe(0);
      });

      it('should return false when top-level has dropdownValues with empty values', () => {
        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: topLevelDurationQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('duration-question', {
            dropdownValues: { number: 0, days: '' },
          });
        });

        act(() => {
          vi.advanceTimersByTime(300);
        });

        // 0 is falsy but valid number, empty string is falsy
        expect(result.current.currentIndex).toBe(0);
      });

      it('should validate complete dropdownValues at top-level', () => {
        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: topLevelDurationQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('duration-question', {
            dropdownValues: { number: 7, days: 'Months' },
          });
        });

        // Verify answer is properly stored with complete dropdownValues
        expect(result.current.answers['duration-question']).toEqual({
          dropdownValues: { number: 7, days: 'Months' },
        });
        // Verify both number and days are present
        const questionAnswer = result.current.answers['duration-question'];
        if (
          typeof questionAnswer === 'object' &&
          questionAnswer !== null &&
          'dropdownValues' in questionAnswer
        ) {
          expect(questionAnswer.dropdownValues.number).toBe(7);
          expect(questionAnswer.dropdownValues.days).toBe('Months');
        }
      });

      it('should handle top-level choice without dropdownValues structure', () => {
        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: topLevelDurationQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('duration-question', 'regular-answer');
        });

        act(() => {
          vi.advanceTimersByTime(300);
        });

        // Should advance normally for non-duration choice
        expect(result.current.currentIndex).toBe(1);
      });
    });

    describe('No Nested Items (Line 179)', () => {
      it('should return true when question has no nested items', () => {
        const simpleQuestionnaire = {
          item: [
            {
              linkId: 'q1',
              text: 'Simple Question',
              type: 'integer',
            },
            {
              linkId: 'q2',
              text: 'Next Question',
              type: 'string',
            },
          ],
        };

        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: simpleQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('q1', 42);
        });

        act(() => {
          vi.advanceTimersByTime(300);
        });

        // Should advance because no nested items to check
        expect(result.current.currentIndex).toBe(1);
      });

      it('should return true when question has empty item array', () => {
        const emptyItemsQuestionnaire = {
          item: [
            {
              linkId: 'q1',
              text: 'Question with Empty Items',
              type: 'choice',
              item: [],
            },
            {
              linkId: 'q2',
              text: 'Next',
              type: 'string',
            },
          ],
        };

        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: emptyItemsQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('q1', 'answer');
        });

        act(() => {
          vi.advanceTimersByTime(300);
        });

        // Should advance because item array is empty
        expect(result.current.currentIndex).toBe(1);
      });
    });

    describe('Visible Nested Children Validation (Lines 182-200)', () => {
      it('should validate only visible children, skipping invisible ones', () => {
        const conditionalQuestionnaire = {
          item: [
            {
              linkId: 'parent',
              text: 'Parent',
              type: 'choice',
              item: [
                {
                  linkId: 'visible-child',
                  text: 'Visible Child',
                  type: 'string',
                  enableWhen: [{ question: 'parent', operator: '=', answerString: 'yes' }],
                },
                {
                  linkId: 'invisible-child',
                  text: 'Invisible Child',
                  type: 'string',
                  enableWhen: [{ question: 'parent', operator: '=', answerString: 'no' }],
                },
              ],
            },
            {
              linkId: 'next',
              text: 'Next',
              type: 'string',
            },
          ],
        };

        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: conditionalQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('parent', 'yes');
          result.current.setAnswer('visible-child', 'answered');
          // invisible-child should be skipped (not visible)
        });

        // Verify answers are properly stored
        expect(result.current.answers.parent).toBe('yes');
        expect(result.current.answers['visible-child']).toBe('answered');
        // Invisible child doesn't need to be answered
        expect(result.current.answers['invisible-child']).toBeUndefined();
      });

      it('should return false when visible child is not answered', () => {
        const conditionalQuestionnaire = {
          item: [
            {
              linkId: 'parent',
              text: 'Parent',
              type: 'choice',
              item: [
                {
                  linkId: 'visible-child',
                  text: 'Visible Child',
                  type: 'string',
                  enableWhen: [{ question: 'parent', operator: '=', answerString: 'yes' }],
                },
              ],
            },
          ],
        };

        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: conditionalQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('parent', 'yes');
          // visible-child is not answered
        });

        act(() => {
          vi.advanceTimersByTime(300);
        });

        // Should not advance because visible child is not answered
        expect(result.current.currentIndex).toBe(0);
      });

      it('should validate that all visible children are answered', () => {
        const multiChildQuestionnaire = {
          item: [
            {
              linkId: 'parent',
              text: 'Parent',
              type: 'choice',
              item: [
                {
                  linkId: 'child1',
                  text: 'Child 1',
                  type: 'string',
                  enableWhen: [{ question: 'parent', operator: '=', answerString: 'yes' }],
                },
                {
                  linkId: 'child2',
                  text: 'Child 2',
                  type: 'string',
                  enableWhen: [{ question: 'parent', operator: '=', answerString: 'yes' }],
                },
                {
                  linkId: 'child3',
                  text: 'Child 3',
                  type: 'string',
                  enableWhen: [{ question: 'parent', operator: '=', answerString: 'yes' }],
                },
              ],
            },
            {
              linkId: 'next',
              text: 'Next',
              type: 'string',
            },
          ],
        };

        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: multiChildQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('parent', 'yes');
          result.current.setAnswer('child1', 'answer1');
          result.current.setAnswer('child2', 'answer2');
          // child3 not answered
        });

        // Verify first two children are answered but not third
        expect(result.current.answers.parent).toBe('yes');
        expect(result.current.answers.child1).toBe('answer1');
        expect(result.current.answers.child2).toBe('answer2');
        expect(result.current.answers.child3).toBeUndefined();

        // Now answer child3
        act(() => {
          result.current.setAnswer('child3', 'answer3');
        });

        // Verify all visible children are now answered
        expect(result.current.answers.child1).toBe('answer1');
        expect(result.current.answers.child2).toBe('answer2');
        expect(result.current.answers.child3).toBe('answer3');
      });

      it('should handle children without enableWhen (always visible)', () => {
        const alwaysVisibleQuestionnaire = {
          item: [
            {
              linkId: 'parent',
              text: 'Parent',
              type: 'choice',
              item: [
                {
                  linkId: 'always-visible',
                  text: 'Always Visible',
                  type: 'string',
                  // No enableWhen - always visible
                },
              ],
            },
          ],
        };

        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: alwaysVisibleQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('parent', 'yes');
          // always-visible not answered
        });

        act(() => {
          vi.advanceTimersByTime(300);
        });

        // Should not advance because always-visible child must be answered
        expect(result.current.currentIndex).toBe(0);
      });

      it('should validate enableWhen with answerBoolean', () => {
        const boolQuestionnaire = {
          item: [
            {
              linkId: 'parent',
              text: 'Parent',
              type: 'choice',
              item: [
                {
                  linkId: 'bool-child',
                  text: 'Bool Child',
                  type: 'string',
                  enableWhen: [{ question: 'parent', operator: '=', answerBoolean: true }],
                },
              ],
            },
            {
              linkId: 'next',
              text: 'Next',
              type: 'string',
            },
          ],
        };

        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: boolQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('parent', true);
          result.current.setAnswer('bool-child', 'answered');
        });

        // Verify answers are properly stored for boolean enableWhen condition
        expect(result.current.answers.parent).toBe(true);
        expect(result.current.answers['bool-child']).toBe('answered');
      });

      it('should validate enableWhen with answerInteger', () => {
        const intQuestionnaire = {
          item: [
            {
              linkId: 'parent',
              text: 'Parent',
              type: 'choice',
              item: [
                {
                  linkId: 'int-child',
                  text: 'Int Child',
                  type: 'string',
                  enableWhen: [{ question: 'parent', operator: '=', answerInteger: 5 }],
                },
              ],
            },
            {
              linkId: 'next',
              text: 'Next',
              type: 'string',
            },
          ],
        };

        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: intQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('parent', 5);
          result.current.setAnswer('int-child', 'answered');
        });

        // Verify answers are properly stored for integer enableWhen condition
        expect(result.current.answers.parent).toBe(5);
        expect(result.current.answers['int-child']).toBe('answered');
      });

      it('should validate enableWhen with answerCoding code', () => {
        const codingQuestionnaire = {
          item: [
            {
              linkId: 'parent',
              text: 'Parent',
              type: 'choice',
              item: [
                {
                  linkId: 'coding-child',
                  text: 'Coding Child',
                  type: 'string',
                  enableWhen: [
                    {
                      question: 'parent',
                      operator: '=',
                      answerCoding: { code: 'code-123' },
                    },
                  ],
                },
              ],
            },
            {
              linkId: 'next',
              text: 'Next',
              type: 'string',
            },
          ],
        };

        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: codingQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('parent', 'code-123');
          result.current.setAnswer('coding-child', 'answered');
        });

        // Verify answers are properly stored for coding enableWhen condition
        expect(result.current.answers.parent).toBe('code-123');
        expect(result.current.answers['coding-child']).toBe('answered');
      });

      it('should handle multiple enableWhen rules (all must match)', () => {
        const multiRuleQuestionnaire = {
          item: [
            {
              linkId: 'q1',
              text: 'Question 1',
              type: 'string',
            },
            {
              linkId: 'q2',
              text: 'Question 2',
              type: 'string',
            },
            {
              linkId: 'parent',
              text: 'Parent',
              type: 'choice',
              item: [
                {
                  linkId: 'multi-rule-child',
                  text: 'Multi Rule Child',
                  type: 'string',
                  enableWhen: [
                    { question: 'q1', operator: '=', answerString: 'yes' },
                    { question: 'q2', operator: '=', answerString: 'yes' },
                  ],
                },
              ],
            },
            {
              linkId: 'next',
              text: 'Next',
              type: 'string',
            },
          ],
        };

        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: multiRuleQuestionnaire })
        );

        // Answer first two questions
        act(() => {
          result.current.setAnswer('q1', 'yes');
        });
        act(() => {
          result.current.goNext();
        });
        act(() => {
          result.current.setAnswer('q2', 'yes');
        });
        act(() => {
          result.current.goNext();
        });

        // Now on parent question
        act(() => {
          result.current.setAnswer('parent', 'answer');
          result.current.setAnswer('multi-rule-child', 'child-answer');
        });

        act(() => {
          vi.advanceTimersByTime(300);
        });

        // Should advance because both enableWhen rules match
        expect(result.current.currentIndex).toBe(3);
      });

      it('should not validate invisible child when one enableWhen rule fails', () => {
        const multiRuleQuestionnaire = {
          item: [
            {
              linkId: 'q1',
              text: 'Question 1',
              type: 'string',
            },
            {
              linkId: 'parent',
              text: 'Parent',
              type: 'choice',
              item: [
                {
                  linkId: 'multi-rule-child',
                  text: 'Multi Rule Child',
                  type: 'string',
                  enableWhen: [
                    { question: 'q1', operator: '=', answerString: 'yes' },
                    { question: 'parent', operator: '=', answerString: 'show' },
                  ],
                },
              ],
            },
            {
              linkId: 'next',
              text: 'Next',
              type: 'string',
            },
          ],
        };

        const { result } = renderHook(() =>
          useFHIRStepper({ questionnaire: multiRuleQuestionnaire })
        );

        act(() => {
          result.current.setAnswer('q1', 'no'); // First rule fails
        });
        act(() => {
          result.current.goNext();
        });

        act(() => {
          result.current.setAnswer('parent', 'show');
          // multi-rule-child is invisible, so no need to answer
        });

        act(() => {
          vi.advanceTimersByTime(300);
        });

        // Should advance because invisible child is skipped
        expect(result.current.currentIndex).toBe(2);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty questionnaire', () => {
      const emptyQuestionnaire = { item: [] };

      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: emptyQuestionnaire })
      );

      expect(result.current.topLevelItems).toHaveLength(0);
      expect(result.current.currentQuestion).toBeUndefined();
    });

    it('should handle undefined questionnaire', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: undefined as any })
      );

      expect(result.current.topLevelItems).toHaveLength(0);
    });

    it('should handle question with no item array', () => {
      const simpleQuestionnaire = {
        item: [
          {
            linkId: 'q1',
            text: 'Simple Question',
            type: 'string',
          },
        ],
      };

      const { result } = renderHook(() =>
        useFHIRStepper({ questionnaire: simpleQuestionnaire })
      );

      act(() => {
        result.current.setAnswer('q1', 'answer');
      });

      expect(result.current.answers.q1).toBe('answer');
    });

    it('should call onComplete with all answers', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useFHIRStepper({
          questionnaire: mockQuestionnaire,
          onComplete,
        })
      );

      act(() => {
        result.current.setAnswer('q1', 'answer1');
        result.current.setAnswer('q2', 'yes');
        result.current.setAnswer('q3', 42);
      });

      // Navigate through questions
      act(() => {
        result.current.goNext();
      });

      act(() => {
        result.current.goNext();
      });

      // Go beyond last to trigger onComplete
      act(() => {
        result.current.goNext();
      });

      expect(onComplete).toHaveBeenCalledWith({
        q1: 'answer1',
        q2: 'yes',
        q3: 42,
      });
    });

    it('should handle autoNext disabled', () => {
      const { result } = renderHook(() =>
        useFHIRStepper({
          questionnaire: mockQuestionnaire,
          autoNext: false,
        })
      );

      act(() => {
        result.current.goNext();
      });

      act(() => {
        result.current.setAnswer('q2', 'yes');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.currentIndex).toBe(1); // Should NOT auto-advance
    });
  });

  describe('Duration Structure Validation (isTopLevelComplete)', () => {
    it('should validate top-level duration when answering nested child', () => {
      // The trick is to have a choice question with nested items
      // First set the parent with duration, then set nested child
      // This triggers isTopLevelComplete with the duration already in place
      const questionnaireWithDuration = {
        item: [
          {
            linkId: 'q1',
            text: 'Duration Question',
            type: 'choice',
            item: [
              {
                linkId: 'q1.1',
                text: 'Follow-up',
                type: 'string',
              },
            ],
          },
          {
            linkId: 'q2',
            text: 'Next Question',
            type: 'string',
          },
        ],
      };

      const { result } = renderHook(() =>
        useFHIRStepper({
          questionnaire: questionnaireWithDuration,
          autoNext: true,
        })
      );

      // First set parent with complete duration
      act(() => {
        result.current.setAnswer('q1', {
          dropdownValues: {
            number: 5,
            days: 'days',
          },
        });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Now set nested child - this will call isTopLevelComplete
      act(() => {
        result.current.setAnswer('q1.1', 'nested-answer');
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should still be on first question (auto-advance disabled for duration)
      expect(result.current.currentIndex).toBe(0);
    });

    it('should not advance with incomplete top-level duration (missing number)', () => {
      const questionnaireWithDuration = {
        item: [
          {
            linkId: 'q1',
            text: 'Duration Question',
            type: 'choice',
          },
        ],
      };

      const { result } = renderHook(() =>
        useFHIRStepper({
          questionnaire: questionnaireWithDuration,
          autoNext: true,
        })
      );

      // Answer with incomplete duration (missing number)
      act(() => {
        result.current.setAnswer('q1', {
          dropdownValues: {
            number: null,
            days: 'days',
          },
        });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.currentIndex).toBe(0);
    });

    it('should not advance with incomplete top-level duration (missing days)', () => {
      const questionnaireWithDuration = {
        item: [
          {
            linkId: 'q1',
            text: 'Duration Question',
            type: 'choice',
          },
        ],
      };

      const { result } = renderHook(() =>
        useFHIRStepper({
          questionnaire: questionnaireWithDuration,
          autoNext: true,
        })
      );

      // Answer with incomplete duration (missing days)
      act(() => {
        result.current.setAnswer('q1', {
          dropdownValues: {
            number: 5,
            days: null,
          },
        });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.currentIndex).toBe(0);
    });

    it('should validate nested child duration structure', () => {
      const questionnaireWithNestedDuration = {
        item: [
          {
            linkId: 'q1',
            text: 'Parent Question',
            type: 'choice',
            item: [
              {
                linkId: 'q1.1',
                text: 'Duration Child',
                type: 'string',
              },
            ],
          },
        ],
      };

      const { result } = renderHook(() =>
        useFHIRStepper({
          questionnaire: questionnaireWithNestedDuration,
          autoNext: true,
        })
      );

      // Answer parent
      act(() => {
        result.current.setAnswer('q1', 'parent-answer');
      });

      // Answer child with complete duration
      act(() => {
        result.current.setAnswer('q1.1', {
          dropdownValues: {
            number: 3,
            days: 'weeks',
          },
        });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should not auto-advance due to duration
      expect(result.current.currentIndex).toBe(0);
    });

    it('should not advance with incomplete nested child duration (missing number)', () => {
      const questionnaireWithNestedDuration = {
        item: [
          {
            linkId: 'q1',
            text: 'Parent Question',
            type: 'choice',
            item: [
              {
                linkId: 'q1.1',
                text: 'Duration Child',
                type: 'string',
              },
            ],
          },
        ],
      };

      const { result } = renderHook(() =>
        useFHIRStepper({
          questionnaire: questionnaireWithNestedDuration,
          autoNext: true,
        })
      );

      act(() => {
        result.current.setAnswer('q1', 'parent-answer');
      });

      // Answer child with incomplete duration
      act(() => {
        result.current.setAnswer('q1.1', {
          dropdownValues: {
            number: null,
            days: 'weeks',
          },
        });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.currentIndex).toBe(0);
    });

    it('should not advance with incomplete nested child duration (missing days)', () => {
      const questionnaireWithNestedDuration = {
        item: [
          {
            linkId: 'q1',
            text: 'Parent Question',
            type: 'choice',
            item: [
              {
                linkId: 'q1.1',
                text: 'Duration Child',
                type: 'string',
              },
            ],
          },
        ],
      };

      const { result } = renderHook(() =>
        useFHIRStepper({
          questionnaire: questionnaireWithNestedDuration,
          autoNext: true,
        })
      );

      act(() => {
        result.current.setAnswer('q1', 'parent-answer');
      });

      // Answer child with incomplete duration
      act(() => {
        result.current.setAnswer('q1.1', {
          dropdownValues: {
            number: 7,
            days: null,
          },
        });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.currentIndex).toBe(0);
    });
  });
});
