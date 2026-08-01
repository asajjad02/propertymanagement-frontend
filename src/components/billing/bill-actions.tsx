'use client';

import { CheckCheck, Download, FileInput, Wallet } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Modal } from '@/components/ui/modal';
import { Tooltip } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/toast';
import { useMarkElectricityBillPaid } from '@/hooks/resources';
import { toApiError } from '@/lib/errors';
import { useAuth } from '@/providers/auth-provider';
import type { ElectricityBill } from '@/types/api';

import { EnterReadingForm } from './enter-reading-form';
import { RecordPaymentForm } from './record-payment-form';

/** Bill header actions, gated by status and role. PDF is deferred (disabled). */
export function BillActions({ bill }: { bill: ElectricityBill }) {
  const { hasRole } = useAuth();
  const toast = useToast();
  const markPaid = useMarkElectricityBillPaid();
  const [reading, setReading] = useState(false);
  const [payment, setPayment] = useState(false);
  const [confirmPaid, setConfirmPaid] = useState(false);

  const canWrite = hasRole('admin', 'manager', 'accountant');

  async function onMarkPaid() {
    try {
      await markPaid.mutateAsync(bill.id);
      toast.success('Bill marked paid');
      setConfirmPaid(false);
    } catch (err) {
      toast.error('Could not mark paid', toApiError(err).message);
    }
  }

  return (
    <>
      {/* PDF export is part of the deferred pipeline. */}
      <Tooltip content="PDF export isn’t available yet" side="bottom">
        <Button variant="secondary" size="sm" disabled>
          <Download className="h-4 w-4" />
          PDF
        </Button>
      </Tooltip>

      {canWrite && bill.status === 'draft' && (
        <Button size="sm" onClick={() => setReading(true)}>
          <FileInput className="h-4 w-4" />
          Enter reading
        </Button>
      )}

      {canWrite && bill.status === 'issued' && (
        <>
          <Button variant="secondary" size="sm" loading={markPaid.isPending} disabled={markPaid.isPending} onClick={() => setConfirmPaid(true)}>
            <CheckCheck className="h-4 w-4" />
            Mark paid
          </Button>
          <Button size="sm" onClick={() => setPayment(true)}>
            <Wallet className="h-4 w-4" />
            Record payment
          </Button>
        </>
      )}

      <Modal open={reading} onOpenChange={setReading} title="Enter meter reading"
        description="Records the reading and issues this bill.">
        <EnterReadingForm billId={bill.id} onDone={() => setReading(false)} />
      </Modal>
      <Modal open={payment} onOpenChange={setPayment} title="Record payment">
        <RecordPaymentForm billId={bill.id} defaultAmount={bill.total_payable} onDone={() => setPayment(false)} />
      </Modal>

      <ConfirmDialog
        open={confirmPaid}
        onOpenChange={setConfirmPaid}
        title={`Mark bill #${bill.id} as paid?`}
        description="This settles the bill in full and can't be undone. Use “Record payment” instead if you're logging a partial or specific payment."
        confirmLabel="Mark paid"
        loading={markPaid.isPending}
        onConfirm={onMarkPaid}
      />
    </>
  );
}
