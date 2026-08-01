'use client';

import { useMemo, useState } from 'react';

import { PageChrome } from '@/components/shell/page-chrome';
import { AddComplaintButton } from '@/components/complaints/add-complaint-button';
import { ComplaintDetailDialog } from '@/components/complaints/complaint-detail-dialog';
import { ComplaintsTable } from '@/components/complaints/complaints-table';
import { Card } from '@/components/ui/card';
import { FilterBar } from '@/components/ui/filter-bar';
import { FilterChips, type FilterChip } from '@/components/ui/filter-chips';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/ui/pagination';
import { SearchInput } from '@/components/ui/search-input';
import { Segmented } from '@/components/ui/segmented';
import { Select } from '@/components/ui/select';
import { StatCard, StatCardRow } from '@/components/ui/stat-card';
import { useComplaintRows } from '@/hooks/use-complaint-rows';
import { useComplaintStats } from '@/hooks/use-complaint-stats';
import { useStaffLookup } from '@/hooks/use-lookups';
import { useTableQuery } from '@/hooks/use-table-query';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
];

// Complaint types the form stores (a free-form string on the backend); the
// values here must match what complaint-form.tsx writes.
const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'Plumbing', label: 'Plumbing' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'Elevator', label: 'Elevator' },
  { value: 'Security', label: 'Security' },
  { value: 'Cleaning', label: 'Cleaning' },
  { value: 'Parking', label: 'Parking' },
  { value: 'Noise', label: 'Noise' },
  { value: 'Other', label: 'Other' },
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All priorities' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'routine', label: 'Routine' },
];

const PRIORITY_LABELS: Record<string, string> = {
  emergency: 'Emergency',
  urgent: 'Urgent',
  routine: 'Routine',
};

const PAGE_SIZE = 20;

export default function ComplaintsPage() {
  const q = useTableQuery({
    key: 'complaints',
    filterKeys: ['status', 'priority', 'complaint_type', 'assigned_staff', 'flat'],
    defaultOrdering: '-created_at',
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const stats = useComplaintStats();
  const staff = useStaffLookup();
  const { rows, count, isLoading } = useComplaintRows(q.listParams);
  const selected = rows.find((r) => r.complaint.id === selectedId) ?? null;

  const staffOptions = useMemo(
    () => [
      { value: 'all', label: 'All assignees' },
      ...(staff.data ?? []).map((s) => ({
        value: String(s.id),
        label: s.designation ? `${s.full_name} · ${s.designation}` : s.full_name,
      })),
    ],
    [staff.data],
  );

  const chips = useMemo<FilterChip[]>(() => {
    const list: FilterChip[] = [];
    if (q.filters.priority) {
      list.push({
        id: 'priority',
        label: `Priority: ${PRIORITY_LABELS[q.filters.priority] ?? q.filters.priority}`,
        onRemove: () => q.setFilter('priority', undefined),
      });
    }
    if (q.filters.complaint_type) {
      list.push({
        id: 'complaint_type',
        label: `Type: ${q.filters.complaint_type}`,
        onRemove: () => q.setFilter('complaint_type', undefined),
      });
    }
    if (q.filters.assigned_staff) {
      const name = staff.map.get(Number(q.filters.assigned_staff))?.full_name ?? q.filters.assigned_staff;
      list.push({
        id: 'assigned_staff',
        label: `Assignee: ${name}`,
        onRemove: () => q.setFilter('assigned_staff', undefined),
      });
    }
    if (q.search) {
      list.push({ id: 'search', label: `Search: “${q.search}”`, onRemove: () => q.setSearch('') });
    }
    return list;
  }, [q, staff.map]);

  return (
    <div className="space-y-6">
      <PageChrome title="Complaints" />
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
                <Select
                  value={q.filters.priority ?? 'all'}
                  onValueChange={(v) => q.setFilter('priority', v === 'all' ? undefined : v)}
                  options={PRIORITY_OPTIONS}
                />
                <Select
                  value={q.filters.complaint_type ?? 'all'}
                  onValueChange={(v) => q.setFilter('complaint_type', v === 'all' ? undefined : v)}
                  options={TYPE_OPTIONS}
                />
                <Select
                  value={q.filters.assigned_staff ?? 'all'}
                  onValueChange={(v) => q.setFilter('assigned_staff', v === 'all' ? undefined : v)}
                  options={staffOptions}
                />
                <SearchInput
                  value={q.search}
                  onChange={q.setSearch}
                  placeholder="Search type or description…"
                />
              </>
            }
          />
          <FilterChips chips={chips} onClearAll={q.clearFilters} />
        </div>
        <ComplaintsTable
          rows={rows}
          isLoading={isLoading}
          ordering={q.ordering}
          onOrderingChange={q.setOrdering}
          onRowClick={(row) => setSelectedId(row.complaint.id)}
        />
        <Pagination page={q.page} pageSize={PAGE_SIZE} total={count} onPageChange={q.setPage} />
      </Card>

      <ComplaintDetailDialog
        row={selected}
        open={selectedId != null}
        onOpenChange={(o) => !o && setSelectedId(null)}
      />
    </div>
  );
}
