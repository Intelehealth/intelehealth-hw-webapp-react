import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '../../config/env';
import { fetchPostalCodeData } from '../../services/postal-code.service';
import type { PostalCodeApiResponse } from '../../types/postal-code.type';

// Mock global fetch
global.fetch = vi.fn();

describe('postal-code.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchPostalCodeData', () => {
    it('should return null for invalid postal code format (less than 6 digits)', async () => {
      const result = await fetchPostalCodeData('12345');
      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return null for invalid postal code format (more than 6 digits)', async () => {
      const result = await fetchPostalCodeData('1234567');
      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return null for invalid postal code format (non-numeric)', async () => {
      const result = await fetchPostalCodeData('12345a');
      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should return null for empty string', async () => {
      const result = await fetchPostalCodeData('');
      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should trim whitespace from postal code', async () => {
      const mockResponse: PostalCodeApiResponse = {
        Message: 'Number of pincode(s) found:1',
        Status: 'Success',
        PostOffice: [
          {
            Name: 'Test City',
            Description: null,
            BranchType: 'Head Post Office',
            DeliveryStatus: 'Delivery',
            Circle: 'Test Circle',
            District: 'Test District',
            Division: 'Test Division',
            Region: 'Test Region',
            Block: 'Test Block',
            State: 'Test State',
            Country: 'India',
            Pincode: '123456',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchPostalCodeData('  123456  ');
      expect(result).not.toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        `${env.PORTAL_API_URL}/pincode/123456`
      );
    });

    it('should fetch and return postal code data successfully', async () => {
      const mockResponse: PostalCodeApiResponse = {
        Message: 'Number of pincode(s) found:1',
        Status: 'Success',
        PostOffice: [
          {
            Name: 'Indore',
            Description: null,
            BranchType: 'Head Post Office',
            DeliveryStatus: 'Delivery',
            Circle: 'Madhya Pradesh',
            District: 'Indore',
            Division: 'Indore City',
            Region: 'Indore',
            Block: 'Indore',
            State: 'Madhya Pradesh',
            Country: 'India',
            Pincode: '452001',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchPostalCodeData('452001');

      expect(global.fetch).toHaveBeenCalledWith(
        `${env.PORTAL_API_URL}/pincode/452001`
      );
      expect(result).toEqual({
        state: 'Madhya Pradesh',
        district: 'Indore',
        city: 'Indore',
      });
    });

    it('should return null when API returns Error status', async () => {
      const mockResponse: PostalCodeApiResponse = {
        Message: 'No records found',
        Status: 'Error',
        PostOffice: null,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchPostalCodeData('999999');

      expect(result).toBeNull();
    });

    it('should return null when PostOffice array is empty', async () => {
      const mockResponse: PostalCodeApiResponse = {
        Message: 'Number of pincode(s) found:0',
        Status: 'Success',
        PostOffice: [],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchPostalCodeData('123456');

      expect(result).toBeNull();
    });

    it('should return null when PostOffice is null', async () => {
      const mockResponse: PostalCodeApiResponse = {
        Message: 'No records found',
        Status: 'Success',
        PostOffice: null,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchPostalCodeData('123456');

      expect(result).toBeNull();
    });

    it('should use first PostOffice entry when multiple are returned', async () => {
      const mockResponse: PostalCodeApiResponse = {
        Message: 'Number of pincode(s) found:7',
        Status: 'Success',
        PostOffice: [
          {
            Name: 'Indore',
            Description: null,
            BranchType: 'Head Post Office',
            DeliveryStatus: 'Delivery',
            Circle: 'Madhya Pradesh',
            District: 'Indore',
            Division: 'Indore City',
            Region: 'Indore',
            Block: 'Indore',
            State: 'Madhya Pradesh',
            Country: 'India',
            Pincode: '452001',
          },
          {
            Name: 'Indore CGO Complex',
            Description: null,
            BranchType: 'Sub Post Office',
            DeliveryStatus: 'Non-Delivery',
            Circle: 'Madhya Pradesh',
            District: 'Indore',
            Division: 'Indore City',
            Region: 'Indore',
            Block: 'Indore',
            State: 'Madhya Pradesh',
            Country: 'India',
            Pincode: '452001',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchPostalCodeData('452001');

      expect(result).toEqual({
        state: 'Madhya Pradesh',
        district: 'Indore',
        city: 'Indore',
      });
    });

    it('should handle missing fields in PostOffice data', async () => {
      const mockResponse: PostalCodeApiResponse = {
        Message: 'Number of pincode(s) found:1',
        Status: 'Success',
        PostOffice: [
          {
            Name: '',
            Description: null,
            BranchType: '',
            DeliveryStatus: '',
            Circle: '',
            District: '',
            Division: '',
            Region: '',
            Block: '',
            State: '',
            Country: '',
            Pincode: '123456',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchPostalCodeData('123456');

      expect(result).toEqual({
        state: '',
        district: '',
        city: '',
      });
    });

    it('should throw error when fetch fails', async () => {
      const error = new Error('Network error');
      (global.fetch as any).mockRejectedValueOnce(error);

      await expect(fetchPostalCodeData('123456')).rejects.toThrow('Network error');
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching postal code data:',
        error
      );
    });

    it('should throw error when response is not ok', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(fetchPostalCodeData('123456')).rejects.toThrow(
        'HTTP error! status: 404'
      );
    });

    it('should handle JSON parsing errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(fetchPostalCodeData('123456')).rejects.toThrow('Invalid JSON');
    });

    it('should use Block field for city', async () => {
      const mockResponse: PostalCodeApiResponse = {
        Message: 'Number of pincode(s) found:1',
        Status: 'Success',
        PostOffice: [
          {
            Name: 'Post Office Name',
            Description: null,
            BranchType: 'Head Post Office',
            DeliveryStatus: 'Delivery',
            Circle: 'Test Circle',
            District: 'Test District',
            Division: 'Test Division',
            Region: 'Test Region',
            Block: 'Test Block',
            State: 'Test State',
            Country: 'India',
            Pincode: '123456',
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchPostalCodeData('123456');

      expect(result?.city).toBe('Test Block');
    });
  });
});

