'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Building2, CornerDownLeft, Search, Users, ReceiptText, MessageSquare, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { globalSearch } from '@/api/endpoints';
import { cn } from '@/lib/cn';
import { useAuth } from '@/providers/auth-provider';
import type { SearchResult, SearchResultType } from '@/types/api';

import { navGroupsForRole } from './nav-config';

const TYPE_META: Record<SearchResultType, { icon: typeof Building2; href: (id: number) => string; label: string }> = {
  flat: { icon: Building2, href: (id) => `/flats/${id}`, label: 'Flat' },
  resident: { icon: Users, href: (id) => `/residents/${id}`, label: 'Resident' },
  bill: { icon: ReceiptText, href: (id) => `/billing/${id}`, label: 'Bill' },
  complaint: { icon: MessageSquare, href: () => `/complaints`, label: 'Complaint' },
  visitor: { icon: UserCheck, href: () => `/visitors`, label: 'Visitor' },
};

/** ⌘K / Ctrl-K palette: jump to a nav destination, or search records to jump to. */
export function CommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const { role } = useAuth();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const navItems = useMemo(() => navGroupsForRole(role).flatMap((g) => g.items), [role]);
  const navMatches = query
    ? navItems.filter((i) => i.label.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : navItems.slice(0, 6);

  const { data: records = [], isFetching } = useQuery({
    queryKey: ['global-search', debounced],
    queryFn: () => globalSearch(debounced),
    enabled: open && debounced.length >= 2,
    staleTime: 10_000,
    placeholderData: keepPreviousData,
  });

  function handleOpenChange(next: boolean) {
    if (!next) setQuery('');
    onOpenChange(next);
  }
  function go(href: string) {
    handleOpenChange(false);
    router.push(href);
  }

  const showRecords = debounced.length >= 2;

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-24 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 rounded-card border border-hairline bg-surface shadow-pop focus:outline-none">
          <VisuallyHidden><Dialog.Title>Search</Dialog.Title></VisuallyHidden>
          <div className="flex items-center gap-2 border-b border-hairline px-4">
            <Search className="h-4 w-4 text-faint" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search flats, residents, bills… or jump to a page"
              className="h-11 w-full bg-transparent text-sm text-ink placeholder:text-faint focus:outline-none"
            />
          </div>

          <div className="max-h-80 overflow-y-auto p-1.5">
            {/* Record results */}
            {showRecords && (
              <>
                <p className="label-mono px-2.5 pb-1 pt-2">
                  Records {isFetching && <span className="text-faint">· searching…</span>}
                </p>
                {records.length === 0 && !isFetching && (
                  <p className="px-3 py-3 text-sm text-muted">No records match “{debounced}”.</p>
                )}
                {records.map((r: SearchResult) => {
                  const meta = TYPE_META[r.type];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={`${r.type}-${r.id}`}
                      onClick={() => go(meta.href(r.id))}
                      className="flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-left hover:bg-raised"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink">{r.title}</span>
                        <span className="block truncate text-xs text-muted">{r.subtitle}</span>
                      </span>
                      <span className="label-mono shrink-0">{meta.label}</span>
                    </button>
                  );
                })}
              </>
            )}

            {/* Navigation */}
            {navMatches.length > 0 && (
              <>
                <p className="label-mono px-2.5 pb-1 pt-2">Go to</p>
                {navMatches.map((item) => (
                  <button
                    key={item.href}
                    onClick={() => go(item.href)}
                    className="flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-left text-sm text-ink hover:bg-raised"
                  >
                    <item.icon className="h-4 w-4 text-muted" />
                    {item.label}
                    <CornerDownLeft className="ml-auto h-3.5 w-3.5 text-faint opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </>
            )}

            {!showRecords && navMatches.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted">No matches</p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
