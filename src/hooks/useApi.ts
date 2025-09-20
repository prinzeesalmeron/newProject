import { useState, useEffect, useCallback } from 'react';
import type { ApiResponse, PaginatedResponse } from '../types';

interface UseApiOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

export function useApi<T>(
  apiFunction: () => Promise<T>,
  options: UseApiOptions<T> = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  
  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  const execute = useCallback(async () => {
    // Check if we have recent cached data
    const now = Date.now();
    if (data && (now - lastFetch) < CACHE_DURATION) {
      console.log('Using cached data');
      return data;
    }
    
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction();
      setData(result);
      setLastFetch(now);
      options.onSuccess?.(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      options.onError?.(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, options, data, lastFetch]);

  useEffect(() => {
    if (options.immediate !== false) {
      execute();
    }
  }, [execute, options.immediate]);

  return {
    data,
    loading,
    error,
    execute,
    refetch: execute,
    reset: () => {
      setData(null);
      setError(null);
      setLoading(false);
      setLastFetch(0);
    }
  };
}

export function usePaginatedApi<T>(
  apiFunction: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
  initialLimit: number = 20
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const loadPage = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiFunction(pageNum, initialLimit);
      
      if (append) {
        setData(prev => [...prev, ...result.data]);
      } else {
        setData(result.data);
      }
      
      setTotal(result.total);
      setHasMore(result.hasMore);
      setPage(pageNum);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [apiFunction, initialLimit]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      loadPage(page + 1, true);
    }
  }, [hasMore, loading, page, loadPage]);

  const refresh = useCallback(() => {
    loadPage(1, false);
  }, [loadPage]);

  useEffect(() => {
    loadPage(1, false);
  }, [loadPage]);

  return {
    data,
    loading,
    error,
    page,
    hasMore,
    total,
    loadMore,
    refresh,
    reset: () => {
      setData([]);
      setError(null);
      setPage(1);
      setHasMore(true);
      setTotal(0);
    }
  };
}