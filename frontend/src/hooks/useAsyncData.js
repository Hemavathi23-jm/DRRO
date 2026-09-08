import { useEffect, useState } from 'react';

export function useAsyncData(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refetch(); }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, refetch, setData };
}
