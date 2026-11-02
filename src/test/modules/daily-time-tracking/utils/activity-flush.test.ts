import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LOGOUT_FLUSH_MAX_MS } from '../../../../modules/daily-time-tracking/constants/activity-config';
import {
  flushActivityHeartbeat,
  registerActivityFlush,
} from '../../../../modules/daily-time-tracking/utils/activity-flush';

describe('activity flush', () => {
  const cleanups: (() => void)[] = [];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanups.splice(0).forEach(stop => stop());
    vi.useRealTimers();
  });

  it('does nothing when no page is counting', async () => {
    await expect(flushActivityHeartbeat()).resolves.toBeUndefined();
  });

  it('runs the page that is counting', async () => {
    const flush = vi.fn();
    cleanups.push(registerActivityFlush(flush));

    await flushActivityHeartbeat();

    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('stops running it once the page stops counting', async () => {
    const flush = vi.fn();
    const stop = registerActivityFlush(flush);

    stop();
    await flushActivityHeartbeat();

    expect(flush).not.toHaveBeenCalled();
  });

  it('a page that stops does not remove a newer page', async () => {
    const older = vi.fn();
    const newer = vi.fn();
    const stopOlder = registerActivityFlush(older);
    cleanups.push(registerActivityFlush(newer));

    stopOlder();
    await flushActivityHeartbeat();

    expect(newer).toHaveBeenCalledTimes(1);
    expect(older).not.toHaveBeenCalled();
  });

  it('answers only when the page has sent everything', async () => {
    let finish!: () => void;
    cleanups.push(
      registerActivityFlush(
        () =>
          new Promise<void>(resolve => {
            finish = resolve;
          })
      )
    );
    const done = vi.fn();

    const flushing = flushActivityHeartbeat().then(done);
    await vi.advanceTimersByTimeAsync(LOGOUT_FLUSH_MAX_MS - 1);
    expect(done).not.toHaveBeenCalled();

    finish();
    await flushing;

    expect(done).toHaveBeenCalledTimes(1);
  });

  it('leaves no timer behind when the page is quick', async () => {
    cleanups.push(registerActivityFlush(() => Promise.resolve()));

    await flushActivityHeartbeat();

    expect(vi.getTimerCount()).toBe(0);
  });

  it('gives up after a while when the page does not finish, so logging out is not held up', async () => {
    cleanups.push(registerActivityFlush(() => new Promise<void>(() => undefined)));
    const done = vi.fn();

    const flushing = flushActivityHeartbeat().then(done);
    await vi.advanceTimersByTimeAsync(LOGOUT_FLUSH_MAX_MS);
    await flushing;

    expect(done).toHaveBeenCalledTimes(1);
  });
});
