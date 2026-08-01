'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { AppBarAction } from '@/components/shell/page-chrome';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormActions } from '@/components/ui/form-actions';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { teamHooks } from '@/hooks/resources';
import { toApiError } from '@/lib/errors';
import type { Role } from '@/types/api';

export const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'manager', label: 'Manager' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'security', label: 'Security guard' },
  { value: 'admin', label: 'Admin' },
];

/** Admin adds a teammate. The new user sets their own password via "Forgot password". */
export function AddTeamMemberButton() {
  const toast = useToast();
  const create = teamHooks.useCreate();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('manager');
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setUsername('');
    setEmail('');
    setRole('manager');
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({ username, email, role });
      toast.success('Teammate added', `${username} can set a password via “Forgot password”.`);
      reset();
      setOpen(false);
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add teammate
      </Button>
      <AppBarAction icon={Plus} label="Add teammate" onClick={() => setOpen(true)} />
      <Modal
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) reset();
        }}
        title="Add teammate"
        description="Create a user and assign a role. They set their own password via “Forgot password”."
      >
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Username" required>
            {(id) => <Input id={id} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" required />}
          </Field>
          <Field label="Email" required>
            {(id) => <Input id={id} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" required />}
          </Field>
          <Field label="Role" required>
            {(id) => (
              <Select id={id} value={role} onValueChange={(v) => setRole(v as Role)} options={ROLE_OPTIONS} className="w-full" />
            )}
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <FormActions>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} className="hidden md:inline-flex">Cancel</Button>
            <Button type="submit" loading={create.isPending} disabled={create.isPending || !username || !email}>Add teammate</Button>
          </FormActions>
        </form>
      </Modal>
    </>
  );
}
