'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import type { FlatRow } from '@/hooks/use-flat-rows';

export function FlatsTable({
  rows,
  isLoading,
  onRowClick,
}: {
  rows: FlatRow[];
  isLoading: boolean;
  onRowClick: (row: FlatRow) => void;
}) {
  const columns = useMemo<ColumnDef<FlatRow, unknown>[]>(
    () => [
      { header: 'Flat', accessorFn: (r) => r.flat.flat_number, cell: (c) => (
        <span className="font-medium text-ink">{c.getValue<string>()}</span>
      ) },
      { header: 'Floor', accessorFn: (r) => r.flat.floor_number },
      { header: 'Type', accessorFn: (r) => r.flat.flat_type, cell: (c) => (
        <span className="capitalize">{c.getValue<string>()}</span>
      ) },
      { header: 'Owner', accessorFn: (r) => r.ownerName ?? '—' },
      {
        header: 'Occupancy',
        accessorFn: (r) => r.flat.occupancy_status,
        cell: (c) => <StatusBadge status={c.getValue<string>()} />,
      },
      { header: 'Tenant', accessorFn: (r) => r.tenantName ?? '—' },
      {
        id: 'chevron',
        header: '',
        cell: () => <ChevronRight className="h-4 w-4 text-faint" />,
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
      emptyTitle="No flats found"
      emptyDescription="Add a flat or adjust your filters."
    />
  );
}
