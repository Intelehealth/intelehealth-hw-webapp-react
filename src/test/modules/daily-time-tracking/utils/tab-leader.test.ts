import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTabLeader } from '../../../../modules/daily-time-tracking/utils/tab-leader';
import { ACTIVITY_KEY, LEASE_KEY, LEASE_TTL_MS } from '../../../../modules/daily-time-tracking/constants/activity-config';

// A storage that behaves like the real one: values are kept, as text.
class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.has(key) ? (this.data.get(key) as string) : null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
}

const NOW = 1_800_000_000_000;

describe('createTabLeader: who counts', () => {
  it('the first tab leads and the second does not', () => {
    const storage = new MemoryStorage();
    const a = createTabLeader({ storage, id: 'a' });
    const b = createTabLeader({ storage, id: 'b' });

    expect(a.elect(NOW, NOW)).toEqual({ leader: true, adoptUpTo: null });
    expect(b.elect(NOW + 1_000, NOW + 1_000)).toEqual({
      leader: false,
      adoptUpTo: null,
    });
  });

  it('a leader that keeps renewing keeps the lease for as long as it likes', () => {
    const storage = new MemoryStorage();
    const a = createTabLeader({ storage, id: 'a' });
    const b = createTabLeader({ storage, id: 'b' });

    a.elect(NOW, NOW);
    for (let s = 15; s <= 3_600; s += 15) {
      expect(a.elect(NOW + s * 1_000, NOW + s * 1_000).leader).toBe(true);
      expect(b.elect(NOW + s * 1_000 + 500, NOW).leader).toBe(false);
    }
  });

  it('a lease that was not renewed for 90 seconds is free, and the next tab continues from where the leader had counted', () => {
    const storage = new MemoryStorage();
    const a = createTabLeader({ storage, id: 'a' });
    const b = createTabLeader({ storage, id: 'b' });

    a.elect(NOW, NOW + 10_000); // counted up to 10 s
    expect(b.elect(NOW + LEASE_TTL_MS, NOW + LEASE_TTL_MS).leader).toBe(false); // exactly 90 s: still held
    const takeover = b.elect(NOW + LEASE_TTL_MS + 1, NOW + LEASE_TTL_MS + 1);

    expect(takeover).toEqual({ leader: true, adoptUpTo: NOW + 10_000 });
  });

  it('does not wait for a lease that was renewed in the future, because the clock was corrected', () => {
    const storage = new MemoryStorage();
    const a = createTabLeader({ storage, id: 'a' });
    const b = createTabLeader({ storage, id: 'b' });

    a.elect(NOW + 24 * 3_600_000, NOW); // written by a clock that was a day ahead
    const takeover = b.elect(NOW, NOW);

    expect(takeover.leader).toBe(true);
    expect(takeover.adoptUpTo).toBe(NOW);
  });

  it('after the takeover the old leader is no longer the leader', () => {
    const storage = new MemoryStorage();
    const a = createTabLeader({ storage, id: 'a' });
    const b = createTabLeader({ storage, id: 'b' });

    a.elect(NOW, NOW);
    b.elect(NOW + LEASE_TTL_MS + 1, NOW + LEASE_TTL_MS + 1);

    expect(a.elect(NOW + LEASE_TTL_MS + 2, NOW).leader).toBe(false);
  });

  it('a leader that lets go makes the lease free at once', () => {
    const storage = new MemoryStorage();
    const a = createTabLeader({ storage, id: 'a' });
    const b = createTabLeader({ storage, id: 'b' });

    a.elect(NOW, NOW);
    a.release(NOW + 20_000);

    expect(b.elect(NOW + 21_000, NOW + 21_000)).toEqual({
      leader: true,
      adoptUpTo: NOW + 20_000,
    });
  });

  it('a tab that is not the leader cannot let the lease go', () => {
    const storage = new MemoryStorage();
    const a = createTabLeader({ storage, id: 'a' });
    const b = createTabLeader({ storage, id: 'b' });

    a.elect(NOW, NOW);
    b.release(NOW + 5_000);

    expect(b.elect(NOW + 6_000, NOW + 6_000).leader).toBe(false);
    expect(a.elect(NOW + 6_000, NOW + 6_000).leader).toBe(true);
  });

  it('the last write stands when two tabs take a free lease at the same moment', () => {
    // tab b writes its own lease right after tab a writes, before tab a reads it back
    const inner = new MemoryStorage();
    let injected = false;
    const storage: Storage = Object.create(inner, {
      setItem: {
        value: (key: string, value: string) => {
          inner.setItem(key, value);
          if (!injected && key === LEASE_KEY) {
            injected = true;
            inner.setItem(
              LEASE_KEY,
              JSON.stringify({ id: 'b', ts: NOW, upTo: NOW })
            );
          }
        },
      },
    });
    const a = createTabLeader({ storage, id: 'a' });

    expect(a.elect(NOW, NOW).leader).toBe(false);
    expect(JSON.parse(inner.getItem(LEASE_KEY) as string).id).toBe('b');
  });
  it('reads a broken lease as no lease', () => {
    const storage = new MemoryStorage();
    storage.setItem(LEASE_KEY, '{not json');
    const a = createTabLeader({ storage, id: 'a' });

    expect(a.elect(NOW, NOW).leader).toBe(true);

    storage.setItem(LEASE_KEY, JSON.stringify({ id: 5, ts: 'x' }));
    const b = createTabLeader({ storage, id: 'b' });
    expect(b.elect(NOW, NOW).leader).toBe(true);
  });
});

