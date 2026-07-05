'use client';

import { useState } from 'react';

import { PersonSummaryCard } from '@/components/people/person-summary-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TypeTag } from '@/components/ui/type-tag';
import { useEndTenancy } from '@/hooks/use-flat-assignments';
import { useAuth } from '@/providers/auth-provider';
import type { Person } from '@/types/api';

import { AssignResidentDialog } from './assign-resident-dialog';

/**
 * Resident slot. Shows the active tenant, or the owner by default
 * (owner-occupied) when there is no tenant. Write roles can assign/end.
 */
export function FlatResidentCard({
  flatId,
  resident,
  residentIsOwner,
  activeOccupantId,
}: {
  flatId: number;
  resident: Person | null;
  residentIsOwner: boolean;
  activeOccupantId: number | null;
}) {
  const { hasRole } = useAuth();
  const endTenancy = useEndTenancy();
  const [open, setOpen] = useState(false);
  const canWrite = hasRole('admin', 'manager');

  const badge = residentIsOwner ? <Badge tone="indigo">Owner-occupied</Badge> : <TypeTag type="tenant" />;

  // With a real tenant: allow ending the tenancy. Owner-occupied: allow adding one.
  const action = canWrite && (
    activeOccupantId != null ? (
      <Button
        variant="secondary"
        size="sm"
        disabled={endTenancy.isPending}
        onClick={() => endTenancy.mutate({ occupantId: activeOccupantId, flatId })}
      >
        End tenancy
      </Button>
    ) : (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>Assign tenant</Button>
    )
  );

  return (
    <>
      <PersonSummaryCard
        title="Resident"
        person={resident}
        badge={badge}
        action={action}
        emptyTitle="Vacant"
        emptyDescription={canWrite ? 'No owner or tenant on this flat yet.' : undefined}
        emptyAction={canWrite && <Button size="sm" onClick={() => setOpen(true)}>Assign resident</Button>}
      />
      {canWrite && <AssignResidentDialog flatId={flatId} open={open} onOpenChange={setOpen} />}
    </>
  );
}
