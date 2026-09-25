/**
 * Regression: Abdominal Distention — once "Pain radiates to" (Question 2) is
 * selected, any abdominal location already selected in Question 1 ("Which
 * part of the abdomen do you feel pain?") must render disabled and
 * non-clickable there, and must move — not linger or duplicate — when
 * Question 1's selections change.
 *
 * "Pain radiates to" reveals its own location list only once selected
 * (FHIR item + enableWhen, the same "pick an option, reveal another
 * question" pattern this app already uses elsewhere), rendered through
 * AyuNestedRenderer rather than directly through AyuRenderer.
 *
 * This renders the real AyuStepperContainer, the real AyuRenderer /
 * AyuNestedRenderer / componentMap resolution and the real
 * AyuSelectableOptionGroup, so a stale or missing disabled state anywhere
 * along that chain fails here. Only the summary modal, toast and
 * QuestionLoader's cosmetic loading placeholder are stubbed.
 *
 * Once a question is reopened for edit, both it and the still-visible next
 * question render their own copies of shared option labels. Queries after
 * that point use getAllByRole(...) with an index — [0] is always Question
 * 1's copy, [1] Question 2's — because topLevelItems order (and so DOM
 * order) never changes.
 */
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ABDOMINAL_PAIN_LOCATION_TEXT } from '../../../../../../modules/ayu-library/logic/option-dependency.logic';
import type { AyuQuestion } from '../../../../../../modules/ayu-library/types/ayu.types';
import { AyuStepperContainer } from '../../../../../../modules/ayu/components/start-visit/visit-reason/ayu-stepper-container.component';
import { showToast } from '../../../../../../services/toast';

vi.mock('../../../../../../services/toast', () => ({ showToast: vi.fn() }));
vi.mock('../../../../../../components/modal/global-modal-context', () => ({
  useGlobalModal: () => ({
    showConfirmModal: vi.fn(),
    showVitalConfirmationModal: vi.fn(),
    closeModal: vi.fn(),
  }),
}));
vi.mock(
  '../../../../../../modules/ayu/components/start-visit/physical-examination/physical-exam-camera-context',
  () => ({ usePhysicalExamCamera: () => null })
);
/* Bypasses QuestionLoader's cosmetic ~800ms loading placeholder — unrelated
 * to this feature — so "Edit answer" reopens a question synchronously. */
vi.mock(
  '../../../../../../modules/ayu/components/loaders/question-loader.component',
  () => ({
    QuestionLoader: ({
      children,
      isAnswered,
      onEdit,
    }: {
      children: React.ReactNode;
      isAnswered?: boolean;
      onEdit?: () => void;
    }) => (
      <div>
        {isAnswered && onEdit && (
          <button aria-label="Edit answer" onClick={onEdit}>
            Edit
          </button>
        )}
        {children}
      </div>
    ),
  })
);

const region = (code: string, display: string) => ({
  valueCoding: { code, display },
});

/* The real Abdominal Distention option lists, verbatim. */
const abdominalRegionOptions = [
  region('RHC', 'Upper (R) - Right Hypochondrium'),
  region('EPI', 'Upper (C) - Epigastric'),
  region('LHC', 'Upper (L) - Left Hypochondrium'),
  region('RL', 'Middle (R) - Right Lumbar'),
  region('UMB', 'Middle (C) - Umbilical'),
  region('LL', 'Middle (L) - Left Lumbar'),
  region('RIF', 'Lower (R) - Right Iliac Fossa'),
  region('HG', 'Lower (C) - Hypogastric/Suprapubic'),
  region('LIF', 'Lower (L) - Left Iliac Fossa'),
];

const abdominalSiteQuestion: AyuQuestion = {
  linkId: 'abdominal-site',
  text: ABDOMINAL_PAIN_LOCATION_TEXT,
  type: 'choice',
  repeats: true,
  answerOption: [...abdominalRegionOptions, region('ALL', 'All over')],
};

