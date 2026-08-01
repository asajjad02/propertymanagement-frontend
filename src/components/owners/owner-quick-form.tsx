'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { ownerHooks, personHooks } from '@/hooks/resources';
import { cn } from '@/lib/cn';
import { toApiError } from '@/lib/errors';

/**
 * The fields needed to stand up an owner.
 *
 * An owner is its own entity — a Person plus an Owner record — and creating one
 * says nothing about anybody living anywhere. Most owners never become
 * residents, so this deliberately doesn't ask for a flat, a tenancy or a
 * resident role the way the resident form does.
 *
 * Renders a `<div>`, not a `<form>`: it's used inline inside the flat form, and
 * nesting one form in another is invalid HTML. Enter submits from any field.
 */
export function OwnerQuickForm({
  onCreated,
  onCancel,
  submitLabel = 'Add owner',
  autoFocus = false,
  className,
}: {
  onCreated: (ownerId: number, name: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
  autoFocus?: boolean;
  className?: string;
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
  const canSubmit = !!name.trim() && !pending;

  async function submit() {
    if (!canSubmit) return;
    setError(null);
    try {
      const person = await createPerson.mutateAsync({
        full_name: name.trim(), cnic, phone, email: '', permanent_address: '',
        emergency_contact_name: '', emergency_contact_number: '',
      });
      const owner = await createOwner.mutateAsync({
        person: person.id, owner_type: 'primary', status: 'active',
      });
      // Refresh the reference lookups so the new owner appears in selects.
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['owners'] }),
        qc.invalidateQueries({ queryKey: ['people'] }),
      ]);
      toast.success('Owner added', `${person.full_name} is now an owner.`);
      onCreated(owner.id, person.full_name);
      setName('');
      setPhone('');
      setCnic('');
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  // No <form> to press Enter against, so wire it up by hand.
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      void submit();
    }
  }

  return (
    <div className={cn('space-y-3', className)} onKeyDown={onKeyDown}>
      <Field label="Full name" required>
        {(id) => (
          <Input
            id={id}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoCapitalize="words"
            autoComplete="name"
            autoFocus={autoFocus}
          />
        )}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Phone">
          {(id) => (
            <Input
              id={id}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          )}
        </Field>
        <Field label="CNIC">
          {(id) => (
            <Input id={id} inputMode="numeric" value={cnic} onChange={(e) => setCnic(e.target.value)} />
          )}
        </Field>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-2 *:flex-1 sm:justify-end sm:*:flex-none">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="button" onClick={() => void submit()} loading={pending} disabled={!name.trim()}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
