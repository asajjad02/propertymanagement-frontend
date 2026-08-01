'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormActions } from '@/components/ui/form-actions';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Segmented } from '@/components/ui/segmented';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { occupantHooks, ownerHooks, personHooks } from '@/hooks/resources';
import { useFlatsLookup } from '@/hooks/use-lookups';
import { toApiError } from '@/lib/errors';
import type { Person, PersonInput } from '@/types/api';

const EMPTY: PersonInput = {
  full_name: '', cnic: '', phone: '', email: '', permanent_address: '',
  emergency_contact_name: '', emergency_contact_number: '',
};

type Role = 'owner' | 'tenant' | 'both';
const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'both', label: 'Both' },
];

const TODAY = new Date().toISOString().slice(0, 10);

/**
 * Create/edit a person (resident). Pass `person` to edit (person fields only).
 * When creating, also captures the resident's role — an Owner and/or an active
 * Occupant record is created alongside the person so their type is tracked.
 */
export function PersonForm({
  person,
  onDone,
  initialRole = 'tenant',
}: {
  person?: Person;
  onDone: () => void;
  initialRole?: Role;
}) {
  const toast = useToast();
  const flats = useFlatsLookup();
  const createPerson = personHooks.useCreate();
  const updatePerson = personHooks.useUpdate();
  const createOwner = ownerHooks.useCreate();
  const createOccupant = occupantHooks.useCreate();

  const [form, setForm] = useState<PersonInput>(person ? { ...person } : EMPTY);
  const [role, setRole] = useState<Role>(initialRole);
  const [flatId, setFlatId] = useState('');
  const [moveIn, setMoveIn] = useState(TODAY);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!person;
  const needsFlat = !isEdit && (role === 'tenant' || role === 'both');

  const flatOptions = useMemo(
    () =>
      [...(flats.data ?? [])]
        .sort((a, b) => a.flat_number.localeCompare(b.flat_number, undefined, { numeric: true }))
        .map((f) => ({ value: String(f.id), label: `Flat ${f.flat_number}` })),
    [flats.data],
  );

  const set = (key: keyof PersonInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const pending = createPerson.isPending || updatePerson.isPending || createOwner.isPending || createOccupant.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (isEdit) {
        await updatePerson.mutateAsync({ id: person.id, payload: form });
        toast.success('Resident updated', `${form.full_name} saved.`);
        onDone();
        return;
      }

      if (needsFlat && !flatId) {
        setError('Choose the flat this resident lives in.');
        return;
      }

      const created = await createPerson.mutateAsync(form);
      if (role === 'owner' || role === 'both') {
        await createOwner.mutateAsync({ person: created.id, owner_type: 'primary', status: 'active' });
      }
      if (role === 'tenant' || role === 'both') {
        await createOccupant.mutateAsync({
          person: created.id,
          flat: Number(flatId),
          occupancy_type: 'tenant',
          move_in_date: moveIn || null,
          move_out_date: null,
          status: 'active',
        });
      }
      toast.success('Resident added', `${form.full_name} saved as ${role === 'both' ? 'owner + tenant' : role}.`);
      onDone();
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Full name" required>
        {(id) => <Input autoCapitalize="words" id={id} value={form.full_name} onChange={set('full_name')} required />}
      </Field>

      {!isEdit && (
        <>
          <Field label="Role" hint="How this person relates to the property">
            {() => (
              <Segmented
                options={ROLE_OPTIONS}
                value={role}
                onValueChange={(v) => setRole(v as Role)}
              />
            )}
          </Field>
          {needsFlat && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Flat" required>
                {(id) => (
                  <SearchableSelect
                    id={id}
                    value={flatId || undefined}
                    onValueChange={setFlatId}
                    options={flatOptions}
                    placeholder="Select flat"
                    className="w-full"
                  />
                )}
              </Field>
              <Field label="Move-in date">
                {(id) => <Input id={id} type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} />}
              </Field>
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Field label="CNIC">{(id) => <Input inputMode="numeric" id={id} value={form.cnic} onChange={set('cnic')} />}</Field>
        <Field label="Phone">{(id) => <Input type="tel" inputMode="tel" autoComplete="off" id={id} value={form.phone} onChange={set('phone')} />}</Field>
      </div>
      <Field label="Email">
        {(id) => <Input id={id} type="email" value={form.email} onChange={set('email')} />}
      </Field>
      <Field label="Permanent address">
        {(id) => <Textarea id={id} value={form.permanent_address} onChange={set('permanent_address')} />}
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Emergency contact">
          {(id) => <Input autoCapitalize="words" id={id} value={form.emergency_contact_name} onChange={set('emergency_contact_name')} />}
        </Field>
        <Field label="Emergency number">
          {(id) => <Input type="tel" inputMode="tel" autoComplete="off" id={id} value={form.emergency_contact_number} onChange={set('emergency_contact_number')} />}
        </Field>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <FormActions>
        <Button type="button" variant="secondary" onClick={onDone} className="hidden md:inline-flex">Cancel</Button>
        <Button type="submit" loading={pending} disabled={pending || !form.full_name}>
          {isEdit ? 'Save changes' : 'Add resident'}
        </Button>
      </FormActions>
    </form>
  );
}
