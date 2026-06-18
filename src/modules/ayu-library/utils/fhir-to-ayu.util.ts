import type {
  AyuAnswerOption,
  AyuEnableWhen,
  AyuQuestion,
  AyuQuestionType,
} from '../types/ayu.types';
import type {
  FhirEnableWhen,
  FhirExtension,
  FhirItem,
  FhirQuestionnaire,
} from '../types/fhir-raw.types';
import {
  EXT_URL_AGE_MAX,
  EXT_URL_AGE_MIN,
  EXT_URL_GENDER,
  EXT_URL_IS_EXCLUSIVE_OPTION,
  EXT_URL_ITEM_CONTROL,
  EXT_URL_JOB_AID_FILE,
  EXT_URL_JOB_AID_TYPE,
  EXT_URL_LANGUGAE_TEXT,
  EXT_URL_PE_CATEGORY_LABEL,
  PE_OPTION_LANG_MARKER_PICTURE_TAKEN,
  EXT_URL_PE_OPTION_KIND,
  EXT_URL_PE_QUESTION_KEY,
  EXT_URL_PE_SECTION_KEY,
  GENDER_CODE_FEMALE,
  GENDER_CODE_MALE,
  GENDER_CODE_OTHER,
  PE_OPTION_KIND_CAMERA,
} from './constants';
import { getRowLabel } from './question.utils';

const ALLOWED_TYPES: AyuQuestionType[] = [
  'group',
  'display',
  'string',
  'integer',
  'decimal',
  'date',
  'choice',
  'quantity',
];
export function normalizeType(type: string): AyuQuestionType {
  if (ALLOWED_TYPES.includes(type as AyuQuestionType)) {
    return type as AyuQuestionType;
  }

  throw new Error(`Unsupported FHIR item type: ${type}`);
}

function normalizeEnableWhen(
  raw?: FhirEnableWhen[]
): AyuEnableWhen[] | undefined {
  if (!raw) return undefined;

  return raw.map(r => {
    if (r.operator !== '=' && r.operator !== '!=' && r.operator !== 'exists') {
      throw new Error(`Unsupported enableWhen operator: ${r.operator}`);
    }

    return {
      question: r.question,
      operator: r.operator,
      answerBoolean: r.answerBoolean,
      answerString: r.answerString,
      answerCoding: r.answerCoding,
    };
  });
}

export interface PatientDemographics {
  age?: number | null;
  gender?: string | null;
}

export function parsePatientAgeYears(
  raw: string | number | null | undefined
): number | null {
  if (raw == null || raw === '') return null;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : null;

  const str = String(raw).trim();
  if (!str) return null;

  const numericMatch = str.match(
    /^(\d+(?:\.\d+)?)(?:\s*(?:y|yr|yrs|year|years))?$/i
  );
  if (numericMatch) return Number(numericMatch[1]);

  const date = new Date(str);
  if (!Number.isNaN(date.getTime())) {
    const now = new Date();
    let age = now.getFullYear() - date.getFullYear();
    const m = now.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < date.getDate())) age--;
    return age >= 0 ? age : null;
  }
  return null;
}

// Normalize any gender representation to the canonical extension code; returns null when unclassifiable.
export function normalizePatientGenderCode(
  raw: string | null | undefined
): string | null {
  if (raw == null) return null;
  const s = String(raw).trim().toLowerCase();
  if (!s) return null;
  if (s === 'f' || s === 'female' || s === GENDER_CODE_FEMALE)
    return GENDER_CODE_FEMALE;
  if (s === 'm' || s === 'male' || s === GENDER_CODE_MALE)
    return GENDER_CODE_MALE;
  if (s === 'o' || s === 'other') return GENDER_CODE_OTHER;
  return null;
}

function readExt(
  extensions: FhirExtension[] | undefined,
  url: string
): string | undefined {
  return extensions?.find(e => e.url === url)?.valueString;
}

