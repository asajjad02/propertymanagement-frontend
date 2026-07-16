'use client';

import { Modal } from '@/components/ui/modal';
import type { Person } from '@/types/api';

import { PersonForm } from './person-form';

/** Controlled add/edit dialog wrapping PersonForm. Pass `person` to edit. */
export function PersonFormDialog({
  person,
  open,
  onOpenChange,
  initialRole,
  title,
  description,
}: {
  person?: Person;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialRole?: 'owner' | 'tenant' | 'both';
  title?: string;
  description?: string;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title ?? (person ? 'Edit resident' : 'Add resident')}
      description={description ?? (person ? 'Update this person’s details.' : 'Create a new resident profile.')}
    >
      <PersonForm person={person} onDone={() => onOpenChange(false)} initialRole={initialRole} />
    </Modal>
  );
}
