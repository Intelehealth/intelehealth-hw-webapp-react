import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { cookie } from '../../utils/cookie';

// Mock js-cookie
vi.mock('js-cookie', () => ({
  default: {
    set: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
  },
}));

import Cookies from 'js-cookie';

describe('cookie utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setCookie', () => {
    it('sets cookie with default options', () => {
      cookie.setCookie('test', 'value');

      expect(Cookies.set).toHaveBeenCalledWith('test', 'value', {
        expires: 7,
        secure: true,
        sameSite: 'strict',
      });
    });

    it('sets cookie with custom options', () => {
      const customOptions = {
        expires: 30,
        path: '/admin',
        domain: '.example.com',
      };

      cookie.setCookie('test', 'value', customOptions);

      expect(Cookies.set).toHaveBeenCalledWith('test', 'value', {
        expires: 30,
        secure: true,
        sameSite: 'strict',
        path: '/admin',
        domain: '.example.com',
      });
    });

    it('merges custom options with defaults', () => {
      const customOptions = {
        expires: 1,
        secure: false,
      };

      cookie.setCookie('test', 'value', customOptions);

      expect(Cookies.set).toHaveBeenCalledWith('test', 'value', {
        expires: 1,
        secure: false,
        sameSite: 'strict',
      });
    });
  });

  describe('getCookie', () => {
    it('gets cookie value', () => {
      (Cookies.get as Mock).mockReturnValue('cookie-value');

      const result = cookie.getCookie('test');

      expect(Cookies.get).toHaveBeenCalledWith('test');
      expect(result).toBe('cookie-value');
    });

    it('returns undefined when cookie does not exist', () => {
      (Cookies.get as Mock).mockReturnValue(undefined);

      const result = cookie.getCookie('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('removeCookie', () => {
    it('removes cookie without options', () => {
      cookie.removeCookie('test');

      expect(Cookies.remove).toHaveBeenCalledWith('test', undefined);
    });

    it('removes cookie with options', () => {
      const options = { path: '/admin', domain: '.example.com' };
      cookie.removeCookie('test', options);

      expect(Cookies.remove).toHaveBeenCalledWith('test', options);
    });
  });

  describe('hasCookie', () => {
    it('returns true when cookie exists', () => {
      (Cookies.get as Mock).mockReturnValue('cookie-value');

      const result = cookie.hasCookie('test');

      expect(result).toBe(true);
    });

    it('returns false when cookie does not exist', () => {
      (Cookies.get as Mock).mockReturnValue(undefined);

      const result = cookie.hasCookie('test');

      expect(result).toBe(false);
    });

    it('returns false when cookie value is empty string', () => {
      (Cookies.get as Mock).mockReturnValue('');

      const result = cookie.hasCookie('test');

      expect(result).toBe(false);
    });
  });

  describe('setJSessionId', () => {
    it('sets JSESSIONID cookie with correct options', () => {
      cookie.setJSessionId('session123');

      expect(Cookies.set).toHaveBeenCalledWith('JSESSIONID', 'session123', {
        expires: 7,
        secure: true,
        sameSite: 'strict',
      });
    });
  });

  describe('getJSessionId', () => {
    it('gets JSESSIONID cookie', () => {
      (Cookies.get as Mock).mockReturnValue('session123');

      const result = cookie.getJSessionId();

      expect(Cookies.get).toHaveBeenCalledWith('JSESSIONID');
      expect(result).toBe('session123');
    });

    it('returns undefined when JSESSIONID does not exist', () => {
      (Cookies.get as Mock).mockReturnValue(undefined);

      const result = cookie.getJSessionId();

      expect(result).toBeUndefined();
    });
  });
});
