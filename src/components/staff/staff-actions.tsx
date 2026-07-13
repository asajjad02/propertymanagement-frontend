'use client';

import { Pencil } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import type { StaffMember } from '@/types/api';

import { StaffFormDialog } from './staff-form-dialog';

/** Detail-header action for a staff member: Edit (write roles). */
export function StaffActions({ staff }: { staff: StaffMember }) {
  const { hasRole } = useAuth();
  const [editing, setEditing] = useState(false);
  if (!hasRole('admin', 'manager')) return null;
  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
        <Pencil className="h-4 w-4" />
        Edit
      </Button>
      <StaffFormDialog staff={staff} open={editing} onOpenChange={setEditing} />
    </>
  );
}
