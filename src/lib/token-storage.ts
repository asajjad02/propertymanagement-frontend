/**
 * Access/refresh token persistence, exposed as a tiny observable store so React
 * can read presence via `useSyncExternalStore` (no setState-in-effect needed).
 *
 * Tokens live in `localStorage` so the session survives reloads. The access
 * token is short-lived (15 min) and the refresh token rotates on every use
 * (`ROTATE_REFRESH_TOKENS`), so both must be re-written after each refresh.
 * Every write/clear notifies subscribers.
 */
import type { TokenPair } from '@/types/api';

const ACCESS_KEY = 'hr.access';
const REFRESH_KEY = 'hr.refresh';

const isBrowser = typeof window !== 'undefined';

const listeners = new Set<() => void>();

function notify(): void {
  listeners.forEach((fn) => fn());
}

/** Subscribe to any token change (set/clear). Returns an unsubscribe fn. */
export function subscribeTokens(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getAccessToken(): string | null {
  return isBrowser ? window.localStorage.getItem(ACCESS_KEY) : null;
}

export function getRefreshToken(): string | null {
  return isBrowser ? window.localStorage.getItem(REFRESH_KEY) : null;
}

/** Snapshot: is there any stored token? Stable primitive for useSyncExternalStore. */
export function hasStoredToken(): boolean {
  return !!getAccessToken() || !!getRefreshToken();
}

export function setTokens(tokens: TokenPair): void {
  if (!isBrowser) return;
  window.localStorage.setItem(ACCESS_KEY, tokens.access);
  window.localStorage.setItem(REFRESH_KEY, tokens.refresh);
  notify();
}

/** Update only the access token (used when a refresh response omits a new refresh). */
export function setAccessToken(access: string): void {
  if (!isBrowser) return;
  window.localStorage.setItem(ACCESS_KEY, access);
  notify();
}

export function clearTokens(): void {
  if (isBrowser) {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  }
  notify();
}
