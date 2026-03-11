import type { AyuAnswerValue, AyuQuestion } from '../types/ayu.types';

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

export function buildVisitSummary(
  questionnaire: AyuQuestion[],
  answersMap: Map<string, AyuAnswerValue>,
  sectionTitle: string
): SummarySection[] {
  const mainItems: SummaryItem[] = [];
  const associatedItems: SummaryItem[] = [];
  const processed = new Set<string>();

  function getExtensionLabel(item: AyuQuestion): string {
    const ext = item.extension?.find(
      e => e.url === 'urn:intelehealth:original-question-text'
    );
    return ext?.valueString || item.text || '';
  }

  function getAnswerValue(item: AyuQuestion) {
    return answersMap.get(item.linkId);
  }

  function getDisplay(item: AyuQuestion, code: string): string | null {
    const opt = item.answerOption?.find(o => o.valueCoding?.code === code);
    return opt?.valueCoding?.display || null;
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

  function collectNestedOwnValues(nestedItem: AyuQuestion): string[] {
    const answer = getAnswerValue(nestedItem);
    if (!answer) return [];

    const itemLabel = getExtensionLabel(nestedItem);
    if (typeof answer === 'string' && answer === itemLabel) return [];

    if (Array.isArray(answer) && nestedItem.answerOption) {
      if (nestedItem.item?.length) return [];

      return answer
        .map((code: string) => getDisplay(nestedItem, code))
        .filter(Boolean) as string[];
    }

    const formatted = formatAnswerByType(nestedItem, answer);
    return formatted ? [formatted] : [];
  }

  function processItems(items: AyuQuestion[]) {
    items?.forEach(item => {
      if (processed.has(item.linkId)) return;

      const answerValue = getAnswerValue(item);
      const label = getExtensionLabel(item);

      // Associated Symptoms Special Handling
      const isAssociatedSymptoms =
        item.type === 'choice' &&
        item.extension?.some(
          ext =>
            ext.url === 'urn:intelehealth:original-question-text' &&
            ext.valueString === 'Associated symptoms'
        );

      if (isAssociatedSymptoms) {
        if (Array.isArray(answerValue)) {
          const reports: string[] = [];
          const denies: string[] = [];

          answerValue.forEach(code => {
            const isNegated = code.startsWith('NO_ID_');
            const lookupCode = isNegated ? code.replace('NO_', '') : code;
            const display = getDisplay(item, lookupCode);
            if (!display) return;

            let displayValue = display;

            const matchingChildren =
              item.item?.filter((child: AyuQuestion) =>
                child.enableWhen?.some(cond => cond.answerCoding?.code === code)
              ) || [];

            if (matchingChildren.length > 0) {
              const nestedValues: string[] = [];

              matchingChildren.forEach((nested: AyuQuestion) => {
                nestedValues.push(...collectNestedOwnValues(nested));

                nested.item?.forEach((deepChild: AyuQuestion) => {
                  const deepAnswer = getAnswerValue(deepChild);
                  if (!deepAnswer) return;
                  const formatted = formatAnswerByType(deepChild, deepAnswer);
                  if (formatted) nestedValues.push(formatted);
                  processed.add(deepChild.linkId);
                });
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
              heading: 'Patient reports',
              values: [reports.join(', ') + '.'],
            });
          }

          if (denies.length) {
            associatedItems.push({
              type: 'subheading',
              heading: 'Patient denies',
              values: [denies.join(', ') + '.'],
            });
          }
        }

        processed.add(item.linkId);
        return;
      }

      // Multi Select
      if (Array.isArray(answerValue) && item.answerOption) {
        const values: string[] = [];

        answerValue.forEach(code => {
          const display = getDisplay(item, code);
          if (!display) return;

          const nested = item.item?.find((child: AyuQuestion) =>
            child.enableWhen?.some(cond => cond.answerCoding?.code === code)
          );

          if (nested) {
            const nestedLabel = getExtensionLabel(nested);
            const nestedValues: string[] = collectNestedOwnValues(nested);

            nested.item?.forEach((deepChild: AyuQuestion) => {
              const deepAnswer = getAnswerValue(deepChild);
              if (!deepAnswer) return;

              const formatted = formatAnswerByType(deepChild, deepAnswer);
              if (formatted) nestedValues.push(formatted);
              processed.add(deepChild.linkId);
            });

            if (nestedValues.length) {
              values.push(`${nestedLabel} - ${nestedValues.join(' - ')}`);
            } else {
              values.push(nestedLabel);
            }
            processed.add(nested.linkId);
          } else {
            values.push(display);
          }
        });

        if (values.length) {
          mainItems.push({
            type: 'labelValue',
            label,
            value: values.join(', '),
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
            const hasOptionItemMapping =
              !!nested.answerOption?.length && !!nested.item?.length;

            nested.item?.forEach((deepChild: AyuQuestion) => {
              const deepAnswer = getAnswerValue(deepChild);
              if (!deepAnswer) return;

              const formatted = formatAnswerByType(deepChild, deepAnswer);
              if (!formatted) {
                processed.add(deepChild.linkId);
                return;
              }

              if (hasOptionItemMapping) {
                const childLabel = getExtensionLabel(deepChild);
                nestedValues.push(
                  childLabel ? `${childLabel} ${formatted}` : formatted
                );
              } else {
                nestedValues.push(formatted);
              }
              processed.add(deepChild.linkId);
            });

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
    sections.push({ title: 'Associated symptoms', items: associatedItems });
  }

  return sections;
}
