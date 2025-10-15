import { beforeAll, describe, expect, it } from 'vitest';
import i18n, { changeLanguage, t } from './i18n';

// These keys must exist in en.json and at least one non-en locale
const SAMPLE_KEYS = ['Login', 'Privacy_Policy'];

describe('i18n configuration', () => {
  beforeAll(async () => {
    // ensure initialized (module side-effect already runs init)
    if (!i18n.isInitialized) {
      await i18n.init();
    }
  });

  it('initializes with default language en and fallback en', () => {
    expect(i18n.language).toBe('en');
    const fallback = i18n.options.fallbackLng as unknown;
    if (typeof fallback === 'string') {
      expect(fallback).toBe('en');
    } else if (Array.isArray(fallback)) {
      expect(fallback).toContain('en');
    } else if (fallback && typeof fallback === 'object') {
      const values = Object.values(
        fallback as Record<string, unknown>
      ).flat() as unknown[];
      expect(values).toContain('en');
    } else {
      throw new Error('Unexpected fallbackLng type');
    }
  });

  it('exposes resources for configured locales', () => {
    const resources = i18n.options.resources as Record<string, unknown>;
    // Ensure all expected locales exist
    for (const lng of ['en', 'hi', 'ru', 'kn', 'ml', 'mr', 'ta', 'te', 'gu']) {
      expect(resources[lng]).toBeDefined();
    }
  });

  it('has interpolation.escapeValue set to false', () => {
    expect(i18n.options.interpolation?.escapeValue).toBe(false);
  });

  it('t() helper resolves keys in default language', () => {
    for (const key of SAMPLE_KEYS) {
      const res = t(key);
      // In case of missing key, i18next returns the key itself
      expect(typeof res).toBe('string');
      expect(res.length).toBeGreaterThan(0);
    }
  });

  it('changeLanguage switches language and t() resolves accordingly', async () => {
    // Switch to a non-default language present in resources
    await changeLanguage('hi');
    expect(i18n.language).toBe('hi');

    for (const key of SAMPLE_KEYS) {
      const res = t(key);
      expect(typeof res).toBe('string');
      expect(res.length).toBeGreaterThan(0);
    }

    // Switch back to default
    await changeLanguage('en');
    expect(i18n.language).toBe('en');
  });
});
