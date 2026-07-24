'use client';

/**
 * Auth context: the single source of truth for the current user, account, and
 * role. It bootstraps the session from a stored token by calling `/auth/me/`,
 * exposes login/register/logout, and reacts to token changes (including a
 * forced logout when a refresh fails inside the axios interceptor).
 *
 * Token presence is read via `useSyncExternalStore` from the token store, so no
 * effect is needed to keep it in sync.
 *
 * This is state plumbing only — routing/redirects and any UI live in components.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from 'react';

import * as authApi from '@/api/auth';
import { queryKeys } from '@/lib/query-keys';
import { hasStoredToken, subscribeTokens } from '@/lib/token-storage';
import type {
  Account,
  LoginInput,
  RegisterInput,
  RegisterResponse,
  Role,
  User,
  VerifyEmailInput,
} from '@/types/api';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  account: Account | null;
  role: Role | null;
  isAuthenticated: boolean;
  /** Username of the superuser impersonating this session, or null. */
  impersonatedBy: string | null;
  login: (input: LoginInput) => Promise<void>;
  /** Exchange an admin-issued impersonation ticket for a target-user session. */
  impersonate: (ticket: string) => Promise<void>;
  /**
   * Registers a user. Signs in immediately when the backend returns tokens
   * (email verification disabled); otherwise verification is required next.
   */
  register: (input: RegisterInput) => Promise<RegisterResponse>;
  /** Verifies the email OTP; on success the session is established. */
  verifyEmail: (input: VerifyEmailInput) => Promise<void>;
  logout: () => Promise<void>;
  /** True after a role check passes; empty roles means "any role". */
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const tokenPresent = useSyncExternalStore(subscribeTokens, hasStoredToken, () => false);

  const meQuery = useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authApi.fetchMe,
    enabled: tokenPresent,
    staleTime: 5 * 60_000,
    retry: false,
  });

  const login = useCallback(
    async (input: LoginInput) => {
      await authApi.login(input);
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
    [queryClient],
  );

  const impersonate = useCallback(
    async (ticket: string) => {
      await authApi.impersonate(ticket);
      // The previous session's `me` is cached — force a refetch as the target.
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
    [queryClient],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const res = await authApi.register(input);
      // If the backend returned tokens, the session is now live — refresh `me`.
      if (res.access && res.refresh) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      }
      return res;
    },
    [queryClient],
  );

  const verifyEmail = useCallback(
    async (input: VerifyEmailInput) => {
      await authApi.verifyEmail(input);
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => {
    const me = meQuery.data ?? null;
    let status: AuthStatus;
    if (!tokenPresent) status = 'unauthenticated';
    else if (meQuery.isPending) status = 'loading';
    else if (meQuery.isError) status = 'unauthenticated';
    else status = 'authenticated';

    const role = me?.role ?? null;
    return {
      status,
      user: me?.user ?? null,
      account: me?.account ?? null,
      role,
      isAuthenticated: status === 'authenticated',
      impersonatedBy: me?.impersonated_by ?? null,
      login,
      impersonate,
      register,
      verifyEmail,
      logout,
      hasRole: (...roles: Role[]) => (roles.length === 0 ? !!role : !!role && roles.includes(role)),
    };
  }, [meQuery.data, meQuery.isPending, meQuery.isError, tokenPresent, login, impersonate, register, verifyEmail, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>.');
  return ctx;
}
