'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { LoadingBlock } from '@/components/ui/spinner';
import { toApiError } from '@/lib/errors';
import { useAuth } from '@/providers/auth-provider';

/**
 * Consumes an admin-issued impersonation deep link (`/impersonate#ticket=…`):
 * exchanges the ticket for the target user's session, then lands on the app.
 * The ticket lives in the URL fragment, so it's never sent to a server or
 * written to access logs; we also strip it from history immediately.
 */
export default function ImpersonatePage() {
  const { impersonate } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // guard the double-invoke in dev/StrictMode
    ran.current = true;

    const hash = window.location.hash.replace(/^#/, '');
    const ticket = new URLSearchParams(hash).get('ticket');
    if (!ticket) {
      setError('This impersonation link is missing its ticket.');
      return;
    }
    // Remove the ticket from the address bar / history right away.
    window.history.replaceState(null, '', '/impersonate');

    impersonate(ticket)
      .then(() => router.replace('/'))
      .catch((err) => setError(toApiError(err).message));
  }, [impersonate, router]);

  return (
    <div className="flex h-dvh items-center justify-center p-6">
      {error ? (
        <div className="max-w-sm space-y-3 text-center">
          <h1 className="display text-xl text-ink">Impersonation failed</h1>
          <p className="text-sm text-muted">{error}</p>
          <a href="/login" className="text-sm text-primary-text hover:underline">
            Back to sign in
          </a>
        </div>
      ) : (
        <LoadingBlock label="Signing you in…" />
      )}
    </div>
  );
}
