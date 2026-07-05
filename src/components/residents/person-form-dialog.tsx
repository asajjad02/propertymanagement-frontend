'use client';

import { Modal } from '@/components/ui/modal';
import type { Person } from '@/types/api';

import { PersonForm } from './person-form';

/** Controlled add/edit dialog wrapping PersonForm. Pass `person` to edit. */
export function PersonFormDialog({
  person,
  open,
  onOpenChange,
}: {
  person?: Person;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={person ? 'Edit resident' : 'Add resident'}
      description={person ? 'Update this person’s details.' : 'Create a new resident profile.'}
    >
      <PersonForm person={person} onDone={() => onOpenChange(false)} />
    </Modal>
  );
}
