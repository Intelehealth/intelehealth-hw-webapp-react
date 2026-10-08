import { act, render, renderHook } from '@testing-library/react';
import { StrictMode, useLayoutEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePrescriptionPdfAction } from '../../hooks/usePrescriptionPdfAction';
import {
  POPUP_BLOCKED_MESSAGE,
  TAB_CLOSED_MESSAGE,
  TabClosedError,
} from '../../utils/pdf-window';

const { mockGetVisitPrescriptionData, mockShowToast, mockOpenPendingWindow } =
  vi.hoisted(() => ({
    mockGetVisitPrescriptionData: vi.fn(),
    mockShowToast: vi.fn(),
    mockOpenPendingWindow: vi.fn(),
  }));

vi.mock('../../services/visit-prescription.service', () => ({
  getVisitPrescriptionData: mockGetVisitPrescriptionData,
}));
vi.mock('../../services/toast', () => ({ showToast: mockShowToast }));
vi.mock('../../utils/visit-prescription-pdf', () => ({
  openPendingWindow: mockOpenPendingWindow,
}));

type FakeWindow = { close: ReturnType<typeof vi.fn>; closed: boolean };
let windows: FakeWindow[] = [];

const deferred = <T,>() => {
  let resolve: (value: T) => void = () => {};
  let reject: (reason: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const PDF_DATA = { visitUuid: 'visit-1' };

describe('usePrescriptionPdfAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    windows = [];
    mockGetVisitPrescriptionData.mockReset();
    mockOpenPendingWindow.mockReset();
    mockOpenPendingWindow.mockImplementation(() => {
      const win = { close: vi.fn(), closed: false };
      windows.push(win);
      return win;
    });
  });

  it('opens a tab, runs the action with the data, signal and tab, and keeps the tab', async () => {
    mockGetVisitPrescriptionData.mockResolvedValue(PDF_DATA);
    const action = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePrescriptionPdfAction('visit-1'));

    let done: boolean | undefined;
    await act(async () => {
      done = await result.current.run('print', action);
    });

    expect(done).toBe(true);
    expect(mockOpenPendingWindow).toHaveBeenCalledWith('Preparing your prescription...');
    expect(mockGetVisitPrescriptionData).toHaveBeenCalledWith('visit-1', expect.any(AbortSignal));
    expect(action).toHaveBeenCalledWith(PDF_DATA, expect.any(AbortSignal), windows[0]);
    expect(windows[0].close).not.toHaveBeenCalled();
    expect(result.current.pdfOp).toBeNull();
  });

  it('uses the WhatsApp message for a share, and reports which operation is running', async () => {
    const request = deferred<typeof PDF_DATA>();
    mockGetVisitPrescriptionData.mockReturnValue(request.promise);
    const { result } = renderHook(() => usePrescriptionPdfAction('visit-1'));

    let pending: Promise<boolean> = Promise.resolve(false);
    act(() => {
      pending = result.current.run('share', vi.fn().mockResolvedValue(undefined));
    });
    expect(mockOpenPendingWindow).toHaveBeenCalledWith('Opening WhatsApp...');
    expect(result.current.pdfOp).toBe('share');

    await act(async () => {
      request.resolve(PDF_DATA);
      await pending;
    });
    expect(result.current.pdfOp).toBeNull();
  });

  it('tells the user to allow pop-ups, and does no work, when the tab is blocked', async () => {
    mockOpenPendingWindow.mockReturnValueOnce(null);
    const action = vi.fn();
    const { result } = renderHook(() => usePrescriptionPdfAction('visit-1'));

    let done: boolean | undefined;
    await act(async () => {
      done = await result.current.run('print', action);
    });

    expect(done).toBe(false);
    expect(mockShowToast).toHaveBeenCalledWith('Error', POPUP_BLOCKED_MESSAGE, 'error');
    expect(mockGetVisitPrescriptionData).not.toHaveBeenCalled();
    expect(action).not.toHaveBeenCalled();
    expect(result.current.pdfOp).toBeNull();
  });

  it('ignores a second call while one is running and opens no extra tab', async () => {
    const request = deferred<typeof PDF_DATA>();
    mockGetVisitPrescriptionData.mockReturnValue(request.promise);
    const action = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePrescriptionPdfAction('visit-1'));

    let first: Promise<boolean> = Promise.resolve(false);
    let second: boolean | undefined;
    await act(async () => {
      first = result.current.run('print', action);
      second = await result.current.run('print', action);
    });

    expect(second).toBe(false);
    expect(windows).toHaveLength(1);
    expect(mockGetVisitPrescriptionData).toHaveBeenCalledTimes(1);

    await act(async () => {
      request.resolve(PDF_DATA);
      await first;
    });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('can run again once the previous operation has finished', async () => {
    mockGetVisitPrescriptionData.mockResolvedValue(PDF_DATA);
    const action = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePrescriptionPdfAction('visit-1'));

    await act(async () => {
      await result.current.run('print', action);
    });
    await act(async () => {
      await result.current.run('print', action);
    });

    expect(action).toHaveBeenCalledTimes(2);
    expect(windows).toHaveLength(2);
  });

  it.each([
    {
      name: 'the data request fails',
      op: 'print' as const,
      setup: () => mockGetVisitPrescriptionData.mockRejectedValue(
        Object.assign(new Error('token=secret-123 patient=John'), { response: { status: 401 } })
      ),
      action: vi.fn(),
      message: 'Failed to print prescription PDF',
      details: { name: 'Error', status: 401 },
    },
    {
      name: 'the share step fails',
      op: 'share' as const,
      setup: () => mockGetVisitPrescriptionData.mockResolvedValue(PDF_DATA),
      action: vi.fn().mockRejectedValue(new TypeError('whatsapp token=secret-123')),
      message: 'Failed to share prescription PDF',
      details: { name: 'TypeError', status: undefined },
    },
  ])('logs only safe details, closes the tab and rejects when $name', async ({ op, setup, action, message, details }) => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    setup();
    const { result } = renderHook(() => usePrescriptionPdfAction('visit-1'));

    let caught: unknown;
    await act(async () => {
      try {
        await result.current.run(op, action);
      } catch (err) {
        caught = err;
      }
    });

    expect((caught as Error).message).toBe(message);
    expect(consoleSpy).toHaveBeenCalledWith(message, details);
    // nothing from the original error (token, patient name) is logged or rethrown
    expect(JSON.stringify(consoleSpy.mock.calls)).not.toContain('secret-123');
    expect((caught as Error).message).not.toContain('secret-123');
    expect(windows[0].close).toHaveBeenCalled();
    expect(result.current.pdfOp).toBeNull();
    consoleSpy.mockRestore();
  });

  it('tells the user, and does not run the action, when the tab was closed before the data arrived', async () => {
    const request = deferred<typeof PDF_DATA>();
    mockGetVisitPrescriptionData.mockReturnValue(request.promise);
    const action = vi.fn();
    const { result } = renderHook(() => usePrescriptionPdfAction('visit-1'));

    let pending: Promise<boolean> = Promise.resolve(true);
    act(() => {
      pending = result.current.run('print', action);
    });
    windows[0].closed = true;
    let done: boolean | undefined;
    await act(async () => {
      request.resolve(PDF_DATA);
      done = await pending;
    });

    expect(done).toBe(false);
    expect(mockShowToast).toHaveBeenCalledWith('Error', TAB_CLOSED_MESSAGE, 'error');
    expect(action).not.toHaveBeenCalled();
    expect(windows[0].close).toHaveBeenCalled();
  });

  it('tells the user when the tab is found closed during the slow PDF build', async () => {
    mockGetVisitPrescriptionData.mockResolvedValue(PDF_DATA);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const action = vi.fn().mockRejectedValue(new TabClosedError());
    const { result } = renderHook(() => usePrescriptionPdfAction('visit-1'));

    let done: boolean | undefined;
    await act(async () => {
      done = await result.current.run('share', action);
    });

    expect(done).toBe(false);
    expect(mockShowToast).toHaveBeenCalledWith('Error', TAB_CLOSED_MESSAGE, 'error');
    // not a failure: nothing is logged
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(windows[0].close).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('cancels the request on unmount, closes the tab and stays silent', async () => {
    const request = deferred<typeof PDF_DATA>();
    let signal: AbortSignal | undefined;
    mockGetVisitPrescriptionData.mockImplementation((_id: string, s: AbortSignal) => {
      signal = s;
      return request.promise;
    });
    const action = vi.fn();
    const { result, unmount } = renderHook(() => usePrescriptionPdfAction('visit-1'));

    let pending: Promise<boolean> = Promise.resolve(true);
    act(() => {
      pending = result.current.run('print', action);
    });
    expect(signal?.aborted).toBe(false);
    unmount();
    await Promise.resolve();
    expect(signal?.aborted).toBe(true);
    request.resolve(PDF_DATA);

    expect(await pending).toBe(false);
    expect(action).not.toHaveBeenCalled();
    expect(windows[0].close).toHaveBeenCalled();
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  it('reports false, without closing the tab, when the action succeeds after the user has left', async () => {
    mockGetVisitPrescriptionData.mockResolvedValue(PDF_DATA);
    const actionResult = deferred<void>();
    const action = vi.fn().mockReturnValue(actionResult.promise);
    const { result, unmount } = renderHook(() => usePrescriptionPdfAction('visit-1'));

    let pending: Promise<boolean> = Promise.resolve(true);
    act(() => {
      pending = result.current.run('print', action);
    });
    await vi.waitFor(() => expect(action).toHaveBeenCalled());
    unmount();
    await Promise.resolve();
    actionResult.resolve();

    expect(await pending).toBe(false);
    // the tab was already handed over to the print step
    expect(windows[0].close).not.toHaveBeenCalled();
  });

  it('stays silent when the action fails after the user has left', async () => {
    mockGetVisitPrescriptionData.mockResolvedValue(PDF_DATA);
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const actionResult = deferred<void>();
    const action = vi.fn().mockReturnValue(actionResult.promise);
    const { result, unmount } = renderHook(() => usePrescriptionPdfAction('visit-1'));

    let pending: Promise<boolean> = Promise.resolve(true);
    act(() => {
      pending = result.current.run('share', action);
    });
    await vi.waitFor(() => expect(action).toHaveBeenCalled());
    unmount();
    await Promise.resolve();
    actionResult.reject(new Error('failed after unmount: token=secret-123'));

    expect(await pending).toBe(false);
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(mockShowToast).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('does not start work for an old visit once it has been cancelled by unmount, and works after a remount', async () => {
    mockGetVisitPrescriptionData.mockResolvedValue(PDF_DATA);
    const action = vi.fn().mockResolvedValue(undefined);
    const first = renderHook(() => usePrescriptionPdfAction('visit-1'));
    first.unmount();
    await Promise.resolve();

    const second = renderHook(() => usePrescriptionPdfAction('visit-2'));
    let done: boolean | undefined;
    await act(async () => {
      done = await second.result.current.run('print', action);
    });
    expect(done).toBe(true);
    expect(mockGetVisitPrescriptionData).toHaveBeenCalledWith('visit-2', expect.any(AbortSignal));
  });

  it('is not cancelled by the StrictMode mount, unmount, mount cycle when an operation starts first', async () => {
    mockGetVisitPrescriptionData.mockResolvedValue(PDF_DATA);
    const action = vi.fn().mockResolvedValue(undefined);
    let outcome: Promise<boolean> | undefined;

    // A layout effect runs before the passive effects that StrictMode then
    // mounts, unmounts and mounts again. That is the order of a fast click.
    function Probe() {
      const { run } = usePrescriptionPdfAction('visit-1');
      useLayoutEffect(() => {
        outcome ??= run('print', action);
      }, [run]);
      return null;
    }

    await act(async () => {
      render(
        <StrictMode>
          <Probe />
        </StrictMode>
      );
    });

    expect(await outcome).toBe(true);
    expect(action).toHaveBeenCalledTimes(1);
    expect(windows[0].close).not.toHaveBeenCalled();
  });

  it('stops without running the action when the component unmounts just as the data arrives', async () => {
    const request = deferred<typeof PDF_DATA>();
    mockGetVisitPrescriptionData.mockReturnValue(request.promise);
    const action = vi.fn();
    const { result, unmount } = renderHook(() => usePrescriptionPdfAction('visit-1'));

    let pending: Promise<boolean> = Promise.resolve(true);
    act(() => {
      pending = result.current.run('print', action);
    });
    // the data resolves first, and the unmount lands before the deferred abort
    request.resolve(PDF_DATA);
    unmount();

    expect(await pending).toBe(false);
    expect(action).not.toHaveBeenCalled();
    expect(windows[0].close).toHaveBeenCalled();
    expect(mockShowToast).not.toHaveBeenCalled();
  });

  describe('download', () => {
    it('needs no tab: nothing is opened, and the action runs without one', async () => {
      mockGetVisitPrescriptionData.mockResolvedValue(PDF_DATA);
      const action = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => usePrescriptionPdfAction('visit-1'));

      let done: boolean | undefined;
      await act(async () => {
        done = await result.current.run('download', action);
      });

      expect(done).toBe(true);
      expect(mockOpenPendingWindow).not.toHaveBeenCalled();
      expect(action).toHaveBeenCalledWith(PDF_DATA, expect.any(AbortSignal), null);
      expect(result.current.pdfOp).toBeNull();
    });

    it('is guarded like Print and Share: a second download while one runs is ignored', async () => {
      const request = deferred<typeof PDF_DATA>();
      mockGetVisitPrescriptionData.mockReturnValue(request.promise);
      const action = vi.fn().mockResolvedValue(undefined);
      const { result } = renderHook(() => usePrescriptionPdfAction('visit-1'));

      let first: Promise<boolean> = Promise.resolve(false);
      let second: boolean | undefined;
      await act(async () => {
        first = result.current.run('download', action);
        second = await result.current.run('download', action);
      });
      expect(second).toBe(false);
      expect(mockGetVisitPrescriptionData).toHaveBeenCalledTimes(1);

      await act(async () => {
        request.resolve(PDF_DATA);
        await first;
      });
      expect(action).toHaveBeenCalledTimes(1);
    });

    it('logs only safe details and rejects when the download fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetVisitPrescriptionData.mockResolvedValue(PDF_DATA);
      const action = vi.fn().mockRejectedValue(new Error('save failed token=secret-123'));
      const { result } = renderHook(() => usePrescriptionPdfAction('visit-1'));

      let caught: unknown;
      await act(async () => {
        try {
          await result.current.run('download', action);
        } catch (err) {
          caught = err;
        }
      });

      expect((caught as Error).message).toBe('Failed to download prescription PDF');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to download prescription PDF', {
        name: 'Error',
        status: undefined,
      });
      expect(JSON.stringify(consoleSpy.mock.calls)).not.toContain('secret-123');
      consoleSpy.mockRestore();
    });

    it('is cancelled when the user leaves: no file is saved afterwards', async () => {
      const request = deferred<typeof PDF_DATA>();
      let signal: AbortSignal | undefined;
      mockGetVisitPrescriptionData.mockImplementation((_id: string, s: AbortSignal) => {
        signal = s;
        return request.promise;
      });
      const action = vi.fn();
      const { result, unmount } = renderHook(() => usePrescriptionPdfAction('visit-1'));

      let pending: Promise<boolean> = Promise.resolve(true);
      act(() => {
        pending = result.current.run('download', action);
      });
      unmount();
      await Promise.resolve();
      expect(signal?.aborted).toBe(true);
      request.resolve(PDF_DATA);

      expect(await pending).toBe(false);
      expect(action).not.toHaveBeenCalled();
    });
  });

  describe('when the visit changes while the component stays mounted', () => {
    it('cancels the running operation, closes its tab and frees the buttons', async () => {
      const request = deferred<typeof PDF_DATA>();
      let signal: AbortSignal | undefined;
      mockGetVisitPrescriptionData.mockImplementation((_id: string, s: AbortSignal) => {
        signal = s;
        return request.promise;
      });
      const action = vi.fn();
      const { result, rerender } = renderHook(({ id }) => usePrescriptionPdfAction(id), {
        initialProps: { id: 'visit-a' },
      });

      let pending: Promise<boolean> = Promise.resolve(true);
      act(() => {
        pending = result.current.run('print', action);
      });
      expect(result.current.pdfOp).toBe('print');

      rerender({ id: 'visit-b' });

      expect(signal?.aborted).toBe(true);
      expect(result.current.pdfOp).toBeNull();
      request.resolve(PDF_DATA);
      expect(await pending).toBe(false);
      // visit A's prescription is never printed from what is now visit B's page
      expect(action).not.toHaveBeenCalled();
      expect(windows[0].close).toHaveBeenCalled();
      expect(mockShowToast).not.toHaveBeenCalled();
    });

    it('lets the new visit start straight away, and the old one finishing late does not release its guard', async () => {
      const requestA = deferred<typeof PDF_DATA>();
      const requestB = deferred<typeof PDF_DATA>();
      mockGetVisitPrescriptionData.mockImplementation((id: string) =>
        id === 'visit-a' ? requestA.promise : requestB.promise
      );
      const action = vi.fn().mockResolvedValue(undefined);
      const { result, rerender } = renderHook(({ id }) => usePrescriptionPdfAction(id), {
        initialProps: { id: 'visit-a' },
      });

      let first: Promise<boolean> = Promise.resolve(true);
      act(() => {
        first = result.current.run('print', action);
      });
      rerender({ id: 'visit-b' });

      let second: Promise<boolean> = Promise.resolve(false);
      act(() => {
        second = result.current.run('print', action);
      });
      expect(mockGetVisitPrescriptionData).toHaveBeenLastCalledWith('visit-b', expect.any(AbortSignal));
      expect(windows).toHaveLength(2);

      // visit A's request settles late
      await act(async () => {
        requestA.resolve(PDF_DATA);
        await first;
      });
      // visit B is still running, and still guarded against a double click
      let third: boolean | undefined;
      await act(async () => {
        third = await result.current.run('print', action);
      });
      expect(third).toBe(false);
      expect(result.current.pdfOp).toBe('print');

      await act(async () => {
        requestB.resolve(PDF_DATA);
        await second;
      });
      expect(action).toHaveBeenCalledTimes(1);
      expect(await second).toBe(true);
    });

    it('does nothing when it re-renders with the same visit', async () => {
      const request = deferred<typeof PDF_DATA>();
      let signal: AbortSignal | undefined;
      mockGetVisitPrescriptionData.mockImplementation((_id: string, s: AbortSignal) => {
        signal = s;
        return request.promise;
      });
      const { result, rerender } = renderHook(({ id }) => usePrescriptionPdfAction(id), {
        initialProps: { id: 'visit-a' },
      });
      act(() => {
        void result.current.run('print', vi.fn());
      });
      rerender({ id: 'visit-a' });
      expect(signal?.aborted).toBe(false);
      expect(result.current.pdfOp).toBe('print');
    });
  });
});
