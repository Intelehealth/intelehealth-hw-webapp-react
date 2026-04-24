import { describe, expect, it } from 'vitest';
import { ABOUT_US_CONTENT } from '../../../assets/data/about-us.data';

describe('ABOUT_US_CONTENT', () => {
  it('should have title', () => {
    expect(ABOUT_US_CONTENT.title).toBe('About Us');
  });

  it('should have two paragraphs', () => {
    expect(ABOUT_US_CONTENT.paragraphs).toHaveLength(2);
    expect(ABOUT_US_CONTENT.paragraphs[0]).toContain('Intelehealth');
    expect(ABOUT_US_CONTENT.paragraphs[1]).toContain('Intelehealth');
  });

  it('should have checkOutLabel', () => {
    expect(ABOUT_US_CONTENT.checkOutLabel).toBe('Check out our');
  });

  it('should have termsLink with text and path', () => {
    expect(ABOUT_US_CONTENT.termsLink.text).toBe('Terms & Conditions');
    expect(ABOUT_US_CONTENT.termsLink.path).toBe(
      'https://intelehealth.org/terms-of-use/',
    );
  });

  it('should have visitWebsite with text and url', () => {
    expect(ABOUT_US_CONTENT.visitWebsite.text).toBe('Visit Website');
    expect(ABOUT_US_CONTENT.visitWebsite.url).toBe('https://intelehealth.org');
  });
});
