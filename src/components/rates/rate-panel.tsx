'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { LoadingBlock } from '@/components/ui/spinner';
import { money, shortDate } from '@/lib/format';

export interface RateRow {
  id: number;
  value: string;
  effective_from: string;
}

/**
 * One effective-dated rate (electricity unit rate or monthly maintenance).
 * Shows the current rate, a history, and a form to add a new effective-dated
 * rate — historical bills keep the rate that was in effect for their period.
 */
export function RatePanel({
  title,
  unitLabel,
  valueLabel,
  rates,
  isLoading,
  adding,
  onAdd,
  disabled,
}: {
  title: string;
  /** e.g. "per unit" or "per month". */
  unitLabel: string;
  /** Label for the amount input, e.g. "Rate per unit". */
  valueLabel: string;
  rates: RateRow[];
  isLoading: boolean;
  adding: boolean;
  onAdd: (value: string, effectiveFrom: string) => void;
  disabled?: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [value, setValue] = useState('');
  const [date, setDate] = useState(today);

  const current = rates[0];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value) return;
    onAdd(value, date);
    setValue('');
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-5">
        {isLoading ? (
          <LoadingBlock />
        ) : (
          <>
            <div>
              <p className="label-mono">Current rate</p>
              {current ? (
                <p className="mt-1 flex items-baseline gap-1.5">
                  <span className="display text-[1.9rem] text-ink tabular-nums">{money(current.value)}</span>
                  <span className="text-xs text-muted">{unitLabel}</span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted">No rate set for this building yet.</p>
              )}
              {current && (
                <p className="mt-0.5 text-xs text-muted">In effect since {shortDate(current.effective_from)}</p>
              )}
            </div>

            {!disabled && (
              <form onSubmit={submit} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 border-t border-hairline pt-4">
                <Field label={valueLabel}>
                  {(id) => (
                    <Input id={id} type="number" step="0.01" min="0" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.00" />
                  )}
                </Field>
                <Field label="Effective from">
                  {(id) => <Input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
                </Field>
                <Button type="submit" disabled={adding || !value}>Add rate</Button>
              </form>
            )}

            {rates.length > 1 && (
              <div className="border-t border-hairline pt-4">
                <p className="label-mono mb-2">History</p>
                <ul className="divide-y divide-hairline text-sm">
                  {rates.slice(1).map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-1.5">
                      <span className="tabular-nums text-ink">{money(r.value)}</span>
                      <span className="text-xs text-muted">from {shortDate(r.effective_from)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
