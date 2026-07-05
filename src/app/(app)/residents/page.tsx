'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AddResidentButton } from '@/components/residents/add-resident-button';
import { ResidentsTable } from '@/components/residents/residents-table';
import { Card } from '@/components/ui/card';
import { FilterBar } from '@/components/ui/filter-bar';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { Segmented } from '@/components/ui/segmented';
import { StatCard, StatCardRow } from '@/components/ui/stat-card';
import type { ResidentFilter } from '@/hooks/use-resident-rows';
import { useResidentRows } from '@/hooks/use-resident-rows';
import { useResidentStats } from '@/hooks/use-resident-stats';

const FILTER_TABS = [
  { value: 'everyone', label: 'Everyone' },
  { value: 'owners', label: 'Owners' },
  { value: 'tenants', label: 'Tenants' },
];

export default function ResidentsListPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<ResidentFilter>('everyone');
  const [search, setSearch] = useState('');

  const stats = useResidentStats();
  const { rows, isLoading } = useResidentRows(filter, search);

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
        <div className="border-b border-hairline p-4">
          <FilterBar
            left={
              <Segmented
                options={FILTER_TABS}
                value={filter}
                onValueChange={(v) => setFilter(v as ResidentFilter)}
              />
            }
            right={<SearchInput value={search} onChange={setSearch} placeholder="Search name, CNIC, phone…" />}
          />
        </div>
        <ResidentsTable
          rows={rows}
          isLoading={isLoading}
          onRowClick={(row) => router.push(`/residents/${row.person.id}`)}
        />
      </Card>
    </div>
  );
}
