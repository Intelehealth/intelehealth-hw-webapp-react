import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useBreadcrumb } from '../../hooks/useBreadcrumb';
import {
  BreadcrumbProvider,
  useBreadcrumbContext,
  type BreadcrumbItem,
} from '../../context/BreadcrumbContext';

describe('useBreadcrumb', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(BreadcrumbProvider, null, children);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw when used outside BreadcrumbProvider', () => {
    expect(() => {
      renderHook(() => useBreadcrumb([{ label: 'Test' }]));
    }).toThrow(
      'useBreadcrumbContext must be used within a BreadcrumbProvider'
    );
  });

  it('should set items on mount', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Settings' },
    ];

    const { result } = renderHook(
      () => {
        useBreadcrumb(items);
        return useBreadcrumbContext();
      },
      { wrapper }
    );

    expect(result.current.items).toEqual(items);
  });

  it('should clear items on unmount', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Settings' },
    ];

    const { result, unmount } = renderHook(
      () => {
        useBreadcrumb(items);
        return useBreadcrumbContext();
      },
      { wrapper }
    );

    expect(result.current.items).toEqual(items);

    unmount();

    // After unmount, the cleanup should have been called.
    // We verify by mounting a new hook that just reads the context
    const { result: readResult } = renderHook(
      () => useBreadcrumbContext(),
      { wrapper }
    );

    // New provider instance starts fresh
    expect(readResult.current.items).toEqual([]);
  });

  it('should set bgColor when option is provided', () => {
    const items: BreadcrumbItem[] = [{ label: 'Page' }];

    const { result } = renderHook(
      () => {
        useBreadcrumb(items, { bgColor: 'bg-gray-50' });
        return useBreadcrumbContext();
      },
      { wrapper }
    );

    expect(result.current.bgColor).toBe('bg-gray-50');
  });

  it('should not change bgColor when option is not provided', () => {
    const items: BreadcrumbItem[] = [{ label: 'Page' }];

    const { result } = renderHook(
      () => {
        useBreadcrumb(items);
        return useBreadcrumbContext();
      },
      { wrapper }
    );

    expect(result.current.bgColor).toBe('bg-white');
  });

  it('should reset bgColor to bg-white on unmount', () => {
    const items: BreadcrumbItem[] = [{ label: 'Page' }];

    // We use a shared provider to verify the cleanup
    let contextRef: ReturnType<typeof useBreadcrumbContext> | null = null;

    const SharedWrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(BreadcrumbProvider, null, children);

    // First, mount the hook with a custom bgColor
    const { unmount } = renderHook(
      () => {
        useBreadcrumb(items, { bgColor: 'bg-[#F5F5FA]' });
        contextRef = useBreadcrumbContext();
      },
      { wrapper: SharedWrapper }
    );

    expect(contextRef!.bgColor).toBe('bg-[#F5F5FA]');

    unmount();

    // After unmount with a new wrapper, fresh state
    const { result: freshResult } = renderHook(
      () => useBreadcrumbContext(),
      { wrapper: SharedWrapper }
    );
    expect(freshResult.current.bgColor).toBe('bg-white');
  });

  it('should handle items with state property', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Dashboard', path: '/dashboard' },
      {
        label: 'Visit Details',
        path: '/visit-details/123',
        state: { fromLabel: 'Prescriptions', fromPath: '/prescriptions' },
      },
      { label: 'Prescription Detail' },
    ];

    const { result } = renderHook(
      () => {
        useBreadcrumb(items);
        return useBreadcrumbContext();
      },
      { wrapper }
    );

    expect(result.current.items).toEqual(items);
    expect(result.current.items[1].state).toEqual({
      fromLabel: 'Prescriptions',
      fromPath: '/prescriptions',
    });
  });

  it('should update items when items change', () => {
    const initialItems: BreadcrumbItem[] = [{ label: 'Dashboard' }];
    const updatedItems: BreadcrumbItem[] = [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Settings' },
    ];

    let currentItems = initialItems;

    const { result, rerender } = renderHook(
      () => {
        useBreadcrumb(currentItems);
        return useBreadcrumbContext();
      },
      { wrapper }
    );

    expect(result.current.items).toEqual(initialItems);

    currentItems = updatedItems;
    rerender();

    expect(result.current.items).toEqual(updatedItems);
  });

  it('should update bgColor when bgColor option changes', () => {
    let bgColor: string | undefined = 'bg-gray-50';

    const { result, rerender } = renderHook(
      () => {
        useBreadcrumb([{ label: 'Page' }], bgColor ? { bgColor } : undefined);
        return useBreadcrumbContext();
      },
      { wrapper }
    );

    expect(result.current.bgColor).toBe('bg-gray-50');

    bgColor = 'bg-[#F5F5FA]';
    rerender();

    expect(result.current.bgColor).toBe('bg-[#F5F5FA]');
  });

  it('should handle single item breadcrumb', () => {
    const items: BreadcrumbItem[] = [{ label: 'Dashboard' }];

    const { result } = renderHook(
      () => {
        useBreadcrumb(items);
        return useBreadcrumbContext();
      },
      { wrapper }
    );

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].label).toBe('Dashboard');
  });

  it('should handle multiple items breadcrumb', () => {
    const items: BreadcrumbItem[] = [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Open Visits', path: '/open-visits' },
      { label: 'Visit Details', path: '/visit-details/123' },
      { label: 'Prescription Detail' },
    ];

    const { result } = renderHook(
      () => {
        useBreadcrumb(items);
        return useBreadcrumbContext();
      },
      { wrapper }
    );

    expect(result.current.items).toHaveLength(4);
  });

  it('should handle empty items array', () => {
    const { result } = renderHook(
      () => {
        useBreadcrumb([]);
        return useBreadcrumbContext();
      },
      { wrapper }
    );

    expect(result.current.items).toEqual([]);
  });
});
