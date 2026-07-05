'use client';

import { BrandPanel } from '@/components/auth/brand-panel';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';

/** Password reset request: form column + decorative brand panel. */
export default function ForgotPasswordPage() {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <ForgotPasswordForm />
      </div>
      <div className="hidden lg:block">
        <BrandPanel />
      </div>
    </div>
  );
}
