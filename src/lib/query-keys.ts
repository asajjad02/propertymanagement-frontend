/**
 * Central TanStack Query key factory. Keys are namespaced per resource so a
 * mutation can invalidate an entire resource (`[resource]`), just its lists
 * (`[resource, 'list']`), or a single record (`[resource, 'detail', id]`).
 */
import type { ListParams } from '@/types/http';

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  billing: {
    // The server-computed billing round. `rounds` is the invalidation prefix;
    // `round(month)` is a specific month's query.
    rounds: ['billing', 'round'] as const,
    round: (month: string) => ['billing', 'round', month] as const,
  },
  resource: (resource: string) => ({
    all: [resource] as const,
    lists: () => [resource, 'list'] as const,
    list: (params?: ListParams) => [resource, 'list', params ?? {}] as const,
    details: () => [resource, 'detail'] as const,
    detail: (id: number) => [resource, 'detail', id] as const,
  }),
};
