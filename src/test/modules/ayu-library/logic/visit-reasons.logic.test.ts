import { describe, expect, it } from 'vitest';
import {
  extractVisitReasonNames,
  filterNamesBySearch,
  groupByFirstLetter,
} from '../../../../modules/ayu-library/logic/visit-reasons.logic';

describe('extractVisitReasonNames', () => {
  it('should strip .json extension from names', () => {
    const items = [{ name: 'Fever.json' }, { name: 'Cough.json' }];
    const result = extractVisitReasonNames(items, []);
    expect(result).toEqual(['Cough', 'Fever']);
  });

  it('should strip .JSON extension (case-insensitive)', () => {
    const items = [{ name: 'Fever.JSON' }];
    const result = extractVisitReasonNames(items, []);
    expect(result).toEqual(['Fever']);
  });

  it('should exclude specified names', () => {
    const items = [
      { name: 'Fever.json' },
      { name: 'famHist.json' },
      { name: 'Cough.json' },
    ];
    const result = extractVisitReasonNames(items, ['famHist']);
    expect(result).toEqual(['Cough', 'Fever']);
  });

  it('should sort names alphabetically', () => {
    const items = [
      { name: 'Zoster.json' },
      { name: 'Asthma.json' },
      { name: 'Malaria.json' },
    ];
    const result = extractVisitReasonNames(items, []);
    expect(result).toEqual(['Asthma', 'Malaria', 'Zoster']);
  });

  it('should return empty array for empty input', () => {
    expect(extractVisitReasonNames([], [])).toEqual([]);
  });
});

describe('filterNamesBySearch', () => {
  const names = ['Fever', 'Cough', 'Fatigue', 'Flu'];

  it('should return empty array when search is empty', () => {
    expect(filterNamesBySearch(names, '')).toEqual([]);
  });

  it('should filter names case-insensitively', () => {
    expect(filterNamesBySearch(names, 'f')).toEqual(['Fever', 'Fatigue', 'Flu']);
  });

  it('should match partial strings', () => {
    expect(filterNamesBySearch(names, 'ver')).toEqual(['Fever']);
  });

  it('should return empty array when no match', () => {
    expect(filterNamesBySearch(names, 'xyz')).toEqual([]);
  });

  it('should match case-insensitively', () => {
    expect(filterNamesBySearch(names, 'COUGH')).toEqual(['Cough']);
  });
});

describe('groupByFirstLetter', () => {
  it('should group names by first letter (uppercased)', () => {
    const names = ['Apple', 'Avocado', 'Banana', 'Cherry'];
    const result = groupByFirstLetter(names);
    expect(result).toEqual({
      A: ['Apple', 'Avocado'],
      B: ['Banana'],
      C: ['Cherry'],
    });
  });

  it('should sort items within each group', () => {
    const names = ['Banana', 'Blueberry', 'Blackberry'];
    const result = groupByFirstLetter(names);
    expect(result.B).toEqual(['Banana', 'Blackberry', 'Blueberry']);
  });

  it('should handle empty array', () => {
    expect(groupByFirstLetter([])).toEqual({});
  });

  it('should trim whitespace from names', () => {
    const names = ['  Apple  ', ' Banana'];
    const result = groupByFirstLetter(names);
    expect(result).toEqual({
      A: ['Apple'],
      B: ['Banana'],
    });
  });

  it('should handle lowercase first letters', () => {
    const names = ['apple', 'banana'];
    const result = groupByFirstLetter(names);
    expect(result).toEqual({
      A: ['apple'],
      B: ['banana'],
    });
  });
});
