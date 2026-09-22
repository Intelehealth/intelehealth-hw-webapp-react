/**
 * Regression: an answered FIRST question of a protocol (e.g. Weight Gain) must
 * appear in the Visit Summary popup, together with every later question.
 *
 * Unlike useFHIRStepper.hook.test.tsx, which mocks buildVisitSummary, this file
 * runs the real stepper hook and the real summary builder and reads the
 * sections the popup is opened with, so it covers
 *
 *   question definition -> user answer -> stepper state -> summary sections
 *     -> popup (showVitalConfirmationModal)
 *
 * The popup, the Visit Summary page and the uploaded visit-reason observation
 * are all built from these same sections.
 */
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockShowVitalConfirmationModal = vi.fn();
vi.mock('../../../../components/modal/global-modal-context', () => ({
  useGlobalModal: () => ({
    showConfirmModal: vi.fn(),
    showVitalConfirmationModal: mockShowVitalConfirmationModal,
    closeModal: vi.fn(),
  }),
}));
vi.mock('../../../../services/toast', () => ({ showToast: vi.fn() }));
vi.mock('../../../../assets/icons/visit-reason.svg', () => ({
  default: 'visit-reason-icon',
}));
vi.mock(
  '../../../../modules/ayu/components/start-visit/physical-examination/physical-exam-camera-context',
  () => ({ usePhysicalExamCamera: () => null })
);

import { useFHIRStepper } from '../../../../modules/ayu/hooks/useFHIRStepper.hook';
import type {
  AyuAnswerValue,
  AyuQuestion,
} from '../../../../modules/ayu-library/types/ayu.types';

const opt = (code: string, display: string) => ({
  valueCoding: { code, display },
});
const gate = (parent: string, code: string) => [
  { question: parent, operator: '=' as const, answerCoding: { code } },
];

/** The questions that follow the first one in the Weight Gain protocol. */
const laterQuestions = (): AyuQuestion[] => [
  {
    linkId: 'onset',
    text: 'Onset',
    type: 'choice',
    answerOption: [opt('SUD', 'Sudden'), opt('GRAD', 'Gradual')],
  },
  { linkId: 'since', text: 'Since when?', type: 'quantity' },
  {
    linkId: 'diet',
    text: 'Diet change',
    type: 'choice',
    repeats: true,
    answerOption: [opt('SWEET', 'More sweets'), opt('OILY', 'Oily food')],
  },
  { linkId: 'notes', text: 'Anything else', type: 'string' },
];
const laterAnswers: Record<string, AyuAnswerValue> = {
  onset: 'GRAD',
  since: { dropdownValues: { number: 3, days: 'months' } },
  diet: ['SWEET', 'OILY'],
  notes: 'eats late at night',
};
const laterRows = [
  { type: 'labelValue', label: 'Onset', value: 'Gradual' },
  { type: 'labelValue', label: 'Since when?', value: '3 months' },
  { type: 'labelValue', label: 'Diet change', value: 'More sweets, Oily food' },
  { type: 'labelValue', label: 'Anything else', value: 'eats late at night' },
];

interface FirstQuestionCase {
  name: string;
  question: AyuQuestion;
  /** Answers stored for the first question (keyed by linkId). */
  answers: Record<string, AyuAnswerValue>;
  /** The row the popup must show for it. */
  row: { label: string; value: string };
}

const container = (childType: string): AyuQuestion => ({
  linkId: 'w1',
  text: 'How much weight have you gained?',
  type: 'choice',
  answerOption: [opt('KG', 'In kilograms'), opt('LB', 'In pounds')],
  item: [
    {
      linkId: 'w1.kg',
      text: 'Weight gained (kg)',
      type: childType,
      enableWhen: gate('w1', 'KG'),
    },
    {
      linkId: 'w1.lb',
      text: 'Weight gained (lb)',
      type: childType,
      enableWhen: gate('w1', 'LB'),
    },
  ],
});

