'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/cn';

import type { NavGroupDef } from './nav-config';
import { NavItem } from './nav-item';

const STORAGE_PREFIX = 'hr.nav.collapsed:';

export function NavGroup({ group, collapsed }: { group: NavGroupDef; collapsed: boolean }) {
  // Per-group open/closed state, persisted across sessions. Starts open to
  // match SSR, then reconciles with localStorage after mount to avoid mismatch.
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_PREFIX + group.label);
    if (stored === '1') setOpen(false);
  }, [group.label]);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_PREFIX + group.label, next ? '0' : '1');
      return next;
    });
  }

  // When the whole sidebar is icon-only, groups are always shown flat (no headers).
  if (collapsed) {
    return (
      <div>
        <p className="sr-only">{group.label}</p>
        <div className="space-y-0.5">
          {group.items.map((item) => (
            <NavItem key={item.href} item={item} collapsed={collapsed} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="group flex w-full items-center gap-1.5 rounded-control px-3 pb-1.5 pt-0.5 text-left transition-colors hover:text-ink"
      >
        <span className="label-mono flex-1">{group.label}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-faint transition-transform duration-200 group-hover:text-muted',
            !open && '-rotate-90',
          )}
        />
      </button>
      <div className={cn('space-y-0.5', !open && 'hidden')}>
        {group.items.map((item) => (
          <NavItem key={item.href} item={item} collapsed={collapsed} />
        ))}
      </div>
    </div>
  );
}
