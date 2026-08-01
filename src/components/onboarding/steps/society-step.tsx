'use client';

import { useEffect, useState } from 'react';

import { fetchAccount, updateAccount } from '@/api/auth';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toApiError } from '@/lib/errors';

import { StepFooter } from '../step-footer';

interface StepProps {
  onNext: () => void;
  onSkip?: () => void;
}

export function SocietyStep({ onNext, onSkip }: StepProps) {
  const [form, setForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccount()
      .then((a) =>
        setForm({
          name: a.name ?? '',
          contact_person: a.contact_person ?? '',
          phone: a.phone ?? '',
          email: a.email ?? '',
          address: a.address ?? '',
        }),
      )
      .catch(() => {});
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setError(null);
    setBusy(true);
    try {
      await updateAccount(form);
      onNext();
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Field label="Society name" required>
        {(id) => <Input autoCapitalize="words" id={id} value={form.name} onChange={set('name')} placeholder="e.g. Greenview Residency" />}
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Contact person">
          {(id) => <Input autoCapitalize="words" id={id} value={form.contact_person} onChange={set('contact_person')} />}
        </Field>
        <Field label="Phone">
          {(id) => <Input type="tel" inputMode="tel" autoComplete="off" id={id} value={form.phone} onChange={set('phone')} />}
        </Field>
      </div>
      <Field label="Contact email">
        {(id) => <Input id={id} type="email" value={form.email} onChange={set('email')} />}
      </Field>
      <Field label="Address">
        {(id) => <Textarea id={id} value={form.address} onChange={set('address')} rows={2} />}
      </Field>

      {error && <p className="text-sm text-danger">{error}</p>}
      <StepFooter onSkip={onSkip} onContinue={save} busy={busy} />
    </div>
  );
}
