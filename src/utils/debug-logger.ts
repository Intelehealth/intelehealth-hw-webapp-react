/**
 * Debug Logger Utility
 *
 * Enable:
 * localStorage.setItem('debug', 'true')
 * Disable:
 * localStorage.removeItem('debug')
 */

const isDebugEnabled = (): boolean => {
  try {
    return localStorage.getItem('debug') === 'true';
  } catch {
    return false;
  }
};

export const debugLog = {
  log: (...args: unknown[]) => {
    if (isDebugEnabled()) {
      console.info('[DEBUG]', ...args);
    }
  },

  info: (...args: unknown[]) => {
    if (isDebugEnabled()) {
      console.info('[DEBUG INFO]', ...args);
    }
  },

  warn: (...args: unknown[]) => {
    if (isDebugEnabled()) {
      console.warn('[DEBUG WARN]', ...args);
    }
  },

  error: (...args: unknown[]) => {
    if (isDebugEnabled()) {
      console.error('[DEBUG ERROR]', ...args);
    }
  },

  group: (label: string) => {
    if (isDebugEnabled()) {
      console.group(`[DEBUG] ${label}`);
    }
  },

  groupEnd: () => {
    if (isDebugEnabled()) {
      console.groupEnd();
    }
  },
};
