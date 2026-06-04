import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, beforeEach } from 'vitest';
import {
  BreadcrumbProvider,
  useBreadcrumbContext,
  type BreadcrumbItem,
} from '../../context/BreadcrumbContext';

describe('BreadcrumbContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BreadcrumbProvider>{children}</BreadcrumbProvider>
  );

  beforeEach(() => {
    // Each test starts fresh due to new provider instances
  });

  describe('useBreadcrumbContext', () => {
    it('should throw when used outside BreadcrumbProvider', () => {
      expect(() => {
        renderHook(() => useBreadcrumbContext());
      }).toThrow(
        'useBreadcrumbContext must be used within a BreadcrumbProvider'
      );
    });

    it('should not throw when used inside BreadcrumbProvider', () => {
      expect(() => {
        renderHook(() => useBreadcrumbContext(), { wrapper });
      }).not.toThrow();
    });
  });

  describe('BreadcrumbProvider', () => {
    it('should render children', () => {
      const { result } = renderHook(() => useBreadcrumbContext(), { wrapper });
      expect(result.current).toBeDefined();
    });

    it('should provide initial empty items array', () => {
      const { result } = renderHook(() => useBreadcrumbContext(), { wrapper });
      expect(result.current.items).toEqual([]);
    });

    it('should provide initial bgColor as bg-white', () => {
      const { result } = renderHook(() => useBreadcrumbContext(), { wrapper });
      expect(result.current.bgColor).toBe('bg-white');
    });

    it('should provide setItems function', () => {
      const { result } = renderHook(() => useBreadcrumbContext(), { wrapper });
      expect(typeof result.current.setItems).toBe('function');
    });

    it('should provide setBgColor function', () => {
      const { result } = renderHook(() => useBreadcrumbContext(), { wrapper });
      expect(typeof result.current.setBgColor).toBe('function');
    });
  });

  describe('setItems', () => {
    it('should update items when setItems is called', () => {
      const { result } = renderHook(() => useBreadcrumbContext(), { wrapper });

      const newItems: BreadcrumbItem[] = [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Settings' },
      ];

      act(() => {
        result.current.setItems(newItems);
      });

      expect(result.current.items).toEqual(newItems);
    });

    it('should handle items with path property', () => {
      const { result } = renderHook(() => useBreadcrumbContext(), { wrapper });

      const newItems: BreadcrumbItem[] = [
        { label: 'Home', path: '/home' },
      ];

      act(() => {
        result.current.setItems(newItems);
      });

      expect(result.current.items[0].path).toBe('/home');
    });

    it('should handle items without path property', () => {
      const { result } = renderHook(() => useBreadcrumbContext(), { wrapper });

      const newItems: BreadcrumbItem[] = [{ label: 'Current Page' }];

      act(() => {
        result.current.setItems(newItems);
      });

      expect(result.current.items[0].path).toBeUndefined();
    });

    it('should handle items with state property', () => {
      const { result } = renderHook(() => useBreadcrumbContext(), { wrapper });

      const newItems: BreadcrumbItem[] = [
        {
          label: 'Visit Details',
          path: '/visit-details/123',
          state: { fromLabel: 'Prescriptions', fromPath: '/prescriptions' },
        },
      ];

      act(() => {
        result.current.setItems(newItems);
      });

      expect(result.current.items[0].state).toEqual({
        fromLabel: 'Prescriptions',
        fromPath: '/prescriptions',
      });
    });

    it('should replace items entirely on each call', () => {
      const { result } = renderHook(() => useBreadcrumbContext(), { wrapper });

      act(() => {
        result.current.setItems([{ label: 'First' }]);
      });
      expect(result.current.items).toHaveLength(1);

      act(() => {
        result.current.setItems([{ label: 'Second' }, { label: 'Third' }]);
      });
      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0].label).toBe('Second');
    });

    it('should allow clearing items by setting empty array', () => {
      const { result } = renderHook(() => useBreadcrumbContext(), { wrapper });

      act(() => {
        result.current.setItems([{ label: 'Dashboard' }]);
      });
      expect(result.current.items).toHaveLength(1);

      act(() => {
        result.current.setItems([]);
      });
      expect(result.current.items).toEqual([]);
    });
  });

  describe('setBgColor', () => {
    it('should update bgColor when setBgColor is called', () => {
      const { result } = renderHook(() => useBreadcrumbContext(), { wrapper });

      act(() => {
        result.current.setBgColor('bg-gray-50');
      });

      expect(result.current.bgColor).toBe('bg-gray-50');
    });

    it('should accept custom Tailwind bg classes', () => {
      const { result } = renderHook(() => useBreadcrumbContext(), { wrapper });

      act(() => {
        result.current.setBgColor('bg-[#F5F5FA]');
      });

      expect(result.current.bgColor).toBe('bg-[#F5F5FA]');
    });

    it('should allow resetting bgColor to default', () => {
      const { result } = renderHook(() => useBreadcrumbContext(), { wrapper });

      act(() => {
        result.current.setBgColor('bg-gray-100');
      });
      expect(result.current.bgColor).toBe('bg-gray-100');

      act(() => {
        result.current.setBgColor('bg-white');
      });
      expect(result.current.bgColor).toBe('bg-white');
    });
  });

  describe('setItems and setBgColor stability', () => {
    it('should maintain stable setItems reference across re-renders', () => {
      const { result, rerender } = renderHook(
        () => useBreadcrumbContext(),
        { wrapper }
      );

      const firstSetItems = result.current.setItems;
      rerender();
      const secondSetItems = result.current.setItems;

      expect(firstSetItems).toBe(secondSetItems);
    });

    it('should maintain stable setBgColor reference across re-renders', () => {
      const { result, rerender } = renderHook(
        () => useBreadcrumbContext(),
        { wrapper }
      );

      const firstSetBgColor = result.current.setBgColor;
      rerender();
      const secondSetBgColor = result.current.setBgColor;

      expect(firstSetBgColor).toBe(secondSetBgColor);
    });
  });
});
