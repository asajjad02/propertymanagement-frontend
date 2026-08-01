'use client';

import { format } from 'date-fns';
import { useState } from 'react';

import { PersonSelect } from '@/components/people/person-select';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormActions } from '@/components/ui/form-actions';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useAssignResident } from '@/hooks/use-flat-assignments';
import { toApiError } from '@/lib/errors';

/** Assign an active tenant to a flat. Without one, the owner is the resident. */
export function AssignResidentDialog({
  flatId,
  open,
  onOpenChange,
}: {
  flatId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const assign = useAssignResident();
  const [person, setPerson] = useState('');
  const [moveIn, setMoveIn] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await assign.mutateAsync({ flatId, personId: Number(person), moveInDate: moveIn });
      onOpenChange(false);
      setPerson('');
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Assign resident" description="Record the tenant living in this flat.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Resident">
          {(id) => <PersonSelect id={id} value={person || undefined} onValueChange={setPerson} />}
        </Field>
        <Field label="Move-in date">
          {(id) => <Input id={id} type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} />}
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <FormActions>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} className="hidden md:inline-flex">Cancel</Button>
          <Button type="submit" loading={assign.isPending} disabled={assign.isPending || !person}>Assign resident</Button>
        </FormActions>
      </form>
    </Modal>
  );
}