const painRadiatesToNested: AyuQuestion = {
  linkId: 'pain-radiates-to',
  text: 'Pain radiates to',
  type: 'choice',
  repeats: true,
  enableWhen: [
    {
      question: 'pain-movement',
      operator: '=',
      answerCoding: { code: 'RADIATES' },
    },
  ],
  answerOption: [
    ...abdominalRegionOptions,
    region('RSHOULDER', 'Right shoulder'),
    region('RSCAPULA', 'Right scapula'),
    region('GROIN', 'Groin'),
    region('SACRAL', 'Sacral region'),
    region('FLANKS', 'Flanks'),
    region('CHEST', 'Chest'),
  ],
};

const painMovementQuestion: AyuQuestion = {
  linkId: 'pain-movement',
  text: 'Does the pain move to other parts of the body?',
  type: 'choice',
  answerOption: [
    region('NOMOVE', 'Does not move'),
    region('RADIATES', 'Pain radiates to'),
  ],
  item: [painRadiatesToNested],
};

const abdominalQuestionnaire = {
  item: [abdominalSiteQuestion, painMovementQuestion],
};

/* A third top-level question, unrelated to Question 1 / Pain radiates to, to
 * prove the rule does not leak into questions it has nothing to do with. */
const onsetQuestion: AyuQuestion = {
  linkId: 'onset',
  text: 'Onset',
  type: 'choice',
  answerOption: [region('SUD', 'Sudden'), region('GRAD', 'Gradual')],
};

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

type User = ReturnType<typeof userEvent.setup>;

/** Auto-advance runs on a real 250ms timer; settle it with real time. */
const settle = () =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, 350));
  });

const clickOption = async (user: User, name: string) => {
  await user.click(screen.getByRole('button', { name }));
  await settle();
};

/** Select one or more Question 1 (repeats) locations, then Submit to advance. */
const selectSiteAndAdvance = async (user: User, ...labels: string[]) => {
  for (const label of labels) {
    await user.click(screen.getByRole('button', { name: label }));
  }
  await user.click(screen.getByRole('button', { name: 'Submit' }));
  await settle();
};

