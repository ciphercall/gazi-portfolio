import Link from "next/link";
import { Home, Mail, SearchX } from "lucide-react";

import { ActionLink } from "@/components/ui/ActionLink";
import { NAV_LINKS } from "@/components/site/nav-links";
import { SITE_NAME } from "@/lib/seo";

/**
 * 404.
 *
 * This file sits outside the `(public)` group, so it may be rendered without the
 * site header and footer — which is why it carries its own brand mark and a
 * complete list of ways back into the site rather than a single "go home" line.
 * The response is already a real 404, so no robots metadata is needed here.
 */

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-16 sm:px-6">
      <div className="aurora-mesh" aria-hidden="true" />
      <div className="grid-overlay" aria-hidden="true" />

      <div className="glass hairline relative z-10 w-full max-w-2xl p-8 sm:p-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-ink">
          <Home className="h-4 w-4" aria-hidden="true" />
          <span>{SITE_NAME}</span>
        </Link>

        <p className="label-mono mt-8">Error 404</p>
        <h1 className="mt-3 text-display font-semibold">
          This page has <span className="text-aurora">moved on</span>
        </h1>

        <p className="mt-5 flex items-start gap-3 text-muted">
          <SearchX className="mt-1 h-5 w-5 shrink-0 text-teal" aria-hidden="true" />
          <span>
            The address you followed does not exist here. It may have been renamed, or the link that
            brought you here may be out of date. Every section of the site is one click away below.
          </span>
        </p>

        <nav aria-label="Site sections" className="mt-8">
          <ul className="grid gap-2 sm:grid-cols-2">
            {NAV_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-control border border-line bg-panel px-3 py-2.5 text-sm text-muted transition hover:border-line-strong hover:text-ink"
                  >
                    <Icon className="h-4 w-4 text-faint" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block font-medium">{item.label}</span>
                      <span className="block text-xs text-faint">{item.blurb}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ActionLink href="/" variant="primary" icon={<Home className="h-4 w-4" />}>
            Back to the homepage
          </ActionLink>
          <ActionLink href="/contact" icon={<Mail className="h-4 w-4" />}>
            Contact me
          </ActionLink>
        </div>
      </div>
    </main>
  );
}
