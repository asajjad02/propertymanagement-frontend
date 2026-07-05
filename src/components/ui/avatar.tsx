import * as RadixAvatar from '@radix-ui/react-avatar';

import { cn } from '@/lib/cn';
import { initials as toInitials } from '@/lib/format';

// Deterministic tone per name so a person keeps the same color everywhere.
const palette = [
  'bg-primary-soft text-primary-text',
  'bg-ok-soft text-ok',
  'bg-warn-soft text-warn',
  'bg-info-soft text-info',
  'bg-danger-soft text-danger',
];

function hashToIndex(name: string, size: number): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return Math.abs(hash) % size;
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export interface AvatarProps {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}

/** Initials avatar, color-hashed from the name. No image source (backend has none). */
export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const tone = palette[hashToIndex(name || '?', palette.length)];
  return (
    <RadixAvatar.Root
      className={cn(
        'inline-flex items-center justify-center rounded-pill font-semibold select-none shrink-0',
        sizes[size],
        tone,
        className,
      )}
    >
      <RadixAvatar.Fallback delayMs={0}>{toInitials(name)}</RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}
