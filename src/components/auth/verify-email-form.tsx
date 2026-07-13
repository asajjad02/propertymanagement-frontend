'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { resendOtp } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { toApiError } from '@/lib/errors';
import { useAuth } from '@/providers/auth-provider';

/** Enter the emailed 6-digit code to verify the account and sign in. */
export function VerifyEmailForm({ initialEmail = '' }: { initialEmail?: string }) {
  const { verifyEmail } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await verifyEmail({ email, code });
      router.replace('/');
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    setError(null);
    setResending(true);
    try {
      await resendOtp(email);
      setNotice('If your email is registered and unverified, a new code is on its way.');
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
      <div>
        <p className="label-mono text-primary-text">Hash Residency</p>
        <h1 className="mt-2.5 display text-[1.9rem] text-ink">Verify your email</h1>
        <p className="mt-1 text-sm text-muted">Enter the 6-digit code we sent to your inbox.</p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {notice && <p className="text-sm text-ok">{notice}</p>}

      <Field label="Email">
        {(id) => <Input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />}
      </Field>
      <Field label="Verification code">
        {(id) => (
          <Input
            id={id}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="123456"
            className="font-mono tracking-[0.3em]"
            required
          />
        )}
      </Field>

      <Button type="submit" className="w-full justify-center" disabled={submitting || code.length < 6}>
        {submitting && <Spinner className="text-white" />}
        Verify & continue
      </Button>

      <div className="flex items-center justify-between text-sm text-muted">
        <button type="button" onClick={onResend} disabled={resending || !email} className="hover:text-ink disabled:opacity-50">
          {resending ? 'Sending…' : 'Resend code'}
        </button>
        <Link href="/login" className="hover:text-ink">Back to sign in</Link>
      </div>
    </form>
  );
}
