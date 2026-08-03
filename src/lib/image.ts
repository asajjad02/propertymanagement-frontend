/**
 * Client-side image normalisation.
 *
 * Every image the app uploads goes through here, for two reasons that both bite
 * on a phone:
 *
 *  - **Format.** The API accepts only jpeg/png/pdf. An iPhone's library holds
 *    HEIC, and depending on how a photo is picked (Files app, "Keep Original",
 *    a photo AirDropped to a desktop) that's what the file input hands over.
 *    Canvas output is always JPEG, so converting here means the format the API
 *    sees never depends on which device or picker was used.
 *  - **Size.** A modern phone camera clears the 10 MB upload limit easily. A
 *    rejection at that point is useless — the photo is the only one they have —
 *    so it's scaled down instead.
 *
 * Decoding is the browser's job, so what's supported follows the browser: Safari
 * reads HEIC (it's Apple's format), Chrome and Firefox on desktop and Android
 * don't. `decodeImage` throws in that case, which is the caller's cue to say so
 * plainly rather than let the server reject it later.
 */

/** Longest edge for a general upload. Detail-preserving but well under the limit. */
const DEFAULT_MAX_EDGE = 2000;
const QUALITY = 0.85;

/**
 * Decode a file to a bitmap, with EXIF rotation applied.
 *
 * `imageOrientation: 'from-image'` matters: canvas ignores EXIF, so without it a
 * photo taken in portrait is drawn — and saved — on its side.
 *
 * Throws if the browser can't decode the format.
 */
export function decodeImage(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file, { imageOrientation: 'from-image' });
}

/**
 * Re-encode an image as a JPEG no larger than `maxEdge` on its longest side.
 *
 * Returns a `File`, not a `Blob`, and keeps a readable name — the filename is
 * what lands in the document record and what someone sees when they download it.
 */
export async function toJpegFile(
  file: File,
  maxEdge: number = DEFAULT_MAX_EDGE,
): Promise<File> {
  const bitmap = await decodeImage(file);
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas is unavailable.');
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', QUALITY),
    );
    if (!blob) throw new Error('Could not encode the image.');

    return new File([blob], jpegName(file.name), { type: 'image/jpeg' });
  } finally {
    // Bitmaps hold decoded pixels — on a 48 MP photo that's hundreds of MB.
    bitmap.close();
  }
}

/** Swap the extension for .jpg, since the bytes are now a JPEG whatever came in. */
function jpegName(name: string): string {
  const base = name.replace(/\.[^.]+$/, '') || 'image';
  return `${base}.jpg`;
}
