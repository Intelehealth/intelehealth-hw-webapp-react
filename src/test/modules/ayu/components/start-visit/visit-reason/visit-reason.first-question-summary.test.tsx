/**
 * The first question of a protocol (Weight Gain) through the real Visit Reason
 * flow:
 *
 *   protocol JSON -> mergeProtocols -> stepper answers -> handleStepperComplete
 *     -> details / detailsSections (saved with the visit, shown on the Visit
 *        Summary page) -> buildVisitReasonHtml (the uploaded observation)
 *
 * Only the UI shell around VisitReason is stubbed. The protocol merge, the
 * summary builder and the upload builder are the real ones, so a question that
 * is answered but lost anywhere along this chain fails here.
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-router-dom', () => ({
  useLocation: () => ({
    pathname: '/ayu',
    search: '',
    hash: '',
    state: null,
    key: 'default',
  }),
}));
vi.mock('../../../../../../modules/ayu/components/loaders/question-loader.component', () => ({
  QuestionLoader: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/footer', () => ({
  VisitReasonFooter: ({
    onNextQuestion,
    isNextDisabled,
  }: {
    onNextQuestion: () => void;
    isNextDisabled: boolean;
  }) => (
    <button
      data-testid="footer-next-button"
      onClick={onNextQuestion}
      disabled={isNextDisabled}
    >
      Next
    </button>
  ),
}));
vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/reason-alphabetList.component', () => ({
  ReasonAlphabetList: () => null,
}));
vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/search-input.component', () => ({
  ReasonSearchInput: () => null,
}));
vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/selected-reasons.component', () => ({
  SelectedReasons: () => null,
}));

/** What the stubbed stepper reports as the completed answers. */
let completedAnswers: Record<string, unknown> = {};
vi.mock('../../../../../../modules/ayu/components/start-visit/visit-reason/ayu-stepper-container.component', async () => {
  const ReactModule = await vi.importActual<typeof import('react')>('react');
  return {
    AyuStepperContainer: ReactModule.forwardRef(
      (props: { onComplete?: (answers: unknown) => void }, ref) => {
        ReactModule.useImperativeHandle(ref, () => ({
          confirm: vi.fn(),
          showSummary: vi.fn(),
          getAnswers: () => completedAnswers,
        }));
        return (
          <button
            data-testid="stepper-complete-button"
            onClick={() => props.onComplete?.(completedAnswers)}
          >
            Complete
          </button>
        );
      }
    ),
  };
});
vi.mock('../../../../../../modules/ayu/components/common/ayu-button.component', () => ({
  default: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
}));
vi.mock('../../../../../../assets/icons/icon-right-arrow.svg', () => ({
  default: 'right-arrow-icon.svg',
}));
vi.mock('../../../../../../modules/ayu/assets/wash-hand.svg', () => ({
  default: 'wash-hand-icon.svg',
}));

const mockShowConfirmModal = vi.fn();
vi.mock('../../../../../../components/modal/global-modal-context', () => ({
  useGlobalModal: () => ({
    showConfirmModal: mockShowConfirmModal,
    showVitalConfirmationModal: vi.fn(),
    closeModal: vi.fn(),
  }),
}));

const mockSetVisitReasonData = vi.fn();
const mockSaveSectionToTemp = vi.fn().mockResolvedValue(undefined);
vi.mock('../../../../../../modules/ayu/context/start-visit.context', () => ({
  useStartVisitData: () => ({
    data: {
      vitals: null,
      visitReason: null,
      physicalExam: null,
      medicalHistory: null,
      medicalHistoryAnswers: null,
    },
    setVisitReasonData: mockSetVisitReasonData,
    clearVisitReasonData: vi.fn(),
    saveSectionToTemp: mockSaveSectionToTemp,
  }),
}));

// Only for buildVisitReasonHtml: the upload service pulls in the patient API.
vi.mock('../../../../../../services/patient.service', () => ({
  EmrMiddlewareApi: { post: vi.fn() },
}));

import { VisitReason } from '../../../../../../modules/ayu/components/start-visit/visit-reason/visit-reason.component';
import { buildVisitReasonHtml } from '../../../../../../modules/ayu/services/visit-upload.service';
import type { AyuJsonItem } from '../../../../../../modules/ayu-library/types/ayu-json.types';
import type { FhirQuestionnaire } from '../../../../../../modules/ayu-library/types/fhir-raw.types';

const opt = (code: string, display: string) => ({
  valueCoding: { code, display },
});
const gate = (parent: string, code: string) => [
  { question: parent, operator: '=' as const, answerCoding: { code } },
];

const complaint = (
  name: string,
  title: string,
  items: unknown[]
): AyuJsonItem => ({
  id: 1,
  name: `${name}.json`,
  keyName: 'ayu',
  isActive: true,
  json: {
    resourceType: 'Questionnaire',
    title,
    item: items,
  } as unknown as FhirQuestionnaire,
});

