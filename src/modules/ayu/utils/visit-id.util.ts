import { storage } from '../../../utils/storage';
import { getResource } from '../services/temp-storage.service';

/**
 * Per-patient ayu "visit id" management + in-progress detection.
 *
 * The visit id is a client-generated UUID stored in localStorage and used as the
 * temp-storage resource id for the in-progress visit. Kept in its own module so
 * both the StartVisit context and the patient profile screen can share it
 * without a circular import.
 */
const VISIT_ID_STORAGE_KEY = 'temp_visit_id';

export function visitIdStorageKey(patientUuid: string | null): string {
  return patientUuid
    ? `${VISIT_ID_STORAGE_KEY}_${patientUuid}`
    : VISIT_ID_STORAGE_KEY;
}

export function getOrCreateVisitId(patientUuid: string | null): string {
  const key = visitIdStorageKey(patientUuid);
  const existing = storage.get(key);
  if (existing) return existing;
  const id = crypto.randomUUID();
  storage.set(key, id);
  return id;
}

/**
 * Forget the in-progress visit for a patient. The next time the assessment is
 * opened a fresh visit id is minted, so all tab data starts empty ("start over").
 */
export function clearVisitForPatient(patientUuid: string | null): void {
  storage.remove(visitIdStorageKey(patientUuid));
}

/** The section slots a saved visit can contain. */
type VisitProgressData = {
  vitals?: unknown;
  visitReason?: unknown;
  physicalExam?: unknown;
  medicalHistory?: unknown;
};

const hasAnySection = (data: VisitProgressData | null | undefined): boolean =>
  !!(
    data?.vitals ||
    data?.visitReason ||
    data?.physicalExam ||
    data?.medicalHistory
  );

/**
 * True when the patient has a saved, not-yet-uploaded assessment with at least
 * one section filled in. Used to decide whether to prompt "Continue or Start
 * Over?" before opening the assessment.
 */
export async function hasInProgressVisit(
  patientUuid: string | null
): Promise<boolean> {
  if (!patientUuid) return false;
  const visitId = storage.get(visitIdStorageKey(patientUuid));
  if (!visitId) return false;
  try {
    const res = await getResource<VisitProgressData>('visit', visitId);
    const record = res?.data;
    if (!record) return false;
    // Guard against a stale key pointing at another patient's record.
    if (record.parent_id && record.parent_id !== patientUuid) return false;
    return hasAnySection(record.data);
  } catch {
    return false;
  }
}
