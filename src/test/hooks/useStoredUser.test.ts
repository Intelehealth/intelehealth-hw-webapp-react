import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStoredUser } from '../../hooks/useStoredUser';

const mockGetUser = vi.fn();
vi.mock('../../utils/storage', () => ({
  storage: { getUser: () => mockGetUser() },
}));

describe('useStoredUser', () => {
  beforeEach(() => mockGetUser.mockReset());

  it('returns null when no user is stored', () => {
    mockGetUser.mockReturnValue(null);
    const { result } = renderHook(() => useStoredUser());
    expect(result.current).toBeNull();
  });

  it('returns the parsed user when stored', () => {
    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'u-1', name: 'Zee' }));
    const { result } = renderHook(() => useStoredUser());
    expect(result.current).toEqual({ uuid: 'u-1', name: 'Zee' });
  });

  it('returns null when the stored value is malformed JSON', () => {
    mockGetUser.mockReturnValue('{not-json');
    const { result } = renderHook(() => useStoredUser());
    expect(result.current).toBeNull();
  });

  it('updates when the ih:user-changed event fires', () => {
    mockGetUser.mockReturnValue(null);
    const { result } = renderHook(() => useStoredUser());
    expect(result.current).toBeNull();

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'u-2' }));
    act(() => {
      window.dispatchEvent(new Event('ih:user-changed'));
    });
    expect(result.current).toEqual({ uuid: 'u-2' });
  });

  it('updates on a cross-tab storage event and removes listeners on unmount', () => {
    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'u-3' }));
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { result, unmount } = renderHook(() => useStoredUser());
    expect(result.current).toEqual({ uuid: 'u-3' });

    mockGetUser.mockReturnValue(JSON.stringify({ uuid: 'u-4' }));
    act(() => {
      window.dispatchEvent(new Event('storage'));
    });
    expect(result.current).toEqual({ uuid: 'u-4' });

    unmount();
    expect(removeSpy).toHaveBeenCalledWith(
      'ih:user-changed',
      expect.any(Function)
    );
    expect(removeSpy).toHaveBeenCalledWith('storage', expect.any(Function));
    removeSpy.mockRestore();
  });
});
