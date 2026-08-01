'use client';

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { AddFlatButton } from '@/components/flats/add-flat-button';
import { FLAT_SORT_OPTIONS, FlatsTable } from '@/components/flats/flats-table';
import { PageChrome } from '@/components/shell/page-chrome';
import { Card } from '@/components/ui/card';
import { FilterChips, type FilterChip } from '@/components/ui/filter-chips';
import { FilterSheet } from '@/components/ui/filter-sheet';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { Segmented } from '@/components/ui/segmented';
import { Select } from '@/components/ui/select';
import { StatCardSkeleton } from '@/components/ui/skeleton';
import { SortControl } from '@/components/ui/sort-control';
import { StatCard, StatCardRow } from '@/components/ui/stat-card';
import { useFlatRows } from '@/hooks/use-flat-rows';
import { useFlatStats } from '@/hooks/use-flat-stats';
import { useTableQuery } from '@/hooks/use-table-query';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'studio', label: 'Studio' },
  { value: '1-bed', label: '1-Bed' },
  { value: '2-bed', label: '2-Bed' },
  { value: '3-bed', label: '3-Bed' },
  { value: 'penthouse', label: 'Penthouse' },
];

const PAGE_SIZE = 20;
const DEFAULT_ORDERING = 'flat_number';

export default function FlatsListPage() {
  const router = useRouter();
  const q = useTableQuery({
    key: 'flats',
    filterKeys: ['occupancy_status', 'flat_type'],
    defaultOrdering: DEFAULT_ORDERING,
  });

  const stats = useFlatStats();
  const { rows, count, isLoading } = useFlatRows(q.listParams);

  /*
   * The occupancy segments carry the same three numbers the stat tiles do, so
   * on mobile the tiles are dropped entirely and these counts stand in — same
   * information, one row instead of four, and each number is a filter.
   */
  const occupancyTabs = useMemo(
    () => [
      // No counts until they're real — flashing 0 → 19 reads as data, not as
      // loading, and it's the number the user is here to check.
      { value: 'all', label: 'All', count: stats.isLoading ? undefined : stats.total },
      { value: 'occupied', label: 'Occupied', count: stats.isLoading ? undefined : stats.occupied },
      { value: 'vacant', label: 'Vacant', count: stats.isLoading ? undefined : stats.vacant },
    ],
    [stats.isLoading, stats.total, stats.occupied, stats.vacant],
  );

  const chips = useMemo<FilterChip[]>(() => {
    const list: FilterChip[] = [];
    if (q.filters.flat_type) {
      const label = TYPE_OPTIONS.find((t) => t.value === q.filters.flat_type)?.label ?? q.filters.flat_type;
      list.push({ id: 'flat_type', label: `Type: ${label}`, onRemove: () => q.setFilter('flat_type', undefined) });
    }
    if (q.search) {
      list.push({ id: 'search', label: `Search: “${q.search}”`, onRemove: () => q.setSearch('') });
    }
    return list;
  }, [q]);

  return (
    <div className="space-y-4 md:space-y-6">
      <PageChrome title="Flats" />
      {/* Desktop-only; below `lg` the app bar shows the title, and AddFlatButton
          registers its own action there. */}
      <PageHeader title="Flats" subtitle="Units in your account." actions={<AddFlatButton />} />

      {/* Redundant with the segment counts on a phone — desktop only. */}
      <StatCardRow className="hidden md:grid">
        {stats.isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Total flats" value={stats.total} />
            <StatCard label="Occupied" value={stats.occupied} tone="green" />
            <StatCard label="Vacant" value={stats.vacant} tone="neutral" />
          </>
        )}
      </StatCardRow>

      <Card>
        {/* Direct child of Card on purpose: the toolbar is sticky, and a sticky
            element only stays pinned while its containing block is on screen. */}
        <ListToolbar
          segments={
            <Segmented
              options={occupancyTabs}
              value={q.filters.occupancy_status ?? 'all'}
              onValueChange={(v) => q.setFilter('occupancy_status', v === 'all' ? undefined : v)}
            />
          }
          search={
            <SearchInput value={q.search} onChange={q.setSearch} placeholder="Search flats…" />
          }
          actions={
            <>
              <FilterSheet activeCount={q.activeFilterCount} onClearAll={q.clearFilters}>
                <Select
                  value={q.filters.flat_type ?? 'all'}
                  onValueChange={(v) => q.setFilter('flat_type', v === 'all' ? undefined : v)}
                  options={TYPE_OPTIONS}
                />
              </FilterSheet>
              <SortControl
                options={FLAT_SORT_OPTIONS}
                ordering={q.ordering}
                onOrderingChange={q.setOrdering}
                defaultOrdering={DEFAULT_ORDERING}
                className="md:hidden"
              />
            </>
          }
        />
        {/* Active-filter chips are a desktop affordance; mobile shows the count
            on the filter button instead. */}
        <div className="hidden px-4 pb-4 md:block">
          <FilterChips chips={chips} onClearAll={q.clearFilters} />
        </div>
        <FlatsTable
          rows={rows}
          isLoading={isLoading}
          ordering={q.ordering}
          onOrderingChange={q.setOrdering}
          onRowClick={(row) => router.push(`/flats/${row.flat.id}`)}
          // Sorting lives in the toolbar above; don't spend a row repeating it.
          mobileSort={false}
        />
        <Pagination page={q.page} pageSize={PAGE_SIZE} total={count} onPageChange={q.setPage} />
      </Card>
    </div>
  );
}
