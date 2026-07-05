'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * A boolean flag persisted to localStorage, read via useSyncExternalStore so it
 * stays hydration-safe (server snapshot = default) without a setState effect.
 * Same-tab updates are broadcast with a synthetic storage event.
 */
export function usePersistedFlag(key: string, defaultValue = false): [boolean, (next: boolean) => void] {
  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener('storage', cb);
    return () => window.removeEventListener('storage', cb);
  }, []);

  const getSnapshot = useCallback(() => {
    const raw = window.localStorage.getItem(key);
    return raw == null ? defaultValue : raw === '1';
  }, [key, defaultValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => defaultValue);

  const set = useCallback(
    (next: boolean) => {
      window.localStorage.setItem(key, next ? '1' : '0');
      window.dispatchEvent(new StorageEvent('storage', { key }));
    },
    [key],
  );

  return [value, set];
}
