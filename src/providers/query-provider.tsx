'use client';

/**
 * TanStack Query provider. The QueryClient is created lazily in state so it is
 * instantiated once per browser session (not recreated on re-render, and not
 * shared across requests on the server).
 */
import {
  QueryClient,
  QueryClientProvider,
  isServer,
  keepPreviousData,
} from '@tanstack/react-query';
import { useState } from 'react';

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data changes rarely relative to how often screens are revisited, so
        // cache generously: within this window a revisit is instant (no refetch),
        // and results stay in memory for 10 min for back/forward navigation.
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        // When query params change (filter, search, page, tab), keep showing the
        // previous results until the new ones arrive instead of flashing a
        // spinner — the single biggest perceived-latency win on list screens.
        placeholderData: keepPreviousData,
        retry: (failureCount, error) => {
          // Don't retry auth failures; the interceptor already tried to refresh.
          const status = (error as { status?: number })?.status;
          if (status === 401 || status === 403) return false;
          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(getQueryClient);
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
