'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Spinner } from '@/components/ui/spinner';
import { EMAIL_VERIFICATION_ENABLED } from '@/lib/config';
import { toApiError } from '@/lib/errors';
import {
  passwordSatisfiesAll,
  runValidators,
  serverFieldErrors,
  validators,
  type FieldErrors,
} from '@/lib/validation';
import { useAuth } from '@/providers/auth-provider';

import { PasswordChecklist } from './password-checklist';

/**
 * Create an account. When email verification is enabled we hand off to the
 * verify-email step; otherwise signup returns tokens and the user drops
 * straight into the app.
 */
export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '', account_name: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function validate(): FieldErrors {
    return runValidators({
      username: () => validators.required(form.username, 'Username'),
      email: () => validators.email(form.email),
      password: () => (passwordSatisfiesAll(form.password) ? null : 'Password does not meet the requirements below.'),
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clientErrors = validate();
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) return;

    setSubmitting(true);
    try {
      await register(form);
      if (EMAIL_VERIFICATION_ENABLED) {
        router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
      } else {
        router.replace('/');
      }
    } catch (err) {
      setErrors(serverFieldErrors(toApiError(err)));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
      <div>
        <h1 className="display text-[1.9rem] text-ink">Create your account</h1>
        <p className="mt-1.5 text-sm text-muted">Set up your society on Atrium in about a minute.</p>
      </div>

      {errors._form && <p className="text-sm text-danger">{errors._form}</p>}

      <Field label="Society name" hint="The name of your society or company" error={errors.account_name}>
        {(id) => <Input id={id} value={form.account_name} onChange={set('account_name')} placeholder="e.g. Greenview Residency" />}
      </Field>
      <Field label="Username" error={errors.username}>
        {(id) => <Input id={id} value={form.username} onChange={set('username')} autoComplete="username" required />}
      </Field>
      <Field label="Email" error={errors.email}>
        {(id) => <Input id={id} type="email" value={form.email} onChange={set('email')} autoComplete="email" required />}
      </Field>
      <Field label="Password" error={errors.password}>
        {(id) => <PasswordInput id={id} value={form.password} onChange={set('password')} autoComplete="new-password" required />}
      </Field>

      <PasswordChecklist value={form.password} />

      <Button type="submit" className="w-full justify-center" disabled={submitting}>
        {submitting && <Spinner className="text-white" />}
        Create account
      </Button>

      <p className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-primary-text hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
