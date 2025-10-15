import { describe, expect, it } from 'vitest';
import { OpenMRSApi } from '../../services/openmrs';

describe('OpenMRSService', () => {
  it('should export OpenMRSApi', () => {
    expect(OpenMRSApi).toBeDefined();
    expect(typeof OpenMRSApi).toBe('object');
  });

  it('should be a valid service instance', () => {
    expect(OpenMRSApi).toBeInstanceOf(Object);
  });

  it('should have the correct constructor name', () => {
    expect(OpenMRSApi.constructor.name).toBe('OpenMRSService');
  });
});