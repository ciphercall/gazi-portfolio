import { ExternalLink, RefreshCw } from "lucide-react";

import { requireAdmin } from "@/lib/auth";
import { touchContent } from "@/lib/cache";
import { CV_FILENAMES, CV_SLUGS, regenerateAllCvAssets } from "@/lib/pdf/assets";
import { getCvSourceHash, getGeneratedAsset } from "@/lib/queries";
import type { CvKind } from "@/lib/pdf/assets";

/**
 * Admin view of the generated CV assets.
 *
 * A cached PDF is invisible by nature: it is either right or subtly out of date,
 * and nobody can tell by looking at it. This page makes the state observable —
 * when each variant was rendered, how big it is, which content fingerprint it was
 * built from, and whether that fingerprint still matches the database. The
 * "Regenerate now" action forces both variants through the renderer and then
 * calls `touchContent()`, so the public pages revalidate as well.
 */

export const dynamic = "force-dynamic";

interface VariantView {
  kind: CvKind;
  slug: string;
  label: string;
  blurb: string;
}

const VARIANTS: VariantView[] = [
  {
    kind: "CV_DESIGNED",
    slug: CV_SLUGS.CV_DESIGNED,
    label: "Designed edition",
    blurb: "Chromium print of /render/cv/designed — the colour document.",
  },
  {
    kind: "CV_ATS",
    slug: CV_SLUGS.CV_ATS,
    label: "ATS edition",
    blurb: "@react-pdf/renderer, Helvetica, one column of real text.",
  },
];

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function formatMoment(value: Date | null | undefined): string {
  if (!value) return "never";
  return `${new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(value)} UTC`;
}

function Hash({ value, label }: { value: string; label: string }) {
  if (!value) {
    return <span className="text-faint">— no {label} recorded</span>;
  }
  return (
    <span className="font-mono text-xs text-muted" title={value}>
      {label}: {value.slice(0, 16)}…
    </span>
  );
}

export default async function AdminCvPage() {
  await requireAdmin();

  /**
   * Force both variants through the renderer, then let `touchContent()` revalidate
   * the public tree and schedule the (now no-op) background pass. A failure is
   * recorded on the asset row by `ensureCvAsset` and surfaces in the cards below
   * on the re-render — which is why the action itself returns nothing.
   */
  async function regenerateNow() {
    "use server";
    await requireAdmin();
    await regenerateAllCvAssets({ force: true });
    touchContent();
  }

  const [designed, ats, liveHash] = await Promise.all([
    getGeneratedAsset("CV_DESIGNED"),
    getGeneratedAsset("CV_ATS"),
    getCvSourceHash(),
  ]);

  const rows: Record<CvKind, typeof designed> = {
    CV_DESIGNED: designed,
    CV_ATS: ats,
  };

  const staleCount = VARIANTS.filter((variant) => {
    const row = rows[variant.kind];
    return !row || row.sourceHash !== liveHash;
  }).length;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="label-mono">Admin · assets</p>
          <h1 className="mt-3 text-title font-semibold text-ink">CV PDFs</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Both variants are cached on the media volume and re-rendered only when the content
            fingerprint changes. A stale fingerprint is the signal that a download would be
            out of date.
          </p>
        </div>

        <form action={regenerateNow}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-control border border-line-strong bg-panel px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-teal hover:bg-panel-strong"
          >
            <RefreshCw className="size-4 text-teal" aria-hidden />
            Regenerate now
          </button>
        </form>
      </header>

      <section className="glass mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 p-5">
        <Hash value={liveHash} label="live sourceHash" />
        <span className="text-xs text-muted">
          {staleCount === 0
            ? "Both variants match the current content."
            : `${staleCount} of ${VARIANTS.length} variants ${staleCount === 1 ? "is" : "are"} stale.`}
        </span>
        <a className="pill ml-auto" href="/cv" target="_blank" rel="noreferrer">
          <ExternalLink className="size-3.5" aria-hidden />
          Public download page
        </a>
      </section>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {VARIANTS.map((variant) => {
          const row = rows[variant.kind];
          const stale = !row || row.sourceHash !== liveHash;

          return (
            <article key={variant.kind} className="glass hairline flex flex-col p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold text-ink">{variant.label}</h2>
                <span
                  className={
                    stale
                      ? "rounded-full border border-rose/40 bg-rose/10 px-3 py-1 text-xs text-rose"
                      : "rounded-full border border-teal/40 bg-teal/10 px-3 py-1 text-xs text-teal"
                  }
                >
                  {stale ? "stale" : "current"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted">{variant.blurb}</p>

              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="label-mono">Generated</dt>
                  <dd className="mt-1 text-muted">{formatMoment(row?.generatedAt ?? null)}</dd>
                </div>
                <div>
                  <dt className="label-mono">Size</dt>
                  <dd className="mt-1 text-muted">{formatBytes(row?.bytes ?? 0)}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="label-mono">File</dt>
                  <dd className="mt-1 font-mono text-xs text-muted">
                    {row?.path ?? `cv/${CV_FILENAMES[variant.kind]}`}
                  </dd>
                </div>
                <div className="col-span-2 space-y-1">
                  <p>
                    <Hash value={row?.sourceHash ?? ""} label="sourceHash" />
                  </p>
                  <p>
                    <Hash value={row?.sha256 ?? ""} label="sha256" />
                  </p>
                </div>
              </dl>

              {row?.error ? (
                <p className="mt-4 rounded-control border border-rose/35 bg-rose/10 p-3 text-xs leading-relaxed text-rose">
                  Last regeneration failed: {row.error}
                </p>
              ) : null}

              <div className="mt-auto flex flex-wrap gap-3 pt-6">
                <a
                  className="pill"
                  href={`/api/cv/${variant.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink className="size-3.5" aria-hidden />
                  Download
                </a>
                <a
                  className="pill"
                  href={`/api/cv/${variant.slug}?inline=1`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Preview inline
                </a>
                <a
                  className="pill"
                  href={`/render/cv/${variant.slug}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Render surface (404 without a token)
                </a>
              </div>
            </article>
          );
        })}
      </div>

      <section className="mt-10">
        <h2 className="label-mono">Inline preview · designed edition</h2>
        <div className="glass mt-3 overflow-hidden p-1.5">
          {/* Same-origin iframe: the route sends `Content-Disposition: inline` for
              ?inline=1, so the browser renders the PDF instead of downloading it. */}
          <iframe
            src="/api/cv/designed?inline=1"
            title="Designed CV preview"
            className="h-[72vh] w-full rounded-[14px] border border-line bg-white"
          />
        </div>
        <p className="mt-3 text-xs text-muted">
          The preview is served by the same endpoint a visitor downloads from — if this looks
          right, the download is right.
        </p>
      </section>
    </div>
  );
}
