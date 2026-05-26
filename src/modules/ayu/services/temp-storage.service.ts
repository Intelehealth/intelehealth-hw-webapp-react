import { MindmapPortalApi } from '../../../services/mindmap';
import type {
  PendingResources,
  TempStorageApiResponse,
  TempStorageRecord,
  TempStorageResourceType,
  UpsertAssetMeta,
  UpsertResourcePayload,
} from '../types/temp-storage.types';

export const TEMP_STORAGE_ENDPOINTS = Object.freeze({
  ROOT: '/temp-storage',
  UPLOAD: '/temp-storage/upload',
  PENDING: '/temp-storage/pending',
  SYNC: '/temp-storage/sync',
  byResource: (type: TempStorageResourceType, id: string) =>
    `/temp-storage/${type}/${id}`,
  children: (type: TempStorageResourceType, id: string) =>
    `/temp-storage/${type}/${id}/children`,
} as const);

export function upsertResource<TData = unknown>(
  payload: UpsertResourcePayload<TData>
): Promise<TempStorageApiResponse<TempStorageRecord<TData>>> {
  return MindmapPortalApi.post<
    TempStorageApiResponse<TempStorageRecord<TData>>
  >(TEMP_STORAGE_ENDPOINTS.ROOT, payload);
}

export function upsertAssetResource<TData = Record<string, unknown>>(
  file: File,
  meta: UpsertAssetMeta<TData>
): Promise<TempStorageApiResponse<TempStorageRecord<TData>>> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('resource_type', 'asset');
  formData.append('resource_id', meta.resource_id);
  formData.append('created_by', meta.created_by);
  if (meta.parent_type) formData.append('parent_type', meta.parent_type);
  if (meta.parent_id) formData.append('parent_id', meta.parent_id);
  if (meta.data) formData.append('data', JSON.stringify(meta.data));

  return MindmapPortalApi.post<
    TempStorageApiResponse<TempStorageRecord<TData>>
  >(TEMP_STORAGE_ENDPOINTS.UPLOAD, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function getResource<TData = unknown>(
  resourceType: TempStorageResourceType,
  resourceId: string
): Promise<TempStorageApiResponse<TempStorageRecord<TData>>> {
  try {
    return await MindmapPortalApi.get<
      TempStorageApiResponse<TempStorageRecord<TData>>
    >(TEMP_STORAGE_ENDPOINTS.byResource(resourceType, resourceId));
  } catch (error: unknown) {
    if (
      error != null &&
      typeof error === 'object' &&
      'response' in error &&
      (error as { response?: { status?: number } }).response?.status === 404
    ) {
      return {
        success: false,
        message: 'Not found',
        data: null,
      } as unknown as TempStorageApiResponse<TempStorageRecord<TData>>;
    }
    throw error;
  }
}

export function getChildResources<TData = unknown>(
  resourceType: TempStorageResourceType,
  resourceId: string,
  childType?: TempStorageResourceType
): Promise<TempStorageApiResponse<TempStorageRecord<TData>[]>> {
  return MindmapPortalApi.get<
    TempStorageApiResponse<TempStorageRecord<TData>[]>
  >(TEMP_STORAGE_ENDPOINTS.children(resourceType, resourceId), {
    params: childType ? { type: childType } : undefined,
  });
}

export function getPendingResources<TData = unknown>(
  query: PendingResources = {}
): Promise<TempStorageApiResponse<TempStorageRecord<TData>[]>> {
  return MindmapPortalApi.get<
    TempStorageApiResponse<TempStorageRecord<TData>[]>
  >(TEMP_STORAGE_ENDPOINTS.PENDING, { params: query });
}

export function bulkMarkSynced(
  ids: number[]
): Promise<TempStorageApiResponse<{ updatedCount: number }>> {
  return MindmapPortalApi.patch<
    TempStorageApiResponse<{ updatedCount: number }>
  >(TEMP_STORAGE_ENDPOINTS.SYNC, { ids });
}
