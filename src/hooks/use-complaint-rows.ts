/**
 * Complaints list rows: server-filtered/searched complaints joined with their
 * flat number and assigned staff name from the reference lookups.
 */
import { useMemo } from 'react';

import type { Complaint, ComplaintStatus } from '@/types/api';

import { complaintHooks } from './resources';
import { useFlatsLookup, useStaffLookup } from './use-lookups';

export type ComplaintFilter = 'all' | ComplaintStatus;

export interface ComplaintRow {
  complaint: Complaint;
  flatNumber: string;
  staffName: string | null;
}

export function useComplaintRows(filter: ComplaintFilter, search: string, page?: number) {
  const complaints = complaintHooks.useList({
    page,
    search: search || undefined,
    ordering: '-created_at',
    filters: { status: filter === 'all' ? undefined : filter },
  });
  const flats = useFlatsLookup();
  const staff = useStaffLookup();

  const rows = useMemo<ComplaintRow[]>(() => {
    return (complaints.data?.results ?? []).map((complaint) => ({
      complaint,
      flatNumber: flats.map.get(complaint.flat)?.flat_number ?? `#${complaint.flat}`,
      staffName:
        complaint.assigned_staff != null
          ? staff.map.get(complaint.assigned_staff)?.full_name ?? null
          : null,
    }));
  }, [complaints.data, flats.map, staff.map]);

  return {
    rows,
    count: complaints.data?.count ?? 0,
    isLoading: complaints.isPending || flats.isPending || staff.isPending,
    isError: complaints.isError,
  };
}
