'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

import { DataTable } from '@/components/ui/data-table';
import type { SortOption } from '@/components/ui/sort-control';
import { StatusBadge } from '@/components/ui/status-badge';
import type { FlatRow } from '@/hooks/use-flat-rows';

/**
 * Sortable fields, for the `SortControl` in the page's toolbar. Exported so the
 * screen can host sorting next to its filters instead of spending a row on
 * `DataTable`'s built-in sort bar.
 */
export const FLAT_SORT_OPTIONS: SortOption[] = [
  { field: 'flat_number', label: 'Flat' },
  { field: 'floor_number', label: 'Floor' },
  { field: 'flat_type', label: 'Type' },
  { field: 'occupancy_status', label: 'Occupancy' },
];

export function FlatsTable({
  rows,
  isLoading,
  ordering,
  onOrderingChange,
  onRowClick,
  mobileSort,
}: {
  rows: FlatRow[];
  isLoading: boolean;
  ordering?: string | null;
  onOrderingChange?: (ordering: string | null) => void;
  onRowClick: (row: FlatRow) => void;
  /** False when the screen hosts its own SortControl (see DataTable). */
  mobileSort?: boolean;
}) {
  /*
   * `meta.mobile` decides how each column folds into the mobile card. The goal
   * is three lines, not a grid of labelled cells:
   *
   *   601                        ● Vacant  ›
   *   1-bed · Floor 6
   *   Fatima Malik
   *
   * Type and floor are the sub-line; owner is the third line; the tenant is
   * dropped on mobile because for an occupied flat it usually repeats the owner
   * and it's one tap away on the detail page.
   */
  const columns = useMemo<ColumnDef<FlatRow, unknown>[]>(
    () => [
      {
        id: 'flat_number',
        header: 'Flat',
        accessorFn: (r) => r.flat.flat_number,
        cell: (c) => <span className="font-medium text-ink">{c.getValue<string>()}</span>,
        meta: { sortable: true, mobile: 'primary' },
      },
      // Desktop column order is unchanged (Flat, Floor, Type, …); the card's
      // sub-line follows it, reading "Floor 6 · 1-bed".
      {
        id: 'floor_number',
        header: 'Floor',
        accessorFn: (r) => r.flat.floor_number,
        // Desktop has a FLOOR header to give "6" meaning; the card doesn't.
        meta: { sortable: true, mobile: 'secondary', mobileCell: (r) => `Floor ${r.flat.floor_number}` },
      },
      {
        id: 'flat_type',
        header: 'Type',
        accessorFn: (r) => r.flat.apartment_type_name || r.flat.flat_type || '—',
        meta: { sortable: true, mobile: 'secondary' },
      },
      { id: 'owner', header: 'Owner', accessorFn: (r) => r.ownerName ?? '—', meta: { mobile: 'caption' } },
      {
        id: 'occupancy_status',
        header: 'Occupancy',
        accessorFn: (r) => r.flat.occupancy_status,
        cell: (c) => <StatusBadge status={c.getValue<string>()} />,
        meta: { sortable: true, mobile: 'status' },
      },
      { id: 'tenant', header: 'Tenant', accessorFn: (r) => r.tenantName ?? '—', meta: { mobile: 'hide' } },
      {
        id: 'chevron',
        header: '',
        cell: () => <ChevronRight className="h-4 w-4 text-faint" />,
        meta: { align: 'right', mobile: 'hide' },
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
      mobileSort={mobileSort}
      ariaLabel="Flats"
      emptyTitle="No flats found"
      emptyDescription="Try adjusting your filters, or add a flat."
    />
  );
}
