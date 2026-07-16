'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { AddOwnerButton } from '@/components/owners/add-owner-button';
import { OwnersTable } from '@/components/owners/owners-table';
import { Card } from '@/components/ui/card';
import { FilterBar } from '@/components/ui/filter-bar';
import { FilterChips, type FilterChip } from '@/components/ui/filter-chips';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { StatCard, StatCardRow } from '@/components/ui/stat-card';
import { useOwnerRows } from '@/hooks/use-owner-rows';
import { useFlatsLookup } from '@/hooks/use-lookups';
import { useTableQuery } from '@/hooks/use-table-query';

const PAGE_SIZE = 20;

export default function OwnersListPage() {
  const router = useRouter();
  const q = useTableQuery({ key: 'owners', filterKeys: [], defaultOrdering: '-created_at' });

  const { rows, count, isLoading } = useOwnerRows(q.listParams);
  const flats = useFlatsLookup();

  const flatStats = useMemo(() => {
    let owned = 0;
    let unowned = 0;
    for (const f of flats.map.values()) {
      if (f.owner != null) owned += 1;
      else unowned += 1;
    }
    return { owned, unowned };
  }, [flats.map]);

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
        title="Owners"
        subtitle="People who own flats in your property."
        actions={<AddOwnerButton />}
      />

      <StatCardRow>
        <StatCard label="Total owners" value={count} />
        <StatCard label="Flats owned" value={flatStats.owned} tone="green" />
        <StatCard label="Unowned flats" value={flatStats.unowned} tone="neutral" />
      </StatCardRow>

      <Card>
        <div className="space-y-3 border-b border-hairline p-4">
          <FilterBar
            right={
              <SearchInput
                value={q.search}
                onChange={q.setSearch}
                placeholder="Search owner name, CNIC…"
              />
            }
          />
          <FilterChips chips={chips} onClearAll={q.clearFilters} />
        </div>
        <OwnersTable
          rows={rows}
          isLoading={isLoading}
          onRowClick={(row) => row.personId != null && router.push(`/residents/${row.personId}`)}
        />
        <Pagination page={q.page} pageSize={PAGE_SIZE} total={count} onPageChange={q.setPage} />
      </Card>
    </div>
  );
}
