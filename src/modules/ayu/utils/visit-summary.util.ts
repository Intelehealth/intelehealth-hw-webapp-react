import type { ModalSection } from '../../../components/modal/global-modal-context';
import type {
  AyuAnswerValue,
  AyuQuestion,
} from '../../ayu-library/types/ayu.types';
import type { BuildSummaryOptions } from '../../ayu-library/logic/visit-summary.logic';
import { buildVisitSummary as buildVisitSummaryCore } from '../../ayu-library/logic/visit-summary.logic';

/**
 * Build visit summary sections, returning web-specific ModalSection[].
 * Delegates to the portable library function and maps the result.
 */
export function buildVisitSummary(
  questionnaire: AyuQuestion[],
  answersMap: Map<string, AyuAnswerValue>,
  sectionTitle: string,
  options?: BuildSummaryOptions
): ModalSection[] {
  const sections = buildVisitSummaryCore(
    questionnaire,
    answersMap,
    sectionTitle,
    options
  );

  // SummarySection is structurally compatible with ModalSection
  return sections as ModalSection[];
}
