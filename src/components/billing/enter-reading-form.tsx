'use client';

import { format } from 'date-fns';
import { useState } from 'react';

import { MeterPhotoField } from '@/components/billing/meter-photo-field';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormActions } from '@/components/ui/form-actions';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { useEnterBillReading } from '@/hooks/resources';
import { toApiError } from '@/lib/errors';

/** Enter the current meter reading → backend calculates and issues the bill. */
export function EnterReadingForm({ billId, onDone }: { billId: number; onDone: () => void }) {
  const toast = useToast();
  const enterReading = useEnterBillReading();
  const [reading, setReading] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!photo) {
      setError('A photo of the meter is required to issue the bill.');
      return;
    }
    try {
      await enterReading.mutateAsync({
        id: billId,
        payload: { current_reading: reading, reading_date: date, notes: notes || undefined, photo },
      });
      toast.success('Reading recorded', 'Bill issued.');
      onDone();
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Current reading" required>
          {(id) => <Input inputMode="decimal" id={id} type="number" step="0.01" value={reading} onChange={(e) => setReading(e.target.value)} required />}
        </Field>
        <Field label="Reading date" required>
          {(id) => <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} required />}
        </Field>
      </div>
      {/*
       * Required, not optional: the reading issues the bill, and a bill that
       * can't be evidenced can't be defended if a resident disputes it. It ships
       * in the same request as the reading, so the two commit together.
       *
       * Goes through MeterPhotoField rather than a bare file input. A plain input
       * with `capture="environment"` sends a phone straight to the camera with no
       * way to reach an existing photo, and hands over whatever the library holds
       * — HEIC on an iPhone, which the API rejects.
       */}
      <Field label="Meter photo" required hint="The evidence behind the reading">
        {() => <MeterPhotoField value={photo} onChange={setPhoto} />}
      </Field>
      <Field label="Notes" hint="Optional">
        {(id) => <Textarea id={id} value={notes} onChange={(e) => setNotes(e.target.value)} />}
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}
      <FormActions>
        <Button type="button" variant="secondary" onClick={onDone} className="hidden md:inline-flex">Cancel</Button>
        <Button type="submit" loading={enterReading.isPending} disabled={enterReading.isPending || !reading || !photo}>Enter reading &amp; issue</Button>
      </FormActions>
    </form>
  );
}
