import { cn } from '@/lib/cn';

/**
 * Atrium brand mark — the "Aperture": an atrium seen from above, a rounded-square
 * tile with a concentric square opening + skylight dot in the center.
 *
 * `tile` (default) renders the teal app-tile form (white aperture). `plain`
 * renders just the aperture in `currentColor` for inline/monochrome use.
 */
export function AtriumMark({
  size = 32,
  variant = 'tile',
  className,
}: {
  size?: number;
  variant?: 'tile' | 'plain';
  className?: string;
}) {
  if (variant === 'plain') {
    return (
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
        <rect x="6.75" y="6.75" width="18.5" height="18.5" rx="5.5" stroke="currentColor" strokeWidth="2.75" />
        <rect x="13.5" y="13.5" width="5" height="5" rx="1.6" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <rect x="9" y="9" width="14" height="14" rx="4.25" stroke="white" strokeWidth="2.5" />
      <rect x="14.15" y="14.15" width="3.7" height="3.7" rx="1.2" fill="white" />
    </svg>
  );
}

/** Atrium logo: the Aperture mark + wordmark. */
export function AtriumLogo({
  className,
  markSize = 32,
  wordmark = true,
  onDark = false,
}: {
  className?: string;
  markSize?: number;
  wordmark?: boolean;
  onDark?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <AtriumMark size={markSize} />
      {wordmark && (
        <span
          className={cn(
            'text-[1.05rem] font-semibold tracking-[-0.02em]',
            onDark ? 'text-white' : 'text-ink',
          )}
        >
          Atrium
        </span>
      )}
    </span>
  );
}
