'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/providers/auth-provider';

import { BillForm } from './bill-form';

/** "New Bill" action — visible to roles that can write billing. */
export function NewBillButton() {
  const { hasRole } = useAuth();
  const [open, setOpen] = useState(false);

  if (!hasRole('admin', 'manager', 'accountant')) return null;

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New Bill
      </Button>
      <Modal open={open} onOpenChange={setOpen} title="New electricity bill" description="Create a draft, then enter the meter reading to issue it.">
        <BillForm onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
