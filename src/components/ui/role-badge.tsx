import type { ResidentRole } from '@/lib/resident-role';

import { Badge } from './badge';
import type { Tone } from './tones';

export const RESIDENT_ROLE_META: Record<
  ResidentRole,
  { label: string; tone: Tone; description: string }
> = {
  'owner-resident': {
    label: 'Owner-resident',
    tone: 'green',
    description: 'Owns and lives in their flat',
  },
  owner: {
    label: 'Owner',
    tone: 'indigo',
    description: 'Owns a flat (rented out or absentee)',
  },
  tenant: {
    label: 'Tenant',
    tone: 'blue',
    description: 'Rents the flat they live in',
  },
};

/** Prominent resident-role pill. `null` renders a muted "Unassigned". */
export function RoleBadge({ role }: { role: ResidentRole | null }) {
  if (!role) return <Badge tone="neutral">Unassigned</Badge>;
  const meta = RESIDENT_ROLE_META[role];
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}
