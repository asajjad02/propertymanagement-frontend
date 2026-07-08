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
        meta: { sortable: true },
      },
      { id: 'designation', header: 'Designation', accessorFn: (s) => s.designation || '—' },
      { id: 'phone', header: 'Phone', accessorFn: (s) => s.phone || '—' },
      {
        id: 'joining_date',
        header: 'Joined',
        accessorFn: (s) => (s.joining_date ? shortDate(s.joining_date) : '—'),
        meta: { sortable: true },
      },
      {
        id: 'salary',
        header: 'Monthly salary',
        accessorFn: (s) => money(s.salary),
        meta: { align: 'right' },
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (s) => s.status,
        cell: (c) => <StatusBadge status={c.getValue<string>()} />,
      },
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
      ordering={ordering}
      onOrderingChange={onOrderingChange}
      onRowClick={onRowClick}
      ariaLabel="Staff members"
      emptyTitle="No staff found"
      emptyDescription="Try adjusting your filters, or add a staff member."
    />
  );
}
