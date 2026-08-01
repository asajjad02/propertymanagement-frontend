'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { AppBarAction } from '@/components/shell/page-chrome';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';

import { StaffFormDialog } from './staff-form-dialog';

/** "Add staff member" — visible only to roles that can write staff. */
export function AddStaffButton() {
  const { hasRole } = useAuth();
  const [open, setOpen] = useState(false);
  if (!hasRole('admin', 'manager')) return null;
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add staff
      </Button>
      <AppBarAction icon={Plus} label="Add staff" onClick={() => setOpen(true)} />
      <StaffFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
