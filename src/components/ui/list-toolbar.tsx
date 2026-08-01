import { cn } from '@/lib/cn';

/**
 * The controls strip above a list: segment tabs on one line, then search and
 * the filter/sort buttons sharing the next.
 *
 * Sticky below the topbar on mobile. A list screen's controls were previously
 * three separate full-width rows that scrolled away — you had to scroll back up
 * to change a filter, and they ate ~150px before the first record. Here they're
 * one compact block that stays put.
 *
 * Render this as a **direct child of the element that wraps the list** (the
 * record `Card`), not inside a wrapper div of its own. A sticky element only
 * stays pinned while its containing block is on screen, so a short parent
 * unsticks it the moment that parent scrolls past — which looks fine in a
 * screenshot and fails as soon as you scroll.
 */
export function ListToolbar({
  /** Segment tabs. Rendered on their own line above the search row. */
  segments,
  /** Search field — takes the remaining width on the search row. */
  search,
  /** Filter / sort buttons, kept to the right of search at their natural size. */
  actions,
  className,
}: {
  segments?: React.ReactNode;
  search?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      // Sticks directly under the topbar, which is h-14 plus the status-bar inset.
      style={{ top: 'calc(var(--topbar-h) + var(--safe-t))' }}
      className={cn(
        // Bleeding to the screen edge is the container's job (`Card` is full-bleed
        // on mobile), so this doesn't add its own negative margin and double up.
        'sticky z-20 space-y-1.5 border-b border-hairline bg-surface/95 px-4 py-1.5 backdrop-blur',
        // Desktop: back to the original single justified row — segments left,
        // search and filters right — sitting inline in the card rather than
        // pinned to the viewport.
        'md:static md:flex md:items-center md:justify-between md:gap-3 md:space-y-0',
        'md:bg-transparent md:p-4 md:backdrop-blur-none',
        className,
      )}
    >
      {segments}
      {(search || actions) && (
        <div className="flex items-center gap-2">
          {/* Fills the row on mobile; a fixed, sane width on desktop rather than
              stretching across the card. */}
          {search && <div className="min-w-0 flex-1 md:w-64 md:flex-none">{search}</div>}
          {actions}
        </div>
      )}
    </div>
  );
}
