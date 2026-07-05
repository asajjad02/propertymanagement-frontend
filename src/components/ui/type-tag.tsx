import { Badge } from './badge';

/** Owner (indigo) / Tenant (neutral) membership tag — see StatusBadge mapping. */
export function TypeTag({ type }: { type: 'owner' | 'tenant' }) {
  return (
    <Badge tone={type === 'owner' ? 'indigo' : 'neutral'}>
      {type === 'owner' ? 'Owner' : 'Tenant'}
    </Badge>
  );
}
