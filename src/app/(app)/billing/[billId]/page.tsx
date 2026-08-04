'use client';

import { useParams } from 'next/navigation';

import { PageChrome } from '@/components/shell/page-chrome';
import { BillActions } from '@/components/billing/bill-actions';
import { BillDocument } from '@/components/billing/bill-document';
import { PaymentPanel } from '@/components/billing/payment-panel';
import { SendPanel } from '@/components/billing/send-panel';
import { DetailHeader } from '@/components/ui/detail-header';
import { EmptyState } from '@/components/ui/empty-state';
import { DetailSkeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/ui/status-badge';
import { useBillDetail } from '@/hooks/use-bill-detail';
import { shortDate } from '@/lib/format';

export default function BillDetailPage() {
  const params = useParams<{ billId: string }>();
  const billId = Number(params.billId);
  const { bill, flat, payments, isLoading } = useBillDetail(billId);

  if (isLoading) {
    // Keep the app bar (back chevron + where you are) while the record
    // loads, then a placeholder shaped like the page that follows.
    return (
      <>
        <PageChrome title="Bill" backHref="/billing" />
        <DetailSkeleton />
      </>
    );
  }
  if (!bill) return <EmptyState title="Bill not found" description="It may have been removed." />;

  return (
    <div className="space-y-6">
      <PageChrome title={`Bill #${bill.id}`} backHref="/billing" />
      <DetailHeader
        backHref="/billing"
        backLabel="All bills"
        title={`Bill #${bill.id}`}
        status={<StatusBadge status={bill.status} />}
        meta={`Flat ${flat?.flat_number ?? '—'} · Issued ${shortDate(bill.issued_at)}`}
        actions={<BillActions bill={bill} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.55fr_1fr]">
        <BillDocument bill={bill} />
        <div className="space-y-6">
          <PaymentPanel bill={bill} payments={payments} />
          <SendPanel billId={bill.id} />
        </div>
      </div>
    </div>
  );
}
