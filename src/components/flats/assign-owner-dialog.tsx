'use client';

import { useState } from 'react';

import { PersonSelect } from '@/components/people/person-select';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormActions } from '@/components/ui/form-actions';
import { Modal } from '@/components/ui/modal';
import { useAssignOwner } from '@/hooks/use-flat-assignments';
import { toApiError } from '@/lib/errors';

/** Assign or change a flat's owner by picking a person. */
export function AssignOwnerDialog({
  flatId,
  open,
  onOpenChange,
}: {
  flatId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const assign = useAssignOwner();
  const [person, setPerson] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await assign.mutateAsync({ flatId, personId: Number(person) });
      onOpenChange(false);
      setPerson('');
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Assign owner" description="Choose the person who owns this flat.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Owner">
          {(id) => <PersonSelect id={id} value={person || undefined} onValueChange={setPerson} />}
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <FormActions>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} className="hidden md:inline-flex">Cancel</Button>
          <Button type="submit" loading={assign.isPending} disabled={assign.isPending || !person}>Assign owner</Button>
        </FormActions>
      </form>
    </Modal>
  );
}
