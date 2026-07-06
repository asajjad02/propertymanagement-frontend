/**
 * Document uploads. Unlike the JSON resources, this endpoint takes multipart
 * form data (a real file), so it can't use the generic createResource.
 */
import { apiClient } from '@/lib/api-client';
import type { AppDocument, DocumentTarget, DocumentUploadInput } from '@/types/api';
import type { Paginated } from '@/types/http';

/** Upload a file attached to an account entity (e.g. a complaint photo). */
export async function uploadDocument(input: DocumentUploadInput): Promise<AppDocument> {
  const form = new FormData();
  form.append('file', input.file);
  form.append('related_model', input.related_model);
  form.append('related_id', String(input.related_id));
  if (input.document_type) form.append('document_type', input.document_type);

  // The request interceptor drops the JSON content-type for FormData so the
  // browser sets multipart/form-data with the proper boundary.
  const { data } = await apiClient.post<AppDocument>('/documents/', form);
  return data;
}

/** List documents attached to a given entity. */
export async function listDocuments(
  relatedModel: DocumentTarget,
  relatedId: number,
): Promise<Paginated<AppDocument>> {
  const { data } = await apiClient.get<Paginated<AppDocument>>('/documents/', {
    params: { related_model: relatedModel, related_id: relatedId },
  });
  return data;
}

export async function deleteDocument(id: number): Promise<void> {
  await apiClient.delete(`/documents/${id}/`);
}

/** Fetch a document's bytes (authed) — the download endpoint requires a token. */
export async function downloadDocument(id: number): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/documents/${id}/download/`, {
    responseType: 'blob',
  });
  return data;
}
