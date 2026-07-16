'use client';

import { Modal } from '@/components/ui/modal';
import type { ApartmentType } from '@/types/api';

import { ApartmentTypeForm } from './apartment-type-form';

/** Controlled add/edit dialog for an apartment type. Pass `type` to edit. */
export function ApartmentTypeFormDialog({
  type,
  open,
  onOpenChange,
}: {
  type?: ApartmentType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={type ? 'Edit apartment type' : 'Add apartment type'}
      description={
        type
          ? 'Update this type and its monthly maintenance charge.'
          : 'Define a flat category and the monthly maintenance charge for it.'
      }
    >
      <ApartmentTypeForm type={type} onDone={() => onOpenChange(false)} />
    </Modal>
  );
}
