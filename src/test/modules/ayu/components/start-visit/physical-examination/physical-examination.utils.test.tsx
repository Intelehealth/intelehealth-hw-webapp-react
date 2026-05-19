import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  arraysEqual,
  getOptionIcon,
} from '../../../../../../modules/ayu/components/start-visit/physical-examination/physical-examination.utils';

describe('getOptionIcon', () => {
  it('returns a tick SVG for "yes" (case-insensitive)', () => {
    const node = getOptionIcon('Yes');
    expect(node).toBeDefined();
    const { container } = render(<>{node}</>);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    // The "yes" icon uses the check-mark path
    expect(container.querySelector('path')?.getAttribute('d')).toBe(
      'M2 7l3.5 3.5L12 3.5'
    );
  });

  it('returns a cross SVG for "no" (case-insensitive)', () => {
    const { container } = render(<>{getOptionIcon('NO')}</>);
    expect(container.querySelector('path')?.getAttribute('d')).toBe(
      'M2 2l10 10M12 2L2 12'
    );
  });

  it('returns undefined for any other label', () => {
    expect(getOptionIcon('Maybe')).toBeUndefined();
    expect(getOptionIcon('')).toBeUndefined();
  });
});

describe('arraysEqual', () => {
  it('returns true for arrays containing the same elements regardless of order', () => {
    expect(arraysEqual(['a', 'b', 'c'], ['c', 'a', 'b'])).toBe(true);
  });

  it('returns true for two empty arrays', () => {
    expect(arraysEqual([], [])).toBe(true);
  });

  it('returns false for arrays with different elements', () => {
    expect(arraysEqual(['a', 'b'], ['a', 'c'])).toBe(false);
  });

  it('returns false for arrays of different lengths', () => {
    expect(arraysEqual(['a'], ['a', 'b'])).toBe(false);
  });
});
