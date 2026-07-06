'use client';

import { useState } from 'react';

import { AddComplaintButton } from '@/components/complaints/add-complaint-button';
import { ComplaintDetailDialog } from '@/components/complaints/complaint-detail-dialog';
import { ComplaintsTable } from '@/components/complaints/complaints-table';
import { Card } from '@/components/ui/card';
import { FilterBar } from '@/components/ui/filter-bar';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { Segmented } from '@/components/ui/segmented';
import { StatCard, StatCardRow } from '@/components/ui/stat-card';
import type { ComplaintFilter } from '@/hooks/use-complaint-rows';
import { useComplaintRows } from '@/hooks/use-complaint-rows';
import { useComplaintStats } from '@/hooks/use-complaint-stats';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
];

export default function ComplaintsPage() {
  const [filter, setFilter] = useState<ComplaintFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const stats = useComplaintStats();
  const { rows, isLoading } = useComplaintRows(filter, search);
  const selected = rows.find((r) => r.complaint.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Complaints"
        subtitle="Resident complaints, assignment, and resolution."
        actions={<AddComplaintButton />}
      />

      <StatCardRow>
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Open" value={stats.open} tone="amber" />
        <StatCard label="In progress" value={stats.inProgress} tone="blue" />
        <StatCard label="Resolved" value={stats.resolved} tone="green" />
      </StatCardRow>

      <Card>
        <div className="border-b border-hairline p-4">
          <FilterBar
            left={<Segmented options={STATUS_TABS} value={filter} onValueChange={(v) => setFilter(v as ComplaintFilter)} />}
            right={<SearchInput value={search} onChange={setSearch} placeholder="Search type or description…" />}
          />
        </div>
        <ComplaintsTable rows={rows} isLoading={isLoading} onRowClick={(row) => setSelectedId(row.complaint.id)} />
      </Card>

      <ComplaintDetailDialog
        row={selected}
        open={selectedId != null}
        onOpenChange={(o) => !o && setSelectedId(null)}
      />
    </div>
  );
}
