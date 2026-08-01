'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import type { OwnerRow } from '@/hooks/use-owner-rows';

export function OwnersTable({
  rows,
  isLoading,
  onRowClick,
}: {
  rows: OwnerRow[];
  isLoading: boolean;
  onRowClick: (row: OwnerRow) => void;
}) {
  const columns = useMemo<ColumnDef<OwnerRow, unknown>[]>(
    () => [
      {
        id: 'name',
        header: 'Owner',
        meta: { mobile: 'primary', mobileCell: (r) => r.name },
        accessorFn: (r) => r.name,
        cell: (c) => (
          <div className="flex items-center gap-3">
            <Avatar name={c.row.original.name} size="sm" />
            <span className="font-medium text-ink">{c.getValue<string>()}</span>
          </div>
        ),
      },
      {
        id: 'flats',
        header: 'Flats owned',
        meta: {
          mobile: 'secondary',
          mobileCell: (r) =>
            r.ownedFlats.length === 0
              ? 'No flats'
              : `${r.ownedFlats.length} ${r.ownedFlats.length === 1 ? 'flat' : 'flats'} · ${r.ownedFlats.slice(0, 3).join(', ')}`,
        },
        accessorFn: (r) => r.ownedFlats.length,
        cell: (c) => {
          const flats = c.row.original.ownedFlats;
          if (flats.length === 0) return <span className="text-muted">—</span>;
          return (
            <div className="flex flex-wrap items-center gap-1">
              {flats.slice(0, 4).map((f) => (
                <Badge key={f} tone="neutral">{f}</Badge>
              ))}
              {flats.length > 4 && <span className="text-xs text-muted">+{flats.length - 4}</span>}
            </div>
          );
        },
      },
      { header: 'Contact', accessorFn: (r) => r.phone || '—', meta: { mobile: 'caption' } },
      { header: 'CNIC', accessorFn: (r) => r.cnic || '—', meta: { mobile: 'hide' } },
      {
        id: 'status',
        header: 'Status',
        meta: { mobile: 'status' },
        accessorFn: (r) => r.owner.status,
        cell: (c) => <StatusBadge status={c.getValue<string>()} />,
      },
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
      onRowClick={onRowClick}
      ariaLabel="Owners"
      emptyTitle="No owners found"
      emptyDescription="Add an owner, or mark a resident as an owner."
    />
  );
}
