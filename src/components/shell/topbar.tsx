'use client';

import { Bell, ChevronLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AtriumMark } from '@/components/brand/atrium-logo';
import { Tooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';

import { Breadcrumb } from './breadcrumb';
import { CommandPalette } from './command-palette';
import { usePageChrome, type PageAction } from './page-chrome';
import { onOpenGlobalSearch } from './search-bus';
import { ThemeToggle } from './theme-toggle';

/**
 * Sticky top chrome — two different components sharing a row.
 *
 * **Mobile** is a standard app bar: brand mark (or a back chevron on a detail
 * screen) on the left, the screen title centred, this screen's actions on the
 * right. The title lives here rather than in the page body, which buys back a
 * whole row, and the actions are always in the same place on every screen
 * instead of moving with the layout. Contents come from `PageChrome`.
 *
 * There is deliberately no global-search button here: per-list search sits in
 * each list's toolbar, and the ⌘K palette is reachable from the More sheet.
 *
 * **Desktop** is unchanged — breadcrumb, search, theme, notifications.
 */
export function Topbar() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { title, backHref, actions } = usePageChrome();

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

  // The More sheet's Search row reaches the palette through this.
  useEffect(() => onOpenGlobalSearch(() => setPaletteOpen(true)), []);

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-paper/90 px-safe pt-safe backdrop-blur">
      {/* ---- Mobile app bar --------------------------------------------- */}
      <div className="grid h-14 grid-cols-[3rem_1fr_auto] items-center gap-1 pr-2 lg:hidden">
        <div className="flex items-center justify-start">
          {backHref ? (
            <Link
              href={backHref}
              aria-label="Back"
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-control text-ink-secondary',
                'touch-manipulation transition-colors active:bg-raised',
              )}
            >
              <ChevronLeft className="h-6 w-6" />
            </Link>
          ) : (
            <span className="pl-4">
              <AtriumMark size={26} />
            </span>
          )}
        </div>

        {/* Centred by the grid's 1fr column, so the title stays put whether or
            not there are actions — the thing that makes a bar read as an app
            bar rather than a toolbar. */}
        <h1 className="truncate text-center text-base font-semibold text-ink">{title ?? ''}</h1>

        <div className="flex items-center justify-end gap-0.5">
          {actions.map((action) => (
            <AppBarAction key={action.label} action={action} />
          ))}
        </div>
      </div>

      {/* ---- Desktop ------------------------------------------------------ */}
      <div className="hidden h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:flex">
        <Breadcrumb />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaletteOpen(true)}
            className="flex h-9.5 items-center gap-2 rounded-control border border-hairline bg-surface px-2.5 text-sm text-muted transition-colors hover:border-muted/40 hover:text-ink"
          >
            <Search className="h-4 w-4" />
            <span>Search</span>
            <kbd className="font-mono text-[0.6875rem] text-faint">⌘K</kbd>
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
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}

/** Icon-only bar action. Renders as a link when the action is a navigation. */
function AppBarAction({ action }: { action: PageAction }) {
  const Icon = action.icon;
  const className = cn(
    'flex h-11 w-11 items-center justify-center rounded-control text-ink-secondary',
    'touch-manipulation transition-colors active:bg-raised',
  );

  if (action.href) {
    return (
      <Link href={action.href} aria-label={action.label} className={className}>
        <Icon className="h-5 w-5" />
      </Link>
    );
  }
  return (
    <button type="button" onClick={action.onClick} aria-label={action.label} className={className}>
      <Icon className="h-5 w-5" />
    </button>
  );
}
