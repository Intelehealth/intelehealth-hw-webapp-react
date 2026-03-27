import type { AyuAnswerValue, AyuQuestion } from '../types/ayu.types';
import {
  ASSOCIATED_SYMPTOMS_TEXT,
  EXT_URL_DISPLAY_TEXT,
  EXT_URL_LANGUGAE_TEXT,
  NEGATED_ID_PREFIX,
  NEGATED_PREFIX,
  PATIENT_DENIES_LABEL,
  PATIENT_REPORTS_LABEL,
} from '../utils/constants';
import {
  isStrictAssociatedSymptoms,
  resolveAyuComponent,
} from './decision-matrix';
import { isMutuallyExclusiveOption } from './stepper.logic';

/** Portable summary item — platform-agnostic equivalent of ModalSectionItem */
export type SummaryItem =
  | { type: 'labelValue'; label: string; value: string | number | null }
  | { type: 'subheading'; heading: string; values: string[] };

/** Portable summary section — platform-agnostic equivalent of ModalSection */
export interface SummarySection {
  title: string;
  items: SummaryItem[];
  onChange?: () => void;
}

export interface BuildSummaryOptions {
  /** When true, all associated symptoms are displayed as labelValue items
   *  instead of the "Patient reports/denies" format. Used for medical history. */
  useLabeledFormat?: boolean;
}

