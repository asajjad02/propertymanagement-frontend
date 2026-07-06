'use client';

import { Paperclip } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { useUploadDocument } from '@/hooks/use-documents';
import { toApiError } from '@/lib/errors';
import type { DocumentTarget } from '@/types/api';

const ACCEPT = 'application/pdf,image/png,image/jpeg';
const MAX_MB = 10;
const DEFAULT_TYPES = ['CNIC', 'Tenancy Agreement', 'Other'];

/** Upload a single document (PDF/PNG/JPEG) against an entity. */
export function UploadDocumentDialog({
  relatedModel,
  relatedId,
  open,
  onOpenChange,
  documentTypes = DEFAULT_TYPES,
}: {
  relatedModel: DocumentTarget;
  relatedId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentTypes?: string[];
}) {
  const upload = useUploadDocument(relatedModel, relatedId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState(documentTypes[0] ?? '');
  const [error, setError] = useState<string | null>(null);

  function pick(f: File | null) {
    setError(null);
    if (f && f.size > MAX_MB * 1024 * 1024) return setError(`File must be under ${MAX_MB} MB.`);
    setFile(f);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setError('Choose a file to upload.');
    setError(null);
    try {
      await upload.mutateAsync({ file, document_type: type });
      setFile(null);
      onOpenChange(false);
    } catch (err) {
      setError(toApiError(err).message);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Upload document" description="PDF, PNG or JPEG, up to 10 MB.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Type">
          {(id) => (
            <Select id={id} value={type} onValueChange={setType} className="w-full"
              options={documentTypes.map((t) => ({ value: t, label: t }))} />
          )}
        </Field>
        <Field label="File">
          {() => (
            <>
              <input ref={inputRef} type="file" accept={ACCEPT} className="hidden"
                onChange={(e) => pick(e.target.files?.[0] ?? null)} />
              <button type="button" onClick={() => inputRef.current?.click()}
                className="flex w-full items-center gap-2 rounded-control border border-dashed border-hairline bg-raised px-3 py-3 text-sm text-muted hover:border-primary hover:text-ink">
                <Paperclip className="h-4 w-4" />
                {file ? file.name : 'Choose a file'}
              </button>
            </>
          )}
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" disabled={upload.isPending || !file}>Upload</Button>
        </div>
      </form>
    </Modal>
  );
}
