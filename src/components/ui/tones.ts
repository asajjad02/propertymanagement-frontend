/** Badge/pill color tones. Single source for the token classes each tone uses. */
export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'indigo' | 'neutral';

export const toneClasses: Record<Tone, { bg: string; text: string; dot: string }> = {
  green: { bg: 'bg-ok-soft', text: 'text-ok', dot: 'bg-ok' },
  amber: { bg: 'bg-warn-soft', text: 'text-warn', dot: 'bg-warn' },
  red: { bg: 'bg-danger-soft', text: 'text-danger', dot: 'bg-danger' },
  blue: { bg: 'bg-info-soft', text: 'text-info', dot: 'bg-info' },
  indigo: { bg: 'bg-primary-soft', text: 'text-primary-text', dot: 'bg-primary' },
  neutral: { bg: 'bg-neutral-soft', text: 'text-muted', dot: 'bg-faint' },
};

/**
 * StatusBadge mapping (see GUIDELINES.md). Lowercased status/label → tone.
 * Backend bill statuses are draft/issued/paid; occupancy vacant/occupied; etc.
 */
const statusToTone: Record<string, Tone> = {
  // green
  occupied: 'green', paid: 'green', active: 'green', inside: 'green', resolved: 'green', completed: 'green',
  present: 'green',
  // amber
  unpaid: 'amber', pending: 'amber', open: 'amber', issued: 'amber', draft: 'amber',
  // red
  overdue: 'red', failed: 'red', inactive: 'red', absent: 'red',
  // blue
  'checked out': 'blue', in_progress: 'blue', 'in progress': 'blue', leave: 'blue',
  // neutral
  vacant: 'neutral', tenant: 'neutral', '—': 'neutral',
  // indigo
  owner: 'indigo',
};

export function toneForStatus(status: string): Tone {
  return statusToTone[status.trim().toLowerCase()] ?? 'neutral';
}