export function buildVisitSummary(
  questionnaire: AyuQuestion[],
  answersMap: Map<string, AyuAnswerValue>,
  sectionTitle: string,
  options?: BuildSummaryOptions
): SummarySection[] {
  const useLabeledFormat = options?.useLabeledFormat ?? false;
  const mainItems: SummaryItem[] = [];
  const associatedItems: SummaryItem[] = [];
  const processed = new Set<string>();

  function getExtensionLabel(item: AyuQuestion): string {
    const ext = item.extension?.find(e => e.url === EXT_URL_DISPLAY_TEXT);
    return item.extension?.find(e => e.url === EXT_URL_LANGUGAE_TEXT)
      ?.valueString === '%'
      ? ext?.valueString || ''
      : item.text || '';
  }

  function getAnswerValue(item: AyuQuestion) {
    return answersMap.get(item.linkId);
  }

  function getDisplay(item: AyuQuestion, code: string): string | null {
    const opt = item.answerOption?.find(
      o => o.valueCoding?.code === code || o.valueString === code
    );
    const langValue = opt?.extension?.find(
      ext => ext.url === EXT_URL_LANGUGAE_TEXT
    )?.valueString;
    if (langValue && langValue !== '%') return langValue;
    return opt?.valueCoding?.display || opt?.valueString || null;
  }

  function formatAnswerByType(
    item: AyuQuestion,
    answer: AyuAnswerValue
  ): string | null {
    if (!answer) return null;

    switch (item.type) {
      case 'integer':
        return String(answer);

      case 'string':
        return typeof answer === 'string' ? answer : null;

      case 'quantity':
        if (typeof answer === 'object' && !Array.isArray(answer)) {
          if ('dropdownValues' in answer) {
            const { number, days } = answer.dropdownValues || {};
            if (number) return days ? `${number} ${days}` : String(number);
          }
          if ('value' in answer) {
            const { value, unit } = answer;
            if (value != null) {
              return unit ? `${value} ${unit}` : String(value);
            }
          }
        }
        return null;

      case 'choice':
        return typeof answer === 'string' ? getDisplay(item, answer) : null;

      default:
        return typeof answer === 'string' ? answer : null;
    }
  }

  /** Recursively collect display values from all descendants of a question. */
  function collectDescendantValues(items: AyuQuestion[] | undefined): string[] {
    if (!items) return [];
    const values: string[] = [];
    for (const child of items) {
      if (processed.has(child.linkId)) continue;
      values.push(...collectNestedOwnValues(child));
      processed.add(child.linkId);
      values.push(...collectDescendantValues(child.item));
    }
    return values;
  }

  function collectNestedOwnValues(nestedItem: AyuQuestion): string[] {
    const answer = getAnswerValue(nestedItem);
    if (!answer) return [];

    const itemLabel = getExtensionLabel(nestedItem);
    if (typeof answer === 'string' && answer === itemLabel) return [];

    if (Array.isArray(answer) && nestedItem.answerOption) {
      const values: string[] = [];

      answer.forEach((code: string) => {
        const display = getDisplay(nestedItem, code);
        if (!display) return;

        // Check if this selected code has matching child items with their own answers
        const matchingChild = nestedItem.item?.find((child: AyuQuestion) =>
          child.enableWhen?.some(cond => cond.answerCoding?.code === code)
        );

        if (matchingChild) {
          const childValues = collectNestedOwnValues(matchingChild);
          childValues.push(...collectDescendantValues(matchingChild.item));

          if (childValues.length) {
            values.push(`${display} - ${childValues.join(', ')}`);
          } else {
            values.push(display);
          }
          processed.add(matchingChild.linkId);
        } else {
          values.push(display);
        }
      });

      return values;
    }

    const formatted = formatAnswerByType(nestedItem, answer);
    return formatted ? [formatted] : [];
  }

  /**
   * Collect nested values including their question labels.
   * Used for patient/family history summary formatting.
   * Format: "label – value" for each nested field.
   */
  function collectLabeledValues(item: AyuQuestion, parts: string[]) {
    const answer = getAnswerValue(item);
    if (!answer) return;

    const itemLabel = item.text || '';

    if (Array.isArray(answer) && item.answerOption) {
      const displayValues: string[] = [];

      answer.forEach((code: string) => {
        const display = getDisplay(item, code);
        if (!display) return;

        // Check if this option has a nested child with answers
        const child = item.item?.find((c: AyuQuestion) =>
          c.enableWhen?.some(cond => cond.answerCoding?.code === code)
        );

        if (child && !processed.has(child.linkId)) {
          const childParts: string[] = [];
          collectLabeledValues(child, childParts);
          processed.add(child.linkId);

          if (childParts.length) {
            displayValues.push(`${display} – ${childParts.join(', ')}`);
          } else {
            displayValues.push(display);
          }
        } else {
          displayValues.push(display);
        }
      });

      if (displayValues.length) {
        parts.push(displayValues.join(', '));
      }
    } else {
      const formatted = formatAnswerByType(item, answer);
      if (formatted) {
        // For string/text describe fields, just output the value — the parent option
        // already provides context, so adding the label would cause duplication
        // (e.g., "[Describe relation] – [Describe relation] – value")
        if (item.type === 'string') {
          parts.push(formatted);
        } else {
          parts.push(itemLabel ? `${itemLabel} – ${formatted}` : formatted);
        }
      }
    }

    // Process remaining children
    item.item?.forEach((child: AyuQuestion) => {
      if (processed.has(child.linkId)) return;
      const childAnswer = getAnswerValue(child);
      if (childAnswer !== undefined) {
        collectLabeledValues(child, parts);
        processed.add(child.linkId);
      }
    });
  }

  function processItems(items: AyuQuestion[]) {
    items?.forEach(item => {
      if (processed.has(item.linkId)) return;

      const answerValue = getAnswerValue(item);
      const label = getExtensionLabel(item);

      // Associated Symptoms Special Handling
      const isAssociatedSymptoms =
        resolveAyuComponent(item) === 'associatedSymptoms';

      if (isAssociatedSymptoms) {
        if (!useLabeledFormat && isStrictAssociatedSymptoms(item)) {
          // True associated symptoms → Patient reports/denies format
          if (Array.isArray(answerValue)) {
            const reports: string[] = [];
            const denies: string[] = [];

            answerValue.forEach(code => {
              const isNegated = code.startsWith(NEGATED_ID_PREFIX);
              const lookupCode = isNegated
                ? code.replace(NEGATED_PREFIX, '')
                : code;
              const display = getDisplay(item, lookupCode);
              if (!display) return;

              let displayValue = display;

              const matchingChildren =
                item.item?.filter((child: AyuQuestion) =>
                  child.enableWhen?.some(
                    cond => cond.answerCoding?.code === code
                  )
                ) || [];

              if (matchingChildren.length > 0) {
                const nestedValues: string[] = [];

                matchingChildren.forEach((nested: AyuQuestion) => {
                  nestedValues.push(...collectNestedOwnValues(nested));
                  nestedValues.push(...collectDescendantValues(nested.item));
                  processed.add(nested.linkId);
                });

                if (nestedValues.length) {
                  displayValue += ` - ${nestedValues.join(' - ')}`;
                }
              }

              if (isNegated) {
                denies.push(displayValue);
              } else {
                reports.push(displayValue);
              }
            });

            if (reports.length) {
              associatedItems.push({
                type: 'subheading',
                heading: PATIENT_REPORTS_LABEL,
                values: [reports.join(', ') + '.'],
              });
            }

            if (denies.length) {
              associatedItems.push({
                type: 'subheading',
                heading: PATIENT_DENIES_LABEL,
                values: [denies.join(', ') + '.'],
              });
            }
          }
        } else {
          // Patient history / Family history → labelValue format
          if (Array.isArray(answerValue)) {
            const langExt = item.extension?.find(
              e => e.url === EXT_URL_LANGUGAE_TEXT
            );
            const isPercentLabel = langExt?.valueString === '%';
            const summaryLabel = isPercentLabel
              ? ''
              : langExt?.valueString || item.text || '';

            // Separate positive codes and negated "None" (exclusive) option
            const positiveCodes: string[] = [];
            let exclusiveNoDisplay: string | null = null;
            answerValue.forEach(code => {
              if (code.startsWith(NEGATED_PREFIX)) {
                // Show the mutually exclusive (None) option even when answered "No"
                const lookupCode = code.slice(NEGATED_PREFIX.length);
                if (isMutuallyExclusiveOption(item, lookupCode)) {
                  exclusiveNoDisplay = getDisplay(item, lookupCode);
                }
              } else {
                positiveCodes.push(code);
              }
            });

            // Family history: show question text as subheading
            if (isPercentLabel && item.text) {
              mainItems.push({
                type: 'subheading',
                heading: item.text.replace(/\*$/, ''),
                values: [],
              });
            }

            positiveCodes.forEach(code => {
              const display = getDisplay(item, code);
              if (!display) return;

              // Collect nested values with their labels
              const matchingChildren =
                item.item?.filter((child: AyuQuestion) =>
                  child.enableWhen?.some(
                    cond => cond.answerCoding?.code === code
                  )
                ) || [];

              const labeledParts: string[] = [];
              matchingChildren.forEach((nested: AyuQuestion) => {
                collectLabeledValues(nested, labeledParts);
                processed.add(nested.linkId);
              });

              if (isPercentLabel) {
                // Family history: each condition as its own labelValue
                mainItems.push({
                  type: 'labelValue',
                  label: display,
                  value: labeledParts.length ? labeledParts.join(', ') : ' ',
                });
              } else {
                // Patient history: "Medical history" → "Diabetes – date | Current medication – value | ..."
                const valueStr = labeledParts.length
                  ? `${display} – ${labeledParts.join(' | ')}`
                  : display;
                mainItems.push({
                  type: 'labelValue',
                  label: summaryLabel,
                  value: valueStr,
                });
              }
            });

            // Show the exclusive (None) option when answered No
            if (exclusiveNoDisplay) {
              if (isPercentLabel) {
                mainItems.push({
                  type: 'labelValue',
                  label: exclusiveNoDisplay,
                  value: ' ',
                });
              } else {
                mainItems.push({
                  type: 'labelValue',
                  label: summaryLabel,
                  value: exclusiveNoDisplay,
                });
              }
            }
          }
        }

        processed.add(item.linkId);
        return;
      }

      // Multi Select
      if (Array.isArray(answerValue) && item.answerOption) {
        const flatValues: string[] = [];

        answerValue.forEach(code => {
          const display = getDisplay(item, code);
          if (!display) return;

          const nested = item.item?.find((child: AyuQuestion) =>
            child.enableWhen?.some(cond => cond.answerCoding?.code === code)
          );

          if (nested) {
            const nestedValues: string[] = collectNestedOwnValues(nested);
            nestedValues.push(...collectDescendantValues(nested.item));

            // Combine option display with nested values inline
            if (nestedValues.length) {
              flatValues.push(`${display} – ${nestedValues.join(', ')}`);
            } else {
              flatValues.push(display);
            }
            processed.add(nested.linkId);
          } else {
            flatValues.push(display);
          }
        });

        if (flatValues.length) {
          mainItems.push({
            type: 'labelValue',
            label,
            value: flatValues.join(', '),
          });
        }

        processed.add(item.linkId);
      }

      // Single Select
      else if (
        answerValue &&
        typeof answerValue === 'string' &&
        item.answerOption
      ) {
        const display = getDisplay(item, answerValue);

        const matchingNested =
          item.item?.filter((child: AyuQuestion) =>
            child.enableWhen?.some(
              cond => cond.answerCoding?.code === answerValue
            )
          ) || [];

        if (matchingNested.length > 0) {
          const allNestedValues: string[] = [];

          matchingNested.forEach((nested: AyuQuestion) => {
            const nestedValues: string[] = collectNestedOwnValues(nested);
            nestedValues.push(...collectDescendantValues(nested.item));

            allNestedValues.push(...nestedValues);
            processed.add(nested.linkId);
          });

          if (allNestedValues.length) {
            mainItems.push({
              type: 'labelValue',
              label,
              value: `${display} - ${allNestedValues.join(', ')}`,
            });
          } else {
            mainItems.push({
              type: 'labelValue',
              label,
              value: display || '',
            });
          }
        } else if (display) {
          mainItems.push({
            type: 'labelValue',
            label,
            value: display,
          });
        }

        processed.add(item.linkId);
      }

      // Simple Types (string, integer, quantity)
      else if (answerValue) {
        if (typeof answerValue === 'string' && answerValue === label) {
          processed.add(item.linkId);
        } else {
          const formatted = formatAnswerByType(item, answerValue);
          if (formatted) {
            mainItems.push({
              type: 'labelValue',
              label,
              value: formatted,
            });
          }

          processed.add(item.linkId);
        }
      }

      // Process children recursively
      if (item.item?.length) {
        processItems(item.item);
      }
    });
  }

  processItems(questionnaire);

  const sections: SummarySection[] = [];

  if (mainItems.length > 0) {
    sections.push({ title: sectionTitle, items: mainItems });
  }

  if (associatedItems.length > 0) {
    sections.push({ title: ASSOCIATED_SYMPTOMS_TEXT, items: associatedItems });
  }

  return sections;
}
