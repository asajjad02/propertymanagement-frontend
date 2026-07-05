'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { usePersistedFlag } from '@/hooks/use-persisted-flag';

import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

/** Two-part chrome: fixed sidebar + sticky topbar, scrolling content area. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = usePersistedFlag('hr.sidebarCollapsed');
  const toggle = () => setCollapsed(!collapsed);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex">
        <div className="sticky top-0 h-dvh shrink-0">
          <Sidebar collapsed={collapsed} onToggle={toggle} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
