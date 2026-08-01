'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { money, shortDate } from '@/lib/format';
import type { StaffMember } from '@/types/api';

export function StaffTable({
  rows,
  isLoading,
  ordering,
  onOrderingChange,
  onRowClick,
}: {
  rows: StaffMember[];
  isLoading: boolean;
  ordering?: string | null;
  onOrderingChange?: (ordering: string | null) => void;
  onRowClick: (row: StaffMember) => void;
}) {
  const columns = useMemo<ColumnDef<StaffMember, unknown>[]>(
    () => [
      {
        id: 'full_name',
        header: 'Name',
        accessorFn: (s) => s.full_name,
        cell: (c) => (
          <span className="flex items-center gap-2.5">
            <Avatar name={c.row.original.full_name} size="sm" />
            <span className="font-medium text-ink">{c.getValue<string>()}</span>
          </span>
        ),
        // The desktop cell carries an avatar; the card wants just the name.
        meta: { sortable: true, mobile: 'primary', mobileCell: (s) => s.full_name },
      },
      {
        id: 'designation',
        header: 'Designation',
        accessorFn: (s) => s.designation || '—',
        meta: { mobile: 'secondary' },
      },
      { id: 'phone', header: 'Phone', accessorFn: (s) => s.phone || '—', meta: { mobile: 'hide' } },
      {
        id: 'joining_date',
        header: 'Joined',
        accessorFn: (s) => (s.joining_date ? shortDate(s.joining_date) : '—'),
        meta: { sortable: true, mobile: 'hide' },
      },
      {
        id: 'salary',
        header: 'Monthly salary',
        accessorFn: (s) => money(s.salary),
        meta: { align: 'right', mobile: 'caption', mobileCell: (s) => money(s.salary) },
      },
      {
        id: 'status',
        header: 'Status',
        meta: { mobile: 'status' },
        accessorFn: (s) => s.status,
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
      ordering={ordering}
      onOrderingChange={onOrderingChange}
      onRowClick={onRowClick}
      ariaLabel="Staff members"
      emptyTitle="No staff found"
      emptyDescription="Try adjusting your filters, or add a staff member."
    />
  );
}
