'use client';

import { Paperclip } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FormActions } from '@/components/ui/form-actions';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { useUploadDocument } from '@/hooks/use-documents';
import { toApiError } from '@/lib/errors';
import { toJpegFile } from '@/lib/image';
import type { DocumentTarget } from '@/types/api';

/*
 * Images broadly, PDFs as they are. An iPhone hands over HEIC, which the API
 * doesn't accept — so an image is re-encoded here (see lib/image) rather than
 * refused. A PDF is passed through untouched: it isn't an image and mustn't be
 * turned into one.
 */
const ACCEPT = 'application/pdf,image/*';
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

  const [preparing, setPreparing] = useState(false);

  async function pick(f: File | null) {
    setError(null);
    if (!f) return setFile(null);

    if (f.type.startsWith('image/')) {
      // Converted, not measured: a phone photo clears 10 MB easily, and rejecting
      // it is a dead end when it's the only copy someone has.
      setPreparing(true);
      try {
        setFile(await toJpegFile(f));
      } catch {
        setError('That image couldn’t be read. Try a JPEG, a PNG, or a PDF.');
      } finally {
        setPreparing(false);
      }
      return;
    }

    // A PDF can't be shrunk here, so the limit still applies to it.
    if (f.size > MAX_MB * 1024 * 1024) return setError(`File must be under ${MAX_MB} MB.`);
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
    <Modal open={open} onOpenChange={onOpenChange} title="Upload document" description="A photo or a PDF. Photos are resized for upload.">
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
                onChange={(e) => void pick(e.target.files?.[0] ?? null)} />
              <button type="button" onClick={() => inputRef.current?.click()}
                className="flex w-full items-center gap-2 rounded-control border border-dashed border-hairline bg-raised px-3 py-3 text-sm text-muted hover:border-primary hover:text-ink">
                <Paperclip className="h-4 w-4" />
                {file ? file.name : 'Choose a file'}
              </button>
            </>
          )}
        </Field>
        {error && <p className="text-sm text-danger">{error}</p>}
        <FormActions>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} className="hidden md:inline-flex">Cancel</Button>
          <Button
            type="submit"
            loading={upload.isPending || preparing}
            disabled={upload.isPending || preparing || !file}
          >
            {preparing ? 'Preparing…' : 'Upload'}
          </Button>
        </FormActions>
      </form>
    </Modal>
  );
}