/** The questions after the first one in the Weight Gain protocol. */
const weightGainLaterItems = () => [
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
  // Optional questions the health worker left empty.
  { linkId: 'skipped1', text: 'Medication that adds weight', type: 'string' },
  {
    linkId: 'skipped2',
    text: 'Activity level',
    type: 'choice',
    answerOption: [opt('LOW', 'Low'), opt('HIGH', 'High')],
  },
];
const weightGainLaterAnswers = {
  onset: 'GRAD',
  since: { dropdownValues: { number: 3, days: 'months' } },
  diet: ['SWEET', 'OILY'],
  notes: 'eats late at night',
  skipped1: '',
};
const laterRows = [
  { type: 'labelValue', label: 'Onset', value: 'Gradual' },
  { type: 'labelValue', label: 'Since when?', value: '3 months' },
  { type: 'labelValue', label: 'Diet change', value: 'More sweets, Oily food' },
  { type: 'labelValue', label: 'Anything else', value: 'eats late at night' },
];

const weightGain = (first: unknown) =>
  complaint('Weight Gain', 'Weight Gain', [first, ...weightGainLaterItems()]);

const fever = () =>
  complaint('Fever', 'Fever', [
    { linkId: 'f1', text: 'Temperature', type: 'string' },
    {
      linkId: 'f2',
      text: 'Chills',
      type: 'choice',
      answerOption: [opt('Y', 'Yes'), opt('N', 'No')],
    },
  ]);

const decimalFirst = {
  linkId: 'w1',
  text: 'Weight gained (kg)',
  type: 'decimal',
};
const integerFirst = {
  linkId: 'w1',
  text: 'Weight gained (kg)',
  type: 'integer',
};
const containerFirst = {
  linkId: 'w1',
  text: 'How much weight have you gained?',
  type: 'choice',
  answerOption: [opt('KG', 'In kilograms'), opt('LB', 'In pounds')],
  item: [
    {
      linkId: 'w1.kg',
      text: 'Weight gained (kg)',
      type: 'decimal',
      enableWhen: gate('w1', 'KG'),
    },
    {
      linkId: 'w1.lb',
      text: 'Weight gained (lb)',
      type: 'decimal',
      enableWhen: gate('w1', 'LB'),
    },
  ],
};

const visitReasonsFor = (
  complaints: AyuJsonItem[],
  selectedReasons: string[]
) => ({
  search: '',
  setSearch: vi.fn(),
  filteredNames: [],
  selectedReasons,
  disabledReasons: new Set<string>(),
  addReason: vi.fn(),
  removeReason: vi.fn(),
  clearReasons: vi.fn(),
  grouped: {},
  selectedComplaints: complaints,
});

/** Selects the protocol(s), confirms them, completes the stepper. */
const completeVisitReason = async (
  complaints: AyuJsonItem[],
  selectedReasons: string[],
  answers: Record<string, unknown>
) => {
  completedAnswers = answers;
  const user = userEvent.setup();
  render(
    <VisitReason
      questionIndex={0}
      onNextQuestion={vi.fn()}
      onPrevQuestion={vi.fn()}
      onPrevSection={vi.fn()}
      onProgressUpdate={vi.fn()}
      visitReasons={visitReasonsFor(complaints, selectedReasons) as never}
    />
  );
  await user.click(screen.getByTestId('footer-next-button'));
  act(() => {
    mockShowConfirmModal.mock.calls[0][0].onConfirm();
  });
  await user.click(await screen.findByTestId('stepper-complete-button'));

  const [savedAnswers, reasonNames, details, detailsSections] =
    mockSetVisitReasonData.mock.calls[0];
  return { savedAnswers, reasonNames, details, detailsSections };
};

beforeEach(() => {
  mockShowConfirmModal.mockClear();
  mockSetVisitReasonData.mockClear();
  mockSaveSectionToTemp.mockClear();
  completedAnswers = {};
});

