'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { LoadingBlock } from '@/components/ui/spinner';
import { homeForRole } from '@/lib/home-route';
import { useAuth } from '@/providers/auth-provider';

/** Role-aware entry: route each role to a landing it can actually use. */
export default function RootPage() {
  const { status, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login');
    else if (status === 'authenticated') router.replace(homeForRole(role));
  }, [status, role, router]);

  return (
    <div className="flex h-dvh items-center justify-center">
      <LoadingBlock label="Loading…" />
    </div>
  );
}
