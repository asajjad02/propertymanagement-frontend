'use client';

import { Gauge } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { BillsTable } from '@/components/billing/bills-table';
import { NewBillButton } from '@/components/billing/new-bill-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateRangeFilter } from '@/components/ui/date-range-filter';
import { FilterBar } from '@/components/ui/filter-bar';
import { FilterChips, type FilterChip } from '@/components/ui/filter-chips';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { Segmented } from '@/components/ui/segmented';
import { StatCard, StatCardRow } from '@/components/ui/stat-card';
import { useBillRows } from '@/hooks/use-bill-rows';
import { useBillStats } from '@/hooks/use-bill-stats';
import { useTableQuery } from '@/hooks/use-table-query';
import { shortDate } from '@/lib/format';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'issued', label: 'Issued' },
  { value: 'paid', label: 'Paid' },
];

const PAGE_SIZE = 20;

export default function BillingListPage() {
  const router = useRouter();
  const q = useTableQuery({
    key: 'billing',
    filterKeys: ['status', 'flat', 'period_after', 'period_before'],
    defaultOrdering: '-billing_period_end',
  });

  const stats = useBillStats();
  const { rows, count, isLoading } = useBillRows(q.listParams);

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
            <NewBillButton />
          </>
        }
      />

      <StatCardRow>
        <StatCard label="Total bills" value={stats.total} />
        <StatCard label="Draft" value={stats.draft} tone="neutral" />
        <StatCard label="Issued" value={stats.issued} tone="amber" />
        <StatCard label="Paid" value={stats.paid} tone="green" />
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
            right={
              <>
                <DateRangeFilter
                  value={{ from: q.filters.period_after, to: q.filters.period_before }}
                  onChange={(range) => q.setFilters({ period_after: range.from, period_before: range.to })}
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
        <BillsTable
          rows={rows}
          isLoading={isLoading}
          ordering={q.ordering}
          onOrderingChange={q.setOrdering}
          onRowClick={(row) => router.push(`/billing/${row.bill.id}`)}
        />
        <Pagination page={q.page} pageSize={PAGE_SIZE} total={count} onPageChange={q.setPage} />
      </Card>
    </div>
  );
}
