'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import type { BillRow } from '@/hooks/use-bill-rows';
import { money, shortDate } from '@/lib/format';

/** Sortable fields, for the screen's `SortControl`. */
export const BILL_SORT_OPTIONS = [
  { field: 'billing_period_end', label: 'Period' },
  { field: 'total_payable', label: 'Total' },
  { field: 'status', label: 'Status' },
];

export function BillsTable({
  rows,
  isLoading,
  ordering,
  onOrderingChange,
  onRowClick,
  mobileSort,
}: {
  rows: BillRow[];
  isLoading: boolean;
  ordering?: string | null;
  onOrderingChange?: (ordering: string | null) => void;
  onRowClick: (row: BillRow) => void;
  /** False when the screen hosts its own SortControl (see DataTable). */
  mobileSort?: boolean;
}) {
  /*
   * The mobile card, three lines:
   *
   *   A-101                    ● Issued  ›
   *   30 Jul 2026 · #12
   *   Rs 4,320
   *
   * The flat leads, not the bill number — nobody looks up a bill by its id. The
   * amount is the line that matters, so it gets the caption slot in ink rather
   * than being buried in a grid of labelled cells. The electricity/maintenance
   * split is one tap away on the bill itself.
   */
  const columns = useMemo<ColumnDef<BillRow, unknown>[]>(
    () => [
      {
        id: 'bill_no',
        header: 'Bill No',
        accessorFn: (r) => `#${r.bill.id}`,
        cell: (c) => <span className="font-medium text-ink">{c.getValue<string>()}</span>,
        meta: { mobile: 'secondary' },
      },
      { id: 'flat', header: 'Flat', accessorFn: (r) => r.flatNumber, meta: { mobile: 'primary' } },
      {
        id: 'billing_period_end',
        header: 'Period',
        accessorFn: (r) => shortDate(r.bill.billing_period_end),
        meta: { sortable: true, mobile: 'secondary' },
      },
      {
        id: 'electricity',
        header: 'Electricity',
        accessorFn: (r) => money(r.bill.electricity_charge),
        meta: { align: 'right', mobile: 'hide' },
      },
      {
        id: 'maintenance',
        header: 'Maintenance',
        accessorFn: (r) => money(r.bill.maintenance_charge),
        meta: { align: 'right', mobile: 'hide' },
      },
      {
        id: 'total_payable',
        header: 'Total',
        accessorFn: (r) => r.bill.total_payable,
        cell: (c) => <span className="font-semibold text-ink">{money(c.getValue<string>())}</span>,
        meta: {
          align: 'right',
          sortable: true,
          mobile: 'caption',
          mobileCell: (r) => (
            <span className="font-medium tabular-nums text-ink">{money(r.bill.total_payable)}</span>
          ),
        },
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (r) => r.bill.status,
        cell: (c) => <StatusBadge status={c.getValue<string>()} />,
        meta: { align: 'right', sortable: true, mobile: 'status' },
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
      ariaLabel="Monthly bills"
      emptyTitle="No bills found"
      emptyDescription="Create a bill or adjust your filters."
    />
  );
}
