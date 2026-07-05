'use client';

/** Composes the app-wide client providers. Rendered once in the root layout. */
import { AuthProvider } from './auth-provider';
import { QueryProvider } from './query-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>{children}</AuthProvider>
    </QueryProvider>
  );
}
