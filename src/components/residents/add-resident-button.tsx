'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { AppBarAction } from '@/components/shell/page-chrome';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';

import { PersonFormDialog } from './person-form-dialog';

/** "Add Resident" action — visible only to roles that can write residents. */
export function AddResidentButton() {
  const { hasRole } = useAuth();
  const [open, setOpen] = useState(false);

  if (!hasRole('admin', 'manager')) return null;

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Resident
      </Button>
      <AppBarAction icon={Plus} label="Add Resident" onClick={() => setOpen(true)} />
      <PersonFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
