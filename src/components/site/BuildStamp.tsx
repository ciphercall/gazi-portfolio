"use client";

/**
 * Build provenance, rendered in the footer.
 *
 * `process.env.NEXT_PUBLIC_GIT_SHA` is read at MODULE SCOPE on purpose: Next
 * inlines `NEXT_PUBLIC_*` values into the client bundle by textual replacement,
 * so keeping the expression at the top level guarantees the stamp a visitor sees
 * is baked into the shipped JavaScript. The deploy verification greps the built
 * bundle for exactly this value.
 */

const BUILD_SHA = (process.env.NEXT_PUBLIC_GIT_SHA ?? "").trim();

function shortSha(sha: string): string {
  if (!sha || sha === "unknown") return "unknown";
  return sha.length > 12 ? sha.slice(0, 12) : sha;
}

export function BuildStamp({ className = "" }: { className?: string }) {
  const sha = shortSha(BUILD_SHA);

  return (
    <span className={`label-mono ${className}`} data-build-sha={BUILD_SHA || "unknown"}>
      build {sha}
    </span>
  );
}
