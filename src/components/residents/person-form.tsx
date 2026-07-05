'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { personHooks } from '@/hooks/resources';
import { toApiError } from '@/lib/errors';
import type { Person, PersonInput } from '@/types/api';

const EMPTY: PersonInput = {
  full_name: '', cnic: '', phone: '', email: '', permanent_address: '',
  emergency_contact_name: '', emergency_contact_number: '',
};

/** Create/edit a person (resident). Pass `person` to edit. */
export function PersonForm({ person, onDone }: { person?: Person; onDone: () => void }) {
  const create = personHooks.useCreate();
  const update = personHooks.useUpdate();
  const [form, setForm] = useState<PersonInput>(person ? { ...person } : EMPTY);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof PersonInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const pending = create.isPending || update.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (person) await update.mutateAsync({ id: person.id, payload: form });
      else await create.mutateAsync(form);
      onDone();
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Full name" required>
        {(id) => <Input id={id} value={form.full_name} onChange={set('full_name')} required />}
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="CNIC">{(id) => <Input id={id} value={form.cnic} onChange={set('cnic')} />}</Field>
        <Field label="Phone">{(id) => <Input id={id} value={form.phone} onChange={set('phone')} />}</Field>
      </div>
      <Field label="Email">
        {(id) => <Input id={id} type="email" value={form.email} onChange={set('email')} />}
      </Field>
      <Field label="Permanent address">
        {(id) => <Textarea id={id} value={form.permanent_address} onChange={set('permanent_address')} />}
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Emergency contact">
          {(id) => <Input id={id} value={form.emergency_contact_name} onChange={set('emergency_contact_name')} />}
        </Field>
        <Field label="Emergency number">
          {(id) => <Input id={id} value={form.emergency_contact_number} onChange={set('emergency_contact_number')} />}
        </Field>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={pending || !form.full_name}>
          {person ? 'Save changes' : 'Add resident'}
        </Button>
      </div>
    </form>
  );
}
