/**
 * Access/refresh token persistence.
 *
 * Tokens live in `localStorage` so the session survives reloads. The access
 * token is short-lived (15 min) and the refresh token rotates on every use
 * (`ROTATE_REFRESH_TOKENS`), so both must be re-written after each refresh.
 *
 * `onCleared` lets the auth layer react to a forced logout (e.g. when a refresh
 * fails) even when it happens deep inside the axios interceptor.
 */
import type { TokenPair } from '@/types/api';

const ACCESS_KEY = 'hr.access';
const REFRESH_KEY = 'hr.refresh';

const isBrowser = typeof window !== 'undefined';

export function getAccessToken(): string | null {
  return isBrowser ? window.localStorage.getItem(ACCESS_KEY) : null;
}

export function getRefreshToken(): string | null {
  return isBrowser ? window.localStorage.getItem(REFRESH_KEY) : null;
}

export function setTokens(tokens: TokenPair): void {
  if (!isBrowser) return;
  window.localStorage.setItem(ACCESS_KEY, tokens.access);
  window.localStorage.setItem(REFRESH_KEY, tokens.refresh);
}

/** Update only the access token (used when a refresh response omits a new refresh). */
export function setAccessToken(access: string): void {
  if (!isBrowser) return;
  window.localStorage.setItem(ACCESS_KEY, access);
}

const clearListeners = new Set<() => void>();

export function clearTokens(): void {
  if (isBrowser) {
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  }
  clearListeners.forEach((fn) => fn());
}

/** Subscribe to token clearing; returns an unsubscribe function. */
export function onTokensCleared(listener: () => void): () => void {
  clearListeners.add(listener);
  return () => clearListeners.delete(listener);
}
