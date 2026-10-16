import { mkdir, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import { sha256 } from "@/lib/crypto";
import { getEnv } from "@/lib/env";
import { renderAtsCv } from "@/lib/pdf/ats";
import { renderDesignedCv } from "@/lib/pdf/designed";
import { getCvSource, getCvSourceHash, getGeneratedAsset, saveGeneratedAsset } from "@/lib/queries";
import type { CvSource } from "@/lib/queries";

/**
 * Contract for the generated CV assets, and the implementation behind it.
 *
 * Every generated file is a *cache* of the current content, not a document of
 * record: the fingerprint of everything both variants are built from is stored
 * next to the file, and a mismatch is the only reason to re-render. That is what
 * makes "the visitor always downloads an up-to-date CV" true rather than hoped
 * for — an admin edit changes the fingerprint, and the next download (or the
 * `after()` hook scheduled by the save) produces a new file.
 *
 * Three failure modes are handled explicitly, because each one has bitten a
 * pipeline like this before:
 *
 *   - Concurrent regeneration. An in-process promise map keyed by kind means two
 *     requests that both miss the cache share one Chromium launch instead of
 *     starting two. A DB re-read before rendering covers the case where another
 *     *process* just finished.
 *   - A failed render. The error is recorded on the row, the previous file (if
 *     any) is left untouched, and only an explicit `force` call re-throws —
 *     a visitor's download never turns a renderer failure into an error page
 *     when a usable file is already on disk.
 *   - A bad path. The final absolute path is resolved and asserted to be inside
 *     MEDIA_ROOT before anything is written.
 */

export type CvKind = "CV_DESIGNED" | "CV_ATS";

export interface CvAssetResult {
  kind: CvKind;
  /** Path on the media volume, e.g. "cv/gazi-monir-uz-zaman-cv.pdf". */
  path: string;
  bytes: number;
  sha256: string;
  /** Fingerprint of the CV content this file was rendered from. */
  sourceHash: string;
}

export interface EnsuredCvAsset extends CvAssetResult {
  absolutePath: string;
  /** Suggested download filename. */
  filename: string;
  /** True when the cached file was current and nothing was re-rendered. */
  cacheHit: boolean;
  /**
   * True when the file served is older than the current content — only possible
   * on the fallback path after a regeneration failure.
   */
  stale?: boolean;
}

export interface EnsureOptions {
  /** Regenerate even when the cached asset is already current. */
  force?: boolean;
}

export const CV_FILENAMES: Record<CvKind, string> = {
  CV_DESIGNED: "Gazi-Monir-Uz-Zaman-CV.pdf",
  CV_ATS: "Gazi-Monir-Uz-Zaman-CV-ATS.pdf",
};

export const CV_MEDIA_DIR = "cv";

/** URL slugs for the two variants, shared by the download route and both pages. */
export const CV_SLUGS: Record<CvKind, string> = {
  CV_DESIGNED: "designed",
  CV_ATS: "ats",
};

/** Both variants, in presentation order (the designed one is the headline act). */
export const CV_KINDS = Object.keys(CV_FILENAMES) as CvKind[];

/** "designed" → CV_DESIGNED. Returns null for anything else, so routes can 400. */
/**
 * Integrity check across cached CV assets.
 *
 * Returns the per-variant status and re-renders any asset whose recorded
 * content hash no longer matches the current source. Intended as the
 * entrypoint a (future) scheduled job or admin trigger can call; kept here so
 * it stays next to the generation code. Never throws for a single variant.
 */
export async function verifyGeneratedAssets(): Promise<{ kind: CvKind; valid: boolean }[]> {
  const currentHash = await getCvSourceHash();
  const results: { kind: CvKind; valid: boolean }[] = [];
  for (const kind of CV_KINDS) {
    const asset = await getGeneratedAsset(kind);
    const valid = Boolean(asset && asset.sourceHash === currentHash);
    if (!valid) {
      try {
        await ensureCvAsset(kind, { force: true });
      } catch (error) {
        console.error(`[cv] verification regeneration failed for ${kind}:`, error);
      }
    }
    results.push({ kind, valid });
  }
  return results;
}

export function cvKindFromSlug(slug: string): CvKind | null {
  const entry = (Object.entries(CV_SLUGS) as [CvKind, string][]).find(
    ([, value]) => value === slug,
  );
  return entry ? entry[0] : null;
}

/* --------------------------------------------------------------- filesystem --- */

function mediaRoot(): string {
  return path.resolve(getEnv().MEDIA_ROOT);
}

/** Path as stored in the database — always POSIX, so it is host independent. */
function relativePathFor(kind: CvKind): string {
  return path.posix.join(CV_MEDIA_DIR, CV_FILENAMES[kind]);
}

/**
 * Absolute path on the media volume, asserted to stay inside it.
 *
 * The filenames are constants, so this cannot currently fail — which is exactly
 * why the assertion belongs here, where a future caller passing a derived name
 * cannot quietly write into `/etc`.
 */
function absolutePathFor(kind: CvKind): string {
  const root = mediaRoot();
  const absolute = path.resolve(root, CV_MEDIA_DIR, CV_FILENAMES[kind]);
  const prefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (absolute !== root && !absolute.startsWith(prefix)) {
    throw new Error(`Refusing to write "${absolute}" outside MEDIA_ROOT ("${root}").`);
  }
  return absolute;
}

/** Size in bytes, or null when the file is missing or empty. */
async function fileSize(absolutePath: string): Promise<number | null> {
  try {
    const info = await stat(absolutePath);
    if (!info.isFile() || info.size === 0) return null;
    return info.size;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------ regeneration --- */

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * One in-flight render per kind. Two concurrent cache misses on the same variant
 * await the same promise; the entry is removed as soon as it settles, so the
 * next miss starts a fresh attempt.
 */
const inFlight = new Map<CvKind, Promise<EnsuredCvAsset>>();

function withKindLock(
  kind: CvKind,
  task: () => Promise<EnsuredCvAsset>,
): Promise<EnsuredCvAsset> {
  const running = inFlight.get(kind);
  if (running) return running;
  const started = task().finally(() => {
    inFlight.delete(kind);
  });
  inFlight.set(kind, started);
  return started;
}

/** The cached file, if it is current. Anything else returns null. */
async function readCurrent(kind: CvKind, sourceHash: string): Promise<EnsuredCvAsset | null> {
  const relativePath = relativePathFor(kind);
  const absolutePath = absolutePathFor(kind);

  const row = await getGeneratedAsset(kind);
  if (!row || row.sourceHash !== sourceHash || row.path !== relativePath) return null;

  const bytes = await fileSize(absolutePath);
  if (bytes === null) return null;

  return {
    kind,
    path: relativePath,
    bytes,
    sha256: row.sha256,
    sourceHash,
    absolutePath,
    filename: CV_FILENAMES[kind],
    cacheHit: true,
  };
}

/**
 * The file on disk regardless of age — the last resort after a failed render.
 * `cacheHit` stays false because nothing was re-rendered; `stale` says whether
 * the served content is behind the database.
 */
async function readExisting(kind: CvKind, sourceHash: string): Promise<EnsuredCvAsset | null> {
  const absolutePath = absolutePathFor(kind);
  const bytes = await fileSize(absolutePath);
  if (bytes === null) return null;

  const row = await getGeneratedAsset(kind).catch(() => null);
  return {
    kind,
    path: relativePathFor(kind),
    bytes,
    sha256: row?.sha256 ?? "",
    sourceHash: row?.sourceHash ?? sourceHash,
    absolutePath,
    filename: CV_FILENAMES[kind],
    cacheHit: false,
    stale: row?.sourceHash !== sourceHash,
  };
}

/** Render one variant and write it to the media volume. */
async function produce(
  kind: CvKind,
  source: CvSource,
  sourceHash: string,
): Promise<CvAssetResult> {
  const buffer = kind === "CV_DESIGNED" ? await renderDesignedCv() : await renderAtsCv(source);
  if (buffer.byteLength === 0) {
    throw new Error(`The ${kind} renderer returned an empty document.`);
  }

  const absolutePath = absolutePathFor(kind);
  await mkdir(path.dirname(absolutePath), { recursive: true });

  // Sibling temp file + rename: a concurrent download can never observe a
  // half-written PDF, only the previous complete one.
  const tempPath = `${absolutePath}.${process.pid}.tmp`;
  await writeFile(tempPath, buffer);
  await rename(tempPath, absolutePath);

  const digest = sha256(buffer);
  const relativePath = relativePathFor(kind);
  const result: CvAssetResult = {
    kind,
    path: relativePath,
    bytes: buffer.byteLength,
    sha256: digest,
    sourceHash,
  };

  await saveGeneratedAsset({ ...result, error: null });
  return result;
}

/**
 * Record the failure on the row while keeping the last known-good metadata, so
 * the admin panel can show both "what is downloadable" and "what went wrong".
 */
async function recordFailure(kind: CvKind, message: string, sourceHash: string): Promise<void> {
  const previous = await getGeneratedAsset(kind);
  await saveGeneratedAsset({
    kind,
    path: previous?.path ?? relativePathFor(kind),
    bytes: previous?.bytes ?? 0,
    sha256: previous?.sha256 ?? "",
    sourceHash: previous?.sourceHash ?? sourceHash,
    error: message,
  });
}

/* ----------------------------------------------------------------- exports --- */

/**
 * Render both variants and record them. Called from `after()` on every content
 * mutation; must be safe to call concurrently and must not throw for a single
 * failed variant (record the failure and continue).
 *
 * Sequenced rather than parallel: one Chromium at a time keeps the memory
 * footprint of a regenerating container predictable, and the ATS variant is
 * milliseconds anyway.
 */
export async function regenerateAllCvAssets(options?: { force?: boolean }): Promise<CvAssetResult[]> {
  const results: CvAssetResult[] = [];

  for (const kind of CV_KINDS) {
    try {
      const ensured = await ensureCvAsset(kind, { force: options?.force });
      results.push({
        kind: ensured.kind,
        path: ensured.path,
        bytes: ensured.bytes,
        sha256: ensured.sha256,
        sourceHash: ensured.sourceHash,
      });
    } catch (error) {
      // Swallowed by contract: an admin save must never fail because a PDF did.
      console.error(`[cv] ${kind} regeneration failed:`, error);
    }
  }

  return results;
}

/**
 * Return a usable file for `kind`, regenerating only when the cached copy is
 * missing or its `sourceHash` no longer matches the current content.
 *
 * On a cache miss this renders inline — the documented fallback that keeps a
 * first visitor from waiting on a background job. `force` (the admin button) is
 * the only path that rejects on failure; the visitor path degrades to the
 * previous file when one exists.
 */
export async function ensureCvAsset(
  kind: CvKind,
  options?: EnsureOptions,
): Promise<EnsuredCvAsset> {
  const force = options?.force === true;
  const sourceHash = await getCvSourceHash();

  if (!force) {
    const current = await readCurrent(kind, sourceHash);
    if (current) return current;

    // Re-read after the hash round-trip: another process (or the `after()` hook
    // a save just scheduled) may have produced a current file while this request
    // was reading content. Checking again here is far cheaper than a Chromium
    // launch that would duplicate its work.
    const raced = await readCurrent(kind, sourceHash);
    if (raced) return raced;
  }

  return withKindLock(kind, async () => {
    if (!force) {
      const locked = await readCurrent(kind, sourceHash);
      if (locked) return locked;
    }

    try {
      const source = await getCvSource();
      const result = await produce(kind, source, sourceHash);
      return {
        ...result,
        absolutePath: absolutePathFor(kind),
        filename: CV_FILENAMES[kind],
        cacheHit: false,
      };
    } catch (error) {
      await recordFailure(kind, errorMessage(error), sourceHash).catch(() => undefined);

      if (force) throw error;

      const fallback = await readExisting(kind, sourceHash);
      if (fallback) return fallback;

      // Nothing has ever been produced, so there is nothing to serve.
      throw error;
    }
  });
}
