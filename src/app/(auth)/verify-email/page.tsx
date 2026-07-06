'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { BrandPanel } from '@/components/auth/brand-panel';
import { VerifyEmailForm } from '@/components/auth/verify-email-form';

function VerifyColumn() {
  const email = useSearchParams().get('email') ?? '';
  return <VerifyEmailForm initialEmail={email} />;
}

/** Email verification step after registration. No app shell. */
export default function VerifyEmailPage() {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        {/* useSearchParams needs a Suspense boundary during prerender. */}
        <Suspense fallback={null}>
          <VerifyColumn />
        </Suspense>
      </div>
      <div className="hidden lg:block">
        <BrandPanel />
      </div>
    </div>
  );
}
