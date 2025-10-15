import { describe, expect, it } from 'vitest';
import { cn } from '../../utils/cn';

describe('cn utility', () => {
  it('merges classes correctly', () => {
    const result = cn('text-red-500', 'text-blue-500');
    expect(result).toBe('text-blue-500');
  });

  it('handles conditional classes', () => {
    const condition = true;
    const hidden = false;
    const result = cn(
      'base-class',
      condition ? 'conditional-class' : undefined,
      hidden ? 'hidden-class' : undefined
    );
    expect(result).toBe('base-class conditional-class');
  });

  it('handles empty inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('handles single class', () => {
    const result = cn('single-class');
    expect(result).toBe('single-class');
  });

  it('handles multiple classes', () => {
    const result = cn('class1', 'class2', 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('handles conflicting Tailwind classes', () => {
    const result = cn('p-2', 'p-4', 'px-3');
    expect(result).toBe('p-4 px-3');
  });

  it('handles arrays of classes', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toBe('class1 class2 class3');
  });

  it('handles objects with boolean values', () => {
    const result = cn({
      'class1': true,
      'class2': false,
      'class3': true
    });
    expect(result).toBe('class1 class3');
  });

  it('handles mixed input types', () => {
    const result = cn('base', ['array1', 'array2'], { 'object1': true, 'object2': false }, 'final');
    expect(result).toBe('base array1 array2 object1 final');
  });

  it('handles undefined and null values', () => {
    const result = cn('base', undefined, null, 'end');
    expect(result).toBe('base end');
  });

  it('handles complex Tailwind conflicts', () => {
    const result = cn('bg-red-500', 'bg-blue-500', 'hover:bg-green-500');
    expect(result).toBe('bg-blue-500 hover:bg-green-500');
  });
});
