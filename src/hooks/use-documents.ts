/** Query + mutations for documents attached to a given entity. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { deleteDocument, listDocuments, uploadDocument } from '@/api/documents';
import type { DocumentTarget, DocumentUploadInput } from '@/types/api';

function keyFor(relatedModel: DocumentTarget, relatedId: number) {
  return ['documents', relatedModel, relatedId] as const;
}

export function useDocuments(relatedModel: DocumentTarget, relatedId: number | undefined) {
  return useQuery({
    queryKey: keyFor(relatedModel, relatedId ?? -1),
    queryFn: () => listDocuments(relatedModel, relatedId as number),
    enabled: relatedId != null,
  });
}

export function useUploadDocument(relatedModel: DocumentTarget, relatedId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<DocumentUploadInput, 'related_model' | 'related_id'>) =>
      uploadDocument({ ...input, related_model: relatedModel, related_id: relatedId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keyFor(relatedModel, relatedId) }),
  });
}

export function useDeleteDocument(relatedModel: DocumentTarget, relatedId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: keyFor(relatedModel, relatedId) }),
  });
}
