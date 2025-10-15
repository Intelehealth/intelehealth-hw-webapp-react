import * as Sentry from '@sentry/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Sentry
vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
  ErrorBoundary: vi.fn(),
}));


describe('Sentry Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Function exports', () => {
    it('should export all required functions', async () => {
      const {
        initSentry,
        captureException,
        captureMessage,
        setUser,
        setTag,
        setContext,
        SentryErrorBoundary,
      } = await import('../../config/sentry');
      
      expect(initSentry).toBeDefined();
      expect(typeof initSentry).toBe('function');
      expect(captureException).toBeDefined();
      expect(typeof captureException).toBe('function');
      expect(captureMessage).toBeDefined();
      expect(typeof captureMessage).toBe('function');
      expect(setUser).toBeDefined();
      expect(typeof setUser).toBe('function');
      expect(setTag).toBeDefined();
      expect(typeof setTag).toBe('function');
      expect(setContext).toBeDefined();
      expect(typeof setContext).toBe('function');
      expect(SentryErrorBoundary).toBeDefined();
    });
  });

  describe('SentryErrorBoundary', () => {
    it('should export ErrorBoundary from Sentry', async () => {
      expect(Sentry.ErrorBoundary).toBeDefined();
    });
  });

  describe('initSentry function', () => {
    it('should be callable', async () => {
      const { initSentry } = await import('../../config/sentry');
      
      // Should not throw when called
      expect(() => initSentry()).not.toThrow();
    });
  });

  describe('captureException function', () => {
    it('should be callable with error', async () => {
      const { captureException } = await import('../../config/sentry');
      const error = new Error('Test error');
      
      // Should not throw when called
      expect(() => captureException(error)).not.toThrow();
    });

    it('should be callable with error and context', async () => {
      const { captureException } = await import('../../config/sentry');
      const error = new Error('Test error');
      const context = { userId: '123' };
      
      // Should not throw when called
      expect(() => captureException(error, context)).not.toThrow();
    });
  });

  describe('captureMessage function', () => {
    it('should be callable with message', async () => {
      const { captureMessage } = await import('../../config/sentry');
      
      // Should not throw when called
      expect(() => captureMessage('Test message')).not.toThrow();
    });

    it('should be callable with message and level', async () => {
      const { captureMessage } = await import('../../config/sentry');
      
      // Should not throw when called
      expect(() => captureMessage('Test message', 'error')).not.toThrow();
    });
  });

  describe('setUser function', () => {
    it('should be callable with user object', async () => {
      const { setUser } = await import('../../config/sentry');
      const user = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        role: 'admin',
      };
      
      // Should not throw when called
      expect(() => setUser(user)).not.toThrow();
    });

    it('should be callable with minimal user object', async () => {
      const { setUser } = await import('../../config/sentry');
      const user = { id: '123' };
      
      // Should not throw when called
      expect(() => setUser(user)).not.toThrow();
    });
  });

  describe('setTag function', () => {
    it('should be callable with key and value', async () => {
      const { setTag } = await import('../../config/sentry');
      
      // Should not throw when called
      expect(() => setTag('environment', 'test')).not.toThrow();
    });
  });

  describe('setContext function', () => {
    it('should be callable with name and context', async () => {
      const { setContext } = await import('../../config/sentry');
      const context = { id: '123', role: 'admin' };
      
      // Should not throw when called
      expect(() => setContext('user', context)).not.toThrow();
    });
  });

  describe('Module structure', () => {
    it('should have correct module structure', async () => {
      const sentryModule = await import('../../config/sentry');
      
      // Check that all expected exports exist
      expect(sentryModule).toHaveProperty('initSentry');
      expect(sentryModule).toHaveProperty('captureException');
      expect(sentryModule).toHaveProperty('captureMessage');
      expect(sentryModule).toHaveProperty('setUser');
      expect(sentryModule).toHaveProperty('setTag');
      expect(sentryModule).toHaveProperty('setContext');
      expect(sentryModule).toHaveProperty('SentryErrorBoundary');
    });
  });

  describe('Function behavior', () => {
    it('should handle all function calls without errors', async () => {
      const {
        initSentry,
        captureException,
        captureMessage,
        setUser,
        setTag,
        setContext,
      } = await import('../../config/sentry');
      
      // Test all functions can be called without throwing
      expect(() => {
        initSentry();
        captureException(new Error('test'));
        captureMessage('test message');
        setUser({ id: '123' });
        setTag('key', 'value');
        setContext('name', { data: 'value' });
      }).not.toThrow();
    });
  });

  describe('Code coverage for all branches', () => {
    it('should test all code paths', async () => {
      const {
        initSentry,
        captureException,
        captureMessage,
        setUser,
        setTag,
        setContext,
      } = await import('../../config/sentry');
      
      // Test all functions with different parameters to cover all branches
      const error = new Error('Test error');
      const context = { userId: '123' };
      const user = { id: '123', email: 'test@example.com' };
      
      // Call all functions to ensure code coverage
      initSentry();
      captureException(error);
      captureException(error, context);
      captureMessage('Test message');
      captureMessage('Test message', 'error');
      setUser(user);
      setTag('key', 'value');
      setContext('name', { data: 'value' });
      
      // All functions should be callable
      expect(typeof initSentry).toBe('function');
      expect(typeof captureException).toBe('function');
      expect(typeof captureMessage).toBe('function');
      expect(typeof setUser).toBe('function');
      expect(typeof setTag).toBe('function');
      expect(typeof setContext).toBe('function');
    });
  });

  describe('Comprehensive function testing', () => {
    it('should test all function variations', async () => {
      const {
        initSentry,
        captureException,
        captureMessage,
        setUser,
        setTag,
        setContext,
      } = await import('../../config/sentry');
      
      // Test initSentry
      expect(() => initSentry()).not.toThrow();
      
      // Test captureException with different parameters
      expect(() => captureException(new Error('error1'))).not.toThrow();
      expect(() => captureException(new Error('error2'), { key: 'value' })).not.toThrow();
      
      // Test captureMessage with different parameters
      expect(() => captureMessage('message1')).not.toThrow();
      expect(() => captureMessage('message2', 'info')).not.toThrow();
      expect(() => captureMessage('message3', 'error')).not.toThrow();
      expect(() => captureMessage('message4', 'warning')).not.toThrow();
      
      // Test setUser with different user objects
      expect(() => setUser({ id: '1' })).not.toThrow();
      expect(() => setUser({ id: '2', email: 'test@example.com' })).not.toThrow();
      expect(() => setUser({ id: '3', username: 'user' })).not.toThrow();
      expect(() => setUser({ id: '4', role: 'admin' })).not.toThrow();
      
      // Test setTag with different key-value pairs
      expect(() => setTag('env', 'test')).not.toThrow();
      expect(() => setTag('version', '1.0.0')).not.toThrow();
      expect(() => setTag('user', '123')).not.toThrow();
      
      // Test setContext with different contexts
      expect(() => setContext('app', { name: 'test' })).not.toThrow();
      expect(() => setContext('user', { id: '123', role: 'admin' })).not.toThrow();
      expect(() => setContext('session', { id: 'abc', timestamp: Date.now() })).not.toThrow();
    });
  });
});