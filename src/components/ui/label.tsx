import * as RadixLabel from '@radix-ui/react-label';

import { cn } from '@/lib/cn';

/** Mono-caps form label. Pair with a control via htmlFor / id. */
export function Label({ className, ...props }: React.ComponentProps<typeof RadixLabel.Root>) {
  return <RadixLabel.Root className={cn('label-mono block', className)} {...props} />;
}
