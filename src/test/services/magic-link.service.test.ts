import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loadService = async (base: string) => {
  vi.resetModules();
  vi.stubEnv('VITE_WEBRTC_API_URL', base);
  return (await import('../../services/magic-link.service')).magicLinkService;
};

const mockFetch = (impl: Partial<Response> | (() => never)) => {
  (global.fetch as any) = vi.fn().mockResolvedValue(impl);
};

describe('magicLinkService', () => {
  beforeEach(() => {
    (global.fetch as any) = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  describe('redeem', () => {
    it('throws when the service base URL is not configured', async () => {
      const service = await loadService('');
      await expect(service.redeem('tok')).rejects.toThrow(
        'Call service is not configured.'
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('redeems successfully and URL-encodes the token', async () => {
      const service = await loadService('http://api');
      const payload = { success: true, roomId: 'r', token: 't', visitUuid: 'v' };
      mockFetch({ ok: true, json: async () => payload } as any);

      const result = await service.redeem('a b');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://api/magic-link/redeem?m=a%20b'
      );
      expect(result).toEqual(payload);
    });

    it('throws with the server message when the response is not ok', async () => {
      const service = await loadService('http://api');
      mockFetch({ ok: false, json: async () => ({ message: 'expired' }) } as any);

      await expect(service.redeem('t')).rejects.toThrow('expired');
    });

    it('throws the default message when success is false without a message', async () => {
      const service = await loadService('http://api');
      mockFetch({ ok: true, json: async () => ({ success: false }) } as any);

      await expect(service.redeem('t')).rejects.toThrow(
        'This call link is invalid or expired.'
      );
    });

    it('falls back to an empty object when JSON parsing fails', async () => {
      const service = await loadService('http://api');
      mockFetch({
        ok: true,
        json: async () => {
          throw new Error('bad json');
        },
      } as any);

      await expect(service.redeem('t')).rejects.toThrow(
        'This call link is invalid or expired.'
      );
    });
  });

  describe('roomStatus', () => {
    it('throws when the service base URL is not configured', async () => {
      const service = await loadService('');
      await expect(service.roomStatus('r')).rejects.toThrow(
        'Call service is not configured.'
      );
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns a normalized status and URL-encodes the room id', async () => {
      const service = await loadService('http://api');
      mockFetch({
        ok: true,
        json: async () => ({
          success: true,
          participantCount: 2,
          doctorPresent: true,
        }),
      } as any);

      const result = await service.roomStatus('room 1');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://api/magic-link/room-status?room=room%201'
      );
      expect(result).toEqual({
        success: true,
        room: 'room 1',
        participantCount: 2,
        doctorPresent: true,
      });
    });

    it('defaults every field when JSON parsing fails', async () => {
      const service = await loadService('http://api');
      mockFetch({
        ok: true,
        json: async () => {
          throw new Error('boom');
        },
      } as any);

      const result = await service.roomStatus('r');

      expect(result).toEqual({
        success: false,
        room: 'r',
        participantCount: 0,
        doctorPresent: false,
      });
    });

    it('coerces a non-numeric participantCount to 0', async () => {
      const service = await loadService('http://api');
      mockFetch({
        ok: true,
        json: async () => ({
          success: false,
          participantCount: 'nope',
          doctorPresent: false,
        }),
      } as any);

      const result = await service.roomStatus('r');

      expect(result.participantCount).toBe(0);
    });
  });
});
