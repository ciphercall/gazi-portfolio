import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { getEnv } from "@/lib/env";

/**
 * Where media files live, and the only code allowed to build that path.
 *
 * Two rules make this safe:
 *   1. The subfolder comes from an allow list, never from the request body.
 *   2. The filename is a server-generated UUID. No part of the client's filename,
 *      and no client-supplied path, ever reaches the filesystem — which removes
 *      path traversal as a category rather than trying to sanitise it.
 *
 * The public URL is always `<MEDIA_URL_PREFIX>/<relative path>`; nginx serves the
 * volume directly, so the stored value is the URL, not an OS path.
 */

export const MEDIA_URL_PREFIX = "/media";

export const MEDIA_SUBFOLDERS = ["projects", "profile", "gallery"] as const;
export type MediaSubfolder = (typeof MEDIA_SUBFOLDERS)[number];

export function isMediaSubfolder(value: string): value is MediaSubfolder {
  return (MEDIA_SUBFOLDERS as readonly string[]).includes(value);
}

/** Absolute root of the media volume, e.g. `/srv/media`. */
export function mediaRoot(): string {
  return path.resolve(getEnv().MEDIA_ROOT);
}

/** `<subfolder>/<YYYY>/<MM>/<uuid>.webp` — relative to MEDIA_ROOT. */
export function buildMediaRelativePath(
  subfolder: MediaSubfolder,
  extension = "webp",
  now: Date = new Date(),
): { relativePath: string; filename: string } {
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const filename = `${randomUUID()}.${extension}`;
  return { relativePath: path.posix.join(subfolder, year, month, filename), filename };
}

/**
 * Resolve a relative media path to an absolute one, refusing anything that
 * escapes MEDIA_ROOT. The `path.relative` check is the belt; the explicit prefix
 * check on the input is the braces.
 */
export function resolveMediaAbsolutePath(relativePath: string): string {
  const root = mediaRoot();
  const cleaned = relativePath
    .replace(/\\/g, "/")
    .replace(new RegExp(`^${MEDIA_URL_PREFIX}/`), "")
    .replace(/^\/+/, "");

  if (cleaned.includes("\0")) {
    throw new Error("Refusing a media path containing a null byte.");
  }

  const absolute = path.resolve(root, cleaned);
  const relativeToRoot = path.relative(root, absolute);

  if (relativeToRoot === "" || relativeToRoot.startsWith("..") || path.isAbsolute(relativeToRoot)) {
    throw new Error(`Refusing to write outside MEDIA_ROOT: ${relativePath}`);
  }

  return absolute;
}

/** Relative media path → public URL (`/media/projects/2026/02/<uuid>.webp`). */
export function toMediaUrl(relativePath: string): string {
  const cleaned = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${MEDIA_URL_PREFIX}/${cleaned}`;
}

/** A stored value (`/media/...`) or a bare relative path → relative path. */
export function toRelativeMediaPath(storedValue: string): string {
  return storedValue
    .replace(/\\/g, "/")
    .replace(new RegExp(`^${MEDIA_URL_PREFIX}/`), "")
    .replace(/^\/+/, "");
}

export interface StoredMediaFile {
  relativePath: string;
  absolutePath: string;
  url: string;
}

/**
 * Write bytes to the media volume, creating the dated folders first.
 * Uses the exclusive `wx` flag: a UUID collision is a bug, and silently
 * overwriting a stranger's file would hide it.
 */
export async function storeMediaFile(relativePath: string, data: Buffer): Promise<StoredMediaFile> {
  const absolutePath = resolveMediaAbsolutePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, data, { flag: "wx" });

  return {
    relativePath,
    absolutePath,
    url: toMediaUrl(relativePath),
  };
}

/** True when the value is one of ours — used to sanity-check paths before storing them. */
export function isManagedMediaUrl(value: string): boolean {
  return value.startsWith(`${MEDIA_URL_PREFIX}/`) && !value.includes("..") && !value.includes("\0");
}
