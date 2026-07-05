'use client';

import { format } from 'date-fns';
import { useState } from 'react';

import { LogVisitorButton } from '@/components/visitors/log-visitor-button';
import { VisitorsTable } from '@/components/visitors/visitors-table';
import { Card } from '@/components/ui/card';
import { FilterBar } from '@/components/ui/filter-bar';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { Segmented } from '@/components/ui/segmented';
import { StatCard, StatCardRow } from '@/components/ui/stat-card';
import type { VisitorFilter } from '@/hooks/use-visitor-rows';
import { useVisitorRows } from '@/hooks/use-visitor-rows';
import { shortDate } from '@/lib/format';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'inside', label: 'Inside' },
  { value: 'checked out', label: 'Checked out' },
];

const today = () => format(new Date(), 'yyyy-MM-dd');

export default function VisitorLogPage() {
  const [date, setDate] = useState(today);
  const [filter, setFilter] = useState<VisitorFilter>('all');
  const [search, setSearch] = useState('');

  const { rows, insideCount, checkedOutCount, totalCount, isLoading } = useVisitorRows(date, filter, search);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visitors"
        subtitle={`Gate log for ${shortDate(date)}`}
        actions={<LogVisitorButton />}
      />

      <StatCardRow className="lg:grid-cols-3">
        <StatCard label="Total today" value={totalCount} />
        <StatCard label="Inside" value={insideCount} tone="green" />
        <StatCard label="Checked out" value={checkedOutCount} tone="blue" />
      </StatCardRow>

      <Card>
        <div className="border-b border-hairline p-4">
          <FilterBar
            left={<Segmented options={STATUS_TABS} value={filter} onValueChange={(v) => setFilter(v as VisitorFilter)} />}
            right={
              <>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-auto"
                  aria-label="Date"
                />
                <SearchInput value={search} onChange={setSearch} placeholder="Search visitor, host…" />
              </>
            }
          />
        </div>
        <VisitorsTable rows={rows} isLoading={isLoading} />
      </Card>
    </div>
  );
}
