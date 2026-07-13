'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

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
      <StaffFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
