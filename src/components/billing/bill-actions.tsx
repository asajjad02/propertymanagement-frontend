'use client';

import { CheckCheck, Download, FileInput, Wallet } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Tooltip } from '@/components/ui/tooltip';
import { useMarkElectricityBillPaid } from '@/hooks/resources';
import { useAuth } from '@/providers/auth-provider';
import type { ElectricityBill } from '@/types/api';

import { EnterReadingForm } from './enter-reading-form';
import { RecordPaymentForm } from './record-payment-form';

/** Bill header actions, gated by status and role. PDF is deferred (disabled). */
export function BillActions({ bill }: { bill: ElectricityBill }) {
  const { hasRole } = useAuth();
  const markPaid = useMarkElectricityBillPaid();
  const [reading, setReading] = useState(false);
  const [payment, setPayment] = useState(false);

  const canWrite = hasRole('admin', 'manager', 'accountant');

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
          <Button variant="secondary" size="sm" disabled={markPaid.isPending} onClick={() => markPaid.mutate(bill.id)}>
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
    </>
  );
}
