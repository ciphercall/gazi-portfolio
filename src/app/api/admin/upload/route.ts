import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/auth";
import {
  MAX_FILES_PER_REQUEST,
  MAX_UPLOAD_BYTES,
  UploadRejected,
  isAllowedMimeType,
  toWebp,
} from "@/lib/media/webp";
import {
  buildMediaRelativePath,
  isMediaSubfolder,
  storeMediaFile,
} from "@/lib/media/storage";
import type { UploadedImage } from "@/lib/admin/types";

/**
 * Admin image intake.
 *
 * Contract:
 *   POST multipart/form-data
 *     subfolder = "projects" | "profile" | "gallery"   (allow list — anything else is rejected)
 *     files     = one or more images (repeat the field)
 *   → { ok: true, files: [{ path, width, height, bytes }] }
 *
 * Every accepted file becomes a WebP at
 *   ${MEDIA_ROOT}/<subfolder>/<YYYY>/<MM>/<uuid>.webp
 * and the returned `path` is the public URL (`/media/...`) that the record
 * stores. Neither the client's filename nor any client-supplied path is ever
 * used to build a filesystem location.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Sharp on a 10 MB image is sub-second, but a 20-file batch is not. */
export const maxDuration = 60;

function unauthorized(): NextResponse {
  return NextResponse.json(
    { ok: false, message: "Admin session required." },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  // Defence in depth: `middleware.ts` already refused an unauthenticated caller,
  // but a route that is reachable if the matcher is ever wrong must check too.
  // The API variant is used rather than `requireAdmin()` because that helper
  // *redirects* — a JSON endpoint has to answer 401 instead.
  const session = await requireAdminApi();
  if (!session) return unauthorized();

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, message: "Send the images as multipart/form-data." },
      { status: 400 },
    );
  }

  const subfolderValue = form.get("subfolder");
  if (typeof subfolderValue !== "string" || !isMediaSubfolder(subfolderValue)) {
    return NextResponse.json(
      {
        ok: false,
        message: 'The "subfolder" field must be one of: projects, profile, gallery.',
      },
      { status: 422 },
    );
  }
  const subfolder = subfolderValue;

  const entries = [...form.getAll("files"), ...form.getAll("file")];
  const files = entries.filter((entry): entry is File => typeof entry !== "string");

  if (files.length === 0) {
    return NextResponse.json(
      { ok: false, message: "Choose at least one image to upload." },
      { status: 400 },
    );
  }

  if (files.length > MAX_FILES_PER_REQUEST) {
    return NextResponse.json(
      {
        ok: false,
        message: `Upload at most ${MAX_FILES_PER_REQUEST} images per request (you sent ${files.length}).`,
      },
      { status: 413 },
    );
  }

  const uploaded: UploadedImage[] = [];

  for (const file of files) {
    try {
      if (file.size === 0) {
        throw new UploadRejected("One of the selected files is empty.", 415);
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        throw new UploadRejected(
          "Each image must be 10 MB or smaller.",
          413,
        );
      }

      // Check 1: what the browser claims this is.
      if (!isAllowedMimeType(file.type)) {
        throw new UploadRejected(
          `"${file.type || "unknown"}" is not an accepted image type. Use JPEG, PNG, WebP or AVIF.`,
          415,
        );
      }

      // Check 2: what the bytes actually decode to — inside `toWebp()`, which
      // also applies the EXIF rotation and the 1920 box before encoding WebP 80.
      const buffer = Buffer.from(await file.arrayBuffer());
      const processed = await toWebp(buffer);

      const { relativePath } = buildMediaRelativePath(subfolder);
      const stored = await storeMediaFile(relativePath, processed.data);

      uploaded.push({
        path: stored.url,
        width: processed.width,
        height: processed.height,
        bytes: processed.bytes,
      });
    } catch (error) {
      if (error instanceof UploadRejected) {
        // Fail the batch, but hand back what already landed so the caller is not
        // left guessing whether anything was written.
        return NextResponse.json(
          { ok: false, message: error.message, files: uploaded },
          { status: error.status },
        );
      }

      console.error("[admin] upload failed:", error);
      return NextResponse.json(
        { ok: false, message: "The image could not be stored on the media volume.", files: uploaded },
        { status: 500 },
      );
    }
  }

  const first = uploaded[0];

  return NextResponse.json(
    {
      ok: true,
      message: uploaded.length === 1 ? "Image uploaded." : `${uploaded.length} images uploaded.`,
      files: uploaded,
      // Single-file callers (the avatar and cover pickers) read these directly.
      ...(uploaded.length === 1 && first
        ? { path: first.path, width: first.width, height: first.height, bytes: first.bytes }
        : {}),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