describe('createTabLeader: when the storage cannot be used', () => {
  it('leads alone when there is no storage', () => {
    const tab = createTabLeader({ storage: null, id: 'a' });

    expect(tab.elect(NOW, NOW)).toEqual({ leader: true, adoptUpTo: null });
    expect(tab.lastSharedActivity()).toBeNull();
    expect(() => tab.noteActivity(NOW)).not.toThrow();
    expect(() => tab.release(NOW)).not.toThrow();
  });

  it('leads alone when writing throws', () => {
    const storage = new MemoryStorage();
    storage.setItem = () => {
      throw new Error('QuotaExceededError');
    };
    const tab = createTabLeader({ storage, id: 'a' });

    expect(tab.elect(NOW, NOW).leader).toBe(true);
    expect(() => tab.noteActivity(NOW)).not.toThrow();
  });

  it('leads alone when reading throws', () => {
    const storage = new MemoryStorage();
    storage.getItem = () => {
      throw new Error('SecurityError');
    };
    const tab = createTabLeader({ storage, id: 'a' });

    expect(tab.elect(NOW, NOW).leader).toBe(true);
    expect(tab.lastSharedActivity()).toBeNull();
  });

  it('leads alone when the storage takes values and gives nothing back', () => {
    const storage = new MemoryStorage();
    storage.getItem = () => null;
    const a = createTabLeader({ storage, id: 'a' });
    const b = createTabLeader({ storage, id: 'b' });

    expect(a.elect(NOW, NOW)).toEqual({ leader: true, adoptUpTo: null });
    expect(b.elect(NOW, NOW)).toEqual({ leader: true, adoptUpTo: null });
  });
});

describe('createTabLeader: the latest move in any tab', () => {
  it('shares the time of a move', () => {
    const storage = new MemoryStorage();
    const a = createTabLeader({ storage, id: 'a' });
    const b = createTabLeader({ storage, id: 'b' });

    expect(b.lastSharedActivity()).toBeNull();
    a.noteActivity(NOW + 5_000);

    expect(b.lastSharedActivity()).toBe(NOW + 5_000);
    expect(storage.getItem(ACTIVITY_KEY)).toBe(String(NOW + 5_000));
  });

  it('ignores a value that is not a time', () => {
    const storage = new MemoryStorage();
    const a = createTabLeader({ storage, id: 'a' });

    storage.setItem(ACTIVITY_KEY, 'soon');
    expect(a.lastSharedActivity()).toBeNull();
    storage.setItem(ACTIVITY_KEY, '0');
    expect(a.lastSharedActivity()).toBeNull();
  });

  it('gives every tab an id of its own', () => {
    expect(createTabLeader({ storage: null }).id).not.toBe(
      createTabLeader({ storage: null }).id
    );
  });

  it('writes a move for the other tabs at most every ten seconds', () => {
    const storage = new MemoryStorage();
    const a = createTabLeader({ storage, id: 'a' });

    a.noteActivity(NOW);
    a.noteActivity(NOW + 1_000);
    expect(storage.getItem(ACTIVITY_KEY)).toBe(String(NOW));

    a.noteActivity(NOW + 10_000);
    expect(storage.getItem(ACTIVITY_KEY)).toBe(String(NOW + 10_000));
  });
});

describe('createTabLeader: the browser it runs in', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('takes the id the browser makes', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid-from-the-browser' });

    expect(createTabLeader({ storage: null }).id).toBe('uuid-from-the-browser');
  });

  it.each([
    ['has no crypto', undefined],
    ['cannot make a uuid', {}],
    [
      'fails to make a uuid',
      {
        randomUUID: () => {
          throw new Error('not allowed');
        },
      },
    ],
  ])('makes up an id when the browser %s', (_label, crypto) => {
    vi.stubGlobal('crypto', crypto);

    const id = createTabLeader({ storage: null }).id;

    expect(id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/);
    expect(createTabLeader({ storage: null }).id).not.toBe(id);
  });

  it("uses the browser's localStorage when none is given", () => {
    const tab = createTabLeader({ id: 'a' });

    expect(tab.elect(NOW, NOW).leader).toBe(true);
    expect(window.localStorage.setItem).toHaveBeenCalled();
  });

  it('leads alone when there is no window', () => {
    vi.stubGlobal('window', undefined);

    const tab = createTabLeader({ id: 'a' });

    expect(tab.elect(NOW, NOW)).toEqual({ leader: true, adoptUpTo: null });
  });

  it('leads alone when the browser refuses to give localStorage', () => {
    vi.stubGlobal('window', {
      get localStorage(): Storage {
        throw new Error('SecurityError');
      },
    });

    const tab = createTabLeader({ id: 'a' });

    expect(tab.elect(NOW, NOW)).toEqual({ leader: true, adoptUpTo: null });
  });
});