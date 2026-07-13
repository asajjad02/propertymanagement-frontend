'use client';

import { useEffect, useState } from 'react';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Segmented } from '@/components/ui/segmented';

type ThemeChoice = 'light' | 'dark' | 'system';

const OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

/**
 * Theme preference. Light/Dark stamp `data-theme` on <html> and persist to
 * localStorage (`hr.theme`, read by the no-flash bootstrap); System clears the
 * override so the OS `prefers-color-scheme` governs.
 */
export function AppearanceSection() {
  const [choice, setChoice] = useState<ThemeChoice>('system');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem('hr.theme');
    } catch {
      // ignore
    }
    setChoice(saved === 'dark' || saved === 'light' ? saved : 'system');
    setMounted(true);
  }, []);

  function apply(next: ThemeChoice) {
    setChoice(next);
    try {
      if (next === 'system') {
        localStorage.removeItem('hr.theme');
        document.documentElement.removeAttribute('data-theme');
      } else {
        localStorage.setItem('hr.theme', next);
        document.documentElement.setAttribute('data-theme', next);
      }
    } catch {
      // ignore storage failures
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
      <CardBody className="space-y-3">
        <p className="text-sm text-muted">Choose how Hash Residency looks. “System” follows your device setting.</p>
        <Segmented
          options={OPTIONS}
          value={mounted ? choice : 'system'}
          onValueChange={(v) => apply(v as ThemeChoice)}
        />
      </CardBody>
    </Card>
  );
}
