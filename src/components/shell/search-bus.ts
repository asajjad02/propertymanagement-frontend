/**
 * Lets anything in the shell open the ⌘K command palette.
 *
 * The palette is mounted by the topbar, but its mobile entry point is a row in
 * the More sheet — a sibling, not a descendant. A one-event bus is lighter than
 * hoisting the palette's open state into a provider that nothing else needs.
 */
const listeners = new Set<() => void>();

export function openGlobalSearch() {
  listeners.forEach((l) => l());
}

/** Returns an unsubscribe function, so it can be returned straight from an effect. */
export function onOpenGlobalSearch(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
