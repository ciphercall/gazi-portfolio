import { readFile } from "node:fs/promises";

import sharp from "sharp";

import { resolveMediaAbsolutePath } from "@/lib/media/storage";

/**
 * The profile portrait, embedded into a PDF.
 *
 * `/media/*` is served by nginx off the shared volume, not by the Next app, so a
 * print surface loaded over `http://127.0.0.1:$PORT` cannot fetch the avatar by
 * URL — the image would simply be missing from the PDF. Reading the file from
 * the volume and inlining it as a data URI keeps the render hermetic: no network
 * hop, no auth, identical bytes on every host.
 *
 * Always square-cropped and re-encoded at a fixed size so the layout cannot move
 * because someone uploaded a 6000px photo. A missing or unreadable avatar
 * returns `null`; the caller falls back to a monogram, never a broken image.
 */

const MAX_SOURCE_BYTES = 12 * 1024 * 1024;

export async function loadAvatarDataUri(
  avatarPath: string | null,
  size = 720,
): Promise<string | null> {
  if (!avatarPath) return null;

  try {
    const absolute = resolveMediaAbsolutePath(avatarPath);
    const source = await readFile(absolute);
    if (source.byteLength === 0 || source.byteLength > MAX_SOURCE_BYTES) return null;

    const pixels = await sharp(source)
      .rotate()
      .resize(size, size, { fit: "cover", position: "attention" })
      .jpeg({ quality: 88 })
      .toBuffer();

    return `data:image/jpeg;base64,${pixels.toString("base64")}`;
  } catch (error) {
    // A CV must still print when the stored portrait has gone missing.
    console.warn(`[cv] avatar could not be embedded (${avatarPath}):`, error);
    return null;
  }
}
