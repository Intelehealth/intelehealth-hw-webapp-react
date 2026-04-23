import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_GENERATED_PASSWORD_LENGTH,
  getApiErrorMessage,
  isValidPassword,
  randomString,
} from '../../../modules/settings/settings.helpers';

describe('settings.helpers', () => {
  describe('randomString', () => {
    it('returns a string of the requested length', () => {
      const out = randomString(12);
      expect(out).toHaveLength(12);
    });

    it('uses the expected alphanumeric charset', () => {
      const out = randomString(50);
      expect(out).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('uses DEFAULT_GENERATED_PASSWORD_LENGTH = 8', () => {
      expect(DEFAULT_GENERATED_PASSWORD_LENGTH).toBe(8);
      expect(randomString(DEFAULT_GENERATED_PASSWORD_LENGTH)).toHaveLength(8);
    });

    it('produces different values on successive calls', () => {
      const a = randomString(16);
      const b = randomString(16);
      expect(a).not.toBe(b);
    });
  });

  describe('isValidPassword', () => {
    it('rejects null / undefined / empty', () => {
      expect(isValidPassword(null)).toBe(false);
      expect(isValidPassword(undefined)).toBe(false);
      expect(isValidPassword('')).toBe(false);
    });

    it('rejects passwords shorter than 8 chars', () => {
      expect(isValidPassword('Aa1')).toBe(false);
      expect(isValidPassword('Aa1aaaa')).toBe(false); // 7 chars
    });

    it('rejects passwords without an uppercase letter', () => {
      expect(isValidPassword('abcdef12')).toBe(false);
    });

    it('rejects passwords without a lowercase letter', () => {
      expect(isValidPassword('ABCDEF12')).toBe(false);
    });

    it('rejects passwords without a digit', () => {
      expect(isValidPassword('AbcdefGh')).toBe(false);
    });

    it('rejects passwords containing whitespace', () => {
      expect(isValidPassword('Abcde 12')).toBe(false);
    });

    it('accepts passwords meeting all rules', () => {
      expect(isValidPassword('Abcdef12')).toBe(true);
      expect(isValidPassword('HelloWorld1')).toBe(true);
    });
  });

  describe('getApiErrorMessage', () => {
    it('returns response.data.error.message when present', () => {
      const err = { response: { data: { error: { message: 'nested err' } } } };
      expect(getApiErrorMessage(err, 'fallback')).toBe('nested err');
    });

    it('falls back to response.data.message', () => {
      const err = { response: { data: { message: 'flat err' } } };
      expect(getApiErrorMessage(err, 'fallback')).toBe('flat err');
    });

    it('returns fallback for unknown error shapes', () => {
      expect(getApiErrorMessage(new Error('boom'), 'fallback')).toBe('fallback');
      expect(getApiErrorMessage(null, 'fallback')).toBe('fallback');
      expect(getApiErrorMessage('string error', 'fallback')).toBe('fallback');
    });

    it('uses default "Something went wrong" when no fallback supplied', () => {
      expect(getApiErrorMessage(null)).toBe('Something went wrong');
    });
  });

  describe('randomString (integration with crypto)', () => {
    it('calls window.crypto.getRandomValues', () => {
      const spy = vi.spyOn(window.crypto, 'getRandomValues');
      randomString(5);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
