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
  ordering,
  onOrderingChange,
  onRowClick,
}: {
  rows: FlatRow[];
  isLoading: boolean;
  ordering?: string | null;
  onOrderingChange?: (ordering: string | null) => void;
  onRowClick: (row: FlatRow) => void;
}) {
  const columns = useMemo<ColumnDef<FlatRow, unknown>[]>(
    () => [
      {
        id: 'flat_number',
        header: 'Flat',
        accessorFn: (r) => r.flat.flat_number,
        cell: (c) => <span className="font-medium text-ink">{c.getValue<string>()}</span>,
        meta: { sortable: true },
      },
      { id: 'floor_number', header: 'Floor', accessorFn: (r) => r.flat.floor_number, meta: { sortable: true } },
      {
        id: 'flat_type',
        header: 'Type',
        accessorFn: (r) => r.flat.flat_type,
        cell: (c) => <span className="capitalize">{c.getValue<string>()}</span>,
        meta: { sortable: true },
      },
      { id: 'owner', header: 'Owner', accessorFn: (r) => r.ownerName ?? '—' },
      {
        id: 'occupancy_status',
        header: 'Occupancy',
        accessorFn: (r) => r.flat.occupancy_status,
        cell: (c) => <StatusBadge status={c.getValue<string>()} />,
        meta: { sortable: true },
      },
      { id: 'tenant', header: 'Tenant', accessorFn: (r) => r.tenantName ?? '—' },
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
      ordering={ordering}
      onOrderingChange={onOrderingChange}
      onRowClick={onRowClick}
      ariaLabel="Flats"
      emptyTitle="No flats found"
      emptyDescription="Try adjusting your filters, or add a flat."
    />
  );
}
