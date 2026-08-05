'use client';

import { Gauge } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { PrintAllBillsAction } from '@/components/billing/print-all-bills-action';
import { AppBarAction, PageChrome } from '@/components/shell/page-chrome';
import { BILL_SORT_OPTIONS, BillsTable } from '@/components/billing/bills-table';
import { NewBillButton } from '@/components/billing/new-bill-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { FilterChips, type FilterChip } from '@/components/ui/filter-chips';
import { FilterSheet } from '@/components/ui/filter-sheet';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { Segmented } from '@/components/ui/segmented';
import { SortControl } from '@/components/ui/sort-control';
import { StatCard, StatCardRow } from '@/components/ui/stat-card';
import { useBillRows } from '@/hooks/use-bill-rows';
import { useBillStats } from '@/hooks/use-bill-stats';
import { useTableQuery } from '@/hooks/use-table-query';
import { shortDate } from '@/lib/format';

const PAGE_SIZE = 20;
const DEFAULT_ORDERING = '-billing_period_end';

export default function BillingListPage() {
  const router = useRouter();
  const q = useTableQuery({
    key: 'billing',
    filterKeys: ['status', 'flat', 'period_after', 'period_before'],
    defaultOrdering: DEFAULT_ORDERING,
  });

  const stats = useBillStats();
  const { rows, count, isLoading } = useBillRows(q.listParams);

  /*
   * Counts on the tabs replace the stat tiles on mobile — same four numbers,
   * one row instead of four, and each is a filter. Held back until they're real
   * so the row doesn't flash zeros.
   */
  const statusTabs = useMemo(
    () => {
      const n = (v: number) => (stats.isLoading ? undefined : v);
      return [
        { value: 'all', label: 'All', count: n(stats.total) },
        { value: 'draft', label: 'Draft', count: n(stats.draft) },
        { value: 'issued', label: 'Issued', count: n(stats.issued) },
        { value: 'paid', label: 'Paid', count: n(stats.paid) },
      ];
    },
    [stats.isLoading, stats.total, stats.draft, stats.issued, stats.paid],
  );

  const chips = useMemo<FilterChip[]>(() => {
    const list: FilterChip[] = [];
    if (q.filters.period_after || q.filters.period_before) {
      const from = q.filters.period_after ? shortDate(q.filters.period_after) : '…';
      const to = q.filters.period_before ? shortDate(q.filters.period_before) : '…';
      list.push({
        id: 'period',
        label: `Period: ${from} → ${to}`,
        onRemove: () => q.setFilters({ period_after: undefined, period_before: undefined }),
      });
    }
    if (q.search) {
      list.push({ id: 'search', label: `Search: “${q.search}”`, onRemove: () => q.setSearch('') });
    }
    return list;
  }, [q]);

  return (
    <div className="space-y-6">
      <PageChrome title="Monthly Bills" />
      {/* NewBillButton registers its own bar action; this mirrors the
          Meter round link that sits beside it on desktop. */}
      <AppBarAction icon={Gauge} label="Meter round" href="/billing/meter-round" />
      <PageHeader
        title="Monthly Bills"
        subtitle="One combined monthly bill per flat — electricity + maintenance + outstanding."
        actions={
          <>
            <Button variant="secondary" asChild>
              <Link href="/billing/meter-round">
                <Gauge className="h-4 w-4" />
                Meter round
              </Link>
            </Button>
            <PrintAllBillsAction />
            <NewBillButton />
          </>
        }
      />

      {/* The status counts also ride on the segment tabs, so on a phone these
          four tiles would be the same four numbers twice. */}
      <StatCardRow className="hidden md:grid">
        <StatCard label="Total bills" value={stats.total} />
        <StatCard label="Draft" value={stats.draft} tone="neutral" />
        <StatCard label="Issued" value={stats.issued} tone="amber" />
        <StatCard label="Paid" value={stats.paid} tone="green" />
      </StatCardRow>

      <Card>
        {/* Direct child of Card: the toolbar is sticky, and a sticky element
            only stays pinned while its containing block is on screen. */}
        <ListToolbar
          segments={
            <Segmented
              options={statusTabs}
              value={q.filters.status ?? 'all'}
              onValueChange={(v) => q.setFilter('status', v === 'all' ? undefined : v)}
            />
          }
          search={
            <SearchInput value={q.search} onChange={q.setSearch} placeholder="Search flats…" />
          }
          actions={
            <>
              <FilterSheet activeCount={q.activeFilterCount} onClearAll={q.clearFilters}>
                <DateRangeFilter
                  value={{ from: q.filters.period_after, to: q.filters.period_before }}
                  onChange={(range) => q.setFilters({ period_after: range.from, period_before: range.to })}
                />
              </FilterSheet>
              <SortControl
                options={BILL_SORT_OPTIONS}
                ordering={q.ordering}
                onOrderingChange={q.setOrdering}
                defaultOrdering={DEFAULT_ORDERING}
                className="md:hidden"
              />
            </>
          }
        />
        <div className="hidden px-4 pb-4 md:block">
          <FilterChips chips={chips} onClearAll={q.clearFilters} />
        </div>
        <BillsTable
          rows={rows}
          isLoading={isLoading}
          ordering={q.ordering}
          onOrderingChange={q.setOrdering}
          onRowClick={(row) => router.push(`/billing/${row.bill.id}`)}
          mobileSort={false}
        />
        <Pagination page={q.page} pageSize={PAGE_SIZE} total={count} onPageChange={q.setPage} />
      </Card>
    </div>
  );
}
