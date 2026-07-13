'use client';

import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { securityDepositHooks } from '@/hooks/resources';
import { money, shortDate } from '@/lib/format';
import { toApiError } from '@/lib/errors';
import type { Tone } from '@/components/ui/tones';
import type { DepositStatus } from '@/types/api';

const STATUS_TONE: Record<DepositStatus, Tone> = { held: 'blue', settled: 'neutral', refunded: 'green' };
const TODAY = new Date().toISOString().slice(0, 10);

/** Security-deposit tracking for the flat's current tenancy: record, then settle. */
export function DepositCard({ flatId, occupantId }: { flatId: number; occupantId: number | null }) {
  const toast = useToast();
  const list = securityDepositHooks.useList({ filters: { flat: flatId }, ordering: '-created_at' });
  const create = securityDepositHooks.useCreate();
  const patch = securityDepositHooks.usePatch();

  const deposit = list.data?.results?.[0] ?? null;
  const [recordOpen, setRecordOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [heldDate, setHeldDate] = useState(TODAY);
  const [deductions, setDeductions] = useState('0');
  const [settleNotes, setSettleNotes] = useState('');

  function record(e: React.FormEvent) {
    e.preventDefault();
    create.mutate(
      { flat: flatId, occupant: occupantId, amount, held_date: heldDate, status: 'held' },
      {
        onSuccess: () => { toast.success('Deposit recorded'); setRecordOpen(false); setAmount(''); },
        onError: (err) => toast.error('Could not record deposit', toApiError(err).message),
      },
    );
  }

  function settle() {
    if (!deposit) return;
    patch.mutate(
      { id: deposit.id, payload: { status: 'settled', deductions, settled_date: TODAY, notes: settleNotes } },
      {
        onSuccess: () => { toast.success('Deposit settled'); setSettleOpen(false); },
        onError: (err) => toast.error('Could not settle', toApiError(err).message),
      },
    );
  }

  const refundable = deposit ? (Number(deposit.amount) - Number(deposit.deductions || 0)).toFixed(2) : '0';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security deposit</CardTitle>
        {!deposit && <Button size="sm" onClick={() => setRecordOpen(true)}>Record</Button>}
      </CardHeader>
      <CardBody className="space-y-3">
        {!deposit ? (
          <p className="text-sm text-muted">No deposit on file for this flat.</p>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <span className="display text-[1.6rem] text-ink tabular-nums">{money(deposit.amount)}</span>
              <Badge tone={STATUS_TONE[deposit.status]} dot>
                {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
              </Badge>
            </div>
            {deposit.held_date && <p className="text-xs text-muted">Held since {shortDate(deposit.held_date)}</p>}
            {deposit.status !== 'held' && (
              <div className="border-t border-hairline pt-2 text-sm">
                <p className="flex justify-between"><span className="text-muted">Deductions</span><span className="tabular-nums text-ink">{money(deposit.deductions)}</span></p>
                <p className="flex justify-between"><span className="text-muted">Refunded</span><span className="tabular-nums text-ink">{money(refundable)}</span></p>
                {deposit.notes && <p className="mt-1 text-xs text-muted">{deposit.notes}</p>}
              </div>
            )}
            {deposit.status === 'held' && (
              <Button variant="secondary" size="sm" className="w-full" onClick={() => setSettleOpen(true)}>Settle deposit</Button>
            )}
          </>
        )}
      </CardBody>

      <Modal open={recordOpen} onOpenChange={setRecordOpen} title="Record security deposit">
        <form onSubmit={record} className="space-y-4">
          <Field label="Amount" required>{(id) => <Input id={id} type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />}</Field>
          <Field label="Held date">{(id) => <Input id={id} type="date" value={heldDate} onChange={(e) => setHeldDate(e.target.value)} />}</Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setRecordOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending || !amount}>Record deposit</Button>
          </div>
        </form>
      </Modal>

      <Modal open={settleOpen} onOpenChange={setSettleOpen} title="Settle deposit" description="Record deductions and settle the deposit at move-out.">
        <div className="space-y-4">
          <Field label="Deductions" hint="Damages, unpaid dues, etc.">{(id) => <Input id={id} type="number" step="0.01" value={deductions} onChange={(e) => setDeductions(e.target.value)} />}</Field>
          <Field label="Notes">{(id) => <Textarea id={id} value={settleNotes} onChange={(e) => setSettleNotes(e.target.value)} rows={2} />}</Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => setSettleOpen(false)}>Cancel</Button>
            <Button variant="danger" disabled={patch.isPending} onClick={settle}>Settle</Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