describe('Weight Gain: first question through the Visit Reason flow', () => {
  it.each([
    {
      name: 'a decimal weight',
      first: decimalFirst,
      answers: { w1: 4.5 },
      row: { label: 'Weight gained (kg)', value: '4.5' },
    },
    {
      name: 'a zero',
      first: integerFirst,
      answers: { w1: 0 },
      row: { label: 'Weight gained (kg)', value: '0' },
    },
    {
      name: 'a container question with a decimal field',
      first: containerFirst,
      answers: { 'w1.kg': 4.5 },
      row: { label: 'Weight gained (kg)', value: '4.5' },
    },
    {
      name: 'an integer weight (unchanged behaviour)',
      first: integerFirst,
      answers: { w1: 5 },
      row: { label: 'Weight gained (kg)', value: '5' },
    },
  ])(
    'saves the first question first, ahead of every later question: $name',
    async ({ first, answers, row }) => {
      const { details, detailsSections } = await completeVisitReason(
        [weightGain(first)],
        ['Weight Gain'],
        { ...answers, ...weightGainLaterAnswers }
      );

      // What the Visit Summary page shows
      expect(details).toEqual([
        row,
        ...laterRows.map(({ label, value }) => ({ label, value })),
      ]);
      expect(detailsSections).toEqual([
        { title: '', items: [{ type: 'labelValue', ...row }, ...laterRows] },
      ]);
    }
  );

  it('leaves optional questions that were left empty out and keeps every answered one', async () => {
    const { details } = await completeVisitReason(
      [weightGain(decimalFirst)],
      ['Weight Gain'],
      { w1: 4.5, ...weightGainLaterAnswers }
    );

    const labels = details.map((d: { label: string }) => d.label);
    expect(labels).toEqual([
      'Weight gained (kg)',
      'Onset',
      'Since when?',
      'Diet change',
      'Anything else',
    ]);
    expect(labels).not.toContain('Medication that adds weight');
    expect(labels).not.toContain('Activity level');
  });

  it('persists the same details, and the first answer, with the visit (survives a reload)', async () => {
    const { savedAnswers } = await completeVisitReason(
      [weightGain(decimalFirst)],
      ['Weight Gain'],
      { w1: 4.5, ...weightGainLaterAnswers }
    );

    // The normal JSON: the first answer is in the saved answers …
    expect(savedAnswers.w1).toBe(4.5);
    // … and the saved section carries the very same rows the page renders.
    const saved = mockSaveSectionToTemp.mock.calls
      .map(call => call[0])
      .find(payload => payload.visitReason)!;
    expect(saved.visitReason.answers.w1).toBe(4.5);
    expect(saved.visitReason.details[0]).toEqual({
      label: 'Weight gained (kg)',
      value: '4.5',
    });
    expect(saved.visitReason.detailsSections[0].items[0]).toEqual({
      type: 'labelValue',
      label: 'Weight gained (kg)',
      value: '4.5',
    });
    expect(saved.confirmedReasons).toEqual(['Weight Gain']);
  });

  it('is in the uploaded visit-reason observation, first', async () => {
    const { details, reasonNames, detailsSections } =
      await completeVisitReason([weightGain(decimalFirst)], ['Weight Gain'], {
        w1: 4.5,
        ...weightGainLaterAnswers,
      });

    const { obsValue } = buildVisitReasonHtml(
      details,
      reasonNames,
      detailsSections
    );
    const { en, 'l-en': raw } = JSON.parse(obsValue);

    expect(en).toContain('• Weight gained (kg) - 4.5.<br/>');
    expect(en.indexOf('Weight gained (kg)')).toBeLessThan(en.indexOf('Onset'));
    expect(raw).toContain('● Weight gained (kg)<br/>•4.5<br/>');
  });
});

describe('Weight Gain selected together with another protocol', () => {
  const answersFor = (weightGainAnswers: Record<string, unknown>) => ({
    ...Object.fromEntries(
      Object.entries(weightGainAnswers).map(([k, v]) => [`Weight Gain:${k}`, v])
    ),
    'Fever:f1': '101 F',
    'Fever:f2': 'Y',
  });

  it('shows the first question under its own protocol, ahead of the later ones', async () => {
    const { detailsSections, details } = await completeVisitReason(
      [weightGain(decimalFirst), fever()],
      ['Weight Gain', 'Fever'],
      answersFor({ w1: 4.5, ...weightGainLaterAnswers })
    );

    expect(detailsSections.map((s: { title: string }) => s.title)).toEqual([
      'Weight Gain',
      'Fever',
    ]);
    expect(detailsSections[0].items).toEqual([
      { type: 'labelValue', label: 'Weight gained (kg)', value: '4.5' },
      ...laterRows,
    ]);
    expect(details[0]).toEqual({ label: 'Weight gained (kg)', value: '4.5' });

    const { obsValue } = buildVisitReasonHtml(
      details,
      ['Weight Gain', 'Fever'],
      detailsSections
    );
    const { en } = JSON.parse(obsValue);
    expect(en).toContain('►<b>Weight Gain</b>: <br/>• Weight gained (kg) - 4.5.');
  });

  it('leaves the other protocol exactly as it is when summarised on its own', async () => {
    const together = await completeVisitReason(
      [weightGain(decimalFirst), fever()],
      ['Weight Gain', 'Fever'],
      answersFor({ w1: 4.5, ...weightGainLaterAnswers })
    );
    const feverTogether = together.detailsSections.find(
      (s: { title: string }) => s.title === 'Fever'
    );

    mockSetVisitReasonData.mockClear();
    mockShowConfirmModal.mockClear();
    document.body.innerHTML = '';
    const alone = await completeVisitReason([fever()], ['Fever'], {
      f1: '101 F',
      f2: 'Y',
    });

    expect(feverTogether.items).toEqual(alone.detailsSections[0].items);
    expect(feverTogether.items).toEqual([
      { type: 'labelValue', label: 'Temperature', value: '101 F' },
      { type: 'labelValue', label: 'Chills', value: 'Yes' },
    ]);
  });
});
