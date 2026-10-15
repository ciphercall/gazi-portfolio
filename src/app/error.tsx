"use client";

import { useEffect } from "react";
import { Home, LifeBuoy, RefreshCw, TriangleAlert } from "lucide-react";

import { ActionLink } from "@/components/ui/ActionLink";

/**
 * Route-level error boundary.
 *
 * Rendered by React when a page or the public layout throws — most likely
 * because the database is unreachable. It says so, offers the two things a
 * visitor can actually do (retry, or go home), and prints the Next.js digest so
 * the failure can be found in the server logs. It sits outside the `(public)`
 * group, so it renders standalone and must be complete on its own.
 */

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[site] render failed:", error);
  }, [error]);

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
      <div className="aurora-mesh" aria-hidden="true" />
      <div className="grid-overlay" aria-hidden="true" />

      <div className="glass hairline relative z-10 w-full max-w-2xl p-8 sm:p-10">
        <p className="label-mono">Something went wrong</p>
        <h1 className="mt-3 text-title font-semibold">
          The page could not <span className="text-aurora">load its content</span>
        </h1>

        <p className="mt-5 flex items-start gap-3 text-muted">
          <TriangleAlert className="mt-1 h-5 w-5 shrink-0 text-rose" aria-hidden="true" />
          <span>
            This is almost always temporary — the portfolio reads its content from a database, and
            that read just failed. Nothing was lost, and the rest of the site is still there.
          </span>
        </p>

        <p className="mt-4 flex items-start gap-3 text-sm text-faint">
          <LifeBuoy className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            If it keeps happening, mention the reference below.
            {error.digest ? (
              <span className="ml-1 font-mono text-faint">reference: {error.digest}</span>
            ) : null}
          </span>
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-on-accent shadow-glow transition duration-300 ease-aurora hover:-translate-y-0.5"
            style={{
              backgroundImage: "linear-gradient(100deg, var(--c-teal), var(--c-cyan) 45%, var(--c-violet))",
            }}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span>Try again</span>
          </button>
          <ActionLink href="/" icon={<Home className="h-4 w-4" />}>
            Back to the homepage
          </ActionLink>
        </div>
      </div>
    </main>
  );
}
