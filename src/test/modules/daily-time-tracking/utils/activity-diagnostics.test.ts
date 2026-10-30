import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockCaptureMessage = vi.fn();

vi.mock('../../../../config/sentry', () => ({
  captureMessage: (...args: unknown[]) => mockCaptureMessage(...args),
}));

import { reportActivityIssue } from '../../../../modules/daily-time-tracking/utils/activity-diagnostics';

describe('reportActivityIssue', () => {
  let warn: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockCaptureMessage.mockReset();
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('only writes a failed request that will be tried again to the console', () => {
    reportActivityIssue('send_failed', { status: 503, seconds: 60 });

    expect(warn).toHaveBeenCalledWith('[daily-time] send_failed', {
      status: 503,
      seconds: 60,
    });
    expect(mockCaptureMessage).not.toHaveBeenCalled();
  });

  it.each(['send_rejected', 'dropped_too_old', 'server_total_lower'] as const)(
    'also sends %s to Sentry as a warning, with numbers only',
    issue => {
      reportActivityIssue(issue, { seconds: 60, retry: false });

      expect(warn).toHaveBeenCalledWith(`[daily-time] ${issue}`, {
        seconds: 60,
        retry: false,
      });
      expect(mockCaptureMessage).toHaveBeenCalledWith(
        `Daily time: ${issue} {"seconds":60,"retry":false}`,
        'warning'
      );
    }
  );
});
