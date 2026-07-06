import { Badge } from './badge';
import { toneForStatus } from './tones';

export interface StatusBadgeProps {
  /** Raw status/label string; tone is derived from the guideline mapping. */
  status: string;
  /** Optional display override (defaults to a capitalized `status`). */
  label?: string;
  className?: string;
}

function humanize(value: string): string {
  const spaced = value.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Status pill with a leading dot, tone chosen by the StatusBadge mapping. */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <Badge tone={toneForStatus(status)} dot className={className}>
      {label ?? humanize(status)}
    </Badge>
  );
}
