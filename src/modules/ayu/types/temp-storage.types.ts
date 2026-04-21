export type TempStorageResourceType = 'patient' | 'visit' | 'asset';

export interface TempStorageRecord<TData = null> {
  id: number;
  resource_type: TempStorageResourceType;
  resource_id: string;
  parent_type: TempStorageResourceType | null;
  parent_id: string | null;
  data: TData;
  file_path: string | null;
  created_by: string;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpsertResourcePayload<TData = null> {
  resource_type: TempStorageResourceType;
  resource_id: string;
  parent_type?: TempStorageResourceType | null;
  parent_id?: string | null;
  data: TData;
  created_by: string;
}

export interface UpsertAssetMeta<TData = Record<string, unknown>> {
  resource_id: string;
  parent_type?: TempStorageResourceType | null;
  parent_id?: string | null;
  created_by: string;
  data?: TData;
}

export interface PendingResources {
  resourceType?: TempStorageResourceType;
  createdBy?: string;
}

export interface TempStorageApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
