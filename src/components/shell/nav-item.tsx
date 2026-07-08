'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/cn';
import { Tooltip } from '@/components/ui/tooltip';

import type { NavItemDef } from './nav-config';

/** Active when the current path equals or is nested under the item's href. */
function useIsActive(href: string): boolean {
  const pathname = usePathname();
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavItem({ item, collapsed }: { item: NavItemDef; collapsed: boolean }) {
  const active = useIsActive(item.href);
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-control px-3 py-2 text-sm transition-colors',
        collapsed && 'justify-center px-0',
        active
          ? 'bg-primary-soft text-primary-text font-medium'
          : 'text-ink-secondary hover:bg-surface hover:text-ink',
      )}
    >
      <Icon className="h-4.5 w-4.5 shrink-0" />
      <span className={cn('flex-1', collapsed && 'hidden')}>{item.label}</span>
      {item.soon && !collapsed && (
        <span className="rounded-pill bg-neutral-soft px-1.5 py-0.5 font-mono text-[0.5625rem] uppercase tracking-wide text-faint">
          Soon
        </span>
      )}
    </Link>
  );

  return collapsed ? <Tooltip content={item.label}>{link}</Tooltip> : link;
}
