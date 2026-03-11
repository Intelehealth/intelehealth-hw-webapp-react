import { describe, expect, it } from 'vitest';
import type { AyuAnswerValue, AyuQuestion } from '../../../../modules/ayu-library/types/ayu.types';
import {
  collectDescendantLinkIds,
  clearHiddenDescendantAnswers,
} from '../../../../modules/ayu-library/utils/question.utils';

describe('question.utils', () => {
  describe('collectDescendantLinkIds', () => {
    it('should return empty array when item has no children', () => {
      const item: AyuQuestion = { linkId: 'q1', text: 'Q1', type: 'string' };
      expect(collectDescendantLinkIds(item)).toEqual([]);
    });

    it('should return empty array when item has undefined children', () => {
      const item: AyuQuestion = { linkId: 'q1', text: 'Q1', type: 'string', item: undefined };
      expect(collectDescendantLinkIds(item)).toEqual([]);
    });

    it('should collect direct child linkIds', () => {
      const item: AyuQuestion = {
        linkId: 'parent',
        text: 'Parent',
        type: 'choice',
        item: [
          { linkId: 'child-1', text: 'C1', type: 'string' },
          { linkId: 'child-2', text: 'C2', type: 'integer' },
        ],
      };
      expect(collectDescendantLinkIds(item)).toEqual(['child-1', 'child-2']);
    });

    it('should collect deeply nested linkIds', () => {
      const item: AyuQuestion = {
        linkId: 'root',
        text: 'Root',
        type: 'choice',
        item: [
          {
            linkId: 'level-1',
            text: 'L1',
            type: 'choice',
            item: [
              {
                linkId: 'level-2',
                text: 'L2',
                type: 'string',
                item: [
                  { linkId: 'level-3', text: 'L3', type: 'string' },
                ],
              },
            ],
          },
        ],
      };
      expect(collectDescendantLinkIds(item)).toEqual(['level-1', 'level-2', 'level-3']);
    });

    it('should collect linkIds from multiple branches', () => {
      const item: AyuQuestion = {
        linkId: 'root',
        text: 'Root',
        type: 'choice',
        item: [
          {
            linkId: 'branch-a',
            text: 'A',
            type: 'string',
            item: [{ linkId: 'a-child', text: 'AC', type: 'string' }],
          },
          {
            linkId: 'branch-b',
            text: 'B',
            type: 'string',
            item: [{ linkId: 'b-child', text: 'BC', type: 'string' }],
          },
        ],
      };
      expect(collectDescendantLinkIds(item)).toEqual([
        'branch-a', 'a-child', 'branch-b', 'b-child',
      ]);
    });
  });

  describe('clearHiddenDescendantAnswers', () => {
    it('should not modify answers when all children are visible', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'C1',
          type: 'string',
          enableWhen: [{ question: 'parent', operator: '=', answerString: 'yes' }],
        },
      ];
      const answers: Record<string, AyuAnswerValue> = {
        parent: 'yes',
        'child-1': 'some value',
      };
      clearHiddenDescendantAnswers(items, answers);
      expect(answers['child-1']).toBe('some value');
    });

    it('should delete answer for hidden child', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'C1',
          type: 'string',
          enableWhen: [{ question: 'parent', operator: '=', answerString: 'yes' }],
        },
      ];
      const answers: Record<string, AyuAnswerValue> = {
        parent: 'no',
        'child-1': 'stale value',
      };
      clearHiddenDescendantAnswers(items, answers);
      expect(answers['child-1']).toBeUndefined();
    });

    it('should delete all descendants of hidden child unconditionally', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child-1',
          text: 'C1',
          type: 'choice',
          enableWhen: [{ question: 'parent', operator: '=', answerString: 'yes' }],
          item: [
            { linkId: 'grandchild-1', text: 'GC1', type: 'string' },
            {
              linkId: 'grandchild-2',
              text: 'GC2',
              type: 'string',
              item: [{ linkId: 'great-grandchild', text: 'GGC', type: 'string' }],
            },
          ],
        },
      ];
      const answers: Record<string, AyuAnswerValue> = {
        parent: 'no',
        'child-1': 'val',
        'grandchild-1': 'val1',
        'grandchild-2': 'val2',
        'great-grandchild': 'val3',
      };
      clearHiddenDescendantAnswers(items, answers);
      expect(answers['child-1']).toBeUndefined();
      expect(answers['grandchild-1']).toBeUndefined();
      expect(answers['grandchild-2']).toBeUndefined();
      expect(answers['great-grandchild']).toBeUndefined();
    });

    it('should not delete children without enableWhen at the top level', () => {
      const items: AyuQuestion[] = [
        { linkId: 'always-visible', text: 'AV', type: 'string' },
      ];
      const answers: Record<string, AyuAnswerValue> = {
        'always-visible': 'keep me',
      };
      clearHiddenDescendantAnswers(items, answers);
      expect(answers['always-visible']).toBe('keep me');
    });

    it('should handle answerBoolean in enableWhen', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child',
          text: 'C',
          type: 'string',
          enableWhen: [{ question: 'parent', operator: '=', answerBoolean: true }],
        },
      ];
      const answers: Record<string, AyuAnswerValue> = {
        parent: false,
        child: 'stale',
      };
      clearHiddenDescendantAnswers(items, answers);
      expect(answers.child).toBeUndefined();
    });

    it('should handle answerInteger in enableWhen', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child',
          text: 'C',
          type: 'string',
          enableWhen: [{ question: 'parent', operator: '=', answerInteger: 5 }],
        },
      ];
      const answers: Record<string, AyuAnswerValue> = {
        parent: 10,
        child: 'stale',
      };
      clearHiddenDescendantAnswers(items, answers);
      expect(answers.child).toBeUndefined();
    });

    it('should handle answerCoding in enableWhen', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child',
          text: 'C',
          type: 'string',
          enableWhen: [{ question: 'parent', operator: '=', answerCoding: { code: 'opt-a' } }],
        },
      ];
      const answers: Record<string, AyuAnswerValue> = {
        parent: 'opt-b',
        child: 'stale',
      };
      clearHiddenDescendantAnswers(items, answers);
      expect(answers.child).toBeUndefined();
    });

    it('should handle array parent answers (multi-select)', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child',
          text: 'C',
          type: 'string',
          enableWhen: [{ question: 'parent', operator: '=', answerCoding: { code: 'opt-a' } }],
        },
      ];
      // opt-a is in the array, so child should remain visible
      const answers: Record<string, AyuAnswerValue> = {
        parent: ['opt-a', 'opt-b'],
        child: 'keep',
      };
      clearHiddenDescendantAnswers(items, answers);
      expect(answers.child).toBe('keep');
    });

    it('should delete child when array parent does not include expected value', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child',
          text: 'C',
          type: 'string',
          enableWhen: [{ question: 'parent', operator: '=', answerCoding: { code: 'opt-a' } }],
        },
      ];
      const answers: Record<string, AyuAnswerValue> = {
        parent: ['opt-b', 'opt-c'],
        child: 'stale',
      };
      clearHiddenDescendantAnswers(items, answers);
      expect(answers.child).toBeUndefined();
    });

    it('should handle multiple enableWhen rules (all must match)', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'child',
          text: 'C',
          type: 'string',
          enableWhen: [
            { question: 'q1', operator: '=', answerString: 'yes' },
            { question: 'q2', operator: '=', answerBoolean: true },
          ],
        },
      ];
      // Only one condition met
      const answers: Record<string, AyuAnswerValue> = {
        q1: 'yes',
        q2: false,
        child: 'stale',
      };
      clearHiddenDescendantAnswers(items, answers);
      expect(answers.child).toBeUndefined();
    });

    it('should walk visible children recursively to find hidden nested children', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'visible-parent',
          text: 'VP',
          type: 'choice',
          // No enableWhen — always visible
          item: [
            {
              linkId: 'nested-hidden',
              text: 'NH',
              type: 'string',
              enableWhen: [{ question: 'visible-parent', operator: '=', answerString: 'yes' }],
            },
          ],
        },
      ];
      const answers: Record<string, AyuAnswerValue> = {
        'visible-parent': 'no',
        'nested-hidden': 'stale',
      };
      clearHiddenDescendantAnswers(items, answers);
      expect(answers['nested-hidden']).toBeUndefined();
      expect(answers['visible-parent']).toBe('no');
    });

    it('should preserve visible siblings while clearing hidden ones', () => {
      const items: AyuQuestion[] = [
        {
          linkId: 'yes-child',
          text: 'YC',
          type: 'string',
          enableWhen: [{ question: 'parent', operator: '=', answerString: 'yes' }],
        },
        {
          linkId: 'no-child',
          text: 'NC',
          type: 'string',
          enableWhen: [{ question: 'parent', operator: '=', answerString: 'no' }],
        },
      ];
      const answers: Record<string, AyuAnswerValue> = {
        parent: 'yes',
        'yes-child': 'keep',
        'no-child': 'stale',
      };
      clearHiddenDescendantAnswers(items, answers);
      expect(answers['yes-child']).toBe('keep');
      expect(answers['no-child']).toBeUndefined();
    });
  });
});
