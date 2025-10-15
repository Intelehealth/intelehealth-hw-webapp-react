import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, expect, vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Extend expect with custom matchers
expect.extend({
  // Add custom matchers here if needed
});

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Store original console methods
let originalError: typeof console.error;
let originalWarn: typeof console.warn;

// Mock console methods to reduce noise in tests
beforeAll(() => {
  // Suppress console.error for React warnings during tests
  originalError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  // Suppress console.warn for React warnings during tests
  originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('React'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  // Restore console methods
  if (originalError) console.error = originalError;
  if (originalWarn) console.warn = originalWarn;
});
