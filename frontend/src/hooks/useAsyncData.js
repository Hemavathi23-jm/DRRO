import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * @param {() => Promise<any>} fetcher
 * @param {any[]} deps
 * @param {{ pollIntervalMs?: number }} [options] — silent background refresh interval
 */
export function useAsyncData(fetcher, deps = [], options = {}) {
  const { pollIntervalMs = 0 } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refetch = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load data');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!pollIntervalMs || pollIntervalMs < 1000) return undefined;
    const id = setInterval(() => refetch({ silent: true }), pollIntervalMs);
    return () => clearInterval(id);
  }, [pollIntervalMs, refetch, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch, setData };
}
