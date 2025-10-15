import { describe, expect, it } from 'vitest';
import { MindmapAuthGatewayApi, MindmapPortalApi } from '../../services/mindmap';

describe('MindmapService', () => {
  it('should export MindmapAuthGatewayApi', () => {
    expect(MindmapAuthGatewayApi).toBeDefined();
    expect(typeof MindmapAuthGatewayApi).toBe('object');
  });

  it('should export MindmapPortalApi', () => {
    expect(MindmapPortalApi).toBeDefined();
    expect(typeof MindmapPortalApi).toBe('object');
  });

  it('should be instances of the same class', () => {
    expect(MindmapAuthGatewayApi.constructor).toBe(MindmapPortalApi.constructor);
  });

  it('should have different instances', () => {
    expect(MindmapAuthGatewayApi).not.toBe(MindmapPortalApi);
  });

  it('should be valid service instances', () => {
    expect(MindmapAuthGatewayApi).toBeInstanceOf(Object);
    expect(MindmapPortalApi).toBeInstanceOf(Object);
  });
});