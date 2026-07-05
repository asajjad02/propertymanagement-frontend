'use client';

import { format } from 'date-fns';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { paymentHooks } from '@/hooks/resources';
import { toApiError } from '@/lib/errors';

const METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank', label: 'Bank transfer' },
  { value: 'online', label: 'Online' },
  { value: 'cheque', label: 'Cheque' },
];

/** Record a payment against an electricity bill (apply_payment runs server-side). */
export function RecordPaymentForm({
  billId,
  defaultAmount,
  onDone,
}: {
  billId: number;
  defaultAmount: string;
  onDone: () => void;
}) {
  const create = paymentHooks.useCreate();
  const [amount, setAmount] = useState(defaultAmount);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [method, setMethod] = useState('cash');
  const [reference, setReference] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({
        electricity_bill: billId,
        maintenance_charge: null,
        payment_date: date,
        amount,
        payment_method: method,
        reference_number: reference,
        status: 'completed',
      });
      onDone();
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Amount" required>
          {(id) => <Input id={id} type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />}
        </Field>
        <Field label="Payment date" required>
          {(id) => <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />}
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Method">
          {(id) => <Select id={id} value={method} onValueChange={setMethod} options={METHODS} className="w-full" />}
        </Field>
        <Field label="Reference #" hint="Optional">
          {(id) => <Input id={id} value={reference} onChange={(e) => setReference(e.target.value)} />}
        </Field>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={create.isPending || !amount}>Record payment</Button>
      </div>
    </form>
  );
}
