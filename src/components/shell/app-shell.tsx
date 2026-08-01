'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { usePersistedFlag } from '@/hooks/use-persisted-flag';

import { BottomNav } from './bottom-nav';
import { ImpersonationBanner } from './impersonation-banner';
import { usePageChrome } from './page-chrome';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

/**
 * App chrome.
 *
 * Below `lg` the primary navigation is a fixed bottom tab bar (`BottomNav`) —
 * thumb-reachable, always visible, no hamburger round-trip — and content takes
 * the full width. At `lg` and up it's the sticky sidebar (collapsible to a
 * rail) plus topbar.
 *
 * `lg` rather than `md` is the switch point so tablets keep the bottom bar
 * instead of losing 240px of width to a sidebar.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = usePersistedFlag('hr.sidebarCollapsed');
  // Detail screens hide the bottom nav, so they mustn't reserve room for it.
  const { backHref } = usePageChrome();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex">
        <div className="sticky top-0 hidden h-dvh shrink-0 lg:block">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <ImpersonationBanner />
          <Topbar />
          {/* Tighter top gap on mobile: the app bar already states where you
              are, so a screen's content should start just under it rather than
              across a band of empty page. */}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-5 pt-3 sm:px-6 lg:py-8">
            {children}
          </main>
          {/* Reserves the height of the fixed bottom bar (plus the home
              indicator) so the last row of content is never trapped under it.
              A spacer rather than padding on <main>, to keep the two
              breakpoints from fighting over the same property. */}
          <div aria-hidden className={cn(backHref ? 'pb-safe' : 'pb-bottom-nav', 'lg:hidden')} />
        </div>

        <BottomNav />
      </div>
    </TooltipProvider>
  );
}
