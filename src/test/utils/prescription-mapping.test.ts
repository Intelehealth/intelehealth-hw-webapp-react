import { describe, expect, it } from 'vitest';
import {
  pickDoctorProvider,
  stripAdditionalInstructionPrefix,
} from '../../utils/prescription-mapping';

type Provider = { name: string };

const encounter = (
  type: string | undefined,
  datetime: string,
  providers?: (Provider | null)[] | null
) => ({
  encounterDatetime: datetime,
  encounterType: type === undefined ? undefined : { display: type },
  encounterProviders: providers
    ? providers.map(provider => ({ provider }))
    : providers,
});

const jane: Provider = { name: 'Jane' };
const omar: Provider = { name: 'Omar' };
const healthWorker: Provider = { name: 'Health Worker' };

describe('pickDoctorProvider', () => {
  it('returns undefined when there are no encounters', () => {
    expect(pickDoctorProvider<Provider>([])).toBeUndefined();
  });

  it('returns the provider of a Visit Complete encounter', () => {
    expect(
      pickDoctorProvider([encounter('Visit Complete', '2026-03-01T10:00:00', [jane])])
    ).toBe(jane);
  });

  it('never uses a health worker encounter, even when it is listed first', () => {
    expect(
      pickDoctorProvider([
        encounter('ADULTINITIAL', '2026-03-01T09:00:00', [healthWorker]),
        encounter('Visit Complete', '2026-03-01T10:00:00', [jane]),
      ])
    ).toBe(jane);
  });

  it('returns undefined when only health worker encounters have a provider', () => {
    expect(
      pickDoctorProvider([
        encounter('ADULTINITIAL', '2026-03-01T09:00:00', [healthWorker]),
        encounter('Vitals', '2026-03-01T09:30:00', [healthWorker]),
      ])
    ).toBeUndefined();
  });

  it('ignores an encounter that has no type', () => {
    expect(
      pickDoctorProvider([
        encounter(undefined, '2026-03-01T09:00:00', [healthWorker]),
        { encounterDatetime: '2026-03-01T09:30:00', encounterType: null, encounterProviders: [{ provider: healthWorker }] },
      ])
    ).toBeUndefined();
  });

  it('prefers Visit Complete over Visit Note, whichever is listed first', () => {
    const note = encounter('Visit Note', '2026-03-05T10:00:00', [omar]);
    const complete = encounter('Visit Complete', '2026-03-01T10:00:00', [jane]);
    expect(pickDoctorProvider([note, complete])).toBe(jane);
    expect(pickDoctorProvider([complete, note])).toBe(jane);
  });

  it('falls back to Visit Note when no Visit Complete has a provider', () => {
    expect(
      pickDoctorProvider([
        encounter('Visit Complete', '2026-03-05T10:00:00', []),
        encounter('Visit Note', '2026-03-01T10:00:00', [omar]),
      ])
    ).toBe(omar);
  });

  it('uses the latest of several encounters of the same type, whatever their order', () => {
    const older = encounter('Visit Complete', '2026-03-01T10:00:00', [jane]);
    const newer = encounter('Visit Complete', '2026-03-05T10:00:00', [omar]);
    const middle = encounter('Visit Complete', '2026-03-03T10:00:00', [healthWorker]);
    expect(pickDoctorProvider([older, newer, middle])).toBe(omar);
    expect(pickDoctorProvider([newer, middle, older])).toBe(omar);
  });

  it('treats a missing or invalid date as the oldest, whatever the order', () => {
    const invalid = encounter('Visit Complete', 'not a date', [omar]);
    const missing = encounter('Visit Complete', undefined as unknown as string, [healthWorker]);
    const valid = encounter('Visit Complete', '2026-03-01T10:00:00', [jane]);
    expect(pickDoctorProvider([invalid, missing, valid])).toBe(jane);
    expect(pickDoctorProvider([valid, invalid, missing])).toBe(jane);
  });

  it('takes the first provider of the encounter and skips empty provider slots', () => {
    expect(
      pickDoctorProvider([encounter('Visit Complete', '2026-03-01T10:00:00', [null, jane, omar])])
    ).toBe(jane);
  });

  it('moves on to the next encounter when the latest one has no provider', () => {
    expect(
      pickDoctorProvider([
        encounter('Visit Complete', '2026-03-05T10:00:00', null),
        encounter('Visit Complete', '2026-03-04T10:00:00', undefined),
        encounter('Visit Complete', '2026-03-03T10:00:00', [null]),
        encounter('Visit Complete', '2026-03-02T10:00:00', [jane]),
      ])
    ).toBe(jane);
  });

  it('does not reorder the encounters it is given', () => {
    const older = encounter('Visit Complete', '2026-03-01T10:00:00', [jane]);
    const newer = encounter('Visit Complete', '2026-03-05T10:00:00', [omar]);
    const encounters = [older, newer];
    pickDoctorProvider(encounters);
    expect(encounters).toEqual([older, newer]);
    expect(encounters[0]).toBe(older);
  });
});

describe('stripAdditionalInstructionPrefix', () => {
  it('removes the marker from the start of an advice item', () => {
    expect(stripAdditionalInstructionPrefix('[ADDITIONAL_INSTRUCTION]Take rest')).toBe('Take rest');
  });

  it('also removes the spaces after the marker', () => {
    expect(stripAdditionalInstructionPrefix('[ADDITIONAL_INSTRUCTION]   Take rest')).toBe('Take rest');
  });

  it('leaves an advice item without the marker unchanged', () => {
    expect(stripAdditionalInstructionPrefix('Drink plenty of water')).toBe('Drink plenty of water');
    expect(stripAdditionalInstructionPrefix('')).toBe('');
  });

  it('leaves a marker that is not at the start', () => {
    expect(stripAdditionalInstructionPrefix('Note [ADDITIONAL_INSTRUCTION]keep')).toBe(
      'Note [ADDITIONAL_INSTRUCTION]keep'
    );
  });

  it('returns an empty string for a marker with no text', () => {
    expect(stripAdditionalInstructionPrefix('[ADDITIONAL_INSTRUCTION]')).toBe('');
  });
});
