import type { AyuJsonItem } from '../types/ayu-json.types';
import type { AyuAnswerOption, AyuQuestion } from '../types/ayu.types';
import { ASSOCIATED_SYMPTOMS_TEXT } from './constants';
import {
  questionnaireMatchesDemographics,
  transformFhirToAyu,
  type PatientDemographics,
} from './fhir-to-ayu.util';

export const MERGED_ASSOCIATED_SYMPTOMS_LINK_ID =
  '__merged_associated_symptoms__';

const optionCode = (opt: AyuAnswerOption): string | undefined =>
  opt.valueCoding?.code || opt.valueString || undefined;

/**
 * Dedup AS options by their rendered display first — across protocols the
 * same conceptual option (e.g. "Other [describe]") frequently has different
 * codes, so a code-only key would let visible duplicates through. Display
 * matches across protocols are first-wins; remaining cases fall back to code
 * or valueString. Prefixes prevent cross-namespace collisions.
 */
const optionDedupKey = (opt: AyuAnswerOption): string | undefined => {
  const display = opt.valueCoding?.display?.trim().toLowerCase();
  if (display) return `display:${display}`;
  const code = opt.valueCoding?.code?.trim().toLowerCase();
  if (code) return `code:${code}`;
  const str = opt.valueString?.trim().toLowerCase();
  if (str) return `string:${str}`;
  return undefined;
};

function deriveProtocolCode(complaint: AyuJsonItem): string {
  return complaint.name.replace(/\.json$/i, '').trim();
}

function prefixForest(nodes: AyuQuestion[], prefix: string): AyuQuestion[] {
  const linkIdMap = new Map<string, string>();

  const collect = (n: AyuQuestion) => {
    linkIdMap.set(n.linkId, `${prefix}:${n.linkId}`);
    n.item?.forEach(collect);
  };
  nodes.forEach(collect);

  const apply = (n: AyuQuestion): AyuQuestion => ({
    ...n,
    // collect() registered every node apply() visits, so the fallback is unreachable.
    /* v8 ignore next */
    linkId: linkIdMap.get(n.linkId) ?? n.linkId,
    protocolCode: prefix,
    enableWhen: n.enableWhen?.map(rule => ({
      ...rule,
      question: linkIdMap.get(rule.question) ?? rule.question,
    })),
    item: n.item?.map(apply),
  });

  return nodes.map(apply);
}

function splitAssociatedSymptoms(items: AyuQuestion[]): {
  remaining: AyuQuestion[];
  associatedSymptomGroups: AyuQuestion[];
} {
  const remaining: AyuQuestion[] = [];
  const associatedSymptomGroups: AyuQuestion[] = [];
  for (const item of items) {
    if (item.type === 'choice' && item.text === ASSOCIATED_SYMPTOMS_TEXT) {
      associatedSymptomGroups.push(item);
    } else {
      remaining.push(item);
    }
  }
  return { remaining, associatedSymptomGroups };
}

function rewriteASChildEnableWhen(
  child: AyuQuestion,
  sourceASLinkId: string
): AyuQuestion {
  return {
    ...child,
    enableWhen: child.enableWhen?.map(rule =>
      rule.question === sourceASLinkId
        ? { ...rule, question: MERGED_ASSOCIATED_SYMPTOMS_LINK_ID }
        : rule
    ),
    item: child.item?.map(c => rewriteASChildEnableWhen(c, sourceASLinkId)),
  };
}

function mergeAssociatedSymptomGroups(
  groups: AyuQuestion[]
): AyuQuestion | null {
  if (groups.length === 0) return null;

  const seenKeys = new Set<string>();
  const keptCodes = new Set<string>();
  const droppedCodes = new Set<string>();
  const mergedOptions: AyuAnswerOption[] = [];

  for (const group of groups) {
    for (const opt of group.answerOption ?? []) {
      const key = optionDedupKey(opt);
      const code = optionCode(opt);
      if (!key) continue;
      if (seenKeys.has(key)) {
        if (code) droppedCodes.add(code);
        continue;
      }
      seenKeys.add(key);
      if (code) keptCodes.add(code);
      mergedOptions.push(opt);
    }
  }

  const mergedChildren: AyuQuestion[] = [];
  const seenChildLinkIds = new Set<string>();
  for (const group of groups) {
    // transformItem always sets item to an array, so the fallback is unreachable.
    /* v8 ignore next */
    for (const child of group.item ?? []) {
      const refsDroppedOnly = child.enableWhen?.length
        ? child.enableWhen.every(rule => {
            const ruleCode = rule.answerCoding?.code;
            return (
              !!ruleCode &&
              droppedCodes.has(ruleCode) &&
              !keptCodes.has(ruleCode)
            );
          })
        : false;
      if (refsDroppedOnly) continue;
      if (seenChildLinkIds.has(child.linkId)) continue;
      seenChildLinkIds.add(child.linkId);
      mergedChildren.push(rewriteASChildEnableWhen(child, group.linkId));
    }
  }

  const first = groups[0];
  return {
    linkId: MERGED_ASSOCIATED_SYMPTOMS_LINK_ID,
    text: ASSOCIATED_SYMPTOMS_TEXT,
    type: 'choice',
    required: groups.some(g => g.required),
    repeats: first.repeats,
    answerOption: mergedOptions,
    item: mergedChildren.length ? mergedChildren : undefined,
  };
}

