import {
  ADDITIONAL_INSTRUCTION_PREFIX,
  DOCTOR_ENCOUNTER_TYPES,
} from '../services/prescription.constant';

/** The parts of a visit encounter needed to find the doctor's provider. */
interface DoctorEncounter<Provider> {
  encounterDatetime: string;
  encounterType?: { display?: string } | null;
  encounterProviders?: { provider?: Provider | null }[] | null;
}

// A missing or invalid date counts as the oldest, so the order stays defined.
const timeOf = (iso: string) => new Date(iso).getTime() || 0;

/**
 * The single provider whose details are shown as the doctor: the first
 * provider of the latest Visit Complete encounter, else of the latest Visit
 * Note. Other encounter types belong to the health worker and are never used.
 * Choosing one provider keeps a doctor's name, signature, qualification and
 * registration number together. Shared by every screen that shows the doctor.
 */
export function pickDoctorProvider<Provider>(
  encounters: DoctorEncounter<Provider>[]
): Provider | undefined {
  for (const type of DOCTOR_ENCOUNTER_TYPES) {
    const sameType = encounters
      .filter(e => e.encounterType?.display === type)
      .sort(
        (a, b) => timeOf(b.encounterDatetime) - timeOf(a.encounterDatetime)
      );
    for (const enc of sameType) {
      for (const ep of enc.encounterProviders || []) {
        if (ep.provider) return ep.provider;
      }
    }
  }
  return undefined;
}

/**
 * The doctor webapp stores additional instructions as
 * `[ADDITIONAL_INSTRUCTION]<text>` in the Advice concept. Removes that marker,
 * and the space after it, from the start of an advice item.
 */
export const stripAdditionalInstructionPrefix = (advice: string) =>
  advice.startsWith(ADDITIONAL_INSTRUCTION_PREFIX)
    ? advice.slice(ADDITIONAL_INSTRUCTION_PREFIX.length).trimStart()
    : advice;
