'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import type { BillRow } from '@/hooks/use-bill-rows';
import { money, shortDate } from '@/lib/format';

export function BillsTable({
  rows,
  isLoading,
  ordering,
  onOrderingChange,
  onRowClick,
}: {
  rows: BillRow[];
  isLoading: boolean;
  ordering?: string | null;
  onOrderingChange?: (ordering: string | null) => void;
  onRowClick: (row: BillRow) => void;
}) {
  const columns = useMemo<ColumnDef<BillRow, unknown>[]>(
    () => [
      {
        id: 'bill_no',
        header: 'Bill No',
        accessorFn: (r) => `#${r.bill.id}`,
        cell: (c) => <span className="font-medium text-ink">{c.getValue<string>()}</span>,
      },
      { id: 'flat', header: 'Flat', accessorFn: (r) => r.flatNumber },
      {
        id: 'billing_period_end',
        header: 'Period',
        accessorFn: (r) => shortDate(r.bill.billing_period_end),
        meta: { sortable: true },
      },
      {
        id: 'electricity',
        header: 'Electricity',
        accessorFn: (r) => money(r.bill.electricity_charge),
        meta: { align: 'right' },
      },
      {
        id: 'maintenance',
        header: 'Maintenance',
        accessorFn: (r) => money(r.bill.maintenance_charge),
        meta: { align: 'right' },
      },
      {
        id: 'total_payable',
        header: 'Total',
        accessorFn: (r) => r.bill.total_payable,
        cell: (c) => <span className="font-semibold text-ink">{money(c.getValue<string>())}</span>,
        meta: { align: 'right', sortable: true },
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (r) => r.bill.status,
        cell: (c) => <StatusBadge status={c.getValue<string>()} />,
        meta: { align: 'right', sortable: true },
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
      ariaLabel="Monthly bills"
      emptyTitle="No bills found"
      emptyDescription="Create a bill or adjust your filters."
    />
  );
}
