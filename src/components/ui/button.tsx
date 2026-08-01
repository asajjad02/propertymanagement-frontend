import { Slot } from '@radix-ui/react-slot';
import { forwardRef } from 'react';

import { cn } from '@/lib/cn';

import { Spinner } from './spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'icon';

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-white shadow-hair hover:bg-primary-hover active:bg-primary-hover',
  secondary:
    'bg-surface border border-hairline text-ink hover:bg-raised hover:border-muted/40 active:bg-neutral-soft',
  ghost: 'text-ink-secondary hover:bg-raised active:bg-neutral-soft',
  danger: 'bg-danger text-white shadow-hair hover:brightness-95 active:brightness-90',
};

/*
 * Mobile-first sizing: the base value is the touch size (≥44px tall, per the
 * iOS/Android target guidance), and `md:` restores the compact desktop density
 * the design system specifies. Changing the base rather than adding a separate
 * "touch" variant means every existing call site becomes touch-correct without
 * being audited.
 */
const sizes: Record<Size, string> = {
  sm: 'h-10 px-3.5 text-sm gap-1.5 md:h-8 md:px-3 md:text-[0.8125rem]',
  md: 'h-11 px-4 text-[0.9375rem] gap-2 md:h-9.5 md:text-sm',
  icon: 'h-11 w-11 justify-center md:h-9 md:w-9',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Render as the single child element (Radix Slot) instead of a <button>. */
  asChild?: boolean;
  /**
   * Work is in flight: shows a spinner, blocks further clicks, and marks the
   * control `aria-busy`. Prefer this over `disabled` alone — a button that just
   * greys out gives no sign that anything is happening, so people tap again.
   */
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', asChild, type, loading = false, disabled, children, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      // Slot forwards props to its child; only set `type` on real buttons.
      {...(asChild ? {} : { type: type ?? 'button', disabled: disabled || loading })}
      aria-busy={loading || undefined}
      className={cn(
        // touch-manipulation: opts out of double-tap-to-zoom, which is what
        // causes the ~300ms delay before a tap registers on mobile Safari.
        'inline-flex items-center justify-center rounded-control font-medium tracking-[-0.01em] transition-colors touch-manipulation',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-paper',
        'disabled:opacity-50 disabled:pointer-events-none',
        // A busy button shouldn't fade out like a disabled one — it's working,
        // not unavailable, and the spinner needs to stay legible.
        loading && 'disabled:opacity-80',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {/* Slot takes exactly one child, so an `asChild` button renders its own
          content untouched and opts out of the spinner. */}
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Spinner className="h-4 w-4" />}
          {children}
        </>
      )}
    </Comp>
  );
});
