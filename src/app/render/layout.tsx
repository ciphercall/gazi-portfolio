import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CV render surface",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Layout for the internal print surfaces.
 *
 * These routes exist for one reason: Chromium has to load the CV as a real page
 * of this application to print it. They are token gated individually, marked
 * `noindex` through the response headers in `next.config.ts` *and* here, and
 * they render nothing from the site chrome — no nav, no footer, no client
 * JavaScript beyond what Next itself injects.
 */
export default function RenderLayout({ children }: { children: React.ReactNode }) {
  return <div className="cv-render-root">{children}</div>;
}
