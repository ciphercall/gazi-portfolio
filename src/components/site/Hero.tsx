import Link from "next/link";
import { ArrowDown, ArrowRight, Download, Mail, MapPin } from "lucide-react";

import { ActionLink } from "@/components/ui/ActionLink";
import { Chip } from "@/components/ui/Chip";
import { AvailabilityChip } from "@/components/site/AvailabilityChip";
import { CV_PATH } from "@/components/site/contact-links";

/**
 * The hero.
 *
 * No client JavaScript at all: the staged entrance is the CSS `animate-rise`
 * keyframe with per-element delays, which the global reduced-motion block turns
 * off by itself. The aurora mesh and the grid are decorative layers behind the
 * copy and are hidden from assistive tech.
 */

export interface HeroCurrentRole {
  title: string;
  company: string;
  slug: string;
}

export interface HeroProps {
  fullName: string;
  headline: string;
  subheadline: string;
  location: string;
  currentRoles: HeroCurrentRole[];
}

const rise = (ms: number) => ({ animationDelay: `${ms}ms` });

export function Hero({
  fullName,
  headline,
  subheadline,
  location,
  currentRoles,
}: HeroProps) {
  const parts = fullName.split(/\s+/).filter(Boolean);
  const firstWord = parts[0] ?? fullName;
  const remaining = parts.slice(1).join(" ");

  return (
    <section className="relative isolate flex min-h-[88svh] items-center overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pb-24">
      <div className="aurora-mesh" aria-hidden="true" />
      <div className="grid-overlay" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
        style={{ backgroundImage: "linear-gradient(to bottom, transparent, var(--c-canvas))" }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-14 lg:grid-cols-[1.45fr_0.75fr] lg:items-center">
        <div>
          <div className="animate-rise" style={rise(40)}>
            <AvailabilityChip />
          </div>

          <h1
            className="animate-rise mt-7 text-display font-semibold text-ink"
            style={rise(120)}
          >
            <span className="text-aurora">{firstWord}</span>
            {remaining ? <span> {remaining}</span> : null}
          </h1>

          <p
            className="animate-rise mt-6 max-w-2xl font-display text-xl font-medium leading-snug text-ink/90 sm:text-2xl"
            style={rise(200)}
          >
            {headline}
          </p>

          {subheadline ? (
            <p
              className="animate-rise mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
              style={rise(260)}
            >
              {subheadline}
            </p>
          ) : null}

          {location ? (
            <div className="animate-rise mt-6" style={rise(320)}>
              <Chip icon={<MapPin className="h-3.5 w-3.5" />} tone="outline">
                {location}
              </Chip>
            </div>
          ) : null}

          <div
            className="animate-rise mt-9 flex flex-wrap items-center gap-3"
            style={rise(380)}
          >
            <ActionLink
              href="/projects"
              variant="primary"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              View projects
            </ActionLink>
            <ActionLink href={CV_PATH} icon={<Download className="h-4 w-4" />}>
              Download CV
            </ActionLink>
            <ActionLink href="/contact" icon={<Mail className="h-4 w-4" />}>
              Contact me
            </ActionLink>
          </div>

          <div className="animate-rise mt-12" style={rise(460)}>
            <a
              href="#about"
              className="inline-flex items-center gap-2 text-xs font-medium text-faint transition hover:text-ink"
            >
              <ArrowDown className="h-4 w-4 animate-bounce" aria-hidden="true" />
              <span>Scroll for the details</span>
            </a>
          </div>
        </div>

        {currentRoles.length > 0 ? (
          <aside
            className="animate-rise glass hairline p-6"
            style={rise(300)}
            aria-label="Current roles"
          >
            <p className="label-mono">Currently</p>
            <ul className="mt-4 grid gap-4">
              {currentRoles.map((role) => (
                <li key={role.slug} className="border-b border-line pb-4 last:border-b-0 last:pb-0">
                  <p className="font-display text-base font-semibold text-ink">{role.title}</p>
                  <p className="mt-0.5 text-sm text-muted">{role.company}</p>
                </li>
              ))}
            </ul>
            <Link
              href="/experience"
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-teal transition hover:text-cyan"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              <span>See the full timeline</span>
            </Link>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