// True when an item's gender/age-min/age-max extensions allow the current patient; missing constraints fail open.
export function matchesDemographics(
  extensions: FhirExtension[] | undefined,
  demographics?: PatientDemographics
): boolean {
  if (!extensions || extensions.length === 0) return true;
  if (!demographics) return true;

  const requiredGenderRaw = readExt(extensions, EXT_URL_GENDER);
  if (requiredGenderRaw) {
    const requiredGender = normalizePatientGenderCode(requiredGenderRaw);
    const patientGender = normalizePatientGenderCode(demographics.gender);
    if (requiredGender && patientGender && patientGender !== requiredGender) {
      return false;
    }
  }

  const ageMinRaw = readExt(extensions, EXT_URL_AGE_MIN);
  const ageMaxRaw = readExt(extensions, EXT_URL_AGE_MAX);
  if (ageMinRaw || ageMaxRaw) {
    const age = demographics.age;
    if (age != null) {
      const min = ageMinRaw ? Number(ageMinRaw) : Number.NEGATIVE_INFINITY;
      const max = ageMaxRaw ? Number(ageMaxRaw) : Number.POSITIVE_INFINITY;
      if (!Number.isNaN(min) && age < min) return false;
      if (!Number.isNaN(max) && age > max) return false;
    }
  }

  return true;
}

function transformItem(
  item: AyuQuestion,
  demographics?: PatientDemographics
): AyuQuestion {
  const originalChildren = item.item ?? [];

  const children = originalChildren
    .filter(child => matchesDemographics(child.extension, demographics))
    .map(child => transformItem(child, demographics));

  const isOptionOrphanedByDemographics = (optCode: string): boolean => {
    const enabledChildren = originalChildren.filter(child =>
      child.enableWhen?.some(rule => rule.answerCoding?.code === optCode)
    );
    if (enabledChildren.length === 0) return false;
    return enabledChildren.every(
      child => !matchesDemographics(child.extension, demographics)
    );
  };

  const answerOption = item.answerOption?.filter(opt => {
    if (!matchesDemographics(opt.extension, demographics)) return false;
    const code = opt.valueCoding?.code || opt.valueString;
    if (code && isOptionOrphanedByDemographics(code)) return false;
    return true;
  });

  return {
    linkId: item.linkId,
    text: item.text,
    _text: item._text,

    type: normalizeType(item.type),

    required: item.required,
    readOnly: item.readOnly,
    repeats: item.repeats,

    answerOption,
    enableWhen: normalizeEnableWhen(item.enableWhen),
    extension: item.extension,
    item: children,
  };
}

// True when the questionnaire's top-level demographic extensions match the patient.
export function questionnaireMatchesDemographics(
  questionnaire: FhirQuestionnaire | null | undefined,
  demographics?: PatientDemographics
): boolean {
  if (!questionnaire) return true;
  return matchesDemographics(questionnaire.extension, demographics);
}

export function transformFhirToAyu(
  questionnaire: FhirQuestionnaire,
  demographics?: PatientDemographics
): AyuQuestion | null {
  if (!questionnaire.item || questionnaire.item.length === 0) {
    return null;
  }

  // Wrap root items into a single AYU root group
  const items = questionnaire.item
    .filter(item => matchesDemographics(item.extension, demographics))
    .map(item => transformItem(item, demographics));

  return {
    linkId: 'root',
    type: 'group',
    text: questionnaire.title,
    item: items,
  };
}

//resolve-label.ts
export function resolveLabel(
  question: AyuQuestion,
  parent?: AyuQuestion,
  previousSibling?: AyuQuestion
): string | undefined {
  // Question text itself
  if (question?.extension !== undefined) {
    return getRowLabel(question);
  }

  // Previous display item
  if (
    previousSibling?.type === 'display' &&
    previousSibling.extension !== undefined
  ) {
    return getRowLabel(question);
  }

  // Parent group text
  if (parent?.type === 'group' && parent.extension !== undefined) {
    return getRowLabel(question);
  }

  return question?.text;
}

