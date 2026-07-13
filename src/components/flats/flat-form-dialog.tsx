'use client';

import { Modal } from '@/components/ui/modal';
import type { Flat } from '@/types/api';

import { FlatForm } from './flat-form';

/** Controlled add/edit dialog wrapping FlatForm. Pass `flat` to edit. */
export function FlatFormDialog({
  flat,
  open,
  onOpenChange,
}: {
  flat?: Flat;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={flat ? 'Edit flat' : 'Add flat'}
      description={flat ? 'Update this unit’s details.' : 'Create a new unit in your property.'}
    >
      <FlatForm flat={flat} onDone={() => onOpenChange(false)} />
    </Modal>
  );
}
