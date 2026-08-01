'use client';

import type { LucideIcon } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useSyncExternalStore } from 'react';

/*
 * The chrome must be published before the browser paints, not after: the app
 * bar's title and whether the bottom nav shows both depend on it, so a plain
 * effect would flash the previous screen's bar for a frame on every navigation.
 * `useLayoutEffect` warns during SSR, where there's nothing to measure anyway.
 */
const useBeforePaint = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * One action in the mobile app bar's right slot.
 *
 * A descriptor rather than a `ReactNode` on purpose: the bar's contents travel
 * from the page to the shell through a store, and plain data compares and
 * re-renders predictably where an element tree does not.
 */
export interface PageAction {
  icon: LucideIcon;
  /** Accessible name — the bar shows icons only. */
  label: string;
  onClick?: () => void;
  /** Use instead of `onClick` for actions that are navigations. */
  href?: string;
}

export interface PageChromeState {
  title: string | null;
  /** When set, the bar's left slot is a back chevron instead of the logo. */
  backHref: string | null;
  actions: PageAction[];
}

const EMPTY: PageChromeState = { title: null, backHref: null, actions: [] };

/*
 * A tiny external store rather than context + `useState`.
 *
 * The shell renders the app bar but only the page knows its title, and only the
 * individual action components know their handlers — so the values travel
 * upward. Doing that through context means calling a `useState` setter from an
 * effect on every navigation, which is the cascading-render pattern
 * `react-hooks/set-state-in-effect` exists to catch. `useSyncExternalStore` is
 * the sanctioned way to read a value that lives outside React: publishing is a
 * plain function call, and only the bar re-renders.
 *
 * Title and actions are published separately so an action can stay owned by the
 * component that owns its dialog (`AddFlatButton` and friends) instead of every
 * page having to hoist that state just to reach the bar.
 */
let title: string | null = null;
let backHref: string | null = null;
const actions = new Map<string, PageAction>();

let snapshot: PageChromeState = EMPTY;
const listeners = new Set<() => void>();

function emit() {
  // A fresh object each time, since useSyncExternalStore compares with Object.is.
  snapshot = { title, backHref, actions: [...actions.values()] };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => snapshot;
// The server has no active screen; the bar renders neutral and the real values
// arrive on hydration.
const getServerSnapshot = () => EMPTY;

/** Read the current screen's app-bar contents. For the shell only. */
export function usePageChrome(): PageChromeState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Declare the mobile app bar's title (and back target) for this screen.
 * Renders nothing. Every screen under `(app)` should render one.
 *
 *   <PageChrome title="Flats" />
 *   <PageChrome title={`Flat ${n}`} backHref="/flats" />
 */
export function PageChrome({
  title: pageTitle,
  backHref: pageBackHref = null,
}: {
  title: string;
  backHref?: string | null;
}) {
  useBeforePaint(() => {
    title = pageTitle;
    backHref = pageBackHref;
    emit();
    return () => {
      // Clear on unmount so a screen without its own chrome can't inherit the
      // previous screen's title mid-navigation.
      title = null;
      backHref = null;
      emit();
    };
  }, [pageTitle, pageBackHref]);

  return null;
}

/**
 * Add an icon button to the app bar's right slot. Renders nothing.
 *
 * Render it next to the desktop button it mirrors, inside whichever component
 * owns the dialog — that component keeps its own state and the bar just gets a
 * way to trigger it:
 *
 *   <Button onClick={() => setOpen(true)}>Add Flat</Button>
 *   <AppBarAction icon={Plus} label="Add Flat" onClick={() => setOpen(true)} />
 *
 * Actions appear in mount order.
 */
export function AppBarAction({ icon, label, onClick, href }: PageAction) {
  const id = useId();
  // The handler is almost always a fresh closure each render. Holding it in a
  // ref keeps it out of the effect's dependencies, so the bar re-registers only
  // when something it actually displays changes.
  const handler = useRef(onClick);

  useEffect(() => {
    handler.current = onClick;
  });

  useBeforePaint(() => {
    actions.set(id, { icon, label, href, onClick: () => handler.current?.() });
    emit();
    return () => {
      actions.delete(id);
      emit();
    };
  }, [id, icon, label, href]);

  return null;
}