const firstQuestionCases: FirstQuestionCase[] = [
  // ── shapes the summary already handled ──────────────────────────────────
  {
    name: 'integer answer',
    question: { linkId: 'w1', text: 'Weight gained (kg)', type: 'integer' },
    answers: { w1: 5 },
    row: { label: 'Weight gained (kg)', value: '5' },
  },
  {
    name: 'free-text answer',
    question: { linkId: 'w1', text: 'What changed?', type: 'string' },
    answers: { w1: 'clothes are tight' },
    row: { label: 'What changed?', value: 'clothes are tight' },
  },
  {
    name: 'duration answer',
    question: { linkId: 'w1', text: 'Since when?', type: 'quantity' },
    answers: { w1: { dropdownValues: { number: 2, days: 'weeks' } } },
    row: { label: 'Since when?', value: '2 weeks' },
  },
  {
    name: 'single choice answer',
    question: {
      linkId: 'w1',
      text: 'Is the gain sudden?',
      type: 'choice',
      answerOption: [opt('Y', 'Yes'), opt('N', 'No')],
    },
    answers: { w1: 'Y' },
    row: { label: 'Is the gain sudden?', value: 'Yes' },
  },
  {
    name: 'container question with an integer field',
    question: container('integer'),
    answers: { 'w1.kg': 5 },
    row: { label: 'Weight gained (kg)', value: '5' },
  },
  {
    name: 'decimal typed as a string',
    question: { linkId: 'w1', text: 'Weight gained (kg)', type: 'decimal' },
    answers: { w1: '4.5' },
    row: { label: 'Weight gained (kg)', value: '4.5' },
  },
  // ── shapes that used to be dropped ──────────────────────────────────────
  {
    name: 'decimal answer',
    question: { linkId: 'w1', text: 'Weight gained (kg)', type: 'decimal' },
    answers: { w1: 4.5 },
    row: { label: 'Weight gained (kg)', value: '4.5' },
  },
  {
    name: 'zero answer',
    question: { linkId: 'w1', text: 'Weight gained (kg)', type: 'integer' },
    answers: { w1: 0 },
    row: { label: 'Weight gained (kg)', value: '0' },
  },
  {
    name: 'container question with a decimal field',
    question: container('decimal'),
    answers: { 'w1.kg': 4.5 },
    row: { label: 'Weight gained (kg)', value: '4.5' },
  },
  {
    name: 'container question with a zero field',
    question: container('integer'),
    answers: { 'w1.kg': 0 },
    row: { label: 'Weight gained (kg)', value: '0' },
  },
  {
    name: 'zero answer on a decimal question',
    question: { linkId: 'w1', text: 'Weight gained (kg)', type: 'decimal' },
    answers: { w1: 0 },
    row: { label: 'Weight gained (kg)', value: '0' },
  },
  {
    name: 'choice question whose detail field is a decimal',
    question: {
      linkId: 'w1',
      text: 'Have you gained weight?',
      type: 'choice',
      answerOption: [opt('Y', 'Yes'), opt('N', 'No')],
      item: [
        {
          linkId: 'w1.kg',
          text: 'How many kg?',
          type: 'decimal',
          enableWhen: gate('w1', 'Y'),
        },
      ],
    },
    answers: { w1: 'Y', 'w1.kg': 4.5 },
    row: { label: 'Have you gained weight?', value: 'Yes - How many kg? – 4.5' },
  },
];

/** Answers every question, walks to the end and returns what the popup got. */
const completeAndReadPopup = (
  first: AyuQuestion,
  firstAnswers: Record<string, AyuAnswerValue>
) => {
  const questionnaire = {
    text: 'Weight Gain',
    item: [first, ...laterQuestions()],
  };
  const { result } = renderHook(() =>
    useFHIRStepper({ questionnaire, autoNext: false })
  );

  const everyQuestion = new Map<string, AyuQuestion>();
  const index = (q: AyuQuestion) => {
    everyQuestion.set(q.linkId, q);
    q.item?.forEach(index);
  };
  questionnaire.item.forEach(index);

  const answers = { ...firstAnswers, ...laterAnswers };
  for (const [linkId, value] of Object.entries(answers)) {
    act(() => {
      result.current.setAnswer(everyQuestion.get(linkId)!, value);
    });
  }
  // One goNext per question; the last one opens the summary popup.
  for (let i = 0; i < questionnaire.item.length; i++) {
    act(() => {
      result.current.goNext();
    });
  }

  expect(mockShowVitalConfirmationModal).toHaveBeenCalledTimes(1);
  return {
    result,
    config: mockShowVitalConfirmationModal.mock.calls[0][0],
  };
};

const popupRows = (config: { sections: Array<{ items: unknown[] }> }) =>
  config.sections.flatMap(section => section.items);

beforeEach(() => {
  mockShowVitalConfirmationModal.mockClear();
});

describe('Visit Summary popup: the first question of the protocol', () => {
  it.each(firstQuestionCases)(
    'is shown, first, before all later questions: $name',
    ({ question, answers, row }) => {
      const { config } = completeAndReadPopup(question, answers);

      expect(popupRows(config)).toEqual([
        { type: 'labelValue', ...row },
        ...laterRows,
      ]);
    }
  );

  it('keeps every later question exactly as before', () => {
    const { config } = completeAndReadPopup(
      { linkId: 'w1', text: 'Weight gained (kg)', type: 'decimal' },
      { w1: 4.5 }
    );

    expect(popupRows(config).slice(1)).toEqual(laterRows);
  });

  it('is titled with the protocol, in a single section', () => {
    const { config } = completeAndReadPopup(
      { linkId: 'w1', text: 'Weight gained (kg)', type: 'decimal' },
      { w1: 4.5 }
    );

    expect(config.title).toBe('Weight Gain');
    expect(config.sections).toHaveLength(1);
    expect(config.sections[0].title).toBe('Weight Gain');
  });

  it('keeps the first answer in the stepper state (the normal JSON) that is saved with the visit', () => {
    const { result } = completeAndReadPopup(
      { linkId: 'w1', text: 'Weight gained (kg)', type: 'decimal' },
      { w1: 4.5 }
    );

    expect(result.current.answers.w1).toBe(4.5);
    expect(Object.keys(result.current.answers)).toEqual([
      'w1',
      'onset',
      'since',
      'diet',
      'notes',
    ]);
  });
});
