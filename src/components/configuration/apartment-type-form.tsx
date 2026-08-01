'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormActions } from '@/components/ui/form-actions';
import { Input } from '@/components/ui/input';
import { Segmented } from '@/components/ui/segmented';
import { useToast } from '@/components/ui/toast';
import { apartmentTypeHooks } from '@/hooks/resources';
import { toApiError } from '@/lib/errors';
import type { ApartmentType, ApartmentTypeInput } from '@/types/api';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

/** Create/edit an apartment type and its monthly maintenance charge. */
export function ApartmentTypeForm({ type, onDone }: { type?: ApartmentType; onDone: () => void }) {
  const toast = useToast();
  const create = apartmentTypeHooks.useCreate();
  const update = apartmentTypeHooks.useUpdate();

  const [name, setName] = useState(type?.name ?? '');
  const [amount, setAmount] = useState(type?.maintenance_charge ?? '');
  const [status, setStatus] = useState<ApartmentTypeInput['status']>(type?.status ?? 'active');
  const [error, setError] = useState<string | null>(null);

  const pending = create.isPending || update.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload: ApartmentTypeInput = {
      name: name.trim(),
      maintenance_charge: amount || '0',
      status,
    };
    try {
      if (type) await update.mutateAsync({ id: type.id, payload });
      else await create.mutateAsync(payload);
      toast.success(type ? 'Apartment type updated' : 'Apartment type added', `${payload.name} saved.`);
      onDone();
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Name" required>
        {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 2-Bed" required />}
      </Field>
      <Field label="Maintenance charge" hint="Per month, applied to this type's flats">
        {(id) => (
          <Input
            id={id}
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        )}
      </Field>
      <Field label="Status">
        {() => <Segmented options={STATUS_OPTIONS} value={status} onValueChange={(v) => setStatus(v as ApartmentTypeInput['status'])} />}
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}
      <FormActions>
        <Button type="button" variant="secondary" onClick={onDone} className="hidden md:inline-flex">Cancel</Button>
        <Button type="submit" loading={pending} disabled={pending || !name.trim()}>
          {type ? 'Save changes' : 'Add type'}
        </Button>
      </FormActions>
    </form>
  );
}
