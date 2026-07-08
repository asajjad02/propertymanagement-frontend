'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { fetchAccount, updateAccount } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingBlock } from '@/components/ui/spinner';
import { useToast } from '@/components/ui/toast';
import { toApiError } from '@/lib/errors';

/** Admin-only society/account settings (name, contact, address). */
export function AccountSection() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data, isPending } = useQuery({ queryKey: ['account'], queryFn: fetchAccount });

  const [form, setForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setForm({
        name: data.name ?? '',
        contact_person: data.contact_person ?? '',
        phone: data.phone ?? '',
        email: data.email ?? '',
        address: data.address ?? '',
      });
    }
  }, [data]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = useMutation({
    mutationFn: () => updateAccount(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account'] });
      toast.success('Account settings saved');
    },
    onError: (err) => setError(toApiError(err).message),
  });

  return (
    <Card>
      <CardHeader><CardTitle>Account &amp; society</CardTitle></CardHeader>
      <CardBody>
        {isPending ? (
          <LoadingBlock />
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); setError(null); save.mutate(); }}
            className="max-w-md space-y-4"
          >
            <Field label="Society / account name" required>
              {(id) => <Input id={id} value={form.name} onChange={set('name')} required />}
            </Field>
            <Field label="Contact person">
              {(id) => <Input id={id} value={form.contact_person} onChange={set('contact_person')} />}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone">{(id) => <Input id={id} value={form.phone} onChange={set('phone')} />}</Field>
              <Field label="Email">{(id) => <Input id={id} type="email" value={form.email} onChange={set('email')} />}</Field>
            </div>
            <Field label="Address">
              {(id) => <Textarea id={id} value={form.address} onChange={set('address')} rows={3} />}
            </Field>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="pt-1">
              <Button type="submit" disabled={save.isPending || !form.name}>Save settings</Button>
            </div>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
