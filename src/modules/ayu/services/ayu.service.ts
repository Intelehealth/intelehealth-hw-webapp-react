import { MindmapPortalApi } from '../../../services/mindmap';
import type { AyuApiResponse } from '../../ayu-library/types/ayu-json.types';

// Basic API endpoints
export const API_ENDPOINTS = Object.freeze({
  MINDMAP_JSON_BY_KEY: '/mindmap/details/',
} as const);

export async function fetchAyuJsonList(
  keyName: string
): Promise<AyuApiResponse> {
  const response = await MindmapPortalApi.get<AyuApiResponse>(
    `${API_ENDPOINTS.MINDMAP_JSON_BY_KEY}${keyName}`
  );

  return response;
}
