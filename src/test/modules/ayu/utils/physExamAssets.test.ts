import { afterEach, describe, expect, it } from 'vitest';
import { getJobAidUrl, physExamAssets } from '../../../../modules/ayu/utils/physExamAssets';

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
