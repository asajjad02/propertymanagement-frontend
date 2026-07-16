'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apartmentTypeHooks } from '@/hooks/resources';
import { money } from '@/lib/format';
import { toApiError } from '@/lib/errors';

import { StepFooter } from '../step-footer';

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}

type Row = { name: string; amount: string };
const BLANK: Row = { name: '', amount: '' };

export function ApartmentTypesStep({ onNext, onBack, onSkip }: StepProps) {
  const qc = useQueryClient();
  const existing = apartmentTypeHooks.useList();
  const create = apartmentTypeHooks.useCreate();
  const [rows, setRows] = useState<Row[]>([{ name: 'Studio', amount: '' }, { name: '2-Bed', amount: '' }, { ...BLANK }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingTypes = useMemo(() => existing.data?.results ?? [], [existing.data]);

  const setRow = (i: number, k: keyof Row, v: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));

  async function save() {
    setError(null);
    const filled = rows.filter((r) => r.name.trim());
    if (filled.length === 0) return onNext();
    setBusy(true);
    try {
      for (const r of filled) {
        await create.mutateAsync({ name: r.name.trim(), maintenance_charge: r.amount || '0', status: 'active' });
      }
      await qc.invalidateQueries({ queryKey: ['apartment-types'] });
      onNext();
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {existingTypes.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-sm text-muted">Already added:</span>
          {existingTypes.map((t) => (
            <Badge key={t.id} tone="neutral">{t.name} · {money(t.maintenance_charge)}</Badge>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex gap-3 px-1">
          <span className="label-mono flex-1">Type name</span>
          <span className="label-mono w-40">Maintenance / mo</span>
          <span className="w-8" />
        </div>
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3">
            <Input value={r.name} onChange={(e) => setRow(i, 'name', e.target.value)} placeholder="e.g. Penthouse" className="flex-1" />
            <Input
              value={r.amount}
              onChange={(e) => setRow(i, 'amount', e.target.value)}
              type="number"
              inputMode="decimal"
              min="0"
              placeholder="0.00"
              className="w-40"
            />
            <button
              type="button"
              onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs))}
              className="flex h-8 w-8 items-center justify-center rounded-control text-faint hover:bg-raised hover:text-ink"
              aria-label="Remove row"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={() => setRows((rs) => [...rs, { ...BLANK }])}>
          <Plus className="h-4 w-4" />
          Add another type
        </Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <StepFooter onBack={onBack} onSkip={onSkip} onContinue={save} busy={busy} />
    </div>
  );
}
