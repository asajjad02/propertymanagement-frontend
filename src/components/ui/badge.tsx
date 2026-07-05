import { cn } from '@/lib/cn';

import { toneClasses, type Tone } from './tones';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  /** Show the leading status dot. */
  dot?: boolean;
}

/** Generic pill. Use StatusBadge for status strings so tones stay consistent. */
export function Badge({ tone = 'neutral', dot = false, className, children, ...props }: BadgeProps) {
  const t = toneClasses[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5',
        'text-xs font-medium whitespace-nowrap',
        t.bg,
        t.text,
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-pill', t.dot)} />}
      {children}
    </span>
  );
}
