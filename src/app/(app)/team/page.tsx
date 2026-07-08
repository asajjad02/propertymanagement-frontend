'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Info } from 'lucide-react';
import { useMemo } from 'react';

import { AddTeamMemberButton } from '@/components/team/add-team-member-button';
import { TeamActions } from '@/components/team/team-actions';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { teamHooks } from '@/hooks/resources';
import type { Tone } from '@/components/ui/tones';
import type { Role } from '@/types/api';
import type { TeamMember } from '@/types/team';

const ROLE_TONE: Record<Role, Tone> = {
  admin: 'indigo',
  manager: 'blue',
  accountant: 'green',
  security: 'neutral',
};
const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  accountant: 'Accountant',
  security: 'Security',
};

export default function TeamPage() {
  const { data, isPending } = teamHooks.useList();
  const members = useMemo(() => data?.results ?? [], [data]);

  const columns = useMemo<ColumnDef<TeamMember, unknown>[]>(
    () => [
      {
        id: 'username',
        header: 'Member',
        accessorFn: (m) => m.username,
        cell: (c) => (
          <span className="flex items-center gap-2.5">
            <Avatar name={c.row.original.username} size="sm" />
            <span className="font-medium text-ink">{c.getValue<string>()}</span>
          </span>
        ),
      },
      { id: 'email', header: 'Email', accessorFn: (m) => m.email },
      {
        id: 'role',
        header: 'Role',
        accessorFn: (m) => m.role,
        cell: (c) => {
          const role = c.getValue<Role>();
          return <Badge tone={ROLE_TONE[role]}>{ROLE_LABEL[role]}</Badge>;
        },
      },
      {
        id: 'status',
        header: 'Status',
        accessorFn: (m) => (m.is_active ? 'active' : 'inactive'),
        cell: (c) => <StatusBadge status={c.getValue<string>()} />,
      },
      {
        id: 'actions',
        header: '',
        cell: (c) => <TeamActions member={c.row.original} />,
        meta: { align: 'right' },
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        subtitle="People who can log in to this account, and what they can do."
        actions={<AddTeamMemberButton />}
      />

      <div className="flex items-start gap-2.5 rounded-card border border-hairline bg-raised px-4 py-3 text-sm text-ink-secondary">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
        <p>
          New teammates set their own password: they visit the sign-in page, choose{' '}
          <span className="font-medium text-ink">Forgot password</span>, and enter the email you
          registered. Roles decide what each person can see and do.
        </p>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={members}
          isLoading={isPending}
          ariaLabel="Team members"
          emptyTitle="No teammates yet"
          emptyDescription="Add your manager, accountant, or guard to get them working in the system."
        />
      </Card>
    </div>
  );
}
