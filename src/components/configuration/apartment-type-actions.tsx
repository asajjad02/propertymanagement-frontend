'use client';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/toast';
import { apartmentTypeHooks } from '@/hooks/resources';
import { toApiError } from '@/lib/errors';
import type { ApartmentType } from '@/types/api';

import { ApartmentTypeFormDialog } from './apartment-type-form-dialog';

/** Row actions for an apartment type: Edit, Delete. */
export function ApartmentTypeActions({ type }: { type: ApartmentType }) {
  const toast = useToast();
  const remove = apartmentTypeHooks.useDelete();
  const [editing, setEditing] = useState(false);

  function onDelete() {
    if (!confirm(`Delete apartment type “${type.name}”? Flats using it will keep their record but lose the type.`)) return;
    remove.mutate(type.id, {
      onSuccess: () => toast.success('Apartment type deleted'),
      onError: (e) => toast.error('Could not delete', toApiError(e).message),
    });
  }

  return (
    <>
      <DropdownMenu
        trigger={
          <button
            aria-label="Actions"
            className="rounded-control p-1.5 text-muted hover:bg-raised hover:text-ink"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        }
        items={[
          { label: 'Edit', icon: <Pencil className="h-4 w-4" />, onSelect: () => setEditing(true) },
          { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: onDelete },
        ]}
      />
      <ApartmentTypeFormDialog type={type} open={editing} onOpenChange={setEditing} />
    </>
  );
}
