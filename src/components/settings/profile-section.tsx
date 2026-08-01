'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { fetchMe, updateProfile } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { queryKeys } from '@/lib/query-keys';
import { toApiError } from '@/lib/errors';

/** The signed-in user's own profile: name, phone, email (username is fixed). */
export function ProfileSection() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data: me } = useQuery({ queryKey: queryKeys.auth.me, queryFn: fetchMe });

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (me) {
      setFullName(me.full_name ?? '');
      setPhone(me.phone ?? '');
      setEmail(me.user.email ?? '');
    }
  }, [me]);

  const save = useMutation({
    mutationFn: () => updateProfile({ full_name: fullName, phone, email }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success('Profile updated');
    },
    onError: (err) => setError(toApiError(err).message),
  });

  return (
    <Card>
      <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
      <CardBody>
        <form
          onSubmit={(e) => { e.preventDefault(); setError(null); save.mutate(); }}
          className="max-w-md space-y-4"
        >
          <Field label="Username" hint="Your sign-in name can't be changed here.">
            {(id) => <Input id={id} value={me?.user.username ?? ''} disabled />}
          </Field>
          <Field label="Full name">
            {(id) => <Input autoCapitalize="words" id={id} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Sana Ahmed" />}
          </Field>
          <Field label="Phone">
            {(id) => <Input type="tel" inputMode="tel" autoComplete="tel" id={id} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+92 …" />}
          </Field>
          <Field label="Email">
            {(id) => <Input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="pt-1">
            <Button type="submit" loading={save.isPending} disabled={save.isPending}>Save changes</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
