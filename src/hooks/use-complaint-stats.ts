/** Complaint summary counts for the list stat cards (cheap count-only queries). */
import { complaintHooks } from './resources';

export function useComplaintStats() {
  const all = complaintHooks.useList({ page: 1 });
  const open = complaintHooks.useList({ page: 1, filters: { status: 'open' } });
  const inProgress = complaintHooks.useList({ page: 1, filters: { status: 'in_progress' } });
  const resolved = complaintHooks.useList({ page: 1, filters: { status: 'resolved' } });

  return {
    total: all.data?.count ?? 0,
    open: open.data?.count ?? 0,
    inProgress: inProgress.data?.count ?? 0,
    resolved: resolved.data?.count ?? 0,
    isLoading: all.isPending,
  };
}
