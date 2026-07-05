'use client';

import { format } from 'date-fns';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useEnterBillReading } from '@/hooks/resources';
import { toApiError } from '@/lib/errors';

/** Enter the current meter reading → backend calculates and issues the bill. */
export function EnterReadingForm({ billId, onDone }: { billId: number; onDone: () => void }) {
  const enterReading = useEnterBillReading();
  const [reading, setReading] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await enterReading.mutateAsync({
        id: billId,
        payload: { current_reading: reading, reading_date: date, notes: notes || undefined },
      });
      onDone();
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Current reading" required>
          {(id) => <Input id={id} type="number" step="0.01" value={reading} onChange={(e) => setReading(e.target.value)} required />}
        </Field>
        <Field label="Reading date" required>
          {(id) => <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />}
        </Field>
      </div>
      <Field label="Notes" hint="Optional">
        {(id) => <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} />}
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={enterReading.isPending || !reading}>Enter reading & issue</Button>
      </div>
    </form>
  );
}
