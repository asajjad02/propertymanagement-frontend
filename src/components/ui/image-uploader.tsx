'use client';

import { ImagePlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/cn';

const DEFAULT_ACCEPT = 'image/png,image/jpeg';

export interface ImageUploaderProps {
  value: File[];
  onChange: (files: File[]) => void;
  /** Comma-separated MIME allowlist (default PNG/JPEG). */
  accept?: string;
  maxSizeMB?: number;
  /** Max number of images (default 10). */
  max?: number;
  className?: string;
}

/** Multi-image picker with drag-and-drop, previews, and client-side validation. */
export function ImageUploader({
  value,
  onChange,
  accept = DEFAULT_ACCEPT,
  maxSizeMB = 10,
  max = 10,
  className,
}: ImageUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const urls = value.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [value]);

  const allowed = accept.split(',');

  function add(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const accepted: File[] = [];
    for (const file of Array.from(files)) {
      if (!allowed.includes(file.type)) {
        setError('Only PNG or JPEG images are allowed.');
        continue;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`Each image must be under ${maxSizeMB} MB.`);
        continue;
      }
      accepted.push(file);
    }
    const room = max - value.length;
    if (accepted.length > room) setError(`You can add up to ${max} images.`);
    onChange([...value, ...accepted.slice(0, room)]);
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
              className="absolute right-0.5 top-0.5 rounded-pill bg-ink/70 p-0.5 text-white hover:bg-ink"
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
              add(e.dataTransfer.files);
            }}
            className={cn(
              'flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-control border border-dashed text-center',
              'text-muted transition-colors hover:border-primary hover:text-ink',
              dragging ? 'border-primary bg-primary-soft/40 text-ink' : 'border-hairline bg-raised',
            )}
          >
            <ImagePlus className="h-4 w-4" />
            <span className="text-[0.625rem] leading-tight">Add</span>
            <input type="file" accept={accept} multiple className="hidden" onChange={(e) => add(e.target.files)} />
          </label>
        )}
      </div>
      <p className="mt-1 text-xs text-faint">PNG or JPEG, up to {maxSizeMB} MB each · {value.length}/{max}</p>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
