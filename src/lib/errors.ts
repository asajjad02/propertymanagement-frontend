/** Normalize axios/DRF errors into the app's `ApiError` shape. */
import axios from 'axios';

import type { ApiError } from '@/types/http';

export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const data = error.response?.data as unknown;

    // DRF: { detail: "..." }
    if (data && typeof data === 'object' && 'detail' in data) {
      const detail = (data as { detail: unknown }).detail;
      return { status, message: String(detail) };
    }

    // DRF field errors: { field: ["msg", ...], non_field_errors: [...] }
    if (data && typeof data === 'object') {
      const fieldErrors: Record<string, string[]> = {};
      for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        fieldErrors[key] = Array.isArray(value) ? value.map(String) : [String(value)];
      }
      const first = Object.values(fieldErrors)[0]?.[0];
      return {
        status,
        message: first ?? 'Request failed.',
        fieldErrors,
      };
    }

    return {
      status,
      message: status === 0 ? 'Network error. Is the API reachable?' : error.message,
    };
  }

  return { status: 0, message: error instanceof Error ? error.message : 'Unknown error.' };
}
