import type {
  AyuAnswerOption,
  AyuAnswerValue,
  AyuQuestion,
} from '../types/ayu.types';
import { FHIR_TYPE_CHOICE } from '../utils/constants';
import { getRowLabel } from '../utils/question.utils';
import { isMutuallyExclusiveOption } from './stepper.logic';

/**
 * Real-protocol display text of the abdominal body-location question
 * ("Which part of the abdomen do you feel pain?") — the source of truth for
 * which abdominal locations must be disabled under "Pain radiates to".
 * Matched wherever this exact question occurs (confirmed present, worded
 * identically, in both the Abdominal Distention and Abdominal Pain
 * protocols) — nothing here is specific to one protocol.
 *
 * This is NOT the question's raw FHIR `text` (which, in real protocol JSON,
 * is just "Site" — a generic field name reused across many unrelated
 * questions/protocols, e.g. a leg/knee/hip pain protocol's own "Site"
 * question). The user-facing wording instead lives in a
 * `https://intelehealth.org/fhir/StructureDefinition/display` extension,
 * resolved by the same `getRowLabel` helper this codebase already uses
 * everywhere else to compute a question's displayed label. Matching on that
 * resolved, specific wording — not the generic raw `text` — avoids
 * false-matching another protocol's own differently-worded "Site" question.
 */
export const ABDOMINAL_PAIN_LOCATION_TEXT =
  'Which part of the abdomen do you feel pain?';

/**
 * Trims, lowercases, and strips a trailing "*" (the required-field marker
 * this codebase's own FHIR content uses, e.g. "...feel pain?*") before
 * comparing question text. The same real-world question is authored as
 * required in some protocols and optional in others, with the "*" present
 * or absent accordingly — the wording itself is what identifies it.
 */
const normalizeQuestionText = (text: string): string =>
  text.replace(/\*+$/, '').trim().toLowerCase();

export const isAbdominalPainLocationQuestion = (
  question: AyuQuestion
): boolean =>
  question.type === FHIR_TYPE_CHOICE &&
  normalizeQuestionText(getRowLabel(question)) ===
    normalizeQuestionText(ABDOMINAL_PAIN_LOCATION_TEXT);

/**
 * Real-protocol text of the nested "radiates to" location question, revealed
 * once "Does the pain move to other parts of the body?" is answered "Pain
 * radiates to". Confirmed directly against real protocol data: unlike the
 * body-location question, this one's own FHIR `text` already carries this
 * exact wording (no display-extension override needed).
 */
export const PAIN_RADIATES_TO_TEXT = 'Pain radiates to';

export const isPainRadiatesToQuestion = (question: AyuQuestion): boolean =>
  question.type === FHIR_TYPE_CHOICE &&
  normalizeQuestionText(getRowLabel(question)) ===
    normalizeQuestionText(PAIN_RADIATES_TO_TEXT);

/**
 * Recursively searches `items` and their nested `item` children for a
 * question matching `predicate`. Both the body-location question and the
 * "radiates to" question can be nested arbitrarily deep — e.g. a child of
 * "Associated symptoms", only present once "Abdominal pain" is checked there
 * — not top-level, so a shallow, one-level search is not sufficient. Mirrors
 * the existing recursive-search pattern used by `extractGenderLinkIds`
 * elsewhere in this codebase.
 */
const findQuestion = (
  items: AyuQuestion[],
  predicate: (question: AyuQuestion) => boolean
): AyuQuestion | undefined => {
  for (const item of items) {
    if (predicate(item)) return item;
    if (item.item?.length) {
      const found = findQuestion(item.item, predicate);
      if (found) return found;
    }
  }
  return undefined;
};

const optionCode = (opt: AyuAnswerOption): string =>
  opt.valueCoding?.code || opt.valueString || '';

/**
 * The identifier this business rule actually compares options by: an
 * option's own display text, normalized. NOT its `code`.
 *
 * Confirmed directly against real protocol data (Abdominal Pain
 * questionnaire): Site's "Upper (R) - Right Hypochondrium" option has code
 * ID_1935801557; the "Pain radiates to" question's own option for the exact
 * same location has code ID_758995804 — a different, independently-authored
 * code for the same real-world location, in every protocol checked. Display
 * text (in every translation present) is identical between the two. It is
 * the only identifier actually shared between the two representations, so
 * it — not `code` — is the comparison basis here.
 */
export const getOptionLocationIdentity = (opt: AyuAnswerOption): string =>
  normalizeQuestionText(opt.valueCoding?.display || opt.valueString || '');

/**
 * The locations currently selected on `question`, as the same normalized
 * display-text identity `getOptionLocationIdentity` computes for any option
 * — so a question found via a different predicate can be compared against
 * it even though the two assign that location different codes.
 *
 * An "All over" style option — marked exclusive/all-encompassing via the
 * same FHIR extension `isMutuallyExclusiveOption` already uses to drive a
 * question's own single-selection behavior — means every other location on
 * that question applies, not just the option literally selected. No option
 * label is hardcoded here: this is the existing, generic exclusive-option
 * marker, so any protocol's own "cover everything" option is recognized the
 * same way, on either side of this business rule.
 */
