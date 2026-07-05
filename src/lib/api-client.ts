/**
 * Axios instance for the DRF API.
 *
 * - Request interceptor attaches the bearer access token.
 * - Response interceptor transparently refreshes the access token on a 401 and
 *   retries the original request once. Concurrent 401s share a single in-flight
 *   refresh (single-flight) so we never fire N parallel refreshes.
 * - If the refresh fails, tokens are cleared, which notifies the auth layer to
 *   send the user back to login.
 *
 * The `/auth/login`, `/auth/register`, and `/auth/refresh` endpoints are exempt
 * from the refresh-retry loop to avoid recursion.
 */
import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { API_URL } from './config';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from './token-storage';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

/** Endpoints that must never trigger the refresh-and-retry flow. */
const AUTH_EXEMPT = ['/auth/login/', '/auth/register/', '/auth/refresh/'];

function isAuthExempt(url: string | undefined): boolean {
  return !!url && AUTH_EXEMPT.some((path) => url.includes(path));
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !isAuthExempt(config.url)) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// Single-flight refresh: the first 401 kicks off a refresh; everyone else
// awaits the same promise.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error('No refresh token available.');

  // Bare axios (not `apiClient`) so this call skips the interceptors.
  const { data } = await axios.post<{ access: string; refresh?: string }>(
    `${API_URL}/auth/refresh/`,
    { refresh },
    { headers: { 'Content-Type': 'application/json' } },
  );

  // Rotation is on, so the response includes a fresh refresh token too.
  setTokens({ access: data.access, refresh: data.refresh ?? refresh });
  return data.access;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    const canRetry =
      error.response?.status === 401 &&
      original &&
      !original._retried &&
      !isAuthExempt(original.url) &&
      !!getRefreshToken();

    if (!canRetry) {
      return Promise.reject(error);
    }

    original._retried = true;
    try {
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const access = await refreshPromise;
      original.headers.set('Authorization', `Bearer ${access}`);
      return apiClient(original);
    } catch (refreshError) {
      clearTokens();
      return Promise.reject(refreshError);
    }
  },
);
