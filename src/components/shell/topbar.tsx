'use client';

import { Bell, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Tooltip } from '@/components/ui/tooltip';

import { Breadcrumb } from './breadcrumb';
import { CommandPalette } from './command-palette';

/** Sticky top chrome: breadcrumb, ⌘K search launcher, notification bell. */
export function Topbar() {
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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-hairline bg-paper/80 px-6 backdrop-blur">
      <Breadcrumb />
      <div className="flex items-center gap-2">
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2 rounded-control border border-hairline bg-surface px-2.5 py-1.5 text-sm text-muted hover:text-ink transition-colors"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden font-mono text-[0.6875rem] text-faint sm:inline">⌘K</kbd>
        </button>
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
