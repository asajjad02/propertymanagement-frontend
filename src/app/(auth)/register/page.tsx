'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { BrandPanel } from '@/components/auth/brand-panel';
import { RegisterForm } from '@/components/auth/register-form';
import { useAuth } from '@/providers/auth-provider';

/** Registration: form column + decorative brand panel. Mirrors the login split. */
export default function RegisterPage() {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') router.replace('/flats');
  }, [status, router]);

  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <RegisterForm />
      </div>
      <div className="hidden lg:block">
        <BrandPanel />
      </div>
    </div>
  );
}
