'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';

import { FlatFormDialog } from './flat-form-dialog';

/** "Add Flat" action — visible only to roles that can write flats. */
export function AddFlatButton() {
  const { hasRole } = useAuth();
  const [open, setOpen] = useState(false);

  if (!hasRole('admin', 'manager')) return null;

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Flat
      </Button>
      <FlatFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
