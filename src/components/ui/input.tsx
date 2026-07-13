import { forwardRef } from 'react';

import { cn } from '@/lib/cn';

const controlBase =
  'w-full h-9.5 rounded-control border border-hairline bg-surface px-3 text-sm text-ink ' +
  'placeholder:text-faint transition-colors hover:border-muted/40 focus:outline-none focus:border-primary ' +
  'focus:ring-2 focus:ring-primary/25 disabled:opacity-50';

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlBase, className)} {...props} />;
  },
);
