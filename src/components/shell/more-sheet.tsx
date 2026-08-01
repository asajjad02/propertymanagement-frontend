'use client';

import { LogOut, Moon, Search, Settings, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Avatar } from '@/components/ui/avatar';
import { Sheet } from '@/components/ui/sheet';
import { cn } from '@/lib/cn';
import { useAuth } from '@/providers/auth-provider';

import { navGroupsForRole, type NavItemDef } from './nav-config';
import { openGlobalSearch } from './search-bus';
import { useThemeToggle } from './theme-toggle';

const rowClass =
  'flex w-full items-center gap-3 rounded-control px-2 py-3.5 text-left text-base ' +
  'touch-manipulation transition-colors active:bg-raised';

/**
 * Everything the bottom bar couldn't fit, plus the account controls that live
 * in the desktop sidebar footer and topbar (theme, settings, sign out) and
 * therefore have nowhere else to go on a phone.
 */
export function MoreSheet({
  open,
  onOpenChange,
  overflow,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overflow: NavItemDef[];
}) {
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const { isDark, toggle } = useThemeToggle();

  // Re-group the flat overflow list under its original section headings, so
  // "Configuration" still reads as Administration rather than a loose link.
  const overflowHrefs = new Set(overflow.map((i) => i.href));
  const groups = navGroupsForRole(role)
    .map((group) => ({ ...group, items: group.items.filter((i) => overflowHrefs.has(i.href)) }))
    .filter((group) => group.items.length > 0);

  const name = user?.username ?? 'User';

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="More">
      <div className="space-y-5 pb-2">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="label-mono px-2 pb-1">{group.label}</p>
            <ul>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(rowClass, active ? 'font-medium text-primary-text' : 'text-ink')}
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.soon && (
                        <span className="rounded-pill bg-neutral-soft px-1.5 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wide text-faint">
                          Soon
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div>
          <p className="label-mono px-2 pb-1">Account</p>
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name={name} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{name}</p>
              <p className="truncate text-xs capitalize text-muted">{role ?? '—'}</p>
            </div>
          </div>
          <ul>
            {/* The app bar has no search button, so this is global search's
                only mobile entry point. */}
            <li>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  openGlobalSearch();
                }}
                className={cn(rowClass, 'text-ink')}
              >
                <Search className="h-5 w-5 shrink-0" aria-hidden />
                Search everything
              </button>
            </li>
            <li>
              <Link href="/settings" className={cn(rowClass, 'text-ink')}>
                <Settings className="h-5 w-5 shrink-0" aria-hidden />
                Settings
              </Link>
            </li>
            <li>
              <button type="button" onClick={toggle} className={cn(rowClass, 'text-ink')}>
                {isDark ? (
                  <Sun className="h-5 w-5 shrink-0" aria-hidden />
                ) : (
                  <Moon className="h-5 w-5 shrink-0" aria-hidden />
                )}
                {isDark ? 'Light mode' : 'Dark mode'}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => void logout()}
                className={cn(rowClass, 'text-danger')}
              >
                <LogOut className="h-5 w-5 shrink-0" aria-hidden />
                Sign out
              </button>
            </li>
          </ul>
        </div>
      </div>
    </Sheet>
  );
}
