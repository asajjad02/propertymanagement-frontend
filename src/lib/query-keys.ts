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
    /*
     * The server-computed billing round and the outstanding total. `rounds` is the
     * invalidation prefix; `round(month)` is a specific month's query.
     *
     * Deliberately nested under the electricity-bills namespace: every bill
     * mutation invalidates `['electricity-bills']`, which is a prefix of these, so
     * creating a draft, deleting a bill or recording a payment refreshes both
     * without a call site having to remember to. Explicit invalidation still works
     * for anything that isn't a bill write (see useEnterBillReading).
     */
    rounds: ['electricity-bills', 'round'] as const,
    round: (month: string) => ['electricity-bills', 'round', month] as const,
    outstanding: ['electricity-bills', 'outstanding'] as const,
  },
  resource: (resource: string) => ({
    all: [resource] as const,
    lists: () => [resource, 'list'] as const,
    list: (params?: ListParams) => [resource, 'list', params ?? {}] as const,
    details: () => [resource, 'detail'] as const,
    detail: (id: number) => [resource, 'detail', id] as const,
  }),
};
