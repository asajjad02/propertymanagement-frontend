/** Flat summary counts for the list stat cards. Uses cheap count-only queries. */
import { flatHooks } from './resources';

export function useFlatStats() {
  // PageNumberPagination returns `count` on page 1, so each query is one request.
  const all = flatHooks.useList({ page: 1 });
  const occupied = flatHooks.useList({ page: 1, filters: { occupancy_status: 'occupied' } });
  const vacant = flatHooks.useList({ page: 1, filters: { occupancy_status: 'vacant' } });

  return {
    total: all.data?.count ?? 0,
    occupied: occupied.data?.count ?? 0,
    vacant: vacant.data?.count ?? 0,
    isLoading: all.isPending,
  };
}
