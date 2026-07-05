'use client';

import { useState } from 'react';

import { PersonSummaryCard } from '@/components/people/person-summary-card';
import { Button } from '@/components/ui/button';
import { TypeTag } from '@/components/ui/type-tag';
import { useAuth } from '@/providers/auth-provider';
import type { Person } from '@/types/api';

import { AssignOwnerDialog } from './assign-owner-dialog';

/** Owner slot with assign/change action (write roles only). */
export function FlatOwnerCard({ flatId, owner }: { flatId: number; owner: Person | null }) {
  const { hasRole } = useAuth();
  const [open, setOpen] = useState(false);
  const canWrite = hasRole('admin', 'manager');

  return (
    <>
      <PersonSummaryCard
        title="Owner"
        person={owner}
        badge={<TypeTag type="owner" />}
        action={canWrite && (
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>Change</Button>
        )}
        emptyTitle="No owner assigned"
        emptyDescription={canWrite ? 'Assign the person who owns this flat.' : undefined}
        emptyAction={canWrite && <Button size="sm" onClick={() => setOpen(true)}>Assign owner</Button>}
      />
      {canWrite && <AssignOwnerDialog flatId={flatId} open={open} onOpenChange={setOpen} />}
    </>
  );
}
