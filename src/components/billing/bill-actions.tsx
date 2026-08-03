'use client';

import { CheckCheck, Download, FileInput, Trash2, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Modal } from '@/components/ui/modal';
import { Tooltip } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/toast';
import { electricityBillHooks, meterHooks, useMarkElectricityBillPaid } from '@/hooks/resources';
import { toApiError } from '@/lib/errors';
import { useAuth } from '@/providers/auth-provider';
import type { ElectricityBill } from '@/types/api';

import { EnterReadingForm } from './enter-reading-form';
import { RecordPaymentForm } from './record-payment-form';

/** Bill header actions, gated by status and role. PDF is deferred (disabled). */
export function BillActions({ bill }: { bill: ElectricityBill }) {
  const { hasRole } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const markPaid = useMarkElectricityBillPaid();
  const remove = electricityBillHooks.useDelete();
  const patchMeter = meterHooks.usePatch();
  // Already in cache — the detail page fetches the same meter.
  const meter = meterHooks.useItem(bill.meter, { enabled: bill.meter != null });
  const [reading, setReading] = useState(false);
  const [payment, setPayment] = useState(false);
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canWrite = hasRole('admin', 'manager', 'accountant');
  // A paid bill is a settled record with payments hanging off it; deleting it
  // would take the payment history with it. Correct the reading instead.
  const canDelete = canWrite && bill.status !== 'paid';

  /*
   * Entering a reading advanced the meter, and a replacement bill derives its
   * previous_reading from the meter — so deleting alone would make the recreated
   * bill read "0 units consumed". Wind the meter back to this bill's baseline,
   * but only while this bill's reading is still the meter's latest: if a later
   * bill has since moved it on, rolling back would corrupt that one instead.
   */
  const isLatestReading =
    bill.current_reading != null &&
    meter.data != null &&
    Number(meter.data.current_reading) === Number(bill.current_reading);

  async function onDelete() {
    try {
      // Delete first: that's the intent. A failed rollback afterwards is
      // recoverable (and reported), a wound-back meter with a live bill is not.
      await remove.mutateAsync(bill.id);
      if (isLatestReading) {
        await patchMeter.mutateAsync({
          id: bill.meter,
          payload: { current_reading: bill.previous_reading },
        });
      }
      toast.success(`Bill #${bill.id} deleted`, 'You can create it again for this flat.');
      setConfirmDelete(false);
      router.replace('/billing');
    } catch (err) {
      toast.error('Could not delete the bill', toApiError(err).message);
    }
  }

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

      {canDelete && (
        <Button
          variant="ghost"
          size="sm"
          className="text-danger hover:bg-danger/10 hover:text-danger"
          loading={remove.isPending}
          disabled={remove.isPending}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
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

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        danger
        title={`Delete bill #${bill.id}?`}
        description={
          isLatestReading
            ? `This removes the bill for ${bill.billing_period_end} and rewinds the meter to ${bill.previous_reading}, so you can create it again with the right reading. If the bill was already sent, the resident keeps the old copy.`
            : 'This removes the bill so you can create it again for this flat. It can’t be undone.'
        }
        confirmLabel="Delete bill"
        loading={remove.isPending || patchMeter.isPending}
        onConfirm={onDelete}
      />
    </>
  );
}
