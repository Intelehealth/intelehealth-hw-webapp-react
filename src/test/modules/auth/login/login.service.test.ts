import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoisted mocks for API singletons used inside the service
const h = vi.hoisted(() => ({
  mindmapPost: vi.fn(),
  openmrsGet: vi.fn(),
  openmrsDelete: vi.fn(),
}));

vi.mock('../../../../services/mindmap', () => ({
  MindmapAuthGatewayApi: {
    post: (...args: unknown[]) => h.mindmapPost(...args),
  },
}));

vi.mock('../../../../services/openmrs', () => ({
  OpenMRSApi: {
    get: (...args: unknown[]) => h.openmrsGet(...args),
    delete: (...args: unknown[]) => h.openmrsDelete(...args),
  },
}));

import { API_ENDPOINTS, loginService } from '../../../../modules/auth/login/login.service';

describe('login.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('login() posts to the /auth/login endpoint with provided credentials', async () => {
    const credentials = { username: 'john', password: 'secret' };
    const response = { token: 'jwt-123', user: { uuid: 'u-1' } };
    h.mindmapPost.mockResolvedValue(response);

    const result = await loginService.login(credentials);

    expect(h.mindmapPost).toHaveBeenCalledTimes(1);
    expect(h.mindmapPost).toHaveBeenCalledWith(
      API_ENDPOINTS.LOGIN,
      credentials
    );
    expect(result).toEqual(response);
  });

  it('openMRSLogin() calls OpenMRS /session with given axios config', async () => {
    const config = { headers: { Authorization: 'Basic abc' } };
    const omrsResponse = {
      user: { uuid: 'omrs-user' },
      sessionId: 'sess-1',
      authenticated: true,
    };
    h.openmrsGet.mockResolvedValue(omrsResponse);

    const result = await loginService.openMRSLogin(config);

    expect(h.openmrsGet).toHaveBeenCalledTimes(1);
    expect(h.openmrsGet).toHaveBeenCalledWith(
      API_ENDPOINTS.OPENMRSLOGIN,
      config
    );
    expect(result).toEqual(omrsResponse);
  });

  it('propagates errors from login()', async () => {
    const credentials = { username: 'john', password: 'wrong' };
    const err = new Error('network');
    h.mindmapPost.mockRejectedValue(err);

    await expect(loginService.login(credentials)).rejects.toThrow('network');
  });

  it('propagates errors from openMRSLogin()', async () => {
    const config = { headers: { Authorization: 'Basic xyz' } };
    const err = new Error('401 Unauthorized');
    h.openmrsGet.mockRejectedValue(err);

    await expect(loginService.openMRSLogin(config)).rejects.toThrow(
      '401 Unauthorized'
    );
  });

  it('exports the correct API endpoints', () => {
    expect(API_ENDPOINTS.LOGIN).toBe('/auth/login');
    expect(API_ENDPOINTS.OPENMRSLOGIN).toBe('/session');
  });

  it('openMRSLogout() calls OpenMRS DELETE /session with given axios config', async () => {
    const config = { headers: { Authorization: 'Basic logout' } };
    h.openmrsDelete.mockResolvedValue({ status: 204 });

    const result = await loginService.openMRSLogout(config);

    expect(h.openmrsDelete).toHaveBeenCalledTimes(1);
    expect(h.openmrsDelete).toHaveBeenCalledWith(
      API_ENDPOINTS.OPENMRSLOGIN,
      config
    );
    expect(result).toEqual({ status: 204 });
  });
});
