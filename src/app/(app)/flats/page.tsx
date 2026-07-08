'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { AddFlatButton } from '@/components/flats/add-flat-button';
import { BulkAddFlatsButton } from '@/components/flats/bulk-add-flats-button';
import { FlatsTable } from '@/components/flats/flats-table';
import { Card } from '@/components/ui/card';
import { FilterBar } from '@/components/ui/filter-bar';
import { FilterChips, type FilterChip } from '@/components/ui/filter-chips';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { Segmented } from '@/components/ui/segmented';
import { Select } from '@/components/ui/select';
import { StatCard, StatCardRow } from '@/components/ui/stat-card';
import { useFlatRows } from '@/hooks/use-flat-rows';
import { useFlatStats } from '@/hooks/use-flat-stats';
import { useBuildingsLookup } from '@/hooks/use-lookups';
import { useTableQuery } from '@/hooks/use-table-query';

const OCCUPANCY_TABS = [
  { value: 'all', label: 'All' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'vacant', label: 'Vacant' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'studio', label: 'Studio' },
  { value: '1-bed', label: '1-Bed' },
  { value: '2-bed', label: '2-Bed' },
  { value: '3-bed', label: '3-Bed' },
  { value: 'penthouse', label: 'Penthouse' },
];

const PAGE_SIZE = 20;

export default function FlatsListPage() {
  const router = useRouter();
  const q = useTableQuery({
    key: 'flats',
    filterKeys: ['occupancy_status', 'building', 'flat_type'],
    defaultOrdering: 'flat_number',
  });

  const stats = useFlatStats();
  const buildings = useBuildingsLookup();
  const { rows, count, isLoading } = useFlatRows(q.listParams);

  const buildingOptions = useMemo(
    () => [
      { value: 'all', label: 'All buildings' },
      ...(buildings.data ?? []).map((b) => ({ value: String(b.id), label: b.name })),
    ],
    [buildings.data],
  );

  const chips = useMemo<FilterChip[]>(() => {
    const list: FilterChip[] = [];
    if (q.filters.building) {
      const name = buildings.map.get(Number(q.filters.building))?.name ?? q.filters.building;
      list.push({ id: 'building', label: `Building: ${name}`, onRemove: () => q.setFilter('building', undefined) });
    }
    if (q.filters.flat_type) {
      const label = TYPE_OPTIONS.find((t) => t.value === q.filters.flat_type)?.label ?? q.filters.flat_type;
      list.push({ id: 'flat_type', label: `Type: ${label}`, onRemove: () => q.setFilter('flat_type', undefined) });
    }
    if (q.search) {
      list.push({ id: 'search', label: `Search: “${q.search}”`, onRemove: () => q.setSearch('') });
    }
    return list;
  }, [q, buildings.map]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flats"
        subtitle="Units across all buildings in your account."
        actions={
          <>
            <BulkAddFlatsButton />
            <AddFlatButton />
          </>
        }
      />

      <StatCardRow>
        <StatCard label="Total flats" value={stats.total} />
        <StatCard label="Occupied" value={stats.occupied} tone="green" />
        <StatCard label="Vacant" value={stats.vacant} tone="neutral" />
        <StatCard label="Buildings" value={stats.buildings} />
      </StatCardRow>

      <Card>
        <div className="space-y-3 border-b border-hairline p-4">
          <FilterBar
            left={
              <Segmented
                options={OCCUPANCY_TABS}
                value={q.filters.occupancy_status ?? 'all'}
                onValueChange={(v) => q.setFilter('occupancy_status', v === 'all' ? undefined : v)}
              />
            }
            right={
              <>
                <Select
                  value={q.filters.building ?? 'all'}
                  onValueChange={(v) => q.setFilter('building', v === 'all' ? undefined : v)}
                  options={buildingOptions}
                />
                <Select
                  value={q.filters.flat_type ?? 'all'}
                  onValueChange={(v) => q.setFilter('flat_type', v === 'all' ? undefined : v)}
                  options={TYPE_OPTIONS}
                />
                <SearchInput
                  value={q.search}
                  onChange={q.setSearch}
                  placeholder="Search flat number…"
                />
              </>
            }
          />
          <FilterChips chips={chips} onClearAll={q.clearFilters} />
        </div>
        <FlatsTable
          rows={rows}
          isLoading={isLoading}
          ordering={q.ordering}
          onOrderingChange={q.setOrdering}
          onRowClick={(row) => router.push(`/flats/${row.flat.id}`)}
        />
        <Pagination page={q.page} pageSize={PAGE_SIZE} total={count} onPageChange={q.setPage} />
      </Card>
    </div>
  );
}
