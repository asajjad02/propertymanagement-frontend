/** Small client-side form validation helpers + server error mapping. */
import type { ApiError } from '@/types/http';

export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validators = {
  required: (value: string, label = 'This field') => (value.trim() ? null : `${label} is required.`),
  email: (value: string) => (EMAIL_RE.test(value.trim()) ? null : 'Enter a valid email address.'),
  minLength: (value: string, min: number) =>
    value.length >= min ? null : `Must be at least ${min} characters.`,
};

/** Password strength rules — mirrored in the live checklist on registration. */
export interface PasswordRule {
  label: string;
  test: (value: string) => boolean;
}

export const passwordRules: PasswordRule[] = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'An uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'A lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'A number', test: (v) => /\d/.test(v) },
  { label: 'A special character (!@#$%^&*)', test: (v) => /[!@#$%^&*]/.test(v) },
];

export function passwordSatisfiesAll(value: string): boolean {
  return passwordRules.every((rule) => rule.test(value));
}

/** Run a map of field → validator fns; returns only fields that failed. */
export function runValidators(rules: Record<string, () => string | null>): FieldErrors {
  const errors: FieldErrors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const message = rule();
    if (message) errors[field] = message;
  }
  return errors;
}

/**
 * Flatten a DRF `ApiError` into `{ field: firstMessage }`. Non-field errors
 * (e.g. `detail`, `non_field_errors`) are collected under the `_form` key.
 */
export function serverFieldErrors(error: ApiError): FieldErrors {
  const out: FieldErrors = {};
  if (error.fieldErrors) {
    for (const [field, messages] of Object.entries(error.fieldErrors)) {
      const key = field === 'non_field_errors' || field === 'detail' ? '_form' : field;
      if (messages[0]) out[key] = messages[0];
    }
  }
  if (!Object.keys(out).length) out._form = error.message;
  return out;
}
