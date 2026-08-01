'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { AppBarAction } from '@/components/shell/page-chrome';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/providers/auth-provider';

import { OwnerQuickForm } from './owner-quick-form';

/**
 * "Add Owner" — admin/manager only.
 *
 * Uses the owner form, not the resident form. An owner is its own entity: they
 * hold a flat, and most of them never live in one. Routing this through the
 * resident dialog meant choosing a "resident role", being asked which flat to
 * move them into, and a toast reading "Resident added" — none of which is true
 * of an owner. Assigning them to a flat happens from the flat.
 */
export function AddOwnerButton() {
  const { hasRole } = useAuth();
  const [open, setOpen] = useState(false);

  if (!hasRole('admin', 'manager')) return null;

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Owner
      </Button>
      <AppBarAction icon={Plus} label="Add Owner" onClick={() => setOpen(true)} />
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Add owner"
        description="Owners hold flats. Assign them to one from the flat itself."
      >
        <OwnerQuickForm autoFocus onCreated={() => setOpen(false)} onCancel={() => setOpen(false)} />
      </Modal>
    </>
  );
}
