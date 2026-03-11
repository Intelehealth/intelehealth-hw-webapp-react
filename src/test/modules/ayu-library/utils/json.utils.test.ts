import { describe, expect, it } from 'vitest';
import { safeJsonParse } from '../../../../modules/ayu-library/utils/json.utils';

describe('safeJsonParse', () => {
  describe('valid JSON', () => {
    it('should parse a simple object', () => {
      expect(safeJsonParse('{"key":"value"}')).toEqual({ key: 'value' });
    });

    it('should parse an array', () => {
      expect(safeJsonParse('[1,2,3]')).toEqual([1, 2, 3]);
    });

    it('should parse a string', () => {
      expect(safeJsonParse('"hello"')).toBe('hello');
    });

    it('should parse a number', () => {
      expect(safeJsonParse('42')).toBe(42);
    });

    it('should parse true', () => {
      expect(safeJsonParse('true')).toBe(true);
    });

    it('should parse false', () => {
      expect(safeJsonParse('false')).toBe(false);
    });

    it('should parse null', () => {
      expect(safeJsonParse('null')).toBeNull();
    });

    it('should parse nested objects', () => {
      const json = '{"a":{"b":{"c":1}}}';
      expect(safeJsonParse(json)).toEqual({ a: { b: { c: 1 } } });
    });

    it('should parse array of objects', () => {
      const json = '[{"id":1},{"id":2}]';
      expect(safeJsonParse(json)).toEqual([{ id: 1 }, { id: 2 }]);
    });

    it('should preserve empty string values', () => {
      expect(safeJsonParse('""')).toBe('');
    });

    it('should preserve zero', () => {
      expect(safeJsonParse('0')).toBe(0);
    });
  });

  describe('invalid JSON', () => {
    it('should return null for invalid JSON', () => {
      expect(safeJsonParse('{invalid}')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(safeJsonParse('')).toBeNull();
    });

    it('should return null for undefined-like strings', () => {
      expect(safeJsonParse('undefined')).toBeNull();
    });

    it('should return null for trailing commas', () => {
      expect(safeJsonParse('{"a":1,}')).toBeNull();
    });

    it('should return null for single quotes', () => {
      expect(safeJsonParse("{'key':'value'}")).toBeNull();
    });

    it('should return null for unquoted keys', () => {
      expect(safeJsonParse('{key:"value"}')).toBeNull();
    });
  });

  describe('special characters', () => {
    it('should handle unicode characters', () => {
      expect(safeJsonParse('{"name":"héllo"}')).toEqual({ name: 'héllo' });
    });

    it('should handle escaped quotes', () => {
      expect(safeJsonParse('{"msg":"say \\"hi\\""}')).toEqual({
        msg: 'say "hi"',
      });
    });

    it('should handle newlines in strings', () => {
      expect(safeJsonParse('{"text":"line1\\nline2"}')).toEqual({
        text: 'line1\nline2',
      });
    });
  });

  describe('real-world scenarios', () => {
    it('should parse a FHIR questionnaire structure', () => {
      const json = JSON.stringify({
        resourceType: 'Questionnaire',
        item: [
          { linkId: '1', text: 'Question 1', type: 'string' },
          { linkId: '2', text: 'Question 2', type: 'choice' },
        ],
      });
      const result = safeJsonParse(json);
      expect(result.resourceType).toBe('Questionnaire');
      expect(result.item).toHaveLength(2);
    });

    it('should parse API response structure', () => {
      const json = JSON.stringify({
        data: [{ name: 'Fever.json', value: '{}' }],
      });
      const result = safeJsonParse(json);
      expect(result.data[0].name).toBe('Fever.json');
    });
  });
});
