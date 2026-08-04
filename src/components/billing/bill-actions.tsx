'use client';

import { CheckCheck, FileInput, Printer, Trash2, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import * as api from '@/api/endpoints';
import { electricityBillHooks, useMarkElectricityBillPaid } from '@/hooks/resources';
import { toApiError } from '@/lib/errors';
import { useAuth } from '@/providers/auth-provider';
import type { ElectricityBill } from '@/types/api';

import { EnterReadingForm } from './enter-reading-form';
import { RecordPaymentForm } from './record-payment-form';

/** Bill header actions, gated by status and role. */
export function BillActions({ bill }: { bill: ElectricityBill }) {
  const { hasRole } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const markPaid = useMarkElectricityBillPaid();
  const remove = electricityBillHooks.useDelete();
  const [reading, setReading] = useState(false);
  const [payment, setPayment] = useState(false);
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [printing, setPrinting] = useState(false);

  const canWrite = hasRole('admin', 'manager', 'accountant');
  // A paid bill is a settled record with payments hanging off it; deleting it
  // would take the payment history with it. Correct the reading instead.
  const canDelete = canWrite && bill.status !== 'paid';

  /*
   * Entering a reading advanced the meter, and a replacement bill derives its
   * previous_reading from the meter — so a bare delete would make the recreated
   * bill read "0 units consumed". The server winds the meter back to this bill's
   * baseline and drops the reading, in the same transaction as the delete, and
   * declines to do so if a later bill has already moved the meter on. One
   * request: this used to be two, which could half-apply.
   */
  async function onDelete() {
    try {
      await remove.mutateAsync(bill.id);
      toast.success(`Bill #${bill.id} deleted`, 'You can create it again for this flat.');
      setConfirmDelete(false);
      router.replace('/billing');
    } catch (err) {
      toast.error('Could not delete the bill', toApiError(err).message);
    }
  }

  async function onPrint() {
    setPrinting(true);
    try {
      // Fetched rather than linked: the endpoint is authenticated, so a bare
      // <a href> would land on a 401 instead of the bill.
      const blob = await api.downloadBillPdf(bill.id);
      const url = URL.createObjectURL(blob);
      const tab = window.open(url, '_blank');
      if (!tab) {
        // Popup blocked — fall back to a download so the bill still reaches them.
        const link = document.createElement('a');
        link.href = url;
        link.download = `bill-${bill.id}.pdf`;
        link.click();
      }
      // Long enough for the tab to have loaded it; the object stays alive in the
      // tab's own document either way.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      toast.error('Could not open the bill', toApiError(err).message);
    } finally {
      setPrinting(false);
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
      {/*
       * Printing is a first-class way to deliver a bill, not a fallback for when
       * email fails — plenty of flats have an owner to hand it to and no address
       * on file. Opened in a tab rather than downloaded so it goes straight to
       * the print dialog; the blob URL is revoked once the tab has it.
       */}
      {/*
       * Not on a draft. A draft has no reading and no amounts, so its sheet is a
       * statement for Rs 0.00 — the same reason drafts are left out of the
       * whole-month print. Handing that to a resident is worse than handing them
       * nothing.
       */}
      {bill.status !== 'draft' && (
        <Button variant="secondary" size="sm" loading={printing} disabled={printing} onClick={onPrint}>
          <Printer className="h-4 w-4" />
          Print
        </Button>
      )}

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
          bill.current_reading != null
            ? `This removes the bill for ${bill.billing_period_end} and puts the meter back to ${bill.previous_reading}, so you can read the flat again. If the bill was already sent, the resident keeps the old copy.`
            : 'This removes the draft so you can create it again for this flat. It can’t be undone.'
        }
        confirmLabel="Delete bill"
        loading={remove.isPending}
        onConfirm={onDelete}
      />
    </>
  );
}
