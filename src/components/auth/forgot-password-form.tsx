'use client';

import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { forgotPassword, resetPassword } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import { toApiError } from '@/lib/errors';
import { serverFieldErrors, validators, type FieldErrors } from '@/lib/validation';

type Phase = 'request' | 'reset' | 'done';

/** OTP password reset: request a code by email, then set a new password. */
export function ForgotPasswordForm() {
  const [phase, setPhase] = useState<Phase>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    const invalid = validators.email(email);
    if (invalid) return setErrors({ email: invalid });
    setErrors({});
    setBusy(true);
    try {
      await forgotPassword(email);
      setPhase('reset');
    } catch (err) {
      setErrors(serverFieldErrors(toApiError(err)));
    } finally {
      setBusy(false);
    }
  }

  async function submitReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setErrors({ new_password_confirm: 'Passwords do not match.' });
    const weak = validators.minLength(password, 8);
    if (weak) return setErrors({ new_password: weak });
    setErrors({});
    setBusy(true);
    try {
      await resetPassword({ email, code, new_password: password, new_password_confirm: confirm });
      setPhase('done');
    } catch (err) {
      setErrors(serverFieldErrors(toApiError(err)));
    } finally {
      setBusy(false);
    }
  }

  if (phase === 'done') {
    return (
      <div className="w-full max-w-sm space-y-4 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-ok" />
        <h1 className="font-display text-2xl text-ink">Password reset</h1>
        <p className="text-sm text-muted">Your password has been updated. You can now sign in.</p>
        <Link href="/login" className="inline-block text-sm text-primary-text hover:underline">Back to sign in</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-5">
      <div>
        <p className="label-mono text-primary-text">Hash Residency</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Reset your password</h1>
        <p className="mt-1 text-sm text-muted">
          {phase === 'request'
            ? 'Enter your email and we’ll send a reset code.'
            : `Enter the code sent to ${email} and choose a new password.`}
        </p>
      </div>

      {errors._form && <p className="text-sm text-danger">{errors._form}</p>}

      {phase === 'request' ? (
        <form onSubmit={requestCode} className="space-y-5">
          <Field label="Email" error={errors.email}>
            {(id) => <Input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />}
          </Field>
          <Button type="submit" className="w-full justify-center" disabled={busy}>
            {busy && <Spinner className="text-white" />}Send reset code
          </Button>
        </form>
      ) : (
        <form onSubmit={submitReset} className="space-y-5">
          <Field label="Reset code" error={errors.code}>
            {(id) => (
              <Input id={id} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric" placeholder="123456" className="font-mono tracking-[0.3em]" required />
            )}
          </Field>
          <Field label="New password" error={errors.new_password}>
            {(id) => <PasswordInput id={id} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />}
          </Field>
          <Field label="Confirm password" error={errors.new_password_confirm}>
            {(id) => <PasswordInput id={id} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />}
          </Field>
          <Button type="submit" className="w-full justify-center" disabled={busy || code.length < 6}>
            {busy && <Spinner className="text-white" />}Reset password
          </Button>
        </form>
      )}

      <p className="text-center text-sm text-muted">
        <Link href="/login" className="text-primary-text hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}