const getSelectedLocationIdentities = (
  question: AyuQuestion | undefined,
  answers: Record<string, AyuAnswerValue>
): Set<string> => {
  if (!question) return new Set();

  const value = answers[question.linkId];
  const selectedCodes = Array.isArray(value)
    ? value
    : typeof value === 'string' && value
      ? [value]
      : [];

  const options = question.answerOption ?? [];

  const coversEveryLocation = selectedCodes.some(code =>
    isMutuallyExclusiveOption(question, code)
  );

  const effectiveOptions = coversEveryLocation
    ? options.filter(
        opt => !isMutuallyExclusiveOption(question, optionCode(opt))
      )
    : options.filter(opt => selectedCodes.includes(optionCode(opt)));

  return new Set(effectiveOptions.map(getOptionLocationIdentity));
};

/**
 * The abdominal locations currently selected on Question 1 ("Which part of
 * the abdomen do you feel pain?").
 *
 * Derived fresh from `topLevelItems` + `answers` on every call, so it always
 * reflects the current selection: there is no separate `disabledOptions`
 * state to keep in sync or go stale when a selection is added, removed, or
 * the questionnaire is revisited.
 */
export const getAbdominalPainLocationSelections = (
  topLevelItems: AyuQuestion[],
  answers: Record<string, AyuAnswerValue>
): Set<string> =>
  getSelectedLocationIdentities(
    findQuestion(topLevelItems, isAbdominalPainLocationQuestion),
    answers
  );

/**
 * The locations currently selected under "Pain radiates to" (Question 2).
 * Same derivation as `getAbdominalPainLocationSelections`, mirrored for the
 * other side of this business rule — selecting a location here must equally
 * prevent selecting it back on Question 1.
 */
export const getPainRadiatesToSelections = (
  topLevelItems: AyuQuestion[],
  answers: Record<string, AyuAnswerValue>
): Set<string> =>
  getSelectedLocationIdentities(
    findQuestion(topLevelItems, isPainRadiatesToQuestion),
    answers
  );

/**
 * Should this option be disabled because the same location is already
 * selected on the other side of this business rule (Question 1 vs. "Pain
 * radiates to")?
 *
 * The single source of truth for this business rule — a pure comparison of
 * `locationOption` (from `getOptionLocationIdentity`) against
 * `selectedLocations` (from `getAbdominalPainLocationSelections` or
 * `getPainRadiatesToSelections` — the same identity space either way).
 * Data-driven over every location; never hardcodes one option.
 */
export const isPainRadiatesOptionDisabled = (
  locationOption: string,
  selectedLocations: ReadonlySet<string> | undefined
): boolean => !!locationOption && !!selectedLocations?.has(locationOption);

const PAIN_RADIATES_TO_CONFLICT_MESSAGE = `This option is already selected in "${PAIN_RADIATES_TO_TEXT}". Please select another option.`;
const ABDOMINAL_PAIN_LOCATION_CONFLICT_MESSAGE = `This option is already selected in "${ABDOMINAL_PAIN_LOCATION_TEXT}". Please select another option.`;

/**
 * The toast message to show when the user attempts to select a `question`
 * option that is disabled because of the *other* question's selection —
 * `undefined` for any other, unrelated question. Direction-aware and named
 * for the conflict's source, not the question being viewed: a blocked
 * Question 1 option is only ever blocked because it is already selected on
 * "Pain radiates to" (Question 1's own current answer is always exempt via
 * the `!isSelected` check in AyuSelectableOptionGroup — see
 * getSelectedLocationIdentities), so that click names Q2; the reverse names
 * Q1.
 */
export const getPainRadiatesConflictMessage = (
  question: AyuQuestion
): string | undefined => {
  if (isAbdominalPainLocationQuestion(question)) {
    return PAIN_RADIATES_TO_CONFLICT_MESSAGE;
  }
  if (isPainRadiatesToQuestion(question)) {
    return ABDOMINAL_PAIN_LOCATION_CONFLICT_MESSAGE;
  }
  return undefined;
};

/**
 * The identities that should render disabled on `question`, given the
 * current selections on *both* sides of this business rule.
 *
 * Directional by design: Question 1 must only ever be disabled by "Pain
 * radiates to"'s selections, and vice versa — never by a question's own
 * selections. Without this, selecting "All over" on Question 1 (which
 * legitimately expands to every other Question 1 location, so "Pain
 * radiates to" disables all of them) would also disable those same
 * identities back on Question 1 itself, since they belong to the same
 * identity space. That self-application blocked the user from ever
 * clicking a specific location to switch off of "All over" — the click
 * never reached the mutual-exclusion toggle (computeMultiSelectToggle)
 * because AyuSelectableOptionGroup treats a disabled option as
 * unclickable.
 */
export const getDisabledLocationIdentitiesFor = (
  question: AyuQuestion | undefined,
  q1Selections: ReadonlySet<string>,
  q2Selections: ReadonlySet<string>
): Set<string> | undefined => {
  if (!question) return undefined;
  if (isAbdominalPainLocationQuestion(question)) return new Set(q2Selections);
  if (isPainRadiatesToQuestion(question)) return new Set(q1Selections);
  return undefined;
};

