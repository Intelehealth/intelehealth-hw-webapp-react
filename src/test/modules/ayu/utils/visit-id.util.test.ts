import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
  getResource: vi.fn(),
}));

vi.mock('../../../../utils/storage', () => ({
  storage: { get: h.get, set: h.set, remove: h.remove },
}));

vi.mock('../../../../modules/ayu/services/temp-storage.service', () => ({
  getResource: h.getResource,
}));

import {
  clearVisitForPatient,
  getOrCreateVisitId,
  hasInProgressVisit,
  visitIdStorageKey,
} from '../../../../modules/ayu/utils/visit-id.util';

beforeEach(() => {
  h.get.mockReset();
  h.set.mockReset();
  h.remove.mockReset();
  h.getResource.mockReset();
});

describe('visitIdStorageKey', () => {
  it('namespaces the key by patient uuid', () => {
    expect(visitIdStorageKey('abc')).toBe('temp_visit_id_abc');
  });
  it('falls back to the bare key when no patient', () => {
    expect(visitIdStorageKey(null)).toBe('temp_visit_id');
  });
});

describe('getOrCreateVisitId', () => {
  it('returns the existing id when present', () => {
    h.get.mockReturnValue('existing-id');
    expect(getOrCreateVisitId('abc')).toBe('existing-id');
    expect(h.set).not.toHaveBeenCalled();
  });

  it('creates and stores a new id when none exists', () => {
    h.get.mockReturnValue(null);
    const id = getOrCreateVisitId('abc');
    expect(id).toBeTruthy();
    expect(h.set).toHaveBeenCalledWith('temp_visit_id_abc', id);
  });
});

describe('clearVisitForPatient', () => {
  it('removes the patient-scoped visit id key', () => {
    clearVisitForPatient('abc');
    expect(h.remove).toHaveBeenCalledWith('temp_visit_id_abc');
  });
});

describe('hasInProgressVisit', () => {
  it('returns false when no patient uuid', async () => {
    expect(await hasInProgressVisit(null)).toBe(false);
    expect(h.get).not.toHaveBeenCalled();
  });

  it('returns false when there is no stored visit id', async () => {
    h.get.mockReturnValue(null);
    expect(await hasInProgressVisit('abc')).toBe(false);
    expect(h.getResource).not.toHaveBeenCalled();
  });

  it('returns true when the saved record has a filled section', async () => {
    h.get.mockReturnValue('visit-1');
    h.getResource.mockResolvedValue({
      data: { parent_id: 'abc', data: { vitals: { foo: 1 } } },
    });
    expect(await hasInProgressVisit('abc')).toBe(true);
  });

  it('returns false when the record lookup yields nothing (404)', async () => {
    h.get.mockReturnValue('visit-1');
    h.getResource.mockResolvedValue({ data: null });
    expect(await hasInProgressVisit('abc')).toBe(false);
  });

  it('accepts a record with no parent_id (treats it as the current patient)', async () => {
    h.get.mockReturnValue('visit-1');
    h.getResource.mockResolvedValue({
      data: { parent_id: null, data: { medicalHistory: {} } },
    });
    expect(await hasInProgressVisit('abc')).toBe(true);
  });

  it('returns false when the saved record is empty', async () => {
    h.get.mockReturnValue('visit-1');
    h.getResource.mockResolvedValue({
      data: { parent_id: 'abc', data: {} },
    });
    expect(await hasInProgressVisit('abc')).toBe(false);
  });

  it('returns false when the record belongs to another patient', async () => {
    h.get.mockReturnValue('visit-1');
    h.getResource.mockResolvedValue({
      data: { parent_id: 'someone-else', data: { vitals: { foo: 1 } } },
    });
    expect(await hasInProgressVisit('abc')).toBe(false);
  });

  it('returns false when the lookup throws', async () => {
    h.get.mockReturnValue('visit-1');
    h.getResource.mockRejectedValue(new Error('network'));
    expect(await hasInProgressVisit('abc')).toBe(false);
  });
});
