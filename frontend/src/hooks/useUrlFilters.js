import { useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Sync filter state with URL search params.
 * Pass a stable defaults object (module-level or useMemo).
 */
export function useUrlFilters(defaults = {}) {
  const [params, setParams] = useSearchParams();
  const defaultsRef = useRef(defaults);
  defaultsRef.current = defaults;

  const values = useMemo(() => {
    const defs = defaultsRef.current;
    const next = { ...defs };
    Object.keys(defs).forEach((key) => {
      const raw = params.get(key);
      if (raw == null) return;
      if (typeof defs[key] === 'boolean') {
        next[key] = raw === '1' || raw === 'true';
      } else {
        next[key] = raw;
      }
    });
    return next;
  }, [params]);

  const setValue = useCallback((key, value) => {
    const defs = defaultsRef.current;
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      const def = defs[key];
      const isDefault =
        value === def ||
        value === 'ALL' ||
        value === '' ||
        value === false ||
        value == null;
      if (isDefault) next.delete(key);
      else if (typeof value === 'boolean') next.set(key, value ? '1' : '0');
      else next.set(key, String(value));
      return next;
    }, { replace: true });
  }, [setParams]);

  const clearAll = useCallback(() => {
    setParams({}, { replace: true });
  }, [setParams]);

  const setMany = useCallback((patch) => {
    const defs = defaultsRef.current;
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(patch).forEach(([key, value]) => {
        const def = defs[key];
        const isDefault =
          value === def ||
          value === 'ALL' ||
          value === '' ||
          value === false ||
          value == null;
        if (isDefault) next.delete(key);
        else if (typeof value === 'boolean') next.set(key, value ? '1' : '0');
        else next.set(key, String(value));
      });
      return next;
    }, { replace: true });
  }, [setParams]);

  return { values, setValue, setMany, clearAll };
}
