'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { DataTable } from '@/components/ui/data-table';
import { TypeTag } from '@/components/ui/type-tag';
import type { ResidentRow } from '@/hooks/use-resident-rows';

export function ResidentsTable({
  rows,
  isLoading,
  onRowClick,
}: {
  rows: ResidentRow[];
  isLoading: boolean;
  onRowClick: (row: ResidentRow) => void;
}) {
  const columns = useMemo<ColumnDef<ResidentRow, unknown>[]>(
    () => [
      {
        header: 'Name',
        accessorFn: (r) => r.person.full_name,
        cell: (c) => (
          <div className="flex items-center gap-3">
            <Avatar name={c.row.original.person.full_name} size="sm" />
            <span className="font-medium text-ink">{c.getValue<string>()}</span>
          </div>
        ),
      },
      {
        header: 'Type',
        accessorFn: (r) => r.types.join(','),
        cell: (c) => (
          <div className="flex gap-1">
            {c.row.original.types.length === 0 ? (
              <span className="text-muted">—</span>
            ) : (
              c.row.original.types.map((t) => <TypeTag key={t} type={t} />)
            )}
          </div>
        ),
      },
      { header: 'Flat', accessorFn: (r) => r.flatNumber ?? '—' },
      { header: 'Contact', accessorFn: (r) => r.person.phone || '—' },
      { header: 'CNIC', accessorFn: (r) => r.person.cnic || '—' },
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
      emptyTitle="No residents found"
      emptyDescription="Add a resident or adjust your filters."
    />
  );
}
