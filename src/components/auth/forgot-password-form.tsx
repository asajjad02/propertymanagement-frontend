'use client';

import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { requestPasswordReset } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { toApiError } from '@/lib/errors';
import { validators } from '@/lib/validation';

/**
 * Request a password-reset link. The backend endpoint is pending (see
 * api/auth.ts), so a request currently fails until that route exists.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const invalid = validators.email(email);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm space-y-4 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-ok" />
        <h1 className="font-display text-2xl text-ink">Check your email</h1>
        <p className="text-sm text-muted">
          If an account exists for <span className="text-ink">{email}</span>, we’ve sent a link to reset your password.
        </p>
        <Link href="/login" className="inline-block text-sm text-primary-text hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
      <div>
        <p className="label-mono text-primary-text">Hash Residency</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Reset your password</h1>
        <p className="mt-1 text-sm text-muted">Enter your email and we’ll send you a reset link.</p>
      </div>

      <Field label="Email" error={error ?? undefined}>
        {(id) => <Input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />}
      </Field>

      <Button type="submit" className="w-full justify-center" disabled={submitting}>
        {submitting && <Spinner className="text-white" />}
        Send reset link
      </Button>

      <p className="text-center text-sm text-muted">
        Remembered it?{' '}
        <Link href="/login" className="text-primary-text hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
