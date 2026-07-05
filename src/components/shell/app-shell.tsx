'use client';

import { useEffect, useState } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';

import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

const STORAGE_KEY = 'hr.sidebarCollapsed';

/** Two-part chrome: fixed sidebar + sticky topbar, scrolling content area. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  // Restore persisted collapse state after mount (avoids SSR mismatch).
  useEffect(() => {
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === '1');
  }, []);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  }

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
