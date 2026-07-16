'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { VerifyEmailForm } from '@/components/auth/verify-email-form';

function VerifyColumn() {
  const email = useSearchParams().get('email') ?? '';
  return <VerifyEmailForm initialEmail={email} />;
}

export default function VerifyEmailPage() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense fallback={null}>
      <VerifyColumn />
    </Suspense>
  );
}
