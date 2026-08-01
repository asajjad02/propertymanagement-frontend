'use client';

import { Sheet, type SheetSize } from './sheet';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Footer actions (buttons). */
  footer?: React.ReactNode;
  /** Desktop max width. Defaults to `md` (max-w-lg), the previous fixed width. */
  size?: SheetSize;
  className?: string;
}

/**
 * The app's dialog. Kept as a named surface because ~20 call sites speak
 * "modal", but the implementation is `Sheet` — so every one of them is a
 * bottom sheet on a phone and the centered dialog on desktop, with no call-site
 * changes. Reach for `Sheet` directly when you want its extra knobs.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: ModalProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={footer}
      size={size}
      className={className}
    >
      {children}
    </Sheet>
  );
}
