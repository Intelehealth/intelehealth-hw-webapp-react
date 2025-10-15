import { describe, expect, it } from 'vitest';
import ROUTES from '../../routes/paths';

describe('paths', () => {
  it('should export ROUTES object with correct structure', () => {
    expect(ROUTES).toBeDefined();
    expect(typeof ROUTES).toBe('object');
  });

  it('should have ROOT path', () => {
    expect(ROUTES.ROOT).toBe('/');
  });

  it('should have AUTH object with all required paths', () => {
    expect(ROUTES.AUTH).toBeDefined();
    expect(ROUTES.AUTH.BASE).toBe('/auth');
    expect(ROUTES.AUTH.LOGIN).toBe('login');
    expect(ROUTES.AUTH.FORGOT_USERNAME).toBe('forgot-username');
    expect(ROUTES.AUTH.FORGOT_PASSWORD).toBe('forgot-password');
    expect(ROUTES.AUTH.VERIFY_OTP).toBe('verify-otp');
    expect(ROUTES.AUTH.RESET_PASSWORD).toBe('reset-password');
  });

  it('should have DASHBOARD path', () => {
    expect(ROUTES.DASHBOARD).toBe('/dashboard');
  });

  it('should have COMMON_UI path', () => {
    expect(ROUTES.COMMON_UI).toBe('/common-ui');
  });

  it('should have NOT_FOUND path as catch-all', () => {
    expect(ROUTES.NOT_FOUND).toBe('*');
  });

  it('should have all AUTH routes as relative paths except BASE', () => {
    const authRoutes = Object.values(ROUTES.AUTH);
    const baseRoute = authRoutes[0]; // BASE route
    const otherRoutes = authRoutes.slice(1); // All other routes

    expect(baseRoute).toBe('/auth');
    otherRoutes.forEach(route => {
      expect(route).not.toMatch(/^\//); // Should not start with /
    });
  });

  it('should have consistent route structure', () => {
    // All main routes should start with /
    expect(ROUTES.ROOT).toMatch(/^\//);
    expect(ROUTES.DASHBOARD).toMatch(/^\//);
    expect(ROUTES.COMMON_UI).toMatch(/^\//);
    expect(ROUTES.AUTH.BASE).toMatch(/^\//);
    
    // NOT_FOUND should be catch-all
    expect(ROUTES.NOT_FOUND).toBe('*');
  });
});
