'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/providers/auth-provider';

import { ComplaintForm } from './complaint-form';

/** "Log Complaint" action — visible to roles that can write complaints. */
export function AddComplaintButton() {
  const { hasRole } = useAuth();
  const [open, setOpen] = useState(false);

  if (!hasRole('admin', 'manager')) return null;

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Log Complaint
      </Button>
      <Modal open={open} onOpenChange={setOpen} title="Log complaint" description="Record a new complaint for a flat.">
        <ComplaintForm onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
