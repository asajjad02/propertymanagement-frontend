'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { AddFlatButton } from '@/components/flats/add-flat-button';
import { FlatsTable } from '@/components/flats/flats-table';
import { Card } from '@/components/ui/card';
import { FilterBar } from '@/components/ui/filter-bar';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { Segmented } from '@/components/ui/segmented';
import { Select } from '@/components/ui/select';
import { StatCard, StatCardRow } from '@/components/ui/stat-card';
import { useFlatRows } from '@/hooks/use-flat-rows';
import { useFlatStats } from '@/hooks/use-flat-stats';
import { useBuildingsLookup } from '@/hooks/use-lookups';
import type { OccupancyStatus } from '@/types/api';

const OCCUPANCY_TABS = [
  { value: 'all', label: 'All' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'vacant', label: 'Vacant' },
];

export default function FlatsListPage() {
  const router = useRouter();
  const [occupancy, setOccupancy] = useState('all');
  const [buildingId, setBuildingId] = useState('all');
  const [search, setSearch] = useState('');

  const stats = useFlatStats();
  const buildings = useBuildingsLookup();
  const { rows, isLoading } = useFlatRows({
    occupancy: occupancy === 'all' ? undefined : (occupancy as OccupancyStatus),
    buildingId: buildingId === 'all' ? undefined : Number(buildingId),
    search,
  });

  const buildingOptions = useMemo(
    () => [
      { value: 'all', label: 'All buildings' },
      ...(buildings.data ?? []).map((b) => ({ value: String(b.id), label: b.name })),
    ],
    [buildings.data],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flats"
        subtitle="Units across all buildings in your account."
        actions={<AddFlatButton />}
      />

      <StatCardRow>
        <StatCard label="Total flats" value={stats.total} />
        <StatCard label="Occupied" value={stats.occupied} tone="green" />
        <StatCard label="Vacant" value={stats.vacant} tone="neutral" />
        <StatCard label="Buildings" value={stats.buildings} />
      </StatCardRow>

      <Card>
        <div className="border-b border-hairline p-4">
          <FilterBar
            left={<Segmented options={OCCUPANCY_TABS} value={occupancy} onValueChange={setOccupancy} />}
            right={
              <>
                <Select value={buildingId} onValueChange={setBuildingId} options={buildingOptions} />
                <SearchInput value={search} onChange={setSearch} placeholder="Search flat number…" />
              </>
            }
          />
        </div>
        <FlatsTable
          rows={rows}
          isLoading={isLoading}
          onRowClick={(row) => router.push(`/flats/${row.flat.id}`)}
        />
      </Card>
    </div>
  );
}
