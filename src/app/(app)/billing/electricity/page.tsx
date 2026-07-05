'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { BillsTable } from '@/components/billing/bills-table';
import { NewBillButton } from '@/components/billing/new-bill-button';
import { Card } from '@/components/ui/card';
import { FilterBar } from '@/components/ui/filter-bar';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { Segmented } from '@/components/ui/segmented';
import { StatCard, StatCardRow } from '@/components/ui/stat-card';
import type { BillFilter } from '@/hooks/use-bill-rows';
import { useBillRows } from '@/hooks/use-bill-rows';
import { money } from '@/lib/format';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'issued', label: 'Issued' },
  { value: 'paid', label: 'Paid' },
];

export default function BillingListPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<BillFilter>('all');
  const [search, setSearch] = useState('');

  const { rows, stats, isLoading } = useBillRows(filter, search);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Electricity Billing"
        subtitle="Meter-based bills across all flats."
        actions={<NewBillButton />}
      />

      <StatCardRow>
        <StatCard label="Total bills" value={stats.total} />
        <StatCard label="Issued" value={stats.issued} tone="amber" />
        <StatCard label="Paid" value={stats.paid} tone="green" />
        <StatCard label="Outstanding" value={money(stats.outstanding)} tone="red" />
      </StatCardRow>

      <Card>
        <div className="border-b border-hairline p-4">
          <FilterBar
            left={<Segmented options={STATUS_TABS} value={filter} onValueChange={(v) => setFilter(v as BillFilter)} />}
            right={<SearchInput value={search} onChange={setSearch} placeholder="Search flat or bill #…" />}
          />
        </div>
        <BillsTable
          rows={rows}
          isLoading={isLoading}
          onRowClick={(row) => router.push(`/billing/electricity/${row.bill.id}`)}
        />
      </Card>
    </div>
  );
}
