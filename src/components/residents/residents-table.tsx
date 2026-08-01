'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { DataTable } from '@/components/ui/data-table';
import { RoleBadge } from '@/components/ui/role-badge';
import type { ResidentRow } from '@/hooks/use-resident-rows';

export function ResidentsTable({
  rows,
  isLoading,
  ordering,
  onOrderingChange,
  onRowClick,
}: {
  rows: ResidentRow[];
  isLoading: boolean;
  ordering?: string | null;
  onOrderingChange?: (ordering: string | null) => void;
  onRowClick: (row: ResidentRow) => void;
}) {
  const columns = useMemo<ColumnDef<ResidentRow, unknown>[]>(
    () => [
      {
        id: 'full_name',
        header: 'Name',
        accessorFn: (r) => r.person.full_name,
        cell: (c) => (
          <div className="flex items-center gap-3">
            <Avatar name={c.row.original.person.full_name} size="sm" />
            <span className="font-medium text-ink">{c.getValue<string>()}</span>
          </div>
        ),
        // The desktop cell carries an avatar; the card wants just the name.
        meta: { sortable: true, sortField: 'full_name', mobile: 'primary', mobileCell: (r) => r.person.full_name },
      },
      {
        id: 'role',
        header: 'Role',
        accessorFn: (r) => r.role ?? '',
        cell: (c) => <RoleBadge role={c.row.original.role} />,
        meta: { mobile: 'status' },
      },
      {
        header: 'Flat',
        accessorFn: (r) => r.flatNumber ?? '—',
        meta: { mobile: 'secondary', mobileCell: (r) => (r.flatNumber ? `Flat ${r.flatNumber}` : 'No flat') },
      },
      { header: 'Contact', accessorFn: (r) => r.person.phone || '—', meta: { mobile: 'caption' } },
      { header: 'CNIC', accessorFn: (r) => r.person.cnic || '—', meta: { mobile: 'hide' } },
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
      ariaLabel="Residents"
      emptyTitle="No residents found"
      emptyDescription="Add a resident or adjust your filters."
    />
  );
}
