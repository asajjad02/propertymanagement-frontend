'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@/providers/auth-provider';

/**
 * Full-width warning bar shown while a superuser is impersonating a user, with
 * an Exit control that ends the impersonated session and returns to sign-in.
 */
export function ImpersonationBanner() {
  const { impersonatedBy, user, logout } = useAuth();
  const router = useRouter();
  const [exiting, setExiting] = useState(false);

  if (!impersonatedBy) return null;

  async function exit() {
    setExiting(true);
    try {
      await logout();
    } finally {
      router.replace('/login');
    }
  }

  return (
    <div className="flex items-center justify-center gap-3 border-b border-warn/30 bg-warn-soft px-4 py-2 text-center text-sm text-warn">
      <span>
        Viewing as <strong>{user?.username ?? 'user'}</strong> · impersonated by {impersonatedBy}
      </span>
      <button
        type="button"
        onClick={exit}
        disabled={exiting}
        className="rounded-control border border-warn/40 px-2 py-0.5 text-xs font-medium hover:bg-warn/10 disabled:opacity-50"
      >
        Exit
      </button>
    </div>
  );
}