describe('Abdominal Distention: Pain radiates to disables matching Question 1 locations', () => {
  it('1. leaves every location enabled when Question 1 has no selection yet', async () => {
    const user = userEvent.setup();
    render(
      <AyuStepperContainer
        questionnaire={{ item: [painMovementQuestion] }}
        skipSummary
        onComplete={vi.fn()}
      />
    );

    await clickOption(user, 'Pain radiates to');

    for (const label of [
      'Upper (R) - Right Hypochondrium',
      'Upper (C) - Epigastric',
      'Right shoulder',
    ]) {
      expect(screen.getByRole('button', { name: label })).not.toHaveClass(
        'disabled'
      );
    }
  });

  it('2. disables the single location already selected in Question 1', async () => {
    const user = userEvent.setup();
    render(
      <AyuStepperContainer
        questionnaire={abdominalQuestionnaire}
        skipSummary
        onComplete={vi.fn()}
      />
    );

    await selectSiteAndAdvance(user, 'Upper (R) - Right Hypochondrium');
    await clickOption(user, 'Pain radiates to');

    expect(
      screen.getByRole('button', { name: 'Upper (R) - Right Hypochondrium' })
    ).toHaveClass('disabled');
  });

  it('3. disables every location when Question 1 has multiple selections', async () => {
    const user = userEvent.setup();
    render(
      <AyuStepperContainer
        questionnaire={abdominalQuestionnaire}
        skipSummary
        onComplete={vi.fn()}
      />
    );

    await selectSiteAndAdvance(
      user,
      'Upper (R) - Right Hypochondrium',
      'Middle (C) - Umbilical',
      'Lower (L) - Left Iliac Fossa'
    );
    await clickOption(user, 'Pain radiates to');

    for (const label of [
      'Upper (R) - Right Hypochondrium',
      'Middle (C) - Umbilical',
      'Lower (L) - Left Iliac Fossa',
    ]) {
      expect(screen.getByRole('button', { name: label })).toHaveClass(
        'disabled'
      );
    }
  });

  it('4. leaves a non-matching abdominal location enabled', async () => {
    const user = userEvent.setup();
    render(
      <AyuStepperContainer
        questionnaire={abdominalQuestionnaire}
        skipSummary
        onComplete={vi.fn()}
      />
    );

    await selectSiteAndAdvance(user, 'Upper (R) - Right Hypochondrium');
    await clickOption(user, 'Pain radiates to');

    expect(
      screen.getByRole('button', { name: 'Upper (C) - Epigastric' })
    ).not.toHaveClass('disabled');
  });

  it('5. moves the disabled location when Question 1 selections change', async () => {
    const user = userEvent.setup();
    render(
      <AyuStepperContainer
        questionnaire={abdominalQuestionnaire}
        skipSummary
        onComplete={vi.fn()}
      />
    );

    await selectSiteAndAdvance(user, 'Upper (R) - Right Hypochondrium');
    await clickOption(user, 'Pain radiates to');
    expect(
      screen.getByRole('button', { name: 'Upper (R) - Right Hypochondrium' })
    ).toHaveClass('disabled');

    // Reopen Question 1 (now collapsed) and pick a different location.
    await user.click(screen.getByRole('button', { name: 'Edit answer' }));
    await user.click(
      screen.getAllByRole('button', {
        name: 'Upper (R) - Right Hypochondrium',
      })[0]
    );
    await user.click(
      screen.getAllByRole('button', { name: 'Upper (C) - Epigastric' })[0]
    );

    expect(
      screen.getAllByRole('button', {
        name: 'Upper (R) - Right Hypochondrium',
      })[1]
    ).not.toHaveClass('disabled');
    expect(
      screen.getAllByRole('button', { name: 'Upper (C) - Epigastric' })[1]
    ).toHaveClass('disabled');
  });

  it('6. re-enables the location once removed from Question 1', async () => {
    const user = userEvent.setup();
    render(
      <AyuStepperContainer
        questionnaire={abdominalQuestionnaire}
        skipSummary
        onComplete={vi.fn()}
      />
    );

    await selectSiteAndAdvance(
      user,
      'Upper (R) - Right Hypochondrium',
      'Middle (C) - Umbilical'
    );
    await clickOption(user, 'Pain radiates to');
    expect(
      screen.getByRole('button', { name: 'Upper (R) - Right Hypochondrium' })
    ).toHaveClass('disabled');

    // Reopen Question 1 and remove just one of its two selections.
    await user.click(screen.getByRole('button', { name: 'Edit answer' }));
    await user.click(
      screen.getAllByRole('button', {
        name: 'Upper (R) - Right Hypochondrium',
      })[0]
    );

    expect(
      screen.getAllByRole('button', {
        name: 'Upper (R) - Right Hypochondrium',
      })[1]
    ).not.toHaveClass('disabled');
    expect(
      screen.getAllByRole('button', { name: 'Middle (C) - Umbilical' })[1]
    ).toHaveClass('disabled');
  });

  it('7. leaves every additional radiation-only location enabled', async () => {
    const user = userEvent.setup();
    render(
      <AyuStepperContainer
        questionnaire={abdominalQuestionnaire}
        skipSummary
        onComplete={vi.fn()}
      />
    );

    await selectSiteAndAdvance(user, 'Upper (R) - Right Hypochondrium');
    await clickOption(user, 'Pain radiates to');

    for (const label of [
      'Right shoulder',
      'Right scapula',
      'Groin',
      'Sacral region',
      'Flanks',
      'Chest',
    ]) {
      expect(screen.getByRole('button', { name: label })).not.toHaveClass(
        'disabled'
      );
    }
  });

  it('8. blocks a click on a disabled location — no selection is added', async () => {
    const user = userEvent.setup();
    render(
      <AyuStepperContainer
        questionnaire={abdominalQuestionnaire}
        skipSummary
        onComplete={vi.fn()}
      />
    );

    await selectSiteAndAdvance(user, 'Upper (R) - Right Hypochondrium');
    await clickOption(user, 'Pain radiates to');

    const disabledOption = screen.getByRole('button', {
      name: 'Upper (R) - Right Hypochondrium',
    });
    await user.click(disabledOption);

    expect(disabledOption).not.toHaveClass('selected');
  });

  it('a valid, non-matching location can still be selected', async () => {
    const user = userEvent.setup();
    render(
      <AyuStepperContainer
        questionnaire={abdominalQuestionnaire}
        skipSummary
        onComplete={vi.fn()}
      />
    );

    await selectSiteAndAdvance(user, 'Upper (R) - Right Hypochondrium');
    await clickOption(user, 'Pain radiates to');
    await user.click(screen.getByRole('button', { name: 'Right shoulder' }));

    expect(screen.getByRole('button', { name: 'Right shoulder' })).toHaveClass(
      'selected'
    );
  });

  it('does not disable anything on an unrelated question', async () => {
    const user = userEvent.setup();
    render(
      <AyuStepperContainer
        questionnaire={{
          item: [abdominalSiteQuestion, onsetQuestion, painMovementQuestion],
        }}
        skipSummary
        onComplete={vi.fn()}
      />
    );

    await selectSiteAndAdvance(user, 'Upper (R) - Right Hypochondrium');

    expect(screen.getByRole('button', { name: 'Sudden' })).not.toHaveClass(
      'disabled'
    );
    expect(screen.getByRole('button', { name: 'Gradual' })).not.toHaveClass(
      'disabled'
    );
  });

  it('restores the correct disabled state after revisiting via initialAnswers', async () => {
    const user = userEvent.setup();
    render(
      <AyuStepperContainer
        questionnaire={abdominalQuestionnaire}
        skipSummary
        initialAnswers={{
          'abdominal-site': ['RHC'],
          'pain-movement': 'RADIATES',
          'pain-radiates-to': ['CHEST'],
        }}
        onComplete={vi.fn()}
      />
    );

    // Revisited/reloaded visit starts in review mode: both top-level
    // questions are already collapsed. Reopen Question 2 (index 1; Question
    // 1 is index 0) to see its "Pain radiates to" list.
    await user.click(screen.getAllByRole('button', { name: 'Edit answer' })[1]);

    expect(
      screen.getByRole('button', { name: 'Upper (R) - Right Hypochondrium' })
    ).toHaveClass('disabled');
    const chest = screen.getByRole('button', { name: 'Chest' });
    expect(chest).toHaveClass('selected');
    expect(chest).not.toHaveClass('disabled');
  });

  it('never stores a conflicting/duplicate location in the final answers', async () => {
    const onComplete = vi.fn();
    const user = userEvent.setup();
    render(
      <AyuStepperContainer
        questionnaire={abdominalQuestionnaire}
        skipSummary
        onComplete={onComplete}
      />
    );

    await selectSiteAndAdvance(user, 'Upper (R) - Right Hypochondrium');
    await clickOption(user, 'Pain radiates to');
    // Attempt the disabled, conflicting location first — blocked.
    await user.click(
      screen.getByRole('button', { name: 'Upper (R) - Right Hypochondrium' })
    );
    // Pick a valid radiation location and finish.
    await user.click(screen.getByRole('button', { name: 'Right shoulder' }));
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await settle();

    expect(onComplete).toHaveBeenCalledWith({
      'abdominal-site': ['RHC'],
      'pain-movement': 'RADIATES',
      'pain-radiates-to': ['RSHOULDER'],
    });
  });
});

