'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/providers/auth-provider';

import { VisitorForm } from './visitor-form';

/** "Log Visitor" action — visible to roles that can write visitors. */
export function LogVisitorButton() {
  const { hasRole } = useAuth();
  const [open, setOpen] = useState(false);

  if (!hasRole('admin', 'manager', 'security')) return null;

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Log Visitor
      </Button>
      <Modal open={open} onOpenChange={setOpen} title="Log visitor" description="Record a new gate entry.">
        <VisitorForm onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
