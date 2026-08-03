'use client';

import { Camera, Check, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/cn';

/** 4:3 — a meter dial is wider than tall, and it matches what phones shoot. */
const ASPECT = 4 / 3;
/** Longest edge of the saved photo. Enough to read a dial, small enough to send
 *  over mobile data and to stay well inside the server's 10 MB limit. */
const MAX_EDGE = 1600;
const QUALITY = 0.85;

/**
 * Pick or shoot a meter photo, frame it, and hand back a small JPEG.
 *
 * No `capture` attribute on the input, deliberately: with it, phones go straight
 * to the camera and there is no way to reach an existing photo. Without it they
 * offer camera *and* library, which is what someone re-reading a meter from a
 * picture taken earlier actually needs.
 *
 * The crop step isn't only framing. Everything goes through a canvas, and canvas
 * output is always JPEG — so an iPhone's HEIC (which the API rejects: only
 * jpeg/png/pdf are allowed) becomes something the server accepts, and a 12 MP
 * original comes out under the 10 MB upload limit instead of over it.
 */
export function MeterPhotoField({
  value,
  onChange,
  label = 'Meter photo',
  compact = false,
}: {
  value: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  /** Icon-only tile, for the meter round's cramped two-row layout. */
  compact?: boolean;
}) {
  const [source, setSource] = useState<ImageBitmap | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      // `from-image` applies the EXIF rotation, so a portrait shot doesn't come
      // out sideways — the canvas ignores EXIF otherwise.
      setSource(await createImageBitmap(file, { imageOrientation: 'from-image' }));
    } catch {
      // Android Chrome can't decode HEIC. Say so, rather than letting the server
      // reject it later with a content-type error nobody can act on.
      setError('That image couldn’t be read. Take a photo, or pick a JPEG or PNG.');
    }
  }

  function onCropped(file: File) {
    onChange(file);
    source?.close();
    setSource(null);
  }

  return (
    <>
      <label
        className={cn(
          'inline-flex cursor-pointer items-center justify-center gap-2 rounded-control border text-sm transition-colors',
          compact ? 'h-14 w-14 shrink-0 sm:h-12 sm:w-12' : 'h-11 w-full px-3',
          value
            ? 'border-ok bg-ok-soft text-ok'
            : 'border-dashed border-muted/60 text-ink-secondary hover:border-muted',
        )}
        aria-label={value ? `${label} attached — tap to replace` : `${label} (required)`}
      >
        {value ? <Check className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
        {!compact && <span>{value ? 'Photo attached' : 'Take or choose a photo'}</span>}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            void onPick(e.target.files?.[0]);
            // Reset so picking the same file twice still fires a change.
            e.target.value = '';
          }}
        />
      </label>

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}

      <Modal
        open={source !== null}
        onOpenChange={(open) => {
          if (!open) {
            source?.close();
            setSource(null);
          }
        }}
        title="Frame the meter"
        description="Drag to position, zoom so the digits fill the frame."
      >
        {source && <Cropper source={source} onDone={onCropped} />}
      </Modal>
    </>
  );
}

function Cropper({ source, onDone }: { source: ImageBitmap; onDone: (file: File) => void }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => setFrame({ w: el.clientWidth, h: el.clientWidth / ASPECT });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Cover-fit, so the frame is never left with an empty strip down one side.
  const base = frame.w ? Math.max(frame.w / source.width, frame.h / source.height) : 1;
  const scale = base * zoom;
  const shownW = source.width * scale;
  const shownH = source.height * scale;

  /** Keep the image covering the frame — panning can't reveal a gap. */
  const clamp = (o: { x: number; y: number }) => ({
    x: Math.min(0, Math.max(frame.w - shownW, o.x)),
    y: Math.min(0, Math.max(frame.h - shownH, o.y)),
  });

  /*
   * Clamped on read, not corrected in an effect. Zooming out shrinks the valid
   * range, so a stored offset can fall outside it — fixing that up afterwards
   * means a second render showing the stale position first. Deriving it here,
   * the frame is never drawn from an offset the crop wouldn't also use.
   */
  const view = clamp(offset);

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: view.x, oy: view.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    setOffset(clamp({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) }));
  }

  function save() {
    // What the frame shows, back in the source image's own coordinates.
    const sx = -view.x / scale;
    const sy = -view.y / scale;
    const sw = frame.w / scale;
    const sh = frame.h / scale;

    const outW = Math.min(MAX_EDGE, Math.round(sw));
    const outH = Math.round(outW / ASPECT);
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        // Named, not 'blob': the filename is what lands in the document record.
        onDone(new File([blob], `meter-${Date.now()}.jpg`, { type: 'image/jpeg' }));
      },
      'image/jpeg',
      QUALITY,
    );
  }

  return (
    <div className="space-y-4">
      <div
        ref={frameRef}
        style={{ height: frame.h || undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={() => (drag.current = null)}
        className="relative w-full cursor-grab touch-none overflow-hidden rounded-card bg-raised active:cursor-grabbing"
      >
        {/* The bitmap is drawn rather than shown in an <img> so panning and the
            saved crop use one set of numbers instead of two. */}
        <BitmapCanvas source={source} width={shownW} height={shownH} x={view.x} y={view.y} />
      </div>

      <label className="flex items-center gap-3">
        <span className="text-xs text-muted">Zoom</span>
        <input
          type="range"
          min={1}
          max={4}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="h-11 flex-1 md:h-6"
          aria-label="Zoom"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setZoom(1);
            setOffset({ x: 0, y: 0 });
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </label>

      <Button type="button" onClick={save} className="w-full" disabled={!frame.w}>
        Use this photo
      </Button>
    </div>
  );
}

/** Paints the bitmap at a given size/offset, in step with the pan and zoom. */
function BitmapCanvas({
  source,
  width,
  height,
  x,
  y,
}: {
  source: ImageBitmap;
  width: number;
  height: number;
  x: number;
  y: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !width || !height) return;
    // Device pixels, so the preview isn't soft on a phone screen.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(source, 0, 0, canvas.width, canvas.height);
  }, [source, width, height]);

  return (
    <canvas
      ref={ref}
      style={{ width, height, transform: `translate(${x}px, ${y}px)` }}
      className="absolute left-0 top-0 origin-top-left"
    />
  );
}
