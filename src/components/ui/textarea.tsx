import { forwardRef } from 'react';

import { cn } from '@/lib/cn';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 3, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn(
        'w-full rounded-control border border-hairline bg-surface px-3 py-2 text-sm text-ink',
        'placeholder:text-faint transition-colors focus:outline-none focus:border-primary',
        'focus:ring-2 focus:ring-primary/25 disabled:opacity-50 resize-y',
        className,
      )}
      {...props}
    />
  );
});
