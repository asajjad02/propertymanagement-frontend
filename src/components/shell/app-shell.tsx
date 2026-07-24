'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';
import { usePersistedFlag } from '@/hooks/use-persisted-flag';

import { ImpersonationBanner } from './impersonation-banner';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

/**
 * App chrome. On desktop (≥lg): a sticky sidebar (collapsible to a rail) + sticky
 * topbar. On mobile: the sidebar becomes an off-canvas drawer opened from a
 * hamburger in the topbar, so content gets the full width.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = usePersistedFlag('hr.sidebarCollapsed');
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex">
        {/* Desktop sidebar */}
        <div className="sticky top-0 hidden h-dvh shrink-0 lg:block">
          <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        </div>

        {/* Mobile off-canvas drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              aria-label="Close menu"
              className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 h-dvh motion-safe:animate-[drawer-in_160ms_ease-out]">
              <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <ImpersonationBanner />
          <Topbar onOpenMenu={() => setMobileOpen(true)} />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
