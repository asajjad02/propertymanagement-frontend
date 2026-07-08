'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { changePassword } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { PasswordInput } from '@/components/ui/password-input';
import { useToast } from '@/components/ui/toast';
import { toApiError } from '@/lib/errors';

/** Change password while signed in (current + new). */
export function PasswordSection() {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = useMutation({
    mutationFn: () => changePassword({ current_password: current, new_password: next }),
    onSuccess: () => {
      toast.success('Password updated');
      setCurrent(''); setNext(''); setConfirm('');
    },
    onError: (err) => setError(toApiError(err).message),
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (next !== confirm) {
      setError('The new passwords don’t match.');
      return;
    }
    submit.mutate();
  }

  return (
    <Card>
      <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
      <CardBody>
        <form onSubmit={onSubmit} className="max-w-md space-y-4">
          <Field label="Current password">
            {(id) => <PasswordInput id={id} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required />}
          </Field>
          <Field label="New password">
            {(id) => <PasswordInput id={id} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required />}
          </Field>
          <Field label="Confirm new password">
            {(id) => <PasswordInput id={id} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />}
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="pt-1">
            <Button type="submit" disabled={submit.isPending || !current || !next}>Update password</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
