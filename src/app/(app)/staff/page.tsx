'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { AddStaffButton } from '@/components/staff/add-staff-button';
import { StaffTable } from '@/components/staff/staff-table';
import { Card } from '@/components/ui/card';
import { FilterBar } from '@/components/ui/filter-bar';
import { FilterChips, type FilterChip } from '@/components/ui/filter-chips';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { Segmented } from '@/components/ui/segmented';
import { StatCard, StatCardRow } from '@/components/ui/stat-card';
import { staffMemberHooks } from '@/hooks/resources';
import { useTableQuery } from '@/hooks/use-table-query';
import { money } from '@/lib/format';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];
const PAGE_SIZE = 20;

export default function StaffListPage() {
  const router = useRouter();
  const q = useTableQuery({ key: 'staff', filterKeys: ['status'], defaultOrdering: 'full_name' });

  const list = staffMemberHooks.useList(q.listParams);
  const rows = useMemo(() => list.data?.results ?? [], [list.data]);

  // Stats: count-only queries + active payroll via the (small) full set.
  const total = staffMemberHooks.useList({ page: 1 });
  const active = staffMemberHooks.useList({ page: 1, filters: { status: 'active' } });
  const activeAll = staffMemberHooks.useAll({ filters: { status: 'active' } });
  const payroll = useMemo(
    () => (activeAll.data ?? []).reduce((sum, s) => sum + (Number(s.salary) || 0), 0),
    [activeAll.data],
  );

  const chips = useMemo<FilterChip[]>(() => {
    const c: FilterChip[] = [];
    if (q.search) c.push({ id: 'search', label: `Search: “${q.search}”`, onRemove: () => q.setSearch('') });
    return c;
  }, [q]);

  return (
    <div className="space-y-6">
      <PageHeader title="Staff" subtitle="Employees on the society payroll." actions={<AddStaffButton />} />

      <StatCardRow>
        <StatCard label="Total staff" value={total.data?.count ?? 0} />
        <StatCard label="Active" value={active.data?.count ?? 0} tone="green" />
        <StatCard label="Inactive" value={(total.data?.count ?? 0) - (active.data?.count ?? 0)} tone="neutral" />
        <StatCard label="Monthly payroll" value={money(payroll)} sub="active staff" />
      </StatCardRow>

      <Card>
        <div className="space-y-3 border-b border-hairline p-4">
          <FilterBar
            left={
              <Segmented
                options={STATUS_TABS}
                value={q.filters.status ?? 'all'}
                onValueChange={(v) => q.setFilter('status', v === 'all' ? undefined : v)}
              />
            }
            right={<SearchInput value={q.search} onChange={q.setSearch} placeholder="Search name, CNIC, designation…" />}
          />
          <FilterChips chips={chips} onClearAll={q.clearFilters} />
        </div>
        <StaffTable
          rows={rows}
          isLoading={list.isPending}
          ordering={q.ordering}
          onOrderingChange={q.setOrdering}
          onRowClick={(row) => router.push(`/staff/${row.id}`)}
        />
        <Pagination page={q.page} pageSize={PAGE_SIZE} total={list.data?.count ?? 0} onPageChange={q.setPage} />
      </Card>
    </div>
  );
}
