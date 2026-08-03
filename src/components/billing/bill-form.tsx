'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormActions } from '@/components/ui/form-actions';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useToast } from '@/components/ui/toast';
import { electricityBillHooks } from '@/hooks/resources';
import { useFlatsLookup } from '@/hooks/use-lookups';
import { billingPeriodFor } from '@/lib/billing-period';
import { toApiError } from '@/lib/errors';
import { numeric, shortDate } from '@/lib/format';
import { queryKeys } from '@/lib/query-keys';

/**
 * Create a draft electricity bill. The reading and derived charges are set later
 * via the meter round (or "Enter reading" on the bill), which issues the bill.
 *
 * Asks for the flat and nothing else. Everything else is derived server-side:
 * the meter (one per flat), the period (the calendar month), the previous
 * reading (the flat's running value), and previous_outstanding (recomputed on
 * issue). The derived values are shown read-only so the form states what it's
 * about to do rather than quietly assuming it.
 */
export function BillForm({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const qc = useQueryClient();
  const flats = useFlatsLookup();
  const create = electricityBillHooks.useCreate();
  const [flat, setFlat] = useState('');
  const [error, setError] = useState<string | null>(null);

  const period = useMemo(() => billingPeriodFor(), []);

  // Every flat, matching the round: a vacant flat still owes its maintenance,
  // and its meter still has to be read to show it consumed nothing.
  const flatOptions = useMemo(
    () =>
      (flats.data ?? [])
        .map((f) => ({ value: String(f.id), label: f.flat_number }))
        .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })),
    [flats.data],
  );

  const selectedFlat = useMemo(
    () => (flat ? (flats.data ?? []).find((f) => f.id === Number(flat)) : undefined),
    [flats.data, flat],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({
        flat: Number(flat),
        billing_period_start: period.start,
        billing_period_end: period.end,
      });
      // A new draft changes the round's stops (meter round + Overview).
      qc.invalidateQueries({ queryKey: queryKeys.billing.rounds });
      toast.success('Draft bill created', 'Enter the meter reading to issue it.');
      onDone();
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

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
          <Row
            label="Previous reading"
            value={selectedFlat?.current_reading != null ? numeric(selectedFlat.current_reading) : '—'}
          />
        </dl>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <FormActions>
        <Button type="button" variant="secondary" onClick={onDone} className="hidden md:inline-flex">
          Cancel
        </Button>
        <Button type="submit" loading={create.isPending} disabled={!flat}>
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
