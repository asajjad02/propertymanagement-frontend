'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormActions } from '@/components/ui/form-actions';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { ownerHooks, personHooks } from '@/hooks/resources';
import { toApiError } from '@/lib/errors';

/**
 * The three fields needed to stand up an owner (Person + Owner in one go).
 *
 * Deliberately not wrapped in a dialog: it's rendered as a pushed sub-view
 * inside whichever sheet needs it, so creating an owner mid-flow never stacks a
 * second modal on top of the first. Hands the new owner's id back so the caller
 * can select it immediately.
 */
export function OwnerQuickForm({
  onCreated,
  onCancel,
  submitLabel = 'Add owner',
}: {
  onCreated: (ownerId: number, name: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const toast = useToast();
  const qc = useQueryClient();
  const createPerson = personHooks.useCreate();
  const createOwner = ownerHooks.useCreate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [error, setError] = useState<string | null>(null);

  const pending = createPerson.isPending || createOwner.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const person = await createPerson.mutateAsync({
        full_name: name.trim(), cnic, phone, email: '', permanent_address: '',
        emergency_contact_name: '', emergency_contact_number: '',
      });
      const owner = await createOwner.mutateAsync({ person: person.id, owner_type: 'primary', status: 'active' });
      // Refresh the reference lookups so the new owner appears in selects.
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['owners'] }),
        qc.invalidateQueries({ queryKey: ['people'] }),
      ]);
      toast.success('Owner added', `${person.full_name} is now an owner.`);
      onCreated(owner.id, person.full_name);
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Full name" required>
        {(id) => (
          <Input
            id={id}
            value={name}
            onChange={(e) => setName(e.target.value)}
            // A person's name: capitalise words and let the browser autofill it.
            autoCapitalize="words"
            autoComplete="name"
            autoFocus
            required
          />
        )}
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Phone">
          {(id) => (
            <Input
              id={id}
              // type=tel gives the phone keypad and a tappable number on the
              // saved record; inputMode keeps it a keypad on Android too.
              type="tel"
              inputMode="tel"
              autoComplete="off"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          )}
        </Field>
        <Field label="CNIC">
          {(id) => (
            // CNIC is digits with dashes — a numeric keypad, not a full keyboard.
            <Input id={id} inputMode="numeric" value={cnic} onChange={(e) => setCnic(e.target.value)} />
          )}
        </Field>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <FormActions>
        {onCancel && (
          // Mobile dismisses with the header's back chevron; the button is for
          // the desktop dialog, where there's no chevron to reach for.
          <Button type="button" variant="secondary" onClick={onCancel} className="hidden md:inline-flex">
            Cancel
          </Button>
        )}
        <Button type="submit" loading={pending} disabled={pending || !name.trim()}>
          {submitLabel}
        </Button>
      </FormActions>
    </form>
  );
}
