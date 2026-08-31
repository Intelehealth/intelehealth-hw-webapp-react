import { describe, expect, it } from 'vitest';
import type {
  AyuAnswerValue,
  AyuQuestion,
} from '../../../../modules/ayu-library/types/ayu.types';
import { EXT_URL_DISPLAY_TEXT } from '../../../../modules/ayu-library/utils/constants';
import {
  clearHiddenDescendantAnswers,
  collectDescendantLinkIds,
  getRowLabel,
} from '../../../../modules/ayu-library/utils/question.utils';

describe('getRowLabel', () => {
  it('returns the display extension valueString when present', () => {
    const item: AyuQuestion = {
      linkId: 'q1',
      type: 'string',
      text: 'Short text',
      extension: [
        { url: EXT_URL_DISPLAY_TEXT, valueString: 'Long display text' },
      ],
    };
    expect(getRowLabel(item)).toBe('Long display text');
  });

  it('falls back to text when display extension is absent', () => {
    const item: AyuQuestion = {
      linkId: 'q1',
      type: 'string',
      text: 'Short text',
    };
    expect(getRowLabel(item)).toBe('Short text');
  });

  it('falls back to text when extension list has no display entry', () => {
    const item: AyuQuestion = {
      linkId: 'q1',
      type: 'string',
      text: 'Short text',
      extension: [
        { url: 'https://example.com/other', valueString: 'ignored' },
      ],
    };
    expect(getRowLabel(item)).toBe('Short text');
  });

  it('falls back to text when display extension has no valueString', () => {
    const item: AyuQuestion = {
      linkId: 'q1',
      type: 'string',
      text: 'Short text',
      extension: [{ url: EXT_URL_DISPLAY_TEXT }],
    };
    expect(getRowLabel(item)).toBe('Short text');
  });

  it('returns the display extension when text is missing', () => {
    const item: AyuQuestion = {
      linkId: 'q1',
      type: 'string',
      extension: [
        { url: EXT_URL_DISPLAY_TEXT, valueString: 'Long display text' },
      ],
    };
    expect(getRowLabel(item)).toBe('Long display text');
  });

  it('returns empty string when neither display extension nor text are present', () => {
    const item: AyuQuestion = { linkId: 'q1', type: 'string' };
    expect(getRowLabel(item)).toBe('');
  });

  it('returns empty string when item is undefined', () => {
    expect(getRowLabel(undefined)).toBe('');
  });
});

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

  describe('enriched-map propagation (SD-C001 / SD-C002 / SD-C003)', () => {
    const sdItems: AyuQuestion[] = [
      {
        linkId: 'from-to-event',
        type: 'choice',
        enableWhen: [
          { question: 'sd', operator: '=', answerCoding: { code: 'yes' } },
        ],
        answerOption: [{ valueCoding: { code: 'yes', display: 'Yes' } }],
        item: [{ linkId: 'from-date', type: 'date' }],
      },
      {
        linkId: 'to-date',
        type: 'date',
        enableWhen: [
          { question: 'from-date', operator: 'exists', answerBoolean: true },
        ],
      },
      {
        linkId: 'event-describe',
        type: 'string',
        enableWhen: [
          { question: 'to-date', operator: 'exists', answerBoolean: true },
        ],
      },
    ];

    it('SD-C001: preserves event-describe answer when container is enabled and chain has no real values', () => {
      const answers: Record<string, AyuAnswerValue> = {
        sd: 'yes',
        'event-describe': 'hello',
      };
      clearHiddenDescendantAnswers(sdItems, answers);
      expect(answers['event-describe']).toBe('hello');
    });

    it('SD-C002: clears event-describe when the parent container becomes disabled', () => {
      const answers: Record<string, AyuAnswerValue> = {
        sd: 'no',
        'event-describe': 'hello',
      };
      clearHiddenDescendantAnswers(sdItems, answers);
      expect(answers['event-describe']).toBeUndefined();
    });

    it('SD-C003: preserves to-date answer when from-date has no real value but container is enabled', () => {
      const answers: Record<string, AyuAnswerValue> = {
        sd: 'yes',
        'to-date': '2024-02-01',
      };
      clearHiddenDescendantAnswers(sdItems, answers);
      expect(answers['to-date']).toBe('2024-02-01');
    });
  });
});
