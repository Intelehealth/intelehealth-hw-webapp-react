import { useCallback, useState } from 'react';

// Basic HTTP hook with loading and error states
export function useHttp<T = unknown>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const get = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      void url;
      const result = null as T;
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const post = useCallback(async (url: string, data: unknown) => {
    setLoading(true);
    setError(null);
    try {
      void url;
      void data;
      const result = null as T;
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const put = useCallback(async (url: string, data: unknown) => {
    setLoading(true);
    setError(null);
    try {
      void url;
      void data;
      const result = null as T;
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const del = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      void url;
      const result = null as T;
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    get,
    post,
    put,
    delete: del,
    reset,
  };
}
