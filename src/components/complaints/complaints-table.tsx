'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import type { ComplaintRow } from '@/hooks/use-complaint-rows';
import { shortDate } from '@/lib/format';

export function ComplaintsTable({
  rows,
  isLoading,
  onRowClick,
}: {
  rows: ComplaintRow[];
  isLoading: boolean;
  onRowClick: (row: ComplaintRow) => void;
}) {
  const columns = useMemo<ColumnDef<ComplaintRow, unknown>[]>(
    () => [
      { header: 'Type', accessorFn: (r) => r.complaint.complaint_type, cell: (c) => (
        <span className="font-medium text-ink">{c.getValue<string>()}</span>
      ) },
      { header: 'Flat', accessorFn: (r) => r.flatNumber },
      {
        header: 'Description',
        accessorFn: (r) => r.complaint.description,
        cell: (c) => <span className="block max-w-xs truncate text-muted">{c.getValue<string>()}</span>,
      },
      { header: 'Assigned', accessorFn: (r) => r.staffName ?? 'Unassigned' },
      { header: 'Reported', accessorFn: (r) => shortDate(r.complaint.reported_at) },
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
      onRowClick={onRowClick}
      emptyTitle="No complaints found"
      emptyDescription="Log a complaint or adjust your filters."
    />
  );
}
