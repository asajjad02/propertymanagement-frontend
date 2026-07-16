'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { BrandPanel } from '@/components/auth/brand-panel';
import { AtriumLogo } from '@/components/brand/atrium-logo';
import { useAuth } from '@/providers/auth-provider';

/**
 * Split auth shell: the decorative brand panel on the left, the form column on
 * the right. The logo lives on the panel (desktop) and only appears in the form
 * column on small screens where the panel is hidden — so it never shows twice.
 * Authenticated visitors are bounced to the app.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') router.replace('/');
  }, [status, router]);

  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:block">
        <BrandPanel />
      </div>
      <div className="flex min-h-dvh flex-col px-6 py-8 sm:px-10 lg:px-14">
        <header className="lg:hidden">
          <AtriumLogo markSize={30} />
        </header>
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          {children}
        </main>
        <footer className="text-xs text-faint">© {new Date().getFullYear()} Atrium</footer>
      </div>
    </div>
  );
}
