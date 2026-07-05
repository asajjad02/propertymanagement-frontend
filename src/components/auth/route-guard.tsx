'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { LoadingBlock } from '@/components/ui/spinner';
import { useAuth } from '@/providers/auth-provider';

/** Gates authenticated routes: redirects to /login when there is no session. */
export function RouteGuard({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
  }, [status, router]);

  if (status !== 'authenticated') {
    return (
      <div className="flex h-dvh items-center justify-center">
        <LoadingBlock label="Loading…" />
      </div>
    );
  }
  return <>{children}</>;
}
