'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { electricityBillHooks, meterHooks } from '@/hooks/resources';
import { useFlatsLookup } from '@/hooks/use-lookups';
import { toApiError } from '@/lib/errors';

/**
 * Create a draft electricity bill. The reading and derived charges are set later
 * via "Enter reading" on the bill detail, which issues the bill.
 */
export function BillForm({ onDone }: { onDone: () => void }) {
  const flats = useFlatsLookup();
  const create = electricityBillHooks.useCreate();
  const [flat, setFlat] = useState('');
  const [meter, setMeter] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [prevReading, setPrevReading] = useState('0');
  const [prevOutstanding, setPrevOutstanding] = useState('0');
  const [error, setError] = useState<string | null>(null);

  // Meters are scoped to the chosen flat.
  const meters = meterHooks.useList({ filters: { flat: flat ? Number(flat) : undefined } }, { enabled: !!flat });

  const flatOptions = useMemo(
    () => (flats.data ?? []).map((f) => ({ value: String(f.id), label: f.flat_number })),
    [flats.data],
  );
  const meterOptions = useMemo(
    () => (meters.data?.results ?? []).map((m) => ({ value: String(m.id), label: m.meter_number })),
    [meters.data],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({
        flat: Number(flat),
        meter: Number(meter),
        billing_period_start: start,
        billing_period_end: end,
        previous_reading: prevReading,
        previous_outstanding: prevOutstanding,
      });
      onDone();
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Flat" required>
          {(id) => (
            <Select id={id} value={flat || undefined} onValueChange={(v) => { setFlat(v); setMeter(''); }}
              options={flatOptions} placeholder="Select flat" className="w-full" />
          )}
        </Field>
        <Field label="Meter" required>
          {(id) => (
            <Select id={id} value={meter || undefined} onValueChange={setMeter} disabled={!flat}
              options={meterOptions} placeholder={flat ? 'Select meter' : 'Pick a flat first'} className="w-full" />
          )}
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Period start" required>
          {(id) => <Input id={id} type="date" value={start} onChange={(e) => setStart(e.target.value)} required />}
        </Field>
        <Field label="Period end" required>
          {(id) => <Input id={id} type="date" value={end} onChange={(e) => setEnd(e.target.value)} required />}
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Previous reading">
          {(id) => <Input id={id} type="number" step="0.01" value={prevReading} onChange={(e) => setPrevReading(e.target.value)} />}
        </Field>
        <Field label="Previous outstanding" hint="Carried-over dues">
          {(id) => <Input id={id} type="number" step="0.01" value={prevOutstanding} onChange={(e) => setPrevOutstanding(e.target.value)} />}
        </Field>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={create.isPending || !flat || !meter || !start || !end}>
          Create draft
        </Button>
      </div>
    </form>
  );
}
