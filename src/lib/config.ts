/** Runtime configuration sourced from `NEXT_PUBLIC_*` environment variables. */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and set it.`,
    );
  }
  return value.replace(/\/$/, '');
}

/** Base URL of the Django REST API, including the `/api` suffix, no trailing slash. */
export const API_URL = required('NEXT_PUBLIC_API_URL', process.env.NEXT_PUBLIC_API_URL);

/**
 * Whether the email-verification step is active. When `false` (the current
 * backend default), `/auth/register/` returns a token pair and the user is
 * signed straight into the app. Set `NEXT_PUBLIC_EMAIL_VERIFICATION=true` once
 * the backend re-enables the OTP flow. Defaults to off when unset.
 */
export const EMAIL_VERIFICATION_ENABLED =
  process.env.NEXT_PUBLIC_EMAIL_VERIFICATION === 'true';