/* =========================================
 * Physical Exam FHIR → AyuQuestion transform
 *
 * The Physical Exam FHIR Questionnaire is shaped differently from a Visit
 * Reason questionnaire: top-level items are *sections* (Hands, Throat, …),
 * each section's answerOption[] is a concept-tag index used for question
 * labels, and the actual answerable questions are section.item[] of
 * type=choice with an optional type=attachment child for camera capture.
 *
 * We flatten that into a single AyuQuestion root group containing one
 * AyuQuestion per answerable question, with section/category metadata
 * attached via EXT_URL_PE_* extensions and the camera tile (if any)
 * appended as an extra answerOption marked with EXT_URL_PE_OPTION_KIND.
 * ========================================= */

function titleCasePhysExam(s: string): string {
  return s
    .split(' ')
    .map(w => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function stripTrailingAsterisk(s: string): string {
  return s.replace(/\*+$/, '').trim();
}

function isCheckBoxItem(item: FhirItem): boolean {
  const ext = item.extension?.find(e => e.url === EXT_URL_ITEM_CONTROL);
  return (
    ext?.valueCodeableConcept?.coding?.some(c => c.code === 'check-box') ??
    false
  );
}

/**
 * Physical Exam questions are often wrapped one level deep: a "concept-tag"
 * choice with a single answerOption whose code corresponds to a nested choice
 * item that carries the real question text, answer options, and (optionally)
 * an attachment child for camera capture.
 *
 *   wrapper (choice, text="Eyes: Jaundice")
 *     answerOption: [{ code: X, display: "Is there jaundice?*" }]
 *     item:
 *       inner (choice, gated on wrapper via enableWhen)
 *         answerOption: [Yes, No]
 *         item: [{ type: "attachment", ... }]
 *
 * Detection uses the inner's `enableWhen` edge back to the wrapper rather
 * than answerOption-code-vs-linkId matching. The real physExam.json has
 * inconsistent hyphen/underscore conventions between the two (e.g. wrapper
 * answerOption code "ID_1109515145" vs. inner linkId "ID-1109515145"), so a
 * literal-string match misses some wrappers ("Nail anemia"); the enableWhen
 * reference is data-consistent.
 *
 * Returns the inner choice when the pattern is detected, else null.
 */
function findWrappedInnerChoice(q: FhirItem): FhirItem | null {
  // Caller (transformFhirPhysExamToAyu) only invokes this on choice items, so
  // no defensive type check needed here.
  if (!q.answerOption || q.answerOption.length !== 1) return null;
  const inner = (q.item ?? []).find(
    c =>
      c.type === 'choice' && c.enableWhen?.some(ew => ew.question === q.linkId)
  );
  return inner ?? null;
}

/**
 * Fully unwrap a chain of concept-tag wrappers down to the innermost real
 * question. physExam.json can nest wrappers more than one level deep — e.g.
 * "Tenderness" (single concept-tag option) → "Yes" (single concept-tag option)
 * → "Select the location" (the real question with the location options). Each
 * level is detected the same way (single answerOption + a nested choice whose
 * enableWhen points back at it), so follow the chain until the target is no
 * longer a wrapper. Stopping after one level (as findWrappedInnerChoice alone
 * does) surfaces the inner wrapper's lone concept-tag option instead of the
 * real options, so a question like "Tenderness=Yes" shows a single
 * "Select the location…" tile with no locations under it.
 *
 * Descends strictly into child items, so the loop always terminates (finite
 * tree). Returns the innermost target and whether any unwrap happened, so the
 * caller can keep the OUTERMOST wrapper's text as the body-part:finding label.
 */
function unwrapWrappedChoice(q: FhirItem): {
  target: FhirItem;
  didUnwrap: boolean;
} {
  let target = q;
  let didUnwrap = false;
  for (
    let inner = findWrappedInnerChoice(target);
    inner;
    inner = findWrappedInnerChoice(target)
  ) {
    target = inner;
    didUnwrap = true;
  }
  return { target, didUnwrap };
}

/**
 * A choice question is a *branching sub-form* when — after unwrapping any
 * concept-tag wrappers — its target still has child items that are real
 * follow-up questions (not the camera attachment, not a display note), each
 * gated via enableWhen. Example: "Skin Rash" → Yes → { How many? (integer),
 * How is the surface? (choice), What colour? (string), … }.
 *
 * These cannot be flattened into a single tile of answerOptions the way a
 * leaf question (Tenderness → location list, Jaundice → Yes/No) can, so they
 * are kept as a nested tree and rendered by the same AyuNestedRenderer the
 * Visit Reason flow uses.
 */
function hasSubQuestionChildren(item: FhirItem): boolean {
  return (item.item ?? []).some(
    c => c.type !== 'attachment' && c.type !== 'display'
  );
}

/**
 * Build a branching PE question by preserving its full subtree (reusing the
 * Visit Reason `transformItem` recursion so enableWhen / nested items / mixed
 * input types survive intact) and attaching the PE section/category/question
 * metadata to the top node. The metadata keeps two things working:
 *   - resolveAyuComponent still routes the top node to `physicalExamOptions`
 *     (it keys on EXT_URL_PE_SECTION_KEY), and
 *   - the protocol perform-physical-exam filter still matches on section/
 *     question keys.
 */
/**
 * Remove attachment (camera) descendants from a raw FHIR item tree *before* it
 * is run through `transformItem`. Two reasons this must happen up front:
 *   - `normalizeType` throws on type 'attachment', so transformItem can't walk
 *     a subtree that still contains one.
 *   - `resolveAyuComponent` has no 'attachment' case (falls back to a text
 *     box), and PE camera capture is driven by the physicalExamOptions tile,
 *     not the nested renderer.
 * Camera capture inside a branching sub-form is a follow-up; for now the
 * follow-up *questions* render and the camera child is dropped.
 */
function stripFhirAttachmentDescendants(item: FhirItem): FhirItem {
  if (!item.item?.length) return item;
  return {
    ...item,
    item: item.item
      .filter(c => c.type !== 'attachment')
      .map(stripFhirAttachmentDescendants),
  };
}

/**
 * Collapse a branching wrapper into a single Yes/No-style question whose
 * follow-ups appear once the affirmative branch is chosen.
 *
 * Raw FHIR shape (e.g. "Skin Rash"):
 *   wrapper (choice, answerOption=[concept-tag "Is there any rash?"])
 *     item:
 *       "No"  (gated on the concept-tag)             ← a terminal branch
 *       "Yes" (gated on the concept-tag, has sub-questions)
 *       attachment (camera)
 *
 * Produced AyuQuestion:
 *   text   = the concept-tag display ("Is there any rash?")
 *   options = one per branch child  → [No, Yes]   (code = branch linkId)
 *   item   = each branch's sub-questions, re-gated via enableWhen onto THIS
 *            question's branch option, so picking "Yes" reveals all of them.
 *
 * The top node keeps the PE section/category/question metadata so it still
 * routes to the physicalExamOptions tile renderer and matches the protocol
 * filter; the lifted sub-questions render through the same AyuNestedRenderer
 * the Visit Reason flow uses.
 */
function buildBranchingPhysExamQuestion(
  q: FhirItem,
  sectionKey: string,
  categoryLabel: string,
  questionKey: string,
  demographics?: PatientDemographics
): AyuQuestion | null {
  if (!matchesDemographics(q.extension, demographics)) return null;

  const conceptDisplay = q.answerOption?.[0]?.valueCoding?.display;
  const questionText = stripTrailingAsterisk(conceptDisplay ?? q.text ?? '');

  // Branch children = the wrapper's own gated children, minus the camera tile.
  /* v8 ignore next */
  const branches = (q.item ?? []).filter(
    c =>
      c.type !== 'attachment' &&
      c.type !== 'display' &&
      c.enableWhen?.some(ew => ew.question === q.linkId) &&
      matchesDemographics(c.extension, demographics)
  );
  if (branches.length === 0) return null;

  const peExt: FhirExtension[] = [
    { url: EXT_URL_PE_SECTION_KEY, valueString: sectionKey },
    { url: EXT_URL_PE_CATEGORY_LABEL, valueString: categoryLabel },
    { url: EXT_URL_PE_QUESTION_KEY, valueString: questionKey },
  ];
  const passthroughExt = (q.extension ?? []).filter(
    e => e.url === EXT_URL_JOB_AID_TYPE || e.url === EXT_URL_JOB_AID_FILE
  );

  // One answer option per branch (No / Yes), coded by the branch's linkId.
  const answerOption: AyuAnswerOption[] = branches.map(b => ({
    valueCoding: {
      code: b.linkId,
      display: stripTrailingAsterisk(b.text ?? ''),
    },
  }));

  // Lift each branch's sub-questions and re-gate them onto this question's
  // branch option, so selecting that branch reveals all of its follow-ups.
  const item: AyuQuestion[] = [];
  for (const branch of branches) {
    const subTree = transformItem(
      stripFhirAttachmentDescendants(branch) as unknown as AyuQuestion,
      demographics
    );
    /* v8 ignore next */
    for (const sub of subTree.item ?? []) {
      item.push({
        ...sub,
        enableWhen: [
          {
            question: q.linkId,
            operator: '=',
            answerCoding: { code: branch.linkId },
          },
        ],
      });
    }
  }

  return {
    linkId: q.linkId,
    text: questionText,
    type: 'choice',
    required: q.required === true,
    answerOption,
    extension: [...peExt, ...passthroughExt],
    item,
  };
}

function buildPhysExamCameraOption(child: FhirItem): AyuAnswerOption | null {
  if (child.type !== 'attachment') return null;
  /* Use the attachment's own linkId as the camera answer code. The previous
   * `enableWhen[0].answerCoding.code` derivation collided with a real option:
   * cameras are commonly gated on the Yes/No codes (enableBehavior "any"), so
   * the first enableWhen code is the "No" code — capturing a picture then
   * recorded "No" instead of "Picture Taken". The linkId is unique within the
   * question, so it can never shadow a Yes/No choice. */
  const cameraCode = child.linkId;
  /* The stored `display` is what the stepper's answered-card view reads back
   * for a committed camera answer. It must read "Picture Taken" — the tile
   * itself renders a hardcoded "Take a Picture" label and ignores this
   * field. The raw FHIR `language` extension carries marker strings like
   * "[picture taken]" that must never reach the UI. */
  const isExclusive =
    child.extension?.find(e => e.url === EXT_URL_IS_EXCLUSIVE_OPTION)
      ?.valueString === 'true';
  const extension: FhirExtension[] = [
    { url: EXT_URL_PE_OPTION_KIND, valueString: PE_OPTION_KIND_CAMERA },
  ];
  if (isExclusive) {
    extension.push({ url: EXT_URL_IS_EXCLUSIVE_OPTION, valueString: 'true' });
  }
  return {
    valueCoding: { code: cameraCode, display: 'Picture Taken' },
    extension,
  };
}

function buildPhysExamQuestion(
  q: FhirItem,
  sectionKey: string,
  categoryLabel: string,
  questionKey: string,
  demographics?: PatientDemographics
): AyuQuestion | null {
  /* v8 ignore next */
  if (q.type !== 'choice') return null;
  if (!matchesDemographics(q.extension, demographics)) return null;

  const questionText = stripTrailingAsterisk(q.text ?? '');

  const peExt: FhirExtension[] = [
    { url: EXT_URL_PE_SECTION_KEY, valueString: sectionKey },
    { url: EXT_URL_PE_CATEGORY_LABEL, valueString: categoryLabel },
    { url: EXT_URL_PE_QUESTION_KEY, valueString: questionKey },
  ];
  const passthroughExt = (q.extension ?? []).filter(
    e => e.url === EXT_URL_JOB_AID_TYPE || e.url === EXT_URL_JOB_AID_FILE
  );

  /* Drop camera-proxy answerOptions. They are not user-facing choices — they
   * are a proxy for the attachment child below, which we surface separately
   * as the camera tile. Without this, the option renders as a duplicate
   * "Take a picture" tile next to the real camera tile.
   *
   * Two detection strategies (either triggers removal):
   *  1. The `language` extension carries the "[picture taken]" marker.
   *  2. When the question has attachment children (i.e. a camera tile will
   *     be generated), any option whose display text is "take a picture"
   *     (case-insensitive) is also a proxy — some FHIR data omits the
   *     language marker.
   *
   * Real choices like Yes/No are preserved because their display text does
   * not match the camera-proxy pattern. */
  const hasAttachmentChild = (q.item ?? []).some(c => c.type === 'attachment');
  const answerOption: AyuAnswerOption[] = (q.answerOption ?? [])
    .filter(opt => {
      const langExt = opt.extension?.find(e => e.url === EXT_URL_LANGUGAE_TEXT);
      if (langExt?.valueString === PE_OPTION_LANG_MARKER_PICTURE_TAKEN)
        return false;
      if (hasAttachmentChild) {
        const display = (opt.valueCoding?.display ?? opt.valueString ?? '')
          .toLowerCase()
          .trim();
        if (display === 'take a picture') return false;
      }
      return true;
    })
    .map(opt => ({
      valueString: opt.valueString,
      valueInteger: opt.valueInteger,
      valueDate: opt.valueDate,
      valueCoding: opt.valueCoding,
      extension: opt.extension,
    }));

  for (const child of q.item ?? []) {
    const cameraOpt = buildPhysExamCameraOption(child);
    if (cameraOpt) {
      answerOption.push(cameraOpt);
      break; // Only one camera tile per question
    }
  }

  return {
    linkId: q.linkId,
    text: questionText,
    type: 'choice',
    required: q.required === true,
    repeats: isCheckBoxItem(q),
    answerOption,
    extension: [...peExt, ...passthroughExt],
  };
}

/**
 * Flatten a Physical Exam FHIR Questionnaire into an AyuQuestion root group.
 *
 * Tree (FHIR) → Flat (AyuQuestion):
 *   Questionnaire.item[]                  → root.item[]
 *     section.answerOption[]              → concept-tag index for sibling questions
 *     section.item[] (type=choice)        → root.item[i] with PE metadata
 *       question.answerOption[]           → root.item[i].answerOption[]
 *       question.item[] (type=attachment) → camera option appended to answerOption
 */
export function transformFhirPhysExamToAyu(
  questionnaire: FhirQuestionnaire,
  demographics?: PatientDemographics
): AyuQuestion | null {
  if (!questionnaire.item || questionnaire.item.length === 0) return null;

  const flatQuestions: AyuQuestion[] = [];

  for (const section of questionnaire.item) {
    if (!matchesDemographics(section.extension, demographics)) continue;

    const sectionText = section.text ?? '';
    const sectionKey = titleCasePhysExam(sectionText);

    const conceptTags = (section.answerOption ?? [])
      .map(o => o.valueCoding?.display)
      .filter((d): d is string => typeof d === 'string');

    const choiceItems = (section.item ?? []).filter(i => i.type === 'choice');

    choiceItems.forEach((q, idx) => {
      const { target, didUnwrap } = unwrapWrappedChoice(q);
      // When unwrapping, the OUTERMOST wrapper's text (e.g., "Eyes: Jaundice"
      // or "Tenderness") is the body-part:finding label users see in the
      // summary; prefer it over the inner question's text ("Is there
      // jaundice?" / "Select the location…").
      const wrapperText = didUnwrap
        ? stripTrailingAsterisk(q.text ?? '')
        : undefined;
      const conceptTag = conceptTags[idx];
      const questionText = stripTrailingAsterisk(target.text ?? '');
      const categoryLabel = wrapperText ?? conceptTag ?? questionText;
      const questionKey = categoryLabel;

      /* A branching sub-form (Skin Rash → Yes → several follow-up questions of
       * mixed types) cannot be flattened into a single tile. Keep the original
       * outer item `q` as a nested tree so the same AyuNestedRenderer the Visit
       * Reason flow uses can render the follow-ups; everything else flattens. */
      const transformed = hasSubQuestionChildren(target)
        ? buildBranchingPhysExamQuestion(
            q,
            sectionKey,
            categoryLabel,
            questionKey,
            demographics
          )
        : buildPhysExamQuestion(
            target,
            sectionKey,
            categoryLabel,
            questionKey,
            demographics
          );
      if (transformed) flatQuestions.push(transformed);
    });
  }

  return {
    linkId: 'root',
    type: 'group',
    text: questionnaire.title,
    item: flatQuestions,
  };
}
