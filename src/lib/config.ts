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
