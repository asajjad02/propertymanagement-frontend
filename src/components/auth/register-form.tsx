'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { toApiError } from '@/lib/errors';
import { runValidators, serverFieldErrors, validators, type FieldErrors } from '@/lib/validation';
import { useAuth } from '@/providers/auth-provider';

/** Create an account (registers a user + their tenant account, then signs in). */
export function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    username: '', email: '', password: '', password_confirm: '', account_name: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function validate(): FieldErrors {
    return runValidators({
      username: () => validators.required(form.username, 'Username'),
      email: () => validators.email(form.email),
      password: () => validators.minLength(form.password, 8),
      password_confirm: () =>
        form.password === form.password_confirm ? null : 'Passwords do not match.',
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
      // No tokens yet — go verify the emailed code to finish signing up.
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setErrors(serverFieldErrors(toApiError(err)));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
      <div>
        <p className="label-mono text-primary-text">Hash Residency</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Create your account</h1>
        <p className="mt-1 text-sm text-muted">Set up your society’s management portal.</p>
      </div>

      {errors._form && <p className="text-sm text-danger">{errors._form}</p>}

      <Field label="Account name" hint="Your society or company name" error={errors.account_name}>
        {(id) => <Input id={id} value={form.account_name} onChange={set('account_name')} placeholder="Hash Residency" />}
      </Field>
      <Field label="Username" error={errors.username}>
        {(id) => <Input id={id} value={form.username} onChange={set('username')} autoComplete="username" required />}
      </Field>
      <Field label="Email" error={errors.email}>
        {(id) => <Input id={id} type="email" value={form.email} onChange={set('email')} autoComplete="email" required />}
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Password" error={errors.password}>
          {(id) => <Input id={id} type="password" value={form.password} onChange={set('password')} autoComplete="new-password" required />}
        </Field>
        <Field label="Confirm" error={errors.password_confirm}>
          {(id) => <Input id={id} type="password" value={form.password_confirm} onChange={set('password_confirm')} autoComplete="new-password" required />}
        </Field>
      </div>

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
