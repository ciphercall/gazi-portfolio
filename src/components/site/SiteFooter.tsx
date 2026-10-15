import Link from "next/link";
import { ArrowUp, MapPin } from "lucide-react";

import { BuildStamp } from "@/components/site/BuildStamp";
import { AvailabilityChip } from "@/components/site/AvailabilityChip";
import { ChannelIcon, contactChannels } from "@/components/site/contact-channels";
import { NAV_LINKS } from "@/components/site/nav-links";
import { AURORA_LINE } from "@/components/ui/aurora";
import type { ContactHandles, ContactLinks } from "@/components/site/contact-links";

/**
 * Site footer: identity, the section index, every contact channel, and the build
 * stamp — which is rendered by a client component so the commit hash is inlined
 * into the shipped JavaScript rather than read from the server at request time.
 */

export interface SiteFooterProps {
  fullName: string;
  headline: string;
  location: string;
  summary: string;
  handles: ContactHandles;
  links: ContactLinks;
}

export function SiteFooter({
  fullName,
  headline,
  location,
  summary,
  handles,
  links,
}: SiteFooterProps) {
  const channels = contactChannels(links, handles);
  const year = new Date().getFullYear();

  return (
    <footer className="no-print relative mt-24 border-t border-line">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ backgroundImage: AURORA_LINE }}
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1.1fr]">
          <div>
            <Link href="/" className="font-display text-lg font-semibold text-ink">
              {fullName}
            </Link>
            <p className="mt-1 text-sm text-muted">{headline}</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-faint">
              {summary.length > 220 ? `${summary.slice(0, 217).trimEnd()}…` : summary}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <AvailabilityChip />
              {location ? (
                <span className="pill text-muted">
                  <MapPin className="h-4 w-4 text-faint" aria-hidden="true" />
                  <span>{location}</span>
                </span>
              ) : null}
            </div>
          </div>

          <nav aria-label="Footer" className="text-sm">
            <h2 className="label-mono">Explore</h2>
            <ul className="mt-4 grid gap-1">
              {NAV_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group flex items-center gap-3 rounded-control px-2 py-2 text-muted transition hover:bg-panel hover:text-ink"
                    >
                      <Icon className="h-4 w-4 text-faint group-hover:text-teal" aria-hidden="true" />
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

          <div className="text-sm">
            <h2 className="label-mono">Elsewhere</h2>
            <ul className="mt-4 grid gap-1">
              {channels.map((channel) => (
                <li key={channel.key}>
                  <a
                    href={channel.href}
                    {...(channel.external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    className="group flex items-center gap-3 rounded-control px-2 py-2 text-muted transition hover:bg-panel hover:text-ink"
                  >
                    <ChannelIcon channel={channel} className="h-4 w-4 text-faint group-hover:text-teal" />
                    <span className="min-w-0">
                      <span className="block font-medium">{channel.label}</span>
                      <span className="block truncate text-xs text-faint">{channel.display}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {fullName}. Built with Next.js, Prisma and a lot of dark-mode pixels.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <BuildStamp />
            <Link
              href="#top"
              className="inline-flex items-center gap-2 text-faint transition hover:text-ink"
            >
              <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Back to top</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
