'use client';

import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

import { cn } from '@/lib/cn';
import { useAuth } from '@/providers/auth-provider';

import { Brand } from './brand';
import { navGroupsForRole } from './nav-config';
import { NavGroup } from './nav-group';
import { UserCard } from './user-card';

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { role } = useAuth();
  const groups = navGroupsForRole(role);

  return (
    <aside
      className={cn(
        'flex h-dvh flex-col border-r border-hairline bg-raised transition-[width] duration-200',
        collapsed ? 'w-[74px]' : 'w-60',
      )}
    >
      <div className={cn('flex items-center gap-2 px-4 py-4', collapsed ? 'justify-center' : 'justify-between')}>
        <Brand collapsed={collapsed} />
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn('rounded-control p-1 text-muted hover:bg-surface hover:text-ink', collapsed && 'hidden')}
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      {collapsed && (
        <button
          onClick={onToggle}
          aria-label="Expand sidebar"
          className="mx-auto mb-2 rounded-control p-1 text-muted hover:bg-surface hover:text-ink"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
        {groups.map((group) => (
          <NavGroup key={group.label} group={group} collapsed={collapsed} />
        ))}
      </nav>

      <div className="border-t border-hairline p-3">
        <UserCard collapsed={collapsed} />
      </div>
    </aside>
  );
}
