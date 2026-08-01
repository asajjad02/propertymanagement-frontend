'use client';

import { Sheet } from '@/components/ui/sheet';
import type { Flat } from '@/types/api';

import { FlatForm } from './flat-form';

/**
 * Controlled add/edit drawer for a flat.
 *
 * Creating an owner mid-flow happens inline in the form, under the owner
 * picker — not as a pushed step here. Three fields don't warrant hiding the
 * flat you're halfway through describing.
 */
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
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={flat ? 'Edit flat' : 'Add flat'}
      description={flat ? 'Update this unit’s details.' : 'Create a new unit in your property.'}
    >
      <FlatForm flat={flat} onDone={() => onOpenChange(false)} />
    </Sheet>
  );
}
