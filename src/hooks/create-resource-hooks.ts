/**
 * Turns a `Resource<T, TInput>` into a set of TanStack Query hooks. Each
 * resource (buildings, flats, ...) gets list/detail queries and create/update/
 * patch/delete mutations that invalidate the right keys automatically.
 *
 * Usage:
 *   const buildingHooks = createResourceHooks('buildings', buildings);
 *   const { data } = buildingHooks.useList({ search: 'A' });
 */
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type { Resource } from '@/api/resource';
import { queryKeys } from '@/lib/query-keys';
import type { ListParams, Paginated } from '@/types/http';

export function createResourceHooks<T, TInput>(
  resourceName: string,
  resource: Resource<T, TInput>,
) {
  const keys = queryKeys.resource(resourceName);

  function useList(
    params?: ListParams,
    options?: Partial<UseQueryOptions<Paginated<T>>>,
  ) {
    return useQuery<Paginated<T>>({
      queryKey: keys.list(params),
      queryFn: () => resource.list(params),
      ...options,
    });
  }

  /** Fetch every row (walks pagination). For reference data used in joins. */
  function useAll(params?: ListParams, options?: Partial<UseQueryOptions<T[]>>) {
    return useQuery<T[]>({
      queryKey: [resourceName, 'all', params ?? {}],
      queryFn: () => resource.listAll(params),
      staleTime: 60_000,
      ...options,
    });
  }

  function useItem(id: number | undefined, options?: Partial<UseQueryOptions<T>>) {
    return useQuery<T>({
      queryKey: keys.detail(id ?? -1),
      queryFn: () => resource.get(id as number),
      enabled: id != null && (options?.enabled ?? true),
      ...options,
    });
  }

  function useCreate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (payload: TInput) => resource.create(payload),
      onSuccess: () => qc.invalidateQueries({ queryKey: keys.lists() }),
    });
  }

  function useUpdate() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: TInput }) =>
        resource.update(id, payload),
      onSuccess: (_data, { id }) => {
        qc.invalidateQueries({ queryKey: keys.lists() });
        qc.invalidateQueries({ queryKey: keys.detail(id) });
      },
    });
  }

  function usePatch() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<TInput> }) =>
        resource.patch(id, payload),
      onSuccess: (_data, { id }) => {
        qc.invalidateQueries({ queryKey: keys.lists() });
        qc.invalidateQueries({ queryKey: keys.detail(id) });
      },
    });
  }

  function useDelete() {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: number) => resource.remove(id),
      onSuccess: () => qc.invalidateQueries({ queryKey: keys.lists() }),
    });
  }

  return { keys, useList, useAll, useItem, useCreate, useUpdate, usePatch, useDelete };
}
