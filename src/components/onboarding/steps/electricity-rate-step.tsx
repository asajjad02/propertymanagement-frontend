'use client';

import { useState } from 'react';

import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { electricityRateHooks } from '@/hooks/resources';
import { toApiError } from '@/lib/errors';

import { StepFooter } from '../step-footer';

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}

const TODAY = new Date().toISOString().slice(0, 10);

export function ElectricityRateStep({ onNext, onBack, onSkip }: StepProps) {
  const create = electricityRateHooks.useCreate();
  const [rate, setRate] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState(TODAY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (!rate) return onNext();
    setBusy(true);
    try {
      await create.mutateAsync({ rate, effective_from: effectiveFrom });
      onNext();
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Rate per unit" hint="Applied to metered electricity">
          {(id) => (
            <Input id={id} value={rate} onChange={(e) => setRate(e.target.value)} type="number" inputMode="decimal" min="0" step="0.01" placeholder="0.00" />
          )}
        </Field>
        <Field label="Effective from">
          {(id) => <Input id={id} type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />}
        </Field>
      </div>
      <p className="text-sm text-muted">
        Rates are effective-dated — you can add new ones later without changing historical bills.
        You can set this now or skip and add it from Configuration.
      </p>

      {error && <p className="text-sm text-danger">{error}</p>}
      <StepFooter onBack={onBack} onSkip={onSkip} onContinue={save} busy={busy} />
    </div>
  );
}
