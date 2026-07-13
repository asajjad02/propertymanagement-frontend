'use client';

import { Bell, Menu, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Tooltip } from '@/components/ui/tooltip';

import { Breadcrumb } from './breadcrumb';
import { CommandPalette } from './command-palette';
import { ThemeToggle } from './theme-toggle';

/** Sticky top chrome: hamburger (mobile), breadcrumb, ⌘K search, notification bell. */
export function Topbar({ onOpenMenu }: { onOpenMenu?: () => void }) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-hairline bg-paper/80 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          onClick={onOpenMenu}
          aria-label="Open menu"
          className="rounded-control p-1.5 text-muted transition-colors hover:bg-raised hover:text-ink lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Breadcrumb />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2 rounded-control border border-hairline bg-surface px-2.5 py-1.5 text-sm text-muted hover:text-ink hover:border-muted/40 transition-colors"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden font-mono text-[0.6875rem] text-faint sm:inline">⌘K</kbd>
        </button>
        <ThemeToggle />
        {/* Notifications backend endpoint is not available yet — bell is inert. */}
        <Tooltip content="No notifications" side="bottom">
          <button
            aria-label="Notifications"
            className="rounded-control border border-hairline bg-surface p-1.5 text-muted"
          >
            <Bell className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
