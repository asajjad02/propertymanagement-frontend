'use client';

/**
 * Auth context: the single source of truth for the current user, account, and
 * role. It bootstraps the session from a stored token by calling `/auth/me/`,
 * exposes login/register/logout, and resets itself when tokens are cleared
 * (e.g. a failed refresh inside the axios interceptor forces a logout).
 *
 * This is state plumbing only — routing/redirects and any UI are intentionally
 * left to the components built later.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import * as authApi from '@/api/auth';
import { queryKeys } from '@/lib/query-keys';
import { getAccessToken, getRefreshToken, onTokensCleared } from '@/lib/token-storage';
import type {
  Account,
  LoginInput,
  RegisterInput,
  Role,
  User,
} from '@/types/api';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  account: Account | null;
  role: Role | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  /** True after a role check passes; `null`/empty roles means "any role". */
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function hasStoredToken(): boolean {
  return !!getAccessToken() || !!getRefreshToken();
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  // Tracks whether a token exists at all; gates the `/me` query and flips on
  // login/logout without needing a full refetch to change `enabled`.
  const [tokenPresent, setTokenPresent] = useState(false);

  useEffect(() => {
    setTokenPresent(hasStoredToken());
    // A forced logout (cleared tokens) should collapse auth state immediately.
    return onTokensCleared(() => {
      setTokenPresent(false);
      queryClient.removeQueries({ queryKey: queryKeys.auth.me });
    });
  }, [queryClient]);

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
      setTokenPresent(true);
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
    [queryClient],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      await authApi.register(input);
      setTokenPresent(true);
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
    },
    [queryClient],
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setTokenPresent(false);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => {
    const me = meQuery.data ?? null;
    let status: AuthStatus;
    if (!tokenPresent) {
      status = 'unauthenticated';
    } else if (meQuery.isPending) {
      status = 'loading';
    } else if (meQuery.isError) {
      status = 'unauthenticated';
    } else {
      status = 'authenticated';
    }

    const role = me?.role ?? null;
    return {
      status,
      user: me?.user ?? null,
      account: me?.account ?? null,
      role,
      isAuthenticated: status === 'authenticated',
      login,
      register,
      logout,
      hasRole: (...roles: Role[]) => (roles.length === 0 ? !!role : !!role && roles.includes(role)),
    };
  }, [meQuery.data, meQuery.isPending, meQuery.isError, tokenPresent, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>.');
  return ctx;
}
