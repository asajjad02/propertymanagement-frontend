'use client';

import { useState } from 'react';

import { Sheet } from '@/components/ui/sheet';
import type { Flat } from '@/types/api';

import { FlatForm } from './flat-form';

/**
 * Controlled add/edit drawer for a flat.
 *
 * Owns the "New owner" step so the whole thing stays in one drawer: the header
 * swaps to a back chevron and the owner's title, the flat form hides (keeping
 * everything already typed), and finishing drops back with the new owner
 * selected. This previously opened a second dialog on top of the first, which
 * on a phone meant two stacked sheets and a lost place in the flow.
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
  const [creatingOwner, setCreatingOwner] = useState(false);

  function setOpen(next: boolean) {
    // Always reopen on the flat step, never mid-flow in the owner sub-view.
    if (!next) setCreatingOwner(false);
    onOpenChange(next);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      title={creatingOwner ? 'New owner' : flat ? 'Edit flat' : 'Add flat'}
      description={
        creatingOwner
          ? 'They’ll be selected as this flat’s owner.'
          : flat
            ? 'Update this unit’s details.'
            : 'Create a new unit in your property.'
      }
      onBack={creatingOwner ? () => setCreatingOwner(false) : undefined}
    >
      <FlatForm
        flat={flat}
        onDone={() => setOpen(false)}
        creatingOwner={creatingOwner}
        onCreatingOwnerChange={setCreatingOwner}
      />
    </Sheet>
  );
}
