import axios from 'axios';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { HttpService } from '../../services/http';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('HttpService', () => {
  let httpService: HttpService;
  let mockAxiosInstance: {
    get: Mock;
    post: Mock;
    put: Mock;
    patch: Mock;
    delete: Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Create mock axios instance with proper typing
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn()
    };

    // Mock axios.create to return our mock instance
    (mockedAxios.create as Mock).mockReturnValue(mockAxiosInstance);

    // Create HttpService instance
    httpService = new HttpService({
      baseURL: 'https://api.example.com',
      timeout: 5000
    });
  });

  describe('constructor', () => {
    it('should create axios instance with provided config', () => {
      const config = {
        baseURL: 'https://test.com',
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      };

      new HttpService(config);

      expect(mockedAxios.create).toHaveBeenCalledWith(config);
    });
  });

  describe('get', () => {
    it('should make GET request and return data', async () => {
      const mockResponse = { data: { id: 1, name: 'Test' } };
      (mockAxiosInstance.get as Mock).mockResolvedValue(mockResponse);

      const result = await httpService.get('/users');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users', undefined);
      expect(result).toEqual({ id: 1, name: 'Test' });
    });

    it('should make GET request with config', async () => {
      const mockResponse = { data: { id: 1, name: 'Test' } };
      const config = { headers: { 'Authorization': 'Bearer token' } };
      (mockAxiosInstance.get as Mock).mockResolvedValue(mockResponse);

      const result = await httpService.get('/users', config);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users', config);
      expect(result).toEqual({ id: 1, name: 'Test' });
    });

    it('should handle GET request errors', async () => {
      const mockError = new Error('Network error');
      (mockAxiosInstance.get as Mock).mockRejectedValue(mockError);

      await expect(httpService.get('/users')).rejects.toThrow('Network error');
    });
  });

  describe('post', () => {
    it('should make POST request and return data', async () => {
      const mockData = { name: 'New User' };
      const mockResponse = { data: { id: 1, name: 'New User' } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await httpService.post('/users', mockData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/users', mockData, undefined);
      expect(result).toEqual({ id: 1, name: 'New User' });
    });

    it('should make POST request with config', async () => {
      const mockData = { name: 'New User' };
      const config = { headers: { 'Content-Type': 'application/json' } };
      const mockResponse = { data: { id: 1, name: 'New User' } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await httpService.post('/users', mockData, config);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/users', mockData, config);
      expect(result).toEqual({ id: 1, name: 'New User' });
    });

    it('should make POST request without data', async () => {
      const mockResponse = { data: { success: true } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await httpService.post('/logout');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/logout', undefined, undefined);
      expect(result).toEqual({ success: true });
    });

    it('should handle POST request errors', async () => {
      const mockError = new Error('Validation error');
      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(httpService.post('/users', {})).rejects.toThrow('Validation error');
    });
  });

  describe('put', () => {
    it('should make PUT request and return data', async () => {
      const mockData = { name: 'Updated User' };
      const mockResponse = { data: { id: 1, name: 'Updated User' } };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const result = await httpService.put('/users/1', mockData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/users/1', mockData, undefined);
      expect(result).toEqual({ id: 1, name: 'Updated User' });
    });

    it('should make PUT request with config', async () => {
      const mockData = { name: 'Updated User' };
      const config = { headers: { 'If-Match': 'etag123' } };
      const mockResponse = { data: { id: 1, name: 'Updated User' } };
      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const result = await httpService.put('/users/1', mockData, config);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/users/1', mockData, config);
      expect(result).toEqual({ id: 1, name: 'Updated User' });
    });

    it('should handle PUT request errors', async () => {
      const mockError = new Error('Update failed');
      mockAxiosInstance.put.mockRejectedValue(mockError);

      await expect(httpService.put('/users/1', {})).rejects.toThrow('Update failed');
    });
  });

  describe('patch', () => {
    it('should make PATCH request and return data', async () => {
      const mockData = { name: 'Patched User' };
      const mockResponse = { data: { id: 1, name: 'Patched User' } };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const result = await httpService.patch('/users/1', mockData);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/users/1', mockData, undefined);
      expect(result).toEqual({ id: 1, name: 'Patched User' });
    });

    it('should make PATCH request with config', async () => {
      const mockData = { name: 'Patched User' };
      const config = { headers: { 'If-Match': 'etag123' } };
      const mockResponse = { data: { id: 1, name: 'Patched User' } };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const result = await httpService.patch('/users/1', mockData, config);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/users/1', mockData, config);
      expect(result).toEqual({ id: 1, name: 'Patched User' });
    });

    it('should make PATCH request without data', async () => {
      const mockResponse = { data: { success: true } };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const result = await httpService.patch('/users/1/touch');

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/users/1/touch', undefined, undefined);
      expect(result).toEqual({ success: true });
    });

    it('should handle PATCH request errors', async () => {
      const mockError = new Error('Patch failed');
      mockAxiosInstance.patch.mockRejectedValue(mockError);

      await expect(httpService.patch('/users/1', {})).rejects.toThrow('Patch failed');
    });
  });

  describe('delete', () => {
    it('should make DELETE request and return data', async () => {
      const mockResponse = { data: { success: true } };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await httpService.delete('/users/1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/users/1', undefined);
      expect(result).toEqual({ success: true });
    });

    it('should make DELETE request with config', async () => {
      const config = { headers: { 'Authorization': 'Bearer token' } };
      const mockResponse = { data: { success: true } };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await httpService.delete('/users/1', config);

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/users/1', config);
      expect(result).toEqual({ success: true });
    });

    it('should handle DELETE request errors', async () => {
      const mockError = new Error('Delete failed');
      mockAxiosInstance.delete.mockRejectedValue(mockError);

      await expect(httpService.delete('/users/1')).rejects.toThrow('Delete failed');
    });
  });

  // Note: Cannot directly access protected property 'axiosInstance',
  // so we'll use a subclass to expose it for testing.

  class TestHttpService extends HttpService {
    getExposedAxiosInstance() {
      return this.axiosInstance;
    }
  }

  describe('axiosInstance property', () => {
    it('should expose axiosInstance via subclass getter', () => {
      const testHttpService = new TestHttpService({
        baseURL: 'https://test.com',
        timeout: 5000
      });
      expect(testHttpService.getExposedAxiosInstance()).toBe(mockAxiosInstance);
    });
  });
});