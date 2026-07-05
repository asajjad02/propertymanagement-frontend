'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { CornerDownLeft, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { cn } from '@/lib/cn';
import { useAuth } from '@/providers/auth-provider';

import { navGroupsForRole } from './nav-config';

/** ⌘K / Ctrl-K command palette that jumps to a navigation destination. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const { role } = useAuth();
  const [query, setQuery] = useState('');

  const items = useMemo(
    () => navGroupsForRole(role).flatMap((g) => g.items),
    [role],
  );
  const results = items.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()));

  // Reset the query whenever the palette closes (no effect needed).
  function handleOpenChange(next: boolean) {
    if (!next) setQuery('');
    onOpenChange(next);
  }

  function go(href: string) {
    handleOpenChange(false);
    router.push(href);
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[1px]" />
        <Dialog.Content className="fixed left-1/2 top-24 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 rounded-card border border-hairline bg-surface shadow-xl focus:outline-none">
          <VisuallyHidden><Dialog.Title>Search</Dialog.Title></VisuallyHidden>
          <div className="flex items-center gap-2 border-b border-hairline px-4">
            <Search className="h-4 w-4 text-faint" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Jump to…"
              className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
            />
          </div>
          <ul className="max-h-72 overflow-y-auto p-1.5">
            {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-muted">No matches</li>}
            {results.map((item) => (
              <li key={item.href}>
                <button
                  onClick={() => go(item.href)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-left text-sm text-ink',
                    'hover:bg-paper',
                  )}
                >
                  <item.icon className="h-4 w-4 text-muted" />
                  {item.label}
                  <CornerDownLeft className="ml-auto h-3.5 w-3.5 text-faint opacity-0 group-hover:opacity-100" />
                </button>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
