'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LoadingBlock } from '@/components/ui/spinner';
import { useAuth } from '@/providers/auth-provider';

/**
 * Gates authenticated routes: redirects to /login when there is no session.
 *
 * The redirect is deferred until after mount. On the first (hydration) render
 * the token store reports its server snapshot — no token — which would make a
 * fresh deep-link load momentarily look "unauthenticated" and bounce through
 * /login → /flats. Waiting for mount lets the real localStorage token settle
 * first, so deep links (e.g. /flats/12) load their actual page.
 */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && status === 'unauthenticated') router.replace('/login');
  }, [mounted, status, router]);

  if (!mounted || status !== 'authenticated') {
    return (
      <div className="flex h-dvh items-center justify-center">
        <LoadingBlock label="Loading…" />
      </div>
    );
  }
  return <>{children}</>;
}
