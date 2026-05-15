import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTimeSpent } from '../../hooks/useTimeSpent';

const STORAGE_KEY = 'ih_daily_time_spent';

// localStorage is globally mocked in setup.ts with vi.fn() stubs.
// Access the mock functions directly.
const mockGetItem = vi.mocked(localStorage.getItem);
const mockSetItem = vi.mocked(localStorage.setItem);

describe('useTimeSpent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T10:00:00'));
    mockGetItem.mockReset();
    mockSetItem.mockReset();
    mockGetItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return "0h 0m" when no stored data', () => {
    const { result } = renderHook(() => useTimeSpent());
    expect(result.current).toBe('0h 0m');
  });

  it('should return stored time for today', () => {
    mockGetItem.mockReturnValue(
      JSON.stringify({ date: '2026-05-15', ms: 3_600_000 }) // 1 hour
    );
    const { result } = renderHook(() => useTimeSpent());
    expect(result.current).toBe('1h 0m');
  });

  it('should ignore stored data from a different day', () => {
    mockGetItem.mockReturnValue(
      JSON.stringify({ date: '2026-05-14', ms: 3_600_000 })
    );
    const { result } = renderHook(() => useTimeSpent());
    expect(result.current).toBe('0h 0m');
  });

  it('should update display after 1 minute interval', () => {
    const { result } = renderHook(() => useTimeSpent());
    expect(result.current).toBe('0h 0m');

    act(() => {
      vi.advanceTimersByTime(60_000); // 1 minute
    });

    expect(result.current).toBe('0h 1m');
  });

  it('should accumulate time across intervals', () => {
    const { result } = renderHook(() => useTimeSpent());

    act(() => {
      vi.advanceTimersByTime(60_000 * 5); // 5 minutes
    });

    expect(result.current).toBe('0h 5m');
  });

  it('should persist time to localStorage via setItem', () => {
    renderHook(() => useTimeSpent());

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(mockSetItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
    // Parse the last setItem call to verify the data shape
    const lastCall = mockSetItem.mock.calls.at(-1);
    const stored = JSON.parse(lastCall![1]);
    expect(stored.date).toBe('2026-05-15');
    expect(stored.ms).toBeGreaterThan(0);
  });

  it('should handle visibility change — flush on hide', () => {
    renderHook(() => useTimeSpent());

    // Advance some time
    act(() => {
      vi.advanceTimersByTime(30_000); // 30 seconds
    });

    // Simulate tab hidden
    act(() => {
      Object.defineProperty(document, 'hidden', { value: true, writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(mockSetItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));

    // Restore
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
  });

  it('should resume tracking on visibility restore', () => {
    renderHook(() => useTimeSpent());

    // Hide tab
    act(() => {
      Object.defineProperty(document, 'hidden', { value: true, writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Restore tab — loadStoredMs is called again
    act(() => {
      Object.defineProperty(document, 'hidden', { value: false, writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Continue accumulating
    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    // Should have called setItem multiple times (flush on hide + interval)
    expect(mockSetItem).toHaveBeenCalled();
    const lastCall = mockSetItem.mock.calls.at(-1);
    const stored = JSON.parse(lastCall![1]);
    expect(stored.ms).toBeGreaterThan(0);
  });

  it('should flush on beforeunload', () => {
    renderHook(() => useTimeSpent());

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    act(() => {
      window.dispatchEvent(new Event('beforeunload'));
    });

    expect(mockSetItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
  });

  it('should clean up event listeners on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const windowRemoveSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useTimeSpent());
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(windowRemoveSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    removeSpy.mockRestore();
    windowRemoveSpy.mockRestore();
  });

  it('should handle invalid localStorage data gracefully', () => {
    mockGetItem.mockReturnValue('not valid json');
    const { result } = renderHook(() => useTimeSpent());
    expect(result.current).toBe('0h 0m');
  });

  it('should format hours and minutes correctly', () => {
    mockGetItem.mockReturnValue(
      JSON.stringify({ date: '2026-05-15', ms: 5_400_000 }) // 1h 30m
    );
    const { result } = renderHook(() => useTimeSpent());
    expect(result.current).toBe('1h 30m');
  });

  it('should flush and persist on unmount', () => {
    const { unmount } = renderHook(() => useTimeSpent());

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    unmount();

    // flush is called on cleanup
    expect(mockSetItem).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
  });
});
