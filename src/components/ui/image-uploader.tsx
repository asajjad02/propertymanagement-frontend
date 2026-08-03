'use client';

import { ImagePlus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { cn } from '@/lib/cn';
import { toJpegFile } from '@/lib/image';

/*
 * Anything the browser can decode, not just PNG/JPEG. What's picked and what's
 * uploaded are no longer the same file: every image is re-encoded as a JPEG
 * (see lib/image), so an iPhone's HEIC and a 48 MP original both arrive as
 * something the API accepts and small enough to send.
 */
const DEFAULT_ACCEPT = 'image/*';

export interface ImageUploaderProps {
  value: File[];
  onChange: (files: File[]) => void;
  /** Comma-separated MIME allowlist (default PNG/JPEG). */
  accept?: string;
  /** Max number of images (default 10). */
  max?: number;
  className?: string;
}

/** Multi-image picker with drag-and-drop, previews, and client-side validation. */
export function ImageUploader({
  value,
  onChange,
  accept = DEFAULT_ACCEPT,
  max = 10,
  className,
}: ImageUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  /*
   * Derived, not stored. Creating the URLs in an effect and setting state meant a
   * render with previews one step behind the files — a newly added photo showed
   * the previous one's image until the effect caught up. The effect that remains
   * only revokes, which is what an effect is for.
   */
  const previews = useMemo(() => value.map((file) => URL.createObjectURL(file)), [value]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  /*
   * Converted rather than validated. Rejecting a photo for its format or its size
   * is a dead end on a phone — it's the only copy they have — so each one is
   * re-encoded to a JPEG within the size limit instead. Only a format the browser
   * genuinely can't read is refused, and then it says which ones.
   */
  async function add(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);
    const room = max - value.length;
    const picked = Array.from(files).slice(0, room);
    if (Array.from(files).length > room) setError(`You can add up to ${max} images.`);

    const converted: File[] = [];
    const failed: string[] = [];
    for (const file of picked) {
      try {
        converted.push(await toJpegFile(file));
      } catch {
        failed.push(file.name);
      }
    }
    if (failed.length) {
      setError(
        `Couldn’t read ${failed.join(', ')}. This browser can’t open that format — ` +
          'try a JPEG or PNG.',
      );
    }
    setBusy(false);
    if (converted.length) onChange([...value, ...converted]);
  }

  const atMax = value.length >= max;

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {value.map((file, i) => (
          <div key={`${file.name}-${i}`} className="relative h-20 w-20 overflow-hidden rounded-control border border-hairline">
            {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview */}
            <img src={previews[i]} alt={file.name} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              aria-label={`Remove ${file.name}`}
              className="absolute right-0.5 top-0.5 rounded-pill bg-black/60 p-0.5 text-white hover:bg-black/80"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}

        {!atMax && (
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void add(e.dataTransfer.files);
            }}
            className={cn(
              'flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-control border border-dashed text-center',
              'text-muted transition-colors hover:border-primary hover:text-ink',
              dragging ? 'border-primary bg-primary-soft/40 text-ink' : 'border-hairline bg-raised',
            )}
          >
            <ImagePlus className={cn('h-4 w-4', busy && 'animate-pulse')} />
            <span className="text-[0.625rem] leading-tight">{busy ? 'Working…' : 'Add'}</span>
            <input
              type="file"
              accept={accept}
              multiple
              className="hidden"
              onChange={(e) => {
                void add(e.target.files);
                // Reset, so re-picking the same file still fires a change.
                e.target.value = '';
              }}
            />
          </label>
        )}
      </div>
      {/* No format or size rule to state: photos are converted to fit, not refused. */}
      <p className="mt-1 text-xs text-faint">
        Photos are resized for upload · {value.length}/{max}
      </p>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