export const ALL_OVER_COMBINATION_CONFLICT_MESSAGE =
  '"All over" cannot be selected together with specific abdominal locations. Please review your selection.';

/**
 * True when Question 1's current answer illegally combines the "All over"
 * exclusive option with one or more specific locations.
 *
 * Selecting through the UI can no longer produce this state — every click
 * routes through computeMultiSelectToggle, which always clears one side or
 * the other. This only exists to catch data persisted before that mutual
 * exclusion was enforced (or edited outside the app), so a stale invalid
 * combination is still reported at submit time rather than silently
 * uploaded or silently rewritten.
 */
export const hasInvalidAllOverCombination = (
  question: AyuQuestion,
  answers: Record<string, AyuAnswerValue>
): boolean => {
  if (!isAbdominalPainLocationQuestion(question)) return false;

  const value = answers[question.linkId];
  if (!Array.isArray(value) || value.length < 2) return false;

  const codes = value.filter((c): c is string => typeof c === 'string');
  const hasExclusive = codes.some(code =>
    isMutuallyExclusiveOption(question, code)
  );
  const hasNonExclusive = codes.some(
    code => !isMutuallyExclusiveOption(question, code)
  );
  return hasExclusive && hasNonExclusive;
};

/**
 * Same check as `hasInvalidAllOverCombination`, but locates Question 1
 * itself (which — like "Pain radiates to" — can be nested arbitrarily deep,
 * not just a direct top-level item) instead of requiring the caller to
 * already have a direct reference to it. For validation passes that only
 * have the full top-level item list (e.g. the overall stepper Submit), not
 * whichever single question is currently being submitted.
 */
export const hasInvalidAllOverCombinationInTree = (
  topLevelItems: AyuQuestion[],
  answers: Record<string, AyuAnswerValue>
): boolean => {
  const question = findQuestion(topLevelItems, isAbdominalPainLocationQuestion);
  return question ? hasInvalidAllOverCombination(question, answers) : false;
};

/**
 * Removes any codes from `question`'s current (repeats) answer whose
 * location identity is in `disallowedIdentities`, mutating `updated` in
 * place — same convention as clearHiddenDescendantAnswers, which this is
 * meant to run alongside.
 */
const stripDisallowedLocationCodes = (
  question: AyuQuestion,
  updated: Record<string, AyuAnswerValue>,
  disallowedIdentities: ReadonlySet<string>
): boolean => {
  if (disallowedIdentities.size === 0) return false;

  const value = updated[question.linkId];
  if (!Array.isArray(value)) return false;

  const codes = value.filter((c): c is string => typeof c === 'string');
  const options = question.answerOption ?? [];
  const filtered = codes.filter(code => {
    const opt = options.find(o => optionCode(o) === code);
    return !opt || !disallowedIdentities.has(getOptionLocationIdentity(opt));
  });

  if (filtered.length === codes.length) return false;
  updated[question.linkId] = filtered;
  return true;
};

/**
 * After any answer change, clears whichever side of this business rule now
 * holds a location the *other* side's current selection has made invalid —
 * most notably, Question 1 switching to "All over" must clear any abdominal
 * location already selected under "Pain radiates to", since selecting
 * through the UI can no longer create that combination (disabled options are
 * unclickable) but a pre-existing selection on one side doesn't retroactively
 * un-select itself just because the other side changed underneath it.
 *
 * Symmetric by construction — the same disabled-identity computation already
 * used to render each side's disabled options — so this needs no protocol-
 * specific direction hardcoded: whichever side ends up holding a now-covered
 * location gets it stripped, regardless of which question the user just
 * changed. Call alongside clearHiddenDescendantAnswers in the same central
 * setAnswer path so this applies no matter which question triggered it.
 *
 * Returns the linkId(s) actually modified (empty if neither side needed it)
 * — a deliberately narrow, targeted signal for the caller to know a *specific*
 * other question's answer changed as a side effect (so its own dirty/submit
 * state can be updated too), rather than a generic whole-answers diff, which
 * would also pick up unrelated incidental value shifts elsewhere.
 */
export const clearInvalidPainLocationAnswers = (
  topLevelItems: AyuQuestion[],
  updated: Record<string, AyuAnswerValue>
): string[] => {
  const q1 = findQuestion(topLevelItems, isAbdominalPainLocationQuestion);
  const q2 = findQuestion(topLevelItems, isPainRadiatesToQuestion);
  if (!q1 || !q2) return [];

  const q1Selections = getSelectedLocationIdentities(q1, updated);
  const q2Selections = getSelectedLocationIdentities(q2, updated);

  const modified: string[] = [];
  if (stripDisallowedLocationCodes(q2, updated, q1Selections)) {
    modified.push(q2.linkId);
  }
  if (stripDisallowedLocationCodes(q1, updated, q2Selections)) {
    modified.push(q1.linkId);
  }
  return modified;
};
