'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { AddResidentButton } from '@/components/residents/add-resident-button';
import { ResidentsTable } from '@/components/residents/residents-table';
import { Card } from '@/components/ui/card';
import { FilterBar } from '@/components/ui/filter-bar';
import { FilterChips, type FilterChip } from '@/components/ui/filter-chips';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { Segmented } from '@/components/ui/segmented';
import { StatCard, StatCardRow } from '@/components/ui/stat-card';
import { useResidentRows } from '@/hooks/use-resident-rows';
import { useResidentStats } from '@/hooks/use-resident-stats';
import { useTableQuery } from '@/hooks/use-table-query';

const TYPE_TABS = [
  { value: 'all', label: 'All' },
  { value: 'owner', label: 'Owners' },
  { value: 'tenant', label: 'Tenants' },
];

const PAGE_SIZE = 20;

export default function ResidentsListPage() {
  const router = useRouter();
  const q = useTableQuery({
    key: 'residents',
    filterKeys: ['type'],
    defaultOrdering: 'full_name',
  });

  const stats = useResidentStats();
  const { rows, count, isLoading } = useResidentRows(q.listParams);

  const chips = useMemo<FilterChip[]>(() => {
    const list: FilterChip[] = [];
    if (q.search) {
      list.push({ id: 'search', label: `Search: “${q.search}”`, onRemove: () => q.setSearch('') });
    }
    return list;
  }, [q]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Residents"
        subtitle="Owners and tenants across your society."
        actions={<AddResidentButton />}
      />

      <StatCardRow>
        <StatCard label="Total people" value={stats.total} />
        <StatCard label="Owners" value={stats.owners} tone="indigo" />
        <StatCard label="Tenants" value={stats.tenants} tone="neutral" />
        <StatCard label="Vehicles" value={stats.vehicles} />
      </StatCardRow>

      <Card>
        <div className="space-y-3 border-b border-hairline p-4">
          <FilterBar
            left={
              <Segmented
                options={TYPE_TABS}
                value={q.filters.type ?? 'all'}
                onValueChange={(v) => q.setFilter('type', v === 'all' ? undefined : v)}
              />
            }
            right={
              <SearchInput
                value={q.search}
                onChange={q.setSearch}
                placeholder="Search name, CNIC, phone…"
              />
            }
          />
          <FilterChips chips={chips} onClearAll={q.clearFilters} />
        </div>
        <ResidentsTable
          rows={rows}
          isLoading={isLoading}
          ordering={q.ordering}
          onOrderingChange={q.setOrdering}
          onRowClick={(row) => router.push(`/residents/${row.person.id}`)}
        />
        <Pagination page={q.page} pageSize={PAGE_SIZE} total={count} onPageChange={q.setPage} />
      </Card>
    </div>
  );
}
