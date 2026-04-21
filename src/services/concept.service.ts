import type { ConceptAnswer } from '../types/config.types';
import { OpenMRSApi } from './openmrs';

interface OpenMRSConceptAnswer {
  uuid: string;
  display: string;
}

interface OpenMRSConceptResponse {
  answers: OpenMRSConceptAnswer[];
}

/**
 * Fetch the coded answers for an OpenMRS concept by UUID.
 * Used for vitals with datatype "Coded" (e.g. Blood Typing).
 */
export async function fetchConceptAnswers(
  conceptUuid: string
): Promise<ConceptAnswer[]> {
  const res = await OpenMRSApi.get<OpenMRSConceptResponse>(
    `/concept/${conceptUuid}?v=custom:(answers:(uuid,display))`,
    { headers: { loader: false } }
  );
  return (res.answers ?? []).map(a => ({ uuid: a.uuid, display: a.display }));
}
