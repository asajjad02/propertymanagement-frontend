'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ChevronLeft, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

import { cn } from '@/lib/cn';

export type SheetSize = 'md' | 'lg' | 'full';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  /** Footer actions (buttons). Pinned below the scrolling body. */
  footer?: React.ReactNode;
  /** Desktop max width. `full` also makes the mobile sheet near-full-height. */
  size?: SheetSize;
  /** Render the title for screen readers only — for surfaces with their own heading. */
  hideTitle?: boolean;
  /**
   * Set while a sub-view is pushed on top of the sheet's main content: adds a
   * back chevron to the header, which is what lets a multi-step flow stay in
   * one drawer instead of stacking a second dialog on top of the first.
   */
  onBack?: () => void;
  className?: string;
}

const DESKTOP_WIDTH: Record<SheetSize, string> = {
  md: 'md:max-w-lg',
  lg: 'md:max-w-2xl',
  full: 'md:max-w-4xl',
};

/** Past this drag distance (px) releasing dismisses the sheet. */
const DISMISS_THRESHOLD = 110;

/**
 * The one overlay surface in the app.
 *
 * Below `md` it is a bottom sheet — anchored to the thumb, full-width, with a
 * grab handle, drag-to-dismiss, and a footer that clears the home indicator.
 * At `md` and up it is the centered dialog the design system already specifies.
 *
 * Centering on desktop is done with flexbox rather than a `-translate-1/2`
 * pair, so the open/close keyframes own `transform` outright and don't have to
 * carry the centering offset through every frame.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  hideTitle = false,
  onBack,
  className,
}: SheetProps) {
  // Live drag offset in px. 0 means "not dragging" and hands `transform` back
  // to the CSS keyframes.
  const [dragY, setDragY] = useState(0);
  const startY = useRef<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // A sheet reopened after a drag-dismiss must not remember the old offset.
  // Reset on the way *in*, not on the way out: clearing it at close would snap
  // the sheet back to rest before the exit animation had a chance to run from
  // wherever the finger left it. Adjusted during render rather than in an
  // effect, per React's "adjusting state when a prop changes" guidance.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDragY(0);
  }

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Drag-to-dismiss is a mobile affordance; the desktop dialog is static.
    if (window.matchMedia('(min-width: 768px)').matches) return;
    startY.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (startY.current === null) return;
    const dy = e.clientY - startY.current;
    // Rubber-band an upward drag instead of letting the sheet fly off the top.
    setDragY(dy > 0 ? dy : dy / 4);
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (startY.current === null) return;
      const dy = e.clientY - startY.current;
      startY.current = null;
      if (dy > DISMISS_THRESHOLD) onOpenChange(false);
      setDragY(0);
    },
    [onOpenChange],
  );

  const dragging = dragY !== 0;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]',
            'motion-safe:data-[state=open]:animate-[overlay-in_180ms_ease-out]',
            'motion-safe:data-[state=closed]:animate-[overlay-out_160ms_ease-in]',
          )}
        />
        {/* Positioning layer. pointer-events-none lets clicks in the gutter fall
            through to the overlay, which is what dismisses the sheet. */}
        <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4">
          <Dialog.Content
            ref={contentRef}
            // Radix focuses the first tabbable element on open, which here is the
            // close button — so every sheet opened with a keyboard-ish focus
            // state came up with a ring drawn around its X, and on mobile the
            // first form field never won focus anyway. Move focus to the dialog
            // container instead: screen readers still announce it, no stray
            // ring, and no keyboard summoned before the user asks for one.
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              contentRef.current?.focus();
            }}
            // A portaled popper inside the dialog (Select/Dropdown/Popover) lives
            // in a separate DOM subtree, so clicking it reads as "outside" and
            // would dismiss the dialog. Ignore interactions from popper layers.
            onInteractOutside={(e) => {
              const target = e.target as Element | null;
              if (target?.closest('[data-radix-popper-content-wrapper]')) e.preventDefault();
            }}
            // Radix always mints a descriptionId and points aria-describedby at
            // it, even when no <Description> is rendered — a dangling idref.
            // User props are spread last, so this clears it when unused.
            {...(description ? {} : { 'aria-describedby': undefined })}
            style={dragging ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
            className={cn(
              'pointer-events-auto flex w-full flex-col overflow-hidden bg-surface focus:outline-none',
              // Mobile: bottom sheet.
              'max-h-[92dvh] rounded-t-[1.25rem] border-t border-hairline shadow-pop',
              size === 'full' && 'h-[92dvh]',
              'motion-safe:data-[state=open]:animate-[sheet-in_260ms_cubic-bezier(0.32,0.72,0,1)]',
              'motion-safe:data-[state=closed]:animate-[sheet-out_200ms_cubic-bezier(0.32,0.72,0,1)]',
              // Desktop: centered dialog.
              'md:h-auto md:max-h-[85dvh] md:rounded-card md:border',
              DESKTOP_WIDTH[size],
              'md:motion-safe:data-[state=open]:animate-[dialog-in_160ms_ease-out]',
              'md:motion-safe:data-[state=closed]:animate-[dialog-out_120ms_ease-in]',
              className,
            )}
          >
            {/* Grab handle. The drag listeners live here and not on the whole
                header, so pointer capture can never swallow the close button. */}
            <div
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              aria-hidden
              className="flex shrink-0 cursor-grab touch-none justify-center py-2.5 active:cursor-grabbing md:hidden"
            >
              <span className="h-1 w-9 rounded-pill bg-hairline" />
            </div>

            {/* The header row always renders — `hideTitle` only mutes the title
                text, never the close affordance. */}
            <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 md:border-b md:border-hairline md:py-4">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  aria-label="Back"
                  className={cn(
                    '-ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-control',
                    'text-ink-secondary transition-colors touch-manipulation active:bg-raised hover:bg-raised',
                  )}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <div className="min-w-0 flex-1">
                {hideTitle ? (
                  <VisuallyHidden asChild>
                    <Dialog.Title>{title}</Dialog.Title>
                  </VisuallyHidden>
                ) : (
                  <Dialog.Title className="text-lg font-semibold text-ink md:text-base">
                    {title}
                  </Dialog.Title>
                )}
                {description && (
                  <Dialog.Description className="mt-0.5 text-sm text-muted">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              <Dialog.Close
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-muted',
                  '-mr-2 touch-manipulation transition-colors hover:bg-raised hover:text-ink',
                  'md:-mr-1 md:h-8 md:w-8',
                )}
                aria-label="Close"
              >
                <X className="h-5 w-5 md:h-4 md:w-4" />
              </Dialog.Close>
            </div>

            {/* overscroll-contain stops a flick at the end of the body from
                scrolling the page behind the sheet. */}
            <div
              className={cn(
                'min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-1 md:py-4',
                // With no footer, the body itself must clear the home indicator.
                !footer && 'pb-[calc(1.25rem+var(--safe-b))] md:pb-4',
              )}
            >
              {children}
            </div>

            {footer && (
              <div
                className={cn(
                  'flex shrink-0 items-center gap-2 border-t border-hairline bg-surface px-5 pt-3',
                  'pb-[calc(0.875rem+var(--safe-b))] md:pb-3',
                  // Two actions share the row comfortably. Three or more can't —
                  // at ~110px each the labels wrap to two lines — so past that
                  // they stack full-width, reversed so the primary (last in DOM,
                  // for correct tab order) sits on top nearest the thumb.
                  // `*:flex-1` shares the row; in the stacked case it must be
                  // undone — `flex:1 1 0%` on a column child zeroes its basis
                  // and can collapse the auto-height footer. Scoped to `max-md`
                  // rather than overridden at `md`, because a `:has()` selector
                  // outranks a plain `md:` utility on specificity.
                  '*:flex-1',
                  'max-md:has-[>:nth-child(3)]:flex-col-reverse',
                  'max-md:has-[>:nth-child(3)]:items-stretch',
                  'max-md:has-[>:nth-child(3)]:*:flex-none',
                  // Desktop is always a right-aligned row of natural-width buttons.
                  'md:justify-end md:*:flex-none',
                )}
              >
                {footer}
              </div>
            )}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
