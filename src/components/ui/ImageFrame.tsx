import Image from "next/image";

import { auroraBackdrop, AURORA_VIGNETTE } from "@/components/ui/aurora";

/**
 * The one image slot used by the whole site.
 *
 * Two jobs:
 *   - render uploaded media (`/media/...`, served by nginx) through next/image so
 *     every slot is sized, lazy and responsive;
 *   - render something *designed* when there is no file yet. A portfolio that is
 *     still being filled in must not show broken frames, so the fallback is a
 *     deterministic gradient plate plus the subject's monogram, seeded from the
 *     slug — the same slot always looks the same.
 */

export interface ImageFrameProps {
  /** Media path from the database, or null when nothing was uploaded. */
  src?: string | null;
  /** Required: describes the subject, not the frame. */
  alt: string;
  /** Stable seed for the fallback artwork (slug, name, …). */
  seed: string;
  /** Human label used to derive the monogram and the plate caption. */
  label?: string;
  /** Small mono caption on the fallback plate, e.g. "Project". */
  kind?: string;
  /** Sizing belongs to the caller: `aspect-[16/10]`, `h-72`, … */
  className?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  roundedClassName?: string;
  imgClassName?: string;
}

const STOP_WORDS = new Set(["and", "the", "for", "with", "from", "into", "of", "a", "an"]);

function monogramFor(seed: string, label?: string): string {
  const source = (label ?? seed).replace(/[^A-Za-z0-9]+/g, " ").trim();
  const words = source
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word.toLowerCase()));

  const pool = words.length > 0 ? words : source.split(/\s+/).filter(Boolean);
  const first = pool[0] ?? "";
  const second = pool[1] ?? "";

  const letters = `${first.charAt(0) ?? ""}${
    second ? (second.charAt(0) ?? "") : (first.charAt(1) ?? "")
  }`;

  const upper = letters.toUpperCase();
  return upper || (seed.replace(/[^A-Za-z0-9]/g, "").charAt(0) || "·").toUpperCase();
}

export function ImageFrame({
  src,
  alt,
  seed,
  label,
  kind,
  className = "",
  sizes = "(min-width: 1024px) 50vw, 100vw",
  priority = false,
  quality = 82,
  roundedClassName = "rounded-card",
  imgClassName = "",
}: ImageFrameProps) {
  if (src) {
    return (
      <div
        className={`relative overflow-hidden bg-canvas-2 ${roundedClassName} ${className}`}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          quality={quality}
          priority={priority}
          unoptimized={src.startsWith("/media/")}
          className={`object-cover ${imgClassName}`}
        />
      </div>
    );
  }

  const backdrop = auroraBackdrop(seed);
  const monogram = monogramFor(seed, label);

  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative overflow-hidden border border-line bg-canvas-2 ${roundedClassName} ${className}`}
    >
      <div className="absolute inset-0" style={{ backgroundImage: backdrop.backgroundImage }} />
      <div className="grid-overlay opacity-70" aria-hidden />
      <div className="absolute inset-0" style={{ backgroundImage: AURORA_VIGNETTE }} aria-hidden />

      <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
        <span className="font-display text-5xl font-semibold tracking-tight text-ink/85 drop-shadow-[0_2px_18px_rgba(0,0,0,0.35)] sm:text-6xl">
          {monogram}
        </span>
      </div>

      {(kind || label) && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 py-3" aria-hidden>
          {kind ? <span className="label-mono">{kind}</span> : <span />}
          {label ? (
            <span className="max-w-[70%] truncate text-right text-xs font-medium text-muted">
              {label}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
