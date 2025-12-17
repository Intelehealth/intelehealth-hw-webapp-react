// src/utils/cookie.ts
import Cookies from 'js-cookie';

export const cookie = {
  setCookie: (
    name: string,
    value: string,
    options?: Cookies.CookieAttributes
  ): void => {
    Cookies.set(name, value, {
      expires: 7,
      secure: true,
      sameSite: 'strict',
      ...options,
    });
  },

  getCookie: (name: string): string | undefined => {
    return Cookies.get(name);
  },

  removeCookie: (name: string, options?: Cookies.CookieAttributes): void => {
    Cookies.remove(name, options);
  },

  hasCookie: (name: string): boolean => {
    return !!Cookies.get(name);
  },

  setJSessionId: (jsessionId: string): void => {
    Cookies.set('JSESSIONID', jsessionId, {
      expires: 7,
      secure: true,
      sameSite: 'strict',
    });
  },

  getJSessionId: (): string | undefined => {
    return Cookies.get('JSESSIONID');
  },
  removeJSessionId: (): void => {
    Cookies.remove('JSESSIONID', { path: '/' });
  },
};
