'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { AppBarAction } from '@/components/shell/page-chrome';
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
      <AppBarAction icon={Plus} label="New Bill" onClick={() => setOpen(true)} />
      <Modal open={open} onOpenChange={setOpen} title="New monthly bill" description="Pick the flat. The reading is entered on the meter round, which issues the bill.">
        <BillForm onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
