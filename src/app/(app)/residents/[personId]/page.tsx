'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';

import { BillingDocList } from '@/components/billing/billing-doc-list';
import { billsToDocItems, chargesToDocItems } from '@/components/billing/to-doc-items';
import { DocumentList } from '@/components/documents/document-list';
import { ResidentActions } from '@/components/residents/resident-actions';
import { ResidentOverview } from '@/components/residents/resident-overview';
import { Avatar } from '@/components/ui/avatar';
import { DetailHeader } from '@/components/ui/detail-header';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/spinner';
import { Tabs } from '@/components/ui/tabs';
import { TypeTag } from '@/components/ui/type-tag';
import { ResidentVehicles } from '@/components/vehicles/resident-vehicles';
import { useResidentDetail } from '@/hooks/use-resident-detail';

const TABS = [
  { value: 'overview', label: 'Overview' },
  { value: 'vehicles', label: 'Vehicles' },
  { value: 'documents', label: 'Documents' },
  { value: 'ledger', label: 'Ledger' },
];

export default function ResidentProfilePage() {
  const params = useParams<{ personId: string }>();
  const personId = Number(params.personId);
  const detail = useResidentDetail(personId);
  const [tab, setTab] = useState('overview');

  if (detail.isLoading) return <LoadingBlock />;
  if (!detail.person) {
    return <EmptyState title="Resident not found" description="It may have been removed." />;
  }

  const { person, types, flat } = detail;

  return (
    <div className="space-y-6">
      <DetailHeader
        backHref="/residents"
        backLabel="All residents"
        title={person.full_name}
        leading={<Avatar name={person.full_name} size="lg" />}
        status={types.map((t) => <TypeTag key={t} type={t} />)}
        meta={flat ? `Flat ${flat.flat_number}` : 'No active flat'}
        actions={<ResidentActions person={person} />}
      />

      <Tabs tabs={TABS} value={tab} onValueChange={setTab} />

      {tab === 'overview' && <ResidentOverview detail={detail} />}
      {tab === 'vehicles' && <ResidentVehicles personId={person.id} vehicles={detail.vehicles} />}
      {tab === 'documents' && (
        <DocumentList relatedModel="person" relatedId={person.id} />
      )}
      {tab === 'ledger' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BillingDocList title="Electricity bills" items={billsToDocItems(detail.bills)} emptyLabel="No bills" />
          <BillingDocList title="Maintenance charges" items={chargesToDocItems(detail.charges)} emptyLabel="No charges" />
        </div>
      )}
    </div>
  );
}
