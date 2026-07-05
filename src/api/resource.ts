/**
 * Generic typed CRUD client for a DRF ModelViewSet mounted at a collection
 * path (e.g. `/buildings/`). One `createResource` call yields list/get/create/
 * update/patch/remove bound to that path, with the two generics separating the
 * read shape (`T`) from the write payload (`TInput`).
 */
import { apiClient } from '@/lib/api-client';
import type { ListParams, Paginated } from '@/types/http';

/** Flatten `ListParams` into a query object DRF understands. */
export function buildQuery(params: ListParams = {}): Record<string, string> {
  const query: Record<string, string> = {};
  if (params.page != null) query.page = String(params.page);
  if (params.search) query.search = params.search;
  if (params.ordering) query.ordering = params.ordering;
  for (const [key, value] of Object.entries(params.filters ?? {})) {
    if (value !== undefined && value !== '') query[key] = String(value);
  }
  return query;
}

export interface Resource<T, TInput> {
  path: string;
  list: (params?: ListParams) => Promise<Paginated<T>>;
  /** Follow pagination to collect every row. Use for reference data / joins. */
  listAll: (params?: ListParams) => Promise<T[]>;
  get: (id: number) => Promise<T>;
  create: (payload: TInput) => Promise<T>;
  update: (id: number, payload: TInput) => Promise<T>;
  patch: (id: number, payload: Partial<TInput>) => Promise<T>;
  remove: (id: number) => Promise<void>;
}

export function createResource<T, TInput>(path: string): Resource<T, TInput> {
  // Normalize to a `/collection/` form with leading and trailing slashes.
  const base = `/${path.replace(/^\/|\/$/g, '')}/`;
  const detail = (id: number) => `${base}${id}/`;

  return {
    path: base,
    async list(params) {
      const { data } = await apiClient.get<Paginated<T>>(base, {
        params: buildQuery(params),
      });
      return data;
    },
    async listAll(params) {
      const collected: T[] = [];
      let page = params?.page ?? 1;
      // Bounded loop: the backend caps page size at 20, so this walks `next`
      // until exhausted. Reference sets (buildings, people, ...) are small.
      for (;;) {
        const data = await this.list({ ...params, page });
        collected.push(...data.results);
        if (!data.next) break;
        page += 1;
      }
      return collected;
    },
    async get(id) {
      const { data } = await apiClient.get<T>(detail(id));
      return data;
    },
    async create(payload) {
      const { data } = await apiClient.post<T>(base, payload);
      return data;
    },
    async update(id, payload) {
      const { data } = await apiClient.put<T>(detail(id), payload);
      return data;
    },
    async patch(id, payload) {
      const { data } = await apiClient.patch<T>(detail(id), payload);
      return data;
    },
    async remove(id) {
      await apiClient.delete(detail(id));
    },
  };
}
