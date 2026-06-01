import { afterEach, describe, expect, it } from 'vitest';
import {
  getJobAidType,
  getJobAidUrl,
  physExamAssets,
} from '../../../../modules/ayu/utils/physExamAssets';

describe('getJobAidUrl', () => {
  afterEach(() => {
    // Clean up any injected keys
    for (const key of Object.keys(physExamAssets)) {
      delete physExamAssets[key];
    }
  });

  it('should return undefined when no assets match', () => {
    expect(getJobAidUrl('jaundice')).toBeUndefined();
  });

  it('should return the asset URL when a matching file is found', () => {
    physExamAssets['../assets/physicalExamAssets/jaundice.jpg'] = '/bundled/jaundice.jpg';
    expect(getJobAidUrl('jaundice')).toBe('/bundled/jaundice.jpg');
  });

  it('should return undefined when fileName does not match any key', () => {
    physExamAssets['../assets/physicalExamAssets/pallor.png'] = '/bundled/pallor.png';
    expect(getJobAidUrl('cyanosis')).toBeUndefined();
  });
});

describe('getJobAidType', () => {
  afterEach(() => {
    for (const key of Object.keys(physExamAssets)) {
      delete physExamAssets[key];
    }
  });

  it('returns "image" for a jpg/png asset (so a mislabelled "video" still renders as an image)', () => {
    physExamAssets['../assets/physicalExamAssets/pallor.jpg'] = '/bundled/pallor.jpg';
    expect(getJobAidType('pallor')).toBe('image');
  });

  it('returns "video" only for an .mp4 asset', () => {
    physExamAssets['../assets/physicalExamAssets/throat.mp4'] = '/bundled/throat.mp4';
    expect(getJobAidType('throat')).toBe('video');
  });

  it('returns undefined when the asset is missing', () => {
    expect(getJobAidType('missing')).toBeUndefined();
  });
});
