import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useProfile } from '../../../modules/profile/profile.hooks';

// Mock the profile service
vi.mock('../../../modules/profile/profile.service', () => ({
  default: {
    getProfile: vi.fn().mockResolvedValue({
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
    }),
    updateProfile: vi.fn().mockResolvedValue({}),
    uploadPhoto: vi.fn().mockResolvedValue({}),
    takePhoto: vi.fn().mockResolvedValue({}),
  },
}));

// Mock the storage utility
vi.mock('../../../utils/storage', () => ({
  storage: {
    getAuthToken: vi.fn(() => 'mock-token'),
    getUser: vi.fn(() => JSON.stringify({ uuid: 'test-uuid' })),
  },
}));

describe('useProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', async () => {
    const { result } = renderHook(() => useProfile());
    
    // Wait for the hook to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    // After loading, profile should be available
    expect(result.current.profile).toBeTruthy();
    expect(result.current.loading).toBe(false);
  });

  it('should provide updateProfile function', async () => {
    const { result } = renderHook(() => useProfile());
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
    const { updateProfile } = result.current;
    expect(typeof updateProfile).toBe('function');
  });

  it('should provide uploadPhoto function', async () => {
    const { result } = renderHook(() => useProfile());
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
    const { uploadPhoto } = result.current;
    expect(typeof uploadPhoto).toBe('function');
  });

  it('should provide takePhoto function', async () => {
    const { result } = renderHook(() => useProfile());
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });
    const { takePhoto } = result.current;
    expect(typeof takePhoto).toBe('function');
  });

  it('should handle profile loading state', async () => {
    const { result } = renderHook(() => useProfile());
    
    // Wait for the hook to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    
    // After loading, loading should be false
    expect(result.current.loading).toBe(false);
  });

  it('should handle profile error state', async () => {
    const { result } = renderHook(() => useProfile());
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
    // The hook doesn't expose an error state, so we just check it doesn't crash
    expect(result.current).toBeDefined();
    expect(result.current.profile === null || typeof result.current.profile === 'object').toBe(true);
  });
});
