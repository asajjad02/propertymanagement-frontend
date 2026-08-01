import { forwardRef } from 'react';

import { cn } from '@/lib/cn';

/*
 * `text-base` (16px) on mobile is load-bearing, not a style choice: iOS Safari
 * force-zooms the viewport whenever a focused field's font-size is under 16px,
 * and never zooms back out. `md:text-sm` keeps the 14px desktop density.
 * Height follows the same mobile-first rule as Button.
 */
const controlBase =
  'w-full h-11 rounded-control border border-hairline bg-surface px-3 text-base text-ink ' +
  'placeholder:text-faint transition-colors hover:border-muted/40 focus:outline-none focus:border-primary ' +
  'focus:ring-2 focus:ring-primary/25 disabled:opacity-50 md:h-9.5 md:text-sm';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlBase, className)} {...props} />;
  },
);
