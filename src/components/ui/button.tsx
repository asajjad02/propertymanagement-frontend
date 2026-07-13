import { Slot } from '@radix-ui/react-slot';
import { forwardRef } from 'react';

import { cn } from '@/lib/cn';

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

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[0.8125rem] gap-1.5',
  md: 'h-9.5 px-4 text-sm gap-2',
  icon: 'h-9 w-9 justify-center',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Render as the single child element (Radix Slot) instead of a <button>. */
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', asChild, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      // Slot forwards props to its child; only set `type` on real buttons.
      {...(asChild ? {} : { type: type ?? 'button' })}
      className={cn(
        'inline-flex items-center justify-center rounded-control font-medium tracking-[-0.01em] transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-paper',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
});
