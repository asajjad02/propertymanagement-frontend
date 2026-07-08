'use client';

import { LogOut, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Avatar } from '@/components/ui/avatar';
import { DropdownMenu } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/cn';
import { useAuth } from '@/providers/auth-provider';

/** Current user + role with a settings / sign-out menu. Collapses to just the avatar. */
export function UserCard({ collapsed }: { collapsed: boolean }) {
  const { user, role, logout } = useAuth();
  const router = useRouter();
  const name = user?.username ?? 'User';

  return (
    <DropdownMenu
      align="start"
      items={[
        { label: 'Settings', icon: <Settings className="h-4 w-4" />, onSelect: () => router.push('/settings') },
        { label: 'Sign out', icon: <LogOut className="h-4 w-4" />, onSelect: () => void logout() },
      ]}
      trigger={
        <button
          className={cn(
            'flex w-full items-center gap-2.5 rounded-control border border-hairline bg-surface p-2 text-left',
            'hover:bg-surface transition-colors',
            collapsed && 'justify-center border-0 bg-transparent p-0',
          )}
        >
          <Avatar name={name} size="sm" />
          <div className={cn('min-w-0 flex-1', collapsed && 'hidden')}>
            <p className="truncate text-sm font-medium text-ink">{name}</p>
            <p className="truncate text-xs capitalize text-muted">{role ?? '—'}</p>
          </div>
        </button>
      }
    />
  );
}
