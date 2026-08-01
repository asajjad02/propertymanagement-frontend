'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { AppBarAction } from '@/components/shell/page-chrome';
import { PersonFormDialog } from '@/components/residents/person-form-dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';

/** "Add Owner" action — creates a person marked as an owner. Admin/manager only. */
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
      <PersonFormDialog
        open={open}
        onOpenChange={setOpen}
        initialRole="owner"
        title="Add owner"
        description="Create a person and register them as a flat owner."
      />
    </>
  );
}
