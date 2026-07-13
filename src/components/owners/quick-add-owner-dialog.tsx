'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { ownerHooks, personHooks } from '@/hooks/resources';
import { toApiError } from '@/lib/errors';

/**
 * Minimal "create an owner" dialog for use inline from other screens (e.g. the
 * flat form). Creates a Person + Owner in one go and hands the new owner id back
 * to the caller so it can be selected immediately.
 */
export function QuickAddOwnerDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (ownerId: number, name: string) => void;
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

  function reset() {
    setName('');
    setPhone('');
    setCnic('');
    setError(null);
  }

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
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  return (
    <Modal
      open={open}
      onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}
      title="New owner"
      description="Create a person and register them as a flat owner."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Full name" required>
          {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} required />}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Phone">{(id) => <Input id={id} value={phone} onChange={(e) => setPhone(e.target.value)} />}</Field>
          <Field label="CNIC">{(id) => <Input id={id} value={cnic} onChange={(e) => setCnic(e.target.value)} />}</Field>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={pending || !name.trim()}>Add owner</Button>
        </div>
      </form>
    </Modal>
  );
}
