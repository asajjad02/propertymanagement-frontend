'use client';

import { Download, FileText, Plus, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';

import { downloadDocument } from '@/api/documents';
import { DocumentImage } from '@/components/documents/document-image';
import { UploadDocumentDialog } from '@/components/documents/upload-document-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingBlock } from '@/components/ui/spinner';
import { useDeleteDocument, useDocuments } from '@/hooks/use-documents';
import { shortDate } from '@/lib/format';
import { useAuth } from '@/providers/auth-provider';
import type { AppDocument, DocumentTarget } from '@/types/api';

async function triggerDownload(doc: AppDocument) {
  const blob = await downloadDocument(doc.id);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = doc.file_name;
  a.click();
  URL.revokeObjectURL(url);
}

/** Documents attached to an entity: list, upload, download, delete. */
export function DocumentList({
  relatedModel,
  relatedId,
  title = 'Documents',
  documentTypes,
}: {
  relatedModel: DocumentTarget;
  relatedId: number;
  title?: string;
  documentTypes?: string[];
}) {
  const { hasRole } = useAuth();
  const { data, isPending } = useDocuments(relatedModel, relatedId);
  const del = useDeleteDocument(relatedModel, relatedId);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleting, setDeleting] = useState<AppDocument | null>(null);
  const canWrite = hasRole('admin', 'manager', 'accountant');
  const docs = data?.results ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {canWrite && (
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4" />
            Upload
          </Button>
        )}
      </CardHeader>

      {isPending ? (
        <LoadingBlock />
      ) : docs.length === 0 ? (
        <EmptyState
          icon={Upload}
          title="No documents"
          description={canWrite ? 'Upload a CNIC copy, tenancy agreement, or other file.' : undefined}
          className="py-8"
        />
      ) : (
        <ul className="divide-y divide-hairline">
          {docs.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 px-5 py-3">
              {doc.content_type.startsWith('image/') ? (
                <DocumentImage doc={doc} className="h-10 w-10" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-control bg-paper">
                  <FileText className="h-4 w-4 text-muted" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">{doc.file_name}</p>
                <p className="text-xs text-muted">
                  {doc.document_type || 'Document'} · {shortDate(doc.uploaded_at)}
                </p>
              </div>
              <button onClick={() => triggerDownload(doc)} aria-label="Download"
                className="rounded-control p-1.5 text-muted hover:bg-raised hover:text-ink">
                <Download className="h-4 w-4" />
              </button>
              {canWrite && (
                <button onClick={() => setDeleting(doc)} aria-label="Delete"
                  className="rounded-control p-1.5 text-muted hover:bg-raised hover:text-danger">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canWrite && (
        <UploadDocumentDialog
          relatedModel={relatedModel}
          relatedId={relatedId}
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          documentTypes={documentTypes}
        />
      )}
      <ConfirmDialog
        open={deleting != null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete document?"
        description={deleting ? `“${deleting.file_name}” will be permanently removed.` : undefined}
        confirmLabel="Delete"
        danger
        loading={del.isPending}
        onConfirm={() => deleting && del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </Card>
  );
}
