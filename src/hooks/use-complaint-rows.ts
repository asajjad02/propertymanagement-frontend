/**
 * Complaints list rows: server-filtered/searched complaints joined with their
 * flat number and assigned staff name from the reference lookups.
 */
import { useMemo } from 'react';

import type { Complaint } from '@/types/api';
import type { ListParams } from '@/types/http';

import { complaintHooks } from './resources';
import { useFlatsLookup, useStaffLookup } from './use-lookups';

export interface ComplaintRow {
  complaint: Complaint;
  flatNumber: string;
  staffName: string | null;
}

/** Server-filtered/paginated/sorted complaints, joined with flat number + assigned staff name. */
export function useComplaintRows(listParams: ListParams) {
  const complaints = complaintHooks.useList(listParams);
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
