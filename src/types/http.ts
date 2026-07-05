/** Shared HTTP shapes for talking to the DRF backend. */

/** DRF `PageNumberPagination` envelope (PAGE_SIZE = 20). */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Query params accepted by the list endpoints. DRF wires up
 * DjangoFilterBackend (`filterset_fields`), SearchFilter (`search`), and
 * OrderingFilter (`ordering`) globally, plus `page` for pagination.
 *
 * `filters` holds per-viewset `filterset_fields` (e.g. `{ status: 'issued' }`);
 * its values are stringified when the request is built.
 */
export interface ListParams {
  page?: number;
  search?: string;
  /** Field name, prefix with `-` for descending (e.g. `-created_at`). */
  ordering?: string;
  filters?: Record<string, string | number | boolean | undefined>;
}

/**
 * Normalized API error surfaced to the UI. DRF returns either
 * `{ detail: string }` or a map of `{ field: string[] }`; both are flattened
 * into `message`, with the raw field errors preserved in `fieldErrors`.
 */
export interface ApiError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string[]>;
}
