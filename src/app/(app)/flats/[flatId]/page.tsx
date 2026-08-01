'use client';

import { Activity, FileText } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

import { PageChrome } from '@/components/shell/page-chrome';
import { BillingDocList } from '@/components/billing/billing-doc-list';
import { billsToDocItems, chargesToDocItems } from '@/components/billing/to-doc-items';
import { FlatActions } from '@/components/flats/flat-actions';
import { FlatOverview } from '@/components/flats/flat-overview';
import { DetailHeader } from '@/components/ui/detail-header';
import { EmptyState } from '@/components/ui/empty-state';
import { DetailSkeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs } from '@/components/ui/tabs';
import { useFlatDetail } from '@/hooks/use-flat-detail';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'billing', label: 'Billing' },
  { value: 'documents', label: 'Documents' },
  { value: 'activity', label: 'Activity' },
];

export default function FlatDetailPage() {
  const params = useParams<{ flatId: string }>();
  const flatId = Number(params.flatId);
  const detail = useFlatDetail(flatId);
  const [tab, setTab] = useState('overview');

  if (detail.isLoading) {
    // Keep the app bar (back chevron + where you are) while the record
    // loads, then a placeholder shaped like the page that follows.
    return (
      <>
        <PageChrome title="Flat" backHref="/flats" />
        <DetailSkeleton />
      </>
    );
  }
  if (!detail.flat) {
    return <EmptyState title="Flat not found" description="It may have been removed." />;
  }

  const { flat } = detail;

  return (
    <div className="space-y-6">
      <PageChrome title={`Flat ${flat.flat_number}`} backHref="/flats" />
      <DetailHeader
        backHref="/flats"
        backLabel="All flats"
        title={`Flat ${flat.flat_number}`}
        status={<StatusBadge status={flat.occupancy_status} />}
        meta={`Floor ${flat.floor_number}`}
        actions={<FlatActions flat={flat} />}
      />

      <Tabs tabs={TABS} value={tab} onValueChange={setTab} />

      {tab === 'overview' && <FlatOverview detail={detail} />}

      {tab === 'billing' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BillingDocList title="Electricity bills" items={billsToDocItems(detail.bills)} emptyLabel="No bills yet" />
          <BillingDocList title="Maintenance charges" items={chargesToDocItems(detail.charges)} emptyLabel="No charges yet" />
        </div>
      )}

      {tab === 'documents' && (
        <EmptyState icon={FileText} title="Documents coming soon"
          description="Document storage isn’t available in this version yet." />
      )}
      {tab === 'activity' && (
        <EmptyState icon={Activity} title="Activity coming soon"
          description="An audit trail isn’t available in this version yet." />
      )}
    </div>
  );
}
