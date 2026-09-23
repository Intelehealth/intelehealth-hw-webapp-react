import { describe, expect, it } from 'vitest';
import {
  ABDOMINAL_PAIN_LOCATION_TEXT,
  getAbdominalPainLocationSelections,
  getOptionLocationIdentity,
  getPainRadiatesConflictMessage,
  getPainRadiatesToSelections,
  isAbdominalPainLocationQuestion,
  isPainRadiatesOptionDisabled,
  isPainRadiatesToQuestion,
  PAIN_RADIATES_TO_TEXT,
} from '../../../../modules/ayu-library/logic/option-dependency.logic';
import type {
  AyuAnswerOption,
  AyuAnswerValue,
  AyuQuestion,
} from '../../../../modules/ayu-library/types/ayu.types';

const EXT_URL_MUTUALLY_EXCLUSIVE =
  'https://intelehealth.org/fhir/StructureDefinition/exclude-from-multi-choice';

const region = (code: string, display: string) => ({
  valueCoding: { code, display },
});
/** An "All over"-style option, marked exclusive the same way the real
 *  protocol JSON does — no option label is ever matched by string. */
const exclusiveOption = (code: string, display: string): AyuAnswerOption => ({
  valueCoding: { code, display },
  extension: [{ url: EXT_URL_MUTUALLY_EXCLUSIVE, valueString: 'true' }],
});

