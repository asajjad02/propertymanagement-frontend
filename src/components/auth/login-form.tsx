'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import { toApiError } from '@/lib/errors';
import { runValidators, serverFieldErrors, validators, type FieldErrors } from '@/lib/validation';
import { useAuth } from '@/providers/auth-provider';

/** Username/password sign-in. Backend authenticates by username (not email). */
export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [needsVerify, setNeedsVerify] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNeedsVerify(false);
    const clientErrors = runValidators({
      username: () => validators.required(username, 'Username'),
      password: () => validators.required(password, 'Password'),
    });
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSubmitting(true);
    try {
      await login({ username, password });
      router.replace('/flats');
    } catch (err) {
      const apiError = toApiError(err);
      // 403 => account exists but email is unverified.
      if (apiError.status === 403) setNeedsVerify(true);
      setErrors(serverFieldErrors(apiError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
      <div>
        <p className="label-mono text-primary-text">Hash Residency</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Sign in to your portal</h1>
        <p className="mt-1 text-sm text-muted">Manage flats, residents, billing and visitors.</p>
      </div>

      {errors._form && <p className="text-sm text-danger">{errors._form}</p>}
      {needsVerify && (
        <p className="text-sm text-muted">
          <Link href="/verify-email" className="text-primary-text hover:underline">Verify your email</Link>{' '}
          to finish signing up.
        </p>
      )}

      <Field label="Username" error={errors.username}>
        {(id) => (
          <Input id={id} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        )}
      </Field>
      <Field label="Password" error={errors.password}>
        {(id) => (
          <PasswordInput id={id} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        )}
      </Field>

      <div className="flex justify-end">
        <Link href="/forgot-password" className="text-sm text-muted hover:text-ink">Forgot password?</Link>
      </div>

      <Button type="submit" className="w-full justify-center" disabled={submitting}>
        {submitting && <Spinner className="text-white" />}
        Sign in
      </Button>

      <p className="text-center text-sm text-muted">
        Don’t have an account?{' '}
        <Link href="/register" className="text-primary-text hover:underline">Create one</Link>
      </p>
    </form>
  );
}
