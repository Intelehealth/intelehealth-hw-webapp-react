import { MindmapConfigApi } from './mindmap';
import type { AppConfig } from '../types/config.types';

/**
 * Configuration service using MindmapConfigApi
 * Uses https://dev.intelehealth.org:4004/api (port 4004)
 */
export const configService = {
  /**
   * Fetches the published configuration from the API
   * @returns Promise<AppConfig>
   */
  async getPublishedConfig(): Promise<AppConfig> {
    try {
      const config = await MindmapConfigApi.get<AppConfig>(
        '/config/getPublishedConfig?ngsw-bypass=true'
      );
      return config;
    } catch (error) {
      console.error('Error fetching published config:', error);
      throw error;
    }
  },
};