/**
 * Regression: the disable rule must hold in both directions. A location
 * already selected under "Pain radiates to" must equally block selecting it
 * (back) on Question 1 — not just Question 1 → Question 2, which the earlier
 * describe block above already covers — with an explicit toast, since a
 * still-enabled-looking Question 1 option gives no other feedback that the
 * click was rejected.
 */
describe('Abdominal Distention: Question 2 selection blocks the same location in Question 1', () => {
  const exclusiveOption = (code: string, display: string) => ({
    valueCoding: { code, display },
    extension: [
      {
        url: 'https://intelehealth.org/fhir/StructureDefinition/exclude-from-multi-choice',
        valueString: 'true',
      },
    ],
  });
  const abdominalSiteQuestionWithExclusiveAllOver: AyuQuestion = {
    ...abdominalSiteQuestion,
    answerOption: [...abdominalRegionOptions, exclusiveOption('ALL', 'All over')],
  };
  const abdominalQuestionnaireWithExclusiveAllOver = {
    item: [abdominalSiteQuestionWithExclusiveAllOver, painMovementQuestion],
  };

  beforeEach(() => {
    vi.mocked(showToast).mockClear();
  });

  it('disables and blocks a Question 1 option already selected in "Pain radiates to", with a toast, leaving both answers unchanged', async () => {
    const user = userEvent.setup();
    render(
      <AyuStepperContainer
        questionnaire={abdominalQuestionnaire}
        skipSummary
        onComplete={vi.fn()}
      />
    );

    await selectSiteAndAdvance(user, 'Upper (C) - Epigastric');
    await clickOption(user, 'Pain radiates to');
    await user.click(
      screen.getByRole('button', { name: 'Upper (R) - Right Hypochondrium' })
    );

    // Navigate back to Question 1.
    await user.click(screen.getByRole('button', { name: 'Edit answer' }));

    const q1Conflicting = screen.getAllByRole('button', {
      name: 'Upper (R) - Right Hypochondrium',
    })[0];
    expect(q1Conflicting).toHaveClass('disabled');

    await user.click(q1Conflicting);

    // Blocked: not selected, and both existing answers are unchanged.
    expect(q1Conflicting).not.toHaveClass('selected');
    expect(
      screen.getAllByRole('button', { name: 'Upper (C) - Epigastric' })[0]
    ).toHaveClass('selected');
    expect(
      screen.getAllByRole('button', {
        name: 'Upper (R) - Right Hypochondrium',
      })[1]
    ).toHaveClass('selected');

    expect(showToast).toHaveBeenCalledWith(
      'This option is already selected in "Pain radiates to". Please select another option.',
      undefined,
      'warning'
    );
  });

  it('does not show a toast when selecting a valid, non-conflicting Question 1 option', async () => {
    const user = userEvent.setup();
    render(
      <AyuStepperContainer
        questionnaire={abdominalQuestionnaire}
        skipSummary
        onComplete={vi.fn()}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'Upper (C) - Epigastric' })
    );

    expect(showToast).not.toHaveBeenCalled();
  });

  it('blocks re-selecting a Question 1 location that conflicts with an existing edit-mode "Pain radiates to" answer', async () => {
    const user = userEvent.setup();
    render(
      <AyuStepperContainer
        questionnaire={abdominalQuestionnaire}
        skipSummary
        initialAnswers={{
          'abdominal-site': ['RHC'],
          'pain-movement': 'RADIATES',
          'pain-radiates-to': ['EPI'],
        }}
        onComplete={vi.fn()}
      />
    );

    // Revisited/reloaded visit: both questions start collapsed. Reopen only
    // Question 1 (index 0) — Question 2 stays collapsed.
    await user.click(screen.getAllByRole('button', { name: 'Edit answer' })[0]);

    const conflictingOption = screen.getByRole('button', {
      name: 'Upper (C) - Epigastric',
    });
    expect(conflictingOption).toHaveClass('disabled');

    await user.click(conflictingOption);

    expect(conflictingOption).not.toHaveClass('selected');
    expect(showToast).toHaveBeenCalledWith(
      'This option is already selected in "Pain radiates to". Please select another option.',
      undefined,
      'warning'
    );
  });

  it('leaves "All over" selectable in Question 1 regardless of Question 2\'s own selection', async () => {
    const user = userEvent.setup();
    render(
      <AyuStepperContainer
        questionnaire={abdominalQuestionnaireWithExclusiveAllOver}
        skipSummary
        initialAnswers={{
          'abdominal-site': ['EPI'],
          'pain-movement': 'RADIATES',
          'pain-radiates-to': ['CHEST'],
        }}
        onComplete={vi.fn()}
      />
    );

    await user.click(screen.getAllByRole('button', { name: 'Edit answer' })[0]);

    expect(screen.getByRole('button', { name: 'All over' })).not.toHaveClass(
      'disabled'
    );
  });

  it('disables every Question 1 abdominal location under "Pain radiates to" once "All over" is selected', async () => {
    const user = userEvent.setup();
    render(
      <AyuStepperContainer
        questionnaire={abdominalQuestionnaireWithExclusiveAllOver}
        skipSummary
        onComplete={vi.fn()}
      />
    );

    await selectSiteAndAdvance(user, 'All over');
    await clickOption(user, 'Pain radiates to');

    for (const label of [
      'Upper (R) - Right Hypochondrium',
      'Upper (C) - Epigastric',
      'Upper (L) - Left Hypochondrium',
      'Middle (R) - Right Lumbar',
      'Middle (C) - Umbilical',
      'Middle (L) - Left Lumbar',
      'Lower (R) - Right Iliac Fossa',
      'Lower (C) - Hypogastric/Suprapubic',
      'Lower (L) - Left Iliac Fossa',
    ]) {
      expect(screen.getByRole('button', { name: label })).toHaveClass(
        'disabled'
      );
    }
    for (const label of [
      'Right shoulder',
      'Right scapula',
      'Groin',
      'Sacral region',
      'Flanks',
      'Chest',
    ]) {
      expect(screen.getByRole('button', { name: label })).not.toHaveClass(
        'disabled'
      );
    }
  });

  it('blocks Submit with a toast for legacy/stale data combining "All over" with a specific location', async () => {
    const user = userEvent.setup();
    render(
      <AyuStepperContainer
        questionnaire={abdominalQuestionnaireWithExclusiveAllOver}
        skipSummary
        // Data predating mutual-exclusion enforcement — never reachable via
        // a fresh UI selection, since every click routes through
        // computeMultiSelectToggle, which always clears one side or the other.
        initialAnswers={{ 'abdominal-site': ['ALL', 'RHC'] }}
        onComplete={vi.fn()}
      />
    );

    // "Does the pain move..." is unanswered and not required, so it's
    // auto-skipped and also shows its own "Edit answer" button. Question 1's
    // Submit button already carries a check icon from initialAnswers, so its
    // accessible name is "Submit yes", not a plain "Submit".
    await user.click(screen.getAllByRole('button', { name: 'Edit answer' })[0]);
    await user.click(screen.getByRole('button', { name: /^Submit/ }));

    expect(showToast).toHaveBeenCalledWith(
      '"All over" cannot be selected together with specific abdominal locations. Please review your selection.',
      undefined,
      'warning'
    );
  });
});

