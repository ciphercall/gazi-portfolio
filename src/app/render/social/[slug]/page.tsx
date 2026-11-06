import { readFile } from "node:fs/promises";
import path from "node:path";

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { verifyRenderToken } from "@/lib/crypto";
import { getProfile, getProjectBySlug } from "@/lib/queries";
import { resolveMediaAbsolutePath } from "@/lib/media/storage";
import { getEnv } from "@/lib/env";

/**
 * The card Chromium screenshots for a LinkedIn post.
 *
 * Not a public page: it is the raw 1200x627 artwork, so anyone who reached it
 * directly would see a crop of a design with no context. It is gated by the same
 * short-lived HMAC as the CV print surface.
 *
 * Styling is inline on purpose. This page is rendered by a browser that must not
 * depend on the site's cascade — one stylesheet change should never be able to
 * shift the artwork that was already published to LinkedIn.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Social card",
  robots: { index: false, follow: false },
};

const MIME_BY_EXTENSION: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".avif": "image/avif",
};

/** Inline the cover so the screenshot needs no network fetch for it. */
async function coverDataUrl(coverPath: string | null): Promise<string | null> {
  if (!coverPath || !coverPath.startsWith("/media/")) return null;
  try {
    const absolute = resolveMediaAbsolutePath(coverPath);
    const bytes = await readFile(absolute);
    const mime = MIME_BY_EXTENSION[path.extname(absolute).toLowerCase()] ?? "image/webp";
    return `data:${mime};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function SocialCardRenderPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const rawToken = query.token;
  if (!verifyRenderToken(typeof rawToken === "string" ? rawToken : null)) notFound();

  const { slug } = await params;
  const [project, profile] = await Promise.all([getProjectBySlug(slug), getProfile()]);
  if (!project) notFound();

  const cover = await coverDataUrl(project.coverPath);
  const env = getEnv();
  const author = profile?.fullName ?? env.SITE_NAME;
  const headline =
    profile?.headline ?? "Full-stack developer building production systems";
  const siteLabel = env.SITE_URL.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const chips = project.techStack.slice(0, 5);

  return (
    <div
      style={{
        position: "relative",
        width: 1200,
        height: 627,
        overflow: "hidden",
        background: "#060910",
        color: "#F8FAFC",
        fontFamily:
          'Inter, "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "52px 56px 44px",
        boxSizing: "border-box",
      }}
    >
      {/* Aurora field: the same three blooms the site uses, at card scale. */}
      <div
        style={{
          position: "absolute",
          inset: -160,
          background:
            "radial-gradient(circle at 12% 8%, rgba(23,199,183,0.30), transparent 42%)," +
            "radial-gradient(circle at 88% 12%, rgba(42,214,255,0.22), transparent 46%)," +
            "radial-gradient(circle at 62% 108%, rgba(163,126,225,0.26), transparent 48%)",
          filter: "blur(6px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(6,9,16,0) 40%, rgba(6,9,16,0.55) 100%)",
        }}
      />

      {/* Header: author identity + the label that says what this is. */}
      <header
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "#04121A",
            background: "linear-gradient(135deg, #17C7B7, #2AD6FF 55%, #A37EE1)",
            flexShrink: 0,
          }}
        >
          {initials(author)}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>{author}</div>
          <div
            style={{
              marginTop: 2,
              fontSize: 14,
              color: "#94A3B8",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 620,
            }}
          >
            {headline}
          </div>
        </div>

        <div
          style={{
            marginLeft: "auto",
            padding: "8px 16px",
            borderRadius: 999,
            border: "1px solid rgba(23,199,183,0.45)",
            background: "rgba(23,199,183,0.12)",
            color: "#17C7B7",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          Case study
        </div>
      </header>

      {/* Body: copy on the left, the product itself on the right. */}
      <main
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 44,
          flex: 1,
          paddingTop: 24,
        }}
      >
        <div style={{ flex: "1 1 0", minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontSize: project.title.length > 46 ? 40 : 48,
              lineHeight: 1.1,
              letterSpacing: "-0.035em",
              fontWeight: 600,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {project.title}
          </h1>

          <p
            style={{
              margin: "18px 0 0",
              fontSize: 19,
              lineHeight: 1.55,
              color: "#CBD5E1",
              display: "-webkit-box",
              WebkitLineClamp: 4,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {project.summary}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 24 }}>
            {chips.map((tech) => (
              <span
                key={tech}
                style={{
                  padding: "7px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.14)",
                  background: "rgba(255,255,255,0.05)",
                  fontSize: 13,
                  color: "#E2E8F0",
                  whiteSpace: "nowrap",
                }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            flex: "0 0 468px",
            height: 306,
            borderRadius: 20,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(11,18,32,0.85)",
            boxShadow: "0 30px 70px rgba(0,0,0,0.55)",
            display: "grid",
            placeItems: "center",
          }}
        >
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
            />
          ) : (
            <div
              style={{
                fontSize: 64,
                fontWeight: 600,
                letterSpacing: "-0.04em",
                background: "linear-gradient(135deg, #17C7B7, #2AD6FF 55%, #A37EE1)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {initials(project.title)}
            </div>
          )}
        </div>
      </main>

      {/* Footer: where to read the rest. */}
      <footer
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 12,
          paddingTop: 18,
          borderTop: "1px solid rgba(255,255,255,0.10)",
          fontSize: 14,
          color: "#94A3B8",
        }}
      >
        <span style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontSize: 12 }}>
          {siteLabel}
        </span>
        <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
        <span>{project.client ? `Built for ${project.client}` : "Independent work"}</span>
        <span
          style={{
            marginLeft: "auto",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            color: "#17C7B7",
            fontWeight: 500,
          }}
        >
          Read the full case study
          <span style={{ fontSize: 16 }}>→</span>
        </span>
      </footer>
    </div>
  );
}
