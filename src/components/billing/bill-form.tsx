'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormActions } from '@/components/ui/form-actions';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useToast } from '@/components/ui/toast';
import { electricityBillHooks, meterHooks } from '@/hooks/resources';
import { useFlatsLookup } from '@/hooks/use-lookups';
import { billingPeriodFor } from '@/lib/billing-period';
import { toApiError } from '@/lib/errors';
import { numeric, shortDate } from '@/lib/format';

/**
 * Create a draft electricity bill. The reading and derived charges are set later
 * via the meter round (or "Enter reading" on the bill), which issues the bill.
 *
 * Asks for the flat and nothing else. Everything the payload needs beyond that
 * is already known:
 *   - the meter — one per flat, so choosing it was a question with one answer
 *   - the period — the calendar month (see lib/billing-period)
 *   - previous_reading — `meter.current_reading`, the running value the backend
 *     maintains every time a reading is entered
 *   - previous_outstanding — recomputed server-side on issue, so whatever is
 *     posted here is discarded
 *
 * The derived values are shown read-only rather than hidden: the form should
 * state what it's about to do, not quietly assume it.
 */
export function BillForm({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const flats = useFlatsLookup();
  const meters = meterHooks.useAll();
  const create = electricityBillHooks.useCreate();
  const [flat, setFlat] = useState('');
  const [error, setError] = useState<string | null>(null);

  const period = useMemo(() => billingPeriodFor(), []);

  // Occupied flats only — matching the meter round. A vacant flat has no
  // resident to bill.
  const flatOptions = useMemo(
    () =>
      (flats.data ?? [])
        .filter((f) => f.occupancy_status === 'occupied')
        .map((f) => ({ value: String(f.id), label: f.flat_number }))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })),
    [flats.data],
  );

  const meterForFlat = useMemo(
    () => (flat ? (meters.data ?? []).find((m) => m.flat === Number(flat)) : undefined),
    [meters.data, flat],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!meterForFlat) {
      setError('This flat has no meter yet. Add one before billing it.');
      return;
    }
    try {
      await create.mutateAsync({
        flat: Number(flat),
        meter: meterForFlat.id,
        billing_period_start: period.start,
        billing_period_end: period.end,
        previous_reading: meterForFlat.current_reading,
        // Recomputed server-side on issue; sent only to satisfy the payload.
        previous_outstanding: '0',
      });
      toast.success('Draft bill created', 'Enter the meter reading to issue it.');
      onDone();
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  const noMeter = !!flat && !meters.isPending && !meterForFlat;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Flat" required>
        {(id) => (
          <SearchableSelect
            id={id}
            value={flat || undefined}
            onValueChange={setFlat}
            options={flatOptions}
            placeholder="Select flat"
            searchPlaceholder="Search flats…"
            className="w-full"
          />
        )}
      </Field>

      {/* What this bill will be created with, once a flat is chosen. */}
      {flat && (
        <dl className="divide-y divide-hairline rounded-control border border-hairline px-3">
          <Row label="Period" value={`${shortDate(period.start)} → ${shortDate(period.end)}`} />
          <Row label="Meter" value={meterForFlat ? meterForFlat.meter_number : '—'} />
          <Row
            label="Previous reading"
            value={meterForFlat ? numeric(meterForFlat.current_reading) : '—'}
          />
        </dl>
      )}

      {noMeter && (
        <p className="text-sm text-danger">This flat has no meter yet. Add one before billing it.</p>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}

      <FormActions>
        <Button type="button" variant="secondary" onClick={onDone} className="hidden md:inline-flex">
          Cancel
        </Button>
        <Button type="submit" loading={create.isPending} disabled={!flat || noMeter}>
          Create draft
        </Button>
      </FormActions>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="label-mono shrink-0">{label}</dt>
      <dd className="min-w-0 truncate text-right text-sm text-ink tabular-nums">{value}</dd>
    </div>
  );
}
