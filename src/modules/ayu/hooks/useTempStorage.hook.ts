import { useCallback, useEffect, useState } from 'react';
import {
  bulkMarkSynced,
  getChildResources,
  getPendingResources,
  getResource,
  upsertAssetResource,
  upsertResource,
} from '../services/temp-storage.service';
import type {
  PendingResources,
  TempStorageRecord,
  TempStorageResourceType,
  UpsertAssetMeta,
  UpsertResourcePayload,
} from '../types/temp-storage.types';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

function initialState<T>(): AsyncState<T> {
  return { data: null, loading: false, error: null };
}

/**
 * Imperative hook for upsert/delete operations.
 * Returned callbacks resolve with the record or throw — caller decides what to do next.
 */
export function useTempStorage() {
  const [state, setState] =
    useState<AsyncState<TempStorageRecord>>(initialState<TempStorageRecord>());

  const upsert = useCallback(
    async <TData = null>(payload: UpsertResourcePayload<TData>) => {
      setState({ data: null, loading: true, error: null });
      try {
        const res = await upsertResource<TData>(payload);
        setState({
          data: res.data as TempStorageRecord,
          loading: false,
          error: null,
        });
        return res.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ data: null, loading: false, error });
        throw error;
      }
    },
    []
  );

  const upsertAsset = useCallback(
    async <TData = Record<string, unknown>>(
      file: File,
      meta: UpsertAssetMeta<TData>
    ) => {
      setState({ data: null, loading: true, error: null });
      try {
        const res = await upsertAssetResource<TData>(file, meta);
        setState({
          data: res.data as TempStorageRecord,
          loading: false,
          error: null,
        });
        return res.data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ data: null, loading: false, error });
        throw error;
      }
    },
    []
  );
  return { ...state, upsert, upsertAsset };
}

/**
 * Fetch a single resource by type + id. Auto-runs when id/type change.
 */
export function useTempResource<TData = null>(
  type: TempStorageResourceType | null,
  id: string | null
) {
  const [state, setState] =
    useState<AsyncState<TempStorageRecord<TData>>>(
      initialState<TempStorageRecord<TData>>()
    );

  const refetch = useCallback(async () => {
    if (!type || !id) return;
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await getResource<TData>(type, id);
      setState({ data: res.data, loading: false, error: null });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({ data: null, loading: false, error });
    }
  }, [type, id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}

/**
 * Fetch direct children of a resource (optionally filtered by child type).
 */
export function useTempChildren<TData = null>(
  type: TempStorageResourceType | null,
  id: string | null,
  childType?: TempStorageResourceType
) {
  const [state, setState] =
    useState<AsyncState<TempStorageRecord<TData>[]>>(
      initialState<TempStorageRecord<TData>[]>()
    );

  const refetch = useCallback(async () => {
    if (!type || !id) return;
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await getChildResources<TData>(type, id, childType);
      setState({ data: res.data, loading: false, error: null });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({ data: null, loading: false, error });
    }
  }, [type, id, childType]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}

/**
 * Fetch unsynced records. Does NOT auto-run — call `fetch` when needed
 * (e.g. when the user opens a Sync panel or on reconnect).
 */
export function usePendingResources<TData = null>(
  query: PendingResources = {}
) {
  const [state, setState] =
    useState<AsyncState<TempStorageRecord<TData>[]>>(
      initialState<TempStorageRecord<TData>[]>()
    );

  const fetch = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await getPendingResources<TData>(query);
      setState({ data: res.data, loading: false, error: null });
      return res.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({ data: null, loading: false, error });
      throw error;
    }
  }, [query]);

  return { ...state, fetch };
}

/**
 * Idempotent sync marker. Call after successful push to the main backend.
 * Accepts one id or many.
 */
export function useMarkSynced() {
  const [state, setState] =
    useState<AsyncState<{ updatedCount: number }>>(
      initialState<{ updatedCount: number }>()
    );

  const markSynced = useCallback(async (ids: number | number[]) => {
    const idList = Array.isArray(ids) ? ids : [ids];
    if (idList.length === 0)
      return { updatedCount: 0 } as { updatedCount: number };

    setState({ data: null, loading: true, error: null });
    try {
      const res = await bulkMarkSynced(idList);
      setState({ data: res.data, loading: false, error: null });
      return res.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({ data: null, loading: false, error });
      throw error;
    }
  }, []);

  return { ...state, markSynced };
}