/**
 * Regression: submitting Question 1 with "All over" silently strips an
 * already-selected, now-invalid "Pain radiates to" answer (Question 2,
 * nested under the separate top-level "Does the pain move to other parts of
 * the body?" question) as a side effect — the user never touches Question 2
 * directly. That top-level question's own Submit check icon must clear too,
 * since its current answer no longer matches what was last submitted, even
 * though it wasn't the card the user interacted with.
 */
describe('Abdominal Distention: Submit check icon clears for a question changed only as a side effect', () => {
  beforeEach(() => {
    vi.mocked(showToast).mockClear();
  });

  const submitButtons = () => screen.getAllByRole('button', { name: /^Submit/ });
  const hasCheckIcon = (btn: HTMLElement) =>
    Boolean(btn.querySelector('img[alt="yes"]'));

  it('clears "Does the pain move..." check icon when editing Question 1 to "All over" strips Question 2\'s existing answer', async () => {
    const user = userEvent.setup();
    render(
      <AyuStepperContainer
        questionnaire={abdominalQuestionnaire}
        skipSummary
        initialAnswers={{
          'abdominal-site': ['RHC'],
          'pain-movement': 'RADIATES',
          'pain-radiates-to': ['RHC', 'RSHOULDER'],
        }}
        onComplete={vi.fn()}
      />
    );

    // Both cards start collapsed/submitted, from initialAnswers.
    const editButtons = () => screen.getAllByRole('button', { name: 'Edit answer' });
    expect(editButtons()).toHaveLength(2);

    // Reopen Question 1 and switch it to "All over" — Question 2 stays collapsed.
    await user.click(editButtons()[0]);
    await user.click(screen.getByRole('button', { name: 'All over' }));
    await settle();

    expect(showToast).not.toHaveBeenCalled();

    // Submit Question 1's own card.
    await user.click(submitButtons()[0]);
    await settle();

    // Reopen "Does the pain move..." (Question 2's top-level ancestor) —
    // its own answer ('RADIATES') never changed, only its nested child's
    // did, as a side effect of the Question 1 submit above. Question 1 is
    // collapsed again (submitted), so "Does the pain move..." is index 1.
    await user.click(editButtons()[1]);

    const painMovementSubmit = submitButtons()[0];
    expect(hasCheckIcon(painMovementSubmit)).toBe(false);

    // The underlying side effect itself: Right shoulder (Question 2-only,
    // never in conflict with Question 1) must still be there — proving the
    // strip only removed the now-invalid location, not the whole answer.
    expect(screen.getByRole('button', { name: 'Right shoulder' })).toHaveClass(
      'selected'
    );
    expect(showToast).not.toHaveBeenCalled();
  });

  it('does not clear the check icon for an edit with no cross-question side effect', async () => {
    const user = userEvent.setup();
    render(
      <AyuStepperContainer
        questionnaire={abdominalQuestionnaire}
        skipSummary
        initialAnswers={{
          'abdominal-site': ['RHC'],
          'pain-movement': 'RADIATES',
          'pain-radiates-to': ['RSHOULDER'],
        }}
        onComplete={vi.fn()}
      />
    );

    const editButtons = () => screen.getAllByRole('button', { name: 'Edit answer' });

    // Reopen and resubmit Question 1 unchanged (Epigastric, not covering
    // Question 2's existing "Right shoulder" answer) — no side effect.
    await user.click(editButtons()[0]);
    await user.click(
      screen.getByRole('button', { name: 'Upper (C) - Epigastric' })
    );
    await settle();
    await user.click(submitButtons()[0]);
    await settle();

    // "Does the pain move..." was never touched and had no side effect —
    // its check icon must still be showing. Question 1 is collapsed again
    // (submitted), so "Does the pain move..." is index 1.
    await user.click(editButtons()[1]);
    expect(hasCheckIcon(submitButtons()[0])).toBe(true);
  });

  it('does not touch submittedQuestions when the side effect lands on a question that was never submitted', async () => {
    // "Does the pain move..." is still the live, not-yet-submitted current
    // question (confirmed never collapsed — only one "Edit answer" button
    // exists throughout, Question 1's) when Question 1 is reopened and
    // switched to "All over" — so the cross-question side effect on its
    // nested "Pain radiates to" child has no currently-submitted top-level
    // question to unsubmit. This exercises that no-op path without crashing
    // or touching an unrelated question's state.
    const exclusiveOption = (code: string, display: string) => ({
      valueCoding: { code, display },
      extension: [
        {
          url: 'https://intelehealth.org/fhir/StructureDefinition/exclude-from-multi-choice',
          valueString: 'true',
        },
      ],
    });
    const questionnaire = {
      item: [
        {
          ...abdominalSiteQuestion,
          answerOption: [...abdominalRegionOptions, exclusiveOption('ALL', 'All over')],
        },
        painMovementQuestion,
      ],
    };

    const user = userEvent.setup();
    render(<AyuStepperContainer questionnaire={questionnaire} onComplete={vi.fn()} />);

    await selectSiteAndAdvance(user, 'Upper (R) - Right Hypochondrium');
    await clickOption(user, 'Pain radiates to');
    // Epigastric isn't on Question 1 yet, so it's not disabled here.
    await user.click(
      screen.getByRole('button', { name: 'Upper (C) - Epigastric' })
    );
    await settle();

    // Still only one collapsed/submitted card (Question 1) — "Does the pain
    // move..." remains the live current question, never submitted.
    expect(
      screen.getAllByRole('button', { name: 'Edit answer' })
    ).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Edit answer' }));
    await user.click(screen.getByRole('button', { name: 'All over' }));
    await settle();

    expect(showToast).not.toHaveBeenCalled();
  });
});
