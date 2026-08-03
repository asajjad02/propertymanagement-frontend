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
  /*
   * Both live under the electricity-bills namespace on purpose. Every bill
   * mutation invalidates `['electricity-bills']`, which is a prefix of these — so
   * issuing a reading, deleting a bill or recording a payment refreshes the round
   * and the outstanding total without anyone having to remember to.
   */
  billingRound: (month: string) => ['electricity-bills', 'round', month] as const,
  outstanding: () => ['electricity-bills', 'outstanding'] as const,
  resource: (resource: string) => ({
    all: [resource] as const,
    lists: () => [resource, 'list'] as const,
    list: (params?: ListParams) => [resource, 'list', params ?? {}] as const,
    details: () => [resource, 'detail'] as const,
    detail: (id: number) => [resource, 'detail', id] as const,
  }),
};
