'use client';

import { Modal } from '@/components/ui/modal';
import type { StaffMember } from '@/types/api';

import { StaffForm } from './staff-form';

/** Controlled add/edit dialog wrapping StaffForm. Pass `staff` to edit. */
export function StaffFormDialog({
  staff,
  open,
  onOpenChange,
}: {
  staff?: StaffMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={staff ? 'Edit staff member' : 'Add staff member'}
      description={staff ? 'Update this employee’s details.' : 'Add an employee to the payroll.'}
    >
      <StaffForm staff={staff} onDone={() => onOpenChange(false)} />
    </Modal>
  );
}
