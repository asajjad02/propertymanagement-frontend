'use client';

import { LogOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { visitorHooks } from '@/hooks/resources';
import { useAuth } from '@/providers/auth-provider';

/** Quick "Check out" action: stamps exit_time to now. Write roles only. */
export function CheckoutButton({ visitorId }: { visitorId: number }) {
  const { hasRole } = useAuth();
  const patch = visitorHooks.usePatch();

  if (!hasRole('admin', 'manager', 'security')) return null;

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={patch.isPending}
      onClick={(e) => {
        e.stopPropagation();
        patch.mutate({ id: visitorId, payload: { exit_time: new Date().toISOString() } });
      }}
    >
      {patch.isPending ? <Spinner /> : <LogOut className="h-3.5 w-3.5" />}
      Check out
    </Button>
  );
}
