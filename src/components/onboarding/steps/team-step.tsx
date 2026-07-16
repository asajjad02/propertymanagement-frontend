'use client';

import { useQueryClient } from '@tanstack/react-query';
import { Info, Plus, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { teamHooks } from '@/hooks/resources';
import { toApiError } from '@/lib/errors';
import type { Role } from '@/types/api';

import { StepFooter } from '../step-footer';

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
  onSkip?: () => void;
}

const ROLE_OPTIONS = [
  { value: 'manager', label: 'Manager' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'security', label: 'Security' },
];

type Row = { username: string; email: string; role: Role };
const blank = (): Row => ({ username: '', email: '', role: 'manager' });

export function TeamStep({ onNext, onBack, onSkip }: StepProps) {
  const qc = useQueryClient();
  const create = teamHooks.useCreate();
  const [rows, setRows] = useState<Row[]>([blank()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setRow = (i: number, k: keyof Row, v: string) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? ({ ...r, [k]: v } as Row) : r)));

  async function finish() {
    setError(null);
    const filled = rows.filter((r) => r.email.trim() && r.username.trim());
    if (filled.length === 0) return onNext();
    setBusy(true);
    try {
      for (const r of filled) {
        await create.mutateAsync({ username: r.username.trim(), email: r.email.trim(), role: r.role });
      }
      await qc.invalidateQueries({ queryKey: ['team'] });
      onNext();
    } catch (err) {
      setError(toApiError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 rounded-card border border-hairline bg-raised px-4 py-3 text-sm text-ink-secondary">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
        <p>Teammates set their own password from the sign-in page via “Forgot password”. This step is optional — you can invite people anytime from Team.</p>
      </div>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={r.username} onChange={(e) => setRow(i, 'username', e.target.value)} placeholder="Username" className="flex-1" />
            <Input value={r.email} onChange={(e) => setRow(i, 'email', e.target.value)} type="email" placeholder="Email" className="flex-1" />
            <Select value={r.role} onValueChange={(v) => setRow(i, 'role', v)} options={ROLE_OPTIONS} className="w-36" />
            <button
              type="button"
              onClick={() => setRows((rs) => (rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs))}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-faint hover:bg-raised hover:text-ink"
              aria-label="Remove row"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <Button type="button" variant="ghost" size="sm" onClick={() => setRows((rs) => [...rs, blank()])}>
          <Plus className="h-4 w-4" />
          Add another teammate
        </Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      <StepFooter onBack={onBack} onSkip={onSkip} onContinue={finish} busy={busy} isLast continueLabel="Finish setup" />
    </div>
  );
}
