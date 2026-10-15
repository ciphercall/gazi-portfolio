import sharp from "sharp";

/**
 * Image intake for the admin panel.
 *
 * One place decides what an accepted upload is, so the API route only has to
 * orchestrate: declared MIME type AND the format sharp actually decodes must
 * both be on the allow list. Trusting the browser's `Content-Type` alone is how
 * a `.php` or a polyglot SVG ends up on the media volume; trusting the decoder
 * alone would let a mislabelled file through the CDN's content-type rules.
 */

/** Hard ceiling per file. Larger images are rejected, not silently downscaled. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Hard ceiling per request, so one drop of 400 photos cannot pin the CPU. */
export const MAX_FILES_PER_REQUEST = 20;

/** Fit-inside box. Never upscales — a 400px avatar stays 400px. */
export const MAX_DIMENSION = 1920;

export const WEBP_QUALITY = 80;

export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

/** The format names sharp reports in `metadata().format`. */
export const ALLOWED_SHARP_FORMATS = ["jpeg", "png", "webp", "avif"] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
export type AllowedSharpFormat = (typeof ALLOWED_SHARP_FORMATS)[number];

/** Thrown for every rejection, carrying the HTTP status the route should answer with. */
export class UploadRejected extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "UploadRejected";
    this.status = status;
  }
}

export function isAllowedMimeType(value: string): value is AllowedMimeType {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(value.toLowerCase());
}

function isAllowedFormat(value: string | undefined): value is AllowedSharpFormat {
  return typeof value === "string" && (ALLOWED_SHARP_FORMATS as readonly string[]).includes(value);
}

export interface InspectedImage {
  format: AllowedSharpFormat;
  width: number | null;
  height: number | null;
}

/**
 * Decode the bytes and report what they actually are.
 * Throws `UploadRejected(415)` when the decoder cannot make sense of them or the
 * decoded format is not on the allow list.
 */
export async function inspectImage(buffer: Buffer): Promise<InspectedImage> {
  let metadata: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    metadata = await sharp(buffer, { failOn: "error" }).metadata();
  } catch {
    throw new UploadRejected(
      "That file could not be decoded as an image. Upload a JPEG, PNG, WebP or AVIF.",
      415,
    );
  }

  if (!isAllowedFormat(metadata.format)) {
    throw new UploadRejected(
      `Decoded image format "${metadata.format ?? "unknown"}" is not supported. Use JPEG, PNG, WebP or AVIF.`,
      415,
    );
  }

  return {
    format: metadata.format,
    width: metadata.width ?? null,
    height: metadata.height ?? null,
  };
}

export interface ProcessedWebp {
  data: Buffer;
  /** Dimensions *after* EXIF rotation and the fit-inside resize. */
  width: number;
  height: number;
  bytes: number;
  /** The input format this was decoded from, for the response payload. */
  sourceFormat: AllowedSharpFormat;
}

/**
 * Re-encode to WebP: EXIF rotation applied, fitted inside 1920×1920 without
 * enlargement, quality 80. The output dimensions are the source of truth for
 * `ProjectImage.width/height`, so the public site never has to guess an aspect
 * ratio and shift layout when the image loads.
 */
export async function toWebp(buffer: Buffer): Promise<ProcessedWebp> {
  const inspected = await inspectImage(buffer);

  try {
    const { data, info } = await sharp(buffer, { failOn: "error" })
      // Honour the EXIF orientation tag, then drop it — the pixels are already rotated.
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer({ resolveWithObject: true });

    return {
      data,
      width: info.width,
      height: info.height,
      bytes: data.byteLength,
      sourceFormat: inspected.format,
    };
  } catch (error) {
    if (error instanceof UploadRejected) throw error;
    throw new UploadRejected("The image could not be converted to WebP.", 422);
  }
}
