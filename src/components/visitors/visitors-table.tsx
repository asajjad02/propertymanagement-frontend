'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import type { VisitorRow } from '@/hooks/use-visitor-rows';
import { timeOnly } from '@/lib/format';

import { CheckoutButton } from './checkout-button';

export function VisitorsTable({
  rows,
  isLoading,
  ordering,
  onOrderingChange,
}: {
  rows: VisitorRow[];
  isLoading: boolean;
  ordering?: string | null;
  onOrderingChange?: (ordering: string | null) => void;
}) {
  const columns = useMemo<ColumnDef<VisitorRow, unknown>[]>(
    () => [
      {
        id: 'visitor',
        header: 'Visitor',
        meta: { mobile: 'primary', mobileCell: (r) => r.visitor.visitor_name },
        accessorFn: (r) => r.visitor.visitor_name,
        cell: (c) => (
          <div>
            <p className="font-medium text-ink">{c.getValue<string>()}</p>
            <p className="text-xs text-muted">{c.row.original.visitor.contact_number || '—'}</p>
          </div>
        ),
      },
      {
        id: 'flat',
        header: 'Flat',
        accessorFn: (r) => r.flatNumber,
        meta: { mobile: 'secondary', mobileCell: (r) => `Flat ${r.flatNumber}` },
      },
      {
        id: 'host',
        header: 'Host',
        accessorFn: (r) => r.visitor.host_name || '—',
        meta: { mobile: 'caption', mobileCell: (r) => `Visiting ${r.visitor.host_name || '—'}` },
      },
      { id: 'vehicle', header: 'Vehicle', accessorFn: (r) => r.vehicleReg ?? '—', meta: { mobile: 'hide' } },
      {
        id: 'entry_time',
        header: 'Entry',
        accessorFn: (r) => timeOnly(r.visitor.entry_time),
        meta: { sortable: true, mobile: 'secondary', mobileCell: (r) => `In ${timeOnly(r.visitor.entry_time)}` },
      },
      {
        id: 'exit_time',
        header: 'Exit',
        accessorFn: (r) => timeOnly(r.visitor.exit_time),
        meta: { mobile: 'hide' },
      },
      {
        id: 'status',
        header: 'Status',
        meta: { mobile: 'status' },
        accessorFn: (r) => r.status,
        cell: (c) => <StatusBadge status={c.getValue<string>()} />,
      },
      {
        id: 'action',
        header: '',
        cell: (c) =>
          c.row.original.status === 'inside' ? (
            <CheckoutButton
              visitorId={c.row.original.visitor.id}
              visitorName={c.row.original.visitor.visitor_name}
            />
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
      ordering={ordering}
      onOrderingChange={onOrderingChange}
      ariaLabel="Visitors"
      emptyTitle="No visitors found"
      emptyDescription="Try adjusting your filters, or log a visitor."
    />
  );
}