/**
 * Merge selected protocol questionnaires into a single AyuQuestion root.
 *
 * Behaviour:
 *  - 0 complaints → null
 *  - 1 complaint → exactly `transformFhirToAyu(json, demographics)` (no prefix,
 *    no synthesized AS block) — guarantees zero behaviour change for the
 *    existing single-protocol flow
 *  - 2+ complaints → one root group containing every protocol's questions in
 *    selection order, followed by a single merged Associated symptoms group.
 *    Main questions are NOT deduped across protocols — only the AS answer
 *    options are deduped by code. Nested AS children (revealed via
 *    enableWhen on a Yes answer) are folded into the merged AS group with
 *    their `enableWhen.question` rewritten from the original per-protocol AS
 *    linkId to the merged linkId so they still render.
 *
 * LinkIds inside each protocol get a `<protocolCode>:` prefix and every
 * `enableWhen` reference inside that protocol is rewritten in lockstep, so
 * intra-protocol enable rules continue to resolve. Demographics gating is
 * delegated to `transformFhirToAyu` per protocol and `questionnaireMatchesDemographics`
 * at the top level, so age/gender/mutually-exclusive extensions survive intact.
 */
export function mergeProtocols(
  complaints: AyuJsonItem[],
  demographics?: PatientDemographics
): AyuQuestion | null {
  if (!complaints || complaints.length === 0) return null;

  const eligible = complaints.filter(c =>
    questionnaireMatchesDemographics(c.json, demographics)
  );
  if (eligible.length === 0) return null;

  if (eligible.length === 1) {
    return transformFhirToAyu(eligible[0].json, demographics);
  }

  const flattenedItems: AyuQuestion[] = [];
  const allAssociatedSymptomGroups: AyuQuestion[] = [];

  for (const complaint of eligible) {
    const transformed = transformFhirToAyu(complaint.json, demographics);
    if (!transformed?.item?.length) continue;

    const code = deriveProtocolCode(complaint);
    const prefixedChildren = prefixForest(transformed.item, code);
    const { remaining, associatedSymptomGroups } =
      splitAssociatedSymptoms(prefixedChildren);
    allAssociatedSymptomGroups.push(...associatedSymptomGroups);
    flattenedItems.push(...remaining);
  }

  const mergedAS = mergeAssociatedSymptomGroups(allAssociatedSymptomGroups);
  const rootItems = [...flattenedItems, ...(mergedAS ? [mergedAS] : [])];

  if (rootItems.length === 0) return null;

  return {
    linkId: 'root',
    type: 'group',
    item: rootItems,
  };
}

/**
 * Split a flat answers map produced by the multi-protocol stepper into
 * per-protocol buckets plus a separate associated-symptoms entry. Pass through
 * any unprefixed linkIds under `unknown` so legacy/single-protocol callers
 * don't lose data.
 */
export function groupAnswersByProtocol<T>(answers: Record<string, T>): {
  byProtocol: Record<string, Record<string, T>>;
  associatedSymptoms: T | null;
  unknown: Record<string, T>;
} {
  const byProtocol: Record<string, Record<string, T>> = {};
  const unknown: Record<string, T> = {};
  let associatedSymptoms: T | null = null;

  for (const [linkId, value] of Object.entries(answers)) {
    if (linkId === MERGED_ASSOCIATED_SYMPTOMS_LINK_ID) {
      associatedSymptoms = value;
      continue;
    }
    const colon = linkId.indexOf(':');
    if (colon === -1) {
      unknown[linkId] = value;
      continue;
    }
    const code = linkId.slice(0, colon);
    const bare = linkId.slice(colon + 1);
    if (!byProtocol[code]) byProtocol[code] = {};
    byProtocol[code][bare] = value;
  }

  return { byProtocol, associatedSymptoms, unknown };
}
