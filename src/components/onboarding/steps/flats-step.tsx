'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { bulkCreateFlats } from '@/api/endpoints';
import { Field } from '@/components/ui/field';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apartmentTypeHooks } from '@/hooks/resources';
import { queryKeys } from '@/lib/query-keys';
import { toApiError } from '@/lib/errors';

import { StepFooter } from '../step-footer';

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}

export function FlatsStep({ onNext, onBack, onSkip }: StepProps) {
  const qc = useQueryClient();
  const types = apartmentTypeHooks.useList();
  const [apartmentType, setApartmentType] = useState('');
  const [numbersText, setNumbersText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeOptions = useMemo(
    () => (types.data?.results ?? []).filter((t) => t.status === 'active').map((t) => ({ value: String(t.id), label: t.name })),
    [types.data],
  );
  const flatNumbers = numbersText.split('\n').map((n) => n.trim()).filter(Boolean);

  async function save() {
    setError(null);
    if (flatNumbers.length === 0) return onNext();
    setBusy(true);
    try {
      await bulkCreateFlats({
        apartment_type: apartmentType ? Number(apartmentType) : null,
        occupancy_status: 'vacant',
        flat_numbers: flatNumbers,
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.resource('flats').all }),
        qc.invalidateQueries({ queryKey: ['flats'] }),
      ]);
      onNext();
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Apartment type" hint={typeOptions.length === 0 ? 'Add types in the previous step first' : 'The type these flats share'}>
        {(id) => (
          <Select id={id} value={apartmentType || undefined} onValueChange={setApartmentType} options={typeOptions} placeholder="Select type" className="w-full" />
        )}
      </Field>
      <Field label="Flat numbers" hint={`One per line${flatNumbers.length ? ` · ${flatNumbers.length} flats` : ''}`}>
        {(id) => (
          <Textarea id={id} value={numbersText} onChange={(e) => setNumbersText(e.target.value)} rows={7} placeholder={'A-101\nA-102\nA-103'} />
        )}
      </Field>
      <p className="text-sm text-muted">You can add more flats (and different types) anytime from the Flats screen.</p>

      {error && <p className="text-sm text-danger">{error}</p>}
      <StepFooter onBack={onBack} onSkip={onSkip} onContinue={save} busy={busy} />
    </div>
  );
}
