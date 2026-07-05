'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import type { BillRow } from '@/hooks/use-bill-rows';
import { money, numeric } from '@/lib/format';

export function BillsTable({
  rows,
  isLoading,
  onRowClick,
}: {
  rows: BillRow[];
  isLoading: boolean;
  onRowClick: (row: BillRow) => void;
}) {
  const columns = useMemo<ColumnDef<BillRow, unknown>[]>(
    () => [
      { header: 'Bill No', accessorFn: (r) => `#${r.bill.id}`, cell: (c) => (
        <span className="font-medium text-ink">{c.getValue<string>()}</span>
      ) },
      { header: 'Flat', accessorFn: (r) => r.flatNumber },
      { header: 'Units', accessorFn: (r) => numeric(r.bill.units_consumed), meta: { align: 'right' } },
      { header: 'Charge', accessorFn: (r) => money(r.bill.electricity_charge), meta: { align: 'right' } },
      { header: 'Prev. due', accessorFn: (r) => money(r.bill.previous_outstanding), meta: { align: 'right' } },
      {
        header: 'Total',
        accessorFn: (r) => r.bill.total_payable,
        cell: (c) => <span className="font-semibold text-ink">{money(c.getValue<string>())}</span>,
        meta: { align: 'right' },
      },
      {
        header: 'Status',
        accessorFn: (r) => r.bill.status,
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
      emptyTitle="No bills found"
      emptyDescription="Create a bill or adjust your filters."
    />
  );
}
