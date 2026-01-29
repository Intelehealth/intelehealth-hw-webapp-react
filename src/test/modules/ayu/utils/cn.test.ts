import { describe, expect, it } from 'vitest';
import { cn } from '../../../../modules/ayu/utils/cn';

describe('cn utility', () => {
  describe('Basic Functionality', () => {
    it('should merge single class name', () => {
      expect(cn('text-red-500')).toBe('text-red-500');
    });

    it('should merge multiple class names', () => {
      const result = cn('text-red-500', 'bg-blue-500');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });

    it('should handle empty string', () => {
      expect(cn('')).toBe('');
    });

    it('should handle undefined', () => {
      expect(cn(undefined)).toBe('');
    });

    it('should handle null', () => {
      expect(cn(null)).toBe('');
    });

    it('should handle multiple empty values', () => {
      expect(cn('', null, undefined)).toBe('');
    });
  });

  describe('Conditional Classes', () => {
    it('should handle boolean conditions with clsx', () => {
      const isActive = true;
      expect(cn('base', isActive && 'active')).toContain('base');
      expect(cn('base', isActive && 'active')).toContain('active');
    });

    it('should exclude false conditions', () => {
      const isInactive = false;
      const result = cn('base', isInactive && 'inactive');
      expect(result).toContain('base');
      expect(result).not.toContain('inactive');
    });

    it('should handle object syntax', () => {
      const result = cn({
        'text-red-500': true,
        'bg-blue-500': false,
        'p-4': true,
      });
      expect(result).toContain('text-red-500');
      expect(result).not.toContain('bg-blue-500');
      expect(result).toContain('p-4');
    });

    it('should handle array of classes', () => {
      const result = cn(['text-red-500', 'bg-blue-500']);
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });

    it('should handle nested arrays', () => {
      const result = cn(['text-red-500', ['bg-blue-500', 'p-4']]);
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('p-4');
    });
  });

  describe('Tailwind Merge', () => {
    it('should deduplicate conflicting Tailwind classes', () => {
      const result = cn('p-4', 'p-8');
      expect(result).toBe('p-8');
      expect(result).not.toContain('p-4');
    });

    it('should keep last value for conflicting classes', () => {
      const result = cn('text-sm', 'text-lg');
      expect(result).toBe('text-lg');
    });

    it('should merge non-conflicting classes', () => {
      const result = cn('text-red-500', 'bg-blue-500');
      expect(result).toContain('text-red-500');
      expect(result).toContain('bg-blue-500');
    });

    it('should handle conflicting margin classes', () => {
      const result = cn('mx-4', 'mx-8');
      expect(result).toBe('mx-8');
    });

    it('should handle conflicting padding classes', () => {
      const result = cn('px-2', 'py-4', 'px-6');
      expect(result).toContain('py-4');
      expect(result).toContain('px-6');
      expect(result).not.toContain('px-2');
    });

    it('should handle directional padding conflicts', () => {
      const result = cn('pt-4', 'pb-4', 'py-8');
      expect(result).toBe('py-8');
    });

    it('should handle width conflicts', () => {
      const result = cn('w-full', 'w-1/2');
      expect(result).toBe('w-1/2');
    });

    it('should handle height conflicts', () => {
      const result = cn('h-screen', 'h-full');
      expect(result).toBe('h-full');
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle mixed conditional and conflicting classes', () => {
      const isActive = true;
      const result = cn('p-4', isActive && 'p-8', 'text-red-500');
      expect(result).toContain('p-8');
      expect(result).toContain('text-red-500');
      expect(result).not.toContain('p-4');
    });

    it('should handle multiple conditions with conflicts', () => {
      const isLarge = true;
      const isExtraLarge = false;
      const result = cn(
        'text-sm',
        isLarge && 'text-lg',
        isExtraLarge && 'text-xl',
        'bg-blue-500'
      );
      expect(result).toBe('text-lg bg-blue-500');
    });

    it('should handle object and string mix', () => {
      const result = cn('base', { active: true, disabled: false }, 'extra');
      expect(result).toContain('base');
      expect(result).toContain('active');
      expect(result).not.toContain('disabled');
      expect(result).toContain('extra');
    });

    it('should handle all input types together', () => {
      const showConditional = true;
      const result = cn(
        'base',
        ['array-class'],
        { object: true },
        showConditional && 'conditional',
        'final'
      );
      expect(result).toContain('base');
      expect(result).toContain('array-class');
      expect(result).toContain('object');
      expect(result).toContain('conditional');
      expect(result).toContain('final');
    });
  });

  describe('Real-world Component Examples', () => {
    it('should handle button variant classes', () => {
      const variant = 'primary';
      const result = cn(
        'btn-base',
        variant === 'primary' && 'bg-blue-500',
      );
      expect(result).toContain('btn-base');
      expect(result).toContain('bg-blue-500');
      expect(result).not.toContain('bg-gray-500');
    });

    it('should handle size classes with conflicts', () => {
      const size = 'lg';
      const result = cn(
        'px-4 py-2',
        size === 'lg' && 'px-6 py-3'
      );
      expect(result).toBe('px-6 py-3');
    });

    it('should handle disabled state', () => {
      const disabled = true;
      const result = cn(
        'bg-blue-500 text-white',
        disabled && 'opacity-50 cursor-not-allowed'
      );
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('text-white');
      expect(result).toContain('opacity-50');
      expect(result).toContain('cursor-not-allowed');
    });

    it('should handle responsive classes', () => {
      const result = cn('w-full', 'md:w-1/2', 'lg:w-1/3');
      expect(result).toContain('w-full');
      expect(result).toContain('md:w-1/2');
      expect(result).toContain('lg:w-1/3');
    });

    it('should handle hover and focus states', () => {
      const result = cn(
        'bg-blue-500',
        'hover:bg-blue-600',
        'focus:ring-2',
        'focus:ring-blue-300'
      );
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('hover:bg-blue-600');
      expect(result).toContain('focus:ring-2');
      expect(result).toContain('focus:ring-blue-300');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long class strings', () => {
      const longClasses = Array.from({ length: 50 }, (_, i) => `class-${i}`).join(' ');
      const result = cn(longClasses);
      expect(result).toBeTruthy();
    });

    it('should handle special characters in class names', () => {
      const result = cn('w-[500px]', 'h-[calc(100vh-64px)]');
      expect(result).toContain('w-[500px]');
      expect(result).toContain('h-[calc(100vh-64px)]');
    });

    it('should handle arbitrary values', () => {
      const result = cn('bg-[#1da1f2]', 'text-[14px]');
      expect(result).toContain('bg-[#1da1f2]');
      expect(result).toContain('text-[14px]');
    });

    it('should handle important modifier', () => {
      const result = cn('text-red-500', '!text-blue-500');
      expect(result).toContain('!text-blue-500');
    });

    it('should handle negative values', () => {
      const result = cn('-mt-4', 'mb-4');
      expect(result).toContain('-mt-4');
      expect(result).toContain('mb-4');
    });

    it('should handle decimal values', () => {
      const result = cn('opacity-75', 'opacity-50');
      expect(result).toBe('opacity-50');
    });
  });

  describe('Performance', () => {
    it('should handle many arguments efficiently', () => {
      const classes = Array.from({ length: 100 }, (_, i) => `class-${i}`);
      const result = cn(...classes);
      expect(result).toBeTruthy();
    });

    it('should handle deeply nested conditions', () => {
      const condition1 = true;
      const condition2 = true;
      const condition3 = true;
      const result = cn(
        'base',
        condition1 && (condition2 && (condition3 && 'deeply-nested'))
      );
      expect(result).toContain('base');
      expect(result).toContain('deeply-nested');
    });
  });
});
