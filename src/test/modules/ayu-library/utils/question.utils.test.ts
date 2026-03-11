import { describe, expect, it } from 'vitest';
import type {
  AyuAnswerValue,
  AyuQuestion,
} from '../../../../modules/ayu-library/types/ayu.types';
import {
  collectDescendantLinkIds,
  clearHiddenDescendantAnswers,
} from '../../../../modules/ayu-library/utils/question.utils';

describe('collectDescendantLinkIds', () => {
  it('should return empty array when item has no children', () => {
    const item: AyuQuestion = { linkId: 'q1', type: 'string' };
    expect(collectDescendantLinkIds(item)).toEqual([]);
  });

  it('should collect direct child linkIds', () => {
    const item: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        { linkId: 'q1.1', type: 'string' },
        { linkId: 'q1.2', type: 'string' },
      ],
    };
    expect(collectDescendantLinkIds(item)).toEqual(['q1.1', 'q1.2']);
  });

  it('should collect nested linkIds recursively', () => {
    const item: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'choice',
          item: [
            { linkId: 'q1.1.1', type: 'string' },
            { linkId: 'q1.1.2', type: 'string' },
          ],
        },
        { linkId: 'q1.2', type: 'string' },
      ],
    };
    expect(collectDescendantLinkIds(item)).toEqual([
      'q1.1',
      'q1.1.1',
      'q1.1.2',
      'q1.2',
    ]);
  });

  it('should handle deeply nested structures', () => {
    const item: AyuQuestion = {
      linkId: 'q1',
      type: 'choice',
      item: [
        {
          linkId: 'q1.1',
          type: 'choice',
          item: [
            {
              linkId: 'q1.1.1',
              type: 'choice',
              item: [{ linkId: 'q1.1.1.1', type: 'string' }],
            },
          ],
        },
      ],
    };
    expect(collectDescendantLinkIds(item)).toEqual([
      'q1.1',
      'q1.1.1',
      'q1.1.1.1',
    ]);
  });
});

describe('clearHiddenDescendantAnswers', () => {
  it('should not modify answers when no enableWhen conditions exist', () => {
    const items: AyuQuestion[] = [
      { linkId: 'q1', type: 'string' },
      { linkId: 'q2', type: 'string' },
    ];
    const answers: Record<string, AyuAnswerValue> = {
      q1: 'answer1',
      q2: 'answer2',
    };
    clearHiddenDescendantAnswers(items, answers);
    expect(answers).toEqual({ q1: 'answer1', q2: 'answer2' });
  });

  it('should clear answers for hidden items (enableWhen not met)', () => {
    const items: AyuQuestion[] = [
      {
        linkId: 'child1',
        type: 'string',
        enableWhen: [
          { question: 'parent', operator: '=', answerString: 'yes' },
        ],
      },
    ];
    const answers: Record<string, AyuAnswerValue> = {
      parent: 'no',
      child1: 'should-be-cleared',
    };
    clearHiddenDescendantAnswers(items, answers);
    expect(answers.child1).toBeUndefined();
  });

  it('should keep answers for visible items (enableWhen met)', () => {
    const items: AyuQuestion[] = [
      {
        linkId: 'child1',
        type: 'string',
        enableWhen: [
          { question: 'parent', operator: '=', answerString: 'yes' },
        ],
      },
    ];
    const answers: Record<string, AyuAnswerValue> = {
      parent: 'yes',
      child1: 'should-stay',
    };
    clearHiddenDescendantAnswers(items, answers);
    expect(answers.child1).toBe('should-stay');
  });

  it('should clear all descendants when parent is hidden', () => {
    const items: AyuQuestion[] = [
      {
        linkId: 'child1',
        type: 'choice',
        enableWhen: [
          { question: 'parent', operator: '=', answerString: 'yes' },
        ],
        item: [
          { linkId: 'grandchild1', type: 'string' },
          { linkId: 'grandchild2', type: 'string' },
        ],
      },
    ];
    const answers: Record<string, AyuAnswerValue> = {
      parent: 'no',
      child1: 'will-clear',
      grandchild1: 'will-clear',
      grandchild2: 'will-clear',
    };
    clearHiddenDescendantAnswers(items, answers);
    expect(answers.child1).toBeUndefined();
    expect(answers.grandchild1).toBeUndefined();
    expect(answers.grandchild2).toBeUndefined();
  });

  it('should handle answerCoding conditions with array parent values', () => {
    const items: AyuQuestion[] = [
      {
        linkId: 'child1',
        type: 'string',
        enableWhen: [
          {
            question: 'parent',
            operator: '=',
            answerCoding: { code: 'CODE_A' },
          },
        ],
      },
    ];
    const answers: Record<string, AyuAnswerValue> = {
      parent: ['CODE_A', 'CODE_B'],
      child1: 'should-stay',
    };
    clearHiddenDescendantAnswers(items, answers);
    expect(answers.child1).toBe('should-stay');
  });

  it('should clear when array parent does not include expected code', () => {
    const items: AyuQuestion[] = [
      {
        linkId: 'child1',
        type: 'string',
        enableWhen: [
          {
            question: 'parent',
            operator: '=',
            answerCoding: { code: 'CODE_A' },
          },
        ],
      },
    ];
    const answers: Record<string, AyuAnswerValue> = {
      parent: ['CODE_B', 'CODE_C'],
      child1: 'should-be-cleared',
    };
    clearHiddenDescendantAnswers(items, answers);
    expect(answers.child1).toBeUndefined();
  });

  it('should handle multiple enableWhen conditions (AND logic)', () => {
    const items: AyuQuestion[] = [
      {
        linkId: 'child1',
        type: 'string',
        enableWhen: [
          { question: 'q1', operator: '=', answerString: 'yes' },
          { question: 'q2', operator: '=', answerString: 'no' },
        ],
      },
    ];
    // Only first condition met
    const answers: Record<string, AyuAnswerValue> = {
      q1: 'yes',
      q2: 'yes',
      child1: 'should-clear',
    };
    clearHiddenDescendantAnswers(items, answers);
    expect(answers.child1).toBeUndefined();
  });

  it('should recursively walk visible children', () => {
    const items: AyuQuestion[] = [
      {
        linkId: 'visible-parent',
        type: 'choice',
        item: [
          {
            linkId: 'hidden-child',
            type: 'string',
            enableWhen: [
              { question: 'visible-parent', operator: '=', answerString: 'yes' },
            ],
          },
        ],
      },
    ];
    const answers: Record<string, AyuAnswerValue> = {
      'visible-parent': 'no',
      'hidden-child': 'should-clear',
    };
    clearHiddenDescendantAnswers(items, answers);
    expect(answers['hidden-child']).toBeUndefined();
  });
});
