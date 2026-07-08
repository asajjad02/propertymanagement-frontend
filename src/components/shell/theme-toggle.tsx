'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Tooltip } from '@/components/ui/tooltip';

type Theme = 'light' | 'dark';

function systemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function currentTheme(): Theme {
  const attr = document.documentElement.getAttribute('data-theme');
  return attr === 'dark' || attr === 'light' ? attr : systemTheme();
}

/** Persisted light/dark switch. Writes `data-theme` on <html> and localStorage. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(currentTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('hr.theme', next);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  }

  // Keep icon stable until mounted to avoid a hydration mismatch.
  const isDark = mounted && theme === 'dark';

  return (
    <Tooltip content={isDark ? 'Light mode' : 'Dark mode'} side="bottom">
      <button
        onClick={toggle}
        aria-label="Toggle theme"
        className="rounded-control border border-hairline bg-surface p-1.5 text-muted transition-colors hover:text-ink"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </Tooltip>
  );
}
