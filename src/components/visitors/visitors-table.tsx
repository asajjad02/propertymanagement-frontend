'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import type { VisitorRow } from '@/hooks/use-visitor-rows';
import { timeOnly } from '@/lib/format';

import { CheckoutButton } from './checkout-button';

export function VisitorsTable({ rows, isLoading }: { rows: VisitorRow[]; isLoading: boolean }) {
  const columns = useMemo<ColumnDef<VisitorRow, unknown>[]>(
    () => [
      {
        header: 'Visitor',
        accessorFn: (r) => r.visitor.visitor_name,
        cell: (c) => (
          <div>
            <p className="font-medium text-ink">{c.getValue<string>()}</p>
            <p className="text-xs text-muted">{c.row.original.visitor.contact_number || '—'}</p>
          </div>
        ),
      },
      { header: 'Flat', accessorFn: (r) => r.flatNumber },
      { header: 'Host', accessorFn: (r) => r.visitor.host_name || '—' },
      { header: 'Vehicle', accessorFn: (r) => r.vehicleReg ?? '—' },
      { header: 'Entry', accessorFn: (r) => timeOnly(r.visitor.entry_time) },
      { header: 'Exit', accessorFn: (r) => timeOnly(r.visitor.exit_time) },
      {
        header: 'Status',
        accessorFn: (r) => r.status,
        cell: (c) => <StatusBadge status={c.getValue<string>()} />,
      },
      {
        id: 'action',
        header: '',
        cell: (c) =>
          c.row.original.status === 'inside' ? (
            <CheckoutButton visitorId={c.row.original.visitor.id} />
          ) : null,
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
      emptyTitle="No visitors for this day"
      emptyDescription="Log a visitor or pick a different date."
    />
  );
}
