import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { safeJsonParse } from '../../../../modules/ayu/utils/json.utils';

describe('safeJsonParse', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('Valid JSON', () => {
    it('should parse valid JSON object', () => {
      const json = '{"name": "John", "age": 30}';
      const result = safeJsonParse(json);
      expect(result).toEqual({ name: 'John', age: 30 });
    });

    it('should parse valid JSON array', () => {
      const json = '[1, 2, 3, 4, 5]';
      const result = safeJsonParse(json);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should parse valid JSON string', () => {
      const json = '"Hello World"';
      const result = safeJsonParse(json);
      expect(result).toBe('Hello World');
    });

    it('should parse valid JSON number', () => {
      const json = '42';
      const result = safeJsonParse(json);
      expect(result).toBe(42);
    });

    it('should parse valid JSON boolean', () => {
      const json = 'true';
      const result = safeJsonParse(json);
      expect(result).toBe(true);
    });

    it('should parse valid JSON null', () => {
      const json = 'null';
      const result = safeJsonParse(json);
      expect(result).toBeNull();
    });

    it('should parse nested JSON object', () => {
      const json = '{"user": {"name": "John", "address": {"city": "New York"}}}';
      const result = safeJsonParse(json);
      expect(result).toEqual({
        user: {
          name: 'John',
          address: {
            city: 'New York',
          },
        },
      });
    });

    it('should parse JSON with arrays', () => {
      const json = '{"items": [{"id": 1}, {"id": 2}]}';
      const result = safeJsonParse(json);
      expect(result).toEqual({
        items: [{ id: 1 }, { id: 2 }],
      });
    });

    it('should parse empty object', () => {
      const json = '{}';
      const result = safeJsonParse(json);
      expect(result).toEqual({});
    });

    it('should parse empty array', () => {
      const json = '[]';
      const result = safeJsonParse(json);
      expect(result).toEqual([]);
    });
  });

  describe('Invalid JSON', () => {
    it('should return null for invalid JSON', () => {
      const json = '{invalid json}';
      const result = safeJsonParse(json);
      expect(result).toBeNull();
    });

    it('should return null for malformed object', () => {
      const json = '{"name": "John",}';
      const result = safeJsonParse(json);
      expect(result).toBeNull();
    });

    it('should return null for unclosed brackets', () => {
      const json = '{"name": "John"';
      const result = safeJsonParse(json);
      expect(result).toBeNull();
    });

    it('should return null for single quotes', () => {
      const json = "{'name': 'John'}";
      const result = safeJsonParse(json);
      expect(result).toBeNull();
    });

    it('should return null for unquoted keys', () => {
      const json = '{name: "John"}';
      const result = safeJsonParse(json);
      expect(result).toBeNull();
    });

    it('should return null for trailing commas', () => {
      const json = '{"name": "John", "age": 30,}';
      const result = safeJsonParse(json);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const json = '';
      const result = safeJsonParse(json);
      expect(result).toBeNull();
    });

    it('should return null for plain text', () => {
      const json = 'This is not JSON';
      const result = safeJsonParse(json);
      expect(result).toBeNull();
    });

    it('should return null for undefined value', () => {
      const json = 'undefined';
      const result = safeJsonParse(json);
      expect(result).toBeNull();
    });

    it('should return null for NaN', () => {
      const json = 'NaN';
      const result = safeJsonParse(json);
      expect(result).toBeNull();
    });
  });

  describe('Error Logging', () => {
    it('should log error for invalid JSON', () => {
      const json = '{invalid}';
      safeJsonParse(json);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'JSON parse failed',
        expect.any(Error)
      );
    });

    it('should log error with proper error object', () => {
      const json = '{"unclosed": "bracket"';
      safeJsonParse(json);
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'JSON parse failed',
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });

    it('should not log error for valid JSON', () => {
      const json = '{"valid": "json"}';
      safeJsonParse(json);
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('Special Characters', () => {
    it('should parse JSON with escaped quotes', () => {
      const json = '{"text": "He said \\"Hello\\""}';
      const result = safeJsonParse(json);
      expect(result).toEqual({ text: 'He said "Hello"' });
    });

    it('should parse JSON with newlines', () => {
      const json = '{"text": "Line 1\\nLine 2"}';
      const result = safeJsonParse(json);
      expect(result).toEqual({ text: 'Line 1\nLine 2' });
    });

    it('should parse JSON with unicode characters', () => {
      const json = '{"emoji": "\\u2764\\uFE0F"}';
      const result = safeJsonParse(json);
      expect(result).toEqual({ emoji: '❤️' });
    });

    it('should parse JSON with special characters', () => {
      const json = '{"symbols": "!@#$%^&*()"}';
      const result = safeJsonParse(json);
      expect(result).toEqual({ symbols: '!@#$%^&*()' });
    });

    it('should parse JSON with backslashes', () => {
      const json = '{"path": "C:\\\\Users\\\\test"}';
      const result = safeJsonParse(json);
      expect(result).toEqual({ path: 'C:\\Users\\test' });
    });
  });

  describe('Edge Cases', () => {
    it('should parse very large numbers', () => {
      const largeNumber = 9007199254740991; // Number.MAX_SAFE_INTEGER
      const json = String(largeNumber);
      const result = safeJsonParse(json);
      expect(result).toBe(largeNumber);
    });

    it('should parse negative numbers', () => {
      const json = '-42';
      const result = safeJsonParse(json);
      expect(result).toBe(-42);
    });

    it('should parse floating point numbers', () => {
      const json = '3.14159';
      const result = safeJsonParse(json);
      expect(result).toBe(3.14159);
    });

    it('should parse scientific notation', () => {
      const json = '1.23e10';
      const result = safeJsonParse(json);
      expect(result).toBe(1.23e10);
    });

    it('should parse deeply nested structures', () => {
      const json = '{"a":{"b":{"c":{"d":{"e":"deep"}}}}}';
      const result = safeJsonParse(json);
      expect(result).toEqual({ a: { b: { c: { d: { e: 'deep' } } } } });
    });

    it('should parse JSON with whitespace', () => {
      const json = '  {  "name"  :  "John"  }  ';
      const result = safeJsonParse(json);
      expect(result).toEqual({ name: 'John' });
    });

    it('should parse multiline JSON', () => {
      const json = `{
        "name": "John",
        "age": 30
      }`;
      const result = safeJsonParse(json);
      expect(result).toEqual({ name: 'John', age: 30 });
    });
  });

  describe('Real-world Scenarios', () => {
    it('should parse API response', () => {
      const json = '{"status":"success","data":{"id":1,"name":"Test"}}';
      const result = safeJsonParse(json);
      expect(result).toEqual({
        status: 'success',
        data: { id: 1, name: 'Test' },
      });
    });

    it('should parse configuration object', () => {
      const json = '{"debug":true,"timeout":5000,"endpoints":["api1","api2"]}';
      const result = safeJsonParse(json);
      expect(result).toEqual({
        debug: true,
        timeout: 5000,
        endpoints: ['api1', 'api2'],
      });
    });

    it('should parse mindmap JSON data', () => {
      const json = '{"id":1,"name":"Protocol.json","keyName":"test_Protocols","isActive":true}';
      const result = safeJsonParse(json);
      expect(result).toEqual({
        id: 1,
        name: 'Protocol.json',
        keyName: 'test_Protocols',
        isActive: true,
      });
    });

    it('should return null for corrupted data', () => {
      const json = '{"data":{"incomplete":';
      const result = safeJsonParse(json);
      expect(result).toBeNull();
    });
  });

  describe('Type Preservation', () => {
    it('should preserve boolean false', () => {
      const json = 'false';
      const result = safeJsonParse(json);
      expect(result).toBe(false);
      expect(typeof result).toBe('boolean');
    });

    it('should preserve number zero', () => {
      const json = '0';
      const result = safeJsonParse(json);
      expect(result).toBe(0);
      expect(typeof result).toBe('number');
    });

    it('should preserve empty string in object', () => {
      const json = '{"value":""}';
      const result = safeJsonParse(json);
      expect(result).toEqual({ value: '' });
    });

    it('should preserve null values in object', () => {
      const json = '{"value":null}';
      const result = safeJsonParse(json);
      expect(result).toEqual({ value: null });
    });
  });
});
