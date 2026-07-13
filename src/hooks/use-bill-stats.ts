/** Electricity-bill summary counts for the list stat cards. Cheap count-only queries. */
import { electricityBillHooks } from './resources';

export function useBillStats() {
  // PageNumberPagination returns `count` on page 1, so each query is one request.
  const all = electricityBillHooks.useList({ page: 1 });
  const draft = electricityBillHooks.useList({ page: 1, filters: { status: 'draft' } });
  const issued = electricityBillHooks.useList({ page: 1, filters: { status: 'issued' } });
  const paid = electricityBillHooks.useList({ page: 1, filters: { status: 'paid' } });

  return {
    total: all.data?.count ?? 0,
    draft: draft.data?.count ?? 0,
    issued: issued.data?.count ?? 0,
    paid: paid.data?.count ?? 0,
    isLoading: all.isPending,
  };
}
