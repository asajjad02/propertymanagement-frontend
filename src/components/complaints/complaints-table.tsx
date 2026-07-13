'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import type { ComplaintRow } from '@/hooks/use-complaint-rows';
import { shortDate } from '@/lib/format';
import type { ComplaintPriority } from '@/types/api';

import { PRIORITY_LABEL, PRIORITY_TONE } from './priority';

export function ComplaintsTable({
  rows,
  isLoading,
  ordering,
  onOrderingChange,
  onRowClick,
}: {
  rows: ComplaintRow[];
  isLoading: boolean;
  ordering?: string | null;
  onOrderingChange?: (ordering: string | null) => void;
  onRowClick: (row: ComplaintRow) => void;
}) {
  const columns = useMemo<ColumnDef<ComplaintRow, unknown>[]>(
    () => [
      { header: 'Type', accessorFn: (r) => r.complaint.complaint_type, cell: (c) => (
        <span className="font-medium text-ink">{c.getValue<string>()}</span>
      ) },
      { header: 'Flat', accessorFn: (r) => r.flatNumber },
      {
        id: 'priority',
        header: 'Priority',
        accessorFn: (r) => r.complaint.priority,
        cell: (c) => {
          const p = c.getValue<ComplaintPriority>();
          return <Badge tone={PRIORITY_TONE[p]}>{PRIORITY_LABEL[p]}</Badge>;
        },
        meta: { sortable: true },
      },
      {
        header: 'Description',
        accessorFn: (r) => r.complaint.description,
        cell: (c) => <span className="block max-w-xs truncate text-muted">{c.getValue<string>()}</span>,
      },
      { header: 'Assigned', accessorFn: (r) => r.staffName ?? 'Unassigned' },
      {
        id: 'reported_at',
        header: 'Reported',
        accessorFn: (r) => shortDate(r.complaint.reported_at),
        meta: { sortable: true },
      },
      {
        header: 'Status',
        accessorFn: (r) => r.complaint.status,
        cell: (c) => <StatusBadge status={c.getValue<string>()} />,
        meta: { align: 'right' },
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={rows}
      isLoading={isLoading}
      ordering={ordering}
      onOrderingChange={onOrderingChange}
      onRowClick={onRowClick}
      ariaLabel="Complaints"
      emptyTitle="No complaints found"
      emptyDescription="Log a complaint or adjust your filters."
    />
  );
}
