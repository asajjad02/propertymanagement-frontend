'use client';

/**
 * The single source of truth for a List Report's controls: search, ordering,
 * page, and filters (see docs/design/patterns/filtering.md). State lives in the
 * URL query string so a filtered view is linkable/bookmarkable and back/forward
 * works; it's also persisted per view in localStorage and re-hydrated on a fresh
 * visit that has no query params. Any change resets to page 1. The returned
 * `listParams` is handed straight to a resource `useList`.
 */
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';

import type { ListParams } from '@/types/http';

const RESERVED = ['search', 'ordering', 'page'] as const;

export interface UseTableQueryOptions {
  /** Persistence key, unique per view (e.g. 'flats'). */
  key: string;
  /** The filter param names this view uses (mapped straight to DRF query params). */
  filterKeys: string[];
  /** Default ordering when none is set in the URL. */
  defaultOrdering?: string;
}

export function useTableQuery({ key, filterKeys, defaultOrdering }: UseTableQueryOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const storageKey = `hr.table.${key}`;

  // On a fresh visit with no relevant params, restore the last-used query.
  useEffect(() => {
    const hasOwn = [...params.keys()].some(
      (k) => (RESERVED as readonly string[]).includes(k) || filterKeys.includes(k),
    );
    if (hasOwn) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) router.replace(`${pathname}?${saved}`, { scroll: false });
    } catch {
      // ignore storage failures
    }
    // Run once on mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const state = useMemo(() => {
    const filters: Record<string, string> = {};
    for (const k of filterKeys) {
      const v = params.get(k);
      if (v) filters[k] = v;
    }
    return {
      search: params.get('search') ?? '',
      ordering: params.get('ordering') ?? defaultOrdering ?? null,
      page: Number(params.get('page') ?? '1') || 1,
      filters,
    };
  }, [params, filterKeys, defaultOrdering]);

  const commit = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      try {
        localStorage.setItem(storageKey, qs);
      } catch {
        // ignore
      }
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, storageKey],
  );

  const mutate = useCallback(
    (fn: (next: URLSearchParams) => void, { resetPage = true } = {}) => {
      const next = new URLSearchParams(params.toString());
      fn(next);
      if (resetPage) next.delete('page');
      commit(next);
    },
    [params, commit],
  );

  const setSearch = useCallback(
    (v: string) => mutate((n) => (v ? n.set('search', v) : n.delete('search'))),
    [mutate],
  );
  const setOrdering = useCallback(
    (v: string | null) => mutate((n) => (v ? n.set('ordering', v) : n.delete('ordering'))),
    [mutate],
  );
  const setPage = useCallback(
    (p: number) => mutate((n) => (p > 1 ? n.set('page', String(p)) : n.delete('page')), { resetPage: false }),
    [mutate],
  );
  const setFilter = useCallback(
    (k: string, v: string | undefined) =>
      mutate((n) => (v == null || v === '' ? n.delete(k) : n.set(k, v))),
    [mutate],
  );
  /** Set several filter keys atomically (e.g. a date range's from+to) in one commit. */
  const setFilters = useCallback(
    (patch: Record<string, string | undefined>) =>
      mutate((n) => {
        for (const [k, v] of Object.entries(patch)) {
          if (v == null || v === '') n.delete(k);
          else n.set(k, v);
        }
      }),
    [mutate],
  );
  const clearFilters = useCallback(
    () =>
      mutate((n) => {
        filterKeys.forEach((k) => n.delete(k));
        n.delete('search');
      }),
    [mutate, filterKeys],
  );

  /** Count of active filters (excludes search + the reserved keys). */
  const activeFilterCount = Object.keys(state.filters).length;

  const listParams = useMemo<ListParams>(
    () => ({
      page: state.page,
      search: state.search || undefined,
      ordering: state.ordering || undefined,
      filters: state.filters,
    }),
    [state],
  );

  return {
    ...state,
    setSearch,
    setOrdering,
    setPage,
    setFilter,
    setFilters,
    clearFilters,
    activeFilterCount,
    listParams,
  };
}
