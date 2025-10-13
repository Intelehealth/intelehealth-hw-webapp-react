import { useCallback, useState } from 'react';
import { httpService } from '../services/http';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../reducers';
import { startLoading, stopLoading } from '../reducers/loader.reducer';

// Basic HTTP hook with loading and error states
export function useHttp<T = unknown>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loaderId: string | undefined = undefined; // optional section loader ID
  const dispatch = useDispatch();

  const loading = useSelector((state: RootState) =>
    loaderId
      ? (state.loader.sections[loaderId] ?? 0) > 0
      : state.loader.globalLoading
  );
  const get = useCallback(async (url: string) => {
    dispatch(startLoading());

    try {
      setError(null);
      const result = await httpService.get<T>(url);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Request failed';
      setError(errorMessage);
      return null;
    } finally {
      dispatch(stopLoading());
    }
  }, []);

  const post = useCallback(async (url: string, data?: unknown) => {
    try {
      dispatch(startLoading(loaderId));
      setError(null);
      const result = await httpService.post<T>(url, data);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Request failed';
      setError(errorMessage);
      return null;
    } finally {
      dispatch(stopLoading(loaderId));
    }
  }, []);

  const put = useCallback(async (url: string, data?: unknown) => {
    try {
      dispatch(startLoading(loaderId));
      setError(null);
      const result = await httpService.put<T>(url, data);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Request failed';
      setError(errorMessage);
      return null;
    } finally {
      dispatch(stopLoading(loaderId));
    }
  }, []);

  const deleteRequest = useCallback(async (url: string) => {
    try {
      dispatch(startLoading(loaderId));
      setError(null);
      const result = await httpService.delete<T>(url);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Request failed';
      setError(errorMessage);
      return null;
    } finally {
      dispatch(stopLoading(loaderId));
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    dispatch(stopLoading(loaderId));
  }, []);

  return {
    data,
    loading,
    error,
    get,
    post,
    put,
    delete: deleteRequest,
    reset,
  };
}