/* The real Abdominal Distention option list. */
const abdominalRegions = [
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
/** Normalized identity of an abdominalRegions entry, for expected-value assertions. */
const identityOf = (display: string) => display.trim().toLowerCase();

const siteQuestion: AyuQuestion = {
  linkId: 'abdominal-site',
  text: ABDOMINAL_PAIN_LOCATION_TEXT,
  type: 'choice',
  repeats: true,
  answerOption: [...abdominalRegions, region('ALL', 'All over')],
};

const siteQuestionWithExclusiveAllOver: AyuQuestion = {
  ...siteQuestion,
  answerOption: [...abdominalRegions, exclusiveOption('ALL', 'All over')],
};

const radiatesQuestion: AyuQuestion = {
  linkId: 'pain-radiates-to',
  text: PAIN_RADIATES_TO_TEXT,
  type: 'choice',
  repeats: true,
  answerOption: [
    ...abdominalRegions,
    region('RSHOULDER', 'Right shoulder'),
    region('RSCAPULA', 'Right scapula'),
    region('GROIN', 'Groin'),
    region('SACRAL', 'Sacral region'),
    region('FLANKS', 'Flanks'),
    region('CHEST', 'Chest'),
  ],
};

describe('isAbdominalPainLocationQuestion', () => {
  it('should match the exact Question 1 text', () => {
    expect(isAbdominalPainLocationQuestion(siteQuestion)).toBe(true);
  });

  it('should match case-insensitively and ignoring surrounding whitespace', () => {
    expect(
      isAbdominalPainLocationQuestion({
        ...siteQuestion,
        text: `  ${ABDOMINAL_PAIN_LOCATION_TEXT.toUpperCase()}  `,
      })
    ).toBe(true);
  });

  it('should not match a differently-worded question', () => {
    expect(
      isAbdominalPainLocationQuestion({
        ...siteQuestion,
        text: 'Does the pain move to other parts of the body?',
      })
    ).toBe(false);
  });

  it('should not match when text is undefined', () => {
    expect(
      isAbdominalPainLocationQuestion({ ...siteQuestion, text: undefined })
    ).toBe(false);
  });

  it('should not match a non-choice question with the same text', () => {
    expect(
      isAbdominalPainLocationQuestion({ ...siteQuestion, type: 'string' })
    ).toBe(false);
  });

  it('should match via the display extension when the real FHIR text is the generic "Site"', () => {
    // The real Abdominal Distention protocol JSON: item.text is literally
    // "Site" (reused across many unrelated protocols/questions); the actual
    // wording lives in a display extension, exactly like isStrictAssociatedSymptoms's
    // ASSOCIATED_SYMPTOMS_TEXT pattern relies on getRowLabel elsewhere in this app.
    const realShapeSiteQuestion: AyuQuestion = {
      linkId: 'ID-1222159742',
      text: 'Site',
      type: 'choice',
      extension: [
        {
          url: 'https://intelehealth.org/fhir/StructureDefinition/display',
          valueString: ABDOMINAL_PAIN_LOCATION_TEXT,
        },
      ],
      answerOption: abdominalRegions,
    };
    expect(isAbdominalPainLocationQuestion(realShapeSiteQuestion)).toBe(true);
  });

  it('should not match a generic "Site" question from an unrelated protocol (no matching display extension)', () => {
    // Guards against false-matching some other protocol's own "Site"
    // sub-question (e.g. chest pain) that never got an abdomen-specific
    // display override — text alone ("Site") is too generic to trust.
    const chestSiteQuestion: AyuQuestion = {
      linkId: 'ID-9999999999',
      text: 'Site',
      type: 'choice',
      extension: [
        {
          url: 'https://intelehealth.org/fhir/StructureDefinition/display',
          valueString: 'Which part of the chest do you feel pain?',
        },
      ],
      answerOption: [region('CENTRAL', 'Central'), region('LEFT', 'Left side')],
    };
    expect(isAbdominalPainLocationQuestion(chestSiteQuestion)).toBe(false);
  });
});

describe('isPainRadiatesToQuestion', () => {
  it('should match the exact "Pain radiates to" text', () => {
    expect(isPainRadiatesToQuestion(radiatesQuestion)).toBe(true);
  });

  it('should match case-insensitively and ignoring surrounding whitespace', () => {
    expect(
      isPainRadiatesToQuestion({
        ...radiatesQuestion,
        text: `  ${PAIN_RADIATES_TO_TEXT.toUpperCase()}  `,
      })
    ).toBe(true);
  });

  it('should not match a differently-worded question', () => {
    expect(
      isPainRadiatesToQuestion({ ...radiatesQuestion, text: 'Radiation' })
    ).toBe(false);
  });

  it('should not match when text is undefined', () => {
    expect(
      isPainRadiatesToQuestion({ ...radiatesQuestion, text: undefined })
    ).toBe(false);
  });

  it('should not match a non-choice question with the same text', () => {
    expect(
      isPainRadiatesToQuestion({ ...radiatesQuestion, type: 'string' })
    ).toBe(false);
  });

  it('should not match Question 1 itself', () => {
    expect(isPainRadiatesToQuestion(siteQuestion)).toBe(false);
  });
});

describe('getOptionLocationIdentity', () => {
  it('should normalize a coded option\'s display text', () => {
    expect(
      getOptionLocationIdentity(region('RHC', 'Upper (R) - Right Hypochondrium'))
    ).toBe('upper (r) - right hypochondrium');
  });

  it('should fall back to valueString for an uncoded option', () => {
    expect(getOptionLocationIdentity({ valueString: 'Chest' })).toBe('chest');
  });

  it('should treat two differently-coded options for the same location as identical', () => {
    // Confirmed directly against real protocol data: Site's option and
    // "Pain radiates to"'s own option for the same location carry different
    // codes (ID_1935801557 vs ID_758995804) but identical display text.
    const siteOption = region('ID_1935801557', 'Upper (R) - Right Hypochondrium');
    const radiatesOption = region(
      'ID_758995804',
      'Upper (R) - Right Hypochondrium'
    );
    expect(getOptionLocationIdentity(siteOption)).toBe(
      getOptionLocationIdentity(radiatesOption)
    );
  });

  it('should return an empty string for an option with neither display nor valueString', () => {
    expect(getOptionLocationIdentity({ valueCoding: { code: 'X' } })).toBe('');
  });
});

describe('getAbdominalPainLocationSelections', () => {
  const buildAnswers = (
    entries: Array<[string, AyuAnswerValue]>
  ): Record<string, AyuAnswerValue> => Object.fromEntries(entries);

  it('should return an empty set when Question 1 is not present at all', () => {
    expect(getAbdominalPainLocationSelections([], {})).toEqual(new Set());
  });

  it('should return an empty set when Question 1 has no answer yet', () => {
    expect(
      getAbdominalPainLocationSelections([siteQuestion], {})
    ).toEqual(new Set());
  });

  it('should return the single selected location, as its normalized display identity', () => {
    const answers = buildAnswers([['abdominal-site', ['RHC']]]);
    expect(
      getAbdominalPainLocationSelections([siteQuestion], answers)
    ).toEqual(new Set([identityOf('Upper (R) - Right Hypochondrium')]));
  });

  it('should return every selected location for a multi-select answer', () => {
    const answers = buildAnswers([['abdominal-site', ['RHC', 'UMB', 'LIF']]]);
    expect(
      getAbdominalPainLocationSelections([siteQuestion], answers)
    ).toEqual(
      new Set([
        identityOf('Upper (R) - Right Hypochondrium'),
        identityOf('Middle (C) - Umbilical'),
        identityOf('Lower (L) - Left Iliac Fossa'),
      ])
    );
  });

  it('should also support a single (non-array) string answer', () => {
    const answers = buildAnswers([['abdominal-site', 'RHC']]);
    expect(
      getAbdominalPainLocationSelections([siteQuestion], answers)
    ).toEqual(new Set([identityOf('Upper (R) - Right Hypochondrium')]));
  });

  it('should reflect a changed selection, not a stale one', () => {
    const topLevelItems = [siteQuestion];
    const before = getAbdominalPainLocationSelections(
      topLevelItems,
      buildAnswers([['abdominal-site', ['RHC']]])
    );
    const after = getAbdominalPainLocationSelections(
      topLevelItems,
      buildAnswers([['abdominal-site', ['EPI']]])
    );
    expect(before).toEqual(new Set([identityOf('Upper (R) - Right Hypochondrium')]));
    expect(after).toEqual(new Set([identityOf('Upper (C) - Epigastric')]));
  });

  it('should match a selected option by valueString when it is uncoded', () => {
    const plainSiteQuestion: AyuQuestion = {
      linkId: 'plain-site',
      text: ABDOMINAL_PAIN_LOCATION_TEXT,
      type: 'choice',
      answerOption: [{ valueString: 'Chest' }, { valueString: 'Back' }],
    };
    const answers = buildAnswers([['plain-site', 'Chest']]);
    expect(
      getAbdominalPainLocationSelections([plainSiteQuestion], answers)
    ).toEqual(new Set(['chest']));
  });

  it('should never match a selected code against an option with neither code nor valueString', () => {
    const malformedSiteQuestion: AyuQuestion = {
      linkId: 'malformed-site',
      text: ABDOMINAL_PAIN_LOCATION_TEXT,
      type: 'choice',
      answerOption: [{}, region('RHC', 'Upper (R) - Right Hypochondrium')],
    };
    const answers = buildAnswers([['malformed-site', ['RHC']]]);
    expect(
      getAbdominalPainLocationSelections([malformedSiteQuestion], answers)
    ).toEqual(new Set([identityOf('Upper (R) - Right Hypochondrium')]));
  });

  it('should return an empty set when Question 1 has no answerOption list at all', () => {
    const optionlessSiteQuestion: AyuQuestion = {
      linkId: 'abdominal-site',
      text: ABDOMINAL_PAIN_LOCATION_TEXT,
      type: 'choice',
    };
    const answers = buildAnswers([['abdominal-site', ['RHC']]]);
    expect(
      getAbdominalPainLocationSelections([optionlessSiteQuestion], answers)
    ).toEqual(new Set());
  });

  it('should return an empty set once the selection is cleared', () => {
    const topLevelItems = [siteQuestion];
    const cleared = getAbdominalPainLocationSelections(
      topLevelItems,
      buildAnswers([['abdominal-site', undefined]])
    );
    expect(cleared).toEqual(new Set());
  });

  it('should ignore an unrelated protocol with no Question 1 present', () => {
    const onset: AyuQuestion = {
      linkId: 'onset',
      text: 'Onset',
      type: 'choice',
      answerOption: [region('SUD', 'Sudden'), region('GRAD', 'Gradual')],
    };
    const answers = buildAnswers([['onset', 'SUD']]);
    expect(getAbdominalPainLocationSelections([onset], answers)).toEqual(
      new Set()
    );
  });

  describe('"All over"', () => {
    it('should expand to every other location on the question when the selected option is marked exclusive', () => {
      const answers = buildAnswers([['abdominal-site', ['ALL']]]);
      const result = getAbdominalPainLocationSelections(
        [siteQuestionWithExclusiveAllOver],
        answers
      );
      expect(result).toEqual(
        new Set(abdominalRegions.map(opt => getOptionLocationIdentity(opt)))
      );
    });

    it('should not include the exclusive "All over" option\'s own identity in the expansion', () => {
      const answers = buildAnswers([['abdominal-site', ['ALL']]]);
      const result = getAbdominalPainLocationSelections(
        [siteQuestionWithExclusiveAllOver],
        answers
      );
      expect(result.has(identityOf('All over'))).toBe(false);
    });

    it('should NOT expand when "All over" has no exclusive marker (plain option, not hardcoded by label)', () => {
      // siteQuestion's own "All over" option carries no extension — matching
      // is data-driven via isMutuallyExclusiveOption, never the label text.
      const answers = buildAnswers([['abdominal-site', ['ALL']]]);
      const result = getAbdominalPainLocationSelections(
        [siteQuestion],
        answers
      );
      expect(result).toEqual(new Set([identityOf('All over')]));
    });

    it('should expand correctly alongside a non-exclusive selection made in the same (repeats) answer', () => {
      // computeMultiSelectToggle always resolves an exclusive selection down
      // to just that one code, but the expansion logic itself must not
      // depend on that — it should expand from whichever codes are present.
      const answers = buildAnswers([['abdominal-site', ['ALL', 'RHC']]]);
      const result = getAbdominalPainLocationSelections(
        [siteQuestionWithExclusiveAllOver],
        answers
      );
      expect(result).toEqual(
        new Set(abdominalRegions.map(opt => getOptionLocationIdentity(opt)))
      );
    });
  });

  describe('real Abdominal Distention protocol shape (nested under Associated symptoms)', () => {
    // In the real protocol JSON, "Site" is not top-level — it is a nested
    // child of "Associated symptoms" ("ID-942204976"), only present once
    // "Abdominal pain" is checked there. Its own FHIR text is "Site"; the
    // real wording lives in the display extension.
    const realSiteQuestion: AyuQuestion = {
      linkId: 'ID-1222159742',
      text: 'Site',
      type: 'choice',
      extension: [
        {
          url: 'https://intelehealth.org/fhir/StructureDefinition/display',
          valueString: ABDOMINAL_PAIN_LOCATION_TEXT,
        },
      ],
      enableWhen: [
        {
          question: 'ID-942204976',
          operator: '=',
          answerCoding: { code: 'ID_1055037560' },
        },
      ],
      answerOption: abdominalRegions,
    };
    const associatedSymptoms: AyuQuestion = {
      linkId: 'ID-942204976',
      text: 'Associated symptoms',
      type: 'choice',
      repeats: true,
      answerOption: [region('ID_1055037560', 'Abdominal pain')],
      item: [realSiteQuestion],
    };

    it('should find Question 1 nested two levels deep, not just at the top level', () => {
      const answers = { 'ID-1222159742': ['RHC'] };
      expect(
        getAbdominalPainLocationSelections([associatedSymptoms], answers)
      ).toEqual(new Set([identityOf('Upper (R) - Right Hypochondrium')]));
    });

    it('should still return an empty set when Question 1 exists but is not yet answered (symptom not checked)', () => {
      expect(
        getAbdominalPainLocationSelections([associatedSymptoms], {})
      ).toEqual(new Set());
    });

    it('should not crash and returns an empty set for a sibling question whose options never overlap Question 1\'s (real "Radiation" shape)', () => {
      // The real protocol's "Radiation" question ("Does the pain go to other
      // part of the body?*") and its own nested "Yes" branch use entirely
      // different codes/labels ("to the chest/neck", "to the back") — no
      // overlap with Site's abdominal regions at all. isPainRadiatesOptionDisabled
      // must simply find nothing to disable, not error.
      const radiationYesOptions = [
        region('ID_419003548', 'to the chest/neck'),
        region('ID_872125040', 'to the back'),
      ];
      const answers = { 'ID-1222159742': ['RHC'] };
      const selections = getAbdominalPainLocationSelections(
        [associatedSymptoms],
        answers
      );
      for (const opt of radiationYesOptions) {
        expect(
          isPainRadiatesOptionDisabled(
            getOptionLocationIdentity(opt),
            selections
          )
        ).toBe(false);
      }
    });
  });
});

describe('getPainRadiatesToSelections', () => {
  const buildAnswers = (
    entries: Array<[string, AyuAnswerValue]>
  ): Record<string, AyuAnswerValue> => Object.fromEntries(entries);

  it('should return an empty set when "Pain radiates to" is not present at all', () => {
    expect(getPainRadiatesToSelections([], {})).toEqual(new Set());
  });

  it('should return an empty set when "Pain radiates to" has no answer yet', () => {
    expect(
      getPainRadiatesToSelections([radiatesQuestion], {})
    ).toEqual(new Set());
  });

  it('should return the single selected location, as its normalized display identity', () => {
    const answers = buildAnswers([['pain-radiates-to', ['RHC']]]);
    expect(
      getPainRadiatesToSelections([radiatesQuestion], answers)
    ).toEqual(new Set([identityOf('Upper (R) - Right Hypochondrium')]));
  });

  it('should return every selected location for a multi-select answer, including Q2-only locations', () => {
    const answers = buildAnswers([
      ['pain-radiates-to', ['RHC', 'CHEST', 'GROIN']],
    ]);
    expect(
      getPainRadiatesToSelections([radiatesQuestion], answers)
    ).toEqual(
      new Set([
        identityOf('Upper (R) - Right Hypochondrium'),
        identityOf('Chest'),
        identityOf('Groin'),
      ])
    );
  });

  it('should reflect a changed selection, not a stale one', () => {
    const topLevelItems = [radiatesQuestion];
    const before = getPainRadiatesToSelections(
      topLevelItems,
      buildAnswers([['pain-radiates-to', ['RHC']]])
    );
    const after = getPainRadiatesToSelections(
      topLevelItems,
      buildAnswers([['pain-radiates-to', ['SACRAL']]])
    );
    expect(before).toEqual(new Set([identityOf('Upper (R) - Right Hypochondrium')]));
    expect(after).toEqual(new Set([identityOf('Sacral region')]));
  });

  it('should return an empty set once the selection is cleared', () => {
    const cleared = getPainRadiatesToSelections(
      [radiatesQuestion],
      buildAnswers([['pain-radiates-to', undefined]])
    );
    expect(cleared).toEqual(new Set());
  });

  it('should ignore an unrelated protocol with no "Pain radiates to" question present', () => {
    const onset: AyuQuestion = {
      linkId: 'onset',
      text: 'Onset',
      type: 'choice',
      answerOption: [region('SUD', 'Sudden'), region('GRAD', 'Gradual')],
    };
    const answers = buildAnswers([['onset', 'SUD']]);
    expect(getPainRadiatesToSelections([onset], answers)).toEqual(new Set());
  });

  it('should find "Pain radiates to" nested under Question 2, not just at the top level', () => {
    // Real shape: "Pain radiates to" is a nested child of "Radiation"
    // ("Does the pain move..."), revealed only once its "Pain radiates to"
    // option is selected.
    const nestedRadiatesQuestion: AyuQuestion = {
      ...radiatesQuestion,
      linkId: 'nested-pain-radiates-to',
      enableWhen: [
        {
          question: 'radiation',
          operator: '=',
          answerCoding: { code: 'RADIATES' },
        },
      ],
    };
    const radiationQuestion: AyuQuestion = {
      linkId: 'radiation',
      text: 'Radiation',
      type: 'choice',
      answerOption: [
        region('NOMOVE', 'Does not move'),
        region('RADIATES', 'Pain radiates to'),
      ],
      item: [nestedRadiatesQuestion],
    };
    const answers = { 'nested-pain-radiates-to': ['CHEST'] };
    expect(
      getPainRadiatesToSelections([radiationQuestion], answers)
    ).toEqual(new Set([identityOf('Chest')]));
  });
});

describe('isPainRadiatesOptionDisabled', () => {
  it('should return false when there is no Question 1 selection yet', () => {
    for (const code of ['RHC', 'EPI', 'LIF']) {
      expect(isPainRadiatesOptionDisabled(code, new Set())).toBe(false);
    }
  });

  it('should return true for the single option matching the Question 1 selection', () => {
    const selected = new Set(['RHC']);
    expect(isPainRadiatesOptionDisabled('RHC', selected)).toBe(true);
  });

  it('should return true for every option matching multiple Question 1 selections', () => {
    const selected = new Set(['RHC', 'UMB', 'LIF']);
    expect(isPainRadiatesOptionDisabled('RHC', selected)).toBe(true);
    expect(isPainRadiatesOptionDisabled('UMB', selected)).toBe(true);
    expect(isPainRadiatesOptionDisabled('LIF', selected)).toBe(true);
  });

  it('should return false for a non-matching option', () => {
    const selected = new Set(['RHC', 'UMB']);
    expect(isPainRadiatesOptionDisabled('EPI', selected)).toBe(false);
  });

  it('should return false for an additional radiation-only location, never present on Question 1', () => {
    const selected = new Set(['RHC']);
    for (const code of [
      'RSHOULDER',
      'RSCAPULA',
      'GROIN',
      'SACRAL',
      'FLANKS',
      'CHEST',
    ]) {
      expect(isPainRadiatesOptionDisabled(code, selected)).toBe(false);
    }
  });

  it('should return false when selectedPainLocations is undefined', () => {
    expect(isPainRadiatesOptionDisabled('RHC', undefined)).toBe(false);
  });

  it('should return false for an empty option identifier', () => {
    expect(isPainRadiatesOptionDisabled('', new Set(['RHC']))).toBe(false);
  });

  it('should not be hardcoded to any specific option — works for whichever locations are selected', () => {
    const selected = new Set(['CHEST', 'SACRAL']);
    expect(isPainRadiatesOptionDisabled('CHEST', selected)).toBe(true);
    expect(isPainRadiatesOptionDisabled('SACRAL', selected)).toBe(true);
    expect(isPainRadiatesOptionDisabled('RHC', selected)).toBe(false);
  });

  it('should work symmetrically for a Question 1 option checked against a "Pain radiates to" selection', () => {
    // The same function powers both directions of the rule — it has no idea
    // which side is "Question 1" and which is "Pain radiates to".
    const q2Selected = new Set([identityOf('Upper (R) - Right Hypochondrium')]);
    expect(
      isPainRadiatesOptionDisabled(
        identityOf('Upper (R) - Right Hypochondrium'),
        q2Selected
      )
    ).toBe(true);
    expect(
      isPainRadiatesOptionDisabled(identityOf('Epigastric'), q2Selected)
    ).toBe(false);
  });
});

describe('getPainRadiatesConflictMessage', () => {
  it('should name Q2 as the conflict source for a blocked Question 1 option', () => {
    // A Question 1 option is only ever blocked because it is already
    // selected on "Pain radiates to" — Question 1's own current answer is
    // always exempt (see getSelectedLocationIdentities / the !isSelected
    // check in AyuSelectableOptionGroup) — so the message names Q2, the
    // question the user is NOT currently looking at.
    expect(getPainRadiatesConflictMessage(siteQuestion)).toBe(
      'This option is already selected in Q2. Please select another option.'
    );
  });

  it('should name Q1 as the conflict source for a blocked "Pain radiates to" option', () => {
    expect(getPainRadiatesConflictMessage(radiatesQuestion)).toBe(
      'This option is already selected in Q1. Please select another option.'
    );
  });

  it('should return undefined for an unrelated question', () => {
    const onset: AyuQuestion = {
      linkId: 'onset',
      text: 'Onset',
      type: 'choice',
      answerOption: [region('SUD', 'Sudden')],
    };
    expect(getPainRadiatesConflictMessage(onset)).toBeUndefined();
  });
});
