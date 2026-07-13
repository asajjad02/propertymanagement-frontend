'use client';

import { MoreHorizontal, UserMinus, UserRoundCog } from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownMenu, type MenuItem } from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/toast';
import { teamHooks } from '@/hooks/resources';
import { useAuth } from '@/providers/auth-provider';
import type { Role } from '@/types/api';
import type { TeamMember } from '@/types/team';

import { ROLE_OPTIONS } from './add-team-member-button';

/** Row actions for a teammate: change role, deactivate / reactivate. */
export function TeamActions({ member }: { member: TeamMember }) {
  const toast = useToast();
  const { user } = useAuth();
  const patch = teamHooks.usePatch();
  const [confirmOff, setConfirmOff] = useState(false);

  const isSelf = user?.username === member.username;

  function setRole(role: Role) {
    patch.mutate(
      { id: member.id, payload: { role } },
      { onSuccess: () => toast.success('Role updated', `${member.username} is now ${role}.`) },
    );
  }

  const items: MenuItem[] = [];
  if (!isSelf) {
    for (const opt of ROLE_OPTIONS) {
      if (opt.value !== member.role) {
        items.push({
          label: `Make ${opt.label.toLowerCase()}`,
          icon: <UserRoundCog className="h-4 w-4" />,
          onSelect: () => setRole(opt.value),
        });
      }
    }
    items.push({
      label: member.is_active ? 'Deactivate' : 'Reactivate',
      icon: <UserMinus className="h-4 w-4" />,
      danger: member.is_active,
      onSelect: () =>
        member.is_active
          ? setConfirmOff(true)
          : patch.mutate(
              { id: member.id, payload: { is_active: true } },
              { onSuccess: () => toast.success('Teammate reactivated', member.username) },
            ),
    });
  }

  if (isSelf) {
    return <span className="text-xs text-faint">You</span>;
  }

  return (
    <>
      <DropdownMenu
        trigger={
          <button aria-label="Team member actions" className="rounded-control p-1 text-muted hover:bg-raised hover:text-ink">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        }
        items={items}
      />
      <ConfirmDialog
        open={confirmOff}
        onOpenChange={setConfirmOff}
        title={`Deactivate ${member.username}?`}
        description="They will lose access until reactivated. Their history is kept."
        confirmLabel="Deactivate"
        danger
        loading={patch.isPending}
        onConfirm={() =>
          patch.mutate(
            { id: member.id, payload: { is_active: false } },
            {
              onSuccess: () => {
                toast.success('Teammate deactivated', member.username);
                setConfirmOff(false);
              },
            },
          )
        }
      />
    </>
  );
}
