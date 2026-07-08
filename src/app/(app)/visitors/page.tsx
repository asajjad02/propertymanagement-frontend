'use client';

import { useEffect, useMemo, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateRangeFilter, type DateRange } from '@/components/ui/date-range-filter';
import { FilterBar } from '@/components/ui/filter-bar';
import { FilterChips, type FilterChip } from '@/components/ui/filter-chips';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { Segmented } from '@/components/ui/segmented';
import { StatCard, StatCardRow } from '@/components/ui/stat-card';
import { ExportVisitorsButton } from '@/components/visitors/export-visitors-button';
import { LogVisitorButton } from '@/components/visitors/log-visitor-button';
import { VisitorsTable } from '@/components/visitors/visitors-table';
import { visitorHooks } from '@/hooks/resources';
import { useTableQuery } from '@/hooks/use-table-query';
import { useVisitorRows } from '@/hooks/use-visitor-rows';
import { shortDate } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';

const PRESENCE_TABS = [
  { value: 'all', label: 'All' },
  { value: 'inside', label: 'Inside' },
  { value: 'checked_out', label: 'Checked out' },
];

const PAGE_SIZE = 20;

export default function VisitorLogPage() {
  const { role } = useAuth();
  const q = useTableQuery({
    key: 'visitors',
    filterKeys: ['presence', 'flat', 'entry_after', 'entry_before'],
    defaultOrdering: '-entry_time',
  });

  // Guards live in the "Inside now" view: default the presence filter to
  // `inside` once, only when the URL carries no explicit presence. Applied via
  // a one-shot ref so choosing "All" afterwards is respected (and managers/
  // admins keep the default "All").
  const appliedInsideDefault = useRef(false);
  useEffect(() => {
    if (appliedInsideDefault.current || role !== 'security') return;
    appliedInsideDefault.current = true;
    if (!q.filters.presence) q.setFilter('presence', 'inside');
  }, [role, q.filters.presence, q.setFilter]);

  const { rows, count, isLoading } = useVisitorRows(q.listParams);

  // Count-only queries (page 1 carries the paginated `count`), one request each.
  const total = visitorHooks.useList({ page: 1 });
  const inside = visitorHooks.useList({ page: 1, filters: { presence: 'inside' } });
  const checkedOut = visitorHooks.useList({ page: 1, filters: { presence: 'checked_out' } });

  const dateRange = useMemo<DateRange>(
    () => ({ from: q.filters.entry_after, to: q.filters.entry_before }),
    [q.filters.entry_after, q.filters.entry_before],
  );

  const chips = useMemo<FilterChip[]>(() => {
    const list: FilterChip[] = [];
    if (q.filters.entry_after || q.filters.entry_before) {
      const from = q.filters.entry_after ? shortDate(q.filters.entry_after) : '…';
      const to = q.filters.entry_before ? shortDate(q.filters.entry_before) : '…';
      list.push({
        id: 'entry',
        label: `Entry: ${from} → ${to}`,
        onRemove: () => q.setFilters({ entry_after: undefined, entry_before: undefined }),
      });
    }
    if (q.search) {
      list.push({ id: 'search', label: `Search: “${q.search}”`, onRemove: () => q.setSearch('') });
    }
    return list;
  }, [q]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitors"
        subtitle="Gate log across all buildings in your account."
        actions={<LogVisitorButton />}
      />

      <StatCardRow className="lg:grid-cols-3">
        <StatCard label="Total visitors" value={total.data?.count ?? 0} />
        <StatCard label="Inside" value={inside.data?.count ?? 0} tone="green" />
        <StatCard label="Checked out" value={checkedOut.data?.count ?? 0} tone="blue" />
      </StatCardRow>

      <Card>
        <div className="space-y-3 border-b border-hairline p-4">
          <FilterBar
            left={
              <Segmented
                options={PRESENCE_TABS}
                value={q.filters.presence ?? 'all'}
                onValueChange={(v) => q.setFilter('presence', v === 'all' ? undefined : v)}
              />
            }
            right={
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    // Local wall-clock date (yyyy-MM-dd) so "today" matches the
                    // guard's day and the native date picker's value.
                    const d = new Date();
                    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    q.setFilters({ entry_after: today, entry_before: today });
                  }}
                >
                  Today
                </Button>
                <DateRangeFilter
                  value={dateRange}
                  onChange={(next) => q.setFilters({ entry_after: next.from, entry_before: next.to })}
                />
                <ExportVisitorsButton listParams={q.listParams} />
                <SearchInput
                  value={q.search}
                  onChange={q.setSearch}
                  placeholder="Search visitor, host, contact…"
                />
              </>
            }
          />
          <FilterChips chips={chips} onClearAll={q.clearFilters} />
        </div>
        <VisitorsTable
          rows={rows}
          isLoading={isLoading}
          ordering={q.ordering}
          onOrderingChange={q.setOrdering}
        />
        <Pagination page={q.page} pageSize={PAGE_SIZE} total={count} onPageChange={q.setPage} />
      </Card>
    </div>
  );
}
