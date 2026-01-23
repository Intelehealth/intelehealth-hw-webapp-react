import type { AyuQuestion, FhirQuestionnaire } from '../types/ayu.types';

function transformItem(item: AyuQuestion): AyuQuestion {
  return {
    linkId: item.linkId,
    type: item.type as AyuQuestion['type'],
    text: item.text,
    required: item.required,
    readOnly: item.readOnly,
    repeats: item.repeats,
    answerOption: item.answerOption,
    item: item.item?.map(transformItem),
  };
}

export function transformFhirToAyu(
  questionnaire: FhirQuestionnaire
): AyuQuestion | null {
  if (!questionnaire.item || questionnaire.item.length === 0) {
    return null;
  }

  // Wrap multiple root items into a single AYU root group
  if (questionnaire.item.length > 1) {
    return {
      linkId: 'root',
      type: 'group',
      text: questionnaire.resourceType,
      item: questionnaire.item.map(transformItem),
    };
  }

  return transformItem(questionnaire.item[0]);
}

//resolve-label.ts
export function resolveLabel(
  question: AyuQuestion,
  parent?: AyuQuestion,
  previousSibling?: AyuQuestion
): string | undefined {
  // 1️⃣ Question text itself
  if (question.text) return question.text;

  // 2️⃣ Previous display item
  if (previousSibling?.type === 'display' && previousSibling.text) {
    return previousSibling.text;
  }

  // 3️⃣ Parent group text
  if (parent?.type === 'group' && parent.text) {
    return parent.text;
  }

  return undefined;
}
